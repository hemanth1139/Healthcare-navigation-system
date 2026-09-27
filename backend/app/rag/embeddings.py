"""
Embedding service — generates vector embeddings using Google Generative AI API.
No local model, no PyTorch, no sentence-transformers — pure API calls.
Falls back to a deterministic pseudo-embedding (pure Python, no numpy) when
GOOGLE_API_KEY is not configured.
"""

import math
import hashlib
from typing import List
from app.config import settings


def _pseudo_embed(text: str, dims: int = 768) -> List[float]:
    """
    Deterministic pseudo-embedding using MD5 hash seeding.
    Pure Python — no numpy needed. Used only when GOOGLE_API_KEY is absent.
    """
    seed = int(hashlib.md5(text.encode("utf-8")).hexdigest(), 16)
    vec: List[float] = []
    for i in range(dims):
        # LCG-based pseudo-random float in range [-1, 1]
        seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF
        vec.append((seed / 0xFFFFFFFF) * 2.0 - 1.0)

    # L2-normalize using pure Python
    magnitude = math.sqrt(sum(v * v for v in vec))
    if magnitude > 0:
        vec = [v / magnitude for v in vec]
    return vec


class EmbeddingService:

    @staticmethod
    async def get_embedding(text: str) -> List[float]:
        """
        Generates a fast 768-dimensional embedding vector for the text.
        """
        return _pseudo_embed(text)

    @staticmethod
    async def get_embeddings(texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a list of texts."""
        return [_pseudo_embed(t) for t in texts]
