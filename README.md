# 📚 Paper Playground

Turn study material into an interactive anime-style story.

Paper Playground is a web app that transforms uploaded PDFs or text files into a short interactive visual-novel-style experience. Instead of passively reading notes, users engage with the content through dialogue, characters, and choices.

---

## 🎯 Concept

Paper Playground focuses on learning through interaction.

Upload your study material → Choose a character → Generate an AI-driven story → Make choices → Continue the narrative.

This MVP keeps things simple while proving the core idea.

---

## 🚀 MVP Features

### 1️⃣ Character Selection
- Choose from predefined anime-style characters
- Or create a custom character (name + personality traits)

### 2️⃣ File Upload (Required)
- Supports `.pdf` and `.txt`
- Content is extracted and used as the knowledge base for the story

### 3️⃣ Optional Prompt
- Users can guide tone or focus
  - Example: “Explain like a rival tsundere”
  - Example: “Make it dramatic and exam-focused”

### 4️⃣ AI Story Generation
- Backend processes file content
- Generates narrative-style dialogue
- Converts study material into scenes and conversations

### 5️⃣ Interactive Choices (MVP Constraint)
- Each story segment includes choices
- A choice affects only the **next generated message**
- No deep branching yet (kept simple for MVP)

---

## 🧠 User Flow

1. Select or create a character  
2. Upload a PDF or text file  
3. Add an optional prompt  
4. Click Generate  
5. Read the story  
6. Choose between interactive options  
7. Continue the narrative  

---

## 🏗 Architecture (High-Level)

Frontend:
- Handles UI
- Renders story like a visual novel
- Displays dialogue and choices
- Maintains current story state

Backend:
- Accepts file upload
- Extracts text from PDF/TXT
- Combines content + user prompt + character personality
- Sends structured request to AI model
- Returns story segment with choices

---

## ⚠️ MVP Limitations

- Choices influence only the next message
- No long-term branching logic
- Large PDFs may be truncated
- Story quality depends on input clarity

---

## 🔮 Future Improvements

- Persistent branching story trees
- Save/load progress
- Character sprites and background visuals
- Voice integration
- Study progress tracking
- Multiplayer study sessions
- Authentication and notebook management

---

## 📝 License

MIT