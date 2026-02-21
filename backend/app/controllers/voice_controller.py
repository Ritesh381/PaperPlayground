import json
from fastapi import WebSocket, WebSocketDisconnect
from app.services.murf_service import stream_voice_from_murf

async def stream_voice_ws_controller(websocket: WebSocket) -> None:
    """
    WebSocket controller for streaming voice.
    Receives text from the client, calls Murf AI, and streams back MP3 bytes.
    """
    await websocket.accept()
    
    try:
        while True:
            # Receive text from client
            data = await websocket.receive_text()
            
            try:
                # Expecting either plain text or JSON with "text" field
                try:
                    parsed = json.loads(data)
                    text = parsed.get("text", "")
                except json.JSONDecodeError:
                    text = data
                
                if not text.strip():
                    continue
                    
                # Stream audio back (binary frames)
                async for chunk in stream_voice_from_murf(text):
                    await websocket.send_bytes(chunk)
                    
            except Exception as e:
                # Send error as text frame
                await websocket.send_text(json.dumps({"type": "error", "error": str(e)}))
                
    except WebSocketDisconnect:
        pass
