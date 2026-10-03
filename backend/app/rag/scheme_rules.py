"""
JSON-driven scheme rules.

Eligibility, filtering, and RAG context are derived from healthcare_schemes.json
(age group, income, beneficiaries, documents, covered conditions, exclusions)
instead of hardcoded scheme_id branches.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple


def _blob(scheme: Dict[str, Any]) -> str:
    ec = scheme.get("eligibility_criteria") or {}
    parts = [
        scheme.get("scheme_id", ""),
        scheme.get("scheme_name", ""),
        scheme.get("department", ""),
        scheme.get("state", ""),
        scheme.get("benefits_summary", ""),
        scheme.get("coverage_amount_inr", ""),
        ec.get("age_group", ""),
        ec.get("income_limit_per_annum_inr", ""),
        ec.get("bpl_or_secc_required", ""),
        ec.get("target_beneficiaries", ""),
        " ".join(ec.get("required_documents") or []),
        " ".join(scheme.get("key_covered_conditions") or []),
        " ".join(scheme.get("key_exclusions") or []),
        " ".join(scheme.get("chunks") or []),
    ]
    return " ".join(str(p) for p in parts if p).lower()


def is_tn_scheme(scheme: Dict[str, Any]) -> bool:
    sid = str(scheme.get("scheme_id") or "")
    state = str(scheme.get("state") or "")
    return sid.startswith("scheme_TN") or "Tamil Nadu" in state or scheme.get("category") == "State Government"


def parse_age_bounds(age_group: str) -> Tuple[Optional[int], Optional[int]]:
    t = (age_group or "").lower()
    if not t or "all ages" in t:
        return None, None
    if "newborn" in t:
        return 0, 1
    if any(w in t for w in ["pregnant", "lactating", "maternity"]):
        return None, None
    m = re.search(r"(\d+)\s*(?:years?|yrs?)?\s*(?:and\s+)?(?:above|or above|\+|plus)", t)
    if m:
        return int(m.group(1)), None
    m = re.search(r"(?:aged|age)\s+(\d+)", t)
    if m:
        return int(m.group(1)), None
    m = re.search(r"(\d+)\s*(?:to|–|-)\s*(\d+)", t)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.search(r"(?:up to|upto|below|under)\s+(\d+)", t)
    if m:
        return None, int(m.group(1))
    return None, None


def parse_income_ceiling(income_limit: str) -> Optional[float]:
    t = (income_limit or "").lower().strip()
    if not t:
        return None
    if any(x in t for x in ["n/a", "na;", "no income", "no ceiling", "no fixed", "based on government", "based on pension"]):
        return None
    if "secc" in t and not re.search(r"\d{4,}", t):
        return 500000.0
    lakh = re.search(r"(\d+(?:\.\d+)?)\s*lakh", t)
    if lakh:
        return float(lakh.group(1)) * 100000.0
    nums = re.findall(r"(\d{4,})", t.replace(",", "").replace("₹", ""))
    if nums:
        return float(max(int(n) for n in nums))
    return None


def _get_full_scheme_record(scheme_id: str) -> Optional[Dict[str, Any]]:
    try:
        from app.rag.pipeline import _load_all_schemes
        for s in _load_all_schemes():
            if s.get("scheme_id") == scheme_id:
                return s
    except Exception:
        pass
    return None


def analyze_scheme(scheme: Dict[str, Any]) -> Dict[str, Any]:
    """Machine-usable flags and limits taken from the scheme JSON record."""
    scheme_id = scheme.get("scheme_id")
    if scheme_id and not scheme.get("eligibility_criteria"):
        full = _get_full_scheme_record(scheme_id)
        if full:
            scheme = {**full, **scheme}

    ec = scheme.get("eligibility_criteria") or {}
    age_group = str(ec.get("age_group") or "")
    income_raw = str(ec.get("income_limit_per_annum_inr") or "")
    beneficiaries = str(ec.get("target_beneficiaries") or "")
    name = str(scheme.get("scheme_name") or "")
    text = f"{name} {age_group} {beneficiaries} {income_raw}".lower()

    age_min, age_max = parse_age_bounds(age_group)
    income_ceiling = parse_income_ceiling(income_raw)

    # Maternity schemes are for pregnant/lactating mothers, NOT for newborns/babies
    maternity = any(
        w in text
        for w in ["pregnant", "pregnancy", "lactating", "maternity", "antenatal", "postnatal"]
    )
    # Newborn/infant schemes are for babies, not for the mother
    newborn = any(
        w in text
        for w in ["newborn", "infant", "baby care", "neonatal"]
    )
    disability = any(
        w in text
        for w in ["disabilit", "autism", "cerebral palsy", "udid", "niramaya"]
    )
    central_govt = "central government employee" in text or "cghs" in text
    esic = "esic" in text or "esic-covered" in text or "organised-sector" in text or "organized-sector" in text
    pensioner = "pensioner" in text and "employee" not in name.lower()
    tn_employee = (
        ("government employee" in text or "government employees" in text)
        and is_tn_scheme(scheme)
        and not pensioner
        and not central_govt
    )
    secc_or_bpl = any(w in (income_raw + " " + beneficiaries).lower() for w in ["secc", "bpl", "low-income", "low income"])

    return {
        "scheme_id": scheme.get("scheme_id"),
        "scheme_name": name,
        "is_tn": is_tn_scheme(scheme),
        "age_group": age_group,
        "age_min": age_min,
        "age_max": age_max,
        "income_raw": income_raw,
        "income_ceiling": income_ceiling,
        "secc_or_bpl": secc_or_bpl,
        "maternity": maternity,
        "newborn": newborn,
        "disability": disability,
        "central_govt": central_govt,
        "esic": esic,
        "pensioner": pensioner,
        "tn_employee": tn_employee,
        "employment_restricted": central_govt or esic or pensioner or tn_employee,
        "beneficiaries": beneficiaries,
        "documents": list(ec.get("required_documents") or []),
        "covered": list(scheme.get("key_covered_conditions") or []),
        "exclusions": list(scheme.get("key_exclusions") or []),
        "coverage_amount": scheme.get("coverage_amount_inr") or "",
        "benefits": scheme.get("benefits_summary") or "",
        "department": scheme.get("department") or "",
        "state": scheme.get("state") or "",
        "official_url": scheme.get("official_url") or "",
        "cashless": scheme.get("cashless"),
    }


def build_scheme_context_block(scheme: Dict[str, Any]) -> str:
    """Full structured record used as RAG grounding (not just a random chunk)."""
    flags = analyze_scheme(scheme)
    docs = "; ".join(flags["documents"]) or "As notified by the implementing agency"
    covered = "; ".join(flags["covered"]) or "See official packages"
    exclusions = "; ".join(flags["exclusions"]) or "See official exclusions"
    return (
        f"OFFICIAL SCHEME RECORD\n"
        f"Name: {flags['scheme_name']}\n"
        f"ID: {flags['scheme_id']}\n"
        f"Department: {flags['department']}\n"
        f"Jurisdiction: {flags['state']}\n"
        f"Benefits: {flags['benefits']}\n"
        f"Coverage amount: {flags['coverage_amount']}\n"
        f"Cashless: {'Yes' if flags['cashless'] else 'No / as per rules'}\n"
        f"Age group: {flags['age_group'] or 'Not specified'}\n"
        f"Income limit: {flags['income_raw'] or 'Not specified'}\n"
        f"Target beneficiaries: {flags['beneficiaries'] or 'Not specified'}\n"
        f"Required documents: {docs}\n"
        f"Covered conditions: {covered}\n"
        f"Exclusions: {exclusions}\n"
        f"Official URL: {flags['official_url']}"
    )


def employment_matches(flags: Dict[str, Any], employment: Optional[str]) -> Optional[bool]:
    """True/False if we can decide; None if employment is unknown and the scheme needs it."""
    if not flags.get("employment_restricted"):
        return True
    if not employment:
        return None
    if flags.get("central_govt"):
        return employment in ["Government Employee", "Retired/Pensioner"]
    if flags.get("tn_employee"):
        return employment == "Government Employee"
    if flags.get("pensioner"):
        return employment == "Retired/Pensioner"
    if flags.get("esic"):
        return employment in ["Private Sector Employee", "Government Employee"]
    return True


def filter_schemes_by_profile(
    all_schemes: List[Dict[str, Any]],
    gender: Optional[str] = None,
    age: Optional[int] = None,
    employment: Optional[str] = None,
    disability: Optional[str] = None,
    pregnancy: Optional[str] = None,
    state: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Drop schemes the JSON rules make obviously inapplicable. Unknown extras are skipped, not interrogated."""
    gender_l = (gender or "").lower()
    filtered: List[Dict[str, Any]] = []
    for scheme in all_schemes:
        flags = analyze_scheme(scheme)

        if flags["is_tn"] and state and state.lower() != "tamil nadu":
            continue

        # Maternity schemes: only for females, and only if pregnant or applicable
        if flags["maternity"] and gender_l and gender_l.lower() not in ["female", "f", "woman"]:
            continue
        if flags["maternity"] and pregnancy in ["No", None]:
            continue

        # Newborn schemes: only for babies (0-1 year), filter out for adults
        if flags["newborn"] and age is not None and age > 1:
            continue

        if flags["disability"] and disability == "No":
            continue

        emp_ok = employment_matches(flags, employment)
        if emp_ok is False:
            continue
        if emp_ok is None and flags["employment_restricted"]:
            # Do not show employee-only schemes unless the person is in that audience
            continue

        if age is not None:
            if flags["age_min"] is not None and age < flags["age_min"]:
                continue
            if flags["age_max"] is not None and age > flags["age_max"]:
                continue

        filtered.append(scheme)
    return filtered


def determine_intake_questions(
    patient_context: Optional[Dict[str, Any]],
    additional_info: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Multi-scheme discovery only needs state, age, and income.
    Employment / disability / pregnancy are used when already known; they are not asked of everyone.
    """
    ctx = dict(patient_context or {})
    extra = dict(additional_info or {})
    merged = {**ctx, **{k: v for k, v in extra.items() if v not in (None, "")}}

    questions: List[Dict[str, Any]] = []
    if not merged.get("state"):
        questions.append({
            "criterion_id": "cr_intake_state",
            "field_key": "state",
            "label": "State of Residence",
            "question": "What is your State of residence?",
            "input_type": "MCQ",
            "options": ["Tamil Nadu", "Other State/UT"],
            "status": "UNKNOWN",
            "patient_value": None,
            "source": "UNKNOWN",
            "priority": 1,
        })
    if not merged.get("age"):
        questions.append({
            "criterion_id": "cr_intake_age",
            "field_key": "age",
            "label": "Current Age",
            "question": "What is your current age?",
            "input_type": "NUMBER",
            "options": [],
            "status": "UNKNOWN",
            "patient_value": None,
            "source": "UNKNOWN",
            "priority": 2,
        })
    if merged.get("annual_income") in (None, ""):
        questions.append({
            "criterion_id": "cr_intake_income",
            "field_key": "annual_income",
            "label": "Annual Household Income",
            "question": "What is your approximate annual household income?",
            "input_type": "MCQ",
            "options": [
                "Up to ₹1,20,000 / year (or BPL / Ration Card)",
                "₹1,20,000 to ₹5,00,000",
                "Above ₹5,00,000",
            ],
            "status": "UNKNOWN",
            "patient_value": None,
            "source": "UNKNOWN",
            "priority": 3,
        })
    questions.sort(key=lambda x: x.get("priority", 99))
    return questions


def _crit(
    criterion_id: str,
    name: str,
    result: str,
    required: bool,
    patient_value: Any,
    required_value: str,
    explanation: str,
    source: str,
    field_key: str,
    evidence: List[Dict[str, Any]],
    missing: bool = False,
    question_prompt: Optional[str] = None,
    input_type: Optional[str] = None,
    options: Optional[List[str]] = None,
) -> Dict[str, Any]:
    item = {
        "criterion_id": criterion_id,
        "criterion_name": name,
        "criterion_result": result,
        "required": required,
        "patient_value": patient_value,
        "required_value": required_value,
        "explanation": explanation,
        "source": source,
        "field_key": field_key,
        "supporting_evidence": evidence,
        "is_missing_info": missing,
    }
    if question_prompt:
        item["question_prompt"] = question_prompt
    if input_type:
        item["input_type"] = input_type
    if options is not None:
        item["options"] = options
    return item


def evaluate_scheme_from_json(
    scheme: Dict[str, Any],
    effective_state: Optional[str],
    effective_age: Optional[int],
    effective_income: Optional[float],
    effective_employment: Optional[str] = None,
    effective_disability: Optional[str] = None,
    effective_pregnancy: Optional[str] = None,
    gender: Optional[str] = None,
    evidence_sources: Optional[List[Dict[str, Any]]] = None,
    state_source: str = "OFFICIAL_RULE",
    age_source: str = "OFFICIAL_RULE",
    income_source: str = "OFFICIAL_RULE",
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    flags = analyze_scheme(scheme)
    evidence = (evidence_sources or [])[:1]
    criteria: List[Dict[str, Any]] = []
    missing: List[Dict[str, Any]] = []
    gender_l = (gender or "").lower()

    # Residency (TN schemes only)
    if flags["is_tn"]:
        if effective_state is not None:
            ok = effective_state == "Tamil Nadu"
            criteria.append(_crit(
                "cr_residency", "State Residency",
                "PASS" if ok else "FAIL", True, effective_state,
                "Resident of Tamil Nadu",
                f"Resident of {effective_state}. {'Eligible for this Tamil Nadu scheme.' if ok else 'This scheme is only for Tamil Nadu residents.'}",
                state_source, "state", evidence,
            ))
        else:
            criteria.append(_crit(
                "cr_residency", "State Residency", "UNKNOWN", True, None,
                "Resident of Tamil Nadu",
                "Tamil Nadu residence is required by the official scheme record.",
                "UNKNOWN", "state", evidence, True,
                "What is your State of residence?", "MCQ", ["Tamil Nadu", "Other State/UT"],
            ))
            missing.append({
                "criterion_id": "cr_residency",
                "field_key": "state",
                "label": "State of Residence",
                "question": "What is your State of residence?",
                "input_type": "MCQ",
                "options": ["Tamil Nadu", "Other State/UT"],
                "status": "UNKNOWN",
                "patient_value": None,
                "source": "UNKNOWN",
            })

    # Age only when JSON specifies a bound
    if flags["age_min"] is not None or flags["age_max"] is not None:
        req = flags["age_group"] or "Age as per official rules"
        if effective_age is not None:
            ok = True
            if flags["age_min"] is not None and effective_age < flags["age_min"]:
                ok = False
            if flags["age_max"] is not None and effective_age > flags["age_max"]:
                ok = False
            criteria.append(_crit(
                "cr_age_limit", "Age Group",
                "PASS" if ok else "FAIL", True, f"{effective_age} years old", req,
                f"Official age group: {req}. Your age is {effective_age}.",
                age_source, "age", evidence,
            ))
        else:
            criteria.append(_crit(
                "cr_age_limit", "Age Group", "UNKNOWN", True, None, req,
                f"Age verification is required ({req}).",
                "UNKNOWN", "age", evidence, True,
                "What is your current age?", "NUMBER", [],
            ))
            missing.append({
                "criterion_id": "cr_age_limit",
                "field_key": "age",
                "label": "Current Age",
                "question": "What is your current age?",
                "input_type": "NUMBER",
                "options": [],
                "status": "UNKNOWN",
                "patient_value": None,
                "source": "UNKNOWN",
            })

    # Income only when JSON has a ceiling or SECC/BPL targeting
    if flags["income_ceiling"] is not None:
        req = flags["income_raw"]
        if effective_income is not None:
            ok = effective_income <= flags["income_ceiling"]
            criteria.append(_crit(
                "cr_income_doc", "Income / Socio-Economic Category",
                "PASS" if ok else "FAIL", True,
                f"₹{int(effective_income):,} / year", req,
                f"Official income rule: {req}.",
                income_source, "annual_income", evidence,
            ))
        else:
            criteria.append(_crit(
                "cr_income_doc", "Income / Socio-Economic Category", "UNKNOWN", True, None, req,
                f"Income details are needed because the scheme record states: {req}.",
                "UNKNOWN", "annual_income", evidence, True,
                "What is your approximate annual household income?", "MCQ",
                ["Up to ₹1,20,000 / year (or valid BPL / Ration Card)", "Above ₹1,20,000 / year", "Prefer not to say"],
            ))
            missing.append({
                "criterion_id": "cr_income_doc",
                "field_key": "annual_income",
                "label": "Annual Household Income",
                "question": "What is your approximate annual household income?",
                "input_type": "MCQ",
                "options": ["Up to ₹1,20,000 / year (or valid BPL / Ration Card)", "Above ₹1,20,000 / year", "Prefer not to say"],
                "status": "UNKNOWN",
                "patient_value": None,
                "source": "UNKNOWN",
            })
    else:
        criteria.append(_crit(
            "cr_income_doc", "Income / Socio-Economic Category",
            "NOT_REQUIRED", False,
            "Not applicable", "Universal / No income ceiling",
            "This scheme has no income ceiling or income restriction.",
            "OFFICIAL_RULE", "annual_income", evidence,
        ))

    # Employment only for employee/pensioner schemes
    if flags["employment_restricted"]:
        req = flags["beneficiaries"] or "Eligible employee / pensioner category"
        emp_ok = employment_matches(flags, effective_employment)
        if emp_ok is True:
            criteria.append(_crit(
                "cr_employment", "Beneficiary Category (Employment)",
                "PASS", True, effective_employment, req,
                f"Your employment status matches the target group: {req}.",
                "USER_PROVIDED_DURING_INTAKE", "employment_status", evidence,
            ))
        elif emp_ok is False:
            criteria.append(_crit(
                "cr_employment", "Beneficiary Category (Employment)",
                "FAIL", True, effective_employment, req,
                f"This scheme is for: {req}. Your status ({effective_employment}) does not match.",
                "USER_PROVIDED_DURING_INTAKE", "employment_status", evidence,
            ))
        else:
            criteria.append(_crit(
                "cr_employment", "Beneficiary Category (Employment)", "UNKNOWN", True, None, req,
                f"Employment / service status is required. Official target group: {req}.",
                "UNKNOWN", "employment_status", evidence, True,
                "What is your current employment status?", "MCQ",
                ["Government Employee", "Private Sector Employee", "Self-Employed", "Unemployed/Homemaker", "Retired/Pensioner", "Student"],
            ))
            missing.append({
                "criterion_id": "cr_employment",
                "field_key": "employment_status",
                "label": "Employment Status",
                "question": "What is your current employment status?",
                "input_type": "MCQ",
                "options": ["Government Employee", "Private Sector Employee", "Self-Employed", "Unemployed/Homemaker", "Retired/Pensioner", "Student"],
                "status": "UNKNOWN",
                "patient_value": None,
                "source": "UNKNOWN",
            })

    # Disability only when the scheme targets persons with disability
    if flags["disability"]:
        req = flags["beneficiaries"]
        if effective_disability is not None:
            ok = effective_disability == "Yes"
            criteria.append(_crit(
                "cr_disability", "Disability Status",
                "PASS" if ok else "FAIL", True, effective_disability, req,
                f"Official target group: {req}.",
                "USER_PROVIDED_DURING_INTAKE", "disability_status", evidence,
            ))
        else:
            criteria.append(_crit(
                "cr_disability", "Disability Status", "UNKNOWN", True, None, req,
                f"A valid disability category is required ({req}).",
                "UNKNOWN", "disability_status", evidence, True,
                "Do you or a covered family member have a notified disability?", "MCQ", ["Yes", "No"],
            ))
            missing.append({
                "criterion_id": "cr_disability",
                "field_key": "disability_status",
                "label": "Disability Status",
                "question": "Do you or a covered family member have a notified disability?",
                "input_type": "MCQ",
                "options": ["Yes", "No"],
                "status": "UNKNOWN",
                "patient_value": None,
                "source": "UNKNOWN",
            })

    # Maternity schemes: For pregnant women only
    if flags["maternity"]:
        req = flags["age_group"] or flags["beneficiaries"]
        if gender_l and gender_l not in ["female", "f", "woman"]:
            criteria.append(_crit(
                "cr_pregnancy", "Maternity Eligibility",
                "FAIL", True, gender, "Female beneficiary (pregnant woman)",
                "This scheme is for pregnant women as per the official record.",
                "OFFICIAL_RULE", "gender", evidence,
            ))
        elif effective_pregnancy is not None:
            ok = effective_pregnancy == "Yes"
            criteria.append(_crit(
                "cr_pregnancy", "Maternity Eligibility",
                "PASS" if ok else "FAIL", True, effective_pregnancy, req,
                f"Official target group: {req}.",
                "USER_PROVIDED_DURING_INTAKE", "pregnancy_status", evidence,
            ))
        elif gender_l in ["female", "f", "woman"]:
            criteria.append(_crit(
                "cr_pregnancy", "Maternity Eligibility", "UNKNOWN", True, None, req,
                f"Pregnancy status is needed ({req}).",
                "UNKNOWN", "pregnancy_status", evidence, True,
                "Are you currently pregnant?", "MCQ", ["Yes", "No"],
            ))
            missing.append({
                "criterion_id": "cr_pregnancy",
                "field_key": "pregnancy_status",
                "label": "Pregnancy Status",
                "question": "Are you currently pregnant?",
                "input_type": "MCQ",
                "options": ["Yes", "No"],
                "status": "UNKNOWN",
                "patient_value": None,
                "source": "UNKNOWN",
            })

    # Newborn schemes: For babies only (0-1 year)
    if flags["newborn"]:
        req = flags["age_group"] or flags["beneficiaries"]
        if effective_age is not None:
            ok = effective_age <= 1
            criteria.append(_crit(
                "cr_newborn", "Newborn Eligibility",
                "PASS" if ok else "FAIL", True, f"{effective_age} years old", req,
                f"This scheme is for newborns/infants (0-1 year). You are {effective_age} years old.",
                "OFFICIAL_RULE", "age", evidence,
            ))
        else:
            criteria.append(_crit(
                "cr_newborn", "Newborn Eligibility", "UNKNOWN", True, None, req,
                f"This scheme is for newborns/infants (0-1 year).",
                "OFFICIAL_RULE", "age", evidence, True,
                "What is the age of the baby?", "NUMBER", [],
            ))
            missing.append({
                "criterion_id": "cr_newborn",
                "field_key": "age",
                "label": "Baby's Age",
                "question": "What is the age of the baby?",
                "input_type": "NUMBER",
                "options": [],
                "status": "UNKNOWN",
                "patient_value": None,
                "source": "UNKNOWN",
            })

    return criteria, missing


def relevance_score(flags: Dict[str, Any], match_pct: int, age: Optional[int], pregnancy: Optional[str], disability: Optional[str], employment: Optional[str]) -> int:
    score = match_pct
    # Boost maternity schemes only for pregnant women
    if pregnancy == "Yes" and flags["maternity"]:
        score += 20
    # Boost disability schemes only for disabled persons
    if disability == "Yes" and flags["disability"]:
        score += 20
    # Boost employee schemes for government employees/pensioners
    if employment in ["Government Employee", "Retired/Pensioner"] and flags["employment_restricted"]:
        score += 15
    # Boost elderly schemes for seniors
    if age is not None and flags["age_min"] and age >= flags["age_min"] and flags["age_min"] >= 60:
        score += 20
    # Coverage amount boost
    cov = (flags.get("coverage_amount") or "").lower()
    if "25 lakh" in cov or "2500000" in cov or "₹25" in cov:
        score += 15
    elif "10 lakh" in cov or "12 lakh" in cov:
        score += 10
    elif "5 lakh" in cov:
        score += 5
    # Note: Newborn schemes are NOT boosted for adults since they're only for babies
    return min(score, 100)


def assess_coverage_from_json(scheme: Dict[str, Any], query_text: str) -> Tuple[str, str, str]:
    """
    Returns (status, explanation, criterion_result) using covered/exclusion lists in JSON.
    """
    q = (query_text or "").lower()
    flags = analyze_scheme(scheme)
    exclusions = [e.lower() for e in flags["exclusions"]]
    covered = [c.lower() for c in flags["covered"]]

    def _overlap(items: List[str]) -> Optional[str]:
        for item in items:
            tokens = [t for t in re.split(r"[^a-z0-9]+", item) if len(t) > 3]
            if item and item in q:
                return item
            if tokens and sum(1 for t in tokens if t in q) >= max(1, len(tokens) // 2):
                return item
        return None

    hit_ex = _overlap(exclusions)
    hit_cov = _overlap(covered)

    if hit_ex and (not hit_cov or any(w in q for w in ["cosmetic", "aesthetic", "tattoo", "opd"])):
        return (
            "NOT_COVERED",
            f"**{flags['scheme_name']}** lists this under exclusions: {hit_ex}. Official coverage amount: {flags['coverage_amount']}.",
            "FAIL",
        )
    if hit_cov:
        return (
            "COVERED",
            f"**{flags['scheme_name']}** includes this under covered care: {hit_cov}. Coverage: {flags['coverage_amount']}. Cashless: {'Yes' if flags['cashless'] else 'As per rules'}.",
            "PASS",
        )
    if any(w in q for w in ["cosmetic", "tattoo", "aesthetic"]):
        return (
            "NOT_COVERED",
            f"Elective cosmetic / non-therapeutic procedures are typically excluded under **{flags['scheme_name']}**. Official exclusions: {'; '.join(flags['exclusions']) or 'see scheme guidelines'}.",
            "FAIL",
        )
    return (
        "INFORMATIONAL",
        f"The official record for **{flags['scheme_name']}** covers: {'; '.join(flags['covered']) or 'listed packages'}. Exclusions: {'; '.join(flags['exclusions']) or 'as notified'}. Coverage amount: {flags['coverage_amount']}. Confirm the exact package with the empanelled hospital.",
        "UNKNOWN",
    )


def lexical_score(query_text: str, text: str) -> float:
    q_terms = [t for t in re.findall(r"[a-z0-9]+", (query_text or "").lower()) if len(t) > 2]
    if not q_terms:
        return 0.0
    blob = (text or "").lower()
    hits = sum(1 for t in q_terms if t in blob)
    return hits / len(q_terms)
