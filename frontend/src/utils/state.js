// Global State Module
const state = {
    view: 'landing', // 'landing' or 'playground'
    characters: [
        {
            id: 'default_guide',
            name: 'Kaguya Ruka',
            description: 'A friendly and knowledgeable guide.',
            tone: 'friendly',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kaguya' // Placeholder avatar
        }
    ],
    selectedCharacterId: 'default_guide',
    backgrounds: [
        { id: 'library', name: 'Library', category: 'DEFAULT', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=400&auto=format&fit=crop' },
        { id: 'classroom', name: 'Classroom', category: 'DEFAULT', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&auto=format&fit=crop' },
        { id: 'cafe', name: 'Cafe', category: 'DEFAULT', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop' },
        { id: 'roof', name: 'Rooftop', category: 'DEFAULT', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop' }
    ],
    selectedBackgroundId: 'library',
    material: {
        file: "",
        prompt: ""
    },
    serverResponse: null,
    currentFrameId: null,
    storyHistory: [], // For the 'Back' feature
    autoMode: false
};

export default state;
