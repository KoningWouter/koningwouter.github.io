// Main Module - Main initialization and event handlers
// Depends on: config.js, api.js, ui.js, utils.js, tabs.js, stocks.js, bounties.js, worldmap.js

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupTabs();
    setupTravelDataToggle();
    setupApiKeyStorage();
    initAnimatedBackground();
    setupFactionIdInput();
    
    // Initialize world map immediately
    initializeFactionMap();
    
    // Auto-fill input with default user ID and trigger search
    const userIdInput = document.getElementById('userIdInput');
    if (userIdInput) {
        userIdInput.value = '3883628';
        
        // Auto-trigger search after a short delay
        setTimeout(() => {
            handleSearch();
        }, 500);
    }
});


