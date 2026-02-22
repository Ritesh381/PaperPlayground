export class VoiceStreamEngine {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.mediaSource = null;
    this.sourceBuffer = null;
    this.audioElement = new Audio();

    // Setup MediaSource
    this.mediaSource = new MediaSource();
    this.audioElement.src = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener("sourceopen", () => {
      try {
        this.sourceBuffer = this.mediaSource.addSourceBuffer("audio/mpeg");
        this.sourceBuffer.addEventListener("updateend", () =>
          this.processQueue(),
        );
      } catch (e) {
        console.error("MSE addSourceBuffer failed", e);
      }
    });

    this.queue = [];
    this.chunks = []; // Save all chunks just in case

    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // default to localhost:8000 for backend
    const host =
      window.location.hostname === "localhost"
        ? "paperplayground.onrender.com"
        : window.location.host;
    this.ws = new WebSocket(`${protocol}//${host}/api/v1/voice/stream`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log("Voice MS WebSocket connected");
      this.isConnected = true;
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.queue.push(event.data);
        this.chunks.push(event.data);
        this.processQueue();
      } else {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "error")
            console.error("Voice Stream Error:", parsed.error);
        } catch (e) {}
      }
    };

    this.ws.onclose = () => {
      console.log("Voice MS WebSocket closed, reconnecting in 2s...");
      this.isConnected = false;
      setTimeout(() => this.connect(), 2000);
    };
  }

  processQueue() {
    if (
      !this.sourceBuffer ||
      this.sourceBuffer.updating ||
      this.queue.length === 0
    )
      return;
    try {
      const chunk = this.queue.shift();
      this.sourceBuffer.appendBuffer(chunk);
      if (this.audioElement.paused) {
        this.audioElement
          .play()
          .catch((e) => console.warn("Autoplay prevented", e));
      }
    } catch (e) {
      console.error("Error appending buffer to SourceBuffer", e);
    }
  }

  speak(text) {
    if (!this.isConnected) {
      console.warn("Voice Engine is not connected to WebSocket");
      return;
    }

    console.log("Speaking text:", text);

    // Discard old buffers if playing new sentence
    // Re-creating MediaSource is cleaner for new segments
    this.audioElement.pause();
    this.queue = [];
    this.chunks = [];

    this.mediaSource = new MediaSource();
    this.audioElement.src = URL.createObjectURL(this.mediaSource);
    this.mediaSource.addEventListener("sourceopen", () => {
      try {
        this.sourceBuffer = this.mediaSource.addSourceBuffer("audio/mpeg");
        this.sourceBuffer.addEventListener("updateend", () =>
          this.processQueue(),
        );
      } catch (e) {
        console.error("MSE re-init failed", e);
      }
    });

    // Send text to start streaming MP3 back
    this.ws.send(JSON.stringify({ text }));
  }

  stop() {
    this.audioElement.pause();
  }
}

export const voiceEngine = new VoiceStreamEngine();
