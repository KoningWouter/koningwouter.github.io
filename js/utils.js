// Utils Module - Utility functions (search, animations, etc.)
// Depends on: config.js, api.js, ui.js

// Core loader: fetch user data for a given userId and initialize UI + auto-refresh
async function loadAndDisplayUser(userId) {
    console.log('=== loadAndDisplayUser() called with userId:', userId, '===');

    try {
        console.log('About to fetch user data for userId:', userId);
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
        
        // Check for upcoming wars if we have a faction ID
        if (State.currentFactionId) {
            checkUpcomingWars();
        }
        
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
        
        // Cache user data for use by stocks functions (if it includes stocks)
        if (userData.stocks) {
            State.cachedBarsData = userData;
        }
        
        console.log('Calling updateProgressBars...');
        updateProgressBars(userData);
        console.log('Calling updateStatus...');
        updateStatus(userData);
        // Update total stocks value in the Money card
        try {
            if (typeof updateStocksTotalInMoneyCard === 'function') {
                updateStocksTotalInMoneyCard();
            }
        } catch (stocksError) {
            console.error('Error updating stocks total in Money card after search:', stocksError);
        }
        
        // Fetch and display FFScouter battlestats
        try {
            console.log('Fetching FFScouter battlestats for userId:', userId);
            const ffscouterStats = await fetchFFScouterBattlestats(userId);
            console.log('FFScouter stats received:', ffscouterStats);
            
            if (ffscouterStats && typeof updateFFScouterBattlestats === 'function') {
                console.log('Calling updateFFScouterBattlestats with:', ffscouterStats);
                updateFFScouterBattlestats(ffscouterStats);
            } else if (ffscouterStats === null) {
                console.log('FFScouter stats is null, hiding card');
                // API key not configured or no data, hide the card
                const card = document.getElementById('ffscouterBattlestatsCard');
                if (card) {
                    card.classList.add('hidden');
                }
            } else {
                console.warn('FFScouter stats received but updateFFScouterBattlestats function not found or stats invalid');
            }
        } catch (ffscouterError) {
            console.error('Error fetching FFScouter battlestats:', ffscouterError);
            console.error('Error stack:', ffscouterError.stack);
            // Hide the card on error
            const card = document.getElementById('ffscouterBattlestatsCard');
            if (card) {
                card.classList.add('hidden');
            }
        }
        
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
        
        // Switch to Player Info tab after successful load
        console.log('User data loaded successfully, switching to Player Info tab');
        const playerInfoTabButton = document.querySelector('[data-tab="player-info"]');
        if (playerInfoTabButton) {
            playerInfoTabButton.click();
        }
        console.log('=== loadAndDisplayUser() COMPLETED ===');
    } catch (error) {
        console.error('=== ERROR in loadAndDisplayUser() ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        showError(error.message || 'Failed to fetch user information for the current user.');
        stopAutoRefresh();
        console.log('=== loadAndDisplayUser() ENDED WITH ERROR ===');
    }
}

// Initialize current user based on the Torn API key (uses /user?selections=basic)
async function initializeCurrentUserFromApiKey() {
    console.log('=== initializeCurrentUserFromApiKey() called ===');

    // Always use the Torn API key from settings (NOT the FFScouter key)
    const apiKey = getApiKey();
    if (!apiKey) {
        showError('API key is not configured. Please enter your API key in the Settings tab.');
        return;
    }

    try {
        const basicUrl = `${API_BASE_URL}/user/?selections=basic&key=${apiKey}`;
        console.log('Fetching basic user data from URL:', basicUrl.replace(apiKey, 'KEY_HIDDEN'));

        const response = await fetch(basicUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const basicData = await response.json();
        console.log('Basic user API response:', basicData);

        if (basicData.error) {
            throw new Error(basicData.error.error || JSON.stringify(basicData.error));
        }

        // In the basic user response, the correct identifier is profile.id
        let playerId = null;
        if (basicData.profile && typeof basicData.profile === 'object' && basicData.profile.id) {
            playerId = basicData.profile.id;
        } else {
            // Fallbacks, just in case, but primary is profile.id
            playerId = basicData.player_id || basicData.user_id || basicData.id;
        }

        if (!playerId) {
            throw new Error('Could not determine profile.id from /user?selections=basic response.');
        }

        console.log('Determined playerId from basic endpoint (using profile.id when available):', playerId);

        // Load full user info and start auto-refresh using this playerId
        await loadAndDisplayUser(playerId);
    } catch (error) {
        console.error('Error initializing current user from API key:', error);
        showError(error.message || 'Failed to initialize current user from API key.');
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
    const ffscouterApiKeyInput = document.getElementById('ffscouterApiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    
    if (!apiKeyInput || !ffscouterApiKeyInput || !saveApiKeyBtn) {
        console.error('API key inputs or save button not found');
        return;
    }
    
    // Load API keys from localStorage on page load
    const savedTornApiKey = localStorage.getItem('torn_api_key');
    if (savedTornApiKey) {
        apiKeyInput.value = savedTornApiKey;
        window.API_KEY = savedTornApiKey; // Keep window.API_KEY in sync for backward compatibility
        console.log('Torn API key loaded from localStorage');
    }
    
    const savedFfscouterApiKey = localStorage.getItem('ffscouter_api_key');
    if (savedFfscouterApiKey) {
        ffscouterApiKeyInput.value = savedFfscouterApiKey;
        console.log('FFScouter API key loaded from localStorage');
    }
    
    // Update Torn API key in real-time as user types (so it's available for API calls immediately)
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
    
    // Save both API keys to localStorage when button is clicked
    saveApiKeyBtn.addEventListener('click', () => {
        const tornApiKey = apiKeyInput.value.trim();
        const ffscouterApiKey = ffscouterApiKeyInput.value.trim();
        
        // Save Torn API key
        if (tornApiKey) {
            localStorage.setItem('torn_api_key', tornApiKey);
            window.API_KEY = tornApiKey;
            console.log('Torn API key saved to localStorage');
        } else {
            // Clear Torn API key if input is empty
            localStorage.removeItem('torn_api_key');
            window.API_KEY = null;
            console.log('Torn API key cleared from localStorage');
        }
        
        // Save FFScouter API key
        if (ffscouterApiKey) {
            localStorage.setItem('ffscouter_api_key', ffscouterApiKey);
            console.log('FFScouter API key saved to localStorage');
        } else {
            // Clear FFScouter API key if input is empty
            localStorage.removeItem('ffscouter_api_key');
            console.log('FFScouter API key cleared from localStorage');
        }
        
        // Visual feedback
        saveApiKeyBtn.textContent = 'Saved!';
        saveApiKeyBtn.style.background = 'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(0, 255, 0, 0.1) 100%)';
        saveApiKeyBtn.style.borderColor = 'rgba(0, 255, 0, 0.4)';
        
        setTimeout(() => {
            saveApiKeyBtn.textContent = 'Save All';
            saveApiKeyBtn.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)';
            saveApiKeyBtn.style.borderColor = 'rgba(212, 175, 55, 0.4)';
        }, 2000);
    });
    
    // Also allow saving with Enter key in either input
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKeyBtn.click();
        }
    });
    
    ffscouterApiKeyInput.addEventListener('keypress', (e) => {
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
            // Fetch both bars and status data (barsData now includes stocks)
            const [barsData, statusData] = await Promise.all([
                fetchBarsData(State.currentUserId),
                fetchStatusData(State.currentUserId)
            ]);
            
            // Cache bars data (which includes stocks) for use by stocks functions
            State.cachedBarsData = barsData;
            
            updateProgressBars(barsData);
            updateStatus(statusData);
            
            // Also refresh total stocks value in the Money card (uses cached data)
            try {
                if (typeof updateStocksTotalInMoneyCard === 'function') {
                    await updateStocksTotalInMoneyCard();
                }
            } catch (stocksError) {
                console.error('Error updating stocks total in Money card during auto-refresh:', stocksError);
            }
            
            // Also check for upcoming wars if we have a faction ID
            if (State.currentFactionId) {
                checkUpcomingWars();
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            // Don't show error to user, just log it
        }
    }, 5000); // 5 seconds
    
    // Also check for wars periodically (every 30 seconds)
    if (State.currentFactionId) {
        // Clear any existing war check interval
        if (State.warCheckInterval) {
            clearInterval(State.warCheckInterval);
        }
        
        State.warCheckInterval = setInterval(() => {
            if (State.currentFactionId) {
                checkUpcomingWars();
            } else {
                // Clear interval if no faction ID
                if (State.warCheckInterval) {
                    clearInterval(State.warCheckInterval);
                    State.warCheckInterval = null;
                }
            }
        }, 30000); // 30 seconds
    }
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (State.refreshInterval) {
        clearInterval(State.refreshInterval);
        State.refreshInterval = null;
    }
    if (State.warCheckInterval) {
        clearInterval(State.warCheckInterval);
        State.warCheckInterval = null;
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


// Initialize voices (needed for some browsers)
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
    };
}


