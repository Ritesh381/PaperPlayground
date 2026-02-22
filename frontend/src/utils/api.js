// API Service Utility
import state from "./state.js";

// const BASE_URL = import.meta.env.BASE_URL;
const BASE_URL = "https://paperplayground.onrender.com/api/v1";

/**
 * Generates a story using the blocking /generate endpoint.
 * This is simpler for initial integration.
 */
export async function generateStory(onComplete, onError) {
  try {
    const fileInput = document.getElementById("material-file");
    const file = fileInput.files[0];

    if (!file) {
      throw new Error("Please upload a study material file (PDF or TXT).");
    }

    const selectedChar = state.characters.find(
      (c) => c.id === state.selectedCharacterId,
    );
    const characterData = {
      name: selectedChar.name,
      description: selectedChar.description,
      tone: selectedChar.tone,
    };

    const selectedBg = state.backgrounds.find(
      (b) => b.id === state.selectedBackgroundId,
    );
    const backgroundName = selectedBg
      ? selectedBg.name
      : "Learning Environment";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("character", JSON.stringify(characterData));
    formData.append(
      "prompt",
      `${state.material.prompt || ""}\nSetting: ${backgroundName}`,
    );
    if (state.userName) {
      formData.append("user_name", state.userName);
    }

    console.log(
      "%c Starting Real Generation...",
      "color: #10b981; font-weight: bold;",
    );

    const response = await fetch(`${BASE_URL}/story/generate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Server failed to generate story.");
    }

    const story = await response.json();
    state.serverResponse = story;

    // Save to Local Storage (saving ID instead of full story to save space)
    const currentSaves = state.saves;
    currentSaves.unshift({
      id: story.id, // Only save the returned ID
      title: story.title,
      summary: story.summary,
      date: new Date().toISOString(),
      character: characterData,
      backgroundId: state.selectedBackgroundId,
    });
    localStorage.setItem("saved_stories", JSON.stringify(currentSaves));

    onComplete(story);
  } catch (err) {
    console.error("Story Generation Error:", err);
    if (onError) onError(err.message);
    else alert("Error: " + err.message);
  }
}
