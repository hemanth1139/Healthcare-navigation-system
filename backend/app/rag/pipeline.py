"""
RAG Pipeline — queries the vector store, aggregates text excerpts,
and runs Gemini LLM to generate eligibility/benefit explanations.
"""

import json
from typing import Dict, Any, List
from app.config import settings
from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore

# Initialize VectorStore singleton
vector_store = VectorStore()


class RAGPipeline:
    
    @staticmethod
    async def query(query_text: str, k: int = 3) -> Dict[str, Any]:
        """
        Retrieves context chunks and prompts LLM to generate structured schema query details.
        """
        # 1. Generate query vector
        query_emb = await EmbeddingService.get_embedding(query_text)

        # 2. Similarity search in local vector store
        results = vector_store.similarity_search(query_emb, k=k)

        # Format retrieved chunks
        chunks = []
        context_parts = []
        for idx, (text, meta, score) in enumerate(results):
            chunks.append({
                "chunk_id": f"chk_{idx}_{meta.get('scheme_id', 'scheme')[:6]}",
                "scheme_name": meta.get("scheme_name", "Government Scheme"),
                "excerpt": text,
                "official_url": meta.get("official_url", "")
            })
            context_parts.append(
                f"Source: {meta.get('scheme_name')}\nExcerpt: {text}\nOfficial Link: {meta.get('official_url')}"
            )

        # Fallback response if no vector documents indexed yet
        if not results:
            return {
                "ai_response": "I couldn't locate any matching government healthcare schemes in our database at this time. Please make sure the search indices are seeded.",
                "retrieved_chunks": [],
                "confidence_score": 0.0,
                "is_low_confidence": True
            }

        context = "\n\n".join(context_parts)

        # Determine confidence score from highest match score (bounded 0.0 - 1.0)
        top_score = results[0][2]
        # Normalize score to represent confidence (cosine score ranges typically 0.5 to 1.0 for matches)
        confidence = float(max(0.0, min(1.0, (top_score + 1.0) / 2.0)))

        # 3. Call LLM for generation
        if not settings.GOOGLE_API_KEY:
            # Fallback mock generator
            print("[WARN] GOOGLE_API_KEY not configured. Generating static response from context.")
            top_match_scheme = results[0][1].get("scheme_name", "Matched Scheme")
            ai_reply = (
                f"Based on your query, you might be eligible for **{top_match_scheme}**. "
                f"Here is what I found in the documents:\n\n{results[0][0]}\n\n"
                f"For further registration details, please visit the official portal: {results[0][1].get('official_url', '')}."
            )
            return {
                "ai_response": ai_reply,
                "retrieved_chunks": chunks,
                "confidence_score": confidence,
                "is_low_confidence": confidence < 0.65
            }

        # LLM flow
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage

        SYSTEM_PROMPT = f"""You are a government healthcare schemes assistant.
Using ONLY the following retrieved document excerpts as context, answer the user's question about eligibility or benefits.
If the context does not contain enough info, state that clearly. Avoid making up details.

Retrieved Context:
{context}

Provide a helpful, well-structured explanation matching the patient eligibility requirements.
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
            return {
                "ai_response": response.content.strip(),
                "retrieved_chunks": chunks,
                "confidence_score": confidence,
                "is_low_confidence": confidence < 0.65
            }
        except Exception as e:
            print(f"[ERROR] Error in RAG LLM: {e}. Falling back to default generation.")
            top_match_scheme = results[0][1].get("scheme_name", "Matched Scheme")
            ai_reply = (
                f"Based on your query, you might be eligible for **{top_match_scheme}**. "
                f"Here is what I found in the documents:\n\n{results[0][0]}\n\n"
                f"For further registration details, please visit the official portal: {results[0][1].get('official_url', '')}."
            )
            return {
                "ai_response": ai_reply,
                "retrieved_chunks": chunks,
                "confidence_score": confidence,
                "is_low_confidence": confidence < 0.65
            }
skin = RAGPipeline()
