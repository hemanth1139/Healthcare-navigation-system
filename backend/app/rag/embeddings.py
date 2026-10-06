"""
Embedding service — generates vector embeddings using free providers:
1. SentenceTransformers (local, no API key) - Primary
2. Google Gemini Embeddings (free tier) - Secondary
3. Pseudo-embedding (last resort)
Uses provider fallback with structured error handling and caching.
"""

import os
import math
import hashlib
import asyncio
import logging
from typing import List, Optional
from app.config import settings
from app.core.cache import embedding_cache

logger = logging.getLogger("app.rag.embeddings")

# Embedding provider priority (free only)
EMBEDDING_PROVIDERS = ["sentence_transformers", "gemini", "pseudo"]
DEFAULT_EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # SentenceTransformers model
DEFAULT_DIMENSION = 384  # all-MiniLM-L6-v2 dimension

# Global model cache
_sentence_model = None


def _get_sentence_model():
    """Load or return cached SentenceTransformers model."""
    global _sentence_model
    if _sentence_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Set cache directory to project folder to avoid permission issues
            cache_dir = os.path.join(os.path.dirname(__file__), "..", "..", ".cache", "sentence_transformers")
            os.makedirs(cache_dir, exist_ok=True)
            os.environ['TRANSFORMERS_CACHE'] = cache_dir
            os.environ['HF_HOME'] = cache_dir

            logger.info("[EMBEDDINGS] Loading SentenceTransformers model: %s", DEFAULT_EMBEDDING_MODEL)
            _sentence_model = SentenceTransformer(DEFAULT_EMBEDDING_MODEL, cache_folder=cache_dir)
            logger.info("[EMBEDDINGS] SentenceTransformers model loaded successfully")
        except ImportError:
            logger.warning("[EMBEDDINGS] sentence-transformers not installed. Run: pip install sentence-transformers")
            return None
        except Exception as e:
            logger.error("[EMBEDDINGS] Failed to load SentenceTransformers model: %s", e)
            return None
    return _sentence_model


def _get_genai_client(api_key: Optional[str] = None):
    """Get Google GenAI client if API key is configured."""
    try:
        from google import genai
        if not api_key:
            api_key = getattr(settings, "GOOGLE_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return None
        return genai.Client(api_key=api_key)
    except ImportError:
        logger.warning("[EMBEDDINGS] google-genai not installed")
        return None
    except Exception as e:
        logger.error("[EMBEDDINGS] Failed to initialize Google GenAI client: %s", e)
        return None


def _get_api_keys() -> List[str]:
    """Get all configured Google API keys for rotation (uses centralized llm.py function)."""
    from app.core.llm import _get_gemini_api_keys
    return _get_gemini_api_keys()


async def _embed_with_sentence_transformers(text: str) -> Optional[List[float]]:
    """Generate embedding using local SentenceTransformers model (no API key required)."""
    model = _get_sentence_model()
    if model is None:
        return None
    try:
        loop = asyncio.get_running_loop()
        embedding = await loop.run_in_executor(None, model.encode, text)
        # Convert to list and normalize
        vec = embedding.tolist()
        magnitude = math.sqrt(sum(v * v for v in vec))
        if magnitude > 0:
            vec = [v / magnitude for v in vec]
        logger.info("[EMBEDDINGS] SentenceTransformers embedding generated")
        return vec
    except Exception as e:
        logger.error("[EMBEDDINGS] SentenceTransformers failed: %s", e)
        return None


async def _embed_with_gemini(text: str) -> Optional[List[float]]:
    """Generate embedding using Google Gemini API (free tier)."""
    api_keys = _get_api_keys()
    if not api_keys:
        return None

    model_name = getattr(settings, "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001") or "gemini-embedding-001"

    for key_idx, api_key in enumerate(api_keys):
        client = _get_genai_client(api_key)
        if not client:
            continue

        for attempt in range(1, 3):
            try:
                loop = asyncio.get_running_loop()
                res = await loop.run_in_executor(
                    None,
                    lambda: client.models.embed_content(
                        model=model_name,
                        contents=text,
                        config={"output_dimensionality": 768}
                    )
                )
                if res and res.embeddings:
                    logger.info("[EMBEDDINGS] Gemini embedding generated with API key %d", key_idx + 1)
                    return res.embeddings[0].values
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                    logger.warning("[EMBEDDINGS] Gemini API key %d quota exhausted", key_idx + 1)
                    break
                if "400" in err_str and ("api key not valid" in err_str or "api_key_invalid" in err_str):
                    logger.warning("[EMBEDDINGS] Gemini API key %d is invalid", key_idx + 1)
                    break
                if attempt < 2:
                    await asyncio.sleep(0.5)
    return None


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
        Generates embedding vector using multiple providers with fallback:
        1. SentenceTransformers (local, no API key) - Primary
        2. OpenAI (API-based)
        3. Google Gemini (API-based)
        4. Pseudo-embedding (last resort)
        Includes caching to reduce API calls.
        """
        # Check cache first
        cache_key = f"emb:{hashlib.md5(text.encode()).hexdigest()}"
        cached = embedding_cache.get(cache_key)
        if cached:
            logger.info("[EMBEDDINGS] Cache hit for embedding")
            return cached

        # Try each provider in priority order
        result = None

        # 1. Try SentenceTransformers (local, free, no API key)
        result = await _embed_with_sentence_transformers(text)
        if result:
            embedding_cache.set(cache_key, result, ttl_seconds=86400)
            return result

        # 2. Try Gemini (free tier)
        result = await _embed_with_gemini(text)
        if result:
            embedding_cache.set(cache_key, result, ttl_seconds=86400)
            return result

        # 3. Fallback to pseudo-embedding
        logger.warning("[EMBEDDINGS] All providers failed. Using pseudo-embedding fallback.")
        result = _pseudo_embed(text)
        embedding_cache.set(cache_key, result, ttl_seconds=86400)
        return result

    @staticmethod
    async def get_embeddings(texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a batch of texts using multiple providers.
        Processes in batches for better performance.
        """
        if not texts:
            return []

        # Use SentenceTransformers for batch processing (most efficient)
        model = _get_sentence_model()
        if model:
            try:
                loop = asyncio.get_running_loop()
                embeddings = await loop.run_in_executor(None, model.encode, texts)
                # Normalize each embedding
                result = []
                for emb in embeddings:
                    vec = emb.tolist()
                    magnitude = math.sqrt(sum(v * v for v in vec))
                    if magnitude > 0:
                        vec = [v / magnitude for v in vec]
                    result.append(vec)
                logger.info("[EMBEDDINGS] Batch embeddings generated with SentenceTransformers")
                return result
            except Exception as e:
                logger.error("[EMBEDDINGS] Batch SentenceTransformers failed: %s", e)

        # Fallback to individual calls
        logger.info("[EMBEDDINGS] Falling back to individual embedding calls")
        return [await EmbeddingService.get_embedding(text) for text in texts]
