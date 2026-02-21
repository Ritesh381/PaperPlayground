from dotenv import load_dotenv
import os

load_dotenv()

OPENROUTER_API_KEY: str = os.getenv("OPEN_ROUTER_API_KEY", "")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

MURF_API_KEY: str = os.getenv("MURF_API_KEY", "")

# Max characters extracted from uploaded file to keep prompt size reasonable
MAX_CONTENT_CHARS: int = 8000
