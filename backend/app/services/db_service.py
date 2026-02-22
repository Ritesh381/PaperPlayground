from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, DB_NAME
from typing import Optional, Dict, Any

client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = client[DB_NAME]
stories_collection = db["stories"]
characters_collection = db["characters"]

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

async def save_character_to_db(character_dict: Dict[str, Any]) -> Optional[str]:
    """Save a character to MongoDB."""
    try:
        result = await characters_collection.insert_one(character_dict)
        return str(result.inserted_id)
    except Exception as e:
        print(f"Warning: Character save failed: {e}")
        return None

async def get_character_from_db(character_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a character by ID."""
    from bson.objectid import ObjectId
    try:
        query = {"id": character_id} if not ObjectId.is_valid(character_id) else {"_id": ObjectId(character_id)}
        character = await characters_collection.find_one(query)
        if character:
            if "_id" in character:
                character["id"] = str(character["_id"])
                del character["_id"]
        return character
    except Exception as e:
        print(f"Warning: Character fetch failed: {e}")
        return None

async def get_characters_by_ids(character_ids: list[str]) -> list[Dict[str, Any]]:
    """Retrieve multiple characters by a list of IDs."""
    from bson.objectid import ObjectId
    try:
        query_conditions = []
        for cid in character_ids:
            if ObjectId.is_valid(cid):
                query_conditions.append({"_id": ObjectId(cid)})
            query_conditions.append({"id": cid}) # also try matching string id directly since some defaults or user IDs may be strings

        if not query_conditions:
            return []

        cursor = characters_collection.find({"$or": query_conditions})
        characters = await cursor.to_list(length=100)
        
        for char in characters:
            if "_id" in char:
                # favor original id if set, else use Mongo _id
                char["id"] = char.get("id", str(char["_id"])) 
                del char["_id"]
        return characters
    except Exception as e:
        print(f"Warning: Batch characters fetch failed: {e}")
        return []
