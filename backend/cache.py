"""
eSKala — In-Memory TTL Cache
Thread-safe, zero-dependency cache for read-heavy API endpoints.

Usage:
    from cache import cache

    # Get or set
    value = cache.get("my_key")
    if value is None:
        value = expensive_db_call()
        cache.set("my_key", value, ttl=60)

    # Invalidate a specific key
    cache.delete("my_key")

    # Invalidate all keys that start with a prefix
    cache.invalidate_prefix("reports:")
"""

import time
import threading
from typing import Any, Optional

__all__ = ["cache"]


class TTLCache:
    """
    Simple in-memory cache with per-entry TTL (Time-To-Live).

    - Thread-safe via a single RLock.
    - Expired entries are lazily evicted on access; also pruned on every set().
    - Stores raw Python objects (dicts, lists, Pydantic models, etc.)
    """

    def __init__(self) -> None:
        # _store: { key: (value, expires_at_monotonic) }
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.RLock()

    def get(self, key: str) -> Optional[Any]:
        """
        Return the cached value for *key*, or None if absent / expired.
        Expired entries are removed on access.
        """
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: float) -> None:
        """
        Store *value* under *key* for *ttl* seconds.
        Also prunes all expired entries from the store.
        """
        expires_at = time.monotonic() + ttl
        with self._lock:
            self._store[key] = (value, expires_at)
            self._prune()

    def delete(self, key: str) -> None:
        """Remove a single key (no-op if absent)."""
        with self._lock:
            self._store.pop(key, None)

    def invalidate_prefix(self, prefix: str) -> None:
        """
        Remove all keys whose names begin with *prefix*.
        Safe to call from any thread / worker.
        """
        with self._lock:
            keys_to_delete = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_delete:
                del self._store[k]

    def clear(self) -> None:
        """Wipe the entire cache."""
        with self._lock:
            self._store.clear()

    def _prune(self) -> None:
        """
        Remove all expired entries. Must be called while holding self._lock.
        Called automatically on every set() to prevent unbounded memory growth.
        """
        now = time.monotonic()
        expired = [k for k, (_, exp) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]


# ── Singleton used across all routers ─────────────────────────────────────────
cache = TTLCache()
