# 🎴 Paper Playground — Backend

FastAPI backend for **Paper Playground** — transforms uploaded study material into an AI-generated, interactive visual-novel story using [OpenRouter](https://openrouter.ai).

---

## 📁 Project Structure

```
backend/
├── .env                          # Environment variables (API key, model)
├── main.py                       # FastAPI app entry point
├── requirements.txt              # Python dependencies
└── app/
    ├── config.py                 # Loads .env variables
    ├── models/
    │   └── story.py              # Pydantic request/response models
    ├── services/
    │   ├── file_service.py       # PDF/TXT text extraction
    │   ├── ai_service.py         # OpenRouter API calls (streaming + blocking)
    │   └── session_service.py    # In-memory session store (REST → WebSocket bridge)
    ├── controllers/
    │   ├── story_controller.py   # Business logic for REST endpoints
    │   └── ws_controller.py      # Business logic for WebSocket streaming
    └── routers/
        ├── story_router.py       # REST route definitions
        └── ws_router.py          # WebSocket route definitions
```

---

## 🏗️ Architecture Overview

The backend follows an **MVC (Model-View-Controller)** pattern:

```
Request
  │
  ├─► Router          (defines routes, no logic)
  │       │
  │       ▼
  ├─► Controller      (validates input, orchestrates services)
  │       │
  │       ▼
  ├─► Service         (file extraction, AI calls, session storage)
  │       │
  │       ▼
  └─► Model           (Pydantic data shapes)
```

### Workflow — Streaming (Recommended)

```
┌────────────────────────────────────────────────────────────────┐
│  1. POST /api/v1/story/start  (multipart/form-data)            │
│     Upload PDF/TXT + character + prompt                        │
│     ← Returns: { "session_id": "uuid" }                       │
└────────────────────────────────────────────────────────────────┘
                             ↓
┌────────────────────────────────────────────────────────────────┐
│  2. WS /api/v1/story/stream/{session_id}                       │
│     Connect immediately — AI streams tokens back               │
│     ← Streams: {"type":"chunk", "content":"..."}  (per token)  │
│     ← Final:   {"type":"done",  "story":{...}}                │
└────────────────────────────────────────────────────────────────┘
```

### Workflow — Blocking REST (Simple)

```
POST /api/v1/story/generate
  Upload file + character + prompt
  ← Waits for full AI response
  ← Returns complete StoryResponse JSON
```

---

## ⚙️ Configuration

`.env` file in `./backend/`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini   # Optional, defaults to gpt-4o-mini
```

---

## 🚀 Running the Server

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📡 API Endpoints

### Base URL

```
http://localhost:8000/api/v1
```

---

### `GET /`

Health check.

**Response**

```json
{
  "status": "ok",
  "message": "Paper Playground API is running 🎴"
}
```

---

### `GET /health`

Minimal health probe.

**Response**

```json
{
  "status": "ok"
}
```

---

### `POST /api/v1/story/start` ⭐ Step 1 of Streaming Workflow

Accepts the study material file and story parameters. Extracts text, stores it in a session, and returns a `session_id` to use with the WebSocket.

**Method:** `POST`  
**Content-Type:** `multipart/form-data`

| Field       | Type          | Required | Description                                       |
| ----------- | ------------- | -------- | ------------------------------------------------- |
| `character` | string (JSON) | ✅       | `{"name":"...","description":"...","tone":"..."}` |
| `file`      | file          | ✅       | `.pdf` or `.txt` study material                   |
| `prompt`    | string        | ❌       | Optional creative direction                       |

**Sample Request (curl)**

```bash
curl -X POST http://localhost:8000/api/v1/story/start \
  -F 'character={"name":"Yuki","description":"A cheerful anime tutor","tone":"enthusiastic and friendly"}' \
  -F 'file=@/path/to/notes.pdf' \
  -F 'prompt=Focus on key concepts and make it dramatic'
```

**Sample Response `200 OK`**

```json
{
  "session_id": "a3f1c2d4-8b7e-4a1f-9c3d-2e5f7a9b1c3d"
}
```

**Error Responses**

```json
// 400 — Empty or unreadable file
{ "detail": "Uploaded file appears to be empty or unreadable." }

// 400 — Wrong file type
{ "detail": "Unsupported file 'notes.docx' (content-type: 'application/msword'). Only .pdf and .txt are accepted." }

// 422 — Bad character JSON
{ "detail": "Invalid 'character' JSON: ..." }
```

> ⏱️ Session expires after **5 minutes** if the WebSocket is not connected.

---

### `WS /api/v1/story/stream/{session_id}` ⭐ Step 2 of Streaming Workflow

Connects via WebSocket. Streaming begins immediately on connection — no message needs to be sent.

**URL:** `ws://localhost:8000/api/v1/story/stream/{session_id}`

**Path Parameter**

| Param        | Description                              |
| ------------ | ---------------------------------------- |
| `session_id` | The UUID returned by `POST /story/start` |

**Messages Received from Server**

#### While generating (one per token):

```json
{"type": "chunk", "content": "{\n  \"title\":"}
{"type": "chunk", "content": " \"The Mitochondria"}
{"type": "chunk", "content": " Chronicles\""}
```

#### On completion:

```json
{
  "type": "done",
  "story": {
    "title": "The Mitochondria Chronicles",
    "summary": "Yuki walks you through cellular energy production in a dramatic conversation.",
    "frames": [
      {
        "id": 1,
        "speaker": "Yuki",
        "text": "Hey! Did you know your cells are running tiny power plants right now?",
        "emotion": "excited",
        "options": null,
        "nextFrameId": 2
      },
      {
        "id": 2,
        "speaker": "Yuki",
        "text": "The mitochondria produces ATP — the cell's energy currency — through 3 stages.",
        "emotion": "happy",
        "options": null,
        "nextFrameId": 3
      },
      {
        "id": 3,
        "speaker": "Yuki",
        "text": "Quick quiz! What is the main product of cellular respiration?",
        "emotion": "thinking",
        "options": [
          { "text": "Glucose", "nextFrameId": 4 },
          { "text": "ATP", "nextFrameId": 4 },
          { "text": "CO₂", "nextFrameId": 4 }
        ],
        "nextFrameId": null
      },
      {
        "id": 4,
        "speaker": "Yuki",
        "text": "The correct answer is ATP! Glucose is the fuel, not the product.",
        "emotion": "happy",
        "options": null,
        "nextFrameId": null
      }
    ]
  }
}
```

#### On error:

```json
{
  "type": "error",
  "detail": "Session 'a3f1c2d4-...' not found or has expired."
}
```

**Testing in Postman**

1. `New → WebSocket Request`
2. URL: `ws://localhost:8000/api/v1/story/stream/PASTE_SESSION_ID`
3. Click **Connect** — messages stream in automatically.

---

### `POST /api/v1/story/generate` — Blocking (Non-Streaming)

Same inputs as `/start` but waits for the complete AI response before returning. Useful for simple integrations that don't need streaming.

**Method:** `POST`  
**Content-Type:** `multipart/form-data`

| Field       | Type          | Required | Description                                       |
| ----------- | ------------- | -------- | ------------------------------------------------- |
| `character` | string (JSON) | ✅       | `{"name":"...","description":"...","tone":"..."}` |
| `file`      | file          | ✅       | `.pdf` or `.txt` study material                   |
| `prompt`    | string        | ❌       | Optional creative direction                       |

**Sample Request (curl)**

```bash
curl -X POST http://localhost:8000/api/v1/story/generate \
  -F 'character={"name":"Yuki","description":"A cheerful anime tutor","tone":"enthusiastic and friendly"}' \
  -F 'file=@/path/to/notes.txt' \
  -F 'prompt=Make it dramatic and exam-focused'
```

**Sample Response `200 OK`**

```json
{
  "title": "The Mitochondria Chronicles",
  "summary": "Yuki walks you through cellular energy production in a dramatic conversation.",
  "frames": [
    {
      "id": 1,
      "speaker": "Yuki",
      "text": "Hey! Did you know your cells are running tiny power plants right now?",
      "emotion": "excited",
      "options": null,
      "nextFrameId": 2
    },
    {
      "id": 3,
      "speaker": "Yuki",
      "text": "Quick quiz! What is the main product of cellular respiration?",
      "emotion": "thinking",
      "options": [
        { "text": "Glucose", "nextFrameId": 4 },
        { "text": "ATP", "nextFrameId": 4 },
        { "text": "CO₂", "nextFrameId": 4 }
      ],
      "nextFrameId": null
    }
  ]
}
```

---

## 🧩 Data Models

### `Character` (request)

```json
{
  "name": "string",
  "description": "string",
  "tone": "string"
}
```

### `Frame` (response)

```json
{
  "id": 1,
  "speaker": "Yuki",
  "text": "Dialogue or narration text",
  "emotion": "neutral | happy | sad | surprised | angry | thinking | excited",
  "options": null,
  "nextFrameId": 2
}
```

### `Frame` — Question variant

```json
{
  "id": 5,
  "speaker": "Yuki",
  "text": "Which stage produces the most ATP?",
  "emotion": "thinking",
  "options": [
    { "text": "Glycolysis", "nextFrameId": 6 },
    { "text": "Oxidative phosphorylation", "nextFrameId": 6 },
    { "text": "Krebs Cycle", "nextFrameId": 6 }
  ],
  "nextFrameId": null
}
```

### `StoryResponse` (response)

```json
{
  "title": "string",
  "summary": "string",
  "frames": [ <Frame>, ... ]
}
```

---

## 🤖 AI Prompt Rules (enforced by system prompt)

| Rule                     | Value                             |
| ------------------------ | --------------------------------- |
| Min frames               | 8                                 |
| Max frames               | 50                                |
| Quiz every N frames      | every 7–10 teaching frames        |
| Options per quiz         | 2–3                               |
| Correct answers per quiz | 1                                 |
| After each quiz          | explanation frame                 |
| Frame IDs                | sequential integers starting at 1 |
| Last frame `nextFrameId` | `null`                            |
| Output format            | JSON only, no markdown            |

---

## 📦 Dependencies

```
fastapi
uvicorn[standard]
python-multipart      # multipart/form-data file upload
httpx                 # async HTTP client for OpenRouter
pydantic              # data validation
python-dotenv         # .env loading
pypdf                 # PDF text extraction
```

Install:

```bash
pip install -r requirements.txt
```
