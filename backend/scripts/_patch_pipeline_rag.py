from pathlib import Path

p = Path(__file__).resolve().parents[1] / "app" / "rag" / "pipeline.py"
text = p.read_text(encoding="utf-8")

start = text.index("def _determine_relevant_questions(")
end = text.index("MULTI_SCHEME_PATTERNS = [")
new = '''def _determine_relevant_questions(
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


'''
text = text[:start] + new + text[end:]

eval_start = text.index("def _evaluate_scheme_criteria(")
eval_end = text.index("\nclass RAGPipeline:")
eval_fn = '''def _evaluate_scheme_criteria(
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


'''
text = text[:eval_start] + eval_fn + text[eval_end:]
p.write_text(text, encoding="utf-8")
print("patched", p)
print("lines", len(text.splitlines()))
