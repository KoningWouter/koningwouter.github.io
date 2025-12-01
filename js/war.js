// War Module - War-related functions
// Depends on: config.js, api.js, worldmap.js

// Check for upcoming wars and update button styling
async function checkUpcomingWars() {
    console.log('=== checkUpcomingWars() called ===');
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured, cannot check for wars');
        removeWarButtonHighlight();
        return;
    }
    
    try {
        // Use the same endpoint as loadWarData for consistency
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
            console.error('Error fetching wars:', warsData.error);
            removeWarButtonHighlight();
            return;
        }
        
        // Check if there's an active (not ended) war
        // The API returns an object with war IDs as keys, or an array
        let hasActiveWar = false;
        let isWarEnded = false;
        
        // Check if war has ended by looking for end time in ranked wars
        if (warsData && typeof warsData === 'object' && warsData !== null) {
            if (warsData.wars && warsData.wars.ranked) {
                const ranked = warsData.wars.ranked;
                // Check if war has ended (end time is set)
                if (ranked.end !== undefined && ranked.end !== null && ranked.end !== 0) {
                    isWarEnded = true;
                    console.log('War has ended (end time found):', ranked.end);
                } else if (ranked.factions && Array.isArray(ranked.factions) && ranked.factions.length >= 2) {
                    // War is active if we have factions but no end time
                    hasActiveWar = true;
                    console.log('Active war found (factions present, no end time)');
                }
            }
            
            // Fallback: check if there's any war data at all (for other war types)
            if (!hasActiveWar && !isWarEnded) {
                if (Array.isArray(warsData)) {
                    hasActiveWar = warsData.length > 0;
                } else {
                    const keys = Object.keys(warsData);
                    hasActiveWar = keys.length > 0;
                    
                    // Also check if there's a specific "wars" array
                    if (warsData.wars && Array.isArray(warsData.wars)) {
                        hasActiveWar = warsData.wars.length > 0;
                    }
                }
            }
        }
        
        console.log('Has active war:', hasActiveWar, 'War ended:', isWarEnded);
        
        // Only highlight if there's an active (not ended) war
        if (hasActiveWar && !isWarEnded) {
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

// Format elapsed time as HH:MM:SS
function formatElapsedTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update war clock display
function updateWarClock() {
    const warClock = document.getElementById('warClock');
    if (!warClock) {
        console.warn('War clock element not found');
        return;
    }
    
    if (!State.warStartTime) {
        console.warn('No war start time set, cannot update clock');
        warClock.textContent = '⏱️ 00:00:00';
        return;
    }
    
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const elapsed = Math.max(0, now - State.warStartTime);
    const formattedTime = formatElapsedTime(elapsed);
    
    warClock.textContent = `⏱️ ${formattedTime}`;
    
    // Debug log every 10 seconds to verify it's updating
    if (elapsed % 10 === 0) {
        console.log('War clock update - elapsed:', elapsed, 'formatted:', formattedTime, 'startTime:', State.warStartTime, 'now:', now);
    }
}

// Start war clock
function startWarClock(startTimestamp) {
    // Stop any existing clock
    stopWarClock();
    
    if (!startTimestamp || startTimestamp === 0) {
        console.log('No valid start timestamp provided for war clock:', startTimestamp);
        return;
    }
    
    // Store start time (convert to seconds if it's in milliseconds)
    State.warStartTime = startTimestamp > 10000000000 ? Math.floor(startTimestamp / 1000) : startTimestamp;
    
    console.log('Starting war clock - startTimestamp:', startTimestamp, 'stored as:', State.warStartTime);
    
    // Update immediately
    updateWarClock();
    
    // Check if clock element exists
    const warClock = document.getElementById('warClock');
    if (!warClock) {
        console.error('War clock element not found in DOM');
        return;
    }
    
    // Update every second
    State.warClockInterval = setInterval(() => {
        updateWarClock();
    }, 1000);
    
    console.log('War clock started successfully with start time:', State.warStartTime, 'interval ID:', State.warClockInterval);
}

// Stop war clock
function stopWarClock() {
    if (State.warClockInterval) {
        clearInterval(State.warClockInterval);
        State.warClockInterval = null;
    }
    State.warStartTime = null;
    
    const warClock = document.getElementById('warClock');
    if (warClock) {
        warClock.textContent = '⏱️ 00:00:00';
    }
    
    console.log('War clock stopped');
}

// Update war score display
function updateWarScoreDisplay(warsData) {
    const warScoreTeamAName = document.getElementById('warScoreTeamAName');
    const warScoreTeamAScore = document.getElementById('warScoreTeamAScore');
    const warScoreTeamBName = document.getElementById('warScoreTeamBName');
    const warScoreTeamBScore = document.getElementById('warScoreTeamBScore');
    const warScoreCardsContainer = document.getElementById('warScoreCardsContainer');
    
    if (!warScoreTeamAName || !warScoreTeamAScore || !warScoreTeamBName || !warScoreTeamBScore || !warScoreCardsContainer) {
        console.error('War score display elements not found');
        return;
    }
    
    try {
        // Log the full warsData structure for debugging
        console.log('=== updateWarScoreDisplay - Full warsData ===', warsData);
        
        let teamA = null;
        let teamB = null;
        let scoreA = null;
        let scoreB = null;
        let startTime = null;
        let endTime = null;
        let isWarEnded = false;
        
        // Try to find war data with factions and scores
        if (warsData && warsData.wars) {
            console.log('warsData.wars structure:', warsData.wars);
            // Check ranked wars first
            if (warsData.wars.ranked && warsData.wars.ranked.factions && Array.isArray(warsData.wars.ranked.factions)) {
                const ranked = warsData.wars.ranked;
                const factions = ranked.factions;
                if (factions.length >= 2) {
                    teamA = factions[0].name || 'Team A';
                    teamB = factions[1].name || 'Team B';
                    scoreA = factions[0].score !== undefined ? factions[0].score : null;
                    scoreB = factions[1].score !== undefined ? factions[1].score : null;
                    // Get start time from ranked war - check multiple possible locations
                    if (ranked.start !== undefined && ranked.start !== null && ranked.start !== 0) {
                        startTime = ranked.start;
                        console.log('Found start time in ranked.start:', startTime);
                    } else if (ranked.start_time !== undefined && ranked.start_time !== null && ranked.start_time !== 0) {
                        startTime = ranked.start_time;
                        console.log('Found start time in ranked.start_time:', startTime);
                    } else {
                        console.warn('No start time found in ranked war data. Available keys:', Object.keys(ranked));
                        console.log('Full ranked object:', ranked);
                    }
                    // Check if war has ended
                    if (ranked.end !== undefined && ranked.end !== null && ranked.end !== 0) {
                        endTime = ranked.end;
                        isWarEnded = true;
                        console.log('War has ended. End time:', endTime);
                    }
                }
            }
            
            // If not found in ranked, check raids
            if (!teamA && warsData.wars.raids && Array.isArray(warsData.wars.raids) && warsData.wars.raids.length > 0) {
                const raid = warsData.wars.raids[0];
                if (raid.factions && Array.isArray(raid.factions) && raid.factions.length >= 2) {
                    teamA = raid.factions[0].name || 'Team A';
                    teamB = raid.factions[1].name || 'Team B';
                    scoreA = raid.factions[0].score !== undefined ? raid.factions[0].score : null;
                    scoreB = raid.factions[1].score !== undefined ? raid.factions[1].score : null;
                    // Get start time from raid if available
                    if (raid.start !== undefined && raid.start !== null) {
                        startTime = raid.start;
                    }
                }
            }
            
            // If not found in raids, check territory
            if (!teamA && warsData.wars.territory && Array.isArray(warsData.wars.territory) && warsData.wars.territory.length > 0) {
                const territoryWar = warsData.wars.territory[0];
                if (territoryWar.factions && Array.isArray(territoryWar.factions) && territoryWar.factions.length >= 2) {
                    teamA = territoryWar.factions[0].name || 'Team A';
                    teamB = territoryWar.factions[1].name || 'Team B';
                    scoreA = territoryWar.factions[0].score !== undefined ? territoryWar.factions[0].score : null;
                    scoreB = territoryWar.factions[1].score !== undefined ? territoryWar.factions[1].score : null;
                    // Get start time from territory war if available
                    if (territoryWar.start !== undefined && territoryWar.start !== null) {
                        startTime = territoryWar.start;
                    }
                }
            }
        }
        
        // Display the scores if we have the data
        if (teamA && teamB) {
            // Update Team A card (left)
            warScoreTeamAName.textContent = teamA;
            const scoreAStr = scoreA !== null && scoreA !== undefined ? String(scoreA) : '-';
            warScoreTeamAScore.textContent = scoreAStr;
            
            // Update Team B card (right)
            warScoreTeamBName.textContent = teamB;
            const scoreBStr = scoreB !== null && scoreB !== undefined ? String(scoreB) : '-';
            warScoreTeamBScore.textContent = scoreBStr;
            
            // Handle clock display - if war has ended, show fixed duration, otherwise show live counter
            if (isWarEnded && startTime && endTime && startTime !== 0 && endTime !== 0) {
                // War has ended - show fixed duration (end - start)
                stopWarClock(); // Stop any running clock
                
                const startTimeSeconds = startTime > 10000000000 ? Math.floor(startTime / 1000) : startTime;
                const endTimeSeconds = endTime > 10000000000 ? Math.floor(endTime / 1000) : endTime;
                const duration = Math.max(0, endTimeSeconds - startTimeSeconds);
                const formattedDuration = formatElapsedTime(duration);
                
                const warClock = document.getElementById('warClock');
                if (warClock) {
                    warClock.textContent = `⏱️ ${formattedDuration}`;
                }
                
                console.log('War has ended. Showing fixed duration:', formattedDuration, 'from', startTimeSeconds, 'to', endTimeSeconds);
            } else if (startTime && startTime !== 0) {
                // War is active - show live counter
                // Only restart clock if start time changed or clock isn't running
                const startTimeSeconds = startTime > 10000000000 ? Math.floor(startTime / 1000) : startTime;
                console.log('Starting war clock with startTime:', startTime, 'converted to seconds:', startTimeSeconds);
                if (State.warStartTime !== startTimeSeconds || !State.warClockInterval) {
                    startWarClock(startTime);
                } else {
                    console.log('Clock already running with same start time, skipping restart');
                }
            } else {
                console.warn('No valid start time found for war clock. startTime:', startTime);
                stopWarClock();
            }
            
            // Show the cards container
            warScoreCardsContainer.style.display = 'block';
            console.log('War score displayed:', { teamA, teamB, scoreA, scoreB, startTime });
        } else {
            // Hide the cards container if no war data
            warScoreCardsContainer.style.display = 'none';
            stopWarClock();
            console.log('No war score data found');
        }
    } catch (error) {
        console.error('Error updating war score display:', error);
        warScoreCardsContainer.style.display = 'none';
        stopWarClock();
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
        
        // Update war score display
        updateWarScoreDisplay(warsData);
        
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
        
        // Collect all fair_fight values to determine min/max for color coding
        const fairFightValues = [];
        membersArray.forEach(member => {
            const stats = battlestatsMap[String(member.id)] || {};
            const fairFight = stats.fair_fight;
            if (fairFight !== undefined && fairFight !== null && typeof fairFight === 'number') {
                fairFightValues.push(fairFight);
            }
        });
        
        // Calculate min and max fair_fight values
        const minFairFight = fairFightValues.length > 0 ? Math.min(...fairFightValues) : 0;
        const maxFairFight = fairFightValues.length > 0 ? Math.max(...fairFightValues) : 1;
        const fairFightRange = maxFairFight - minFairFight;
        
        // Function to get color based on fair_fight value
        // 0-2: Green (status-okay), 2-3: Federal orange, >3: Red (status-hospital)
        const getFairFightColor = (value) => {
            if (value === '-' || value === null || value === undefined || typeof value !== 'number') {
                return '#c0c0c0'; // Default gray for missing values
            }
            
            if (value >= 0 && value <= 2) {
                return '#00ff88'; // Green - status-okay color
            } else if (value > 2 && value <= 3) {
                return '#d4a574'; // Federal orange - matching Last Action Idle color
            } else if (value > 3) {
                return '#ff3366'; // Red - status-hospital color
            }
            
            // Fallback for negative values
            return '#c0c0c0';
        };
        
        // Create table
        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead>';
        html += '<tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Name</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Level</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Last Action</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Fair Fight</th>';
        html += '<th style="padding: 12px; text-align: right; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Battle Stats</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Status</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Attack</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        // Helper function to get last action color and glow
        const getLastActionColor = (lastAction) => {
            try {
                if (!lastAction || lastAction === '-' || lastAction === null || lastAction === undefined) {
                    return { color: '#c0c0c0', glow: 'none' }; // Default gray
                }
                const actionStr = String(lastAction).toLowerCase().trim();
                
                if (actionStr.indexOf('online') !== -1) {
                    return { 
                        color: '#00ff88', 
                        glow: '0 0 10px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 0.4)' 
                    }; // Green - matching status-okay color
                } else if (actionStr.indexOf('idle') !== -1) {
                    return { 
                        color: '#d4a574', 
                        glow: '0 0 10px rgba(212, 165, 116, 0.6), 0 0 20px rgba(212, 165, 116, 0.4)' 
                    }; // Orange - matching status-federal color
                } else if (actionStr.indexOf('offline') !== -1) {
                    return { 
                        color: '#ff3366', 
                        glow: '0 0 10px rgba(255, 51, 102, 0.6), 0 0 20px rgba(255, 51, 102, 0.4)' 
                    }; // Red - matching status-hospital color
                }
                return { color: '#c0c0c0', glow: 'none' }; // Default gray for unknown status
            } catch (e) {
                console.error('Error in getLastActionColor:', e, 'lastAction:', lastAction);
                return { color: '#c0c0c0', glow: 'none' };
            }
        };
        
        // Helper function to get fair fight glow based on color
        const getFairFightGlow = (color) => {
            if (!color || color === '#c0c0c0') return 'none';
            try {
                // Extract RGB values from color string
                const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (rgbMatch) {
                    const r = parseInt(rgbMatch[1]);
                    const g = parseInt(rgbMatch[2]);
                    const b = parseInt(rgbMatch[3]);
                    return `0 0 10px rgba(${r}, ${g}, ${b}, 0.6), 0 0 20px rgba(${r}, ${g}, ${b}, 0.4)`;
                }
                // Handle hex colors
                if (color.startsWith('#')) {
                    let hex = color.replace('#', '');
                    // Handle 3-character hex codes
                    if (hex.length === 3) {
                        hex = hex.split('').map(char => char + char).join('');
                    }
                    if (hex.length === 6) {
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        return `0 0 10px rgba(${r}, ${g}, ${b}, 0.6), 0 0 20px rgba(${r}, ${g}, ${b}, 0.4)`;
                    }
                }
            } catch (e) {
                console.error('Error parsing color for glow:', color, e);
            }
            return 'none';
        };
        
        // Helper function to get status color class
        const getStatusColorClass = (status) => {
            if (!status || status === '-') return '';
            const statusLower = String(status).toLowerCase();
            if (statusLower === 'okay') {
                return 'status-okay';
            } else if (statusLower === 'hospital' || statusLower.includes('hospital')) {
                return 'status-hospital';
            } else if (statusLower === 'traveling' || statusLower.includes('traveling') || 
                       statusLower === 'abroad' || statusLower.includes('abroad')) {
                return 'status-travelling';
            } else if (statusLower === 'federal' || statusLower.includes('federal')) {
                return 'status-federal';
            }
            return '';
        };
        
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
            
            // Get status color class
            const statusColorClass = getStatusColorClass(status);
            
            // Get color for Fair Fight column
            const fairFightColor = getFairFightColor(fairFight);
            const fairFightGlow = getFairFightGlow(fairFightColor);
            // Get color and glow for Last Action column
            const lastActionStyle = getLastActionColor(lastAction);
            const profileUrl = `https://www.torn.com/profiles.php?XID=${member.id}`;
            
            html += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
            html += `<td style="padding: 12px; color: #f4e4bc; font-size: 1rem; font-weight: 500;"><a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="color: #f4e4bc; text-decoration: none; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#d4af37'" onmouseout="this.style.color='#f4e4bc'">${name}</a> <span style="color: #c0c0c0; font-size: 0.85rem;">(${member.id})</span></td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${level}</td>`;
            html += `<td style="padding: 12px; color: ${lastActionStyle.color}; font-size: 0.95rem; font-weight: 600; text-shadow: ${lastActionStyle.glow};">${lastAction}</td>`;
            html += `<td style="padding: 12px; color: ${fairFightColor}; font-size: 0.95rem; text-align: center; font-weight: 600; text-shadow: ${fairFightGlow};">${formatFairFight(fairFight)}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: right;">${bsEstimateHuman}</td>`;
            html += `<td style="padding: 12px; font-size: 0.95rem;" class="${statusColorClass}">${status}</td>`;
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

// Refresh war data (table and map) using stored opponent faction ID
async function refreshWarData() {
    if (!State.warOpponentFactionId) {
        console.log('No opponent faction ID stored, cannot refresh war data');
        return;
    }
    
    const warDisplay = document.getElementById('warDisplay');
    if (!warDisplay) {
        console.error('War display element not found in DOM');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured');
        return;
    }
    
    try {
        // Refresh scores (already handled by refreshWarScores in the interval, but refresh here too for immediate update)
        await refreshWarScores();
        
        const opponentFactionId = State.warOpponentFactionId;
        
        // Refresh map markers
        await loadEnemyFactionMembers(opponentFactionId);
        
        // Fetch opponent faction members for table
        const membersUrl = `${API_BASE_URL}/faction/${opponentFactionId}/members?key=${apiKey}`;
        console.log('Refreshing opponent faction members from URL:', membersUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const membersResponse = await fetch(membersUrl);
        
        if (!membersResponse.ok) {
            throw new Error(`HTTP error! status: ${membersResponse.status}`);
        }
        
        const membersData = await membersResponse.json();
        
        if (membersData.error) {
            console.error('Error fetching opponent members:', membersData.error);
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
                    
                    const statsResponse = await fetch(ffscouterUrl);
                    
                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        
                        // Map the response data by player ID
                        if (Array.isArray(statsData)) {
                            statsData.forEach(stat => {
                                if (stat.player_id) {
                                    const userId = String(stat.player_id);
                                    battlestatsMap[userId] = stat;
                                }
                            });
                        } else if (typeof statsData === 'object') {
                            Object.keys(statsData).forEach(userId => {
                                battlestatsMap[userId] = statsData[userId];
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error fetching battlestats from FFScouter:', error);
                }
            }
        }
        
        // Sort members by fair_fight value (ascending - lowest to highest)
        membersArray.sort((a, b) => {
            const statsA = battlestatsMap[String(a.id)] || {};
            const statsB = battlestatsMap[String(b.id)] || {};
            const fairFightA = statsA.fair_fight;
            const fairFightB = statsB.fair_fight;
            
            const aIsMissing = fairFightA === undefined || fairFightA === null;
            const bIsMissing = fairFightB === undefined || fairFightB === null;
            
            if (aIsMissing && bIsMissing) {
                return 0;
            }
            if (aIsMissing) {
                return -1;
            }
            if (bIsMissing) {
                return 1;
            }
            
            return fairFightA - fairFightB;
        });
        
        // Collect all fair_fight values to determine min/max for color coding
        const fairFightValues = [];
        membersArray.forEach(member => {
            const stats = battlestatsMap[String(member.id)] || {};
            const fairFight = stats.fair_fight;
            if (fairFight !== undefined && fairFight !== null && typeof fairFight === 'number') {
                fairFightValues.push(fairFight);
            }
        });
        
        // Calculate min and max fair_fight values
        const minFairFight = fairFightValues.length > 0 ? Math.min(...fairFightValues) : 0;
        const maxFairFight = fairFightValues.length > 0 ? Math.max(...fairFightValues) : 1;
        const fairFightRange = maxFairFight - minFairFight;
        
        // Function to get color based on fair_fight value
        // 0-2: Green (status-okay), 2-3: Federal orange, >3: Red (status-hospital)
        const getFairFightColor = (value) => {
            if (value === '-' || value === null || value === undefined || typeof value !== 'number') {
                return '#c0c0c0'; // Default gray for missing values
            }
            
            if (value >= 0 && value <= 2) {
                return '#00ff88'; // Green - status-okay color
            } else if (value > 2 && value <= 3) {
                return '#d4a574'; // Federal orange - matching Last Action Idle color
            } else if (value > 3) {
                return '#ff3366'; // Red - status-hospital color
            }
            
            // Fallback for negative values
            return '#c0c0c0';
        };
        
        // Create table (reuse the same table generation logic from loadWarData)
        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead>';
        html += '<tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Name</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Level</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Last Action</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Fair Fight</th>';
        html += '<th style="padding: 12px; text-align: right; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Battle Stats</th>';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Status</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Attack</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        // Helper function to get last action color and glow
        const getLastActionColor = (lastAction) => {
            try {
                if (!lastAction || lastAction === '-' || lastAction === null || lastAction === undefined) {
                    return { color: '#c0c0c0', glow: 'none' }; // Default gray
                }
                const actionStr = String(lastAction).toLowerCase().trim();
                
                if (actionStr.indexOf('online') !== -1) {
                    return { 
                        color: '#00ff88', 
                        glow: '0 0 10px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 0.4)' 
                    }; // Green - matching status-okay color
                } else if (actionStr.indexOf('idle') !== -1) {
                    return { 
                        color: '#d4a574', 
                        glow: '0 0 10px rgba(212, 165, 116, 0.6), 0 0 20px rgba(212, 165, 116, 0.4)' 
                    }; // Orange - matching status-federal color
                } else if (actionStr.indexOf('offline') !== -1) {
                    return { 
                        color: '#ff3366', 
                        glow: '0 0 10px rgba(255, 51, 102, 0.6), 0 0 20px rgba(255, 51, 102, 0.4)' 
                    }; // Red - matching status-hospital color
                }
                return { color: '#c0c0c0', glow: 'none' }; // Default gray for unknown status
            } catch (e) {
                console.error('Error in getLastActionColor:', e, 'lastAction:', lastAction);
                return { color: '#c0c0c0', glow: 'none' };
            }
        };
        
        // Helper function to get fair fight glow based on color
        const getFairFightGlow = (color) => {
            if (!color || color === '#c0c0c0') return 'none';
            try {
                // Extract RGB values from color string
                const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (rgbMatch) {
                    const r = parseInt(rgbMatch[1]);
                    const g = parseInt(rgbMatch[2]);
                    const b = parseInt(rgbMatch[3]);
                    return `0 0 10px rgba(${r}, ${g}, ${b}, 0.6), 0 0 20px rgba(${r}, ${g}, ${b}, 0.4)`;
                }
                // Handle hex colors
                if (color.startsWith('#')) {
                    let hex = color.replace('#', '');
                    // Handle 3-character hex codes
                    if (hex.length === 3) {
                        hex = hex.split('').map(char => char + char).join('');
                    }
                    if (hex.length === 6) {
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        return `0 0 10px rgba(${r}, ${g}, ${b}, 0.6), 0 0 20px rgba(${r}, ${g}, ${b}, 0.4)`;
                    }
                }
            } catch (e) {
                console.error('Error parsing color for glow:', color, e);
            }
            return 'none';
        };
        
        // Helper function to get status color class
        const getStatusColorClass = (status) => {
            if (!status || status === '-') return '';
            const statusLower = String(status).toLowerCase();
            if (statusLower === 'okay') {
                return 'status-okay';
            } else if (statusLower === 'hospital' || statusLower.includes('hospital')) {
                return 'status-hospital';
            } else if (statusLower === 'traveling' || statusLower.includes('traveling') || 
                       statusLower === 'abroad' || statusLower.includes('abroad')) {
                return 'status-travelling';
            } else if (statusLower === 'federal' || statusLower.includes('federal')) {
                return 'status-federal';
            }
            return '';
        };
        
        membersArray.forEach(member => {
            const name = member.name || `User ${member.id}`;
            const level = member.level !== undefined ? member.level : '-';
            const status = member.status ? (member.status.state || member.status.description || '-') : '-';
            const lastAction = member.last_action ? (member.last_action.status || member.last_action.relative || '-') : '-';
            const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${member.id}`;
            
            const stats = battlestatsMap[String(member.id)] || {};
            const fairFight = stats.fair_fight !== undefined && stats.fair_fight !== null ? stats.fair_fight : '-';
            const bsEstimateHuman = stats.bs_estimate_human !== undefined && stats.bs_estimate_human !== null ? stats.bs_estimate_human : '-';
            
            const formatFairFight = (value) => {
                if (value === '-' || value === null || value === undefined) return '-';
                if (typeof value === 'number') {
                    return value.toFixed(2);
                }
                return String(value);
            };
            
            const statusColorClass = getStatusColorClass(status);
            
            // Get color for Fair Fight column
            const fairFightColor = getFairFightColor(fairFight);
            const fairFightGlow = getFairFightGlow(fairFightColor);
            // Get color and glow for Last Action column
            const lastActionStyle = getLastActionColor(lastAction);
            const profileUrl = `https://www.torn.com/profiles.php?XID=${member.id}`;
            
            html += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
            html += `<td style="padding: 12px; color: #f4e4bc; font-size: 1rem; font-weight: 500;"><a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="color: #f4e4bc; text-decoration: none; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#d4af37'" onmouseout="this.style.color='#f4e4bc'">${name}</a> <span style="color: #c0c0c0; font-size: 0.85rem;">(${member.id})</span></td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${level}</td>`;
            html += `<td style="padding: 12px; color: ${lastActionStyle.color}; font-size: 0.95rem; font-weight: 600; text-shadow: ${lastActionStyle.glow};">${lastAction}</td>`;
            html += `<td style="padding: 12px; color: ${fairFightColor}; font-size: 0.95rem; text-align: center; font-weight: 600; text-shadow: ${fairFightGlow};">${formatFairFight(fairFight)}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: right;">${bsEstimateHuman}</td>`;
            html += `<td style="padding: 12px; font-size: 0.95rem;" class="${statusColorClass}">${status}</td>`;
            html += `<td style="padding: 12px; text-align: center;"><a href="${attackUrl}" target="_blank" rel="noopener noreferrer" style="color: #ff6b6b; font-size: 1.5rem; text-decoration: none; cursor: pointer; display: inline-block; transition: transform 0.2s;" title="Attack ${name}" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⚔️</a></td>`;
            html += '</tr>';
        });
        
        html += '</tbody>';
        html += '</table>';
        
        warDisplay.innerHTML = html;
        console.log('War data refreshed successfully');
    } catch (error) {
        console.error('Error refreshing war data:', error);
    }
}

// Refresh war scores only (independent of opponent faction ID)
async function refreshWarScores() {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured');
        return;
    }
    
    try {
        // Fetch wars data to update score display
        const warsUrl = `${API_BASE_URL}/faction/wars?key=${apiKey}`;
        const warsResponse = await fetch(warsUrl);
        
        if (warsResponse.ok) {
            const warsData = await warsResponse.json();
            if (!warsData.error) {
                updateWarScoreDisplay(warsData);
                console.log('War scores refreshed');
            }
        }
    } catch (error) {
        console.error('Error refreshing war scores:', error);
    }
}

// Start war map auto-refresh (every 5 seconds)
function startWarMapUpdates() {
    // Clear any existing interval
    if (State.warMapUpdateInterval) {
        clearInterval(State.warMapUpdateInterval);
    }
    
    // Refresh scores immediately on start
    refreshWarScores();
    
    // Refresh both scores and table/map every 5 seconds
    State.warMapUpdateInterval = setInterval(async () => {
        // Always refresh scores
        await refreshWarScores();
        
        // Refresh table and map if we have opponent faction ID
        if (State.warOpponentFactionId) {
            console.log('Auto-refreshing war data (table and map)...');
            await refreshWarData();
        }
    }, 5000); // 5 seconds
    
    console.log('War data auto-refresh started (every 5 seconds)');
}

// Stop war map auto-refresh
function stopWarMapUpdates() {
    if (State.warMapUpdateInterval) {
        clearInterval(State.warMapUpdateInterval);
        State.warMapUpdateInterval = null;
        console.log('War map auto-refresh stopped');
    }
    // Also stop the clock when stopping war updates
    stopWarClock();
}

// Make functions available globally
window.loadWarData = loadWarData;
window.initializeWarMap = initializeWarMap;
window.loadEnemyFactionMembers = loadEnemyFactionMembers;
window.startWarMapUpdates = startWarMapUpdates;
window.stopWarMapUpdates = stopWarMapUpdates;

