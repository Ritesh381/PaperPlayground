// Simulation Utility
import state from './state.js';

export function simulateServerResponse(onComplete) {
    const dummyResponse = {
        "title": "The Quantum Adventure",
        "summary": "Step into the mysterious world where light is both a wave and a particle. Guided by your choice of character, you'll uncover the secrets of quantum mechanics in an immersive story.",
        "frames": [
            {
                "id": "f1",
                "speaker": state.character.name || "Wise Professor",
                "text": `Welcome, young scholar! My name is ${state.character.name || "the Professor"}. I've been studying the quantum realm for decades, and today, you're joining me. Are you ready?`,
                "emotion": "excited",
                "nextFrameId": "f2"
            },
            {
                "id": "f2",
                "speaker": state.character.name || "Wise Professor",
                "text": "Look at this beam of light. To a casual observer, it's just a glow. But look closer. It behaves as a wave, rippling through space...",
                "emotion": "serious",
                "nextFrameId": "f3"
            },
            {
                "id": "f3",
                "speaker": state.character.name || "Wise Professor",
                "text": "...yet, it also acts like a stream of particles, hitting sensors like tiny bullets. This is 'Wave-Particle Duality'. Based on this, how would you describe light?",
                "emotion": "curious",
                "options": [
                    { "text": "A continuous wave", "nextFrameId": "f4" },
                    { "text": "A stream of particles", "nextFrameId": "f4" },
                    { "text": "Both simultaneously", "nextFrameId": "f5" }
                ],
                "nextFrameId": null
            },
            {
                "id": "f4",
                "speaker": state.character.name || "Wise Professor",
                "text": "That's only half the story! The beauty of quantum mechanics is that it doesn't have to be one or the other. It's truly both.",
                "emotion": "thoughtful",
                "nextFrameId": "f2"
            },
            {
                "id": "f5",
                "speaker": state.character.name || "Wise Professor",
                "text": "Precisely! You've grasped the most counter-intuitive concept in physics. Ready for the next mystery?",
                "emotion": "happy",
                "nextFrameId": null
            }
        ]
    };

    state.serverResponse = dummyResponse;

    // Simulate synthesis delay
    setTimeout(() => {
        onComplete(dummyResponse);
    }, 2500);
}
