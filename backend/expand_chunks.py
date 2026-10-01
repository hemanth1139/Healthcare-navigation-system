"""
Expand healthcare_schemes.json chunks from 3 short sentences to 8-10 rich,
information-dense chunks per scheme.  These chunks include eligibility rules,
required documents, coverage specifics, exclusions and procedural notes so the
vector search actually returns useful context for the LLM to reason over.
"""
import json, os, copy

SRC = os.path.join(os.path.dirname(__file__), "healthcare_schemes.json")

with open(SRC, "r", encoding="utf-8") as f:
    schemes = json.load(f)

def build_rich_chunks(s):
    """Generate 8-10 detailed text chunks from scheme metadata."""
    sid = s.get("scheme_id", "")
    name = s.get("scheme_name", "")
    dept = s.get("department", "")
    state = s.get("state", "")
    url = s.get("official_url", "")
    benefits = s.get("benefits_summary", "")
    coverage = s.get("coverage_amount_inr", "")
    cashless = s.get("cashless", False)
    ec = s.get("eligibility_criteria", {})
    income_limit = ec.get("income_limit_per_annum_inr", "")
    bpl = ec.get("bpl_or_secc_required", "")
    age_group = ec.get("age_group", "")
    target = ec.get("target_beneficiaries", "")
    docs = ec.get("required_documents", [])
    covered = s.get("key_covered_conditions", [])
    exclusions = s.get("key_exclusions", [])

    chunks = []

    # 1. Overview chunk
    chunks.append(
        f"{name} ({sid}) is administered by {dept}. "
        f"It is available in {state}. Official website: {url}. "
        f"Summary: {benefits}"
    )

    # 2. Coverage amount chunk
    cashless_text = "Cashless treatment is available at empanelled hospitals." if cashless else "Reimbursement-based treatment."
    chunks.append(
        f"Coverage under {name}: {coverage}. {cashless_text}"
    )

    # 3. Eligibility criteria chunk
    chunks.append(
        f"Eligibility criteria for {name}: "
        f"Income limit: {income_limit}. "
        f"BPL/SECC required: {bpl}. "
        f"Age group: {age_group}. "
        f"Target beneficiaries: {target}."
    )

    # 4. Required documents chunk
    if docs:
        docs_text = "; ".join(docs)
        chunks.append(
            f"Required documents for {name}: {docs_text}. "
            f"All documents must be valid and original or attested copies as per official guidelines."
        )

    # 5. Covered conditions chunk
    if covered:
        cov_text = "; ".join(covered)
        chunks.append(
            f"Conditions and treatments covered under {name}: {cov_text}. "
            f"Treatment must be at an empanelled or government hospital for cashless benefit."
        )

    # 6. Exclusions chunk
    if exclusions:
        exc_text = "; ".join(exclusions)
        chunks.append(
            f"Exclusions and procedures NOT covered under {name}: {exc_text}. "
            f"Patients should verify specific exclusions with the scheme authority before treatment."
        )

    # 7. How to apply chunk
    chunks.append(
        f"How to apply for {name}: Visit the official portal at {url} or contact the nearest "
        f"Common Service Centre (CSC), district hospital, or {dept} office. "
        f"Carry all required documents including identity proof and income/category certificates."
    )

    # 8. State-specific notes
    if "Tamil Nadu" in state:
        chunks.append(
            f"{name} is a Tamil Nadu state-specific scheme. Only residents of Tamil Nadu with a valid "
            f"family ration card or state domicile certificate are eligible. Non-Tamil Nadu residents "
            f"should check PM-JAY or their own state's equivalent health scheme."
        )
    elif "Central" in state or "All India" in state:
        chunks.append(
            f"{name} is a Central Government scheme available across all States and Union Territories of India. "
            f"Implementation may vary by state. Check with local health authorities for state-specific enrollment."
        )

    # 9. Key facts chunk
    chunks.append(
        f"Key facts about {name}: Department: {dept}. State: {state}. "
        f"Coverage: {coverage}. Cashless: {'Yes' if cashless else 'No'}. "
        f"Age group: {age_group}. Income ceiling: {income_limit}."
    )

    # 10. Keep original chunks if they add value
    for orig in s.get("chunks", []):
        if orig.strip() and orig not in chunks:
            chunks.append(orig)

    return chunks

for scheme in schemes:
    scheme["chunks"] = build_rich_chunks(scheme)

with open(SRC, "w", encoding="utf-8") as f:
    json.dump(schemes, f, indent=2, ensure_ascii=False)

total_chunks = sum(len(s["chunks"]) for s in schemes)
print(f"OK: Expanded {len(schemes)} schemes to {total_chunks} total chunks (avg {total_chunks/len(schemes):.1f}/scheme)")
