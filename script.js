// API configuration
const API_BASE_URL = 'https://api.torn.com';

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
let factionMarkers = [];
let mapInitRetryCount = 0;
let mapInitInProgress = false;
const MAX_MAP_INIT_RETRIES = 10;

// Torn travel cities with coordinates
const tornCities = [
    { name: 'Torn', coords: [51.5074, -0.1278] },
    { name: 'United Kingdom', coords: [51.5074, -0.1278] },
    { name: 'Mexico', coords: [19.4326, -99.1332] },
    { name: 'Cayman Islands', coords: [19.3133, -81.2546] },
    { name: 'Canada', coords: [45.5017, -73.5673] },
    { name: 'Hawaii', coords: [21.3099, -157.8581] },
    { name: 'United States', coords: [40.7128, -74.0060] },
    { name: 'Argentina', coords: [-34.6037, -58.3816] },
    { name: 'Switzerland', coords: [46.2044, 6.1432] },
    { name: 'Japan', coords: [35.6762, 139.6503] },
    { name: 'China', coords: [39.9042, 116.4074] },
    { name: 'UAE', coords: [25.2048, 55.2708] },
    { name: 'South Africa', coords: [-26.2041, 28.0473] },
    { name: 'New Zealand', coords: [-36.8485, 174.7633] },
    { name: 'Iceland', coords: [64.1466, -21.9426] },
    { name: 'Brazil', coords: [-23.5505, -46.6333] },
    { name: 'Australia', coords: [-33.8688, 151.2093] },
    { name: 'Russia', coords: [55.7558, 37.6173] },
    { name: 'India', coords: [28.6139, 77.2090] },
    { name: 'France', coords: [48.8566, 2.3522] },
    { name: 'Germany', coords: [52.5200, 13.4050] },
    { name: 'Italy', coords: [41.9028, 12.4964] },
    { name: 'Spain', coords: [40.4168, -3.7038] },
    { name: 'Netherlands', coords: [52.3676, 4.9041] },
    { name: 'Belgium', coords: [50.8503, 4.3517] },
    { name: 'Sweden', coords: [59.3293, 18.0686] },
    { name: 'Norway', coords: [59.9139, 10.7522] },
    { name: 'Denmark', coords: [55.6761, 12.5683] },
    { name: 'Finland', coords: [60.1699, 24.9384] },
    { name: 'Poland', coords: [52.2297, 21.0122] },
    { name: 'Turkey', coords: [41.0082, 28.9784] },
    { name: 'Egypt', coords: [30.0444, 31.2357] },
    { name: 'Saudi Arabia', coords: [24.7136, 46.6753] },
    { name: 'Singapore', coords: [1.3521, 103.8198] },
    { name: 'Thailand', coords: [13.7563, 100.5018] },
    { name: 'South Korea', coords: [37.5665, 126.9780] },
    { name: 'Philippines', coords: [14.5995, 120.9842] },
    { name: 'Indonesia', coords: [-6.2088, 106.8456] },
    { name: 'Malaysia', coords: [3.1390, 101.6869] },
    { name: 'Vietnam', coords: [10.8231, 106.6297] },
    { name: 'Taiwan', coords: [25.0330, 121.5654] },
    { name: 'Hong Kong', coords: [22.3193, 114.1694] }
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
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            
            if (targetTab === 'search') {
                document.getElementById('searchTab').classList.add('active');
            } else if (targetTab === 'player-info') {
                document.getElementById('playerInfoTab').classList.add('active');
            } else if (targetTab === 'faction-map') {
                const factionMapTab = document.getElementById('factionMapTab');
                factionMapTab.classList.add('active');
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
    const searchBtn = document.getElementById('searchBtn');
    const userIdInput = document.getElementById('userIdInput');

    searchBtn.addEventListener('click', handleSearch);
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Handle search
async function handleSearch() {
    const userIdInput = document.getElementById('userIdInput');
    const userId = userIdInput.value.trim();
    const userInfoDiv = document.getElementById('userInfo');

    if (!userId) {
        showError('Please enter a user ID');
        return;
    }

    if (!/^\d+$/.test(userId)) {
        showError('User ID must be a number');
        return;
    }

    // Show loading state
    userInfoDiv.classList.remove('hidden');
    userInfoDiv.innerHTML = '<div class="loading">Loading user information...</div>';

    try {
        const userData = await fetchUserData(userId);
        currentUserId = userId;
        
        // Store faction ID if available
        if (userData.faction) {
            if (typeof userData.faction === 'object' && userData.faction.faction_id) {
                currentFactionId = userData.faction.faction_id;
            } else if (typeof userData.faction === 'number') {
                currentFactionId = userData.faction;
            }
        }
        
        displayUserInfo(userData);
        updateProgressBars(userData);
        updateStatus(userData);
        startAutoRefresh();
        
        // Switch to Player Info tab after successful search
        const playerInfoTabButton = document.querySelector('[data-tab="player-info"]');
        if (playerInfoTabButton) {
            playerInfoTabButton.click();
        }
    } catch (error) {
        showError(error.message || 'Failed to fetch user information. Please check the user ID and try again.');
        stopAutoRefresh();
    }
}

// Fetch user data from API
async function fetchUserData(userId, selections = 'basic,profile,personalstats,battlestats,education,workstats,icons,cooldowns,money,notifications,perks,bars,networth,display,travel') {
    // Check if API key is configured
    if (!window.API_KEY) {
        throw new Error('API key is not configured. Please check config.js');
    }

    const url = `${API_BASE_URL}/user/${userId}?selections=${selections}&key=${window.API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.error || 'API Error: ' + JSON.stringify(data.error));
    }

    return data;
}

// Fetch only bars data for quick refresh
async function fetchBarsData(userId) {
    return await fetchUserData(userId, 'bars');
}

// Fetch status data for quick refresh (includes travel)
async function fetchStatusData(userId) {
    return await fetchUserData(userId, 'basic,travel');
}

// Update progress bars
function updateProgressBars(data) {
    const progressSection = document.getElementById('progressBarsSection');
    progressSection.classList.remove('hidden');

    // Update Life bar
    if (data.life) {
        updateProgressBar('life', data.life.current, data.life.maximum);
    }

    // Update Energy bar
    if (data.energy) {
        updateProgressBar('energy', data.energy.current, data.energy.maximum);
    }

    // Update Nerve bar
    if (data.nerve) {
        updateProgressBar('nerve', data.nerve.current, data.nerve.maximum);
    }

    // Update Happy bar
    if (data.happy) {
        updateProgressBar('happy', data.happy.current, data.happy.maximum);
    }
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
        html += createInfoItem('Faction', typeof data.faction === 'object' ? data.faction.faction_name || 'N/A' : data.faction);
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
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.error || 'API Error: ' + JSON.stringify(data.error));
    }

    return data;
}

// Fetch user location data
async function fetchUserLocation(userId) {
    try {
        const userData = await fetchUserData(userId, 'travel');
        return userData.travel || null;
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
                center: [20, 0],
                zoom: 2,
                zoomControl: true,
                attributionControl: true,
                minZoom: 1,
                maxZoom: 10
            });
            
            // Add dark theme tile layer (CartoDB Dark Matter)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(worldMap);
            
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

// Load faction members and display on map
async function loadFactionMembers() {
    const mapLoading = document.getElementById('mapLoading');
    const mapError = document.getElementById('mapError');
    
    // Always hide loading after a short delay to show the map
    setTimeout(() => {
        if (mapLoading) mapLoading.classList.add('hidden');
    }, 1000);
    
    // Check if we have a faction ID
    if (!currentFactionId) {
        if (mapError) {
            mapError.classList.remove('hidden');
            mapError.textContent = 'No faction found. Please search for a user who is in a faction.';
        }
        // Map is still visible, just no markers
        return;
    }
    
    if (!worldMap) {
        console.error('Map not initialized');
        if (mapLoading) mapLoading.classList.add('hidden');
        if (mapError) {
            mapError.classList.remove('hidden');
            mapError.textContent = 'Error: Map failed to initialize.';
        }
        return;
    }
    
    try {
        // Fetch faction members
        const factionData = await fetchFactionData(currentFactionId, 'members');
        
        if (!factionData.members) {
            throw new Error('No members found in faction data');
        }
        
        // Clear existing markers
        factionMarkers.forEach(marker => worldMap.removeLayer(marker));
        factionMarkers = [];
        
        // Get all member IDs
        const memberIds = Object.keys(factionData.members);
        
        if (memberIds.length === 0) {
            throw new Error('No members found in faction');
        }
        
        // Fetch locations for all members in parallel (with rate limiting)
        const locationPromises = [];
        const batchSize = 5; // Process 5 members at a time to avoid rate limits
        
        for (let i = 0; i < memberIds.length; i += batchSize) {
            const batch = memberIds.slice(i, i + batchSize);
            const batchPromises = batch.map(async (memberId) => {
                // Add small delay between batches
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                const location = await fetchUserLocation(memberId);
                return { memberId, memberData: factionData.members[memberId], location };
            });
            locationPromises.push(...batchPromises);
        }
        
        const memberLocations = await Promise.all(locationPromises);
        
        // Add markers for members with valid locations
        let markersAdded = 0;
        memberLocations.forEach(({ memberId, memberData, location }) => {
            let destination = null;
            let isInTorn = false;
            
            // Check if member has travel data
            if (location) {
                if (location.destination) {
                    destination = location.destination;
                } else if (location.departing) {
                    // Member is departing from a location
                    destination = location.departing;
                }
            }
            
            // If no travel data, assume member is in Torn City
            if (!destination) {
                destination = 'Torn';
                isInTorn = true;
            }
            
            // Get coordinates for the destination
            const coordinates = getCityCoordinates(destination);
            
            if (coordinates) {
                const memberName = memberData.name || `Member ${memberId}`;
                const memberStatus = memberData.status ? memberData.status.state : 'Unknown';
                const locationText = isInTorn ? 'Torn City' : destination;
                
                // Create custom icon
                const customIcon = L.divIcon({
                    className: 'faction-member-marker',
                    html: `<div class="marker-pin">📍</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
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
                
                factionMarkers.push(marker);
                markersAdded++;
            }
        });
        
        // Fit map to show all markers
        if (factionMarkers.length > 0) {
            const group = new L.featureGroup(factionMarkers);
            worldMap.fitBounds(group.getBounds().pad(0.1));
        }
        
        mapLoading.classList.add('hidden');
        
        if (markersAdded === 0) {
            mapError.classList.remove('hidden');
            mapError.textContent = 'No faction members with valid travel locations found.';
        }
        
    } catch (error) {
        console.error('Error loading faction map:', error);
        mapLoading.classList.add('hidden');
        mapError.classList.remove('hidden');
        mapError.textContent = `Error loading faction map: ${error.message}`;
    }
}

// Map Torn city names to coordinates
function getCityCoordinates(cityName) {
    if (!cityName) return null;
    
    // Torn city coordinates (approximate)
    const cityCoordinates = {
        'Torn': [51.5074, -0.1278], // London, UK
        'United Kingdom': [51.5074, -0.1278],
        'UK': [51.5074, -0.1278],
        'Mexico': [19.4326, -99.1332], // Mexico City
        'Cayman Islands': [19.3133, -81.2546],
        'Canada': [45.5017, -73.5673], // Montreal
        'Hawaii': [21.3099, -157.8581], // Honolulu
        'United States': [40.7128, -74.0060], // New York
        'USA': [40.7128, -74.0060],
        'US': [40.7128, -74.0060],
        'Argentina': [-34.6037, -58.3816], // Buenos Aires
        'Switzerland': [46.2044, 6.1432], // Geneva
        'Japan': [35.6762, 139.6503], // Tokyo
        'China': [39.9042, 116.4074], // Beijing
        'UAE': [25.2048, 55.2708], // Dubai
        'United Arab Emirates': [25.2048, 55.2708],
        'South Africa': [-26.2041, 28.0473], // Johannesburg
        'New Zealand': [-36.8485, 174.7633], // Auckland
        'Iceland': [64.1466, -21.9426], // Reykjavik
        'Brazil': [-23.5505, -46.6333], // São Paulo
        'Australia': [-33.8688, 151.2093], // Sydney
        'Russia': [55.7558, 37.6173], // Moscow
        'India': [28.6139, 77.2090], // New Delhi
        'France': [48.8566, 2.3522], // Paris
        'Germany': [52.5200, 13.4050], // Berlin
        'Italy': [41.9028, 12.4964], // Rome
        'Spain': [40.4168, -3.7038], // Madrid
        'Netherlands': [52.3676, 4.9041], // Amsterdam
        'Belgium': [50.8503, 4.3517], // Brussels
        'Sweden': [59.3293, 18.0686], // Stockholm
        'Norway': [59.9139, 10.7522], // Oslo
        'Denmark': [55.6761, 12.5683], // Copenhagen
        'Finland': [60.1699, 24.9384], // Helsinki
        'Poland': [52.2297, 21.0122], // Warsaw
        'Turkey': [41.0082, 28.9784], // Istanbul
        'Egypt': [30.0444, 31.2357], // Cairo
        'Saudi Arabia': [24.7136, 46.6753], // Riyadh
        'Singapore': [1.3521, 103.8198], // Singapore
        'Thailand': [13.7563, 100.5018], // Bangkok
        'South Korea': [37.5665, 126.9780], // Seoul
        'Philippines': [14.5995, 120.9842], // Manila
        'Indonesia': [-6.2088, 106.8456], // Jakarta
        'Malaysia': [3.1390, 101.6869], // Kuala Lumpur
        'Vietnam': [10.8231, 106.6297], // Ho Chi Minh City
        'Taiwan': [25.0330, 121.5654], // Taipei
        'Hong Kong': [22.3193, 114.1694], // Hong Kong
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
    
    // Try partial match (e.g., "United States" matches "United States of America")
    for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (cityNameLower.includes(city.toLowerCase()) || city.toLowerCase().includes(cityNameLower)) {
            return coords;
        }
    }
    
    // Return null if city not found
    return null;
}

