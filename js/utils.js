// Utils Module - Utility functions (search, animations, etc.)
// Depends on: config.js, api.js, ui.js

// Announcements for rock button
const ANNOUNCEMENTS = [
    "Ladies and gentlemen, we are going to rock",
    "Ladies and gentlemen, prepare yourselves, for we are about to rock",
    "Attention all players, ladies and gentlemen, we are about to absolutely rock",
    "Ladies and gentlemen, brace yourselves, we are going to rock this place",
    "Ladies and gentlemen, hold onto your seats, because we are going to rock",
    "Ladies and gentlemen, the moment you've been waiting for, we are going to rock",
    "Ladies and gentlemen, get ready, because we are going to rock your world",
    "Ladies and gentlemen, it's time, we are going to rock and roll"
];

// Global variable to track shake interval
let shakeInterval = null;

// Setup search functionality
function setupSearch() {
    console.log('=== setupSearch() called ===');
    const searchBtn = document.getElementById('searchBtn');
    const userIdInput = document.getElementById('userIdInput');

    console.log('Search button element:', searchBtn);
    console.log('User ID input element:', userIdInput);

    if (!searchBtn) {
        console.error('Search button not found!');
        return;
    }

    if (!userIdInput) {
        console.error('User ID input not found!');
        return;
    }

    searchBtn.addEventListener('click', () => {
        console.log('Search button clicked!');
        handleSearch();
    });
    
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed in input!');
            handleSearch();
        }
    });
    
    console.log('Search event listeners attached');
}

// Handle search
async function handleSearch() {
    console.log('=== handleSearch() called ===');
    const userIdInput = document.getElementById('userIdInput');
    const userId = userIdInput ? userIdInput.value.trim() : '';

    console.log('User ID entered:', userId);

    if (!userId) {
        console.log('No user ID entered');
        showError('Please enter a user ID');
        return;
    }

    if (!/^\d+$/.test(userId)) {
        console.log('Invalid user ID format');
        showError('User ID must be a number');
        return;
    }

    console.log('Starting search for user ID:', userId);

    try {
        console.log('About to fetch user data...');
        const userData = await fetchUserData(userId);
        console.log('=== USER DATA RECEIVED ===');
        console.log('Full userData object:', userData);
        console.log('userData keys:', Object.keys(userData));
        console.log('userData.bars:', userData.bars);
        console.log('userData.life:', userData.life);
        console.log('userData.energy:', userData.energy);
        console.log('userData.nerve:', userData.nerve);
        console.log('userData.happy:', userData.happy);
        console.log('userData.faction:', userData.faction);
        console.log('userData.profile:', userData.profile);
        State.currentUserId = userId;
        
        // Store faction ID if available
        console.log('=== CHECKING FACTION ===');
        console.log('User data faction property:', userData.faction);
        console.log('Faction type:', typeof userData.faction);
        console.log('Full faction object:', JSON.stringify(userData.faction));
        
        if (userData.faction) {
            if (typeof userData.faction === 'object' && userData.faction !== null) {
                console.log('Faction is an object, checking for faction_id...');
                console.log('Faction object keys:', Object.keys(userData.faction));
                if (userData.faction.faction_id) {
                    State.currentFactionId = userData.faction.faction_id;
                    console.log('✓ Faction ID extracted from object:', State.currentFactionId);
                } else if (userData.faction.id) {
                    State.currentFactionId = userData.faction.id;
                    console.log('✓ Faction ID extracted from id property:', State.currentFactionId);
                } else {
                    console.log('✗ Faction object exists but no faction_id or id found');
                    console.log('Faction object:', userData.faction);
                }
            } else if (typeof userData.faction === 'number') {
                State.currentFactionId = userData.faction;
                console.log('✓ Faction ID is a number:', State.currentFactionId);
            } else if (typeof userData.faction === 'string') {
                State.currentFactionId = parseInt(userData.faction);
                console.log('✓ Faction ID is a string, converted to number:', State.currentFactionId);
            } else {
                console.log('✗ Faction property exists but format is unexpected:', typeof userData.faction, userData.faction);
            }
        } else {
            State.currentFactionId = null;
            console.log('✗ No faction property in user data');
        }
        
        console.log('Final currentFactionId:', State.currentFactionId);
        
        // Fetch faction details if we have a faction ID but no name
        if (State.currentFactionId && (!userData.faction || typeof userData.faction !== 'object' || !userData.faction.faction_name)) {
            console.log('Fetching faction details for display...');
            try {
                const factionDetails = await fetchFactionData(State.currentFactionId, 'basic');
                console.log('Faction details received:', factionDetails);
                if (factionDetails.name) {
                    // Add faction name to userData for display
                    if (!userData.faction || typeof userData.faction !== 'object') {
                        userData.faction = {};
                    }
                    userData.faction.faction_name = factionDetails.name;
                    userData.faction.name = factionDetails.name;
                    console.log('Added faction name to userData:', factionDetails.name);
                }
            } catch (error) {
                console.error('Error fetching faction details:', error);
                // Continue anyway, we'll display what we have
            }
        }
        
        console.log('Calling updateProgressBars...');
        updateProgressBars(userData);
        console.log('Calling updateStatus...');
        updateStatus(userData);
        console.log('Calling startAutoRefresh...');
        startAutoRefresh();
        console.log('All display functions called');
        
        // Load faction members if user has a faction
        console.log('=== CHECKING FOR FACTION ===');
        console.log('currentFactionId:', State.currentFactionId);
        console.log('currentFactionId type:', typeof State.currentFactionId);
        console.log('currentFactionId truthy?', !!State.currentFactionId);
        
        if (State.currentFactionId) {
            console.log('✓ Faction ID found, calling loadFactionMembers() NOW');
            console.log('About to invoke loadFactionMembers function...');
            try {
                loadFactionMembers();
                console.log('loadFactionMembers() call completed (async)');
            } catch (error) {
                console.error('ERROR calling loadFactionMembers():', error);
            }
        }
        
        // Switch to Player Info tab after successful search
        console.log('Search completed successfully, switching to Player Info tab');
        const playerInfoTabButton = document.querySelector('[data-tab="player-info"]');
        if (playerInfoTabButton) {
            playerInfoTabButton.click();
        }
        console.log('=== handleSearch() COMPLETED ===');
    } catch (error) {
        console.error('=== ERROR in handleSearch() ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        showError(error.message || 'Failed to fetch user information. Please check the user ID and try again.');
        stopAutoRefresh();
        console.log('=== handleSearch() ENDED WITH ERROR ===');
    }
}

// Setup travel data toggle
function setupTravelDataToggle() {
    const toggleHeader = document.querySelector('.travel-data-header-toggle');
    const toggleIcon = document.getElementById('travelDataToggleIcon');
    const travelDataContent = document.getElementById('travelDataContent');
    
    if (!toggleHeader || !toggleIcon || !travelDataContent) {
        return;
    }
    
    toggleHeader.addEventListener('click', () => {
        const isHidden = travelDataContent.classList.contains('hidden');
        
        if (isHidden) {
            // Show content
            travelDataContent.classList.remove('hidden');
            toggleIcon.textContent = '▲';
            toggleIcon.style.transform = 'rotate(0deg)';
        } else {
            // Hide content
            travelDataContent.classList.add('hidden');
            toggleIcon.textContent = '▼';
            toggleIcon.style.transform = 'rotate(0deg)';
        }
    });
}

// Setup API key storage in localStorage
function setupApiKeyStorage() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    
    if (!apiKeyInput || !saveApiKeyBtn) {
        console.error('API key input or save button not found');
        return;
    }
    
    // Load API key from localStorage on page load
    const savedApiKey = localStorage.getItem('torn_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        window.API_KEY = savedApiKey; // Keep window.API_KEY in sync for backward compatibility
        console.log('API key loaded from localStorage');
    }
    
    // Update API key in real-time as user types (so it's available for API calls immediately)
    apiKeyInput.addEventListener('input', (e) => {
        const apiKey = e.target.value.trim();
        if (apiKey) {
            window.API_KEY = apiKey; // Update immediately for API calls
        } else {
            // If input is cleared, fall back to localStorage
            const savedKey = localStorage.getItem('torn_api_key');
            window.API_KEY = savedKey || null;
        }
    });
    
    // Save API key to localStorage when button is clicked
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (apiKey) {
            localStorage.setItem('torn_api_key', apiKey);
            window.API_KEY = apiKey;
            console.log('API key saved to localStorage');
            
            // Visual feedback
            saveApiKeyBtn.textContent = 'Saved!';
            saveApiKeyBtn.style.background = 'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(0, 255, 0, 0.1) 100%)';
            saveApiKeyBtn.style.borderColor = 'rgba(0, 255, 0, 0.4)';
            
            setTimeout(() => {
                saveApiKeyBtn.textContent = 'Save';
                saveApiKeyBtn.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)';
                saveApiKeyBtn.style.borderColor = 'rgba(212, 175, 55, 0.4)';
            }, 2000);
        } else {
            // Clear API key if input is empty
            localStorage.removeItem('torn_api_key');
            window.API_KEY = null;
            console.log('API key cleared from localStorage');
        }
    });
    
    // Also allow saving with Enter key
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKeyBtn.click();
        }
    });
}

// Initialize animated background
function initAnimatedBackground() {
    createStars();
    createComets();
    createSparks();
}

// Create stars
function createStars() {
    const starsLayer = document.querySelector('.stars-layer');
    if (!starsLayer) return;
    
    const starCount = 150;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random size
        const size = Math.random();
        if (size < 0.6) {
            star.classList.add('star-small');
        } else if (size < 0.9) {
            star.classList.add('star-medium');
        } else {
            star.classList.add('star-large');
        }
        
        // Random position
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Random animation delay
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (2 + Math.random() * 2) + 's';
        
        starsLayer.appendChild(star);
    }
}

// Create comets
function createComets() {
    const cometsLayer = document.querySelector('.comets-layer');
    if (!cometsLayer) return;
    
    function createComet() {
        const comet = document.createElement('div');
        comet.className = 'comet';
        
        // Random starting position
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        
        comet.style.left = startX + 'px';
        comet.style.top = startY + 'px';
        
        // Random duration
        const duration = 8 + Math.random() * 12;
        comet.style.animationDuration = duration + 's';
        comet.style.animationDelay = Math.random() * 2 + 's';
        
        cometsLayer.appendChild(comet);
        
        // Remove after animation
        setTimeout(() => {
            if (comet.parentNode) {
                comet.parentNode.removeChild(comet);
            }
        }, (duration + 2) * 1000);
    }
    
    // Create initial comets
    for (let i = 0; i < 3; i++) {
        setTimeout(() => createComet(), i * 3000);
    }
    
    // Create new comets periodically
    setInterval(() => {
        if (cometsLayer.children.length < 5) {
            createComet();
        }
    }, 8000);
}

// Create sparks
function createSparks() {
    const sparksLayer = document.querySelector('.sparks-layer');
    if (!sparksLayer) return;
    
    function createSpark() {
        const spark = document.createElement('div');
        spark.className = 'spark';
        
        // Random size
        const size = Math.random();
        if (size < 0.5) {
            spark.classList.add('spark-small');
        } else if (size > 0.8) {
            spark.classList.add('spark-large');
        }
        
        // Random position (can be anywhere on screen, including over content)
        spark.style.left = Math.random() * window.innerWidth + 'px';
        spark.style.top = Math.random() * window.innerHeight + 'px';
        
        // Some sparks can overlap content (random z-index)
        if (Math.random() > 0.7) {
            spark.style.zIndex = '2';
            spark.style.opacity = '0.6';
        }
        
        // Random animation delay and duration
        spark.style.animationDelay = Math.random() * 2 + 's';
        spark.style.animationDuration = (3 + Math.random() * 2) + 's';
        
        sparksLayer.appendChild(spark);
        
        // Remove after animation
        setTimeout(() => {
            if (spark.parentNode) {
                spark.parentNode.removeChild(spark);
            }
        }, 6000);
    }
    
    // Create initial sparks
    for (let i = 0; i < 10; i++) {
        setTimeout(() => createSpark(), i * 500);
    }
    
    // Create new sparks periodically
    setInterval(() => {
        if (sparksLayer.children.length < 15) {
            createSpark();
        }
    }, 2000);
}

// Display API endpoints
function displayEndpoints() {
    const endpointsList = document.getElementById('endpointsList');
    endpointsList.innerHTML = '';

    API_ENDPOINTS.forEach((endpoint, index) => {
        const card = document.createElement('div');
        card.className = 'endpoint-card';
        card.dataset.endpointIndex = index;
        
        // Parse URL to separate base URL and parameters
        const fullUrl = `${API_BASE_URL}${endpoint.url}`;
        const urlParts = fullUrl.split('?');
        const baseUrl = urlParts[0];
        const queryString = urlParts[1] || '';
        
        // Extract parameters
        let parameters = [];
        if (endpoint.selections && endpoint.selections.length > 0) {
            // Use the selections array if available
            parameters = endpoint.selections;
        } else if (queryString) {
            // Parse from query string
            const params = new URLSearchParams(queryString);
            params.forEach((value, key) => {
                if (key === 'selections') {
                    parameters = value.split(',').map(p => p.trim());
                } else {
                    parameters.push(`${key}=${value}`);
                }
            });
        }
        
        // Build parameters list HTML with clickable items
        const selectorDescriptions = SELECTOR_DESCRIPTIONS[endpoint.name] || {};
        let parametersHtml = '';
        if (parameters.length > 0) {
            parametersHtml = '<ul class="endpoint-parameters">';
            parameters.forEach(param => {
                parametersHtml += `<li class="endpoint-parameter-item" data-param="${param}">${param}</li>`;
            });
            parametersHtml += '</ul>';
        }
        
        card.innerHTML = `
            <div class="endpoint-header">
                <div class="endpoint-name">${endpoint.name}</div>
            </div>
            <div class="endpoint-content">
                <div class="endpoint-description">${endpoint.description}</div>
                <div class="endpoint-url">${baseUrl}</div>
                ${parametersHtml}
            </div>
        `;
        
        // Add click handlers to each parameter item
        const parameterItems = card.querySelectorAll('.endpoint-parameter-item');
        const parametersList = card.querySelector('.endpoint-parameters');
        let currentDescriptionElement = null;
        
        parameterItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click
                
                const param = this.dataset.param;
                const description = selectorDescriptions[param] || 'No description available for this selector.';
                
                // Check if this parameter is already showing
                const isAlreadyActive = this.classList.contains('active');
                
                // Remove any existing description element
                if (currentDescriptionElement && currentDescriptionElement.parentNode) {
                    currentDescriptionElement.parentNode.removeChild(currentDescriptionElement);
                    currentDescriptionElement = null;
                }
                
                // Remove active state from all parameters in this card
                parameterItems.forEach(pi => pi.classList.remove('active'));
                
                if (isAlreadyActive) {
                    // Hide description if clicking the same parameter
                    this.classList.remove('active');
                } else {
                    // Show description for clicked parameter
                    this.classList.add('active');
                    
                    // Create description element
                    const descriptionElement = document.createElement('div');
                    descriptionElement.className = 'endpoint-selector-description';
                    descriptionElement.innerHTML = `
                        <div class="selector-description-content">
                            <span class="selector-name-display">${param}:</span>
                            <span class="selector-desc-display">${description}</span>
                        </div>
                    `;
                    
                    // Insert right after the clicked parameter item
                    this.parentNode.insertBefore(descriptionElement, this.nextSibling);
                    currentDescriptionElement = descriptionElement;
                }
            });
        });
        
        endpointsList.appendChild(card);
    });
}

// Start auto-refresh every 5 seconds
function startAutoRefresh() {
    // Clear any existing interval
    stopAutoRefresh();

    if (!State.currentUserId) return;

    State.refreshInterval = setInterval(async () => {
        if (!State.currentUserId) {
            stopAutoRefresh();
            return;
        }

        try {
            // Fetch both bars and status data
            const [barsData, statusData] = await Promise.all([
                fetchBarsData(State.currentUserId),
                fetchStatusData(State.currentUserId)
            ]);
            updateProgressBars(barsData);
            updateStatus(statusData);
        } catch (error) {
            console.error('Error refreshing data:', error);
            // Don't show error to user, just log it
        }
    }, 5000); // 5 seconds
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (State.refreshInterval) {
        clearInterval(State.refreshInterval);
        State.refreshInterval = null;
    }
    stopTravelCountdown();
}

// Fetch and display travel info (utility function)
async function fetchAndDisplayTravelInfo(userId, userName) {
    const tempTravelCard = document.getElementById('tempTravelCard');
    const tempTravelInfo = document.getElementById('tempTravelInfo');
    
    if (!tempTravelCard || !tempTravelInfo) {
        console.error('Travel card elements not found');
        return;
    }
    
    try {
        tempTravelCard.classList.remove('hidden');
        tempTravelInfo.textContent = 'Loading travel information...';
        
        const userData = await fetchUserData(userId, 'basic,travel');
        const travelData = userData.travel || null;
        
        let infoHTML = '';
        
        if (travelData && typeof travelData === 'object') {
            infoHTML += '<div class="travel-info-item"><strong>User:</strong> ' + (userData.name || userName) + ' (ID: ' + userId + ')</div>';
            
            if (travelData.destination) {
                infoHTML += '<div class="travel-info-item"><strong>Destination:</strong> ' + travelData.destination + '</div>';
            }
            
            if (travelData.departing) {
                infoHTML += '<div class="travel-info-item"><strong>Departing From:</strong> ' + travelData.departing + '</div>';
            }
            
            if (travelData.time_left !== undefined) {
                const timeLeft = travelData.time_left;
                const hours = Math.floor(timeLeft / 3600);
                const minutes = Math.floor((timeLeft % 3600) / 60);
                const seconds = timeLeft % 60;
                infoHTML += '<div class="travel-info-item"><strong>Time Left:</strong> ' + 
                    (hours > 0 ? hours + 'h ' : '') + 
                    (minutes > 0 ? minutes + 'm ' : '') + 
                    seconds + 's</div>';
            }
            
            if (travelData.timestamp) {
                const travelEnd = new Date(travelData.timestamp * 1000);
                infoHTML += '<div class="travel-info-item"><strong>Travel Ends:</strong> ' + travelEnd.toLocaleString() + '</div>';
            }
            
            if (!travelData.destination && !travelData.departing) {
                infoHTML += '<div class="travel-info-item"><strong>Status:</strong> In Torn City</div>';
            }
        } else {
            infoHTML = '<div class="travel-info-item">No travel data available. User is likely in Torn City.</div>';
        }
        
        tempTravelInfo.innerHTML = infoHTML;
        console.log('Travel info displayed for user', userId, travelData);
        
    } catch (error) {
        console.error('Error fetching travel info:', error);
        tempTravelInfo.innerHTML = '<div class="travel-info-item error">Error loading travel information: ' + error.message + '</div>';
    }
}

// Create confetti/fireworks effect
function createFireworks() {
    const colors = ['#d4af37', '#dc143c', '#ffd700', '#f4e4bc', '#ff6b6b', '#4a9eff'];
    const container = document.body;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;
        const duration = 0.5 + Math.random() * 1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.position = 'fixed';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.backgroundColor = color;
        particle.style.borderRadius = '50%';
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.boxShadow = `0 0 15px ${color}, 0 0 30px ${color}`;
        particle.style.transition = `all ${duration}s ease-out`;
        particle.style.opacity = '1';
        
        container.appendChild(particle);
        
        // Trigger animation
        requestAnimationFrame(() => {
            particle.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0)`;
            particle.style.opacity = '0';
        });
        
        setTimeout(() => {
            particle.remove();
        }, duration * 1000 + 100);
    }
}

// Add screen shake effect
function startScreenShake() {
    const body = document.body;
    // Start continuous shake animation
    body.style.animation = 'screenShake 0.1s ease-in-out infinite';
}

function stopScreenShake() {
    const body = document.body;
    body.style.animation = '';
}

// Welcome announcement function - ENHANCED HILARIOUS VERSION
function playWelcomeAnnouncement() {
    // Stop any ongoing speech
    speechSynthesis.cancel();
    
    // Pick a random announcement
    const announcement = ANNOUNCEMENTS[Math.floor(Math.random() * ANNOUNCEMENTS.length)];
    const utterance = new SpeechSynthesisUtterance(announcement);
    
    // Random dramatic voice settings for variety
    const rateVariations = [0.75, 0.8, 0.85, 0.9];
    const pitchVariations = [1.0, 1.1, 1.2, 0.95];
    
    utterance.rate = rateVariations[Math.floor(Math.random() * rateVariations.length)];
    utterance.pitch = pitchVariations[Math.floor(Math.random() * pitchVariations.length)];
    utterance.volume = 1.0;
    
    // Try to use a more dramatic voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoices = voices.filter(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Zira') ||
        voice.name.includes('David') ||
        voice.lang.includes('en')
    );
    
    if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[Math.floor(Math.random() * preferredVoices.length)];
    }
    
    // Add some flair with event handlers
    utterance.onstart = () => {
        console.log('🎤 Rock announcement started!', announcement);
        const btn = document.getElementById('announceBtn');
        if (btn) {
            btn.style.animation = 'pulse 0.5s ease-in-out infinite';
            btn.style.transform = 'scale(1.1)';
        }
        
        // Create visual effects
        createFireworks();
        
        // Start continuous screen shake
        startScreenShake();
        
        // Add epic glow/light-up effect to the entire page (continuous until announcement ends)
        document.body.style.filter = 'brightness(1.3) drop-shadow(0 0 20px rgba(212, 175, 55, 0.8))';
        document.body.style.transition = 'filter 0.3s ease-in-out';
    };
    
    utterance.onend = () => {
        console.log('🎤 Rock announcement complete!');
        
        // Stop screen shake
        stopScreenShake();
        
        // Remove light-up effect
        document.body.style.filter = '';
        
        const btn = document.getElementById('announceBtn');
        if (btn) {
            btn.style.animation = '';
            btn.style.transform = '';
        }
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        // Also stop effects if there's an error
        stopScreenShake();
        document.body.style.filter = '';
    };
    
    speechSynthesis.speak(utterance);
}

// Initialize voices (needed for some browsers)
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
    };
}


