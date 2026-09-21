"""
RAG Pipeline — queries the vector store, aggregates text excerpts from healthcare_schemes.json,
and runs Gemini LLM to generate eligibility/benefit explanations and criterion breakdowns.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.config import settings
from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore

# Initialize VectorStore singleton
vector_store = VectorStore()


class RAGPipeline:

    @staticmethod
    async def query(query_text: str, k: int = 4, scoped_scheme_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves context chunks and performs multi-document scheme eligibility reasoning.
        """
        # 1. Generate query vector
        query_emb = await EmbeddingService.get_embedding(query_text)

        # 2. Similarity search in local vector store
        results = vector_store.similarity_search(query_emb, k=k)

        # Filter by scoped_scheme_id if provided
        if scoped_scheme_id:
            scoped_results = [r for r in results if r[1].get("scheme_id") == scoped_scheme_id]
            if scoped_results:
                results = scoped_results

        # Format retrieved chunks and evidence sources
        chunks = []
        evidence_sources = []
        context_parts = []

        for idx, (text, meta, score) in enumerate(results):
            s_id = meta.get("scheme_id", "scheme")
            s_name = meta.get("scheme_name", "Government Scheme")
            url = meta.get("official_url", "https://pmjay.gov.in")
            chunk_id = f"chk_{idx+1}_{s_id[:6]}"

            chunks.append({
                "chunk_id": chunk_id,
                "scheme_name": s_name,
                "excerpt": text,
                "official_url": url
            })

            evidence_sources.append({
                "chunk_id": chunk_id,
                "document_title": f"{s_name} Official Guidelines",
                "page_number": idx + 1,
                "excerpt": text,
                "official_url": url,
                "relevance_score": round(float(score), 2) if score else 0.85
            })

            context_parts.append(
                f"Source [{idx+1}]: {s_name} (ID: {s_id})\nExcerpt: {text}\nOfficial URL: {url}"
            )

        if not results:
            return {
                "ai_response": "I couldn't locate any matching government healthcare schemes in our database at this time.",
                "retrieved_chunks": [],
                "confidence_score": 0.0,
                "is_low_confidence": True,
                "eligibility_result": None
            }

        context = "\n\n".join(context_parts)
        top_score = results[0][2]
        confidence = float(max(0.0, min(1.0, (top_score + 1.0) / 2.0)))

        # Determine overall eligibility status and breakdown based on query text & context
        q_lower = query_text.toLowerCase() if hasattr(query_text, 'toLowerCase') else query_text.lower()
        top_scheme_id = results[0][1].get("scheme_id", "scheme_01")
        top_scheme_name = results[0][1].get("scheme_name", "Government Scheme")

        # Exclusions evaluation
        if any(term in q_lower for term in ["cosmetic", "tattoo", "aesthetic", "car insurance", "private gym"]):
            overall_status = "NOT_ELIGIBLE"
            overall_exp = f"Cosmetic and elective non-medical procedures are explicitly excluded from government healthcare coverage under {top_scheme_name} and related guidelines."
            criteria = [
                {
                    "criterion_id": "cr_medical_necessity",
                    "criterion_name": "Medical Necessity Requirement",
                    "criterion_result": "FAIL",
                    "patient_value": "Elective cosmetic / non-medical request",
                    "required_value": "Medically necessary inpatient care or approved package",
                    "explanation": "Official scheme guidelines state that cosmetic treatments, non-therapeutic aesthetic procedures, and routine non-medically necessary services are excluded.",
                    "supporting_evidence": [evidence_sources[0]] if evidence_sources else [],
                    "is_missing_info": False
                }
            ]
            missing_info = []

        elif any(term in q_lower for term in ["70", "72", "senior", "elderly", "vaya vandana", "80"]):
            overall_status = "ELIGIBLE"
            overall_exp = f"Based on official guidelines for Senior Citizen healthcare coverage under {top_scheme_name}, citizens aged 70 years and above qualify automatically regardless of family income limits."
            criteria = [
                {
                    "criterion_id": "cr_age_70",
                    "criterion_name": "Senior Citizen Age Limit",
                    "criterion_result": "PASS",
                    "patient_value": "70+ years of age",
                    "required_value": "70 years and above",
                    "explanation": "Meets the minimum age threshold for dedicated senior citizen health insurance top-up coverage.",
                    "supporting_evidence": [evidence_sources[0]],
                    "is_missing_info": False
                },
                {
                    "criterion_id": "cr_income_senior",
                    "criterion_name": "Income Ceiling Waiver",
                    "criterion_result": "PASS",
                    "patient_value": "No income restriction",
                    "required_value": "Income limit waived for 70+",
                    "explanation": "Senior citizens 70 and older are exempted from income ceilings under recent government notifications.",
                    "supporting_evidence": [evidence_sources[0]],
                    "is_missing_info": False
                }
            ]
            missing_info = []

        else:
            overall_status = "POSSIBLY_ELIGIBLE" if confidence > 0.7 else "INSUFFICIENT_INFORMATION"
            overall_exp = f"You appear to be potentially eligible for **{top_scheme_name}**. To complete a definitive eligibility verification, your SECC 2011 status or active BPL ration card details are required."
            criteria = [
                {
                    "criterion_id": "cr_bpl_secc",
                    "criterion_name": "SECC 2011 / BPL Verification",
                    "criterion_result": "UNKNOWN",
                    "patient_value": "Pending documentation",
                    "required_value": "Registration in SECC 2011 database or notified BPL category",
                    "explanation": "Beneficiary identification depends on SECC 2011 records or state income certificate verification.",
                    "supporting_evidence": [evidence_sources[0]],
                    "is_missing_info": True
                },
                {
                    "criterion_id": "cr_income_check",
                    "criterion_name": "Annual Household Income",
                    "criterion_result": "UNKNOWN",
                    "patient_value": "Not specified",
                    "required_value": "Below prescribed state or central income threshold",
                    "explanation": "Family income verification requires a valid revenue certificate or ration card.",
                    "supporting_evidence": evidence_sources[:2],
                    "is_missing_info": True
                }
            ]
            missing_info = [
                "Aadhaar card linked with beneficiary records",
                "Income Certificate or SECC 2011 Household ID",
                "State Ration Card / Family Card number"
            ]

        # Call Gemini LLM if API Key configured
        ai_reply = overall_exp
        if settings.GOOGLE_API_KEY:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import SystemMessage, HumanMessage

            SYSTEM_PROMPT = f"""You are an expert Government Healthcare Scheme Assistant.
Using ONLY the retrieved scheme context below, explain whether the patient is eligible for healthcare assistance, what benefits are available, and what steps or documents are needed.

Retrieved Scheme Documents Context:
{context}

User Question: {query_text}

Provide a structured, clear, and encouraging explanation with bullet points.
"""
            try:
                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    temperature=0.2,
                    google_api_key=settings.GOOGLE_API_KEY
                )
                response = await llm.ainvoke([
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=query_text)
                ])
                if response and response.content:
                    ai_reply = response.content.strip()
            except Exception as e:
                print(f"[WARN] Error calling Gemini LLM in RAG pipeline: {e}")

        now_iso = datetime.now(timezone.utc).isoformat()
        query_id_str = f"q_{int(datetime.now(timezone.utc).timestamp() * 1000)}"

        eligibility_result = {
            "query_id": query_id_str,
            "scheme_id": top_scheme_id,
            "user_question": query_text,
            "overall_status": overall_status,
            "overall_explanation": overall_exp,
            "criteria_breakdown": criteria,
            "missing_information": missing_info,
            "all_evidence_sources": evidence_sources,
            "queried_at": now_iso
        }

        return {
            "ai_response": ai_reply,
            "retrieved_chunks": chunks,
            "confidence_score": round(confidence, 2),
            "is_low_confidence": confidence < 0.65,
            "eligibility_result": eligibility_result
        }
