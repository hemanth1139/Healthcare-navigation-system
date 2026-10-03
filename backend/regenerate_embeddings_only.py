"""
Regenerate vector store embeddings from JSON file (doesn't touch database).
"""

import sys
import os
import asyncio
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore


async def regenerate_from_json():
    """Regenerate embeddings from healthcare_schemes.json."""
    json_path = os.path.join(os.path.dirname(__file__), "healthcare_schemes.json")

    print(f"[INFO] Loading schemes from {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        schemes = json.load(f)
    print(f"[INFO] Loaded {len(schemes)} schemes from JSON")

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
        Scheme: {scheme.get('scheme_name', 'Unknown')}
        Summary: {scheme.get('benefits_summary', 'Not specified')}
        Coverage: {scheme.get('coverage_amount_inr', 'Not specified')}
        Eligibility: {scheme.get('eligibility_criteria', 'Not specified')}
        Covered Conditions: {', '.join(scheme.get('key_covered_conditions', []))}
        Exclusions: {', '.join(scheme.get('key_exclusions', []))}
        State: {scheme.get('state', 'All India')}
        Government Level: {scheme.get('government_level', 'Central')}
        Department: {scheme.get('department', 'Not specified')}
        """

        all_texts.append(scheme_text.strip())
        all_metadata.append({
            "scheme_id": scheme.get('scheme_id'),
            "scheme_name": scheme.get('scheme_name'),
            "official_url": scheme.get('official_url'),
            "document_id": scheme.get('scheme_id')
        })

    print(f"[INFO] Generating embeddings for {len(all_texts)} chunks...")
    embeddings = await EmbeddingService.get_embeddings(all_texts)
    print(f"[INFO] Generated {len(embeddings)} embeddings")

    print("[INFO] Saving to vector store...")
    vector_store.add_texts(all_texts, embeddings, all_metadata)
    print(f"[INFO] Saved {len(vector_store)} chunks to vector store")

    print("[SUCCESS] Embedding regeneration complete!")


if __name__ == "__main__":
    asyncio.run(regenerate_from_json())
