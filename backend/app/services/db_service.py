from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, DB_NAME
from typing import Optional, Dict, Any

client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = client[DB_NAME]
stories_collection = db["stories"]

async def save_story_to_db(story_dict: Dict[str, Any]) -> Optional[str]:
    """Save a story document to MongoDB. Returns None if DB is unavailable."""
    try:
        result = await stories_collection.insert_one(story_dict)
        return str(result.inserted_id)
    except Exception as e:
        print(f"Warning: Database save failed: {e}")
        return None

async def get_story_from_db(story_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a story by its MongoDB ObjectId string."""
    from bson.objectid import ObjectId
    try:
        obj_id = ObjectId(story_id)
        story = await stories_collection.find_one({"_id": obj_id})
        if story:
            story["id"] = str(story["_id"])
            del story["_id"]
        return story
    except Exception as e:
        print(f"Warning: Database fetch failed: {e}")
        return None
