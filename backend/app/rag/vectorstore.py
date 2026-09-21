"""
In-Memory JSON Vector Store.
Stores document chunks and embedding vectors in a local JSON file.
Performs cosine similarity search using pure Python math — no numpy, no chromadb.
"""

import os
import json
import math
from typing import List, Dict, Any, Tuple
from app.config import settings

STORE_DIR = os.path.abspath(settings.VECTOR_STORE_DIRECTORY)
STORE_PATH = os.path.join(STORE_DIR, "vector_store.json")


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Pure Python cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class VectorStore:
    def __init__(self):
        self._ensure_store_dir()
        self.documents: List[Dict[str, Any]] = []
        self.load()

    def _ensure_store_dir(self):
        if not os.path.exists(STORE_DIR):
            os.makedirs(STORE_DIR, exist_ok=True)

    def load(self):
        """Loads vector store from JSON file on disk."""
        if os.path.exists(STORE_PATH):
            try:
                with open(STORE_PATH, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
                print(f"[INFO] Vector store loaded: {len(self.documents)} chunks.")
            except Exception as e:
                print(f"[WARN] Failed to load vector store: {e}. Starting fresh.")
                self.documents = []
        else:
            self.documents = []

    def save(self):
        """Persists vector store to JSON file on disk."""
        with open(STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, indent=2, ensure_ascii=False)

    def add_texts(
        self,
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
    ):
        """Adds document chunks with their embeddings to the store."""
        for text, emb, meta in zip(texts, embeddings, metadatas):
            self.documents.append({
                "text": text,
                "embedding": emb,
                "metadata": meta,
            })
        self.save()

    def similarity_search(
        self, query_embedding: List[float], k: int = 3
    ) -> List[Tuple[str, Dict[str, Any], float]]:
        """
        Cosine similarity search — pure Python, no numpy.
        Returns top-k (chunk_text, metadata, score) tuples.
        """
        if not self.documents:
            return []

        scores = [
            (doc["text"], doc["metadata"], _cosine_similarity(query_embedding, doc["embedding"]))
            for doc in self.documents
        ]
        scores.sort(key=lambda x: x[2], reverse=True)
        return scores[:k]

    def clear(self):
        """Clears the vector store from memory and disk."""
        self.documents = []
        if os.path.exists(STORE_PATH):
            os.remove(STORE_PATH)
        self._ensure_store_dir()

    def __len__(self) -> int:
        return len(self.documents)
