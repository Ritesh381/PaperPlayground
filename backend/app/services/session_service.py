"""
In-memory session store.

Holds the extracted file content + character + prompt for a short window
between the REST /start call and the WebSocket /stream connection.

Sessions are one-shot: they are automatically deleted once consumed (streamed)
or after TTL_SECONDS have passed, whichever comes first.

For production replace this with Redis.
"""

import asyncio
import time
from typing import Optional
from dataclasses import dataclass, field

from app.models.story import Character

TTL_SECONDS: int = 300  # 5 minutes — plenty of time to open the WebSocket


@dataclass
class Session:
    character: Character
    file_content: str
    prompt: str
    user_name: str
    created_at: float = field(default_factory=time.monotonic)


# ─── Store ────────────────────────────────────────────────────────────────────

_store: dict[str, Session] = {}
_lock = asyncio.Lock()


async def create_session(
    session_id: str,
    character: Character,
    file_content: str,
    prompt: str,
    user_name: str = "",
) -> None:
    async with _lock:
        _store[session_id] = Session(
            character=character,
            file_content=file_content,
            prompt=prompt,
            user_name=user_name,
        )


async def get_and_delete_session(session_id: str) -> Optional[Session]:
    """Returns the session and removes it from the store (one-shot)."""
    async with _lock:
        session = _store.pop(session_id, None)
        if session is None:
            return None
        # Reject expired sessions
        if time.monotonic() - session.created_at > TTL_SECONDS:
            return None
        return session


async def cleanup_expired() -> None:
    """Prune sessions older than TTL (call periodically if needed)."""
    now = time.monotonic()
    async with _lock:
        expired = [k for k, v in _store.items() if now - v.created_at > TTL_SECONDS]
        for k in expired:
            del _store[k]
