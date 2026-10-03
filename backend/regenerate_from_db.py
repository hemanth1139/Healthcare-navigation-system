"""
Regenerate vector store embeddings from database (not JSON).
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.scheme import GovernmentScheme
from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore


async def regenerate_from_db():
    """Regenerate embeddings from database schemes."""
    print("[INFO] Loading schemes from database...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(GovernmentScheme))
        schemes = result.scalars().all()
        print(f"[INFO] Found {len(schemes)} schemes in database")

    if not schemes:
        print("[ERROR] No schemes found in database.")
        return

    print("[INFO] Clearing old vector store...")
    vector_store = VectorStore()
    vector_store.clear()
    print("[INFO] Vector store cleared")

    print("[INFO] Generating new embeddings with SentenceTransformers...")
    all_texts = []
    all_metadata = []

    for scheme in schemes:
        # Create text chunks for each scheme
        scheme_text = f"""
        Scheme: {scheme.scheme_name}
        Summary: {scheme.benefits or 'Not specified'}
        Coverage: {scheme.coverage_amount or 'Not specified'}
        Eligibility: {scheme.eligibility or 'Not specified'}
        Covered Conditions: {', '.join(scheme.key_covered_conditions or [])}
        Exclusions: {', '.join(scheme.key_exclusions or [])}
        State: {scheme.state or 'All India'}
        Government Level: {scheme.category or 'Central'}
        Department: {scheme.department or 'Not specified'}
        """

        all_texts.append(scheme_text.strip())
        all_metadata.append({
            "scheme_id": scheme.scheme_id,
            "scheme_name": scheme.scheme_name,
            "official_url": scheme.official_url,
            "document_id": scheme.scheme_id
        })

    print(f"[INFO] Generating embeddings for {len(all_texts)} chunks...")
    embeddings = await EmbeddingService.get_embeddings(all_texts)
    print(f"[INFO] Generated {len(embeddings)} embeddings")

    print("[INFO] Saving to vector store...")
    vector_store.add_texts(all_texts, embeddings, all_metadata)
    print(f"[INFO] Saved {len(vector_store)} chunks to vector store")

    print("[SUCCESS] Embedding regeneration complete!")


if __name__ == "__main__":
    asyncio.run(regenerate_from_db())
