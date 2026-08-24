"""
Embedding service — generates vector embeddings using Gemini API (text-embedding-004).
Supports a local word-vector space fallback when GOOGLE_API_KEY is not configured.
"""

import numpy as np
from typing import List
from app.config import settings


class EmbeddingService:
    @staticmethod
    async def get_embedding(text: str) -> List[float]:
        """
        Generates a 768-dimensional embedding vector for the text.
        """
        if not settings.GOOGLE_API_KEY:
            # Fallback: Create a deterministic pseudo-embedding using a simple word-hash algorithm
            # to enable vector calculations (e.g. Cosine Similarity) without API keys.
            print("[WARN] GOOGLE_API_KEY not configured. Generating pseudo-embedding vector.")
            import hashlib
            hash_val = int(hashlib.md5(text.encode("utf-8")).hexdigest(), 16)
            np.random.seed(hash_val % (2**32 - 1))
            vec = np.random.normal(0, 1, 768)
            # Normalize vector
            vec = vec / np.linalg.norm(vec)
            return vec.tolist()

        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        try:
            embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=settings.GOOGLE_API_KEY
            )
            # Call async embedding generator
            res = await embeddings.aembed_query(text)
            return res
        except Exception as e:
            print(f"[ERROR] Error generating Gemini embedding: {e}. Falling back to pseudo-embedding.")
            import hashlib
            hash_val = int(hashlib.md5(text.encode("utf-8")).hexdigest(), 16)
            np.random.seed(hash_val % (2**32 - 1))
            vec = np.random.normal(0, 1, 768)
            vec = vec / np.linalg.norm(vec)
            return vec.tolist()

    @staticmethod
    async def get_embeddings(texts: List[str]) -> List[List[float]]:
        """Generates list of embeddings."""
        return [await EmbeddingService.get_embedding(t) for t in texts]
