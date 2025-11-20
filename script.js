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

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    displayEndpoints();
    setupSearch();
});

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
        displayUserInfo(userData);
    } catch (error) {
        showError(error.message || 'Failed to fetch user information. Please check the user ID and try again.');
    }
}

// Fetch user data from API
async function fetchUserData(userId) {
    // Check if API key is configured
    if (!window.API_KEY) {
        throw new Error('API key is not configured. Please check config.js');
    }

    const url = `${API_BASE_URL}/user/${userId}?selections=basic,profile,personalstats,battlestats,education,workstats,icons,cooldowns,money,notifications,perks,bars,networth,display&key=${window.API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.error || 'API Error: ' + JSON.stringify(data.error));
    }

    return data;
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

    // Stats
    if (data.strength) {
        html += createInfoItem('Strength', data.strength.toLocaleString());
    }
    if (data.defense) {
        html += createInfoItem('Defense', data.defense.toLocaleString());
    }
    if (data.speed) {
        html += createInfoItem('Speed', data.speed.toLocaleString());
    }
    if (data.dexterity) {
        html += createInfoItem('Dexterity', data.dexterity.toLocaleString());
    }

    // Life Information
    if (data.life) {
        html += createInfoItem('Life', data.life.current + ' / ' + data.life.maximum);
    }
    if (data.energy) {
        html += createInfoItem('Energy', data.energy.current + ' / ' + data.energy.maximum);
    }
    if (data.nerve) {
        html += createInfoItem('Nerve', data.nerve.current + ' / ' + data.nerve.maximum);
    }
    if (data.happy) {
        html += createInfoItem('Happy', data.happy.current + ' / ' + data.happy.maximum);
    }

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
    userInfoDiv.classList.remove('hidden');
    userInfoDiv.innerHTML = `<div class="error-message">${message}</div>`;
}

