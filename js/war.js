// War Module - War-related functions
// Depends on: config.js, api.js

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
        const membersArray = memberIds.map(id => ({
            id: id,
            ...members[id]
        }));
        
        // Create table
        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead>';
        html += '<tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Name</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Level</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Status</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Last Action</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        membersArray.forEach(member => {
            const name = member.name || `User ${member.id}`;
            const level = member.level !== undefined ? member.level : '-';
            const status = member.status ? (member.status.state || member.status.description || '-') : '-';
            const lastAction = member.last_action ? (member.last_action.status || member.last_action.relative || '-') : '-';
            
            html += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
            html += `<td style="padding: 12px; color: #f4e4bc; font-size: 1rem; font-weight: 500;">${name} <span style="color: #c0c0c0; font-size: 0.85rem;">(${member.id})</span></td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${level}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${status}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${lastAction}</td>`;
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

// Make loadWarData available globally for tab activation
window.loadWarData = loadWarData;

