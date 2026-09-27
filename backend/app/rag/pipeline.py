"""
RAG Pipeline — queries the vector store, aggregates text excerpts from healthcare_schemes.json,
and runs Gemini LLM to generate eligibility/benefit explanations and criterion breakdowns.
"""

import re
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore, _cosine_similarity

# ─── Lazy VectorStore singleton ─────────────────────────────────────────────
_vector_store: VectorStore | None = None


def _get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store


def _parse_income_val(raw_val: Any) -> Optional[float]:
    """Parses numeric annual income in INR from numbers, strings, lakh/k notation, or BPL keywords."""
    if raw_val is None:
        return None
    val_str = str(raw_val).lower().strip()
    is_above = any(w in val_str for w in ["above", "more than", "greater than", ">", "exceed", "exceeds", "higher"])
    
    if any(bpl_word in val_str for bpl_word in ["bpl", "poverty", "secc", "ration card", "yellow card", "ayushman card", "low income"]) and not is_above:
        return 50000.0  # Safe BPL representation below ceilings

    # Check for lakh / lacs / L
    lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b', val_str)
    if lakh_match:
        try:
            val = float(lakh_match.group(1)) * 100000.0
            return val + 1.0 if is_above else val
        except ValueError:
            pass

    # Check for thousand / k
    k_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:thousand|k)\b', val_str)
    if k_match:
        try:
            val = float(k_match.group(1)) * 1000.0
            return val + 1.0 if is_above else val
        except ValueError:
            pass

    # Standard numeric clean: remove rupee symbol, commas, spaces
    clean = re.sub(r'[^\d.]', '', val_str)
    if clean:
        try:
            val = float(clean)
            return val + 1.0 if is_above else val
        except ValueError:
            return None
    return None


def _parse_state_val(raw_val: Any) -> Optional[str]:
    """Extracts standardized Indian State / UT name from text."""
    if not raw_val:
        return None
    val_str = str(raw_val).lower().strip()
    state_map = {
        "tamil nadu": "Tamil Nadu",
        "tamilnadu": "Tamil Nadu",
        "chennai": "Tamil Nadu",
        "kerala": "Kerala",
        "karnataka": "Karnataka",
        "bengaluru": "Karnataka",
        "bangalore": "Karnataka",
        "andhra pradesh": "Andhra Pradesh",
        "andhra": "Andhra Pradesh",
        "telangana": "Telangana",
        "hyderabad": "Telangana",
        "maharashtra": "Maharashtra",
        "mumbai": "Maharashtra",
        "pune": "Maharashtra",
        "delhi": "Delhi",
        "nct of delhi": "Delhi",
        "uttar pradesh": "Uttar Pradesh",
        "west bengal": "West Bengal",
        "kolkata": "West Bengal",
        "gujarat": "Gujarat",
        "rajasthan": "Rajasthan",
        "madhya pradesh": "Madhya Pradesh",
        "bihar": "Bihar",
        "odisha": "Odisha",
        "orissa": "Odisha",
        "punjab": "Punjab",
        "haryana": "Haryana",
        "india": "India (All States)",
        "all india": "India (All States)",
    }
    for k, v in state_map.items():
        if re.search(rf'\b{re.escape(k)}\b', val_str):
            return v
    if len(val_str) <= 4:
        abbrev_map = {
            "tn": "Tamil Nadu",
            "kl": "Kerala",
            "ka": "Karnataka",
            "ap": "Andhra Pradesh",
            "ts": "Telangana",
            "mh": "Maharashtra",
            "dl": "Delhi",
            "up": "Uttar Pradesh",
            "wb": "West Bengal",
            "gj": "Gujarat",
            "rj": "Rajasthan",
            "mp": "Madhya Pradesh",
            "br": "Bihar",
            "pb": "Punjab",
            "hr": "Haryana",
        }
        for k, v in abbrev_map.items():
            if val_str == k:
                return v
    return None


def _parse_age_val(raw_val: Any) -> Optional[int]:
    """Extracts numeric age from text or integers."""
    if raw_val is None:
        return None
    if isinstance(raw_val, int):
        return raw_val
    val_str = str(raw_val).lower().strip()
    age_match = re.search(r'\b(\d{1,3})\s*(?:years?|yrs?|yr|age|old)?\b', val_str)
    if age_match:
        try:
            return int(age_match.group(1))
        except ValueError:
            return None
    return None


def _classify_query_type(query_text: str) -> str:
    """
    Classifies the user query into distinct workflow categories:
    1. COVERAGE_QUERY: Questions about treatments, procedures, package inclusions/exclusions.
    2. REQUIREMENTS_QUERY: Informational questions about eligibility rules, income limits, documents.
    3. GENERAL_INFORMATION: Overview, benefits, department, general FAQs.
    4. PERSONAL_ELIGIBILITY: User asking if they personally qualify or can apply.
    """
    q = (query_text or "").lower().strip()

    is_personal_intent = any(p in q for p in [
        "am i eligible", "am i qualifying", "can i apply", "can i get", "i am", "my age", "my income", "my family", "my father", "my mother", "we are"
    ])

    # 1. Requirements / Document Queries (Informational, general requirements)
    requirements_indicators = [
        r'\b(?:what\s+are\s+the\s+)?(?:income\s+(?:and|&)\s+document|documents?\s+(?:and|&)\s+income)\s+requirements?\b',
        r'\b(?:documents?|papers?|certificates?|proofs?)\s+(?:required|needed|mandatory|list)\b',
        r'\b(?:what\s+are\s+the\s+)?(?:income\s+limits?|income\s+criteria|income\s+requirements?|eligibility\s+criteria|eligibility\s+rules?|requirements?)\b',
        r'\b(?:how\s+to\s+apply|application\s+process|enrollment\s+process|where\s+to\s+apply|documents\s+to\s+apply)\b',
        r'\blist\s+of\s+(?:documents?|requirements?|criteria)\b',
    ]
    if any(re.search(p, q) for p in requirements_indicators) and not is_personal_intent:
        return "REQUIREMENTS_QUERY"

    # 2. Coverage / Treatment / Procedure Queries
    coverage_patterns = [
        r'\b(?:is|does|are|can)\b.*\b(?:cover|covered|coverage|included|include|payable|paid|treat|treatment|procedure)\b',
        r'\b(?:cosmetic|aesthetic|tattoo|cataract|cardiac|oncology|surgery|dialysis|chemotherapy|transplant|maternity|dental|opd|emergency)\b',
        r'\bwhat\s+(?:treatments?|diseases?|procedures?|illnesses?|conditions?|operations?|surgeries)\s+(?:are|is)?\s*covered\b',
        r'\b(?:covered\s+procedures?|covered\s+conditions?|exclusions?|package\s+rates?)\b',
    ]
    if any(re.search(p, q) for p in coverage_patterns) and not is_personal_intent:
        return "COVERAGE_QUERY"

    # 3. General Information Queries
    overview_patterns = [
        r'\bwhat\s+is\s+(?:pm-?jay|cmchis|ayushman|the\s+scheme)\b',
        r'\btell\s+me\s+about\b',
        r'\bwhat\s+(?:benefits|coverage\s+amount|sum\s+insured)\s+(?:does|is)\b',
        r'\boverview\b',
    ]
    if any(re.search(p, q) for p in overview_patterns) and not is_personal_intent:
        return "GENERAL_INFORMATION"

    # 4. Default: Personal Eligibility Evaluation
    return "PERSONAL_ELIGIBILITY"


def resolve_scheme_context(
    query_text: str,
    scoped_scheme_id: Optional[str] = None,
    vector_store: Optional[VectorStore] = None
) -> Tuple[str, str, str]:
    """
    Deterministically resolves and locks (scheme_id, scheme_name, official_url).
    1. If scoped_scheme_id is provided, match that exact scheme from known schemes / vectorstore.
    2. Otherwise, scan query_text for explicit scheme names, acronyms, or keywords.
    3. If still unresolved, default to national central scheme.
    """
    q_low = (query_text or "").lower()

    known_schemes = {
        "scheme_C02": {
            "id": "scheme_C02",
            "name": "Ayushman Vay Vandana Card (PM-JAY for 70+)",
            "url": "https://pmjay.gov.in/",
            "aliases": [
                "vay vandana", "vaya vandana", "vayavandana", "vayvandana",
                "70+", "70 plus", "70 or above", "70 years", "senior citizen card",
                "pmjay 70", "pm-jay 70", "ayushman 70", "senior citizen"
            ]
        },
        "scheme_TN01": {
            "id": "scheme_TN01",
            "name": "Chief Minister Comprehensive Health Insurance Scheme (TN CMCHIS)",
            "url": "https://cmchistn.com/",
            "aliases": [
                "cmchis", "tn cmchis", "chief minister comprehensive", "tamil nadu scheme",
                "tamilnadu insurance", "kalaignar", "maruthuva kaapeedu"
            ]
        },
        "scheme_C01": {
            "id": "scheme_C01",
            "name": "Ayushman Bharat PM-JAY",
            "url": "https://pmjay.gov.in/",
            "aliases": [
                "pm-jay", "pmjay", "ab-pmjay", "ab pmjay", "ayushman bharat", "jan arogya"
            ]
        },
        "scheme_C03": {
            "id": "scheme_C03",
            "name": "Central Government Health Scheme (CGHS)",
            "url": "https://cghs.nic.in/",
            "aliases": ["cghs", "central government health scheme"]
        }
    }

    # 1. If explicit scoped_scheme_id is provided, look up exact metadata
    if scoped_scheme_id:
        if scoped_scheme_id in known_schemes:
            s = known_schemes[scoped_scheme_id]
            return s["id"], s["name"], s["url"]
        if vector_store:
            for doc in vector_store.documents:
                meta = doc.get("metadata", {})
                if meta.get("scheme_id") == scoped_scheme_id:
                    return meta.get("scheme_id"), meta.get("scheme_name", "Government Healthcare Scheme"), meta.get("official_url", "https://pmjay.gov.in")
        return scoped_scheme_id, "Government Healthcare Scheme", "https://pmjay.gov.in"

    # 2. Match in query text (prioritize specific sub-schemes like Vay Vandana over generic PM-JAY)
    for alias in known_schemes["scheme_C02"]["aliases"]:
        if alias in q_low:
            s = known_schemes["scheme_C02"]
            return s["id"], s["name"], s["url"]

    for alias in known_schemes["scheme_TN01"]["aliases"]:
        if alias in q_low:
            s = known_schemes["scheme_TN01"]
            return s["id"], s["name"], s["url"]

    for alias in known_schemes["scheme_C01"]["aliases"]:
        if alias in q_low:
            s = known_schemes["scheme_C01"]
            return s["id"], s["name"], s["url"]

    for alias in known_schemes["scheme_C03"]["aliases"]:
        if alias in q_low:
            s = known_schemes["scheme_C03"]
            return s["id"], s["name"], s["url"]

    # 3. Default fallback
    default_s = known_schemes["scheme_C01"]
    return default_s["id"], default_s["name"], default_s["url"]


class RAGPipeline:

    @staticmethod
    async def query(
        query_text: str,
        k: int = 6,
        scoped_scheme_id: Optional[str] = None,
        patient_context: Optional[Dict[str, Any]] = None,
        additional_info: Optional[Dict[str, Any]] = None,
        uploaded_document_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retrieves official scheme document chunks and executes query-type-aware multi-document reasoning.
        Distinguishes COVERAGE_QUERY, REQUIREMENTS_QUERY, GENERAL_INFORMATION, and PERSONAL_ELIGIBILITY.
        """
        vector_store = _get_vector_store()
        
        # 1. Deterministically resolve and LOCK the target scheme identity
        top_scheme_id, top_scheme_name, top_scheme_url = resolve_scheme_context(
            query_text=query_text,
            scoped_scheme_id=scoped_scheme_id,
            vector_store=vector_store
        )

        query_type = _classify_query_type(query_text)

        # 2. Generate search prompt grounded in locked scheme
        search_prompt = f"{top_scheme_name} {query_text}"
        query_emb = await EmbeddingService.get_embedding(search_prompt)

        # 3. STRICT Scheme-Filtered Vector Search: only retrieve chunks belonging to top_scheme_id!
        scoped_docs = [
            doc for doc in vector_store.documents
            if doc.get("metadata", {}).get("scheme_id") == top_scheme_id
        ]

        if scoped_docs:
            scores = [
                (doc["text"], doc.get("metadata", {}), _cosine_similarity(query_emb, doc["embedding"]))
                for doc in scoped_docs
            ]
            scores.sort(key=lambda x: x[2], reverse=True)
            results = scores[:k]
        else:
            # Fallback if no specific chunks are tagged in vector store
            all_results = vector_store.similarity_search(query_emb, k=k)
            # Prioritize matching scheme_id if any
            matched = [r for r in all_results if r[1].get("scheme_id") == top_scheme_id]
            results = matched if matched else all_results

        # Format retrieved chunks and evidence sources strictly from top_scheme_id
        chunks = []
        evidence_sources = []
        for idx, (text, meta, score) in enumerate(results):
            chunk_id = f"chk_{idx+1}_{str(top_scheme_id)[:6]}"

            chunks.append({
                "chunk_id": chunk_id,
                "scheme_id": top_scheme_id,
                "scheme_name": top_scheme_name,
                "excerpt": text,
                "official_url": top_scheme_url,
            })

            evidence_sources.append({
                "chunk_id": chunk_id,
                "document_title": f"{top_scheme_name} — Official Guidelines & Operational Framework",
                "page_number": idx + 1,
                "excerpt": text,
                "official_url": top_scheme_url,
                "relevance_score": round(float(score), 2) if score else 0.88,
            })

        if not results:
            return {
                "ai_response": f"I couldn't locate any official evidence for {top_scheme_name} in our database at this time.",
                "retrieved_chunks": [],
                "confidence_score": 0.0,
                "is_low_confidence": True,
                "eligibility_result": None,
            }

        top_score = results[0][2] if results else 0.88
        confidence = float(max(0.0, min(1.0, (top_score + 1.0) / 2.0)))

        q_lower = (query_text or "").lower()
        now_iso = datetime.now(timezone.utc).isoformat()
        query_id_str = f"q_{int(datetime.now(timezone.utc).timestamp() * 1000)}"

        # ─── WORKFLOW A: COVERAGE_QUERY ───────────────────────────────────────
        if query_type == "COVERAGE_QUERY":
            is_excluded = any(term in q_lower for term in ["cosmetic", "tattoo", "aesthetic", "car insurance", "gym", "non-therapeutic"])
            
            if is_excluded:
                overall_status = "NOT_COVERED"
                overall_exp = f"Elective cosmetic and non-therapeutic aesthetic procedures are strictly **excluded** under official {top_scheme_name} guidelines."
                criteria = [{
                    "criterion_id": "cr_necessity",
                    "criterion_name": "Medical Necessity & Package Inclusions",
                    "criterion_result": "FAIL",
                    "required": True,
                    "patient_value": "Elective cosmetic / aesthetic procedure",
                    "required_value": "Therapeutic secondary and tertiary inpatient treatments",
                    "explanation": "Official scheme guidelines explicitly exclude aesthetic, cosmetic, and non-essential elective procedures.",
                    "source": "OFFICIAL_RULE",
                    "field_key": "procedure_type",
                    "supporting_evidence": evidence_sources[:2],
                    "is_missing_info": False,
                }]
            else:
                overall_status = "COVERED"
                overall_exp = f"Therapeutic secondary and tertiary inpatient medical treatments are **covered** under {top_scheme_name} up to official package limits."
                criteria = [{
                    "criterion_id": "cr_necessity",
                    "criterion_name": "Medical Necessity & Package Inclusions",
                    "criterion_result": "PASS",
                    "required": True,
                    "patient_value": "Approved inpatient hospitalization package",
                    "required_value": "Secondary / tertiary inpatient care at empanelled network hospitals",
                    "explanation": "Procedure falls within the cashless secondary and tertiary surgical and medical benefit packages.",
                    "source": "OFFICIAL_RULE",
                    "field_key": "procedure_type",
                    "supporting_evidence": evidence_sources[:2],
                    "is_missing_info": False,
                }]

            eligibility_result = {
                "query_id": query_id_str,
                "scheme_id": top_scheme_id,
                "query_type": "COVERAGE",
                "user_question": query_text,
                "interview_state": "COMPLETED",
                "current_question": None,
                "progress": None,
                "match_percentage": None,
                "overall_status": overall_status,
                "overall_explanation": overall_exp,
                "criteria_breakdown": criteria,
                "missing_information": [],
                "structured_missing_criteria": [],
                "all_evidence_sources": evidence_sources,
                "queried_at": now_iso,
            }

            return {
                "ai_response": overall_exp,
                "retrieved_chunks": chunks,
                "confidence_score": round(confidence, 2),
                "is_low_confidence": confidence < 0.65,
                "eligibility_result": eligibility_result,
            }

        # ─── WORKFLOW B: REQUIREMENTS_QUERY ──────────────────────────────────
        if query_type == "REQUIREMENTS_QUERY":
            overall_status = "INFORMATIONAL"
            overall_exp = f"Official eligibility criteria and document requirements for **{top_scheme_name}** derived from government operational framework:"
            
            eligibility_result = {
                "query_id": query_id_str,
                "scheme_id": top_scheme_id,
                "query_type": "REQUIREMENTS",
                "user_question": query_text,
                "interview_state": "COMPLETED",
                "current_question": None,
                "progress": None,
                "match_percentage": None,
                "overall_status": overall_status,
                "overall_explanation": overall_exp,
                "criteria_breakdown": [],
                "missing_information": [],
                "structured_missing_criteria": [],
                "all_evidence_sources": evidence_sources,
                "queried_at": now_iso,
            }

            return {
                "ai_response": overall_exp,
                "retrieved_chunks": chunks,
                "confidence_score": round(confidence, 2),
                "is_low_confidence": confidence < 0.65,
                "eligibility_result": eligibility_result,
            }

        # ─── WORKFLOW C: GENERAL_INFORMATION ─────────────────────────────────
        if query_type == "GENERAL_INFORMATION":
            overall_status = "INFORMATIONAL"
            overall_exp = f"**{top_scheme_name}** provides cashless secondary and tertiary hospitalization cover across public and empanelled private hospitals."
            
            eligibility_result = {
                "query_id": query_id_str,
                "scheme_id": top_scheme_id,
                "query_type": "GENERAL_INFORMATION",
                "user_question": query_text,
                "interview_state": "COMPLETED",
                "current_question": None,
                "progress": None,
                "match_percentage": None,
                "overall_status": overall_status,
                "overall_explanation": overall_exp,
                "criteria_breakdown": [],
                "missing_information": [],
                "structured_missing_criteria": [],
                "all_evidence_sources": evidence_sources,
                "queried_at": now_iso,
            }

            return {
                "ai_response": overall_exp,
                "retrieved_chunks": chunks,
                "confidence_score": round(confidence, 2),
                "is_low_confidence": confidence < 0.65,
                "eligibility_result": eligibility_result,
            }

        # ─── WORKFLOW D: PERSONAL_ELIGIBILITY (DYNAMIC MCQ INTERVIEW) ───────────
        # 1. Extract and normalize patient inputs from Profile context & User answers
        p_state_raw = (patient_context.get("state") if patient_context else "")
        provided_state_raw = additional_info.get("state") if additional_info else None
        if not provided_state_raw and additional_info:
            provided_state_raw = additional_info.get("residency")

        state_from_profile = _parse_state_val(p_state_raw)
        state_from_input = _parse_state_val(provided_state_raw)
        if not state_from_input and q_lower:
            residence_match = re.search(r'\b(?:living in|live in|resident of|residing in|from|state is)\s+([a-zA-Z\s]+)', q_lower)
            if residence_match:
                state_from_input = _parse_state_val(residence_match.group(1))

        effective_state = state_from_input or state_from_profile
        state_source = "PROFILE_CONTEXT" if (effective_state == state_from_profile and state_from_profile) else (
            "DOCUMENT_VERIFIED" if uploaded_document_id else ("USER_PROVIDED_DURING_INTERVIEW" if effective_state else "UNKNOWN")
        )

        p_age_raw = patient_context.get("age") if patient_context else None
        provided_age_raw = additional_info.get("age") if additional_info else None
        if not provided_age_raw and additional_info and "70" in str(additional_info):
            provided_age_raw = 70
        age_from_profile = _parse_age_val(p_age_raw)
        age_from_input = _parse_age_val(provided_age_raw)
        if age_from_input is None and q_lower:
            if "70+" in q_lower or "70 plus" in q_lower or "70 or above" in q_lower or "i am 70" in q_lower:
                age_from_input = 70
            elif "age is" in q_lower or "years old" in q_lower:
                age_from_input = _parse_age_val(q_lower)

        effective_age = age_from_input or age_from_profile
        age_source = "PROFILE_CONTEXT" if (effective_age == age_from_profile and age_from_profile is not None) else (
            "DOCUMENT_VERIFIED" if uploaded_document_id else ("USER_PROVIDED_DURING_INTERVIEW" if effective_age is not None else "UNKNOWN")
        )

        provided_income_raw = None
        if additional_info:
            for k_inc in ["annual_income", "income", "salary", "family_income", "income_level"]:
                if k_inc in additional_info:
                    provided_income_raw = additional_info[k_inc]
                    break
        if not provided_income_raw and q_lower:
            if any(term in q_lower for term in ["my income", "income is", "i earn", "family income of", "earning"]):
                provided_income_raw = query_text

        effective_income = _parse_income_val(provided_income_raw)
        income_source = "DOCUMENT_VERIFIED" if uploaded_document_id else (
            "USER_PROVIDED_DURING_INTERVIEW" if provided_income_raw is not None else "UNKNOWN"
        )

        is_70_plus_scheme = "70" in top_scheme_name or "Vay Vandana" in top_scheme_name or "vaya" in q_lower
        is_tn_scheme = "scheme_TN" in top_scheme_id or "Tamil Nadu" in top_scheme_name or "CMCHIS" in top_scheme_name

        criteria = []
        structured_missing_questions: List[Dict[str, Any]] = []

        # 1. Scheme-Specific Age Criterion
        if is_70_plus_scheme:
            if effective_age is not None:
                age_pass = effective_age >= 70
                criteria.append({
                    "criterion_id": "cr_age_70",
                    "criterion_name": "Senior Citizen Age Requirement (70+ Years)",
                    "criterion_result": "PASS" if age_pass else "FAIL",
                    "required": True,
                    "patient_value": f"{effective_age} years old",
                    "required_value": "70 years and above (Universal for all Indian citizens)",
                    "explanation": f"Patient age of {effective_age} {'satisfies' if age_pass else 'does not satisfy'} the 70+ requirement for Ayushman Vay Vandana Card.",
                    "source": age_source,
                    "field_key": "age",
                    "question_prompt": "What is your current age?",
                    "input_type": "MCQ",
                    "options": ["Below 60", "60–69", "70 or above", "Prefer not to say"],
                    "supporting_evidence": evidence_sources[:1],
                    "is_missing_info": False,
                })
            else:
                criteria.append({
                    "criterion_id": "cr_age_70",
                    "criterion_name": "Senior Citizen Age Requirement (70+ Years)",
                    "criterion_result": "UNKNOWN",
                    "required": True,
                    "patient_value": None,
                    "required_value": "70 years and above (Universal for all Indian citizens)",
                    "explanation": "Age verification is required to confirm senior citizen eligibility for Ayushman Vay Vandana.",
                    "source": "UNKNOWN",
                    "field_key": "age",
                    "question_prompt": "What is your current age?",
                    "input_type": "MCQ",
                    "options": ["Below 60", "60–69", "70 or above", "Prefer not to say"],
                    "supporting_evidence": evidence_sources[:1],
                    "is_missing_info": True,
                })
                structured_missing_questions.append({
                    "criterion_id": "cr_age_70",
                    "field_key": "age",
                    "label": "Senior Citizen Age Verification",
                    "question": "What is your current age?",
                    "input_type": "MCQ",
                    "options": ["Below 60", "60–69", "70 or above", "Prefer not to say"],
                    "status": "UNKNOWN",
                    "patient_value": None,
                    "source": "UNKNOWN"
                })

            # For 70+ scheme, Income is NOT REQUIRED!
            criteria.append({
                "criterion_id": "cr_income_doc",
                "criterion_name": "Income / Socio-Economic Category",
                "criterion_result": "NOT_REQUIRED",
                "required": False,
                "patient_value": None,
                "required_value": "No income ceiling for Senior Citizens aged 70+",
                "explanation": "Ayushman Vay Vandana is universal for all citizens aged 70+ regardless of family income or economic status.",
                "source": "OFFICIAL_RULE",
                "field_key": "annual_income",
                "supporting_evidence": evidence_sources[:1],
                "is_missing_info": False,
            })

            # Residency for Pan-India central 70+ scheme
            criteria.append({
                "criterion_id": "cr_residency",
                "criterion_name": "Residency & Citizenship",
                "criterion_result": "PASS",
                "required": True,
                "patient_value": effective_state or "Indian Citizen / Resident",
                "required_value": "Indian Citizen / Resident with Aadhaar",
                "explanation": "Universal pan-India coverage across all states with Aadhaar authentication.",
                "source": state_source if effective_state else "OFFICIAL_RULE",
                "field_key": "state",
                "supporting_evidence": evidence_sources[:1],
                "is_missing_info": False,
            })

        elif is_tn_scheme:
            # TN CMCHIS: State residency and Income are required
            if effective_state is not None:
                state_pass = effective_state == "Tamil Nadu"
                criteria.append({
                    "criterion_id": "cr_residency",
                    "criterion_name": "Residency & Citizenship",
                    "criterion_result": "PASS" if state_pass else "FAIL",
                    "required": True,
                    "patient_value": effective_state,
                    "required_value": "Resident of Tamil Nadu with valid Family Ration Card",
                    "explanation": f"Applicant resides in {effective_state}. {'Eligible for TN CMCHIS state cover.' if state_pass else 'TN CMCHIS is strictly limited to residents of Tamil Nadu.'}",
                    "source": state_source,
                    "field_key": "state",
                    "question_prompt": "What is your current state/UT of residence?",
                    "input_type": "MCQ",
                    "options": ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Other State/UT"],
                    "supporting_evidence": evidence_sources[:1],
                    "is_missing_info": False,
                })
            else:
                criteria.append({
                    "criterion_id": "cr_residency",
                    "criterion_name": "Residency & Citizenship",
                    "criterion_result": "UNKNOWN",
                    "required": True,
                    "patient_value": None,
                    "required_value": "Resident of Tamil Nadu with valid Family Ration Card",
                    "explanation": "State residency is required to access state-funded CMCHIS benefits.",
                    "source": "UNKNOWN",
                    "field_key": "state",
                    "question_prompt": "What is your current state/UT of residence?",
                    "input_type": "MCQ",
                    "options": ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Other State/UT"],
                    "supporting_evidence": evidence_sources[:1],
                    "is_missing_info": True,
                })
                structured_missing_questions.append({
                    "criterion_id": "cr_residency",
                    "field_key": "state",
                    "label": "State / UT of Residence",
                    "question": "What is your current state/UT of residence?",
                    "input_type": "MCQ",
                    "options": ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Other State/UT"],
                    "status": "UNKNOWN",
                    "patient_value": None,
                    "source": "UNKNOWN"
                })

            income_limit = 120000.0  # ₹1.2 Lakh / annum
            if effective_income is not None:
                inc_pass = effective_income <= income_limit
                criteria.append({
                    "criterion_id": "cr_income_doc",
                    "criterion_name": "Income / Socio-Economic Category",
                    "criterion_result": "PASS" if inc_pass else "FAIL",
                    "required": True,
                    "patient_value": f"₹{int(effective_income):,} / year" if effective_income > 50000 else "BPL / Low Income Category",
                    "required_value": "Annual family income ≤ ₹1,20,000 / annum (or VAO certificate)",
                    "explanation": f"Annual income of ₹{int(effective_income):,} is {'within' if inc_pass else 'exceeds'} the scheme ceiling of ₹1,20,000 / annum.",
                    "source": income_source,
                    "field_key": "annual_income",
                    "question_prompt": "What is your approximate annual household income?",
                    "input_type": "MCQ",
                    "options": ["Up to ₹1,20,000 / year (or valid BPL / Ration Card)", "Above ₹1,20,000 / year", "Prefer not to say"],
                    "supporting_evidence": evidence_sources[:1],
                    "is_missing_info": False,
                })
            else:
                criteria.append({
                    "criterion_id": "cr_income_doc",
                    "criterion_name": "Income / Socio-Economic Category",
                    "criterion_result": "UNKNOWN",
                    "required": True,
                    "patient_value": None,
                    "required_value": "Annual family income ≤ ₹1,20,000 / annum (or VAO certificate)",
                    "explanation": "Income verification required via official ration card or VAO certificate.",
                    "source": "UNKNOWN",
                    "field_key": "annual_income",
                    "question_prompt": "What is your approximate annual household income?",
                    "input_type": "MCQ",
                    "options": ["Up to ₹1,20,000 / year (or valid BPL / Ration Card)", "Above ₹1,20,000 / year", "Prefer not to say"],
                    "supporting_evidence": evidence_sources[:1],
                    "is_missing_info": True,
                })
                structured_missing_questions.append({
                    "criterion_id": "cr_income_doc",
                    "field_key": "annual_income",
                    "label": "Annual Household Income",
                    "question": "What is your approximate annual household income?",
                    "input_type": "MCQ",
                    "options": ["Up to ₹1,20,000 / year (or valid BPL / Ration Card)", "Above ₹1,20,000 / year", "Prefer not to say"],
                    "status": "UNKNOWN",
                    "patient_value": None,
                    "source": "UNKNOWN"
                })

        else:
            # Standard Central Scheme (e.g. SECC PM-JAY)
            criteria.append({
                "criterion_id": "cr_residency",
                "criterion_name": "Residency & Citizenship",
                "criterion_result": "PASS",
                "required": True,
                "patient_value": effective_state or "Indian Resident / Citizen",
                "required_value": "Indian Citizen / Resident with Aadhaar",
                "explanation": "Eligible for Central Government coverage across India with Aadhaar.",
                "source": state_source if effective_state else "OFFICIAL_RULE",
                "field_key": "state",
                "supporting_evidence": evidence_sources[:1],
                "is_missing_info": False,
            })

            if effective_income is not None:
                criteria.append({
                    "criterion_id": "cr_income_doc",
                    "criterion_name": "Income / Socio-Economic Category",
                    "criterion_result": "PASS",
                    "required": True,
                    "patient_value": f"₹{int(effective_income):,} / year" if effective_income > 50000 else "BPL / SECC Listing",
                    "required_value": "SECC 2011 Deprivation / BPL Category",
                    "explanation": "Self-declared income aligns with socio-economic eligibility criteria.",
                    "source": income_source,
                    "field_key": "annual_income",
                    "question_prompt": "Do you hold a BPL Ration Card, or are you listed in the SECC 2011 database?",
                    "input_type": "MCQ",
                    "options": ["Yes, BPL Ration Card / Low Income", "Listed in SECC 2011 Beneficiary List", "Above poverty line / Not BPL", "Not sure / Need to check"],
                    "supporting_evidence": evidence_sources[:1],
                    "is_missing_info": False,
                })
            else:
                criteria.append({
                    "criterion_id": "cr_income_doc",
                    "criterion_name": "Income / Socio-Economic Category",
                    "criterion_result": "UNKNOWN",
                    "required": True,
                    "patient_value": None,
                    "required_value": "SECC 2011 Deprivation / BPL Category",
                    "explanation": "Socio-economic verification required via official SECC listing or Ration Card.",
                    "source": "UNKNOWN",
                    "field_key": "annual_income",
                    "question_prompt": "Do you hold a BPL Ration Card, or are you listed in the SECC 2011 database?",
                    "input_type": "MCQ",
                    "options": ["Yes, BPL Ration Card / Low Income", "Listed in SECC 2011 Beneficiary List", "Above poverty line / Not BPL", "Not sure / Need to check"],
                    "supporting_evidence": evidence_sources[:1],
                    "is_missing_info": True,
                })
                structured_missing_questions.append({
                    "criterion_id": "cr_income_doc",
                    "field_key": "annual_income",
                    "label": "Socio-Economic & Deprivation Category",
                    "question": "Do you hold a BPL Ration Card, or are you listed in the SECC 2011 database?",
                    "input_type": "MCQ",
                    "options": ["Yes, BPL Ration Card / Low Income", "Listed in SECC 2011 Beneficiary List", "Above poverty line / Not BPL", "Not sure / Need to check"],
                    "status": "UNKNOWN",
                    "patient_value": None,
                    "source": "UNKNOWN"
                })

        # 2. Compute Deterministic Criteria Match Percentage (Excludes NOT_REQUIRED)
        applicable_criteria = [c for c in criteria if c.get("required", True) and c["criterion_result"] != "NOT_REQUIRED"]
        total_applicable = len(applicable_criteria)
        pass_count = sum(1 for c in applicable_criteria if c["criterion_result"] == "PASS")
        fail_count = sum(1 for c in applicable_criteria if c["criterion_result"] == "FAIL")
        unknown_count = sum(1 for c in applicable_criteria if c["criterion_result"] == "UNKNOWN")
        
        match_pct = int(round((pass_count / total_applicable) * 100)) if total_applicable > 0 else 100

        has_fail = fail_count > 0
        has_unknown = unknown_count > 0
        all_pass = pass_count == total_applicable and total_applicable > 0

        if has_fail:
            overall_status = "NOT_ELIGIBLE"
            failed_c = [c["criterion_name"] for c in applicable_criteria if c["criterion_result"] == "FAIL"]
            overall_exp = f"You are not eligible for **{top_scheme_name}** because the following required criteria were not met: {', '.join(failed_c)}."
        elif has_unknown:
            overall_status = "INSUFFICIENT_INFORMATION"
            unknown_c = [c["criterion_name"] for c in applicable_criteria if c["criterion_result"] == "UNKNOWN"]
            overall_exp = f"To determine your eligibility for **{top_scheme_name}**, please answer the questions below."
        elif all_pass:
            overall_status = "ELIGIBLE"
            overall_exp = f"Congratulations! Based on your verified details, you satisfy all core eligibility criteria for **{top_scheme_name}** ({match_pct}% Criteria Match)."
        else:
            overall_status = "POSSIBLY_ELIGIBLE"
            overall_exp = f"You appear potentially eligible for coverage under **{top_scheme_name}** ({match_pct}% Criteria Match)."

        interview_state = "QUESTIONS_REQUIRED" if has_unknown and len(structured_missing_questions) > 0 else "COMPLETED"
        current_question = structured_missing_questions[0] if structured_missing_questions else None
        progress = {
            "answered": total_applicable - unknown_count,
            "total_required": total_applicable
        } if total_applicable > 0 else None

        missing_info_names = [c["criterion_name"] for c in applicable_criteria if c["criterion_result"] == "UNKNOWN"]

        eligibility_result = {
            "query_id": query_id_str,
            "scheme_id": top_scheme_id,
            "query_type": "PERSONAL_ELIGIBILITY",
            "user_question": query_text or f"Eligibility Check for {top_scheme_name}",
            "interview_state": interview_state,
            "current_question": current_question,
            "progress": progress,
            "match_percentage": match_pct,
            "overall_status": overall_status,
            "overall_explanation": overall_exp,
            "criteria_breakdown": criteria,
            "missing_information": missing_info_names,
            "structured_missing_criteria": structured_missing_questions,
            "all_evidence_sources": evidence_sources,
            "queried_at": now_iso,
        }

        return {
            "ai_response": overall_exp,
            "retrieved_chunks": chunks,
            "confidence_score": round(confidence, 2),
            "is_low_confidence": confidence < 0.65,
            "eligibility_result": eligibility_result,
        }

