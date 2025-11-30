// API Module - All API fetching functions
// Depends on: config.js

// Get API key from input field or localStorage
function getApiKey() {
    // First check the input field (most current value)
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput && apiKeyInput.value.trim()) {
        const inputKey = apiKeyInput.value.trim();
        window.API_KEY = inputKey; // Keep window.API_KEY in sync for backward compatibility
        return inputKey;
    }
    
    // Fall back to localStorage only
    const savedKey = localStorage.getItem('torn_api_key');
    if (savedKey) {
        window.API_KEY = savedKey; // Keep window.API_KEY in sync for backward compatibility
        return savedKey;
    }
    
    // No API key found - return null
    return null;
}

// Fetch user data from API
async function fetchUserData(userId, selections = 'basic,profile,bars,travel,faction,money,battlestats') {
    // Get API key from localStorage (settings page)
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API key is not configured. Please enter your API key in the Settings tab.');
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

    const url = `${API_BASE_URL}/user/${numericUserId}?selections=${selections}&key=${apiKey}`;
    console.log('Fetching user data from URL:', url.replace(apiKey, 'KEY_HIDDEN'));
    
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
    return await fetchUserData(userId, 'bars,money,travel,battlestats');
}

// Fetch status data for quick refresh (includes travel)
async function fetchStatusData(userId) {
    return await fetchUserData(userId, 'basic,travel');
}

// Fetch faction data from API
async function fetchFactionData(factionId, selections = 'basic,members') {
    // Get API key from localStorage (settings page)
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API key is not configured. Please enter your API key in the Settings tab.');
    }

    const url = `${API_BASE_URL}/faction/${factionId}?selections=${selections}&key=${apiKey}`;
    console.log('Fetching faction data from URL:', url.replace(apiKey, 'KEY_HIDDEN'));
    
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

// Fetch stock names from API
async function fetchStockNames() {
    console.log('=== fetchStockNames() called ===');
    
    // If we already have stock names, don't fetch again
    if (Object.keys(State.stockNamesMap).length > 0) {
        console.log('Stock names already loaded, skipping fetch');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured, cannot fetch stock names');
        return;
    }
    
    try {
        const stocksUrl = `${API_BASE_URL}/torn/?selections=stocks&key=${apiKey}`;
        console.log('Fetching stock names from URL:', stocksUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const stocksResponse = await fetch(stocksUrl);
        
        if (!stocksResponse.ok) {
            throw new Error(`HTTP error! status: ${stocksResponse.status}`);
        }
        
        const stocksData = await stocksResponse.json();
        
        console.log('Stock names API response status:', stocksResponse.status);
        console.log('Stock names API response data:', stocksData);
        
        if (stocksData.error) {
            console.error('Error fetching stock names:', stocksData.error);
            return;
        }
        
        // Populate stockNamesMap, stockNamesArray, and stockPricesMap
        const stocks = stocksData.stocks || {};
        State.stockNamesArray = [];
        Object.keys(stocks).forEach(stockId => {
            const stock = stocks[stockId];
            if (stock.name) {
                State.stockNamesMap[stockId] = stock.name;
                State.stockNamesArray.push({
                    id: stockId,
                    name: stock.name
                });
            }
            // Store current price if available
            if (stock.current_price !== undefined) {
                State.stockPricesMap[stockId] = stock.current_price;
            }
        });
        
        // Sort array by name for easier browsing
        State.stockNamesArray.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Loaded ${Object.keys(State.stockNamesMap).length} stock names`);
        console.log('Stock names map:', State.stockNamesMap);
        console.log('Stock names array:', State.stockNamesArray);
        
    } catch (error) {
        console.error('Error fetching stock names:', error);
    }
}

// Update stock prices and refresh the Price column in the table
async function updateStockPrices() {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured for stock price update');
        return;
    }
    
    try {
        const stocksUrl = `${API_BASE_URL}/torn/?selections=stocks&key=${apiKey}`;
        const stocksResponse = await fetch(stocksUrl);
        
        if (!stocksResponse.ok) {
            throw new Error(`HTTP error! status: ${stocksResponse.status}`);
        }
        
        const stocksData = await stocksResponse.json();
        
        if (stocksData.error) {
            console.error('Error updating stock prices:', stocksData.error);
            return;
        }
        
        // Update stock prices map
        const stocks = stocksData.stocks || {};
        Object.keys(stocks).forEach(stockId => {
            const stock = stocks[stockId];
            if (stock.current_price !== undefined) {
                State.stockPricesMap[stockId] = stock.current_price;
            }
        });
        
        // Update the Price and Total Value columns in the table if it exists
        const stocksDisplay = document.getElementById('stocksDisplay');
        if (stocksDisplay) {
            // Update Price column
            const priceCells = stocksDisplay.querySelectorAll('.stock-price-cell');
            priceCells.forEach(cell => {
                const stockId = cell.getAttribute('data-stock-id');
                if (stockId && State.stockPricesMap[stockId] !== undefined) {
                    const price = State.stockPricesMap[stockId];
                    const formattedPrice = `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    cell.textContent = formattedPrice;
                }
            });
            
            // Update Total Value column (price * total_shares)
            const totalValueCells = stocksDisplay.querySelectorAll('.stock-total-value-cell');
            totalValueCells.forEach(cell => {
                const stockId = cell.getAttribute('data-stock-id');
                if (stockId && State.stockPricesMap[stockId] !== undefined) {
                    // Get total_shares from the data attribute on the cell itself
                    const totalShares = parseFloat(cell.getAttribute('data-total-shares') || '0');
                    
                    if (!isNaN(totalShares) && totalShares > 0) {
                        const price = State.stockPricesMap[stockId];
                        const totalValue = price * totalShares;
                        const formattedTotalValue = `$${Number(totalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        cell.textContent = formattedTotalValue;
                    } else {
                        cell.textContent = '-';
                    }
                }
            });
        }
        
        console.log('Stock prices updated');
    } catch (error) {
        console.error('Error updating stock prices:', error);
    }
}

// Fetch battlestats from FFScouter API for a single user
async function fetchFFScouterBattlestats(userId) {
    const ffscouterApiKey = localStorage.getItem('ffscouter_api_key');
    if (!ffscouterApiKey) {
        console.log('FFScouter API key not configured, skipping battlestats fetch');
        return null;
    }

    try {
        const ffscouterUrl = `https://ffscouter.com/api/v1/get-stats?key=${ffscouterApiKey}&targets=${userId}`;
        console.log('Fetching battlestats from FFScouter API for user:', userId);
        console.log('FFScouter API URL:', ffscouterUrl.replace(ffscouterApiKey, 'KEY_HIDDEN'));
        
        const statsResponse = await fetch(ffscouterUrl);
        
        if (!statsResponse.ok) {
            console.warn('FFScouter API request failed:', statsResponse.status, statsResponse.statusText);
            const errorText = await statsResponse.text();
            console.warn('FFScouter API error response:', errorText);
            return null;
        }
        
        const statsData = await statsResponse.json();
        console.log('FFScouter API response:', statsData);
        console.log('FFScouter API response type:', typeof statsData);
        console.log('FFScouter API response is array:', Array.isArray(statsData));
        
        // The API returns an array, find the entry for this user
        let userStats = null;
        if (Array.isArray(statsData)) {
            console.log('FFScouter API returned array with', statsData.length, 'items');
            // Try both string and number comparison for player_id
            userStats = statsData.find(stat => {
                const statPlayerId = stat.player_id;
                return statPlayerId == userId || String(statPlayerId) === String(userId) || Number(statPlayerId) === Number(userId);
            });
            console.log('Found user stats in array:', userStats);
            if (!userStats) {
                console.log('Searching for userId:', userId, 'in array items:');
                statsData.forEach((stat, index) => {
                    console.log(`  [${index}] player_id:`, stat.player_id, 'type:', typeof stat.player_id);
                });
            }
        } else if (typeof statsData === 'object' && statsData !== null) {
            // If it's an object keyed by user ID, try both string and number keys
            const userIdStr = String(userId);
            const userIdNum = Number(userId);
            if (statsData[userIdStr]) {
                userStats = statsData[userIdStr];
                console.log('Found user stats in object with string key:', userStats);
            } else if (statsData[userIdNum]) {
                userStats = statsData[userIdNum];
                console.log('Found user stats in object with number key:', userStats);
            } else if (statsData[userId]) {
                userStats = statsData[userId];
                console.log('Found user stats in object with direct key:', userStats);
            } else {
                console.log('User ID not found in response object. Available keys:', Object.keys(statsData));
                console.log('Looking for userId:', userId, 'as string:', userIdStr, 'as number:', userIdNum);
            }
        }
        
        if (userStats) {
            console.log('User stats found:', userStats);
            console.log('bs_estimate_human value:', userStats.bs_estimate_human);
            console.log('bs_estimate_human type:', typeof userStats.bs_estimate_human);
        } else {
            console.warn('No user stats found for userId:', userId);
        }
        
        return userStats || null;
    } catch (error) {
        console.error('Error fetching battlestats from FFScouter:', error);
        console.error('Error details:', error.message, error.stack);
        return null;
    }
}


