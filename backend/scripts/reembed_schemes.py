"""Rebuild the RAG vector store from saved ``government_schemes`` records.

Run from the backend directory with ``venv\\Scripts\\python.exe scripts\\reembed_schemes.py``.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.scheme import GovernmentScheme
from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore


def _scheme_chunks(scheme: GovernmentScheme) -> list[str]:
    """Keep stored source chunks and add a fresh summary of the current DB fields."""
    chunks = [chunk for chunk in (scheme.chunks or []) if isinstance(chunk, str) and chunk.strip()]
    criteria = scheme.eligibility_criteria or {}
    details = [
        f"Government healthcare scheme: {scheme.scheme_name}.",
        f"Department: {scheme.department or 'Not specified'}.",
        f"State or coverage area: {scheme.state or 'Not specified'}.",
        f"Coverage amount: {scheme.coverage_amount or 'Not specified'}.",
        f"Benefits: {scheme.benefits or 'Not specified'}.",
        f"Eligibility: {scheme.eligibility or 'Not specified'}.",
    ]
    for key, label in (
        ("target_beneficiaries", "Target beneficiaries"),
        ("age_group", "Age group"),
        ("income_limit_per_annum_inr", "Annual income limit"),
        ("bpl_or_secc_required", "BPL or SECC requirement"),
    ):
        value = criteria.get(key)
        if value not in (None, ""):
            details.append(f"{label}: {value}.")
    if scheme.key_covered_conditions:
        details.append("Covered conditions: " + "; ".join(map(str, scheme.key_covered_conditions)) + ".")
    if scheme.key_exclusions:
        details.append("Exclusions: " + "; ".join(map(str, scheme.key_exclusions)) + ".")
    if scheme.cashless is not None:
        details.append(f"Cashless treatment: {'Yes' if scheme.cashless else 'No'}.")

    # Make the latest database fields searchable even if the stored source chunks are older.
    chunks.append(" ".join(details))
    return chunks


async def reembed_schemes() -> int:
    print("[INFO] Loading schemes from the database...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(GovernmentScheme).order_by(GovernmentScheme.scheme_name))
        schemes = result.scalars().all()
        indexed_rows = [
            (
                scheme.scheme_id,
                scheme.scheme_name,
                scheme.department,
                scheme.state,
                scheme.category,
                scheme.official_url,
                _scheme_chunks(scheme),
            )
            for scheme in schemes
        ]

    if not indexed_rows:
        raise RuntimeError("No government schemes found in the database; vector store was not changed.")

    texts: list[str] = []
    metadatas: list[dict] = []
    for scheme_id, scheme_name, department, state, category, official_url, chunks in indexed_rows:
        for chunk_index, chunk in enumerate(chunks):
            texts.append(chunk)
            metadatas.append({
                "scheme_id": scheme_id,
                "scheme_name": scheme_name,
                "official_url": official_url or "",
                "portal_url": official_url or "",
                "department": department or "Ministry of Health & Family Welfare",
                "state": state or "Central / All India",
                "category": category or (
                    "State Government" if state and "Central" not in state and "India" not in state else "Central Government"
                ),
                "chunk_index": chunk_index,
            })

    print(f"[INFO] Generating embeddings for {len(texts)} chunks across {len(indexed_rows)} database schemes...")
    embeddings = await EmbeddingService.get_embeddings(texts)
    if len(embeddings) != len(texts) or any(not embedding for embedding in embeddings):
        raise RuntimeError("Embedding generation returned incomplete results; vector store was not changed.")

    store = VectorStore()
    store.clear()
    store.add_texts(texts, embeddings, metadatas)
    print(f"[SUCCESS] Re-embedded {len(indexed_rows)} database schemes into {len(store)} vector chunks.")
    return len(store)


if __name__ == "__main__":
    asyncio.run(reembed_schemes())
