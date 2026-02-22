// Main App Entry
import state from "./utils/state.js";
import {
  BASE_URL,
  generateStory,
  saveCharacterAPI,
  fetchCharactersByIdsAPI,
} from "./utils/api.js";
import { renderFrame, handleStageClick } from "./components/frameEngine.js";

// Section Navigation Utility
function showSection(sectionId) {
  const currentActive = document.querySelector(".section.active");
  if (currentActive && currentActive.id !== sectionId) {
    currentActive.style.opacity = "0";
    currentActive.style.transform = "translateY(-20px)";

    setTimeout(() => {
      currentActive.classList.remove("active");
      const target = document.getElementById(sectionId);
      if (target) {
        target.classList.add("active");
        target.style.opacity = "1";
        target.style.transform = "translateY(0)";
      }
    }, 300);
  } else if (!currentActive) {
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active");
  }
}

// Global exposure for HTML onclick handlers
window.showSection = showSection;
window.handleStageClick = handleStageClick;

window.renderBackgroundSelection = () => {
  const grid = document.getElementById("background-grid");
  grid.innerHTML = "";

  state.backgrounds.forEach((bg) => {
    const card = document.createElement("div");
    card.className = `bg-card ${state.selectedBackgroundId === bg.id ? "selected" : ""}`;
    card.onclick = () => {
      state.selectedBackgroundId = bg.id;
      window.renderBackgroundSelection();
    };

    card.innerHTML = `
            <img src="${bg.url}" alt="${bg.name}">
            <div class="selection-indicator">✓</div>
            <div class="bg-info-overlay">
                <div class="bg-name">${bg.name}</div>
                <div style="font-size: 0.7rem; opacity: 0.7;">${bg.category} SETTING</div>
            </div>
        `;
    grid.appendChild(card);
  });
};

window.renderCharacterSelection = () => {
  const grid = document.getElementById("character-grid");
  grid.innerHTML = "";

  // Render existing characters
  state.characters.forEach((char) => {
    const card = document.createElement("div");
    card.className = `char-card ${state.selectedCharacterId === char.id ? "selected" : ""}`;
    card.onclick = () => {
      state.selectedCharacterId = char.id;
      window.renderCharacterSelection();
    };

    card.innerHTML = `
            <div class="char-avatar-container">
                <img src="${char.avatar}" alt="${char.name}">
            </div>
            <div class="char-name-label">${char.name}</div>
        `;
    grid.appendChild(card);
  });

  // Add "Borrow" Option (Placeholder)
  const borrowCard = document.createElement("div");
  borrowCard.className = "char-card action-card";
  borrowCard.innerHTML = `
        <div class="action-icon">🔗</div>
        <div class="char-name-label">BORROW CHARACTER</div>
    `;
  borrowCard.onclick = () => alert("Borrow feature coming soon!");
  grid.appendChild(borrowCard);

  // Add "Create" Option
  const createCard = document.createElement("div");
  createCard.className = "char-card action-card";
  createCard.innerHTML = `
        <div class="action-icon">+</div>
        <div class="char-name-label">Create Custom</div>
    `;
  createCard.onclick = () => showSection("create-char-section");
  grid.appendChild(createCard);
};

window.nextToBackground = () => {
  const fileInput = document.getElementById("material-file");
  state.material.file = fileInput.files[0] ? fileInput.files[0].name : "";
  state.material.prompt = document.getElementById("material-prompt").value;

  showSection("background-selection-section");
  window.renderBackgroundSelection();
};

window.confirmBackground = () => {
  showSection("selection-section");
  window.renderCharacterSelection();
};

window.simulateUpload = () => {
  alert("Background upload feature simulation triggered!");
};

window.saveNewCharacter = async () => {
  const name = document.getElementById("new-char-name").value;
  const personality = document.getElementById("new-char-personality").value;
  const isPrivate = document.getElementById("public-share")
    ? !document.getElementById("public-share").checked
    : true;

  if (!name) {
    alert("Please enter a display name.");
    return;
  }

  const charPayload = {
    name: name,
    description: personality,
    tone: "custom",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    isPrivate: isPrivate,
  };

  const finishSave = async (payload) => {
    try {
      const resp = await saveCharacterAPI(payload);
      const newChar = { ...payload, id: resp.id };

      state.characters.push(newChar);
      state.customCharacterIds.push(newChar.id);
      state.selectedCharacterId = newChar.id;

      localStorage.setItem(
        "custom_characters",
        JSON.stringify(state.customCharacterIds),
      );

      const prevSection = document.querySelector(".section.active").id;
      if (prevSection === "create-char-section") {
        const fromGallery = state.view === "gallery";
        showSection(fromGallery ? "characters-section" : "selection-section");
        if (fromGallery) {
          window.renderCharacterGallery();
        } else {
          window.renderCharacterSelection();
        }
      } else {
        showSection("selection-section");
        window.renderCharacterSelection();
      }
    } catch (e) {
      alert("Failed to save character to backend: " + e.message);
    }
  };

  const avatarInput = document.getElementById("avatar-input");
  if (avatarInput && avatarInput.files && avatarInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      charPayload.avatar = e.target.result;
      finishSave(charPayload);
    };
    reader.readAsDataURL(avatarInput.files[0]);
  } else {
    finishSave(charPayload);
  }
};

window.startLearning = () => {
  const selectedChar = state.characters.find(
    (c) => c.id === state.selectedCharacterId,
  );

  // Update old state properties for compatibility
  state.character = {
    name: selectedChar.name,
    description: selectedChar.description,
    tone: selectedChar.tone,
  };

  const requestObject = {
    character: state.character,
    background: state.selectedBackgroundId,
    material: state.material,
  };

  console.log(
    "%c VN Request JSON Ready:",
    "color: #ff3b8e; font-weight: bold; font-size: 1.2rem;",
  );
  console.log(JSON.stringify(requestObject, null, 2));

  // UI Feedback
  showSection("loading-section");
  document.getElementById("loading-spinner").style.display = "block";
  document.getElementById("title-screen").style.display = "none";

  generateStory(
    (response) => {
      state.serverResponse = response;

      // Hide spinner and show title screen
      document.getElementById("loading-spinner").style.display = "none";
      const titleScreen = document.getElementById("title-screen");
      titleScreen.style.display = "flex";

      // Set content
      document.getElementById("story-title").innerText = response.title;
      document.getElementById("story-summary").innerText = response.summary;

      // Set background for title screen (blurred)
      const selectedBg = state.backgrounds.find(
        (b) => b.id === state.selectedBackgroundId,
      );
      if (selectedBg) {
        titleScreen.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${selectedBg.url}')`;
        titleScreen.style.backgroundSize = "cover";
        titleScreen.style.backgroundPosition = "center";
      }

      document.getElementById("start-story-btn").onclick = () => {
        showSection("story-section");
        const bgm = document.getElementById("bgm-audio");
        bgm.volume = 0.2; // Softer volume
        bgm.play().catch((e) => console.warn("Autoplay audio blocked", e));
        renderFrame(response.frames[0].id); // Use real frame ID from response
      };
    },
    (errMsg) => {
      alert("Failed to generate story: " + errMsg);
      showSection("selection-section");
    },
  );
};

// VN Control Handlers
window.goBack = () => {
  if (state.storyHistory.length > 0) {
    const prevFrameId = state.storyHistory.pop();
    renderFrame(prevFrameId, true);
  } else {
    alert("Already at the beginning of the story.");
  }
};

window.toggleAuto = () => {
  state.autoMode = !state.autoMode;
  const autoBtn = document.getElementById("auto-btn");
  autoBtn.classList.toggle("active");

  if (state.autoMode) {
    handleStageClick(); // Trigger next or skip typing
  }
};

window.showLog = () => {
  document.getElementById("vn-log-overlay").classList.add("active");
};

window.hideLog = () => {
  document.getElementById("vn-log-overlay").classList.remove("active");
};

window.enterPlayground = () => {
  showSection("upload-section");
};

window.toggleBGM = () => {
  const bgm = document.getElementById("bgm-audio");
  const btn = document.getElementById("bgm-toggle-btn");
  if (bgm.paused) {
    bgm.play();
    btn.innerText = "🔊";
  } else {
    bgm.pause();
    btn.innerText = "🔇";
  }
};

window.renderCharacterGallery = () => {
  state.view = "gallery";
  const grid = document.getElementById("character-gallery-grid");
  grid.innerHTML = "";

  state.characters.forEach((char) => {
    const card = document.createElement("div");
    card.className = `char-card`;

    card.innerHTML = `
            <div class="char-avatar-container">
                <img src="${char.avatar}" alt="${char.name}">
            </div>
            <div class="char-name-label">${char.name}</div>
        `;
    grid.appendChild(card);
  });

  const createCard = document.createElement("div");
  createCard.className = "char-card action-card";
  createCard.innerHTML = `
        <div class="action-icon">+</div>
        <div class="char-name-label">Create Custom</div>
    `;
  createCard.onclick = () => showSection("create-char-section");
  grid.appendChild(createCard);
};

const originalShowSection = window.showSection;
window.showSection = (id) => {
  if (id === "characters-section") window.renderCharacterGallery();
  originalShowSection(id);
};

window.saveSettings = () => {
  const nameInput = document.getElementById("settings-username").value.trim();
  if (nameInput) {
    localStorage.setItem("user_name", nameInput);
    state.userName = nameInput;
    alert("Settings saved!");
  } else {
    localStorage.removeItem("user_name");
    state.userName = "";
    alert("Name cleared.");
  }
};

window.renderSaves = () => {
  const container = document.getElementById("saves-container");
  container.innerHTML = "";

  if (state.saves.length === 0) {
    container.innerHTML =
      '<div style="opacity:0.6; text-align:center; padding: 2rem;">No saved stories yet. Start a new journey!</div>';
    return;
  }

  state.saves.forEach((save) => {
    const card = document.createElement("div");
    card.style.cssText =
      "background: rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem; border: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;";

    card.innerHTML = `
            <div>
                <h3 style="margin: 0; margin-bottom: 0.5rem;">${save.title || (save.story && save.story.title) || "Untitled Story"}</h3>
                <div style="font-size: 0.8rem; opacity: 0.7;">
                    ${new Date(save.date).toLocaleDateString()} • With ${save.character.name}
                </div>
            </div>
            <button class="pulse-glow" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Replay</button>
        `;

    card.querySelector("button").onclick = async () => {
      const btn = card.querySelector("button");
      const originalText = btn.innerText;
      btn.innerText = "Loading...";

      try {
        // Fallback for old local-storage complete saves vs new ID-only saves
        let loadedStory = save.story;
        if (!loadedStory && save.id) {
          const res = await fetch(`${BASE_URL}/story/${save.id}`);
          if (!res.ok) throw new Error("Could not load story from server.");
          loadedStory = await res.json();
        }

        state.serverResponse = loadedStory;
        state.selectedCharacterId =
          state.characters.find((c) => c.name === save.character.name)?.id ||
          "default_guide";
        state.selectedBackgroundId = save.backgroundId || "library";

        showSection("story-section");
        const bgm = document.getElementById("bgm-audio");
        bgm.volume = 0.2;
        bgm.play().catch(() => {});

        btn.innerText = originalText;
        renderFrame(loadedStory.frames[0].id);
      } catch (err) {
        alert("Failed to fetch story: " + err.message);
        btn.innerText = originalText;
      }
    };

    container.appendChild(card);
  });
};

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
  // Start at landing page
  showSection("landing-section");
  document.getElementById("settings-username").value = state.userName;

  // Load custom characters from backend if we have IDs
  if (state.customCharacterIds && state.customCharacterIds.length > 0) {
    // Some old localStorage might have stored objects, gracefully extract ID if so
    const safeIds = state.customCharacterIds
      .map((c) => (typeof c === "object" ? c.id : c))
      .filter(Boolean);
    try {
      if (safeIds.length > 0) {
        const fetchedChars = await fetchCharactersByIdsAPI(safeIds);
        // Merge to state
        for (const char of fetchedChars) {
          if (!state.characters.find((c) => c.id === char.id)) {
            state.characters.push(char);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch custom characters from backend", e);
    }
    // Update local storage format to ensure it's specifically safe string IDs
    localStorage.setItem("custom_characters", JSON.stringify(safeIds));
    state.customCharacterIds = safeIds;
  }

  // Avatar upload hook
  const avatarUpload = document.getElementById("avatar-upload");
  const avatarInput = document.getElementById("avatar-input");
  if (avatarUpload && avatarInput) {
    avatarUpload.addEventListener("click", () => avatarInput.click());
    avatarInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        avatarUpload.innerHTML =
          '<div class="action-icon">✅</div><div>Image Selected</div>';
      }
    });
  }
});
