"""
RAG Pipeline — queries the vector store, aggregates text excerpts from healthcare_schemes.json,
and runs Gemini LLM to generate eligibility/benefit explanations and criterion breakdowns.
Supports single-scheme and multi-scheme eligibility evaluation over 20 supported schemes
(9 Tamil Nadu + 11 Central Government).
Includes caching and follow-up suggestions.
"""

import re
import os
import json
import logging
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore, _cosine_similarity
from app.core.cache import rag_cache


def compress_context_with_citations(
    chunks: List[Tuple[str, Dict[str, Any], float]],
    max_chunks: int = 5,
    min_score: float = 0.3
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Compresses retrieved chunks by keeping only the most relevant ones above a threshold.
    Adds citation information to each chunk.
    Returns (compressed_chunks, citation_metadata).
    """
    # Filter by minimum score
    filtered = [(text, meta, score) for text, meta, score in chunks if score >= min_score]
    
    # Keep top-k chunks
    top_chunks = filtered[:max_chunks]
    
    compressed_texts = []
    citations = []
    
    for idx, (text, meta, score) in enumerate(top_chunks):
        compressed_texts.append(text)
        citations.append({
            "chunk_id": f"chk_{idx+1}",
            "document_title": meta.get("scheme_name", "Government Scheme"),
            "page_number": 1,
            "excerpt": text[:200] + "..." if len(text) > 200 else text,
            "official_url": meta.get("official_url", ""),
            "relevance_score": round(score, 3),
            "source": "hybrid_search"
        })
    
    return compressed_texts, citations


def generate_follow_up_suggestions(
    query_type: str,
    scheme_name: Optional[str] = None,
    query_text: str = ""
) -> List[str]:
    """
    Generates relevant follow-up questions based on query type and context.
    """
    suggestions = []
    
    query_lower = query_text.lower()
    
    # Generic suggestions for all query types
    if query_type == "PERSONAL_ELIGIBILITY":
        suggestions = [
            "What documents are required?",
            "How to apply for this scheme?",
            "What is the coverage amount?",
            "Where can I get treatment?",
        ]
    elif query_type == "COVERAGE_QUERY":
        suggestions = [
            "What treatments are excluded?",
            "Which hospitals are empanelled?",
            "Is there a cashless facility?",
            "What documents are needed?",
        ]
    elif query_type == "REQUIREMENTS_QUERY":
        suggestions = [
            "How to apply online?",
            "What is the application process?",
            "Where to submit documents?",
            "What is the processing time?",
        ]
    elif query_type == "APPLICATION_QUERY":
        suggestions = [
            "What are the eligibility criteria?",
            "What is the coverage amount?",
            "Which hospitals are empanelled?",
            "How long does approval take?",
        ]
    elif query_type == "RENEWAL_QUERY":
        suggestions = [
            "What is the validity period?",
            "How to check renewal status?",
            "What if I miss renewal deadline?",
            "Is there a renewal fee?",
        ]
    elif query_type == "HOSPITAL_NETWORK_QUERY":
        suggestions = [
            "Is cashless treatment available?",
            "What documents are needed at hospital?",
            "How to find empanelled hospitals?",
            "What is the claim process?",
        ]
    elif query_type == "COMPARISON_QUERY":
        suggestions = [
            "Which has better coverage?",
            "What are the eligibility differences?",
            "Which is easier to apply for?",
            "Compare benefits side by side",
        ]
    elif query_type == "GENERAL_INFORMATION":
        suggestions = [
            "Am I eligible for this scheme?",
            "What documents are required?",
            "How to apply?",
            "What treatments are covered?",
        ]
    elif query_type == "MULTI_SCHEME_ELIGIBILITY_QUERY":
        suggestions = [
            "Compare the top schemes",
            "What documents are needed?",
            "How to apply for these schemes?",
            "Which has the highest coverage?",
        ]
    
    # Context-aware suggestions
    if scheme_name:
        scheme_short = scheme_name.split("(")[0].strip() if "(" in scheme_name else scheme_name[:30]
        if "not pregnant" in query_lower or "pregnancy" in query_lower:
            suggestions.append("What maternity schemes are available?")
        if "senior" in query_lower or "70" in query_lower or "elderly" in query_lower:
            suggestions.append("What other schemes for seniors?")
        if "disabled" in query_lower or "disability" in query_lower:
            suggestions.append("What schemes for persons with disabilities?")
    
    # Return unique suggestions, max 4
    return list(dict.fromkeys(suggestions))[:4]
from app.rag.scheme_rules import (
    analyze_scheme,
    assess_coverage_from_json,
    build_scheme_context_block,
    determine_intake_questions,
    evaluate_scheme_from_json,
    filter_schemes_by_profile,
    is_tn_scheme,
    lexical_score,
    relevance_score,
)

logger = logging.getLogger("app.rag.pipeline")

# ─── Lazy VectorStore singleton ─────────────────────────────────────────────
_vector_store: VectorStore | None = None


def _get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
        # Ensure BM25 index is built for keyword search fallback
        if _vector_store.bm25_index is None and _vector_store.documents:
            _vector_store._build_bm25_index()
    else:
        _vector_store.reload_if_changed()
    return _vector_store


# ─── Cached scheme data ─────────────────────────────────────────────────────
_cached_schemes: List[Dict[str, Any]] | None = None


def _load_all_schemes() -> List[Dict[str, Any]]:
    """Loads all supported 20 schemes from healthcare_schemes.json (cached after first load)."""
    global _cached_schemes
    if _cached_schemes is not None:
        return _cached_schemes
    possible_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "healthcare_schemes.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "healthcare_schemes.json")),
        os.path.abspath("healthcare_schemes.json"),
    ]
    for p in possible_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    _cached_schemes = json.load(f)
                    return _cached_schemes
            except Exception:
                pass
    return []


# ─── Gemini LLM Client ──────────────────────────────────────────────────────
def _get_api_keys() -> List[str]:
    """Get all configured Google API keys for rotation."""
    keys = []
    # Primary key
    primary = getattr(settings, "GOOGLE_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
    if primary:
        keys.append(primary)
    # Secondary keys for rotation
    for i in range(2, 6):
        key = os.getenv(f"GOOGLE_API_KEY_{i}", "") or getattr(settings, f"GOOGLE_API_KEY_{i}", "")
        if key and key not in keys:
            keys.append(key)
    return keys


def _get_genai_client(api_key: Optional[str] = None):
    """Returns a Google GenAI client using the configured API key."""
    try:
        from google import genai
        if not api_key:
            api_key = getattr(settings, "GOOGLE_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return None
        return genai.Client(api_key=api_key)
    except ImportError:
        logger.warning("[RAG] google-genai package not installed. LLM generation disabled.")
        return None


async def _generate_llm_response(
    query_text: str,
    retrieved_chunks: List[str],
    scheme_name: str,
    query_type: str,
    patient_context: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    """
    Calls Gemini LLM with retrieved RAG chunks as context to generate an intelligent,
    grounded response. Uses context compression and API key rotation.
    Returns None on failure so caller can use template fallback.
    """
    api_keys = _get_api_keys()
    if not api_keys:
        logger.warning("[RAG] No GOOGLE_API_KEY configured. LLM generation disabled.")
        return None

    # Context compression: Use only top 5 most relevant chunks
    context_text = "\n\n---\n\n".join(retrieved_chunks[:5])  # Compressed to top 5 chunks

    patient_info = ""
    if patient_context:
        parts = []
        for key, label in [
            ("age", "Age"),
            ("state", "State"),
            ("annual_income", "Annual Income"),
            ("gender", "Gender"),
            ("employment_status", "Employment"),
            ("disability_status", "Disability"),
            ("pregnancy_status", "Pregnancy"),
        ]:
            if patient_context.get(key) not in (None, ""):
                parts.append(f"{label}: {patient_context[key]}")
        if parts:
            patient_info = f"\n\nPatient Details: {', '.join(parts)}"

    system_prompt = (
        "You are an expert Indian healthcare scheme advisor. Answer ONLY from the official scheme records "
        "and excerpts provided. Do not invent packages, income limits, or eligibility rules. "
        "Do not output tool calls, function calls, shell commands, JSON tool syntax, or instructions to run software. "
        "Write a plain-language answer for the patient. If the records do not contain the answer, say so. "
        "Use bullet points. Always name the scheme(s) you are discussing. Ignore criteria that do not apply to this patient."
    )

    if query_type == "COVERAGE_QUERY":
        task = f"Based on the official excerpts below, answer whether the following treatment/procedure is covered under {scheme_name} and explain the coverage details, limits, and any exclusions."
    elif query_type == "REQUIREMENTS_QUERY":
        task = f"Based on the official excerpts below, list ALL eligibility criteria, required documents, and application process for {scheme_name}. Be specific and thorough."
    elif query_type == "APPLICATION_QUERY":
        task = f"Based on the official excerpts below, explain how to apply for {scheme_name}, including the application process, required documents, and contact information."
    elif query_type == "RENEWAL_QUERY":
        task = f"Based on the official excerpts below, explain the renewal process, validity period, and duration of benefits for {scheme_name}."
    elif query_type == "HOSPITAL_NETWORK_QUERY":
        task = f"Based on the official excerpts below, explain the hospital network, empanelled facilities, and where treatment can be availed under {scheme_name}."
    elif query_type == "COMPARISON_QUERY":
        task = f"Based on the official excerpts below, provide a comparison of {scheme_name} with other similar schemes, highlighting key differences in coverage, eligibility, and benefits."
    elif query_type == "GENERAL_INFORMATION":
        task = f"Based on the official excerpts below, provide a comprehensive overview of {scheme_name} including: what it covers, who it's for, coverage amount, and how to apply."
    else:  # PERSONAL_ELIGIBILITY
        task = f"Based on the official excerpts and the patient's details below, assess whether this patient is likely eligible for {scheme_name}. Explain which criteria they meet and which they don't."

    prompt = f"""{task}

User Question: {query_text}
{patient_info}

--- Official Document Excerpts for {scheme_name} ---
{context_text}
--- End of Excerpts ---

Provide a clear, structured answer:"""

    # Try each API key with rotation
    for key_idx, api_key in enumerate(api_keys):
        client = _get_genai_client(api_key)
        if not client:
            continue

        try:
            model_name = getattr(settings, "GEMINI_MODEL", "gemini-3.8-flash") or "gemini-3.8-flash"
            chat = client.aio.chats.create(
                model=model_name,
                config={
                    "system_instruction": system_prompt,
                    "temperature": 0.3,
                    "max_output_tokens": 1024,
                },
            )
            response = await chat.send_message(prompt)
            if response and response.text:
                logger.info("[RAG] LLM generation success with API key %d", key_idx + 1)
                return response.text.strip()
        except Exception as e:
            err_str = str(e).lower()
            # Check for quota exhausted errors
            if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                logger.warning("[RAG] API key %d quota exhausted, trying next key", key_idx + 1)
                continue  # Try next API key
            logger.warning("[RAG] LLM generation failed with API key %d: %s", key_idx + 1, e)
        finally:
            try:
                client.close()
            except Exception:
                pass
            try:
                await client.aio.aclose()
            except Exception:
                pass

    logger.warning("[RAG] All API keys exhausted for LLM generation")
    return None



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
    if "tamil nadu" in val_str or "tamilnadu" in val_str or "chennai" in val_str or val_str == "tn":
        return "Tamil Nadu"
    if "central" in val_str or "india" in val_str or "all india" in val_str:
        return "India (All States)"
    if any(s in val_str for s in ["kerala", "karnataka", "andhra", "telangana", "maharashtra", "delhi", "other"]):
        return "Other State/UT"
    return "Tamil Nadu" if "tamil" in val_str else None


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


def _parse_employment_val(raw_val: Any) -> Optional[str]:
    """Extracts employment status from text. More specific labels are matched first."""
    if not raw_val:
        return None
    val_str = str(raw_val).lower().strip()
    if any(term in val_str for term in ["unemployed", "no job", "homemaker", "housewife"]):
        return "Unemployed"
    if any(term in val_str for term in ["student", "studying"]):
        return "Student"
    if any(term in val_str for term in ["retired", "pensioner"]):
        return "Retired/Pensioner"
    if any(term in val_str for term in ["self-employed", "self employed", "business", "entrepreneur", "freelance"]):
        return "Self-Employed"
    if any(term in val_str for term in ["private", "company", "corporate", "mnc", "organised sector", "organized sector"]):
        return "Private Sector Employee"
    if any(term in val_str for term in ["government employee", "govt employee", "central govt", "state govt", "public sector", "cghs"]):
        return "Government Employee"
    if "government" in val_str and "employee" in val_str:
        return "Government Employee"
    return None


def _parse_disability_val(raw_val: Any) -> Optional[str]:
    """Extracts disability status from text."""
    if not raw_val:
        return None
    val_str = str(raw_val).lower().strip()
    if val_str in {"no", "n", "false", "none"}:
        return "No"
    if val_str in {"yes", "y", "true"}:
        return "Yes"
    if re.search(r"\b(no|none|without|not)\b.*\b(disabilit|disabled|handicap)", val_str) or val_str in {"normal", "able"}:
        return "No"
    if re.search(r"\b(disabled|disability|handicap|special needs|cerebral palsy|autism|udid)\b", val_str):
        return "Yes"
    if re.search(r"\byes\b", val_str):
        return "Yes"
    if re.search(r"\bno\b", val_str):
        return "No"
    return None


def _parse_pregnancy_val(raw_val: Any) -> Optional[str]:
    """Extracts pregnancy status from text."""
    if not raw_val:
        return None
    val_str = str(raw_val).lower().strip()
    # Handle frontend values (case-insensitive)
    if val_str in {"no", "n", "false", "not applicable"}:
        return "No"
    if val_str in {"yes", "y", "true"}:
        return "Yes"
    # Handle trimester values as pregnant (case-insensitive - match both "first trimester" and "First Trimester")
    if any(t in val_str for t in ["first trimester", "second trimester", "third trimester"]):
        return "Yes"
    # Postpartum could mean recently pregnant, but for eligibility we treat as not currently pregnant
    if val_str == "postpartum":
        return "No"
    if re.search(r"\b(not pregnant|not expecting|no longer pregnant)\b", val_str) or re.search(r"\bno\b", val_str):
        return "No"
    if re.search(r"\b(pregnant|expecting|lactating)\b", val_str) or re.search(r"\byes\b", val_str):
        return "Yes"
    return None


def _determine_relevant_questions(
    patient_context: Optional[Dict[str, Any]],
    additional_info: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Ask only state, age, and income for multi-scheme matching."""
    return determine_intake_questions(patient_context, additional_info)


def _filter_schemes_by_basic_criteria(
    all_schemes: List[Dict[str, Any]],
    gender: Optional[str],
    age: Optional[int],
    employment: Optional[str],
    disability: Optional[str],
    pregnancy: Optional[str],
    state: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Remove schemes the official JSON record makes inapplicable."""
    return filter_schemes_by_profile(
        all_schemes,
        gender=gender,
        age=age,
        employment=employment,
        disability=disability,
        pregnancy=pregnancy,
        state=state,
    )


MULTI_SCHEME_PATTERNS = [
    r'\bwhat\s+(?:government\s+|healthcare\s+|medical\s+)?schemes?\s+(?:am\s+i|are\s+we|can\s+i|could\s+i|do\s+i)\s+(?:eligible\s+for|qualify\s+for|apply\s+for|get)\b',
    r'\bwhich\s+(?:government\s+|healthcare\s+|medical\s+)?schemes?\s+(?:can\s+i|could\s+i|am\s+i|are\s+available|apply|do\s+i|may\s+i\s+qualify)\b',
    r'\bfind\s+(?:all\s+)?(?:government\s+|healthcare\s+|medical\s+)?schemes?\s+(?:for\s+me|for\s+my\s+family|available)\b',
    r'\bwhat\s+(?:government\s+|healthcare\s+|medical\s+)?schemes?\s+are\s+available\b',
    r'\bshow\s+(?:me\s+)?(?:all\s+)?schemes?\s+(?:i\s+qualify\s+for|i\s+am\s+eligible\s+for|available)\b',
    r'\bam\s+i\s+eligible\s+for\s+(?:any|all)\s+(?:government\s+|healthcare\s+)?schemes?\b',
    r'\bcheck\s+my\s+eligibility\s+for\s+(?:all|available|government)\s+schemes?\b',
    r'\blist\s+(?:all\s+)?(?:eligible|available)\s+schemes?\s+(?:for\s+me)?\b',
    r'\bschemes?\s+(?:for\s+me|available\s+to\s+me|i\s+can\s+get)\b',
    r'\bhelp\s+me\s+find\s+(?:healthcare|medical|government)\s+schemes?\b',
    r'\bwhat\s+benefits?\s+(?:can\s+i|do\s+i)\s+(?:get|qualify\s+for|receive)\b',
    r'\bsearch\s+(?:for\s+)?(?:healthcare|medical)\s+schemes?\b',
    r'\beligible\s+schemes?\b',
    r'\bapply\s+for\s+(?:healthcare|medical)\s+schemes?\b',
    # Thematic multi-scheme query patterns
    r'\b(?:what|which|list|show|available)\s+(?:maternity|pregnancy|pregnant|maternal|mother)\s+(?:benefits?|schemes?|support|assistance)\b',
    r'\b(?:what|which|list|show)\s+(?:healthcare|medical|government)\s+schemes?\s+(?:are\s+available\s+in\s+tamil\s+nadu|in\s+tamil\s+nadu|in\s+tn)\b',
    r'\b(?:what|which|list|show)\s+schemes?\s+(?:can\s+help\s+with|for)\s+(?:hospital\s+expenses|hospitalization|hospital\s+bills|surgery\s+expenses|medical\s+expenses)\b',
    r'\b(?:what|which|list|show)\s+(?:senior|elderly|geriatric|disability|disabled)\s+schemes?\b',
]


def _classify_query_type(query_text: str, scoped_scheme_id: Optional[str] = None) -> str:
    """
    Classifies the user query into distinct workflow categories with enhanced intent detection:
    1. MULTI_SCHEME_ELIGIBILITY_QUERY: Open-ended multi-scheme discovery questions.
    2. COVERAGE_QUERY: Questions about treatments, procedures, package inclusions/exclusions.
    3. REQUIREMENTS_QUERY: Informational questions about eligibility rules, income limits, documents.
    4. APPLICATION_QUERY: Questions about how to apply, enrollment process, contact info.
    5. RENEWAL_QUERY: Questions about renewal process, validity period.
    6. HOSPITAL_NETWORK_QUERY: Questions about empanelled hospitals, network facilities.
    7. COMPARISON_QUERY: Questions comparing schemes.
    8. GENERAL_INFORMATION: Overview, benefits, department, general FAQs.
    9. PERSONAL_ELIGIBILITY: User asking if they personally qualify for a specific scheme.
    """
    q = (query_text or "").lower().strip()

    # If scoped to a single scheme, do not treat as multi-scheme query
    if not scoped_scheme_id:
        if any(re.search(p, q) for p in MULTI_SCHEME_PATTERNS):
            return "MULTI_SCHEME_ELIGIBILITY_QUERY"

    is_personal_intent = any(p in q for p in [
        "am i eligible", "am i qualifying", "can i apply", "can i get", "i am", "my age", "my income", "my family", "my father", "my mother", "we are"
    ])

    # 1. Comparison Queries
    comparison_patterns = [
        r'\bcompare\b',
        r'\bwhich\s+is\s+better\b',
        r'\bdifference\s+between\b',
        r'\bvs\b',
        r'\bversus\b',
    ]
    if any(re.search(p, q) for p in comparison_patterns) and not is_personal_intent:
        return "COMPARISON_QUERY"

    # 2. Application / Enrollment / Contact Queries
    application_patterns = [
        r'\b(?:how\s+to\s+apply|application\s+process|enrollment\s+process|where\s+to\s+apply|documents\s+to\s+apply)\b',
        r'\b(?:contact|helpline|phone|email|address|office)\b',
        r'\b(?:register|signup|sign\s+up|enroll)\b',
        r'\b(?:apply\s+online|offline\s+application)\b',
    ]
    if any(re.search(p, q) for p in application_patterns) and not is_personal_intent:
        return "APPLICATION_QUERY"

    # 3. Renewal / Validity Queries
    renewal_patterns = [
        r'\b(?:renew|renewal|valid|validity|expire|expiry|duration|period)\b',
        r'\b(?:how\s+long|valid\s+for|how\s+to\s+renew)\b',
    ]
    if any(re.search(p, q) for p in renewal_patterns) and not is_personal_intent:
        return "RENEWAL_QUERY"

    # 4. Hospital Network Queries
    hospital_patterns = [
        r'\b(?:hospital|clinic|facility|network|empanelled|empanel)\b',
        r'\b(?:where\s+can\s+i|which\s+hospitals|list\s+of\s+hospitals)\b',
        r'\b(?:near\s+me|nearby|location)\b',
    ]
    if any(re.search(p, q) for p in hospital_patterns) and not is_personal_intent:
        return "HOSPITAL_NETWORK_QUERY"

    # 5. Requirements / Document Queries (Informational, general requirements)
    requirements_indicators = [
        r'\b(?:what\s+are\s+the\s+)?(?:income\s+(?:and|&)\s+document|documents?\s+(?:and|&)\s+income)\s+requirements?\b',
        r'\b(?:documents?|papers?|certificates?|proofs?)\s+(?:required|needed|mandatory|list)\b',
        r'\b(?:what\s+are\s+the\s+)?(?:income\s+limits?|income\s+criteria|income\s+requirements?|eligibility\s+criteria|eligibility\s+rules?|requirements?)\b',
        r'\blist\s+of\s+(?:documents?|requirements?|criteria)\b',
    ]
    if any(re.search(p, q) for p in requirements_indicators) and not is_personal_intent:
        return "REQUIREMENTS_QUERY"

    # 6. Coverage / Treatment / Procedure Queries
    coverage_patterns = [
        r'\b(?:is|does|are|can)\b.*\b(?:cover|covered|coverage|included|include|payable|paid|treat|treatment|procedure)\b',
        r'\b(?:cosmetic|aesthetic|tattoo|cataract|cardiac|oncology|surgery|dialysis|chemotherapy|transplant|maternity|dental|opd|emergency)\b',
        r'\bwhat\s+(?:treatments?|diseases?|procedures?|illnesses?|conditions?|operations?|surgeries)\s+(?:are|is)?\s*covered\b',
        r'\b(?:covered\s+procedures?|covered\s+conditions?|exclusions?|package\s+rates?)\b',
    ]
    if any(re.search(p, q) for p in coverage_patterns) and not is_personal_intent:
        return "COVERAGE_QUERY"

    # 7. General Information Queries
    overview_patterns = [
        r'\bwhat\s+is\s+(?:pm-?jay|cmchis|ayushman|the\s+scheme)\b',
        r'\btell\s+me\s+about\b',
        r'\bwhat\s+(?:benefits|coverage\s+amount|sum\s+insured)\s+(?:does|is)\b',
        r'\boverview\b',
        r'\b(?:benefits|features|details|information)\b',
    ]
    if any(re.search(p, q) for p in overview_patterns) and not is_personal_intent:
        return "GENERAL_INFORMATION"

    # 8. Default: Personal Eligibility Evaluation
    return "PERSONAL_ELIGIBILITY"


# ─── Comprehensive 20 Supported Schemes Map ───────────────────────────────────
ALL_SCHEMES_MAP = {
    # Central Government Schemes (11)
    "scheme_C01": {
        "id": "scheme_C01",
        "name": "Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
        "url": "https://pmjay.gov.in/",
        "aliases": ["pm-jay", "pmjay", "ab-pmjay", "ab pmjay", "ayushman bharat", "jan arogya", "pm jay"]
    },
    "scheme_C02": {
        "id": "scheme_C02",
        "name": "Ayushman Vay Vandana Card (PM-JAY for 70+)",
        "url": "https://pmjay.gov.in/",
        "aliases": ["vay vandana", "vaya vandana", "vayavandana", "vayvandana", "70+", "70 plus", "70 or above", "70 years", "senior citizen card", "pmjay 70", "pm-jay 70", "ayushman 70"]
    },
    "scheme_C03": {
        "id": "scheme_C03",
        "name": "Central Government Health Scheme (CGHS)",
        "url": "https://cghs.nic.in/",
        "aliases": ["cghs", "central government health scheme", "central employee health", "central pensioner health"]
    },
    "scheme_C04": {
        "id": "scheme_C04",
        "name": "Employees' State Insurance Scheme (ESIC)",
        "url": "https://www.esic.gov.in/",
        "aliases": ["esic", "esi scheme", "employees state insurance", "esi hospital", "insured person"]
    },
    "scheme_C05": {
        "id": "scheme_C05",
        "name": "Niramaya Health Insurance Scheme",
        "url": "https://thenationaltrust.gov.in/",
        "aliases": ["niramaya", "national trust", "autism health", "cerebral palsy", "multiple disabilities", "mental retardation", "disability insurance"]
    },
    "scheme_C06": {
        "id": "scheme_C06",
        "name": "Rashtriya Arogya Nidhi (RAN)",
        "url": "https://mohfw.gov.in/",
        "aliases": ["rashtriya arogya nidhi", "ran", "rare disease fund", "revolving fund financial assistance", "bpl life threatening financial assistance"]
    },
    "scheme_C07": {
        "id": "scheme_C07",
        "name": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
        "url": "https://pmmvy.wcd.gov.in/",
        "aliases": ["pmmvy", "matru vandana", "maternity benefit yojana", "pregnancy cash", "first child cash"]
    },
    "scheme_C08": {
        "id": "scheme_C08",
        "name": "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)",
        "url": "https://pmsma.nhp.gov.in/",
        "aliases": ["pmsma", "surakshit matritva", "antenatal checkup", "free anc 9th", "maternal checkup"]
    },
    "scheme_C09": {
        "id": "scheme_C09",
        "name": "Janani Shishu Suraksha Karyakram (JSSK)",
        "url": "https://nhm.gov.in/",
        "aliases": ["janani shishu", "jssk", "zero out of pocket delivery", "sick infant care", "free delivery cashless"]
    },
    "scheme_C10": {
        "id": "scheme_C10",
        "name": "Janani Suraksha Yojana (JSY)",
        "url": "https://nhm.gov.in/",
        "aliases": ["janani suraksha", "jsy", "institutional delivery cash", "maternal health cash"]
    },
    "scheme_C11": {
        "id": "scheme_C11",
        "name": "National Health Mission (NHM)",
        "url": "https://nhm.gov.in/",
        "aliases": ["national health mission", "nhm", "national rural health", "nrhm", "nuhm", "primary health care center"]
    },

    # Tamil Nadu State Schemes (9)
    "scheme_TN01": {
        "id": "scheme_TN01",
        "name": "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
        "url": "https://cmchistn.com/",
        "aliases": ["cmchis", "tn cmchis", "chief minister comprehensive", "chief minister's comprehensive", "tamil nadu scheme", "tamilnadu insurance", "kalaignar", "maruthuva kaapeedu", "tn insurance"]
    },
    "scheme_TN02": {
        "id": "scheme_TN02",
        "name": "Dr. Muthulakshmi Reddy Maternity Benefit Scheme (MRMBS)",
        "url": "https://picme.tn.gov.in/",
        "aliases": ["muthulakshmi reddy", "muthulakshmi", "mrmbs", "maternity benefit scheme tn", "picme", "tamil nadu pregnancy assistance"]
    },
    "scheme_TN03": {
        "id": "scheme_TN03",
        "name": "Amma Baby Care Kit",
        "url": "https://tnhealth.tn.gov.in/",
        "aliases": ["amma baby care kit", "baby care kit", "amma kit", "newborn kit tn", "postnatal care kit"]
    },
    "scheme_TN04": {
        "id": "scheme_TN04",
        "name": "Amma Arokiya Scheme",
        "url": "https://tnhealth.tn.gov.in/",
        "aliases": ["amma arokiya", "arokiya scheme", "master health checkup tn", "free health screening tn", "free checkup packages"]
    },
    "scheme_TN05": {
        "id": "scheme_TN05",
        "name": "Nammai Kaakkum 48",
        "url": "https://cmchistn.com/",
        "aliases": ["nammai kaakkum", "nammai kaakkum 48", "nk48", "nk-48", "innuyir kaappom", "accident emergency 48", "emergency trauma tn", "first 48 hours free"]
    },
    "scheme_TN06": {
        "id": "scheme_TN06",
        "name": "Nalam 360 – Annual Free Health Check-up for All",
        "url": "https://tnhealth.tn.gov.in/",
        "aliases": ["nalam 360", "nalam360", "annual free health check-up", "preventive screening tn", "wellness screening"]
    },
    "scheme_TN07": {
        "id": "scheme_TN07",
        "name": "Chief Minister's Elderly Health Insurance Scheme",
        "url": "https://tnhealth.tn.gov.in/",
        "aliases": ["elderly health insurance", "chief minister elderly", "senior citizen tn insurance", "tn geriatric insurance", "elderly scheme tn"]
    },
    "scheme_TN08": {
        "id": "scheme_TN08",
        "name": "Tamil Nadu New Health Insurance Scheme 2026 (Employees)",
        "url": "https://tn.gov.in/",
        "aliases": ["nhis employees", "tn new health insurance employees", "tn government employee insurance", "tamil nadu government servant health", "nhis 2026"]
    },
    "scheme_TN09": {
        "id": "scheme_TN09",
        "name": "Tamil Nadu New Health Insurance Scheme 2026 (Pensioners)",
        "url": "https://tn.gov.in/",
        "aliases": ["nhis pensioners", "tn pensioner health insurance", "tamil nadu pensioner health", "pensioner medical cover tn"]
    }
}


def resolve_scheme_context(
    query_text: str,
    scoped_scheme_id: Optional[str] = None,
    vector_store: Optional[VectorStore] = None
) -> Tuple[str, str, str]:
    """
    Deterministically resolves and locks (scheme_id, scheme_name, official_url) across all 20 supported schemes.
    1. If scoped_scheme_id is provided, match that exact scheme from known schemes / vectorstore.
    2. Otherwise, scan query_text for explicit scheme names, acronyms, or keywords.
    3. If query mentions an unsupported state scheme, flag it without silently switching to PM-JAY.
    4. Handle thematic query resolution (maternity, Tamil Nadu, elderly, disability, hospitalization).
    5. If query is entirely unrecognized / unrelated to healthcare schemes, return UNRECOGNIZED_SCHEME.
    """
    q_low = (query_text or "").lower()

    # 1. Scoped Scheme ID lookup
    if scoped_scheme_id:
        if scoped_scheme_id in ALL_SCHEMES_MAP:
            s = ALL_SCHEMES_MAP[scoped_scheme_id]
            return s["id"], s["name"], s["url"]
        if vector_store:
            for doc in vector_store.documents:
                meta = doc.get("metadata", {})
                if meta.get("scheme_id") == scoped_scheme_id:
                    return meta.get("scheme_id"), meta.get("scheme_name", "Government Healthcare Scheme"), meta.get("official_url", "https://pmjay.gov.in")
        return scoped_scheme_id, "Government Healthcare Scheme", "https://pmjay.gov.in"

    # 2. Check for unsupported state schemes
    unsupported_state_keywords = [
        "karunya", "arogya karnataka", "aarogyasri", "swasthya sathi", "mahatma jyotiba phule",
        "bhamashah", "chiranjeevi", "mukhyamantri amrutum", "yeshasvini"
    ]
    if any(kw in q_low for kw in unsupported_state_keywords):
        return "SCHEME_NOT_SUPPORTED", "Unsupported State Healthcare Scheme", "https://pmjay.gov.in"

    # 3. Match in query text against all 20 schemes (order by longest specific alias first)
    priority_order = [
        "scheme_C02", "scheme_TN02", "scheme_TN03", "scheme_TN04", "scheme_TN05",
        "scheme_TN06", "scheme_TN07", "scheme_TN08", "scheme_TN09", "scheme_C03",
        "scheme_C04", "scheme_C05", "scheme_C06", "scheme_C07", "scheme_C08",
        "scheme_C09", "scheme_C10", "scheme_C11", "scheme_TN01", "scheme_C01"
    ]

    for s_id in priority_order:
        scheme_info = ALL_SCHEMES_MAP[s_id]
        for alias in scheme_info["aliases"]:
            if alias in q_low:
                return scheme_info["id"], scheme_info["name"], scheme_info["url"]

    # 4. Thematic keyword routing when no explicit scheme name is mentioned
    if any(w in q_low for w in ["maternity", "pregnant", "pregnancy", "lactating", "delivery", "antenatal"]):
        s = ALL_SCHEMES_MAP["scheme_TN02"] if "tamil" in q_low or "tn" in q_low else ALL_SCHEMES_MAP["scheme_C07"]
        return s["id"], s["name"], s["url"]

    if any(w in q_low for w in ["elderly", "senior", "geriatric", "old age"]):
        s = ALL_SCHEMES_MAP["scheme_TN07"] if "tamil" in q_low or "tn" in q_low else ALL_SCHEMES_MAP["scheme_C02"]
        return s["id"], s["name"], s["url"]

    if any(w in q_low for w in ["disability", "disabled", "handicap", "autism", "cerebral palsy", "udid"]):
        s = ALL_SCHEMES_MAP["scheme_C05"]
        return s["id"], s["name"], s["url"]

    if any(w in q_low for w in ["accident", "road accident", "trauma", "emergency trauma", "48 hours", "innuyir"]):
        s = ALL_SCHEMES_MAP["scheme_TN05"]
        return s["id"], s["name"], s["url"]

    if any(w in q_low for w in ["tamil nadu", "tamilnadu", "chennai", "state scheme"]):
        s = ALL_SCHEMES_MAP["scheme_TN01"]
        return s["id"], s["name"], s["url"]

    if any(w in q_low for w in ["hospital expenses", "hospitalization", "hospital bill", "cashless", "insurance", "ayushman", "health cover", "surgery cover"]):
        s = ALL_SCHEMES_MAP["scheme_C01"]
        return s["id"], s["name"], s["url"]

    # 5. Non-healthcare / unrecognized query -> explicit unrecognized marker
    return "UNRECOGNIZED_SCHEME", "Unrecognized Healthcare Scheme", ""


def _evaluate_scheme_criteria(
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
    """Evaluate only criteria present in healthcare_schemes.json."""
    return evaluate_scheme_from_json(
        scheme=scheme,
        effective_state=effective_state,
        effective_age=effective_age,
        effective_income=effective_income,
        effective_employment=effective_employment,
        effective_disability=effective_disability,
        effective_pregnancy=effective_pregnancy,
        gender=gender,
        evidence_sources=evidence_sources,
        state_source=state_source,
        age_source=age_source,
        income_source=income_source,
    )



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
        Distinguishes MULTI_SCHEME_ELIGIBILITY_QUERY, COVERAGE_QUERY, REQUIREMENTS_QUERY, GENERAL_INFORMATION, and PERSONAL_ELIGIBILITY.
        Includes caching and follow-up suggestions.
        """
        vector_store = _get_vector_store()
        query_type = _classify_query_type(query_text, scoped_scheme_id)

        # Check cache first (for informational queries only, not personal eligibility)
        cache_key = f"rag:{hashlib.md5((query_text + str(scoped_scheme_id)).encode()).hexdigest()}"
        if query_type in ["GENERAL_INFORMATION", "REQUIREMENTS_QUERY", "APPLICATION_QUERY", "RENEWAL_QUERY", "HOSPITAL_NETWORK_QUERY"]:
            cached = rag_cache.get(cache_key)
            if cached:
                logger.info("[RAG] Cache hit for query")
                return cached

        now_iso = datetime.now(timezone.utc).isoformat()
        query_id_str = f"q_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        q_lower = (query_text or "").lower()

        # Comparisons need evidence for every scheme in the answer. Resolve explicit
        # names first; otherwise select the most relevant scheme records by lexical match.
        if query_type == "COMPARISON_QUERY":
            schemes = _load_all_schemes()
            named_ids = {
                scheme_id
                for scheme_id, scheme in ALL_SCHEMES_MAP.items()
                if any(alias.lower() in q_lower for alias in [scheme.get("name", ""), *scheme.get("aliases", [])])
            }
            named = [
                s for s in schemes
                if s.get("scheme_id") in named_ids or s.get("scheme_name", "").lower() in q_lower
            ]
            comparison_terms = re.sub(
                r"\b(compare|comparison|between|against|versus|vs|scheme|schemes|government|healthcare|and|with|the|a|an)\b",
                " ", query_text, flags=re.IGNORECASE,
            ).strip()
            ranked = sorted(
                schemes,
                key=lambda s: lexical_score(comparison_terms, " ".join([
                    s.get("scheme_name", ""), s.get("benefits_summary", ""),
                    " ".join(s.get("key_covered_conditions") or []),
                ])),
                reverse=True,
            )
            relevant = [s for s in ranked if lexical_score(comparison_terms, " ".join([
                s.get("scheme_name", ""), s.get("benefits_summary", ""),
                " ".join(s.get("key_covered_conditions") or []),
            ])) > 0]
            selected = (named + [s for s in relevant if s not in named])[:3]
            if len(selected) >= 2:
                cards, comparison_context = [], []
                for s in selected:
                    name = s.get("scheme_name", "Government scheme")
                    conditions = s.get("key_covered_conditions") or []
                    exclusions = s.get("key_exclusions") or []
                    criteria = s.get("eligibility_criteria") or {}
                    docs = criteria.get("required_documents", []) if isinstance(criteria, dict) else []
                    excerpt = (
                        f"Scheme: {name}\nCoverage: {s.get('coverage_amount_inr', 'Not specified')}\n"
                        f"Benefits: {s.get('benefits_summary', 'Not specified')}\n"
                        f"Covered conditions: {', '.join(conditions) or 'Not specified'}\n"
                        f"Eligibility: {json.dumps(criteria, ensure_ascii=False)}\n"
                        f"Required documents: {', '.join(docs) if docs else 'Not specified'}\n"
                        f"Exclusions: {', '.join(exclusions) or 'Not specified'}"
                    )
                    comparison_context.append(excerpt)
                    cards.append({"chunk_id": f"cmp_{s.get('scheme_id')}",
                        "scheme_id": s.get("scheme_id"), "scheme_name": name,
                        "excerpt": excerpt, "official_url": s.get("official_url", "")})
                answer = "\n\n".join(comparison_context)
                llm_answer = await _generate_llm_response(
                    query_text=query_text, retrieved_chunks=comparison_context,
                    scheme_name="the selected schemes", query_type="COMPARISON_QUERY",
                    patient_context=patient_context)
                if llm_answer:
                    answer = llm_answer
                evidence = [{"chunk_id": c["chunk_id"], "document_title": c["scheme_name"],
                    "page_number": None, "excerpt": c["excerpt"], "official_url": c["official_url"],
                    "relevance_score": 0.75} for c in cards]
                return {"ai_response": answer, "retrieved_chunks": cards,
                    "confidence_score": 0.75, "is_low_confidence": False,
                    "follow_up_suggestions": generate_follow_up_suggestions("COMPARISON_QUERY", None, query_text),
                    "eligibility_result": {"query_id": query_id_str,
                        "scheme_id": selected[0].get("scheme_id"), "query_type": "COMPARISON",
                        "user_question": query_text, "interview_state": "COMPLETED",
                        "current_question": None, "progress": None, "match_percentage": None,
                        "overall_status": "INFORMATIONAL", "overall_explanation": answer,
                        "criteria_breakdown": [], "missing_information": [],
                        "structured_missing_criteria": [], "all_evidence_sources": evidence,
                        "queried_at": now_iso}}
            answer = "Please name at least two healthcare schemes you want to compare so I can use the right scheme records."
            return {"ai_response": answer, "retrieved_chunks": [],
                "confidence_score": 0.0, "is_low_confidence": True,
                "follow_up_suggestions": generate_follow_up_suggestions("COMPARISON_QUERY", None, query_text),
                "eligibility_result": {"query_id": query_id_str, "scheme_id": None,
                    "query_type": "COMPARISON", "user_question": query_text,
                    "interview_state": "QUESTIONS_REQUIRED", "current_question": None,
                    "progress": None, "match_percentage": None, "overall_status": "INFORMATIONAL",
                    "overall_explanation": answer, "criteria_breakdown": [],
                    "missing_information": ["Names of schemes to compare"],
                    "structured_missing_criteria": [], "all_evidence_sources": [],
                    "queried_at": now_iso}}

        # ─── WORKFLOW 0: MULTI-SCHEME ELIGIBILITY QUERY ───────────────────────
        if query_type == "MULTI_SCHEME_ELIGIBILITY_QUERY":
            # 1. Extract demographic intake values (priority: additional_info -> patient_context -> query_text)
            p_state_raw = (patient_context.get("state") if patient_context else "")
            provided_state_raw = additional_info.get("state") if additional_info else None
            effective_state = _parse_state_val(provided_state_raw) or _parse_state_val(p_state_raw) or _parse_state_val(query_text)

            p_age_raw = patient_context.get("age") if patient_context else None
            provided_age_raw = additional_info.get("age") if additional_info else None
            effective_age = _parse_age_val(provided_age_raw) or _parse_age_val(p_age_raw) or _parse_age_val(query_text)

            provided_income_raw = None
            if additional_info:
                for k_inc in ["annual_income", "income", "salary", "family_income", "income_level"]:
                    if k_inc in additional_info:
                        provided_income_raw = additional_info[k_inc]
                        break
            if not provided_income_raw and patient_context and patient_context.get("annual_income"):
                provided_income_raw = patient_context.get("annual_income")
            if not provided_income_raw and any(term in q_lower for term in ["my income", "income is", "i earn", "family income", "earning", "lakh", "salary"]):
                provided_income_raw = query_text

            effective_income = _parse_income_val(provided_income_raw)

            # Extract new fields
            p_employment_raw = patient_context.get("employment_status") if patient_context else None
            provided_employment_raw = additional_info.get("employment_status") if additional_info else None
            effective_employment = _parse_employment_val(provided_employment_raw) or _parse_employment_val(p_employment_raw) or _parse_employment_val(query_text)

            p_disability_raw = patient_context.get("disability_status") if patient_context else None
            provided_disability_raw = additional_info.get("disability_status") if additional_info else None
            effective_disability = _parse_disability_val(provided_disability_raw) or _parse_disability_val(p_disability_raw) or _parse_disability_val(query_text)

            p_pregnancy_raw = patient_context.get("pregnancy_status") if patient_context else None
            provided_pregnancy_raw = additional_info.get("pregnancy_status") if additional_info else None
            effective_pregnancy = _parse_pregnancy_val(provided_pregnancy_raw) or _parse_pregnancy_val(p_pregnancy_raw) or _parse_pregnancy_val(query_text)

            # Build effective context for adaptive questioning
            effective_context = {
                "state": effective_state,
                "age": effective_age,
                "annual_income": effective_income,
                "employment_status": effective_employment,
                "disability_status": effective_disability,
                "pregnancy_status": effective_pregnancy,
                "gender": patient_context.get("gender") if patient_context else None,
            }

            # Use adaptive questioning to determine what's needed
            missing_intake = _determine_relevant_questions(patient_context, effective_context)

            # If any required demographic is missing -> Return PROFILE_DATA_REQUIRED
            if missing_intake:
                missing_labels = [m["label"] for m in missing_intake]
                overall_exp = (
                    f"To find healthcare schemes that apply to you across Tamil Nadu and Central Government programs, "
                    f"please provide your missing demographic details ({', '.join(missing_labels)})."
                )
                return {
                    "ai_response": overall_exp,
                    "retrieved_chunks": [],
                    "confidence_score": 1.0,
                    "is_low_confidence": False,
                    "profile_complete": False,
                    "missing_required_fields": missing_labels,
                    "profile_completion_status": "incomplete",
                    "schemes": [],
                    "eligibility_result": {
                        "query_id": query_id_str,
                        "scheme_id": None,
                        "query_type": "MULTI_SCHEME_ELIGIBILITY_QUERY",
                        "user_question": query_text,
                        "interview_state": "PROFILE_DATA_REQUIRED",
                        "current_question": missing_intake[0],
                        "progress": {"answered": 0, "total_required": len(missing_intake)},
                        "match_percentage": None,
                        "overall_status": "PROFILE_DATA_REQUIRED",
                        "overall_explanation": overall_exp,
                        "criteria_breakdown": [],
                        "missing_information": missing_labels,
                        "structured_missing_criteria": missing_intake,
                        "all_evidence_sources": [],
                        "profile_complete": False,
                        "missing_required_fields": missing_labels,
                        "profile_completion_status": "incomplete",
                        "schemes": [],
                        "queried_at": now_iso,
                    }
                }

            # 2. All demographics provided -> Apply smart pre-filtering and evaluate relevant schemes
            all_schemes = _load_all_schemes()
            filtered_schemes = _filter_schemes_by_basic_criteria(
                all_schemes,
                gender=effective_context.get("gender"),
                age=effective_age,
                employment=effective_employment,
                disability=effective_disability,
                pregnancy=effective_pregnancy,
                state=effective_state
            )
            evaluated_schemes = []

            for s in filtered_schemes:
                s_id = s.get("scheme_id", "")
                s_name = s.get("scheme_name", "")
                s_url = s.get("official_url", "https://pmjay.gov.in")
                is_tn = "scheme_TN" in s_id or s.get("category") == "State Government" or "Tamil Nadu" in s.get("state", "")

                s_criteria, _ = _evaluate_scheme_criteria(
                    scheme=s,
                    effective_state=effective_state,
                    effective_age=effective_age,
                    effective_income=effective_income,
                    effective_employment=effective_employment,
                    effective_disability=effective_disability,
                    effective_pregnancy=effective_pregnancy,
                    gender=effective_context.get("gender"),
                    evidence_sources=[],
                    state_source="USER_PROVIDED_DURING_INTAKE",
                    age_source="USER_PROVIDED_DURING_INTAKE",
                    income_source="USER_PROVIDED_DURING_INTAKE"
                )

                # Compute Criteria Match % for this scheme (Excludes NOT_REQUIRED)
                applicable = [c for c in s_criteria if c.get("required", True) and c["criterion_result"] != "NOT_REQUIRED"]
                pass_cnt = sum(1 for c in applicable if c["criterion_result"] == "PASS")
                fail_cnt = sum(1 for c in applicable if c["criterion_result"] == "FAIL")
                s_match_pct = int(round((pass_cnt / len(applicable)) * 100)) if applicable else 100

                # Compute contextual relevance score
                relevance_score = s_match_pct

                # Boost for schemes matching specific user needs
                if effective_pregnancy == "Yes" and s_id in ["scheme_C07", "scheme_C08", "scheme_TN02"]:
                    relevance_score += 20  # Boost maternity schemes for pregnant users
                if effective_disability == "Yes" and s_id == "scheme_C05":
                    relevance_score += 20  # Boost Niramaya for disabled users
                if effective_employment in ["Government Employee", "Retired/Pensioner"] and s_id in ["scheme_C03", "scheme_TN08", "scheme_TN09"]:
                    relevance_score += 15  # Boost employee schemes for government employees
                if effective_age and effective_age >= 70 and s_id == "scheme_C02":
                    relevance_score += 25  # Boost Vay Vandana for seniors 70+
                if effective_age and effective_age >= 60 and s_id == "scheme_TN07":
                    relevance_score += 20  # Boost TN elderly scheme for seniors 60+

                # Boost for higher coverage amounts
                coverage_str = s.get("coverage_amount_inr", "")
                if "5 lakh" in coverage_str or "₹5,00,000" in coverage_str:
                    relevance_score += 10
                if "10 lakh" in coverage_str or "₹10,00,000" in coverage_str:
                    relevance_score += 15

                # Cap relevance score at 100
                relevance_score = min(relevance_score, 100)

                if fail_cnt > 0:
                    s_status = "NOT_ELIGIBLE"
                elif pass_cnt == len(applicable):
                    s_status = "ELIGIBLE"
                else:
                    s_status = "POSSIBLY_ELIGIBLE"

                evaluated_schemes.append({
                    "scheme_id": s_id,
                    "scheme_name": s_name,
                    "department": s.get("department", ""),
                    "government_level": "Tamil Nadu" if is_tn else "Central Government",
                    "status": s_status,
                    "match_percentage": s_match_pct,
                    "relevance_score": relevance_score,
                    "coverage_amount": s.get("coverage_amount_inr", "Per official rules"),
                    "official_url": s_url,
                    "criteria": s_criteria,
                })

            # Sort evaluated schemes: ELIGIBLE first (highest relevance score), then POSSIBLY_ELIGIBLE, then NOT_ELIGIBLE
            status_order = {"ELIGIBLE": 0, "POSSIBLY_ELIGIBLE": 1, "INSUFFICIENT_INFORMATION": 2, "NOT_ELIGIBLE": 3}
            evaluated_schemes.sort(key=lambda x: (status_order.get(x["status"], 4), -x["relevance_score"]))

            eligible_schemes = [s for s in evaluated_schemes if s["status"] in ["ELIGIBLE", "POSSIBLY_ELIGIBLE"]]
            top_scheme = evaluated_schemes[0] if evaluated_schemes else None
            top_scheme_id = top_scheme["scheme_id"] if top_scheme else "scheme_TN01"

            total_schemes_count = len(all_schemes)
            filtered_count = len(filtered_schemes)
            tn_schemes_count = sum(1 for s in all_schemes if "TN" in s.get("scheme_id", "") or "Tamil Nadu" in s.get("state", ""))
            central_schemes_count = total_schemes_count - tn_schemes_count

            eligible_names_list = [f"- **{s['scheme_name']}** ({s['government_level']}, {s['coverage_amount']}) — {s['match_percentage']}% Match (Relevance: {s['relevance_score']}%)" for s in eligible_schemes]
            names_bulleted = "\n".join(eligible_names_list)

            # Build comprehensive profile summary
            profile_details = [f"State: {effective_state}"]
            if effective_age:
                profile_details.append(f"Age: {effective_age}")
            if effective_income:
                profile_details.append(f"Income: ₹{int(effective_income):,}/year")
            if effective_employment:
                profile_details.append(f"Employment: {effective_employment}")
            if effective_disability:
                profile_details.append(f"Disability: {effective_disability}")
            if effective_pregnancy:
                profile_details.append(f"Pregnancy: {effective_pregnancy}")

            summary_text = (
                f"Based on your profile ({', '.join(profile_details)}), we evaluated {filtered_count} relevant healthcare schemes "
                f"out of {total_schemes_count} total schemes ({tn_schemes_count} Tamil Nadu + {central_schemes_count} Central Government).\n\n"
                f"You qualify for **{len(eligible_schemes)} scheme(s)** based on demographic rules:\n"
                f"{names_bulleted}\n\n"
                f"Select any scheme below to see full criteria or begin an eligibility check."
            )

            # Build retrieved chunks with ALL matching schemes so frontend can render them
            multi_chunks = []
            for s in evaluated_schemes:
                if s["status"] in ["ELIGIBLE", "POSSIBLY_ELIGIBLE"]:
                    multi_chunks.append({
                        "chunk_id": f"chk_{s['scheme_id']}",
                        "document_title": f"{s['scheme_name']} ({s['government_level']})",
                        "scheme_id": s["scheme_id"],
                        "scheme_name": s["scheme_name"],
                        "government_level": s["government_level"],
                        "status": s["status"],
                        "match_percentage": s["match_percentage"],
                        "relevance_score": s["relevance_score"],
                        "coverage_amount": s["coverage_amount"],
                        "excerpt": f"{s['scheme_name']} ({s['government_level']}): Coverage: {s['coverage_amount']}. Eligibility: {s['status']} ({s['match_percentage']}% Criteria Match, {s['relevance_score']}% Relevance).",
                        "official_url": s["official_url"],
                        "page_number": 1,
                        "relevance_score_float": round(s["relevance_score"] / 100.0, 2),
                    })

            # Call Gemini LLM to generate intelligent multi-scheme summary if available
            # Context compression: Use only top 5 most relevant chunks
            chunk_excerpts = [s["excerpt"] for s in multi_chunks[:5]]
            llm_text = await _generate_llm_response(
                query_text=query_text or "What healthcare schemes am I eligible for?",
                retrieved_chunks=chunk_excerpts,
                scheme_name="Government Healthcare Schemes",
                query_type="GENERAL_INFORMATION",
                patient_context={
                    "age": effective_age,
                    "state": effective_state,
                    "annual_income": effective_income,
                    "employment_status": effective_employment,
                    "disability_status": effective_disability,
                    "pregnancy_status": effective_pregnancy,
                }
            )
            if llm_text:
                summary_text = f"{summary_text}\n\n{llm_text}"

            top_scheme = evaluated_schemes[0] if evaluated_schemes else None
            top_scheme_name = top_scheme["scheme_name"] if top_scheme else "Government Healthcare Schemes"
            top_scheme_id = top_scheme["scheme_id"] if top_scheme else "all_schemes"

            return {
                "ai_response": summary_text,
                "retrieved_chunks": multi_chunks,
                "confidence_score": 0.95,
                "is_low_confidence": False,
                "follow_up_suggestions": generate_follow_up_suggestions("MULTI_SCHEME_ELIGIBILITY_QUERY", top_scheme_name, query_text),
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": evaluated_schemes,
                "eligibility_result": {
                    "query_id": query_id_str,
                    "scheme_id": top_scheme_id,
                    "query_type": "MULTI_SCHEME_ELIGIBILITY_QUERY",
                    "user_question": query_text,
                    "interview_state": "COMPLETED",
                    "current_question": None,
                    "progress": {"answered": len(missing_intake), "total_required": len(missing_intake)},
                    "match_percentage": top_scheme["match_percentage"] if top_scheme else 100,
                    "relevance_score": top_scheme["relevance_score"] if top_scheme else 100,
                    "overall_status": "ELIGIBLE" if eligible_schemes else "NOT_ELIGIBLE",
                    "overall_explanation": summary_text,
                    "criteria_breakdown": top_scheme["criteria"] if top_scheme else [],
                    "missing_information": [],
                    "structured_missing_criteria": [],
                    "all_evidence_sources": multi_chunks,
                    "profile_complete": True,
                    "missing_required_fields": [],
                    "profile_completion_status": "complete",
                    "schemes": evaluated_schemes,
                    "queried_at": now_iso,
                }
            }

        # ─── WORKFLOW 1: SINGLE-SCHEME GROUNDED REASONING ────────────────────
        # 1. Deterministically resolve and LOCK the target scheme identity
        top_scheme_id, top_scheme_name, top_scheme_url = resolve_scheme_context(
            query_text=query_text,
            scoped_scheme_id=scoped_scheme_id,
            vector_store=vector_store
        )

        if top_scheme_id == "SCHEME_NOT_SUPPORTED":
            msg = "This state healthcare scheme is currently outside our primary coverage area (Tamil Nadu & Central Government schemes). We support all 9 Tamil Nadu state schemes and 11 Central Government schemes."
            return {
                "ai_response": msg,
                "retrieved_chunks": [],
                "confidence_score": 0.0,
                "is_low_confidence": True,
                "follow_up_suggestions": ["What schemes are available in Tamil Nadu?", "What Central Government schemes exist?"],
                "eligibility_result": {
                    "query_id": query_id_str,
                    "scheme_id": None,
                    "query_type": "UNSUPPORTED_SCHEME",
                    "user_question": query_text,
                    "interview_state": "COMPLETED",
                    "current_question": None,
                    "progress": None,
                    "match_percentage": None,
                    "overall_status": "INFORMATIONAL",
                    "overall_explanation": msg,
                    "criteria_breakdown": [],
                    "missing_information": [],
                    "structured_missing_criteria": [],
                    "all_evidence_sources": [],
                    "profile_complete": True,
                    "missing_required_fields": [],
                    "profile_completion_status": "complete",
                    "schemes": [],
                    "queried_at": now_iso,
                },
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": [],
            }

        if top_scheme_id == "UNRECOGNIZED_SCHEME":
            msg = "No sufficiently relevant government healthcare scheme was found for your query. Please ask about specific healthcare schemes, benefits (such as maternity, disability, or senior care), or state schemes in Tamil Nadu."
            return {
                "ai_response": msg,
                "retrieved_chunks": [],
                "confidence_score": 0.0,
                "is_low_confidence": True,
                "follow_up_suggestions": ["Which government schemes may I qualify for?", "What healthcare schemes are available in Tamil Nadu?", "What maternity benefits are available?"],
                "eligibility_result": {
                    "query_id": query_id_str,
                    "scheme_id": None,
                    "query_type": "UNRECOGNIZED_SCHEME",
                    "user_question": query_text,
                    "interview_state": "COMPLETED",
                    "current_question": None,
                    "progress": None,
                    "match_percentage": None,
                    "overall_status": "INFORMATIONAL",
                    "overall_explanation": msg,
                    "criteria_breakdown": [],
                    "missing_information": [],
                    "structured_missing_criteria": [],
                    "all_evidence_sources": [],
                    "profile_complete": True,
                    "missing_required_fields": [],
                    "profile_completion_status": "complete",
                    "schemes": [],
                    "queried_at": now_iso,
                },
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": [],
            }

        # 2. Check if user document chunks exist in VectorStore (Document Flow without reparsing raw PDF)
        doc_chunks = []
        if uploaded_document_id:
            doc_chunks = vector_store.get_chunks_by_document_id(str(uploaded_document_id))

        # 3. Scheme-Filtered Hybrid Vector Search: retrieve chunks belonging to top_scheme_id
        search_prompt = f"{top_scheme_name} {query_text}"
        query_emb = await EmbeddingService.get_embedding(search_prompt)

        # Use hybrid search (vector + BM25) with 60% weight on vector, 40% on keywords
        all_results = vector_store.hybrid_search(query_emb, search_prompt, k=k*2, alpha=0.6)
        
        # Filter to only scoped scheme results
        results = [
            (text, meta, score) for text, meta, score in all_results
            if meta.get("scheme_id") == top_scheme_id
        ][:k]
        
        if not results:
            # Fallback to scheme-specific vector search if hybrid gives no results
            scoped_docs = [
                doc for doc in vector_store.documents
                if doc.get("metadata", {}).get("scheme_id") == top_scheme_id
            ]
            if scoped_docs:
                scores = [
                    (doc["text"], doc["metadata"], _cosine_similarity(query_emb, doc["embedding"]))
                    for doc in scoped_docs
                ]
                scores.sort(key=lambda x: x[2], reverse=True)
                results = scores[:k]
            all_results = vector_store.similarity_search(query_emb, query_text=q_lower, k=k)
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

        # Append document chunk evidence if available
        for d_idx, d_chunk in enumerate(doc_chunks[:2]):
            d_id = f"doc_chk_{d_idx+1}"
            chunks.append({
                "chunk_id": d_id,
                "scheme_id": top_scheme_id,
                "scheme_name": "Patient Uploaded Document",
                "excerpt": d_chunk["text"][:300],
                "official_url": "",
            })
            evidence_sources.append({
                "chunk_id": d_id,
                "document_title": f"Patient Document: {d_chunk.get('metadata', {}).get('file_name', 'Uploaded Report')}",
                "page_number": 1,
                "excerpt": d_chunk["text"][:300],
                "official_url": "",
                "relevance_score": 0.95,
            })

        if not results and not doc_chunks:
            msg = f"I couldn't locate any official evidence for {top_scheme_name} in our database at this time."
            return {
                "ai_response": msg,
                "retrieved_chunks": [],
                "confidence_score": 0.0,
                "is_low_confidence": True,
                "follow_up_suggestions": ["What schemes are available in Tamil Nadu?", "Am I eligible for PM-JAY?"],
                "eligibility_result": {
                    "query_id": query_id_str,
                    "scheme_id": top_scheme_id,
                    "query_type": "NO_EVIDENCE",
                    "user_question": query_text,
                    "interview_state": "COMPLETED",
                    "current_question": None,
                    "progress": None,
                    "match_percentage": None,
                    "overall_status": "INSUFFICIENT_INFORMATION",
                    "overall_explanation": msg,
                    "criteria_breakdown": [],
                    "missing_information": [],
                    "structured_missing_criteria": [],
                    "all_evidence_sources": [],
                    "profile_complete": False,
                    "missing_required_fields": [],
                    "profile_completion_status": "incomplete",
                    "schemes": [],
                    "queried_at": now_iso,
                },
                "profile_complete": False,
                "missing_required_fields": [],
                "profile_completion_status": "incomplete",
                "schemes": [],
            }

        top_score = results[0][2] if results else 0.88
        confidence = float(max(0.0, min(1.0, (top_score + 1.0) / 2.0)))

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

            # Call Gemini LLM with retrieved official excerpts
            chunk_texts = [c.get("excerpt", "") for c in chunks if c.get("excerpt")]
            llm_text = await _generate_llm_response(
                query_text=query_text,
                retrieved_chunks=chunk_texts,
                scheme_name=top_scheme_name,
                query_type="COVERAGE_QUERY",
                patient_context=patient_context,
            )
            if llm_text:
                overall_exp = llm_text

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
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": [{
                    "scheme_id": top_scheme_id,
                    "scheme_name": top_scheme_name,
                    "status": overall_status,
                    "official_url": top_scheme_url,
                }],
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

            chunk_texts = [c.get("excerpt", "") for c in chunks if c.get("excerpt")]
            llm_text = await _generate_llm_response(
                query_text=query_text,
                retrieved_chunks=chunk_texts,
                scheme_name=top_scheme_name,
                query_type="REQUIREMENTS_QUERY",
                patient_context=patient_context,
            )
            if llm_text:
                overall_exp = llm_text
            
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
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": [{
                    "scheme_id": top_scheme_id,
                    "scheme_name": top_scheme_name,
                    "status": overall_status,
                    "official_url": top_scheme_url,
                }],
                "queried_at": now_iso,
            }

            return {
                "ai_response": overall_exp,
                "retrieved_chunks": chunks,
                "confidence_score": round(confidence, 2),
                "is_low_confidence": confidence < 0.65,
                "eligibility_result": eligibility_result,
            }

        # ─── WORKFLOW C: APPLICATION_QUERY ───────────────────────────────────
        if query_type == "APPLICATION_QUERY":
            overall_status = "INFORMATIONAL"
            overall_exp = f"Application process and contact information for **{top_scheme_name}**:"

            chunk_texts = [c.get("excerpt", "") for c in chunks if c.get("excerpt")]
            llm_text = await _generate_llm_response(
                query_text=query_text,
                retrieved_chunks=chunk_texts,
                scheme_name=top_scheme_name,
                query_type="APPLICATION_QUERY",
                patient_context=patient_context,
            )
            if llm_text:
                overall_exp = llm_text
            
            eligibility_result = {
                "query_id": query_id_str,
                "scheme_id": top_scheme_id,
                "query_type": "APPLICATION",
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
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": [{
                    "scheme_id": top_scheme_id,
                    "scheme_name": top_scheme_name,
                    "status": overall_status,
                    "official_url": top_scheme_url,
                }],
                "queried_at": now_iso,
            }

            return {
                "ai_response": overall_exp,
                "retrieved_chunks": chunks,
                "confidence_score": round(confidence, 2),
                "is_low_confidence": confidence < 0.65,
                "eligibility_result": eligibility_result,
            }

        # ─── WORKFLOW D: RENEWAL_QUERY ───────────────────────────────────────
        if query_type == "RENEWAL_QUERY":
            overall_status = "INFORMATIONAL"
            overall_exp = f"Renewal and validity information for **{top_scheme_name}**:"

            chunk_texts = [c.get("excerpt", "") for c in chunks if c.get("excerpt")]
            llm_text = await _generate_llm_response(
                query_text=query_text,
                retrieved_chunks=chunk_texts,
                scheme_name=top_scheme_name,
                query_type="RENEWAL_QUERY",
                patient_context=patient_context,
            )
            if llm_text:
                overall_exp = llm_text
            
            eligibility_result = {
                "query_id": query_id_str,
                "scheme_id": top_scheme_id,
                "query_type": "RENEWAL",
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
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": [{
                    "scheme_id": top_scheme_id,
                    "scheme_name": top_scheme_name,
                    "status": overall_status,
                    "official_url": top_scheme_url,
                }],
                "queried_at": now_iso,
            }

            return {
                "ai_response": overall_exp,
                "retrieved_chunks": chunks,
                "confidence_score": round(confidence, 2),
                "is_low_confidence": confidence < 0.65,
                "eligibility_result": eligibility_result,
            }

        # ─── WORKFLOW E: HOSPITAL_NETWORK_QUERY ───────────────────────────────
        if query_type == "HOSPITAL_NETWORK_QUERY":
            overall_status = "INFORMATIONAL"
            overall_exp = f"Hospital network and empanelled facilities for **{top_scheme_name}**:"

            chunk_texts = [c.get("excerpt", "") for c in chunks if c.get("excerpt")]
            llm_text = await _generate_llm_response(
                query_text=query_text,
                retrieved_chunks=chunk_texts,
                scheme_name=top_scheme_name,
                query_type="HOSPITAL_NETWORK_QUERY",
                patient_context=patient_context,
            )
            if llm_text:
                overall_exp = llm_text
            
            eligibility_result = {
                "query_id": query_id_str,
                "scheme_id": top_scheme_id,
                "query_type": "HOSPITAL_NETWORK",
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
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": [{
                    "scheme_id": top_scheme_id,
                    "scheme_name": top_scheme_name,
                    "status": overall_status,
                    "official_url": top_scheme_url,
                }],
                "queried_at": now_iso,
            }

            return {
                "ai_response": overall_exp,
                "retrieved_chunks": chunks,
                "confidence_score": round(confidence, 2),
                "is_low_confidence": confidence < 0.65,
                "eligibility_result": eligibility_result,
            }

        # ─── WORKFLOW G: GENERAL_INFORMATION ────────────────────────────────
        if query_type == "GENERAL_INFORMATION":
            overall_status = "INFORMATIONAL"
            overall_exp = f"**{top_scheme_name}** provides cashless secondary and tertiary hospitalization cover across public and empanelled private hospitals."

            chunk_texts = [c.get("excerpt", "") for c in chunks if c.get("excerpt")]
            llm_text = await _generate_llm_response(
                query_text=query_text,
                retrieved_chunks=chunk_texts,
                scheme_name=top_scheme_name,
                query_type="GENERAL_INFORMATION",
                patient_context=patient_context,
            )
            if llm_text:
                overall_exp = llm_text
            
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
                "profile_complete": True,
                "missing_required_fields": [],
                "profile_completion_status": "complete",
                "schemes": [{
                    "scheme_id": top_scheme_id,
                    "scheme_name": top_scheme_name,
                    "status": overall_status,
                    "official_url": top_scheme_url,
                }],
                "queried_at": now_iso,
            }

            return {
                "ai_response": overall_exp,
                "retrieved_chunks": chunks,
                "confidence_score": round(confidence, 2),
                "is_low_confidence": confidence < 0.65,
                "eligibility_result": eligibility_result,
            }

        # ─── WORKFLOW H: PERSONAL_ELIGIBILITY (DYNAMIC MCQ INTERVIEW) ───────────
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

        p_income_raw = patient_context.get("annual_income") if patient_context else None
        income_from_profile = float(p_income_raw) if p_income_raw is not None else None

        provided_income_raw = None
        if additional_info:
            for k_inc in ["annual_income", "income", "salary", "family_income", "income_level"]:
                if k_inc in additional_info:
                    provided_income_raw = additional_info[k_inc]
                    break
        if not provided_income_raw and q_lower:
            if any(term in q_lower for term in ["my income", "income is", "i earn", "family income of", "earning"]):
                provided_income_raw = query_text

        income_from_input = _parse_income_val(provided_income_raw)
        effective_income = income_from_input if income_from_input is not None else income_from_profile
        income_source = "PROFILE_CONTEXT" if (effective_income == income_from_profile and income_from_profile is not None) else (
            "DOCUMENT_VERIFIED" if uploaded_document_id else ("USER_PROVIDED_DURING_INTERVIEW" if effective_income is not None else "UNKNOWN")
        )

        p_emp_raw = patient_context.get("employment_status") if patient_context else None
        provided_emp_raw = additional_info.get("employment_status") if additional_info else None
        effective_employment = _parse_employment_val(provided_emp_raw) or _parse_employment_val(p_emp_raw) or _parse_employment_val(query_text)

        p_dis_raw = patient_context.get("disability_status") if patient_context else None
        provided_dis_raw = additional_info.get("disability_status") if additional_info else None
        effective_disability = _parse_disability_val(provided_dis_raw) or _parse_disability_val(p_dis_raw) or _parse_disability_val(query_text)

        p_preg_raw = patient_context.get("pregnancy_status") if patient_context else None
        provided_preg_raw = additional_info.get("pregnancy_status") if additional_info else None
        effective_pregnancy = _parse_pregnancy_val(provided_preg_raw) or _parse_pregnancy_val(p_preg_raw) or _parse_pregnancy_val(query_text)

        effective_gender = patient_context.get("gender") if patient_context else None

        # Lookup resolved scheme data
        all_schemes = _load_all_schemes()
        target_scheme = next((s for s in all_schemes if s.get("scheme_id") == top_scheme_id), {
            "scheme_id": top_scheme_id,
            "scheme_name": top_scheme_name,
            "official_url": top_scheme_url,
            "state": "Tamil Nadu" if "TN" in str(top_scheme_id) else "Central / All India"
        })

        criteria, structured_missing_questions = _evaluate_scheme_criteria(
            scheme=target_scheme,
            effective_state=effective_state,
            effective_age=effective_age,
            effective_income=effective_income,
            effective_employment=effective_employment,
            effective_disability=effective_disability,
            effective_pregnancy=effective_pregnancy,
            gender=effective_gender,
            evidence_sources=evidence_sources,
            state_source=state_source,
            age_source=age_source,
            income_source=income_source,
        )

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
        prof_complete = len(structured_missing_questions) == 0
        prof_status = "complete" if prof_complete else "incomplete"

        # Call Gemini LLM for personalized explanation once interview questions are complete
        if interview_state == "COMPLETED":
            chunk_texts = [c.get("excerpt", "") for c in chunks if c.get("excerpt")]
            effective_patient = {
                "age": effective_age,
                "state": effective_state,
                "annual_income": effective_income,
                "gender": effective_gender,
                "employment_status": effective_employment,
                "disability_status": effective_disability,
                "pregnancy_status": effective_pregnancy,
            }
            llm_text = await _generate_llm_response(
                query_text=query_text or f"Check eligibility for {top_scheme_name}",
                retrieved_chunks=chunk_texts,
                scheme_name=top_scheme_name,
                query_type="PERSONAL_ELIGIBILITY",
                patient_context=effective_patient,
            )
            if llm_text:
                overall_exp = f"{overall_exp}\n\n{llm_text}"

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
            "profile_complete": prof_complete,
            "missing_required_fields": missing_info_names,
            "profile_completion_status": prof_status,
            "schemes": [{
                "scheme_id": top_scheme_id,
                "scheme_name": top_scheme_name,
                "status": overall_status,
                "match_percentage": match_pct,
                "coverage_amount": target_scheme.get("coverage_amount_inr", "Per official rules"),
                "official_url": top_scheme_url,
            }],
            "queried_at": now_iso,
        }

        result = {
            "ai_response": overall_exp,
            "retrieved_chunks": chunks,
            "confidence_score": round(confidence, 2),
            "is_low_confidence": confidence < 0.65,
            "follow_up_suggestions": generate_follow_up_suggestions(query_type, top_scheme_name, query_text),
            "eligibility_result": eligibility_result,
            "profile_complete": prof_complete,
            "missing_required_fields": missing_info_names,
            "profile_completion_status": prof_status,
            "schemes": eligibility_result.get("schemes", []),
        }

        # Cache informational queries
        if query_type in ["GENERAL_INFORMATION", "REQUIREMENTS_QUERY", "APPLICATION_QUERY", "RENEWAL_QUERY", "HOSPITAL_NETWORK_QUERY"]:
            rag_cache.set(cache_key, result, ttl_seconds=86400)

        return result
