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
        } else {
            // Convert bounties object to array and sort by reward amount (descending)
            const bountiesArray = bountyIds.map(id => ({
                id: id,
                ...bounties[id]
            })).sort((a, b) => {
                const rewardA = a.reward || 0;
                const rewardB = b.reward || 0;
                return rewardB - rewardA;
            });
            
            // Create table
            html += '<table style="width: 100%; border-collapse: collapse;">';
            html += '<thead>';
            html += '<tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">';
            html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Target</th>';
            html += '<th style="padding: 12px; text-align: center; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Level</th>';
            html += '<th style="padding: 12px; text-align: right; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Reward</th>';
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
                
                html += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
                html += `<td style="padding: 12px; color: #f4e4bc; font-size: 1rem; font-weight: 500;">${targetName} <span style="color: #c0c0c0; font-size: 0.85rem;">(${targetId})</span></td>`;
                html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: center;">${targetLevel}</td>`;
                html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; font-weight: 600;">${rewardAmount}</td>`;
                html += `<td style="padding: 12px; text-align: center;"><a href="${attackUrl}" target="_blank" rel="noopener noreferrer" style="color: #ff6b6b; font-size: 1.5rem; text-decoration: none; cursor: pointer; display: inline-block; transition: transform 0.2s;" title="Attack ${targetName}" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⚔️</a></td>`;
                html += '</tr>';
            });
            
            html += '</tbody>';
            html += '</table>';
        }
        
        bountiesDisplay.innerHTML = html;
        console.log('Bounties data loaded and displayed successfully');
    } catch (error) {
        console.error('Error loading bounties data:', error);
        bountiesDisplay.innerHTML = `<p style="color: #ff6b6b;">Error loading bounties data: ${error.message}</p>`;
    }
}


