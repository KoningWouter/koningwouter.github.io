// Main Module - Main initialization and event handlers
// Depends on: config.js, api.js, ui.js, utils.js, tabs.js, stocks.js, bounties.js, worldmap.js

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupTravelDataToggle();
    setupApiKeyStorage();
    initAnimatedBackground();
    setupFactionIdInput();
    
    // Initialize world map immediately
    initializeFactionMap();
    
    // Initialize current user based on API key (no manual search needed)
    initializeCurrentUserFromApiKey();
});


