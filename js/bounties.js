// Bounties Module - Bounties-related functions
// Depends on: config.js, api.js

// Load bounties data from API with pagination
async function loadBountiesData(page = null) {
    console.log('=== loadBountiesData() called ===');
    console.log('Page parameter:', page);
    
    // Use provided page or current page from state
    if (page !== null) {
        State.bountiesCurrentPage = page;
        console.log('Set State.bountiesCurrentPage to:', page);
    }
    const currentPage = State.bountiesCurrentPage;
    const limit = State.bountiesLimit;
    const offset = 100 * currentPage; // offset = 100 * page_number
    console.log('Current page:', currentPage, 'Offset:', offset);
    
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
        const bountiesUrl = `${API_BASE_URL}/torn/bounties?key=${apiKey}&limit=${limit}&offset=${offset}`;
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
        
        // Get total count if available (for pagination)
        // If total is not in response, estimate based on current page and results
        let totalBounties = bountiesData.total;
        if (!totalBounties) {
            // If we got a full page of results, estimate there might be more
            if (bountyIds.length === limit) {
                // Assume there are more pages (we'll show "Page X" without total)
                totalBounties = (currentPage * limit) + 1; // Estimate: at least one more
            } else {
                // This is likely the last page
                totalBounties = (currentPage - 1) * limit + bountyIds.length;
            }
        }
        State.bountiesTotal = totalBounties;
        const totalPages = 100; // Hardcoded to 100
        
        // Function to generate pagination controls HTML (define before using)
        const generatePaginationHTML = (isTop = false) => {
            const marginStyle = isTop ? 'margin-bottom: 20px;' : 'margin-top: 20px;';
            let paginationHTML = `<div style="${marginStyle} display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap;">`;
            
            // Previous button
            if (currentPage > 1) {
                paginationHTML += `<button onclick="loadBountiesData(${currentPage - 1})" style="padding: 8px 16px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; color: #d4af37; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'">Previous</button>`;
            } else {
                paginationHTML += `<button disabled style="padding: 8px 16px; background: rgba(192, 192, 192, 0.1); border: 1px solid rgba(192, 192, 192, 0.2); border-radius: 6px; color: #666; cursor: not-allowed; font-size: 0.95rem; font-weight: 600;">Previous</button>`;
            }
            
            // Page input box
            const inputId = isTop ? 'bountiesPageInputTop' : 'bountiesPageInputBottom';
            paginationHTML += `<span style="color: #c0c0c0; font-size: 0.95rem; padding: 0 10px; display: flex; align-items: center; gap: 5px;">Page <input type="number" id="${inputId}" value="${currentPage}" min="1" max="${totalPages}" style="width: 60px; padding: 4px 8px; background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 4px; color: #d4af37; font-size: 0.95rem; text-align: center; font-weight: 600;" onkeyup="if(event.key==='Enter') { event.preventDefault(); event.stopPropagation(); const val = this.value; console.log('Enter pressed, input value:', val); handleBountiesPageInput(this); return false; }" onblur="console.log('Blur event, input value:', this.value); handleBountiesPageInput(this)"> of ${totalPages}</span>`;
            
            // Next button
            if (currentPage < totalPages) {
                paginationHTML += `<button onclick="loadBountiesData(${currentPage + 1})" style="padding: 8px 16px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; color: #d4af37; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'">Next</button>`;
            } else {
                paginationHTML += `<button disabled style="padding: 8px 16px; background: rgba(192, 192, 192, 0.1); border: 1px solid rgba(192, 192, 192, 0.2); border-radius: 6px; color: #666; cursor: not-allowed; font-size: 0.95rem; font-weight: 600;">Next</button>`;
            }
            
            paginationHTML += '</div>';
            return paginationHTML;
        };
        
        // Add pagination controls at the top (always show, even if no bounties)
        html += generatePaginationHTML(true);
        
        if (bountyIds.length === 0) {
            html += '<p style="color: #c0c0c0; font-style: italic;">No bounties found</p>';
            // Add pagination controls at the bottom as well
            html += generatePaginationHTML();
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
        
        // Remove duplicate bounties (same target_id) - keep the one with highest reward
        const seenTargetIds = new Set();
        const uniqueBountiesArray = bountiesArray.filter(bounty => {
            const targetId = bounty.target_id;
            if (!targetId || targetId === 'Unknown') {
                return true; // Keep entries without valid target_id
            }
            if (seenTargetIds.has(targetId)) {
                return false; // Skip duplicate
            }
            seenTargetIds.add(targetId);
            return true; // Keep first occurrence (already sorted by reward descending)
        });
        
        // Use the deduplicated array
        const finalBountiesArray = uniqueBountiesArray;
        
        // Collect all target IDs for FFScouter API call
        const targetIds = finalBountiesArray
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
        
        // Sort bounties by fair_fight value (ascending - lowest to highest)
        finalBountiesArray.sort((a, b) => {
            const targetIdA = String(a.target_id || 'Unknown');
            const targetIdB = String(b.target_id || 'Unknown');
            const statsA = battlestatsMap[targetIdA] || {};
            const statsB = battlestatsMap[targetIdB] || {};
            const fairFightA = statsA.fair_fight;
            const fairFightB = statsB.fair_fight;
            
            // Handle missing values - put them at the end
            if (fairFightA === undefined || fairFightA === null) {
                return 1; // Move A to end
            }
            if (fairFightB === undefined || fairFightB === null) {
                return -1; // Move B to end
            }
            
            // Sort ascending (lowest to highest)
            return fairFightA - fairFightB;
        });
        
        // Collect all fair_fight values to determine min/max for color coding
        const fairFightValues = [];
        finalBountiesArray.forEach(bounty => {
            const targetId = bounty.target_id || 'Unknown';
            const stats = battlestatsMap[String(targetId)] || {};
            const fairFight = stats.fair_fight;
            if (fairFight !== undefined && fairFight !== null && typeof fairFight === 'number') {
                fairFightValues.push(fairFight);
            }
        });
        
        // Calculate min and max fair_fight values
        const minFairFight = fairFightValues.length > 0 ? Math.min(...fairFightValues) : 0;
        const maxFairFight = fairFightValues.length > 0 ? Math.max(...fairFightValues) : 1;
        const fairFightRange = maxFairFight - minFairFight;
        
        // Function to get color based on fair_fight value (green for min/0, red for max)
        const getFairFightColor = (value) => {
            if (value === '-' || value === null || value === undefined || typeof value !== 'number') {
                return '#c0c0c0'; // Default gray for missing values
            }
            
            if (fairFightRange === 0) {
                return '#00ff00'; // All same value, return green
            }
            
            // Normalize value to 0-1 range (0 = min, 1 = max)
            const normalized = (value - minFairFight) / fairFightRange;
            
            // Interpolate between green (0, 255, 0) and red (255, 0, 0)
            const red = Math.round(normalized * 255);
            const green = Math.round((1 - normalized) * 255);
            const blue = 0;
            
            return `rgb(${red}, ${green}, ${blue})`;
        };
        
        // Add pagination controls at the top (already added earlier, skip duplicate)
        
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
        
        finalBountiesArray.forEach(bounty => {
            const targetId = bounty.target_id || 'Unknown';
            const targetName = bounty.target_name || `User ${targetId}`;
            const targetLevel = bounty.target_level !== undefined ? bounty.target_level : '-';
            const rewardAmount = bounty.reward !== undefined ? `$${Number(bounty.reward).toLocaleString('en-US')}` : '-';
            const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${targetId}`;
            const profileUrl = `https://www.torn.com/profiles.php?XID=${targetId}`;
            
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
            html += `<td style="padding: 12px; color: #f4e4bc; font-size: 1rem; font-weight: 500;"><a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="color: #f4e4bc; text-decoration: none; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#d4af37'" onmouseout="this.style.color='#f4e4bc'">${targetName}</a> <span style="color: #c0c0c0; font-size: 0.85rem;">(${targetId})</span></td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: center;">${targetLevel}</td>`;
            html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; font-weight: 600;">${rewardAmount}</td>`;
            html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; font-weight: 600;">${bsEstimateHuman}</td>`;
            html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: right;">${formatBsEstimate(bsEstimate)}</td>`;
            html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; font-weight: 600;">${total}</td>`;
            // Apply color coding to Fair column (green for min/0, red for max)
            const fairFightColor = getFairFightColor(fairFight);
            html += `<td style="padding: 12px; color: ${fairFightColor}; font-size: 0.95rem; text-align: center; font-weight: 600;">${formatFairFight(fairFight)}</td>`;
            html += `<td style="padding: 12px; text-align: center;"><a href="${attackUrl}" target="_blank" rel="noopener noreferrer" style="color: #ff6b6b; font-size: 1.5rem; text-decoration: none; cursor: pointer; display: inline-block; transition: transform 0.2s;" title="Attack ${targetName}" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⚔️</a></td>`;
            html += '</tr>';
        });
        
        html += '</tbody>';
        html += '</table>';
        
        // Add pagination controls at the bottom
        html += generatePaginationHTML();
        
        bountiesDisplay.innerHTML = html;
        console.log('Bounties data loaded and displayed successfully');
    } catch (error) {
        console.error('Error loading bounties data:', error);
        bountiesDisplay.innerHTML = `<p style="color: #ff6b6b;">Error loading bounties data: ${error.message}</p>`;
    }
}

// Handle page input navigation
function handleBountiesPageInput(pageInput) {
    // Ensure we have the actual input element
    if (!pageInput) {
        console.error('Invalid pageInput element');
        return;
    }
    
    // Use setTimeout to ensure the input value is fully updated
    setTimeout(() => {
        // Re-read the value from the DOM to ensure we have the latest
        const inputElement = document.getElementById(pageInput.id) || pageInput;
        const rawValue = String(inputElement.value || '').trim();
        let page = parseInt(rawValue, 10);
        const totalPages = 100; // Hardcoded to 100
        
        console.log('handleBountiesPageInput called');
        console.log('Input element:', inputElement);
        console.log('Input element ID:', inputElement.id);
        console.log('Raw input value:', rawValue);
        console.log('Input value type:', typeof inputElement.value);
        console.log('Parsed page:', page);
        console.log('Current page in state:', State.bountiesCurrentPage);
        console.log('Total pages:', totalPages);
        
        // Validate the page number
        if (isNaN(page) || page < 1) {
            console.log('Invalid page, resetting to current page');
            inputElement.value = State.bountiesCurrentPage;
            return;
        }
        
        // If page exceeds total pages, cap it
        if (totalPages > 0 && page > totalPages) {
            console.log('Page exceeds total pages, setting to max');
            inputElement.value = totalPages;
            loadBountiesData(totalPages);
            return;
        }
        
        // Always navigate to the specified page
        console.log('Loading page:', page);
        loadBountiesData(page);
    }, 0);
}

// Make loadBountiesData available globally for onclick handlers
window.loadBountiesData = loadBountiesData;
window.handleBountiesPageInput = handleBountiesPageInput;


