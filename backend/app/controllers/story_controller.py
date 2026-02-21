import json
import uuid
from fastapi import UploadFile, HTTPException

from app.models.story import Character, StoryResponse
from app.services.file_service import extract_text
from app.services.ai_service import generate_story
from app.services.session_service import create_session


# ─── Shared helper ────────────────────────────────────────────────────────────

def _parse_character(character_json: str) -> Character:
    try:
        return Character(**json.loads(character_json))
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid 'character' JSON: {exc}")


# ─── REST: upload + start → returns session_id ───────────────────────────────

async def start_story_controller(
    character_json: str,
    file: UploadFile,
    prompt: str,
) -> dict:
    """
    Accepts the file upload via REST, extracts text, stores everything in
    the session store, and returns a session_id for the WebSocket to use.
    """
    character = _parse_character(character_json)

    file_content = await extract_text(file)
    if not file_content.strip():
        raise HTTPException(status_code=400, detail="Uploaded file appears to be empty or unreadable.")

    session_id = str(uuid.uuid4())
    await create_session(session_id, character, file_content, prompt or "")

    return {"session_id": session_id}


# ─── REST: upload + generate (non-streaming, kept for convenience) ────────────

async def generate_story_controller(
    character_json: str,
    file: UploadFile,
    prompt: str,
) -> StoryResponse:
    """
    Full blocking REST endpoint — uploads file and returns the complete story.
    """
    character = _parse_character(character_json)

    file_content = await extract_text(file)
    if not file_content.strip():
        raise HTTPException(status_code=400, detail="Uploaded file appears to be empty or unreadable.")

    return await generate_story(
        character=character,
        file_content=file_content,
        prompt=prompt or "",
    )
