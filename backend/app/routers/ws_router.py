from fastapi import APIRouter, WebSocket

from app.controllers.ws_controller import stream_story_ws_controller

router = APIRouter(tags=["WebSocket"])


@router.websocket("/story/stream/{session_id}")
async def story_stream_websocket(websocket: WebSocket, session_id: str):
    """
    **WS /api/v1/story/stream/{session_id}** — Step 2 of the streaming workflow.

    1. First POST to `/api/v1/story/start` to upload the file and receive a `session_id`.
    2. Connect here with that `session_id` — streaming begins immediately.

    Messages received:
    - `{"type": "chunk",  "content": "..."}` — streaming token from AI
    - `{"type": "done",   "story": {...}}`    — final parsed StoryResponse
    - `{"type": "error",  "detail": "..."}`   — on failure
    """
    await stream_story_ws_controller(websocket, session_id)
