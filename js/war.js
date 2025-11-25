// War Module - War-related functions
// Depends on: config.js, api.js, worldmap.js

// Check for upcoming wars and update button styling
async function checkUpcomingWars() {
    console.log('=== checkUpcomingWars() called ===');
    
    // Check if we have a faction ID
    if (!State.currentFactionId) {
        console.log('No faction ID available, cannot check for wars');
        removeWarButtonHighlight();
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured, cannot check for wars');
        removeWarButtonHighlight();
        return;
    }
    
    try {
        const warsUrl = `${API_BASE_URL}/faction/${State.currentFactionId}/wars?key=${apiKey}`;
        console.log('Fetching wars data from URL:', warsUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const warsResponse = await fetch(warsUrl);
        
        if (!warsResponse.ok) {
            throw new Error(`HTTP error! status: ${warsResponse.status}`);
        }
        
        const warsData = await warsResponse.json();
        
        console.log('Wars API response status:', warsResponse.status);
        console.log('Wars API response data:', warsData);
        
        if (warsData.error) {
            console.error('Error fetching wars:', warsData.error);
            removeWarButtonHighlight();
            return;
        }
        
        // Check if there's an upcoming war (array has content)
        // The API returns an object with war IDs as keys, or an array
        let hasUpcomingWar = false;
        
        if (Array.isArray(warsData)) {
            hasUpcomingWar = warsData.length > 0;
        } else if (typeof warsData === 'object' && warsData !== null) {
            // Check if it's an object with war data
            // Look for common war-related keys or check if object has any keys
            const keys = Object.keys(warsData);
            hasUpcomingWar = keys.length > 0;
            
            // Also check if there's a specific "wars" array
            if (warsData.wars && Array.isArray(warsData.wars)) {
                hasUpcomingWar = warsData.wars.length > 0;
            }
        }
        
        console.log('Has upcoming war:', hasUpcomingWar);
        
        if (hasUpcomingWar) {
            highlightWarButton();
        } else {
            removeWarButtonHighlight();
        }
        
    } catch (error) {
        console.error('Error checking for upcoming wars:', error);
        removeWarButtonHighlight();
    }
}

// Highlight the war button with shiny effect
function highlightWarButton() {
    const warButton = document.querySelector('button[data-tab="war"]');
    if (warButton) {
        warButton.classList.add('war-upcoming');
        console.log('War button highlighted');
    }
}

// Remove highlight from war button
function removeWarButtonHighlight() {
    const warButton = document.querySelector('button[data-tab="war"]');
    if (warButton) {
        warButton.classList.remove('war-upcoming');
        console.log('War button highlight removed');
    }
}

// Load war data and display opponent faction members
async function loadWarData() {
    console.log('=== loadWarData() called ===');
    
    const warDisplay = document.getElementById('warDisplay');
    if (!warDisplay) {
        console.error('War display element not found in DOM');
        return;
    }
    
    // Show loading state
    warDisplay.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">Loading war data...</p>';
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured');
        warDisplay.innerHTML = '<p style="color: #ff6b6b;">API key not configured. Please enter your API key in the Settings tab.</p>';
        return;
    }
    
    try {
        // Fetch wars data - endpoint is /faction/wars (without factionId)
        const warsUrl = `${API_BASE_URL}/faction/wars?key=${apiKey}`;
        console.log('Fetching wars data from URL:', warsUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const warsResponse = await fetch(warsUrl);
        
        if (!warsResponse.ok) {
            throw new Error(`HTTP error! status: ${warsResponse.status}`);
        }
        
        const warsData = await warsResponse.json();
        
        console.log('Wars API response status:', warsResponse.status);
        console.log('Wars API response data:', warsData);
        
        if (warsData.error) {
            warDisplay.innerHTML = `<p style="color: #ff6b6b;">Error: ${warsData.error.error || JSON.stringify(warsData.error)}</p>`;
            return;
        }
        
        // Find the opponent faction - it's the faction with name other than "Embers HQ"
        // Structure: warsData.wars.ranked.factions (or warsData.wars.raids or warsData.wars.territory)
        let opponentFactionId = null;
        let opponentFactionName = null;
        
        if (warsData.wars) {
            // Check ranked wars first
            if (warsData.wars.ranked && warsData.wars.ranked.factions && Array.isArray(warsData.wars.ranked.factions)) {
                for (const faction of warsData.wars.ranked.factions) {
                    if (faction.name && faction.name !== 'Embers HQ') {
                        opponentFactionId = faction.id;
                        opponentFactionName = faction.name;
                        break;
                    }
                }
            }
            
            // If not found in ranked, check raids
            if (!opponentFactionId && warsData.wars.raids && Array.isArray(warsData.wars.raids)) {
                for (const raid of warsData.wars.raids) {
                    if (raid.factions && Array.isArray(raid.factions)) {
                        for (const faction of raid.factions) {
                            if (faction.name && faction.name !== 'Embers HQ') {
                                opponentFactionId = faction.id;
                                opponentFactionName = faction.name;
                                break;
                            }
                        }
                    }
                    if (opponentFactionId) break;
                }
            }
            
            // If not found in raids, check territory
            if (!opponentFactionId && warsData.wars.territory && Array.isArray(warsData.wars.territory)) {
                for (const territoryWar of warsData.wars.territory) {
                    if (territoryWar.factions && Array.isArray(territoryWar.factions)) {
                        for (const faction of territoryWar.factions) {
                            if (faction.name && faction.name !== 'Embers HQ') {
                                opponentFactionId = faction.id;
                                opponentFactionName = faction.name;
                                break;
                            }
                        }
                    }
                    if (opponentFactionId) break;
                }
            }
        }
        
        if (!opponentFactionId) {
            warDisplay.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">No active war found or opponent faction not identified.</p>';
            return;
        }
        
        console.log('Opponent faction ID:', opponentFactionId);
        console.log('Opponent faction name:', opponentFactionName);
        
        // Store opponent faction ID for map updates
        State.warOpponentFactionId = opponentFactionId;
        
        // Initialize war map if not already initialized
        if (!State.warMap) {
            await initializeWarMap();
        } else {
            // Invalidate map size if it already exists
            setTimeout(() => {
                if (State.warMap) {
                    State.warMap.invalidateSize();
                }
            }, 100);
        }
        
        // Load and display enemy faction members on map
        await loadEnemyFactionMembers(opponentFactionId);
        
        // Fetch opponent faction members
        const membersUrl = `${API_BASE_URL}/faction/${opponentFactionId}/members?key=${apiKey}`;
        console.log('Fetching opponent faction members from URL:', membersUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const membersResponse = await fetch(membersUrl);
        
        if (!membersResponse.ok) {
            throw new Error(`HTTP error! status: ${membersResponse.status}`);
        }
        
        const membersData = await membersResponse.json();
        
        console.log('Members API response status:', membersResponse.status);
        console.log('Members API response data:', membersData);
        
        if (membersData.error) {
            warDisplay.innerHTML = `<p style="color: #ff6b6b;">Error fetching opponent members: ${membersData.error.error || JSON.stringify(membersData.error)}</p>`;
            return;
        }
        
        // Display members in a table
        const members = membersData.members || {};
        const memberIds = Object.keys(members);
        
        if (memberIds.length === 0) {
            warDisplay.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">No members found in opponent faction.</p>';
            return;
        }
        
        // Convert members object to array
        let membersArray = memberIds.map(id => ({
            id: id,
            ...members[id]
        }));
        
        // Collect all member IDs for FFScouter API call
        const memberIdsForFFScouter = membersArray
            .map(member => member.id)
            .filter(id => id && id !== 'Unknown');
        
        // Fetch battlestats from FFScouter API if we have member IDs and API key
        let battlestatsMap = {};
        if (memberIdsForFFScouter.length > 0) {
            const ffscouterApiKey = localStorage.getItem('ffscouter_api_key');
            if (ffscouterApiKey) {
                try {
                    const targetsParam = memberIdsForFFScouter.join(',');
                    const ffscouterUrl = `https://ffscouter.com/api/v1/get-stats?key=${ffscouterApiKey}&targets=${targetsParam}`;
                    console.log('Fetching battlestats from FFScouter API for war members...');
                    
                    const statsResponse = await fetch(ffscouterUrl);
                    
                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        console.log('FFScouter API response:', statsData);
                        
                        // Map the response data by player ID
                        // The API returns an array with player_id as the key
                        if (Array.isArray(statsData)) {
                            statsData.forEach(stat => {
                                if (stat.player_id) {
                                    const userId = String(stat.player_id);
                                    battlestatsMap[userId] = stat;
                                }
                            });
                        } else if (typeof statsData === 'object') {
                            // If it's an object, use the keys as user IDs
                            Object.keys(statsData).forEach(userId => {
                                battlestatsMap[userId] = statsData[userId];
                            });
                        }
                    } else {
                        console.warn('FFScouter API request failed:', statsResponse.status);
                    }
                } catch (error) {
                    console.error('Error fetching battlestats from FFScouter:', error);
                    // Continue without battlestats if there's an error
                }
            } else {
                console.log('FFScouter API key not configured, skipping battlestats fetch');
            }
        }
        
        // Sort members by fair_fight value (ascending - lowest to highest)
        // Put missing values (dash) at the top as they are weaker targets
        membersArray.sort((a, b) => {
            const statsA = battlestatsMap[String(a.id)] || {};
            const statsB = battlestatsMap[String(b.id)] || {};
            const fairFightA = statsA.fair_fight;
            const fairFightB = statsB.fair_fight;
            
            // Handle missing values - put them at the top (they are weaker)
            const aIsMissing = fairFightA === undefined || fairFightA === null;
            const bIsMissing = fairFightB === undefined || fairFightB === null;
            
            if (aIsMissing && bIsMissing) {
                return 0; // Both missing, keep order
            }
            if (aIsMissing) {
                return -1; // Move A to top
            }
            if (bIsMissing) {
                return 1; // Move B to top
            }
            
            // Sort ascending (lowest to highest)
            return fairFightA - fairFightB;
        });
        
        // Create table
        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead>';
        html += '<tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Name</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Level</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Status</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Last Action</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Fair Fight</th>';
        html += '<th style="padding: 12px; text-align: right; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Battle Stats</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Attack</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        membersArray.forEach(member => {
            const name = member.name || `User ${member.id}`;
            const level = member.level !== undefined ? member.level : '-';
            const status = member.status ? (member.status.state || member.status.description || '-') : '-';
            const lastAction = member.last_action ? (member.last_action.status || member.last_action.relative || '-') : '-';
            const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${member.id}`;
            
            // Get fair_fight and bs_estimate_human from FFScouter data
            const stats = battlestatsMap[String(member.id)] || {};
            const fairFight = stats.fair_fight !== undefined && stats.fair_fight !== null ? stats.fair_fight : '-';
            const bsEstimateHuman = stats.bs_estimate_human !== undefined && stats.bs_estimate_human !== null ? stats.bs_estimate_human : '-';
            
            // Format fair_fight value
            const formatFairFight = (value) => {
                if (value === '-' || value === null || value === undefined) return '-';
                if (typeof value === 'number') {
                    return value.toFixed(2);
                }
                return String(value);
            };
            
            html += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
            html += `<td style="padding: 12px; color: #f4e4bc; font-size: 1rem; font-weight: 500;">${name} <span style="color: #c0c0c0; font-size: 0.85rem;">(${member.id})</span></td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${level}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${status}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${lastAction}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: center;">${formatFairFight(fairFight)}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: right;">${bsEstimateHuman}</td>`;
            html += `<td style="padding: 12px; text-align: center;"><a href="${attackUrl}" target="_blank" rel="noopener noreferrer" style="color: #ff6b6b; font-size: 1.5rem; text-decoration: none; cursor: pointer; display: inline-block; transition: transform 0.2s;" title="Attack ${name}" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⚔️</a></td>`;
            html += '</tr>';
        });
        
        html += '</tbody>';
        html += '</table>';
        
        warDisplay.innerHTML = html;
        console.log('War data loaded and displayed successfully');
    } catch (error) {
        console.error('Error loading war data:', error);
        warDisplay.innerHTML = `<p style="color: #ff6b6b;">Error loading war data: ${error.message}</p>`;
    }
}

// Initialize war map with Leaflet
async function initializeWarMap() {
    if (State.warMap) {
        return; // Map already initialized
    }
    
    const mapContainer = document.getElementById('warMap');
    
    if (!mapContainer) {
        console.error('War map container not found');
        return;
    }
    
    try {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            throw new Error('Leaflet library not loaded');
        }
        
        // Initialize Leaflet map with dark theme
        State.warMap = L.map('warMap', {
            center: [0, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: false,
            minZoom: 2,
            maxZoom: 10,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true
        });
        
        // Add dark theme tile layer (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(State.warMap);
        
        // Wait for map to be ready, then invalidate size
        State.warMap.whenReady(() => {
            setTimeout(() => {
                if (State.warMap) {
                    State.warMap.invalidateSize();
                }
            }, 100);
        });
        
        // Add Torn city markers and lines (reuse functions from worldmap.js)
        if (typeof addTornCityMarkers === 'function') {
            // Temporarily set worldMap to warMap to reuse functions
            const originalMap = State.worldMap;
            State.worldMap = State.warMap;
            addTornCityMarkers();
            addTornCityLines();
            State.worldMap = originalMap;
        }
        
        console.log('War map initialized successfully');
    } catch (error) {
        console.error('Error initializing war map:', error);
    }
}

// Load enemy faction members and display on war map
async function loadEnemyFactionMembers(opponentFactionId) {
    if (!State.warMap || !opponentFactionId) {
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured');
        return;
    }
    
    try {
        // Fetch enemy faction members
        const membersUrl = `${API_BASE_URL}/faction/${opponentFactionId}/members?key=${apiKey}`;
        console.log('Fetching enemy faction members for war map from URL:', membersUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const membersResponse = await fetch(membersUrl);
        
        if (!membersResponse.ok) {
            throw new Error(`HTTP error! status: ${membersResponse.status}`);
        }
        
        const membersData = await membersResponse.json();
        
        if (membersData.error) {
            console.error('Error fetching enemy faction members:', membersData.error);
            return;
        }
        
        // Process members data
        const members = membersData.members || {};
        const memberIds = Object.keys(members);
        
        if (memberIds.length === 0) {
            console.log('No enemy faction members found');
            return;
        }
        
        // Convert to array format
        const membersArray = memberIds.map(id => {
            const member = members[id];
            return {
                id: id,
                name: member.name || `User ${id}`,
                status: member.status || {}
            };
        });
        
        // Create markers on war map
        createWarMapMarkers(membersArray);
        
        // Update online players in Torn window
        updateWarOnlinePlayersInTorn(membersArray);
        
    } catch (error) {
        console.error('Error loading enemy faction members for war map:', error);
    }
}

// Create markers on war map from members array
function createWarMapMarkers(membersArray) {
    if (!State.warMap || !membersArray || membersArray.length === 0) {
        return;
    }
    
    // Clear existing markers
    if (State.warMapMarkers && State.warMapMarkers.length > 0) {
        State.warMapMarkers.forEach(marker => {
            if (State.warMap.hasLayer(marker)) {
                State.warMap.removeLayer(marker);
            }
        });
        State.warMapMarkers = [];
    }
    
    // Remove existing Torn count marker
    if (State.warTornCountMarker) {
        if (State.warMap.hasLayer(State.warTornCountMarker)) {
            State.warMap.removeLayer(State.warTornCountMarker);
        }
        State.warTornCountMarker = null;
    }
    
    // Get Torn city coordinates (reuse function from worldmap.js)
    const tornCoords = typeof getCityCoordinates === 'function' ? getCityCoordinates('Torn') : null;
    if (!tornCoords) {
        console.error('Could not find Torn city coordinates');
        return;
    }
    
    let usersInTorn = 0;
    let usersNotInTorn = [];
    
    // Separate users by status
    membersArray.forEach(member => {
        const username = member.name || `User ${member.id || 'Unknown'}`;
        
        let statusDescription = '';
        if (member.status) {
            if (typeof member.status === 'string') {
                statusDescription = member.status;
            } else if (typeof member.status === 'object' && member.status.description) {
                statusDescription = member.status.description;
            }
        }
        
        // Check if user is in Torn
        const statusLower = (statusDescription || '').toLowerCase();
        if (statusDescription === 'Okay' || 
            statusLower === 'hospitalized' || 
            statusLower.includes('in hospital')) {
            usersInTorn++;
        } else {
            usersNotInTorn.push({ member, username, statusDescription });
        }
    });
    
    // Create count marker at Torn city if there are users in Torn
    if (usersInTorn > 0) {
        const countIcon = L.divIcon({
            className: 'faction-member-marker',
            html: `
                <div class="marker-container">
                    <div class="marker-dot" style="background: #dc143c; border-color: #ff6b6b; box-shadow: 0 0 10px rgba(220, 20, 60, 0.8), 0 0 20px rgba(220, 20, 60, 0.5);"></div>
                    <div class="marker-label">${usersInTorn} in Torn</div>
                </div>
            `,
            iconSize: [100, 30],
            iconAnchor: [50, 15]
        });
        
        State.warTornCountMarker = L.marker(tornCoords, { icon: countIcon })
            .addTo(State.warMap)
            .bindPopup(`
                <div class="marker-popup">
                    <strong>Enemy Players in Torn</strong><br>
                    <span>${usersInTorn} player${usersInTorn !== 1 ? 's' : ''} currently in Torn City</span>
                </div>
            `);
    }
    
    // Create individual markers for users NOT in Torn (reuse logic from worldmap.js)
    // Temporarily set worldMap to warMap to reuse marker creation functions
    const originalMap = State.worldMap;
    const originalMarkers = State.factionMarkers;
    State.worldMap = State.warMap;
    State.factionMarkers = [];
    
    // Use the same marker creation logic
    if (typeof createMarkersFromMembers === 'function') {
        createMarkersFromMembers(membersArray);
        State.warMapMarkers = State.factionMarkers;
    }
    
    // Restore original map and markers
    State.worldMap = originalMap;
    State.factionMarkers = originalMarkers;
}

// Update online players in Torn window for war map
function updateWarOnlinePlayersInTorn(membersArray) {
    const onlinePlayersList = document.getElementById('warOnlinePlayersList');
    if (!onlinePlayersList) {
        return;
    }
    
    if (!membersArray || membersArray.length === 0) {
        onlinePlayersList.innerHTML = '<div class="online-player-item">No players found</div>';
        return;
    }
    
    // Filter players in Torn
    const playersInTorn = membersArray.filter(member => {
        let statusDescription = '';
        if (member.status) {
            if (typeof member.status === 'string') {
                statusDescription = member.status;
            } else if (typeof member.status === 'object' && member.status.description) {
                statusDescription = member.status.description;
            }
        }
        
        const statusLower = (statusDescription || '').toLowerCase();
        return statusDescription === 'Okay' || 
               statusLower === 'hospitalized' || 
               statusLower.includes('in hospital');
    });
    
    if (playersInTorn.length === 0) {
        onlinePlayersList.innerHTML = '<div class="online-player-item">No players in Torn</div>';
        return;
    }
    
    // Display players
    let html = '';
    playersInTorn.forEach(member => {
        const username = member.name || `User ${member.id || 'Unknown'}`;
        html += `<div class="online-player-item">${username}</div>`;
    });
    
    onlinePlayersList.innerHTML = html;
}

// Start war map auto-refresh (every 5 seconds)
function startWarMapUpdates() {
    // Clear any existing interval
    if (State.warMapUpdateInterval) {
        clearInterval(State.warMapUpdateInterval);
    }
    
    // Refresh every 5 seconds
    State.warMapUpdateInterval = setInterval(async () => {
        if (State.warOpponentFactionId) {
            console.log('Auto-refreshing war map data...');
            await loadEnemyFactionMembers(State.warOpponentFactionId);
        }
    }, 5000); // 5 seconds
    
    console.log('War map auto-refresh started (every 5 seconds)');
}

// Stop war map auto-refresh
function stopWarMapUpdates() {
    if (State.warMapUpdateInterval) {
        clearInterval(State.warMapUpdateInterval);
        State.warMapUpdateInterval = null;
        console.log('War map auto-refresh stopped');
    }
}

// Make functions available globally
window.loadWarData = loadWarData;
window.initializeWarMap = initializeWarMap;
window.loadEnemyFactionMembers = loadEnemyFactionMembers;
window.startWarMapUpdates = startWarMapUpdates;
window.stopWarMapUpdates = stopWarMapUpdates;

