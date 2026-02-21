import httpx
from typing import AsyncGenerator
from app.config import SARVAM_API_KEY

async def stream_voice_from_sarvam(text: str) -> AsyncGenerator[bytes, None]:
    if not SARVAM_API_KEY:
        raise ValueError("SARVAM_API_KEY is not configured")
        
    url = "https://api.sarvam.ai/text-to-speech/stream"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "text": text,
        "target_language_code": "en-IN",
        "speaker": "shruti",
        "model": "bulbul:v3",
        "pace": 1.1,
        "speech_sample_rate": 22050,
        "output_audio_codec": "mp3",
        "enable_preprocessing": True
    }
    
    async with httpx.AsyncClient() as client:
        # Increase timeout or keep it standard since it's streaming
        async with client.stream("POST", url, headers=headers, json=data, timeout=30.0) as response:
            try:
                response.raise_for_status()
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    if chunk:
                        yield chunk
            except httpx.HTTPStatusError as e:
                # To get text of error, we must read it
                await response.aread()
                raise ValueError(f"Sarvam API Error: {response.status_code} - {response.text}") from e
