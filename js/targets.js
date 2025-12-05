// Targets Module - Handle targets display
// Depends on: config.js, api.js

// Fetch targets data from FFScouter API
async function fetchTargets() {
    // Get FFScouter API key from localStorage
    const ffscouterApiKey = localStorage.getItem('ffscouter_api_key');
    
    if (!ffscouterApiKey) {
        displayTargetsError('Please configure your FFScouter API key in Settings first.');
        return null;
    }

    try {
        console.log('Fetching targets...');
        
        // Use FFScouter API endpoint with minff and maxff filtering
        const url = `https://ffscouter.com/api/v1/get-targets?key=${ffscouterApiKey}&minff=2.00&maxff=2.95&limit=50`;
        
        console.log('Fetching targets from FFScouter API with minff=2.00&maxff=2.95&limit=50...');
        console.log('Full URL (key hidden):', url.replace(ffscouterApiKey, 'KEY_HIDDEN'));
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Targets data received from FFScouter:', data);
        console.log('Number of targets received:', data?.targets?.length);
        
        // Debug: Log fair fight values
        if (data?.targets && Array.isArray(data.targets)) {
            const fairFights = data.targets.map(t => t.fair_fight).sort((a, b) => a - b);
            console.log('Fair fight values in response:', fairFights);
            console.log('Min fair fight:', Math.min(...fairFights));
            console.log('Max fair fight:', Math.max(...fairFights));
        }
        
        // Check for API errors
        if (data.error) {
            const errorMessage = data.error.error || data.error.message || JSON.stringify(data.error);
            console.error('FFScouter API Error:', data.error);
            throw new Error(errorMessage);
        }
        
        // Return the full response object (contains parameters and targets array)
        return data;
    } catch (error) {
        console.error('Error fetching targets:', error);
        displayTargetsError(`Failed to fetch targets: ${error.message}`);
        return null;
    }
}

// Convert timestamp to relative time
function getRelativeTime(timestamp) {
    if (!timestamp) return '-';
    
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 0) return 'Recently';
    
    const minutes = Math.floor(diff / 60);
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(diff / 86400);
    const months = Math.floor(diff / 2592000);
    const years = Math.floor(diff / 31536000);
    
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Display targets in a table
function displayTargets(data) {
    const display = document.getElementById('targetsDisplay');
    
    // Extract targets array from response
    const targets = data?.targets;
    
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
        display.innerHTML = '<p style="text-align: center; color: #c0c0c0;">No targets found.</p>';
        return;
    }
    
    console.log('Items received:', targets.length);
    
    // Sort targets by fair fight (ascending - lowest first)
    // API handles filtering with minff/maxff parameters
    targets.sort((a, b) => {
        const ffA = a.fair_fight || 0;
        const ffB = b.fair_fight || 0;
        return ffA - ffB;
    });
    
    console.log('Targets sorted by fair fight (ascending)');
    
    // Debug: Log fair fight values after sorting
    const sortedFF = targets.map(t => ({ name: t.name, ff: t.fair_fight })).slice(0, 10);
    console.log('First 10 targets after sorting:', sortedFF);
    
    // Create table
    let html = `
        <table class="faction-members-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Fair Fight</th>
                    <th>Battle Stats</th>
                    <th>Last Action</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add rows for each target (API handles filtering)
    targets.forEach(target => {
        const playerId = target.player_id || '-';
        const name = target.name || 'Unknown';
        const level = target.level || '-';
        const fairFight = target.fair_fight ? target.fair_fight.toFixed(2) : '-';
        const bsEstimate = target.bs_estimate_human || '-';
        const lastAction = getRelativeTime(target.last_action);
        
        // URLs for profile and attack
        const profileUrl = `https://www.torn.com/profiles.php?XID=${playerId}`;
        const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${playerId}`;
        
        html += `
            <tr style="cursor: pointer;">
                <td style="font-weight: 600; color: #f4e4bc;" onclick="window.open('${profileUrl}', '_blank')">${escapeHtml(name)}</td>
                <td onclick="window.open('${profileUrl}', '_blank')">${level}</td>
                <td style="color: #ffd700;" onclick="window.open('${profileUrl}', '_blank')">${fairFight}</td>
                <td style="color: #d4af37; font-weight: 600;" onclick="window.open('${profileUrl}', '_blank')">${escapeHtml(bsEstimate)}</td>
                <td style="color: #c0c0c0;" onclick="window.open('${profileUrl}', '_blank')">${escapeHtml(lastAction)}</td>
                <td style="text-align: center;">
                    <a href="${profileUrl}" target="_blank" 
                       title="View Profile"
                       style="color: #d4af37; text-decoration: none; font-size: 1.2rem; margin: 0 5px; display: inline-block;"
                       onclick="event.stopPropagation();">
                        👤
                    </a>
                    <a href="${attackUrl}" target="_blank" 
                       title="Attack Player"
                       style="color: #dc143c; text-decoration: none; font-size: 1.2rem; margin: 0 5px; display: inline-block;"
                       onclick="event.stopPropagation();">
                        ⚔️
                    </a>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
        </table>
    `;

    display.innerHTML = html;
}

// Display error message
function displayTargetsError(message) {
    const display = document.getElementById('targetsDisplay');
    
    display.innerHTML = `
        <div class="error-message">
            <strong>Error:</strong> ${escapeHtml(message)}
        </div>
    `;
}

// Load targets
async function loadTargets() {
    console.log('Loading targets...');
    
    const display = document.getElementById('targetsDisplay');
    display.innerHTML = '<p style="text-align: center; color: #d4af37;">Loading targets...</p>';
    
    const data = await fetchTargets();
    
    if (data) {
        displayTargets(data);
    }
}

// Initialize targets tab
function initializeTargetsTab() {
    console.log('Initializing Targets tab...');
    console.log('Targets tab initialized');
}

// Load targets when tab is activated
function onTargetsTabActivated() {
    console.log('Targets tab activated');
    loadTargets();
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.TargetsModule = {
        initialize: initializeTargetsTab,
        onActivated: onTargetsTabActivated,
        refresh: loadTargets
    };
}
