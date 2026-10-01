import json
import os

store_path = os.path.join(os.path.dirname(__file__), "app", "rag", "vector_store", "vector_store.json")
with open(store_path, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total chunks in vector store: {len(data)}")

# Count by scheme_id
scheme_counts = {}
for d in data:
    sid = d.get("metadata", {}).get("scheme_id", "UNKNOWN")
    scheme_counts[sid] = scheme_counts.get(sid, 0) + 1

print(f"\nUnique scheme IDs: {len(scheme_counts)}")
for sid in sorted(scheme_counts.keys()):
    print(f"  {sid}: {scheme_counts[sid]} chunks")

# Check embedding dimensions
if data:
    sample = data[0]
    emb = sample.get("embedding", [])
    print(f"\nEmbedding dimension: {len(emb)}")
    text_sample = sample.get("text", "")[:200]
    print(f"Sample chunk text: {text_sample}...")
    print(f"Sample metadata keys: {list(sample.get('metadata', {}).keys())}")

# Check for any document_id (uploaded docs)
doc_chunks = [d for d in data if d.get("metadata", {}).get("document_id")]
print(f"\nChunks from uploaded documents: {len(doc_chunks)}")
