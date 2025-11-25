// Bounties Module - Bounties-related functions
// Depends on: config.js, api.js

// Load bounties data from API
async function loadBountiesData() {
    console.log('=== loadBountiesData() called ===');
    
    const bountiesDisplay = document.getElementById('bountiesDisplay');
    if (!bountiesDisplay) {
        console.error('Bounties display element not found in DOM');
        return;
    }
    
    // Show loading state
    bountiesDisplay.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">Loading bounties data...</p>';
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured');
        bountiesDisplay.innerHTML = '<p style="color: #ff6b6b;">API key not configured. Please enter your API key in the Settings tab.</p>';
        return;
    }
    
    try {
        const bountiesUrl = `${API_BASE_URL}/torn/bounties?key=${apiKey}`;
        console.log('Fetching bounties data from URL:', bountiesUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const bountiesResponse = await fetch(bountiesUrl);
        
        if (!bountiesResponse.ok) {
            throw new Error(`HTTP error! status: ${bountiesResponse.status}`);
        }
        
        const bountiesData = await bountiesResponse.json();
        
        console.log('Bounties API response status:', bountiesResponse.status);
        console.log('Bounties API response data:', bountiesData);
        
        if (bountiesData.error) {
            bountiesDisplay.innerHTML = `<p style="color: #ff6b6b;">Error: ${bountiesData.error.error || JSON.stringify(bountiesData.error)}</p>`;
            return;
        }
        
        // Display bounties in a table
        let html = '';
        
        // Handle the API response structure: { "bounties": { "bountyId": {...}, ... } }
        const bounties = bountiesData.bounties || {};
        const bountyIds = Object.keys(bounties);
        
        if (bountyIds.length === 0) {
            html = '<p style="color: #c0c0c0; font-style: italic;">No bounties found</p>';
            bountiesDisplay.innerHTML = html;
            return;
        }
        
        // Convert bounties object to array and sort by reward amount (descending)
        const bountiesArray = bountyIds.map(id => ({
            id: id,
            ...bounties[id]
        })).sort((a, b) => {
            const rewardA = a.reward || 0;
            const rewardB = b.reward || 0;
            return rewardB - rewardA;
        });
        
        // Collect all target IDs for FFScouter API call
        const targetIds = bountiesArray
            .map(bounty => bounty.target_id)
            .filter(id => id && id !== 'Unknown');
        
        // Fetch battlestats from FFScouter API if we have target IDs and API key
        let battlestatsMap = {};
        if (targetIds.length > 0) {
            const ffscouterApiKey = localStorage.getItem('ffscouter_api_key');
            if (ffscouterApiKey) {
                try {
                    const targetsParam = targetIds.join(',');
                    const ffscouterUrl = `https://ffscouter.com/api/v1/get-stats?key=${ffscouterApiKey}&targets=${targetsParam}`;
                    console.log('Fetching battlestats from FFScouter API...');
                    
                    const statsResponse = await fetch(ffscouterUrl);
                    
                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        console.log('FFScouter API response:', statsData);
                        
                        // Map the response data by target ID
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
        
        // Create table
        html += '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead>';
        html += '<tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">';
        html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Target</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Level</th>';
        html += '<th style="padding: 12px; text-align: right; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Reward</th>';
        html += '<th style="padding: 12px; text-align: right; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Battlestats</th>';
        html += '<th style="padding: 12px; text-align: right; color: #d4af37; font-weight: 600; font-size: 1.1rem;">BS Estimate</th>';
        html += '<th style="padding: 12px; text-align: right; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Total</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Fair</th>';
        html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Attack</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        bountiesArray.forEach(bounty => {
            const targetId = bounty.target_id || 'Unknown';
            const targetName = bounty.target_name || `User ${targetId}`;
            const targetLevel = bounty.target_level !== undefined ? bounty.target_level : '-';
            const rewardAmount = bounty.reward !== undefined ? `$${Number(bounty.reward).toLocaleString('en-US')}` : '-';
            const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${targetId}`;
            
            // Get battlestats for this target
            const stats = battlestatsMap[String(targetId)] || {};
            console.log(`Stats for target ${targetId}:`, stats);
            
            // The FFScouter API returns: player_id, fair_fight, bs_estimate, bs_estimate_human, bss_public, last_updated
            const fairFight = stats.fair_fight !== undefined && stats.fair_fight !== null ? stats.fair_fight : '-';
            const bsEstimateHuman = stats.bs_estimate_human !== undefined && stats.bs_estimate_human !== null ? stats.bs_estimate_human : '-';
            const bsEstimate = stats.bs_estimate !== undefined && stats.bs_estimate !== null ? stats.bs_estimate : '-';
            
            // Use bss_public as the total battlestats
            let total = '-';
            if (stats.bss_public !== undefined && stats.bss_public !== null) {
                total = Number(stats.bss_public).toLocaleString('en-US');
            }
            
            // Format fair_fight value (it's a number like 1275.62)
            const formatFairFight = (value) => {
                if (value === '-' || value === null || value === undefined) return '-';
                if (typeof value === 'number') {
                    return value.toFixed(2);
                }
                return String(value);
            };
            
            // Format bs_estimate value (it's a large number)
            const formatBsEstimate = (value) => {
                if (value === '-' || value === null || value === undefined) return '-';
                if (typeof value === 'number') {
                    return Number(value).toLocaleString('en-US');
                }
                return String(value);
            };
            
            html += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
            html += `<td style="padding: 12px; color: #f4e4bc; font-size: 1rem; font-weight: 500;">${targetName} <span style="color: #c0c0c0; font-size: 0.85rem;">(${targetId})</span></td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: center;">${targetLevel}</td>`;
            html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; font-weight: 600;">${rewardAmount}</td>`;
            html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; font-weight: 600;">${bsEstimateHuman}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: right;">${formatBsEstimate(bsEstimate)}</td>`;
            html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; font-weight: 600;">${total}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: center;">${formatFairFight(fairFight)}</td>`;
            html += `<td style="padding: 12px; text-align: center;"><a href="${attackUrl}" target="_blank" rel="noopener noreferrer" style="color: #ff6b6b; font-size: 1.5rem; text-decoration: none; cursor: pointer; display: inline-block; transition: transform 0.2s;" title="Attack ${targetName}" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⚔️</a></td>`;
            html += '</tr>';
        });
        
        html += '</tbody>';
        html += '</table>';
        
        bountiesDisplay.innerHTML = html;
        console.log('Bounties data loaded and displayed successfully');
    } catch (error) {
        console.error('Error loading bounties data:', error);
        bountiesDisplay.innerHTML = `<p style="color: #ff6b6b;">Error loading bounties data: ${error.message}</p>`;
    }
}


