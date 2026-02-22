from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.services.db_service import save_character_to_db, get_characters_by_ids

router = APIRouter(prefix="/character", tags=["Character"])

class CharacterCreate(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    tone: str
    avatar: str
    isPrivate: bool = False

@router.post("")
async def create_character(character: CharacterCreate) -> Dict[str, str]:
    """Save a character to the database and return its ID."""
    char_dict = character.model_dump()
    char_id = await save_character_to_db(char_dict)
    if not char_id:
        raise HTTPException(status_code=500, detail="Failed to save character to database.")
    return {"id": char_id}

@router.post("/batch")
async def get_characters(ids: List[str] = Body(...)) -> List[Dict[str, Any]]:
    """Retrieve multiple characters by a list of IDs."""
    if not ids:
        return []
    characters = await get_characters_by_ids(ids)
    return characters
