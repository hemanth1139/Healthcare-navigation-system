"""
In-Memory JSON Vector Store with Hybrid Search (Vector + BM25).
Stores document chunks and embedding vectors in a local JSON file.
Performs cosine similarity search using pure Python math — no numpy, no chromadb.
"""

import os
import json
import math
import re
from collections import Counter, defaultdict
from typing import List, Dict, Any, Tuple, Optional
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


def _tokenize(text: str) -> List[str]:
    """Simple tokenizer - lowercase, remove punctuation, split on whitespace."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    return text.split()


class BM25Index:
    """BM25 keyword search index for hybrid search."""
    
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_freqs = defaultdict(Counter)
        self.idf = defaultdict(float)
        self.doc_len = []
        self.avg_doc_len = 0
        self.n_docs = 0
        self.documents = []
    
    def add_document(self, doc_id: int, text: str):
        """Add a document to the BM25 index."""
        tokens = _tokenize(text)
        self.doc_freqs[doc_id] = Counter(tokens)
        self.doc_len.append(len(tokens))
        self.documents.append(text)
        self.n_docs += 1
        self.avg_doc_len = sum(self.doc_len) / self.n_docs
    
    def build_idf(self):
        """Build IDF scores for all terms."""
        N = self.n_docs
        df = defaultdict(int)
        for doc_id in self.doc_freqs:
            for term in self.doc_freqs[doc_id]:
                df[term] += 1
        
        for term, freq in df.items():
            self.idf[term] = math.log((N - freq + 0.5) / (freq + 0.5) + 1.0)
    
    def search(self, query: str, k: int = 5) -> List[Tuple[int, float]]:
        """Search using BM25 scoring."""
        query_tokens = _tokenize(query)
        scores = []
        
        for doc_id in range(self.n_docs):
            score = 0.0
            doc_len = self.doc_len[doc_id]
            doc_terms = self.doc_freqs[doc_id]
            
            for term in query_tokens:
                if term in doc_terms:
                    tf = doc_terms[term]
                    idf = self.idf.get(term, 0)
                    numerator = tf * (self.k1 + 1)
                    denominator = tf + self.k1 * (1 - self.b + self.b * (doc_len / self.avg_doc_len))
                    score += idf * (numerator / denominator)
            
            if score > 0:
                scores.append((doc_id, score))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:k]


class VectorStore:
    def __init__(self):
        self._ensure_store_dir()
        self.documents: List[Dict[str, Any]] = []
        self.bm25_index: Optional[BM25Index] = None
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
                self._build_bm25_index()
            except Exception as e:
                print(f"[WARN] Failed to load vector store: {e}. Starting fresh.")
                self.documents = []
        else:
            self.documents = []

    def _build_bm25_index(self):
        """Build BM25 index for keyword search."""
        self.bm25_index = BM25Index()
        for idx, doc in enumerate(self.documents):
            self.bm25_index.add_document(idx, doc["text"])
        self.bm25_index.build_idf()

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
        self._build_bm25_index()

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

    def hybrid_search(
        self, 
        query_embedding: List[float], 
        query_text: str, 
        k: int = 5,
        alpha: float = 0.5
    ) -> List[Tuple[str, Dict[str, Any], float]]:
        """
        Hybrid search combining vector similarity and BM25 keyword search.
        alpha: weight for vector search (0-1), (1-alpha) for BM25
        Returns top-k (chunk_text, metadata, combined_score) tuples.
        """
        if not self.documents:
            return []

        # Vector search scores
        vector_scores = {
            idx: _cosine_similarity(query_embedding, doc["embedding"])
            for idx, doc in enumerate(self.documents)
        }

        # BM25 search scores
        bm25_scores = {}
        if self.bm25_index:
            bm25_results = self.bm25_index.search(query_text, k=len(self.documents))
            bm25_scores = {doc_id: score for doc_id, score in bm25_results}

        # Combine scores
        combined_scores = []
        for idx, doc in enumerate(self.documents):
            vec_score = vector_scores.get(idx, 0.0)
            bm25_score = bm25_scores.get(idx, 0.0)
            
            # Normalize scores to 0-1 range
            max_vec = max(vector_scores.values()) if vector_scores else 1.0
            max_bm25 = max(bm25_scores.values()) if bm25_scores else 1.0
            
            norm_vec = vec_score / max_vec if max_vec > 0 else 0.0
            norm_bm25 = bm25_score / max_bm25 if max_bm25 > 0 else 0.0
            
            combined_score = alpha * norm_vec + (1 - alpha) * norm_bm25
            combined_scores.append((doc["text"], doc["metadata"], combined_score))

        combined_scores.sort(key=lambda x: x[2], reverse=True)
        return combined_scores[:k]

    def delete_by_document_id(self, document_id: str) -> int:
        """Removes all vector chunks associated with a specific uploaded document ID."""
        doc_id_str = str(document_id)
        original_count = len(self.documents)
        self.documents = [
            d for d in self.documents
            if str(d.get("metadata", {}).get("document_id")) != doc_id_str
        ]
        removed = original_count - len(self.documents)
        if removed > 0:
            self.save()
            self._build_bm25_index()
            print(f"[INFO] Removed {removed} vector chunks for document {doc_id_str}.")
        return removed

    def get_chunks_by_document_id(self, document_id: str) -> List[Dict[str, Any]]:
        """Retrieves all indexed vector chunks for a specific document ID."""
        doc_id_str = str(document_id)
        return [
            d for d in self.documents
            if str(d.get("metadata", {}).get("document_id")) == doc_id_str
        ]

    def clear(self):
        """Clears the vector store from memory and disk."""
        self.documents = []
        self.bm25_index = None
        if os.path.exists(STORE_PATH):
            os.remove(STORE_PATH)
        self._ensure_store_dir()

    def __len__(self) -> int:
        return len(self.documents)

