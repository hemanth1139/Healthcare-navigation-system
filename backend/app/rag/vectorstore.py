"""
In-Memory JSON Vector Store.
Stores document chunks and embedding vectors locally.
Performs Cosine Similarity searching using NumPy.
"""

import os
import json
import numpy as np
from typing import List, Dict, Any, Tuple
from app.config import settings

# Path to the persisted json store
STORE_DIR = os.path.abspath(settings.CHROMA_PERSIST_DIRECTORY)
STORE_PATH = os.path.join(STORE_DIR, "vector_store.json")


class VectorStore:
    def __init__(self):
        self._ensure_store_dir()
        self.documents: List[Dict[str, Any]] = []
        self.load()

    def _ensure_store_dir(self):
        if not os.path.exists(STORE_DIR):
            os.makedirs(STORE_DIR)

    def load(self):
        """Loads vector store from JSON file."""
        if os.path.exists(STORE_PATH):
            try:
                with open(STORE_PATH, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
            except Exception as e:
                print(f"[WARN] Error loading vector store: {e}. Starting fresh.")
                self.documents = []
        else:
            self.documents = []

    def save(self):
        """Saves vector store to JSON file."""
        with open(STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, indent=2, ensure_ascii=False)

    def add_texts(self, texts: List[str], embeddings: List[List[float]], metadatas: List[Dict[str, Any]]):
        """Adds document chunks and corresponding vectors to the store."""
        for text, emb, meta in zip(texts, embeddings, metadatas):
            self.documents.append({
                "text": text,
                "embedding": emb,
                "metadata": meta
            })
        self.save()

    def similarity_search(self, query_embedding: List[float], k: int = 3) -> List[Tuple[str, Dict[str, Any], float]]:
        """
        Performs cosine similarity search.
        Returns: List of Tuple (chunk_text, metadata, similarity_score)
        """
        if not self.documents:
            return []

        q_vec = np.array(query_embedding)
        q_norm = np.linalg.norm(q_vec)

        if q_norm == 0:
            return []

        scores = []
        for doc in self.documents:
            doc_vec = np.array(doc["embedding"])
            doc_norm = np.linalg.norm(doc_vec)
            
            if doc_norm == 0:
                similarity = 0.0
            else:
                similarity = float(np.dot(q_vec, doc_vec) / (q_norm * doc_norm))
                
            scores.append((doc["text"], doc["metadata"], similarity))

        # Sort by similarity score descending
        sorted_scores = sorted(scores, key=lambda x: x[2], reverse=True)
        return sorted_scores[:k]

    def clear(self):
        """Clears the vector store."""
        self.documents = []
        if os.path.exists(STORE_PATH):
            os.remove(STORE_PATH)
        self._ensure_store_dir()
