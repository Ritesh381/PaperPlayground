from fastapi import APIRouter, File, Form, UploadFile

from app.models.story import StoryResponse
from app.controllers.story_controller import start_story_controller, generate_story_controller

router = APIRouter(prefix="/story", tags=["Story"])


# ─── Step 1: Upload file → get session_id ────────────────────────────────────

@router.post(
    "/start",
    summary="Upload study material and get a session_id for WebSocket streaming",
)
async def start_story_route(
    character: str = Form(
        ...,
        description='JSON string: {"name": "...", "description": "...", "tone": "..."}'
    ),
    file: UploadFile = File(..., description="Study material (.pdf or .txt)"),
    prompt: str = Form(
        default="",
        description="Optional creative direction",
    ),
) -> dict:
    """
    **POST /story/start** — Step 1 of the streaming workflow.

    Upload the file via multipart/form-data. The backend extracts the text,
    stores it in a session, and returns a `session_id`.

    Then open a WebSocket to `ws://localhost:8000/api/v1/story/stream/{session_id}`
    to receive the streamed story.

    Session expires after **5 minutes** if unused.
    """
    return await start_story_controller(
        character_json=character,
        file=file,
        prompt=prompt,
    )


# ─── (Optional) Blocking REST endpoint — returns the full story at once ───────

@router.post(
    "/generate",
    response_model=StoryResponse,
    summary="[Non-streaming] Generate a complete story in one request",
)
async def generate_story_route(
    character: str = Form(
        ...,
        description='JSON string: {"name": "...", "description": "...", "tone": "..."}'
    ),
    file: UploadFile = File(..., description="Study material (.pdf or .txt)"),
    prompt: str = Form(
        default="",
        description="Optional creative direction",
    ),
) -> StoryResponse:
    """
    **POST /story/generate** — Single blocking request, returns the full story.

    Use `/start` + WebSocket instead for a streaming experience.
    """
    return await generate_story_controller(
        character_json=character,
        file=file,
        prompt=prompt,
    )
