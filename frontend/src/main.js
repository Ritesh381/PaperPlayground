// Main App Entry
import state from './utils/state.js';
import { generateStory } from './utils/api.js';
import { renderFrame, handleStageClick } from './components/frameEngine.js';

// Section Navigation Utility
function showSection(sectionId) {
    const currentActive = document.querySelector('.section.active');
    if (currentActive && currentActive.id !== sectionId) {
        currentActive.style.opacity = '0';
        currentActive.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            currentActive.classList.remove('active');
            const target = document.getElementById(sectionId);
            if (target) {
                target.classList.add('active');
                target.style.opacity = '1';
                target.style.transform = 'translateY(0)';
            }
        }, 300);
    } else if (!currentActive) {
        const target = document.getElementById(sectionId);
        if (target) target.classList.add('active');
    }
}

// Global exposure for HTML onclick handlers
window.showSection = showSection;
window.handleStageClick = handleStageClick;

window.renderBackgroundSelection = () => {
    const grid = document.getElementById('background-grid');
    grid.innerHTML = '';

    state.backgrounds.forEach(bg => {
        const card = document.createElement('div');
        card.className = `bg-card ${state.selectedBackgroundId === bg.id ? 'selected' : ''}`;
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
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';

    // Render existing characters
    state.characters.forEach(char => {
        const card = document.createElement('div');
        card.className = `char-card ${state.selectedCharacterId === char.id ? 'selected' : ''}`;
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
    const borrowCard = document.createElement('div');
    borrowCard.className = 'char-card action-card';
    borrowCard.innerHTML = `
        <div class="action-icon">🔗</div>
        <div class="char-name-label">BORROW CHARACTER</div>
    `;
    borrowCard.onclick = () => alert("Borrow feature coming soon!");
    grid.appendChild(borrowCard);

    // Add "Create" Option
    const createCard = document.createElement('div');
    createCard.className = 'char-card action-card';
    createCard.innerHTML = `
        <div class="action-icon">+</div>
        <div class="char-name-label">Create Custom</div>
    `;
    createCard.onclick = () => showSection('create-char-section');
    grid.appendChild(createCard);
};

window.nextToBackground = () => {
    const fileInput = document.getElementById('material-file');
    state.material.file = fileInput.files[0] ? fileInput.files[0].name : "";
    state.material.prompt = document.getElementById('material-prompt').value;
    
    showSection('background-selection-section');
    window.renderBackgroundSelection();
};

window.confirmBackground = () => {
    showSection('selection-section');
    window.renderCharacterSelection();
};

window.simulateUpload = () => {
    alert("Background upload feature simulation triggered!");
};

window.saveNewCharacter = () => {
    const id = document.getElementById('new-char-id').value || `u_${Date.now()}`;
    const name = document.getElementById('new-char-name').value;
    const personality = document.getElementById('new-char-personality').value;

    if (!name) {
        alert("Please enter a display name.");
        return;
    }

    const newChar = {
        id: id,
        name: name,
        description: personality,
        tone: 'custom',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };

    state.characters.push(newChar);
    state.selectedCharacterId = id;

    showSection('selection-section');
    window.renderCharacterSelection();
};

window.startLearning = () => {
    const selectedChar = state.characters.find(c => c.id === state.selectedCharacterId);
    
    // Update old state properties for compatibility
    state.character = {
        name: selectedChar.name,
        description: selectedChar.description,
        tone: selectedChar.tone
    };

    const requestObject = {
        character: state.character,
        background: state.selectedBackgroundId,
        material: state.material
    };

    console.log("%c VN Request JSON Ready:", "color: #ff3b8e; font-weight: bold; font-size: 1.2rem;");
    console.log(JSON.stringify(requestObject, null, 2));
    
    // UI Feedback
    showSection('loading-section');
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('title-screen').style.display = 'none';

    generateStory((response) => {
        state.serverResponse = response;
        
        // Hide spinner and show title screen
        document.getElementById('loading-spinner').style.display = 'none';
        const titleScreen = document.getElementById('title-screen');
        titleScreen.style.display = 'flex';
        
        // Set content
        document.getElementById('story-title').innerText = response.title;
        document.getElementById('story-summary').innerText = response.summary;
        
        // Set background for title screen (blurred)
        const selectedBg = state.backgrounds.find(b => b.id === state.selectedBackgroundId);
        if (selectedBg) {
            titleScreen.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${selectedBg.url}')`;
            titleScreen.style.backgroundSize = 'cover';
            titleScreen.style.backgroundPosition = 'center';
        }

        document.getElementById('start-story-btn').onclick = () => {
            showSection('story-section');
            renderFrame(response.frames[0].id); // Use real frame ID from response
        };
    }, (errMsg) => {
        alert("Failed to generate story: " + errMsg);
        showSection('selection-section');
    });
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
    const autoBtn = document.getElementById('auto-btn');
    autoBtn.classList.toggle('active');
    
    if (state.autoMode) {
        handleStageClick(); // Trigger next or skip typing
    }
};

window.showLog = () => {
    document.getElementById('vn-log-overlay').classList.add('active');
};

window.hideLog = () => {
    document.getElementById('vn-log-overlay').classList.remove('active');
};

window.enterPlayground = () => {
    showSection('upload-section');
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Start at landing page
    showSection('landing-section');
});
