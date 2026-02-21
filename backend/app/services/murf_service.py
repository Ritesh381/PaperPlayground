import httpx
from typing import AsyncGenerator
from app.config import MURF_API_KEY

async def stream_voice_from_murf(text: str) -> AsyncGenerator[bytes, None]:
    if not MURF_API_KEY:
        raise ValueError("MURF_API_KEY is not configured")
        
    url = "https://global.api.murf.ai/v1/speech/stream"
    headers = {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "voice_id": "en-US-elvira", 
        "text": text,
        "multi_native_locale": "en-US",
        "model": "FALCON",
        "format": "MP3",
        "sampleRate": 24000,
        "channelType": "MONO",
        "style": "Narration"
    }
    
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", url, headers=headers, json=data, timeout=30.0) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(chunk_size=1024):
                if chunk:
                    yield chunk
