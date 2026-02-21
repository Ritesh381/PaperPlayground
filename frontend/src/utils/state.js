// Global State Module
const state = {
  view: "landing", // 'landing' or 'playground'
  characters: [
    {
      id: "default_guide",
      name: "Kaguya Ruka",
      description: "A friendly and knowledgeable guide.",
      tone: "friendly",
      avatar: "src/assets/character/normal.png",
      expressions: {
        normal: "src/assets/character/normal.png",
        happy: "src/assets/character/happy.png",
        thinking: "src/assets/character/thinking.png",
        wrong: "src/assets/character/wrong.png",
      },
    },
    {
      id: "hana_tutor",
      name: "Hana",
      description: "A studious and encouraging upperclassman.",
      tone: "encouraging",
      avatar: "src/assets/character/hana/normal.png",
      expressions: {
        normal: "src/assets/character/hana/normal.png",
        happy: "src/assets/character/hana/happy.png",
        thinking: "src/assets/character/hana/thinking.png",
        wrong: "src/assets/character/hana/wrong.png",
      },
    },
  ],
  selectedCharacterId: "default_guide",
  backgrounds: [
    {
      id: "library",
      name: "Library",
      category: "DEFAULT",
      url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "classroom",
      name: "Classroom",
      category: "DEFAULT",
      url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "cafe",
      name: "Cafe",
      category: "DEFAULT",
      url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "roof",
      name: "Rooftop",
      category: "DEFAULT",
      url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop",
    },
  ],
  selectedBackgroundId: "library",
  material: {
    file: "",
    prompt: "",
  },
  serverResponse: null,
  currentFrameId: null,
  storyHistory: [], // For the 'Back' feature
  autoMode: false,
  userName: localStorage.getItem("user_name") || "",
  saves: (() => {
    try {
      return JSON.parse(localStorage.getItem("saved_stories")) || [];
    } catch (e) {
      return [];
    }
  })(),
};

// Try to load custom characters
try {
  const savedChars = JSON.parse(localStorage.getItem("custom_characters"));
  if (savedChars && Array.isArray(savedChars)) {
    // Merge with defaults
    state.characters = [...state.characters, ...savedChars];
  }
} catch (e) {
  console.error("Failed to load characters:", e);
}

export default state;
