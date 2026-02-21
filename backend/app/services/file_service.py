import io
from fastapi import UploadFile, HTTPException

try:
    import pypdf
    _PYPDF_AVAILABLE = True
except ImportError:
    _PYPDF_AVAILABLE = False

from app.config import MAX_CONTENT_CHARS


# ─── Core extraction (sync, works on raw bytes) ───────────────────────────────

def extract_text_from_bytes(
    raw_bytes: bytes,
    filename: str = "",
    content_type: str = "",
) -> str:
    """
    Extracts plain text from raw bytes of a PDF or TXT file.
    Used by both the REST endpoint (UploadFile) and the WebSocket endpoint (base64).

    Detection order:
      1. filename extension (.pdf / .txt)
      2. MIME content_type  (application/pdf / text/plain)

    Raises ValueError for unsupported types or empty content.
    """
    filename = filename.lower()
    content_type = content_type.lower()

    # Resolve file kind -------------------------------------------------------
    if filename.endswith(".pdf") or content_type == "application/pdf":
        kind = "pdf"
    elif filename.endswith(".txt") or content_type in ("text/plain", "text/"):
        kind = "txt"
    else:
        raise ValueError(
            f"Unsupported file '{filename}' (content-type: '{content_type}'). "
            "Only .pdf and .txt files are accepted."
        )

    if not raw_bytes:
        raise ValueError("File is empty.")

    # Extract text ------------------------------------------------------------
    if kind == "txt":
        text = raw_bytes.decode("utf-8", errors="replace")
    else:  # pdf
        if not _PYPDF_AVAILABLE:
            raise RuntimeError("pypdf is not installed. Run: pip install pypdf")
        try:
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages)
        except Exception as exc:
            raise ValueError(f"Could not parse PDF: {exc}")

    return text[:MAX_CONTENT_CHARS]


# ─── REST wrapper (async, UploadFile) ─────────────────────────────────────────

async def extract_text(file: UploadFile) -> str:
    """Async wrapper around extract_text_from_bytes for the REST endpoint."""
    raw_bytes = await file.read()
    try:
        return extract_text_from_bytes(
            raw_bytes,
            filename=file.filename or "",
            content_type=file.content_type or "",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
