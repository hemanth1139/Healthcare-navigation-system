"""
Simple in-memory cache with TTL and LRU support for RAG results and embeddings.
Reduces API calls and improves response times.
"""

import time
import hashlib
import json
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
from collections import OrderedDict


class SimpleCache:
    """Simple in-memory cache with time-to-live (TTL) and LRU eviction support."""
    
    def __init__(self, max_size: int = 1000):
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._ttl: Dict[str, float] = {}
        self._max_size = max_size
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate a unique cache key from arguments."""
        key_str = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if it exists and hasn't expired."""
        if key not in self._cache:
            return None
        
        # Check if expired
        if key in self._ttl and time.time() > self._ttl[key]:
            del self._cache[key]
            del self._ttl[key]
            return None
        
        # Move to end (most recently used)
        self._cache.move_to_end(key)
        return self._cache[key]["value"]
    
    def set(self, key: str, value: Any, ttl_seconds: int = 86400):
        """
        Set value in cache with TTL.
        Default TTL: 24 hours (86400 seconds)
        Implements LRU eviction when max_size is reached.
        """
        # Evict oldest item if at capacity
        if len(self._cache) >= self._max_size and key not in self._cache:
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            if oldest_key in self._ttl:
                del self._ttl[oldest_key]
        
        self._cache[key] = {
            "value": value,
            "created_at": time.time()
        }
        self._ttl[key] = time.time() + ttl_seconds
        # Move to end (most recently used)
        self._cache.move_to_end(key)
    
    def delete(self, key: str):
        """Delete a specific key from cache."""
        if key in self._cache:
            del self._cache[key]
        if key in self._ttl:
            del self._ttl[key]
    
    def clear(self):
        """Clear all cached items."""
        self._cache.clear()
        self._ttl.clear()
    
    def cleanup_expired(self):
        """Remove all expired items from cache."""
        current_time = time.time()
        expired_keys = [
            key for key, expiry in self._ttl.items()
            if current_time > expiry
        ]
        for key in expired_keys:
            del self._cache[key]
            del self._ttl[key]
    
    def size(self) -> int:
        """Return number of items in cache."""
        return len(self._cache)


# Global cache instances with size limits
rag_cache = SimpleCache(max_size=500)  # Cache for RAG pipeline results
embedding_cache = SimpleCache(max_size=2000)  # Cache for vector embeddings (larger)
