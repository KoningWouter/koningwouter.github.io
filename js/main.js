// Main Module - Main initialization and event handlers
// Depends on: config.js, api.js, ui.js, utils.js, tabs.js, stocks.js, targets.js, bounties.js, worldmap.js

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupTravelDataToggle();
    setupApiKeyStorage();
    initAnimatedBackground();
    setupFactionIdInput();
    setupImageOverlay();
    
    // Initialize world map immediately
    initializeFactionMap();
    
    // Initialize targets module
    if (window.TargetsModule && window.TargetsModule.initialize) {
        window.TargetsModule.initialize();
    }
    
    // Initialize current user based on API key (no manual search needed)
    initializeCurrentUserFromApiKey();
});

// Setup Image Overlay functionality
function setupImageOverlay() {
    const helpImage = document.getElementById('ffscouterHelpImage');
    const overlay = document.getElementById('imageOverlay');
    const overlayImage = document.getElementById('overlayImage');
    const closeBtn = document.querySelector('.image-overlay-close');
    
    if (helpImage && overlay && overlayImage && closeBtn) {
        // Show overlay when image is clicked
        helpImage.addEventListener('click', () => {
            overlayImage.src = helpImage.src;
            overlay.style.display = 'flex';
        });
        
        // Close overlay when close button is clicked
        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
        
        // Close overlay when clicking outside the image
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
        
        // Close overlay with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.style.display === 'flex') {
                overlay.style.display = 'none';
            }
        });
    }
}


