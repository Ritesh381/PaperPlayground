import json
from fastapi import WebSocket, WebSocketDisconnect

from app.services.session_service import get_and_delete_session
from app.services.ai_service import generate_story_stream
from app.models.story import StoryResponse


async def stream_story_ws_controller(websocket: WebSocket, session_id: str) -> None:
    """
    WebSocket controller for streaming story generation.

    Protocol
    ────────
    1. Client connects to  ws://.../api/v1/story/stream/{session_id}
    2. Server immediately starts streaming AI tokens:
          {"type": "chunk",  "content": "<token>"}
    3. After all tokens arrive, server sends the fully parsed story:
          {"type": "done",   "story": { <StoryResponse> }}
    4. On any error:
          {"type": "error",  "detail": "<message>"}
    """
    await websocket.accept()

    # ── 1. Look up and consume the session ───────────────────────────────────
    session = await get_and_delete_session(session_id)
    if session is None:
        await _send_error(
            websocket,
            f"Session '{session_id}' not found or has expired. "
            "Please POST to /api/v1/story/start to create a new session."
        )
        return

    # ── 2. Stream from OpenRouter, forwarding each chunk to the client ────────
    accumulated = ""
    try:
        async for chunk in generate_story_stream(
            character=session.character,
            file_content=session.file_content,
            prompt=session.prompt,
        ):
            accumulated += chunk
            await websocket.send_text(
                json.dumps({"type": "chunk", "content": chunk})
            )
    except RuntimeError as exc:
        await _send_error(websocket, str(exc))
        return
    except WebSocketDisconnect:
        return  # Client disconnected mid-stream — nothing to do

    # ── 3. Parse the full accumulated JSON and send the "done" event ──────────
    try:
        story_dict = json.loads(accumulated)
        story = StoryResponse(**story_dict)
        await websocket.send_text(
            json.dumps({"type": "done", "story": story.model_dump()})
        )
    except (json.JSONDecodeError, ValueError, TypeError) as exc:
        await _send_error(
            websocket,
            f"Failed to parse completed story JSON: {exc}. "
            f"Raw output (first 500 chars): {accumulated[:500]}"
        )
        return

    # ── 4. Close cleanly ──────────────────────────────────────────────────────
    await websocket.close()


async def _send_error(websocket: WebSocket, detail: str) -> None:
    try:
        await websocket.send_text(json.dumps({"type": "error", "detail": detail}))
        await websocket.close(code=1011)
    except Exception:
        pass
