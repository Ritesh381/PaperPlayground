import state from "../utils/state.js";
import { voiceEngine } from "../utils/voiceEngine.js";

let typingInterval = null;

export function renderFrame(frameId, isBacktracking = false) {
  const frame = state.serverResponse.frames.find((f) => f.id === frameId);
  if (!frame) {
    console.warn(`Frame with ID ${frameId} not found!`);
    return;
  }

  // History management
  if (!isBacktracking && state.currentFrameId) {
    state.storyHistory.push(state.currentFrameId);
  }
  state.currentFrameId = frameId;

  // 1. Update Background
  const bgContainer = document.getElementById("vn-background");
  const selectedBg = state.backgrounds.find(
    (b) => b.id === state.selectedBackgroundId,
  );
  if (selectedBg) {
    bgContainer.style.backgroundImage = `url('${selectedBg.url}')`;
  }

  // 2. Update Sprite
  const spriteImg = document.getElementById("vn-sprite");
  const selectedChar = state.characters.find(
    (c) => c.id === state.selectedCharacterId,
  );
  if (selectedChar) {
    spriteImg.src = selectedChar.avatar;
    spriteImg.classList.add("active");
  }

  // 3. Render Dialogue
  const speakerTag = document.getElementById("vn-speaker");
  const textEl = document.getElementById("vn-text");
  const indicator = document.getElementById("vn-click-indicator");
  const optionsOverlay = document.getElementById("vn-options-overlay");

  speakerTag.innerText = frame.speaker;
  textEl.innerHTML = "";
  indicator.style.display = "none";
  optionsOverlay.classList.remove("active");

  // Typing Effect
  if (typingInterval) clearInterval(typingInterval);
  let i = 0;
  typingInterval = setInterval(() => {
    if (i < frame.text.length) {
      textEl.innerHTML += frame.text.charAt(i);
      i++;
    } else {
      clearInterval(typingInterval);
      indicator.style.display = "block";

      // Check for options
      if (frame.options && frame.options.length > 0) {
        renderOptions(frame.options);
      } else if (state.autoMode) {
        setTimeout(() => {
          if (state.autoMode && frame.nextFrameId) {
            renderFrame(frame.nextFrameId);
          }
        }, 2000);
      }
    }
  }, 30);

  // Add to Log
  addToLog(frame.speaker, frame.text);

  // Play Voice using Sarvam AI WebSockets
  if (frame.text) {
    voiceEngine.speak(frame.text);
  }
}

function renderOptions(options) {
  const overlay = document.getElementById("vn-options-overlay");
  overlay.innerHTML = "";
  overlay.classList.add("active");

  options.forEach((opt) => {
    const btn = document.createElement("div");
    btn.className = "vn-option-choice";
    btn.innerText = opt.text;
    btn.onclick = (e) => {
      e.stopPropagation();
      renderFrame(opt.nextFrameId);
    };
    overlay.appendChild(btn);
  });
}

function addToLog(speaker, text) {
  const logContent = document.getElementById("vn-log-content");
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `
        <div class="log-speaker">${speaker}</div>
        <div class="log-text">${text}</div>
    `;
  logContent.appendChild(entry);
  logContent.scrollTop = logContent.scrollHeight;
}

export function handleStageClick() {
  const frame = state.serverResponse.frames.find(
    (f) => f.id === state.currentFrameId,
  );
  if (!frame) return;

  // If typing is in progress, skip it
  if (
    typingInterval &&
    document.getElementById("vn-text").innerText.length < frame.text.length
  ) {
    clearInterval(typingInterval);
    document.getElementById("vn-text").innerText = frame.text;
    document.getElementById("vn-click-indicator").style.display = "block";

    // Stop currently playing voice if skipping text
    voiceEngine.stop();

    if (frame.options && frame.options.length > 0) {
      renderOptions(frame.options);
    }
    return;
  }

  // Otherwise, advance
  if (frame.nextFrameId) {
    renderFrame(frame.nextFrameId);
  } else if (!frame.options) {
    alert("The story has reached its conclusion.");
    location.reload();
  }
}
