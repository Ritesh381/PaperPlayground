import json
import httpx
from typing import AsyncGenerator
from fastapi import HTTPException

from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL
from app.models.story import Character, StoryResponse

# ─── System prompt template ───────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are an educational visual novel engine.

You MUST strictly follow the provided JSON schema.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL FRAME LIMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- You MUST generate at least 8 frames.
- You MUST NOT generate more than 50 frames under any circumstance.
- If the study material is large, summarize and prioritize key concepts.
- NEVER exceed 50 frames. If you reach 50 frames, stop generation immediately.
- Violation of this rule is not allowed.
- The character is talking directly to the user with the text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- The story must focus on explaining key concepts from the material.
- The main character teaches the user directly using the provided character personality and tone.
- Insert a quiz (question frame) approximately every 7-10 teaching frames.
- Each quiz must:
    - Have 2-3 options.
    - Have only ONE correct answer.
    - Be immediately followed by an explanation frame that reveals the correct answer.
- The final frame must have "nextFrameId": null.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EDUCATIONAL PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- If the material is long:
    - Extract the most important 3-5 core ideas.
    - Teach those clearly and thoroughly.
    - Do NOT attempt to cover everything.
    - Quality over exhaustive coverage.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA (follow exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "title": "<short engaging story title>",
  "summary": "<summary of the story and what the character will teach to the user using direct conversation>",
  "frames": [
    // Teaching frame:
    {
      "id": <integer, e.g. 1, 2, 3>,
      "speaker": "<character name>",
      "text": "<dialogue or narration — teach a concept>",
      "emotion": "<one of: neutral, happy, sad, surprised, angry, thinking, excited>",
      "nextFrameId": <id of next frame as integer>
    },
    // Question frame:
    {
      "id": <integer>,
      "speaker": "<character name>",
      "text": "<question text>",
      "emotion": "<emotion>",
      "options": [
        { "text": "<option text>", "nextFrameId": <next frame id as integer> },
        { "text": "<option text>", "nextFrameId": <next frame id as integer> }
      ],
      "nextFrameId": null
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Output ONLY valid JSON. No markdown. No comments. No additional text.
- Must strictly match the schema above.
- Frame ids must be sequential integers: 1, 2, 3, ...
- All nextFrameId values must reference a valid frame id that exists in the frames array, except the last frame which must be null.
- If you generate more than 50 frames, your output is considered invalid.
"""


# ─── Shared helpers ──────────────────────────────────────────────────────────────

def _build_user_message(character: Character, file_content: str, prompt: str) -> str:
    return f"""Character:
- Name: {character.name}
- Description: {character.description}
- Tone: {character.tone}

Study Material:
{file_content}

User's creative direction: {prompt or 'None provided, use your creativity.'}

Generate the interactive visual novel story in the JSON format described."""


def _common_headers() -> dict:
    return {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Paper Playground",
    }


# ─── Non-streaming (REST) ─────────────────────────────────────────────────────

async def generate_story(
    character: Character,
    file_content: str,
    prompt: str,
) -> StoryResponse:
    """
    Non-streaming call to OpenRouter. Used by the REST endpoint.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is not configured in the environment."
        )

    user_message = _build_user_message(character, file_content, prompt)

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.8,
        "response_format": {"type": "json_object"},
        "stream": False,
    }

    headers = _common_headers()

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"OpenRouter returned an error: {exc.response.status_code} — {exc.response.text}"
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Could not reach OpenRouter: {exc}"
            )

    data = response.json()

    try:
        raw_content = data["choices"][0]["message"]["content"]
        story_dict = json.loads(raw_content)
        return StoryResponse(**story_dict)
    except (KeyError, IndexError, json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse AI response: {exc}. Raw: {data}"
        )


# ─── Streaming (WebSocket) ────────────────────────────────────────────────────

async def generate_story_stream(
    character: Character,
    file_content: str,
    prompt: str,
) -> AsyncGenerator[str, None]:
    """
    Async generator that streams raw content token-chunks from OpenRouter.

    Yields:
        str — each content delta from the SSE stream.

    Raises:
        RuntimeError — on connection/protocol errors (caller converts to WS error).
    """
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not configured in the environment.")

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(character, file_content, prompt)},
        ],
        "temperature": 0.8,
        "response_format": {"type": "json_object"},
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=_common_headers(),
            json=payload,
        ) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise RuntimeError(
                    f"OpenRouter error {response.status_code}: {body.decode(errors='replace')}"
                )

            # Parse SSE lines: each line looks like  "data: {...}"  or  "data: [DONE]"
            async for line in response.aiter_lines():
                line = line.strip()
                if not line or not line.startswith("data:"):
                    continue

                raw = line[len("data:"):].strip()

                if raw == "[DONE]":
                    break

                try:
                    chunk = json.loads(raw)
                    delta = chunk["choices"][0]["delta"].get("content", "")
                    if delta:
                        yield delta
                except (json.JSONDecodeError, KeyError, IndexError):
                    # Skip malformed SSE lines silently
                    continue
