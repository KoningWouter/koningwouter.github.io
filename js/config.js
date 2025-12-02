// API configuration
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

// Selector descriptions for each endpoint
const SELECTOR_DESCRIPTIONS = {
    'User': {
        'basic': 'Basic user information including ID, name, level, and status.',
        'profile': 'Detailed profile information including personal stats and achievements.',
        'personalstats': 'Personal statistics including total attacks, defends, and other metrics.',
        'battlestats': 'Battle statistics including wins, losses, and battle history.',
        'education': 'Education information including courses completed and current education.',
        'workstats': 'Work statistics including job performance and work history.',
        'crimes': 'Crime-related information including successful crimes and crime history.',
        'travel': 'Travel information including current location and travel history.',
        'icons': 'User icons and visual elements.',
        'cooldowns': 'Current cooldowns for various actions.',
        'money': 'Financial information including wallet and bank balances.',
        'notifications': 'User notifications and alerts.',
        'perks': 'Active perks and their effects.',
        'bars': 'Current status bars (life, energy, nerve, happy).',
        'networth': 'Total net worth calculation.',
        'jobpoints': 'Job points and job-related information.',
        'merits': 'Merits earned and available.',
        'refills': 'Refill information and availability.',
        'discord': 'Discord integration information.',
        'weaponexp': 'Weapon experience and proficiency.',
        'log': 'Activity log and recent actions.',
        'events': 'Recent events and notifications.',
        'messages': 'Message information and inbox status.',
        'competition': 'Competition participation and results.',
        'stocks': 'Stock portfolio and investments.',
        'properties': 'Owned properties and property details.',
        'honors': 'Honors earned and available.',
        'medals': 'Medals earned and achievements.',
        'display': 'Display preferences and settings.',
        'awards': 'Awards and recognition received.'
    },
    'Faction': {
        'basic': 'Basic faction information including ID, name, and tag.',
        'contributors': 'Faction contributors and contribution statistics.',
        'members': 'List of all faction members with basic information.',
        'memberstats': 'Detailed statistics for each faction member.',
        'territory': 'Territory information and control status.',
        'chain': 'Current chain information and progress.',
        'chainreport': 'Detailed chain report with statistics.',
        'upgrades': 'Faction upgrades and their status.',
        'stats': 'Overall faction statistics and performance.'
    },
    'Company': {
        'basic': 'Basic company information including ID, name, and type.',
        'profile': 'Detailed company profile and description.',
        'detailed': 'Comprehensive company details and statistics.',
        'employees': 'List of employees and their roles.',
        'stock': 'Company stock information and availability.',
        'applications': 'Job applications and applicant information.',
        'news': 'Company news and announcements.'
    },
    'Market': {
        'bazaar': 'Bazaar listings and item availability.',
        'itemmarket': 'Item market data and pricing information.',
        'pointsmarket': 'Points market data and exchange rates.',
        'timestamp': 'Market data timestamp for synchronization.'
    },
    'Torn': {
        'currency': 'Currency information and exchange rates.',
        'items': 'Available items and their properties.',
        'competition': 'Competition information and leaderboards.',
        'education': 'Education system and available courses.',
        'honors': 'Available honors and requirements.',
        'medals': 'Available medals and achievement requirements.',
        'organisedcrimes': 'Organized crime information and requirements.',
        'properties': 'Property information and availability.',
        'rackets': 'Racket information and control status.',
        'raids': 'Raid information and availability.',
        'stats': 'General game statistics and metrics.',
        'stocks': 'Stock market information and listings.',
        'territory': 'Territory information and control.',
        'territorywars': 'Territory war information and status.',
        'companies': 'Company listings and information.',
        'factions': 'Faction listings and information.',
        'rankedwars': 'Ranked war information and standings.'
    },
    'Key': {
        'info': 'API key information including access level, rate limits, and permissions.'
    },
    'Property': {
        'property': 'Property details including upgrades, ownership, and status.'
    },
    'Racing': {
        'stats': 'Racing statistics and performance metrics.',
        'leaderboard': 'Racing leaderboard and rankings.'
    },
    'Forum': {
        'forums': 'Forum listings and categories.',
        'threads': 'Forum threads and discussions.',
        'posts': 'Forum posts and replies.'
    },
    'Bank': {
        'bank': 'Banking information including accounts, transactions, and investments.'
    }
};

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

// Global state variables
const State = {
    // Auto-refresh state
    currentUserId: null,
    refreshInterval: null,
    travelCountdownInterval: null,
    travelEndTime: null,
    
    // Faction map state
    currentFactionId: null,
    worldMap: null,
    tornCityMarkers: [],
    tornCityLines: [],
    factionMarkers: [],
    factionMembersData: [],
    tornCountMarker: null,
    mapInitRetryCount: 0,
    mapInitInProgress: false,
    worldMapUpdateInterval: null,
    
    // API state
    userLastFetchTime: {},
    cachedBarsData: null,
    
    // Stocks state
    stockNamesMap: {},
    stockNamesArray: [],
    stockPricesMap: {},
    stockPriceUpdateInterval: null,
    
    // Bounties pagination state
    bountiesCurrentPage: 1,
    bountiesLimit: 50,
    bountiesTotal: 0,
    
    // War checking state
    warCheckInterval: null,
    
    // War map state
    warMap: null,
    warMapMarkers: [],
    warTornCountMarker: null,
    warMapUpdateInterval: null,
    warOpponentFactionId: null,
    warClockInterval: null,
    warStartTime: null
};

const MAX_MAP_INIT_RETRIES = 10;

