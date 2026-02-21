from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, DB_NAME
from typing import Optional, Dict, Any

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
stories_collection = db["stories"]

async def save_story_to_db(story_dict: Dict[str, Any]) -> str:
    """Save a story document to MongoDB and return its generated string ID."""
    result = await stories_collection.insert_one(story_dict)
    return str(result.inserted_id)

async def get_story_from_db(story_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a story by its MongoDB ObjectId string."""
    from bson.objectid import ObjectId
    try:
        obj_id = ObjectId(story_id)
    except Exception:
        return None
        
    story = await stories_collection.find_one({"_id": obj_id})
    if story:
        story["id"] = str(story["_id"])
        del story["_id"]
    return story
