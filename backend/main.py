from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.story_router import router as story_router
from app.routers.ws_router import router as ws_router

app = FastAPI(
    title="Paper Playground API",
    description="Transforms study material into interactive anime-style visual novel stories.",
    version="1.0.0",
)

# Allow the Vite dev server (and any origin during development) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(story_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "Paper Playground API is running 🎴"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
