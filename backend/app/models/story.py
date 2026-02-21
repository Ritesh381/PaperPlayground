from pydantic import BaseModel, field_validator
from typing import List, Optional, Union


# ─── Request models ───────────────────────────────────────────────────────────

class Character(BaseModel):
    name: str
    description: str
    tone: str


# Note: the file itself is received as a multipart upload (UploadFile),
# so the "material" part of the request is split: file via form-data,
# prompt via a regular form field.


# ─── Response models ──────────────────────────────────────────────────────────

# The AI returns frame ids as integers (1, 2, 3, ...) per the system prompt.
# We accept Union[int, str] so the model is resilient to either format,
# then normalise everything to int on the way out.

FrameId = Union[int, str]


class FrameOption(BaseModel):
    text: str
    nextFrameId: FrameId

    @field_validator("nextFrameId", mode="before")
    @classmethod
    def coerce_id(cls, v):
        # Accept both int and numeric string
        try:
            return int(v)
        except (TypeError, ValueError):
            return v


class Frame(BaseModel):
    id: FrameId
    speaker: str
    text: str
    emotion: str
    options: Optional[List[FrameOption]] = None
    nextFrameId: Optional[FrameId] = None

    @field_validator("id", "nextFrameId", mode="before")
    @classmethod
    def coerce_id(cls, v):
        if v is None:
            return None
        try:
            return int(v)
        except (TypeError, ValueError):
            return v


class StoryResponse(BaseModel):
    title: str
    summary: str
    frames: List[Frame]
