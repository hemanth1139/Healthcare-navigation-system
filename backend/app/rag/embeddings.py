"""
Embedding service — generates vector embeddings using Google Generative AI API (gemini-embedding-001).
Uses the centralized Google API credentials with structured error handling and bounded retry.
"""

import os
import math
import hashlib
import asyncio
import logging
from typing import List, Optional
from google import genai
from app.config import settings

logger = logging.getLogger("app.rag.embeddings")

DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"
DEFAULT_DIMENSION = 768


def _get_genai_client() -> Optional[genai.Client]:
    """Retrieves Google GenAI Client with server-side API key."""
    api_key = getattr(settings, "GOOGLE_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)


def _pseudo_embed(text: str, dims: int = DEFAULT_DIMENSION) -> List[float]:
    """
    Test fallback pseudo-embedding using MD5 hash seeding.
    Used ONLY in offline test environments when GOOGLE_API_KEY is not configured.
    """
    seed = int(hashlib.md5(text.encode("utf-8")).hexdigest(), 16)
    vec: List[float] = []
    for i in range(dims):
        seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF
        vec.append((seed / 0xFFFFFFFF) * 2.0 - 1.0)

    magnitude = math.sqrt(sum(v * v for v in vec))
    if magnitude > 0:
        vec = [v / magnitude for v in vec]
    return vec


class EmbeddingService:

    @staticmethod
    async def get_embedding(text: str) -> List[float]:
        """
        Generates a 768-dimensional normalized embedding vector using Google Gemini embedding API.
        """
        client = _get_genai_client()
        if not client:
            logger.warning("[EMBEDDINGS] No GOOGLE_API_KEY configured. Using deterministic test fallback.")
            return _pseudo_embed(text)

        model_name = getattr(settings, "GEMINI_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL) or DEFAULT_EMBEDDING_MODEL

        # Run embedding request in threadpool/async wrapper with retry
        for attempt in range(1, 3):
            try:
                loop = asyncio.get_running_loop()
                res = await loop.run_in_executor(
                    None,
                    lambda: client.models.embed_content(
                        model=model_name,
                        contents=text,
                        config={"output_dimensionality": DEFAULT_DIMENSION}
                    )
                )
                if res and res.embeddings:
                    return res.embeddings[0].values
            except Exception as e:
                logger.warning("[EMBEDDINGS] Attempt %d failed with model %s: %s", attempt, model_name, e)
                if attempt < 2:
                    await asyncio.sleep(0.5)
                else:
                    logger.error("[EMBEDDINGS] All embedding attempts failed. Raising exception.")
                    raise

        raise RuntimeError("Failed to generate embedding vector from Gemini.")

    @staticmethod
    async def get_embeddings(texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a batch of texts using Google Gemini API.
        Processes in safe batch sizes of 20.
        """
        if not texts:
            return []

        client = _get_genai_client()
        if not client:
            logger.warning("[EMBEDDINGS] No GOOGLE_API_KEY configured. Using deterministic test fallback.")
            return [_pseudo_embed(t) for t in texts]

        model_name = getattr(settings, "GEMINI_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL) or DEFAULT_EMBEDDING_MODEL
        all_embeddings: List[List[float]] = []
        batch_size = 20

        for i in range(0, len(texts), batch_size):
            chunk = texts[i:i + batch_size]
            loop = asyncio.get_running_loop()
            res = await loop.run_in_executor(
                None,
                lambda: client.models.embed_content(
                    model=model_name,
                    contents=chunk,
                    config={"output_dimensionality": DEFAULT_DIMENSION}
                )
            )
            if res and res.embeddings:
                all_embeddings.extend([emb.values for emb in res.embeddings])
            else:
                raise RuntimeError(f"Failed to generate embeddings for batch {i//batch_size}")

        return all_embeddings
