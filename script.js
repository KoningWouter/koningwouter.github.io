// API configuration
console.log('=== script.js loaded ===');
const API_BASE_URL = 'https://api.torn.com/v2';

// API endpoints information
const API_ENDPOINTS = [
    {
        name: 'User',
        description: 'Retrieve detailed information about a specific user including stats, personal info, and game data.',
        url: '/user/?selections=basic,profile,personalstats,battlestats,education,workstats,crimes,travel,icons,cooldowns,money,notifications,perks,bars,networth,jobpoints,merits,refills,discord,weaponexp,log,events,messages,competition,stocks,properties,honors,medals,display,awards',
        selections: ['basic', 'profile', 'personalstats', 'battlestats', 'education', 'workstats', 'crimes', 'travel', 'icons', 'cooldowns', 'money', 'notifications', 'perks', 'bars', 'networth', 'jobpoints', 'merits', 'refills', 'discord', 'weaponexp', 'log', 'events', 'messages', 'competition', 'stocks', 'properties', 'honors', 'medals', 'display', 'awards']
    },
    {
        name: 'Faction',
        description: 'Access information about factions including member lists, chain reports, and faction statistics.',
        url: '/faction/?selections=basic,contributors,contributors_faction,members,memberstats,territory,territorywars,rankedwars,chain,chainreport,upgrades,stats,currency,armor,weapons,medical,boosters,mainnews,crimes,attacks,attacksfull,revives,upgrades,stats,currency,armor,weapons,medical,boosters,mainnews,crimes,attacks,attacksfull,revives',
        selections: ['basic', 'contributors', 'members', 'memberstats', 'territory', 'chain', 'chainreport', 'upgrades', 'stats']
    },
    {
        name: 'Company',
        description: 'Get details about companies including employee information, stock, and company statistics.',
        url: '/company/?selections=basic,profile,detailed,employees,stock,applications,news,newsfull,lookup',
        selections: ['basic', 'profile', 'detailed', 'employees', 'stock', 'applications', 'news']
    },
    {
        name: 'Market',
        description: 'Fetch market data including item listings, bazaar information, and point market data.',
        url: '/market/?selections=bazaar,itemmarket,pointsmarket,timestamp',
        selections: ['bazaar', 'itemmarket', 'pointsmarket', 'timestamp']
    },
    {
        name: 'Torn',
        description: 'Obtain general game information including city data, organized crimes, and game statistics.',
        url: '/torn/?selections=currency,items,competition,education,honors,medals,organisedcrimes,properties,rackets,raids,stats,stocks,territory,territorywars,companies,factions,rankedwars,lookup,lookupitems,lookupfactions,lookupcompanies,lookupplayers,lookupgyms,lookupproperties,lookupmedals,lookuphonors,lookupcompaniesdetailed,lookupfactionsdetailed,lookupplayersdetailed',
        selections: ['currency', 'items', 'competition', 'education', 'honors', 'medals', 'organisedcrimes', 'properties', 'rackets', 'raids', 'stats', 'stocks', 'territory', 'territorywars', 'companies', 'factions', 'rankedwars']
    },
    {
        name: 'Key',
        description: 'Check the status, access level, and details of your API key including rate limits and permissions.',
        url: '/key/?selections=info',
        selections: ['info']
    },
    {
        name: 'Property',
        description: 'Retrieve information about properties including property details, upgrades, and ownership data.',
        url: '/property/?selections=property',
        selections: ['property']
    },
    {
        name: 'Racing',
        description: 'Access racing statistics and information about racing events and participants.',
        url: '/racing/?selections=stats,leaderboard',
        selections: ['stats', 'leaderboard']
    },
    {
        name: 'Forum',
        description: 'Access forum-related data including threads, posts, and forum statistics.',
        url: '/forum/?selections=forums,threads,posts',
        selections: ['forums', 'threads', 'posts']
    },
    {
        name: 'Bank',
        description: 'Get banking information including account balances, transactions, and investment data.',
        url: '/bank/?selections=bank',
        selections: ['bank']
    }
];

// Global variables for auto-refresh
let currentUserId = null;
let refreshInterval = null;
let travelCountdownInterval = null;
let travelEndTime = null;

// Global variables for faction map
let currentFactionId = null;
let worldMap = null;
let tornCityMarkers = [];
let tornCityLines = [];
let factionMarkers = [];
let factionMembersData = [];
let mapInitRetryCount = 0;

let mapInitInProgress = false;
const MAX_MAP_INIT_RETRIES = 10;

// Global variable for world map update interval
let worldMapUpdateInterval = null;

// Torn travel cities with coordinates (only actual travelable destinations in Torn)
const tornCities = [
    { name: 'United Kingdom', coords: [51.5074, -0.1278] }, // London
    { name: 'Mexico', coords: [31.6904, -106.4244] }, // Ciudad Juárez
    { name: 'Cayman Islands', coords: [19.3133, -81.2546] }, // George Town
    { name: 'Canada', coords: [43.6532, -79.3832] }, // Toronto
    { name: 'Hawaii', coords: [21.3099, -157.8581] }, // Honolulu
    { name: 'Switzerland', coords: [47.3769, 8.5417] }, // Zurich
    { name: 'Argentina', coords: [-34.6037, -58.3816] }, // Buenos Aires
    { name: 'Japan', coords: [35.6762, 139.6503] }, // Tokyo
    { name: 'China', coords: [39.9042, 116.4074] }, // Beijing
    { name: 'UAE', coords: [25.2048, 55.2708] }, // Dubai
    { name: 'South Africa', coords: [-26.2041, 28.0473] }, // Johannesburg
    { name: 'Torn', coords: [39.0997, -94.5786] } // Kansas City, United States
];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    displayEndpoints();
    setupSearch();
    setupTabs();
    initAnimatedBackground();
    
    // Initialize world map immediately
    initializeFactionMap();
    
    // Auto-fill input with default user ID and trigger search
    const userIdInput = document.getElementById('userIdInput');
    userIdInput.value = '3883628';
    
    // Auto-trigger search after a short delay
    setTimeout(() => {
        handleSearch();
    }, 500);
});

// Fetch and display travel information for a specific user
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

// Setup tab functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Stop world map updates when switching away from world map tab
            if (targetTab !== 'world-map') {
                stopWorldMapUpdates();
            }
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            
            if (targetTab === 'search') {
                document.getElementById('searchTab').classList.add('active');
            } else if (targetTab === 'player-info') {
                document.getElementById('playerInfoTab').classList.add('active');
            } else if (targetTab === 'world-map') {
                const worldMapTab = document.getElementById('worldMapTab');
                if (worldMapTab) {
                    worldMapTab.classList.add('active');
                    console.log('World Map tab activated');
                    
                    // Initialize map if not already initialized, or invalidate size if it exists
                    if (!worldMap) {
                        initializeFactionMap();
                    } else {
                        // Invalidate map size when tab becomes visible to ensure proper rendering
                        setTimeout(() => {
                            if (worldMap) {
                                worldMap.invalidateSize();
                            }
                        }, 100);
                    }
                    
                    // Start automatic updates for markers
                    startWorldMapUpdates();
                } else {
                    console.error('World Map tab element not found');
                }
            } else if (targetTab === 'faction-map') {
                const factionMapTab = document.getElementById('factionMapTab');
                factionMapTab.classList.add('active');
            } else if (targetTab === 'settings') {
                const settingsTab = document.getElementById('settingsTab');
                if (settingsTab) {
                    settingsTab.classList.add('active');
                    console.log('Settings tab activated');
                } else {
                    console.error('Settings tab element not found');
                }
            } else if (targetTab === 'dummy') {
                const dummyTab = document.getElementById('dummyTab');
                if (dummyTab) {
                    dummyTab.classList.add('active');
                    console.log('Dummy tab activated');
                } else {
                    console.error('Dummy tab element not found');
                }
            }
        });
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

    API_ENDPOINTS.forEach(endpoint => {
        const card = document.createElement('div');
        card.className = 'endpoint-card';
        
        card.innerHTML = `
            <div class="endpoint-name">${endpoint.name}</div>
            <div class="endpoint-description">${endpoint.description}</div>
            <div class="endpoint-url">${API_BASE_URL}${endpoint.url}</div>
        `;
        
        endpointsList.appendChild(card);
    });
}

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
    const userInfoDiv = document.getElementById('userInfo');

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

    // Show loading state
    userInfoDiv.classList.remove('hidden');
    userInfoDiv.innerHTML = '<div class="loading">Loading user information...</div>';

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
        currentUserId = userId;
        
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
                    currentFactionId = userData.faction.faction_id;
                    console.log('✓ Faction ID extracted from object:', currentFactionId);
                } else if (userData.faction.id) {
                    currentFactionId = userData.faction.id;
                    console.log('✓ Faction ID extracted from id property:', currentFactionId);
                } else {
                    console.log('✗ Faction object exists but no faction_id or id found');
                    console.log('Faction object:', userData.faction);
                }
            } else if (typeof userData.faction === 'number') {
                currentFactionId = userData.faction;
                console.log('✓ Faction ID is a number:', currentFactionId);
            } else if (typeof userData.faction === 'string') {
                currentFactionId = parseInt(userData.faction);
                console.log('✓ Faction ID is a string, converted to number:', currentFactionId);
            } else {
                console.log('✗ Faction property exists but format is unexpected:', typeof userData.faction, userData.faction);
            }
        } else {
            currentFactionId = null;
            console.log('✗ No faction property in user data');
        }
        
        console.log('Final currentFactionId:', currentFactionId);
        
        // Fetch faction details if we have a faction ID but no name
        if (currentFactionId && (!userData.faction || typeof userData.faction !== 'object' || !userData.faction.faction_name)) {
            console.log('Fetching faction details for display...');
            try {
                const factionDetails = await fetchFactionData(currentFactionId, 'basic');
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
        
        console.log('Calling displayUserInfo...');
        displayUserInfo(userData);
        console.log('Calling updateProgressBars...');
        updateProgressBars(userData);
        console.log('Calling updateStatus...');
        updateStatus(userData);
        console.log('Calling startAutoRefresh...');
        startAutoRefresh();
        console.log('All display functions called');
        
        // Load faction members if user has a faction
        console.log('=== CHECKING FOR FACTION ===');
        console.log('currentFactionId:', currentFactionId);
        console.log('currentFactionId type:', typeof currentFactionId);
        console.log('currentFactionId truthy?', !!currentFactionId);
        
        if (currentFactionId) {
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

// Fetch user data from API
async function fetchUserData(userId, selections = 'basic,profile,bars,travel,faction,money') {
    // Check if API key is configured
    if (!window.API_KEY) {
        throw new Error('API key is not configured. Please check config.js');
    }

    // Validate userId is numeric
    if (!userId || (typeof userId !== 'number' && !/^\d+$/.test(String(userId)))) {
        throw new Error(`Invalid user ID: ${userId}. User ID must be a number.`);
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === 'number' ? userId : parseInt(userId, 10);
    if (isNaN(numericUserId)) {
        throw new Error(`Invalid user ID: ${userId}. Could not convert to number.`);
    }

    const url = `${API_BASE_URL}/user/${numericUserId}?selections=${selections}&key=${window.API_KEY}`;
    console.log('Fetching user data from URL:', url.replace(window.API_KEY, 'KEY_HIDDEN'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API response status:', response.status);
    console.log('API response data:', data);

    if (data.error) {
        const errorMessage = data.error.error || JSON.stringify(data.error);
        console.error('API Error:', data.error);
        
        // Handle specific "Incorrect ID-entity relation" error more gracefully
        if (errorMessage.includes('Incorrect ID-entity relation') || errorMessage.includes('ID-entity')) {
            throw new Error(`Permission denied: API key does not have access to user ${numericUserId}. This may be due to insufficient API key permissions.`);
        }
        
        throw new Error(errorMessage);
    }

    return data;
}

// Fetch only bars data for quick refresh
async function fetchBarsData(userId) {
    return await fetchUserData(userId, 'bars,money,travel');
}

// Fetch status data for quick refresh (includes travel)
async function fetchStatusData(userId) {
    return await fetchUserData(userId, 'basic,travel');
}

// Update progress bars
function updateProgressBars(data) {
    console.log('=== updateProgressBars called ===');
    console.log('Data received:', data);
    console.log('data.bars:', data.bars);
    console.log('data.life:', data.life);
    console.log('data.energy:', data.energy);
    console.log('data.nerve:', data.nerve);
    console.log('data.happy:', data.happy);
    
    const progressSection = document.getElementById('progressBarsSection');
    progressSection.classList.remove('hidden');

    // In API v2, bars data might be under data.bars instead of directly on data
    const bars = data.bars || {};
    const life = data.life || bars.life;
    const energy = data.energy || bars.energy;
    const nerve = data.nerve || bars.nerve;
    const happy = data.happy || bars.happy;
    
    console.log('Extracted bars:', { life, energy, nerve, happy });

    // Update Life bar
    if (life) {
        console.log('Updating life bar:', life);
        updateProgressBar('life', life.current, life.maximum);
    } else {
        console.warn('No life data found');
    }

    // Update Energy bar
    if (energy) {
        console.log('Updating energy bar:', energy);
        updateProgressBar('energy', energy.current, energy.maximum);
    } else {
        console.warn('No energy data found');
    }

    // Update Nerve bar
    if (nerve) {
        console.log('Updating nerve bar:', nerve);
        updateProgressBar('nerve', nerve.current, nerve.maximum);
    } else {
        console.warn('No nerve data found');
    }

    // Update Happy bar
    if (happy) {
        console.log('Updating happy bar:', happy);
        updateProgressBar('happy', happy.current, happy.maximum);
    } else {
        console.warn('No happy data found');
    }

    // Update Money display - show wallet and faction money
    const walletElement = document.getElementById('walletValue');
    const factionElement = document.getElementById('factionValue');
    
    let walletValue = null;
    let factionValue = null;
    
    // Check if money object exists and has wallet and faction properties
    if (data.money && typeof data.money === 'object') {
        if (data.money.wallet !== undefined) {
            walletValue = data.money.wallet;
        }
        // Faction money is nested: data.money.faction.money
        if (data.money.faction && typeof data.money.faction === 'object' && data.money.faction.money !== undefined) {
            factionValue = data.money.faction.money;
        }
    }
    
    // Format value with dollar sign - always display 0 if value is 0
    const formatValue = (value) => {
        if (value !== null && typeof value === 'number' && !isNaN(value)) {
            return '$' + value.toLocaleString('en-US', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
        }
        return '-';
    };
    
    // Update wallet display
    if (walletElement) {
        walletElement.textContent = formatValue(walletValue);
    }
    
    // Update faction display - always show value even if 0
    if (factionElement) {
        if (factionValue !== null && typeof factionValue === 'number' && !isNaN(factionValue)) {
            // Display the value even if it's 0
            factionElement.textContent = formatValue(factionValue);
        } else {
            factionElement.textContent = '-';
        }
    }
    
    console.log('Money updated - Wallet:', walletValue, 'Faction:', factionValue, 'Faction object:', data.money?.faction);
    
    // Update Travel display with real data from API
    const travelLocationElement = document.getElementById('travelLocation');
    const travelDestinationElement = document.getElementById('travelDestination');
    const travelTimeRemainingElement = document.getElementById('travelTimeRemaining');
    
    const travelData = data.travel || null;
    
    // Format time remaining in seconds to readable format (e.g., "2h 15m" or "45m 30s")
    const formatTimeRemaining = (seconds) => {
        if (!seconds || seconds <= 0) return '-';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        let timeString = '';
        if (hours > 0) {
            timeString += hours + 'h ';
        }
        if (minutes > 0) {
            timeString += minutes + 'm ';
        }
        if (secs > 0 && hours === 0) {
            timeString += secs + 's';
        }
        
        return timeString.trim() || '-';
    };
    
    // Update current location
    if (travelLocationElement) {
        if (travelData && travelData.departing) {
            // If travelling, show where they're departing from
            travelLocationElement.textContent = travelData.departing;
        } else {
            // If not travelling or no travel data, they're in Torn City
            travelLocationElement.textContent = 'Torn City';
        }
    }
    
    // Update destination
    if (travelDestinationElement) {
        if (travelData && travelData.destination) {
            travelDestinationElement.textContent = travelData.destination;
        } else {
            travelDestinationElement.textContent = '-';
        }
    }
    
    // Update time remaining
    if (travelTimeRemainingElement) {
        if (travelData && travelData.time_left !== undefined) {
            travelTimeRemainingElement.textContent = formatTimeRemaining(travelData.time_left);
        } else if (travelData && travelData.timestamp) {
            // Calculate time remaining from timestamp if time_left is not available
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = Math.max(0, travelData.timestamp - now);
            travelTimeRemainingElement.textContent = formatTimeRemaining(timeLeft);
        } else {
            travelTimeRemainingElement.textContent = '-';
        }
    }
    
    console.log('Travel updated:', travelData);
}

// Update status display
function updateStatus(data) {
    const statusCard = document.getElementById('statusCard');
    const statusState = document.getElementById('statusState');
    const statusDescription = document.getElementById('statusDescription');
    const travelCountdown = document.getElementById('travelCountdown');
    
    if (!statusCard || !statusState || !statusDescription) return;
    
    // Debug: Log travel data to console
    if (data.travel) {
        console.log('Travel data received:', data.travel);
    }
    if (data.status) {
        console.log('Status data:', data.status);
    }
    
    // Stop any existing countdown
    stopTravelCountdown();
    
    if (data.status) {
        statusCard.classList.remove('hidden');
        
        // Format status state
        const state = data.status.state || 'Unknown';
        const description = data.status.description || '';
        const color = data.status.color || '#c0c0c0';
        
        statusState.textContent = state;
        statusState.style.color = color;
        
        if (description) {
            statusDescription.textContent = description;
            statusDescription.style.display = 'block';
        } else {
            statusDescription.style.display = 'none';
        }
        
        // Check if travelling and show countdown
        // Check for "travel" in status (handles "Travelling", "Traveling", etc.)
        const isTravelling = state.toLowerCase().includes('travel');
        
        if (isTravelling) {
            let timeLeft = null;
            
            // Try to get time from travel data (multiple possible formats)
            if (data.travel) {
                timeLeft = data.travel.time_left || data.travel.timeleft || data.travel.time_remaining || data.travel.timestamp;
                
                // If timestamp, calculate difference
                if (timeLeft && data.travel.timestamp) {
                    const travelEnd = data.travel.timestamp;
                    const now = Math.floor(Date.now() / 1000);
                    timeLeft = Math.max(0, travelEnd - now);
                }
            }
            
            // Fallback: Try to extract from status description
            if (!timeLeft && description) {
                // Look for time patterns in description like "X minutes", "X seconds", etc.
                const timeMatch = description.match(/(\d+)\s*(second|minute|hour|sec|min|hr)/i);
                if (timeMatch) {
                    const value = parseInt(timeMatch[1]);
                    const unit = timeMatch[2].toLowerCase();
                    if (unit.includes('hour') || unit.includes('hr')) {
                        timeLeft = value * 3600;
                    } else if (unit.includes('minute') || unit.includes('min')) {
                        timeLeft = value * 60;
                    } else if (unit.includes('second') || unit.includes('sec')) {
                        timeLeft = value;
                    }
                }
            }
            
            if (timeLeft && timeLeft > 0) {
                // Calculate end time (timeLeft is in seconds)
                travelEndTime = Date.now() + (timeLeft * 1000);
                
                // Show countdown and start timer
                if (travelCountdown) {
                    travelCountdown.classList.remove('hidden');
                    startTravelCountdown();
                }
            } else {
                // Hide if no valid time left
                if (travelCountdown) {
                    travelCountdown.classList.add('hidden');
                }
                travelEndTime = null;
            }
        } else {
            // Hide countdown if not travelling
            if (travelCountdown) {
                travelCountdown.classList.add('hidden');
            }
            travelEndTime = null;
        }
    } else {
        statusCard.classList.add('hidden');
        if (travelCountdown) {
            travelCountdown.classList.add('hidden');
        }
    }
}

// Start travel countdown timer
function startTravelCountdown() {
    stopTravelCountdown();
    
    if (!travelEndTime) return;
    
    // Update immediately
    updateTravelCountdown();
    
    // Update every second
    travelCountdownInterval = setInterval(() => {
        updateTravelCountdown();
    }, 1000);
}

// Stop travel countdown timer
function stopTravelCountdown() {
    if (travelCountdownInterval) {
        clearInterval(travelCountdownInterval);
        travelCountdownInterval = null;
    }
}

// Update travel countdown display
function updateTravelCountdown() {
    const countdownTime = document.getElementById('countdownTime');
    if (!countdownTime || !travelEndTime) return;
    
    const now = Date.now();
    const remaining = Math.max(0, travelEndTime - now);
    
    if (remaining <= 0) {
        countdownTime.textContent = '00:00:00';
        countdownTime.classList.add('countdown-expired');
        stopTravelCountdown();
        return;
    }
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    // Format as HH:MM:SS
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    countdownTime.textContent = formatted;
    countdownTime.classList.remove('countdown-expired');
}

// Update individual progress bar
function updateProgressBar(type, current, maximum) {
    const bar = document.getElementById(`${type}Bar`);
    const valueElement = document.getElementById(`${type}Value`);
    
    if (!bar || !valueElement) return;

    const percentage = maximum > 0 ? (current / maximum) * 100 : 0;
    
    // Add updating class for glow effect
    bar.classList.add('updating');
    setTimeout(() => bar.classList.remove('updating'), 500);

    // Update width with smooth transition
    bar.style.width = `${percentage}%`;
    bar.setAttribute('data-percentage', percentage.toFixed(1));

    // Update value text
    valueElement.textContent = `${current.toLocaleString()} / ${maximum.toLocaleString()}`;
}

// Start auto-refresh every 5 seconds
function startAutoRefresh() {
    // Clear any existing interval
    stopAutoRefresh();

    if (!currentUserId) return;

    refreshInterval = setInterval(async () => {
        if (!currentUserId) {
            stopAutoRefresh();
            return;
        }

        try {
            // Fetch both bars and status data
            const [barsData, statusData] = await Promise.all([
                fetchBarsData(currentUserId),
                fetchStatusData(currentUserId)
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
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    stopTravelCountdown();
}

// Display user information
function displayUserInfo(data) {
    const userInfoDiv = document.getElementById('userInfo');
    
    const formatValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return value;
    };

    const formatMoney = (value) => {
        if (typeof value === 'number') {
            return '$' + value.toLocaleString();
        }
        return formatValue(value);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleString();
    };

    let html = '<h2>User Information</h2>';
    html += '<div class="info-grid">';

    // Basic Information
    if (data.player_id) {
        html += createInfoItem('Player ID', data.player_id);
    }
    if (data.name) {
        html += createInfoItem('Name', data.name);
    }
    if (data.level) {
        html += createInfoItem('Level', data.level);
    }
    if (data.gender) {
        html += createInfoItem('Gender', data.gender);
    }
    if (data.faction) {
        // Display faction information
        if (data.faction) {
            if (typeof data.faction === 'object' && data.faction !== null) {
                // Build faction info string
                let factionInfo = '';
                if (data.faction.faction_name) {
                    factionInfo = data.faction.faction_name;
                } else if (data.faction.name) {
                    factionInfo = data.faction.name;
                } else {
                    factionInfo = 'Unknown Faction';
                }
                
                // Add faction ID if available
                const factionId = data.faction.faction_id || data.faction.id;
                if (factionId) {
                    factionInfo += ` (ID: ${factionId})`;
                }
                
                // Add position if available
                if (data.faction.position) {
                    factionInfo += ` - ${data.faction.position}`;
                }
                
                html += createInfoItem('Faction', factionInfo);
            } else if (typeof data.faction === 'number') {
                html += createInfoItem('Faction', `Faction ID: ${data.faction}`);
            } else {
                html += createInfoItem('Faction', String(data.faction));
            }
        } else {
            html += createInfoItem('Faction', 'None');
        }
    }
    if (data.company) {
        html += createInfoItem('Company', typeof data.company === 'object' ? data.company.company_name || 'N/A' : data.company);
    }

    // Status Information
    if (data.status) {
        html += createInfoItem('Status', data.status.state + (data.status.description ? ' - ' + data.status.description : ''));
    }
    if (data.last_action) {
        html += createInfoItem('Last Action', formatDate(data.last_action.timestamp));
    }

    // Money Information
    if (data.money) {
        html += createInfoItem('Money', formatMoney(data.money));
    }
    if (data.networth) {
        html += createInfoItem('Net Worth', formatMoney(data.networth));
    }

    // Stats - Check both top level and nested
    const stats = data.stats || {};
    if (data.strength || stats.strength) {
        html += createInfoItem('Strength', (data.strength || stats.strength || 0).toLocaleString());
    }
    if (data.defense || stats.defense) {
        html += createInfoItem('Defense', (data.defense || stats.defense || 0).toLocaleString());
    }
    if (data.speed || stats.speed) {
        html += createInfoItem('Speed', (data.speed || stats.speed || 0).toLocaleString());
    }
    if (data.dexterity || stats.dexterity) {
        html += createInfoItem('Dexterity', (data.dexterity || stats.dexterity || 0).toLocaleString());
    }

    // Note: Life, Energy, Nerve, and Happy are now displayed in the progress bars section above

    // Additional Information
    if (data.rank) {
        html += createInfoItem('Rank', data.rank);
    }
    if (data.property) {
        html += createInfoItem('Property', data.property);
    }
    if (data.signup) {
        html += createInfoItem('Signup Date', formatDate(data.signup));
    }
    if (data.awards) {
        html += createInfoItem('Awards', data.awards);
    }
    if (data.friends) {
        html += createInfoItem('Friends', data.friends);
    }
    if (data.enemies) {
        html += createInfoItem('Enemies', data.enemies);
    }
    if (data.forum_posts) {
        html += createInfoItem('Forum Posts', data.forum_posts);
    }
    if (data.karma) {
        html += createInfoItem('Karma', data.karma);
    }
    if (data.age) {
        html += createInfoItem('Age', data.age);
    }
    if (data.role) {
        html += createInfoItem('Role', data.role);
    }
    if (data.donator) {
        html += createInfoItem('Donator', data.donator ? 'Yes' : 'No');
    }
    if (data.player_id && data.player_id === data.id) {
        html += createInfoItem('User ID', data.id);
    }

    html += '</div>';
    userInfoDiv.innerHTML = html;
}

// Create info item HTML
function createInfoItem(label, value) {
    return `
        <div class="info-item">
            <div class="info-label">${label}</div>
            <div class="info-value">${value}</div>
        </div>
    `;
}

// Show error message
function showError(message) {
    const userInfoDiv = document.getElementById('userInfo');
    const progressSection = document.getElementById('progressBarsSection');
    progressSection.classList.add('hidden');
    userInfoDiv.classList.remove('hidden');
    userInfoDiv.innerHTML = `<div class="error-message">${message}</div>`;
    stopAutoRefresh();
    currentUserId = null;
}

// Fetch faction data from API
async function fetchFactionData(factionId, selections = 'basic,members') {
    if (!window.API_KEY) {
        throw new Error('API key is not configured. Please check config.js');
    }

    const url = `${API_BASE_URL}/faction/${factionId}?selections=${selections}&key=${window.API_KEY}`;
    console.log('Fetching faction data from URL:', url.replace(window.API_KEY, 'KEY_HIDDEN'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Faction API response status:', response.status);
    console.log('Faction API response data:', data);

    if (data.error) {
        console.error('Faction API Error:', data.error);
        throw new Error(data.error.error || 'API Error: ' + JSON.stringify(data.error));
    }

    return data;
}

// Fetch user location data
async function fetchUserLocation(userId) {
    try {
        const userData = await fetchUserData(userId, 'travel');
        const travelData = userData.travel || null;
        console.log(`Travel data for user ${userId}:`, travelData);
        if (travelData) {
            console.log(`  - destination: ${travelData.destination}`);
            console.log(`  - departing: ${travelData.departing}`);
            console.log(`  - time_left: ${travelData.time_left}`);
            console.log(`  - timestamp: ${travelData.timestamp}`);
        }
        return travelData;
    } catch (error) {
        console.error(`Error fetching location for user ${userId}:`, error);
        return null;
    }
}

// Initialize world map with Leaflet
async function initializeFactionMap() {
    if (mapInitInProgress) {
        return;
    }
    
    const mapContainer = document.getElementById('worldMap');
    
    if (!mapContainer) {
        console.error('World map container not found');
        return;
    }
    
    if (!worldMap) {
        mapInitInProgress = true;
        
        try {
            // Wait a bit for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if Leaflet is loaded
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }
            
            // Initialize Leaflet map with dark theme
            worldMap = L.map('worldMap', {
                center: [0, 0],
                zoom: 2,
                zoomControl: false,
                attributionControl: false,
                minZoom: 2,
                maxZoom: 2,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false
            });
            
            // Add dark theme tile layer (CartoDB Dark Matter)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(worldMap);
            
            // Disable all zoom interactions
            worldMap.touchZoom.disable();
            worldMap.doubleClickZoom.disable();
            worldMap.scrollWheelZoom.disable();
            worldMap.boxZoom.disable();
            worldMap.keyboard.disable();
            
            // Wait for map to be ready, then invalidate size
            worldMap.whenReady(() => {
                setTimeout(() => {
                    if (worldMap) {
                        worldMap.invalidateSize();
                    }
                }, 100);
            });
            
            // Add Torn city markers
            addTornCityMarkers();
            
            // Add dashed lines from Torn to other cities
            addTornCityLines();
            
            mapInitRetryCount = 0;
            mapInitInProgress = false;
            
            console.log('World map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
            mapInitRetryCount = 0;
            mapInitInProgress = false;
        }
    } else {
        // Map already exists, just invalidate size
        if (worldMap) {
            setTimeout(() => {
                worldMap.invalidateSize();
            }, 100);
        }
    }
}

// Add Torn city markers to the map with flashing animation
function addTornCityMarkers() {
    if (!worldMap) return;
    
    // Clear existing markers
    tornCityMarkers.forEach(marker => worldMap.removeLayer(marker));
    tornCityMarkers = [];
    
    // Clear existing lines
    tornCityLines.forEach(line => worldMap.removeLayer(line));
    tornCityLines = [];
    
    // Remove duplicates
    const uniqueCities = [];
    const seenCoords = new Set();
    
    tornCities.forEach(city => {
        const key = `${city.coords[0]},${city.coords[1]}`;
        if (!seenCoords.has(key)) {
            seenCoords.add(key);
            uniqueCities.push(city);
        }
    });
    
    // Create custom gold icon with flashing animation
    uniqueCities.forEach((city, index) => {
        const goldIcon = L.divIcon({
            className: 'torn-city-marker',
            html: `
                <div class="marker-pulse" style="animation-delay: ${index * 0.1}s;">
                    <div class="marker-glow"></div>
                    <div class="marker-core"></div>
                </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        const marker = L.marker(city.coords, { icon: goldIcon })
            .addTo(worldMap)
            .bindPopup(`<strong>${city.name}</strong><br>Torn Travel Destination`);
        
        tornCityMarkers.push(marker);
    });
}

// Add dashed lines from Torn to all other cities
function addTornCityLines() {
    if (!worldMap) return;
    
    // Find Torn's coordinates
    const tornCity = tornCities.find(city => city.name === 'Torn');
    if (!tornCity) return;
    
    const tornCoords = tornCity.coords;
    
    // Draw lines from Torn to all other cities
    tornCities.forEach(city => {
        // Skip Torn itself
        if (city.name === 'Torn') return;
        
        // Create dashed polyline from Torn to this city
        const line = L.polyline([tornCoords, city.coords], {
            color: '#d4af37',
            weight: 2,
            opacity: 0.6,
            dashArray: '10, 10',
            interactive: false
        }).addTo(worldMap);
        
        tornCityLines.push(line);
    });
}

// Load faction members and display on map
async function loadFactionMembers() {
    console.log('=== loadFactionMembers() CALLED ===');
    console.log('currentFactionId:', currentFactionId);
    
    const mapLoading = document.getElementById('mapLoading');
    const mapError = document.getElementById('mapError');
    
    // Always hide loading after a short delay to show the map
    if (mapLoading) {
        setTimeout(() => {
            mapLoading.classList.add('hidden');
        }, 1000);
    }
    
    // Check if we have a faction ID
    if (!currentFactionId) {
        console.log('No currentFactionId, returning early');
        if (mapError) {
            mapError.classList.remove('hidden');
            mapError.textContent = 'No faction found. Please search for a user who is in a faction.';
        }
        // Map is still visible, just no markers
        return;
    }
    
    try {
        console.log('=== Starting to fetch faction members ===');
        console.log('Loading faction members for faction ID:', currentFactionId);
        
        // Fetch faction members - try with both 'members' and 'basic,members' selections
        const factionData = await fetchFactionData(currentFactionId, 'basic,members');
        console.log('Faction data received:', factionData);
        console.log('Faction data keys:', Object.keys(factionData));
        console.log('Members property exists:', 'members' in factionData);
        console.log('Members value:', factionData.members);
        
        if (!factionData.members) {
            console.error('No members property in faction data:', factionData);
            console.error('Available keys:', Object.keys(factionData));
            throw new Error('No members found in faction data');
        }
        
        // Clear existing markers if map is initialized
        if (worldMap) {
            factionMarkers.forEach(marker => worldMap.removeLayer(marker));
            factionMarkers = [];
            // Stop updates when clearing markers
            stopWorldMapUpdates();
        }
        
        // Handle different response formats (object with IDs as keys, or array)
        let membersToProcess = [];
        
        console.log('Faction members data type:', typeof factionData.members, 'Is array:', Array.isArray(factionData.members));
        console.log('Faction members sample:', factionData.members);
        
        if (Array.isArray(factionData.members)) {
            // If members is an array
            membersToProcess = factionData.members.map((member, index) => ({
                id: member.id || member.user_id || index.toString(),
                data: member
            }));
        } else if (typeof factionData.members === 'object' && factionData.members !== null) {
            // If members is an object with IDs as keys
            const memberIds = Object.keys(factionData.members);
            console.log('Member IDs found:', memberIds.length, 'Sample IDs:', memberIds.slice(0, 5));
            console.log('Sample member data:', memberIds.length > 0 ? factionData.members[memberIds[0]] : 'none');
            
            if (memberIds.length === 0) {
                console.warn('Members object is empty!');
            }
            
            membersToProcess = memberIds.map(memberId => {
                const memberData = factionData.members[memberId];
                console.log(`Processing member ID ${memberId}, data:`, memberData, 'type:', typeof memberData);
                return {
                    id: memberId,
                    data: memberData
                };
            });
        } else {
            console.error('Unexpected members format:', typeof factionData.members, factionData.members);
            throw new Error('Unexpected members data format: ' + typeof factionData.members);
        }
        
        console.log('Members to process:', membersToProcess.length);
        if (membersToProcess.length > 0) {
            console.log('First member sample:', membersToProcess[0]);
        }
        
        if (membersToProcess.length === 0) {
            console.error('No members to process!');
            throw new Error('No members found in faction');
        }
        
        console.log('Processing', membersToProcess.length, 'members...');
        
        // Store member data for display
        factionMembersData = [];
        
        membersToProcess.forEach(({ id, data: memberData }) => {
            console.log('Processing member:', id, memberData, 'Type:', typeof memberData);
            
            // Handle different API response formats
            let memberName = `Member ${id}`;
            let memberStatus = 'Unknown';
            
            // Torn API might return member data as just a user ID (number) or as an object
            if (typeof memberData === 'object' && memberData !== null) {
                // If it's an object, try to extract name from various possible fields
                memberName = memberData.name || 
                            memberData.player_name || 
                            memberData.username || 
                            memberData.player_id || 
                            (memberData.id ? `User ${memberData.id}` : null) ||
                            memberName;
                if (memberData.status) {
                    memberStatus = typeof memberData.status === 'object' 
                        ? (memberData.status.state || memberData.status.description || memberData.status || 'Unknown')
                        : memberData.status;
                }
            } else if (typeof memberData === 'string') {
                memberName = memberData;
            } else if (typeof memberData === 'number') {
                // If memberData is just a number (user ID), use it as the name for now
                // We'll try to fetch the actual name later if needed
                memberName = `User ${memberData}`;
            }
            
            // Use the member ID as name if we still don't have a proper name
            if (memberName === `Member ${id}` && id) {
                memberName = `User ${id}`;
            }
            
            // Store member data for list display
            factionMembersData.push({
                id: id,
                name: memberName,
                status: memberStatus,
                location: 'Torn City', // Default location
                profile: null // Will be fetched later
            });
        });
        
        console.log('Faction members data after processing:', factionMembersData);
        console.log('Number of members in factionMembersData:', factionMembersData.length);
        
        if (factionMembersData.length === 0) {
            console.warn('WARNING: No members in factionMembersData but display was called anyway');
        }
        
        // Check if we need to fetch user names (if members only have IDs)
        const needsNameFetch = factionMembersData.some(m => {
            const name = m.name || '';
            return name.startsWith('User ') || name.startsWith('Member ');
        });
        
        if (needsNameFetch && factionMembersData.length > 0) {
            console.log('Some members need name fetching, fetching user data...');
            // Fetch user names in batches
            const nameBatchSize = 3; // Smaller batch for name fetching
            for (let i = 0; i < factionMembersData.length; i += nameBatchSize) {
                const batch = factionMembersData.slice(i, i + nameBatchSize);
                const namePromises = batch.map(async (member) => {
                    const name = member.name || '';
                    if (name.startsWith('User ') || name.startsWith('Member ')) {
                        try {
                            // Add delay between batches
                            if (i > 0) {
                                await new Promise(resolve => setTimeout(resolve, 300));
                            }
                            const userData = await fetchUserData(member.id, 'basic');
                            const userName = userData.name || userData.player_name || member.name;
                            member.name = userName;
                            console.log(`Fetched name for ${member.id}: ${userName}`);
                        } catch (error) {
                            console.error(`Error fetching name for user ${member.id}:`, error);
                            // Keep the placeholder name
                        }
                    }
                });
                await Promise.all(namePromises);
            }
            console.log('Finished fetching user names');
        }
        
        // Fetch locations for all members in parallel (with rate limiting) for map markers and table
        // Always fetch locations, not just when map is initialized
        try {
            const locationPromises = [];
            const batchSize = 5; // Process 5 members at a time to avoid rate limits
            
            for (let i = 0; i < membersToProcess.length; i += batchSize) {
                const batch = membersToProcess.slice(i, i + batchSize);
                const batchPromises = batch.map(async ({ id: memberId, data: memberData }) => {
                    try {
                        // Add small delay between batches
                        if (i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                        const location = await fetchUserLocation(memberId);
                        return { memberId, memberData, location };
                    } catch (error) {
                        console.error(`Error fetching location for member ${memberId}:`, error);
                        return { memberId, memberData, location: null };
                    }
                });
                locationPromises.push(...batchPromises);
            }
            
            const memberLocations = await Promise.all(locationPromises);
        
        // Update member data with locations and add map markers
        let markersAdded = 0;
        memberLocations.forEach(({ memberId, memberData, location }) => {
            console.log(`Processing travel data for member ${memberId}:`, location);
            
            let currentLocation = null;
            let destination = null;
            let isTravelling = false;
            let travelTimeLeft = null;
            
            // Check if member has travel data
            if (location) {
                // API v2 travel data structure
                // location.destination - where they're heading
                // location.departing - where they're departing from
                // location.timestamp - when travel ends
                // location.time_left - time remaining in travel
                
                if (location.destination) {
                    destination = location.destination;
                    isTravelling = true;
                    currentLocation = location.departing || 'Torn City';
                    travelTimeLeft = location.time_left || location.timeleft || null;
                    console.log(`Member ${memberId} is travelling from ${currentLocation} to ${destination}`);
                } else if (location.departing) {
                    // Member is departing from a location (might be in transit)
                    currentLocation = location.departing;
                    destination = null;
                    console.log(`Member ${memberId} is departing from ${currentLocation}`);
                } else {
                    // No travel data, they're in Torn City
                    currentLocation = 'Torn City';
                    destination = null;
                }
            } else {
                // No travel data, assume member is in Torn City
                currentLocation = 'Torn City';
                destination = null;
            }
            
            const memberName = memberData.name || `Member ${memberId}`;
            const memberStatus = memberData.status ? memberData.status.state : 'Unknown';
            
            // Build location text - show destination if travelling, otherwise current location
            let locationText = currentLocation || 'Torn City';
            if (isTravelling && destination) {
                locationText = `→ ${destination}`; // Arrow indicates travelling to destination
            }
            
            // Update member data with location and travel info
            const memberIndex = factionMembersData.findIndex(m => String(m.id) === String(memberId));
            if (memberIndex !== -1) {
                factionMembersData[memberIndex].location = locationText;
                factionMembersData[memberIndex].currentLocation = currentLocation;
                factionMembersData[memberIndex].destination = destination;
                factionMembersData[memberIndex].isTravelling = isTravelling;
                factionMembersData[memberIndex].travelTimeLeft = travelTimeLeft;
                console.log(`Updated location for member ${memberId}: ${locationText} (travelling: ${isTravelling})`);
            } else {
                console.warn(`Could not find member ${memberId} in factionMembersData to update location`);
            }
            
            // Get coordinates for the destination and add map marker (only if map is initialized)
            // Use destination if travelling, otherwise use current location
            const locationForMap = isTravelling && destination ? destination : currentLocation;
            if (worldMap) {
                const coordinates = getCityCoordinates(locationForMap);
                
                if (coordinates) {
                    // Create custom icon with dot and text label
                    const customIcon = L.divIcon({
                        className: 'faction-member-marker',
                        html: `
                            <div class="marker-container">
                                <div class="marker-dot"></div>
                                <div class="marker-label">${memberName}</div>
                            </div>
                        `,
                        iconSize: [100, 30],
                        iconAnchor: [50, 15]
                    });
                    
                    const marker = L.marker(coordinates, { icon: customIcon })
                        .addTo(worldMap)
                        .bindPopup(`
                            <div class="marker-popup">
                                <strong>${memberName}</strong><br>
                                <span>Status: ${memberStatus}</span><br>
                                <span>Location: ${locationText}</span>
                            </div>
                        `);
                    
                    // Store member ID with marker for reference
                    marker.memberId = memberId;
                    factionMarkers.push(marker);
                    markersAdded++;
                }
            }
        });
        
        // Fetch travel information for each user marker and display raw output
        await fetchAndDisplayTravelDataForMarkers();
        
        // Keep map at world view - don't auto-zoom to markers
            
            // Now fetch profile data for all members
            console.log('=== Fetching profile data for all members ===');
            const profileBatchSize = 3; // Smaller batch for profile fetching
            for (let i = 0; i < factionMembersData.length; i += profileBatchSize) {
                const batch = factionMembersData.slice(i, i + profileBatchSize);
                const profilePromises = batch.map(async (member) => {
                    try {
                        // Add delay between batches
                        if (i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 400));
                        }
                        console.log(`Fetching profile for member ${member.id}...`);
                        const profileData = await fetchUserData(member.id, 'basic,profile,travel');
                        member.profile = {
                            level: profileData.level,
                            status: profileData.status,
                            travel: profileData.travel || null,
                            // Add more profile fields as needed
                        };
                        console.log(`✓ Profile fetched for ${member.id}: Level ${profileData.level || 'N/A'}`);
                        if (profileData.travel) {
                            console.log(`  Travel data:`, profileData.travel);
                        }
                    } catch (error) {
                        // Handle permission errors gracefully - don't log as error if it's a permission issue
                        if (error.message && error.message.includes('Permission denied')) {
                            console.warn(`Permission denied for user ${member.id}: API key may not have access to this user's data`);
                        } else {
                            console.error(`Error fetching profile for user ${member.id}:`, error);
                        }
                        member.profile = { 
                            error: true,
                            travel: null // Mark travel as checked (null means no travel or error)
                        };
                    }
                });
                await Promise.all(profilePromises);
            }
            console.log('Finished fetching all profiles');
            
        } catch (locationError) {
            console.error('Error fetching locations:', locationError);
        }
        
        if (mapLoading) mapLoading.classList.add('hidden');
        if (mapError) mapError.classList.add('hidden');
        
    } catch (error) {
        console.error('Error loading faction members:', error);
        console.error('Error stack:', error.stack);
        if (mapLoading) mapLoading.classList.add('hidden');
        if (mapError) {
            mapError.classList.remove('hidden');
            mapError.textContent = `Error loading faction members: ${error.message}`;
        }
    }
}

// Map Torn city names to coordinates (only actual travelable destinations)
function getCityCoordinates(cityName) {
    if (!cityName) return null;
    
    // Torn travelable city coordinates
    const cityCoordinates = {
        'Torn': [39.0997, -94.5786], // Kansas City, United States
        'United Kingdom': [51.5074, -0.1278], // London
        'UK': [51.5074, -0.1278],
        'Mexico': [31.6904, -106.4244], // Ciudad Juárez
        'Cayman Islands': [19.3133, -81.2546], // George Town
        'Canada': [43.6532, -79.3832], // Toronto
        'Hawaii': [21.3099, -157.8581], // Honolulu
        'Switzerland': [47.3769, 8.5417], // Zurich
        'Argentina': [-34.6037, -58.3816], // Buenos Aires
        'Japan': [35.6762, 139.6503], // Tokyo
        'China': [39.9042, 116.4074], // Beijing
        'UAE': [25.2048, 55.2708], // Dubai
        'United Arab Emirates': [25.2048, 55.2708],
        'South Africa': [-26.2041, 28.0473] // Johannesburg
    };
    
    // Try exact match first
    if (cityCoordinates[cityName]) {
        return cityCoordinates[cityName];
    }
    
    // Try case-insensitive match
    const cityNameLower = cityName.toLowerCase().trim();
    for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (city.toLowerCase() === cityNameLower) {
            return coords;
        }
    }
    
    // Try partial match
    for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (cityNameLower.includes(city.toLowerCase()) || city.toLowerCase().includes(cityNameLower)) {
            return coords;
        }
    }
    
    // Return null if city not found
    return null;
}

// Fetch user profile data from v2 API endpoint /user/<id>/profile
async function fetchUserProfile(userId) {
    // Check if API key is configured
    if (!window.API_KEY) {
        throw new Error('API key is not configured. Please check config.js');
    }

    // Validate userId is numeric
    if (!userId || (typeof userId !== 'number' && !/^\d+$/.test(String(userId)))) {
        throw new Error(`Invalid user ID: ${userId}. User ID must be a number.`);
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === 'number' ? userId : parseInt(userId, 10);
    if (isNaN(numericUserId)) {
        throw new Error(`Invalid user ID: ${userId}. Could not convert to number.`);
    }

    // Use v2 API endpoint /user/<id>/profile
    const url = `${API_BASE_URL}/user/${numericUserId}/profile?key=${window.API_KEY}`;
    console.log('Fetching user profile from URL:', url.replace(window.API_KEY, 'KEY_HIDDEN'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API response status:', response.status);
    console.log('API response data:', data);

    if (data.error) {
        const errorMessage = data.error.error || JSON.stringify(data.error);
        console.error('API Error:', data.error);
        
        // Handle specific "Incorrect ID-entity relation" error more gracefully
        if (errorMessage.includes('Incorrect ID-entity relation') || errorMessage.includes('ID-entity')) {
            throw new Error(`Permission denied: API key does not have access to user ${numericUserId}. This may be due to insufficient API key permissions.`);
        }
        
        throw new Error(errorMessage);
    }

    return data;
}

// Update marker positions based on profile data (without updating display)
async function updateMarkerPositions() {
    if (!worldMap || factionMarkers.length === 0) {
        return;
    }
    
    console.log('Updating marker positions...');
    
    // Get all users that have markers
    const usersWithMarkers = factionMembersData.filter(member => {
        return member.location || member.currentLocation || member.destination;
    });
    
    if (usersWithMarkers.length === 0) {
        return;
    }
    
    // Update each marker's position based on profile data
    for (const member of usersWithMarkers) {
        try {
            const userId = member.id;
            const userName = member.name || `User ${userId}`;
            
            // Fetch profile data
            const profileData = await fetchUserProfile(userId);
            
            // Extract description from profile.user.description
            const userDescription = profileData.profile && profileData.profile.user && profileData.profile.user.description ? profileData.profile.user.description : null;
            const status = profileData.profile && profileData.profile.status ? profileData.profile.status : null;
            
            // Use profile.user.description as the primary source
            let description = userDescription || (status && status.description ? status.description : null);
            
            // Check if description starts with "Traveling to" and extract destination
            let destination = null;
            if (description && description.trim().toLowerCase().startsWith('traveling to')) {
                // Remove "Traveling to" prefix and trim
                destination = description.replace(/^Traveling to\s+/i, '').trim();
                
                // Update marker position if we have a valid destination
                if (destination) {
                    const destinationCoords = getCityCoordinates(destination);
                    if (destinationCoords) {
                        // Find the marker for this user
                        const userMarker = factionMarkers.find(marker => marker.memberId === userId);
                        if (userMarker) {
                            const currentLatLng = userMarker.getLatLng();
                            const distance = Math.abs(currentLatLng.lat - destinationCoords[0]) + Math.abs(currentLatLng.lng - destinationCoords[1]);
                            // Only update if position has changed significantly
                            if (distance > 0.01) {
                                console.log(`Updating marker for user ${userId} (${userName}) to ${destination}`);
                                userMarker.setLatLng(destinationCoords);
                            }
                        }
                    }
                }
            } else {
                // If not traveling, they should be in Torn City
                const tornCoords = getCityCoordinates('Torn');
                if (tornCoords) {
                    const userMarker = factionMarkers.find(marker => marker.memberId === userId);
                    if (userMarker) {
                        // Only update if not already at Torn
                        const currentLatLng = userMarker.getLatLng();
                        const distance = Math.abs(currentLatLng.lat - tornCoords[0]) + Math.abs(currentLatLng.lng - tornCoords[1]);
                        if (distance > 0.01) { // If not already at Torn (with some tolerance)
                            console.log(`Updating marker for user ${userId} (${userName}) to Torn City (not traveling)`);
                            userMarker.setLatLng(tornCoords);
                        }
                    }
                }
            }
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`Error updating marker position for user ${member.id}:`, error);
        }
    }
    
    console.log('Marker positions updated');
}

// Start automatic updates for world map markers
function startWorldMapUpdates() {
    // Clear any existing interval
    if (worldMapUpdateInterval) {
        clearInterval(worldMapUpdateInterval);
    }
    
    // Update immediately
    updateMarkerPositions();
    
    // Then update every 15 seconds
    worldMapUpdateInterval = setInterval(() => {
        updateMarkerPositions();
    }, 15000);
    
    console.log('World map auto-update started (every 15 seconds)');
}

// Stop automatic updates for world map markers
function stopWorldMapUpdates() {
    if (worldMapUpdateInterval) {
        clearInterval(worldMapUpdateInterval);
        worldMapUpdateInterval = null;
        console.log('World map auto-update stopped');
    }
}

// Fetch and display profile data for all user markers
async function fetchAndDisplayTravelDataForMarkers() {
    const travelDataContent = document.getElementById('travelDataContent');
    if (!travelDataContent) {
        console.error('Travel data content element not found');
        return;
    }
    
    // Clear existing content
    travelDataContent.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">Fetching profile information for users...</p>';
    
    // Get all users that have markers (members with location data have markers)
    const usersWithMarkers = factionMembersData.filter(member => {
        // Members with location data have markers on the map
        return member.location || member.currentLocation || member.destination;
    });
    
    if (usersWithMarkers.length === 0) {
        travelDataContent.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">No user markers found on the map.</p>';
        return;
    }
    
    let html = '';
    
    // Fetch profile data for each user using /user/<id>/profile endpoint
    for (const member of usersWithMarkers) {
        try {
            const userId = member.id;
            const userName = member.name || `User ${userId}`;
            
            console.log(`Fetching profile data for user ${userId} (${userName})...`);
            const profileData = await fetchUserProfile(userId);
            
            // Extract description from profile.user.description (as specified by user)
            const userDescription = profileData.profile && profileData.profile.user && profileData.profile.user.description ? profileData.profile.user.description : null;
            const status = profileData.profile && profileData.profile.status ? profileData.profile.status : null;
            const statusColor = status ? (status.color || '#c0c0c0') : '#c0c0c0';
            
            console.log('Profile data structure:', profileData);
            console.log('User description:', userDescription);
            console.log('Status data:', status);
            
            // Use profile.user.description as the primary source
            let description = userDescription || (status && status.description ? status.description : 'No status');
            let displayDescription = description;
            
            // Check if description starts with "Traveling to" and extract destination
            let destination = null;
            if (description && description.trim().toLowerCase().startsWith('traveling to')) {
                // Remove "Traveling to" prefix and trim
                destination = description.replace(/^Traveling to\s+/i, '').trim();
                displayDescription = destination; // Display just the destination
                
                console.log(`User ${userId} is traveling to: ${destination}`);
                
                // Update marker position if we have a valid destination
                if (worldMap && destination) {
                    const destinationCoords = getCityCoordinates(destination);
                    if (destinationCoords) {
                        // Find the marker for this user
                        const userMarker = factionMarkers.find(marker => marker.memberId === userId);
                        if (userMarker) {
                            console.log(`Moving marker for user ${userId} (${userName}) to ${destination} at coordinates:`, destinationCoords);
                            userMarker.setLatLng(destinationCoords);
                        } else {
                            console.warn(`Marker not found for user ${userId}`);
                        }
                    } else {
                        console.warn(`Coordinates not found for destination: ${destination}`);
                    }
                }
            }
            
            // Display status prominently, with other data collapsed
            html += `<div class="travel-data-item">`;
            html += `<div class="travel-data-header">`;
            html += `<strong style="color: #d4af37;">${userName}</strong> (ID: ${userId})`;
            html += `</div>`;
            
            // Status display (always visible) - showing only description (or destination if traveling)
            html += `<div class="status-display">`;
            html += `<div class="status-label">Status:</div>`;
            html += `<div class="status-value" style="color: ${statusColor};">${displayDescription}</div>`;
            html += `</div>`;
            
            // Collapsible section for all other data
            html += `<details class="profile-details">`;
            html += `<summary class="profile-summary">Show all profile data</summary>`;
            html += `<pre class="travel-data-json">${JSON.stringify(profileData, null, 2)}</pre>`;
            html += `</details>`;
            
            html += `</div>`;
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            const userId = member.id;
            const userName = member.name || `User ${userId}`;
            
            html += `<div class="travel-data-item">`;
            html += `<div class="travel-data-header">`;
            html += `<strong style="color: #d4af37;">${userName}</strong> (ID: ${userId})`;
            html += `</div>`;
            html += `<pre class="travel-data-json error">Error: ${error.message}</pre>`;
            html += `</div>`;
            
            console.error(`Error fetching profile data for user ${userId}:`, error);
        }
    }
    
    if (html === '') {
        travelDataContent.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">No profile data available.</p>';
    } else {
        travelDataContent.innerHTML = html;
    }
}

// Display faction members in a table

