"""
Re-seed the vector store with the expanded chunks from healthcare_schemes.json.
Uses Google Gemini embedding API (gemini-embedding-001) for real embeddings.
Falls back to deterministic pseudo-embeddings if API key is unavailable.
"""
import json, os, sys, asyncio

# Add parent to path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore

SRC = os.path.join(os.path.dirname(__file__), "healthcare_schemes.json")


async def reseed():
    with open(SRC, "r", encoding="utf-8") as f:
        schemes = json.load(f)

    vstore = VectorStore()
    vstore.clear()
    print(f"Cleared existing vector store.")

    total = 0
    for s in schemes:
        sid = s.get("scheme_id", "")
        name = s.get("scheme_name", "")
        url = s.get("official_url", "")
        dept = s.get("department", "")
        state = s.get("state", "")
        chunks = s.get("chunks", [])

        if not chunks:
            continue

        print(f"  Embedding {len(chunks)} chunks for {sid}: {name[:50]}...")

        try:
            embeddings = await EmbeddingService.get_embeddings(chunks)
        except Exception as e:
            print(f"  [WARN] Batch embedding failed for {sid}: {e}. Retrying after 5s...")
            await asyncio.sleep(5.0)
            try:
                embeddings = await EmbeddingService.get_embeddings(chunks)
            except Exception as e2:
                print(f"  [WARN] Fallback to deterministic pseudo-embeddings for {sid}: {e2}")
                from app.rag.embeddings import _pseudo_embed
                embeddings = [_pseudo_embed(c) for c in chunks]

        metadatas = [
            {
                "scheme_id": sid,
                "scheme_name": name,
                "official_url": url,
                "department": dept,
                "state": state,
                "chunk_index": idx,
            }
            for idx in range(len(chunks))
        ]

        vstore.add_texts(chunks, embeddings, metadatas)
        total += len(chunks)
        await asyncio.sleep(0.8)

    print(f"\nDone! Seeded {total} chunks across {len(schemes)} schemes.")
    print(f"Vector store saved to: {vstore._ensure_store_dir.__func__}")


if __name__ == "__main__":
    asyncio.run(reseed())
