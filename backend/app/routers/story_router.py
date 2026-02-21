from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from app.models.story import StoryResponse
from app.controllers.story_controller import start_story_controller, generate_story_controller
from app.services.db_service import get_story_from_db

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
    user_name: str = Form(
        default="",
        description="Optional user name",
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
        user_name=user_name,
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
    user_name: str = Form(
        default="",
        description="Optional user name",
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
        user_name=user_name,
    )


# ─── Fetch specifically by ID ───────────────────────────────────

@router.get("/{story_id}", response_model=StoryResponse)
async def get_story_by_id(story_id: str):
    """Fetch a previously generated story by its MongoDB object id."""
    story_dict = await get_story_from_db(story_id)
    if not story_dict:
        raise HTTPException(status_code=404, detail="Story not found")
    return StoryResponse(**story_dict)
    
