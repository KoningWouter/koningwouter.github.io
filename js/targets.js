// Targets Module - Handle targets display
// Depends on: config.js, api.js

// Targets state for pagination
const TargetsState = {
    currentMaxff: 2.95,  // Current maxff value
    maxffHistory: [2.95], // History stack for Previous button
    lastTargetsData: null // Store last fetched data to get lowest fair_fight
};

// Fetch targets data from FFScouter API
async function fetchTargets(maxff = null) {
    // Get FFScouter API key from localStorage
    const ffscouterApiKey = localStorage.getItem('ffscouter_api_key');
    
    if (!ffscouterApiKey) {
        displayTargetsError('Please configure your FFScouter API key in Settings first.');
        return null;
    }

    try {
        // Use provided maxff or current state
        const currentMaxff = maxff !== null ? maxff : TargetsState.currentMaxff;
        
        console.log('Fetching targets...');
        
        // Use FFScouter API endpoint with minff and maxff filtering
        const url = `https://ffscouter.com/api/v1/get-targets?key=${ffscouterApiKey}&minff=2.00&maxff=${currentMaxff.toFixed(2)}&limit=50`;
        
        console.log(`Fetching targets from FFScouter API with minff=2.00&maxff=${currentMaxff.toFixed(2)}&limit=50...`);
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
    
    // Function to generate pagination controls HTML (matching bounties style)
    const generateTargetsPaginationHTML = (isTop = false) => {
        const marginStyle = isTop ? 'margin-bottom: 20px;' : 'margin-top: 20px;';
        let paginationHTML = `<div style="${marginStyle} display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap;">`;
        
        // Previous button - enabled if maxff is less than 3.00
        const canGoPrevious = TargetsState.currentMaxff < 3.00;
        if (canGoPrevious) {
            paginationHTML += `<button onclick="goToPreviousTargetsPage()" style="padding: 8px 16px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; color: #d4af37; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'">Previous</button>`;
        } else {
            paginationHTML += `<button disabled style="padding: 8px 16px; background: rgba(192, 192, 192, 0.1); border: 1px solid rgba(192, 192, 192, 0.2); border-radius: 6px; color: #666; cursor: not-allowed; font-size: 0.95rem; font-weight: 600;">Previous</button>`;
        }
        
        // Maxff display (instead of page number)
        paginationHTML += `<span style="color: #c0c0c0; font-size: 0.95rem; padding: 0 10px; display: flex; align-items: center; gap: 5px;">Max FF: <input type="number" id="${isTop ? 'targetsMaxffInputTop' : 'targetsMaxffInputBottom'}" value="${TargetsState.currentMaxff.toFixed(2)}" min="2.00" max="3.00" step="0.01" style="width: 70px; padding: 4px 8px; background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 4px; color: #d4af37; font-size: 0.95rem; text-align: center; font-weight: 600;" onkeyup="if(event.key==='Enter') { event.preventDefault(); event.stopPropagation(); handleTargetsMaxffInput(this); return false; }" onblur="handleTargetsMaxffInput(this)"></span>`;
        
        // Next button - always enabled (we can always go to lower fair fight)
        paginationHTML += `<button onclick="goToNextTargetsPage()" style="padding: 8px 16px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; color: #d4af37; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'">Next</button>`;
        
        paginationHTML += '</div>';
        return paginationHTML;
    };
    
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
        let html = '';
        html += generateTargetsPaginationHTML(true);
        html += '<p style="text-align: center; color: #c0c0c0;">No targets found.</p>';
        html += generateTargetsPaginationHTML(false);
        display.innerHTML = html;
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
    
    // Create table with pagination
    let html = '';
    
    // Pagination at top
    html += generateTargetsPaginationHTML(true);
    
    // Table
    html += `
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
    
    // Pagination at bottom
    html += generateTargetsPaginationHTML(false);

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
async function loadTargets(maxff = null) {
    console.log('Loading targets...');
    
    const display = document.getElementById('targetsDisplay');
    display.innerHTML = '<p style="text-align: center; color: #d4af37;">Loading targets...</p>';
    
    // Update state if maxff is provided
    if (maxff !== null) {
        TargetsState.currentMaxff = maxff;
    }
    
    const data = await fetchTargets(TargetsState.currentMaxff);
    
    if (data) {
        // Store the data for Next button logic
        TargetsState.lastTargetsData = data;
        displayTargets(data);
    }
}

// Go to next page (subtract 0.01 from lowest fair_fight)
async function goToNextTargetsPage() {
    console.log('Next page clicked');
    
    // Get the lowest fair_fight from the last fetched data
    let lowestFairFight = null;
    if (TargetsState.lastTargetsData && TargetsState.lastTargetsData.targets && Array.isArray(TargetsState.lastTargetsData.targets)) {
        const targets = TargetsState.lastTargetsData.targets;
        if (targets.length > 0) {
            // Find the minimum fair_fight value
            const fairFights = targets
                .map(t => t.fair_fight)
                .filter(ff => ff !== null && ff !== undefined && typeof ff === 'number');
            
            if (fairFights.length > 0) {
                lowestFairFight = Math.min(...fairFights);
            }
        }
    }
    
    // If we have a lowest fair_fight, subtract 0.01, otherwise subtract from current maxff
    let newMaxff;
    if (lowestFairFight !== null) {
        newMaxff = Math.max(2.00, lowestFairFight - 0.01);
        console.log(`Lowest fair_fight in current data: ${lowestFairFight.toFixed(2)}, new maxff: ${newMaxff.toFixed(2)}`);
    } else {
        // Fallback: subtract 0.01 from current maxff
        newMaxff = Math.max(2.00, TargetsState.currentMaxff - 0.01);
        console.log(`No fair_fight data found, subtracting 0.01 from current maxff: ${newMaxff.toFixed(2)}`);
    }
    
    // Round to 2 decimal places
    newMaxff = Math.round(newMaxff * 100) / 100;
    
    // Add current maxff to history before changing
    TargetsState.maxffHistory.push(TargetsState.currentMaxff);
    
    console.log(`Moving to next page: maxff ${TargetsState.currentMaxff.toFixed(2)} -> ${newMaxff.toFixed(2)}`);
    
    await loadTargets(newMaxff);
}

// Go to previous page (add 0.01 to maxff)
async function goToPreviousTargetsPage() {
    console.log('Previous page clicked');
    
    // Add 0.01 to current maxff, but don't exceed 3.00
    const newMaxff = Math.min(3.00, TargetsState.currentMaxff + 0.01);
    
    // Round to 2 decimal places
    const roundedMaxff = Math.round(newMaxff * 100) / 100;
    
    // Check if we can go back (if we're already at 3.00, we can't go further)
    if (roundedMaxff === TargetsState.currentMaxff && TargetsState.currentMaxff >= 3.00) {
        console.log('Cannot go to previous page - already at max (3.00)');
        return;
    }
    
    // Add current maxff to history before changing
    TargetsState.maxffHistory.push(TargetsState.currentMaxff);
    
    console.log(`Moving to previous page: maxff ${TargetsState.currentMaxff.toFixed(2)} -> ${roundedMaxff.toFixed(2)}`);
    
    await loadTargets(roundedMaxff);
}

// Handle maxff input navigation
function handleTargetsMaxffInput(inputElement) {
    if (!inputElement) {
        console.error('Invalid input element');
        return;
    }
    
    setTimeout(() => {
        const element = document.getElementById(inputElement.id) || inputElement;
        const rawValue = String(element.value || '').trim();
        let maxff = parseFloat(rawValue);
        
        console.log('handleTargetsMaxffInput called');
        console.log('Raw input value:', rawValue);
        console.log('Parsed maxff:', maxff);
        
        // Validate the maxff value
        if (isNaN(maxff) || maxff < 2.00 || maxff > 3.00) {
            console.log('Invalid maxff, resetting to current');
            element.value = TargetsState.currentMaxff.toFixed(2);
            return;
        }
        
        // Round to 2 decimal places
        maxff = Math.round(maxff * 100) / 100;
        
        // Add current to history if different
        if (maxff !== TargetsState.currentMaxff) {
            TargetsState.maxffHistory.push(TargetsState.currentMaxff);
        }
        
        console.log('Loading with maxff:', maxff);
        loadTargets(maxff);
    }, 0);
}

// Initialize targets tab
function initializeTargetsTab() {
    console.log('Initializing Targets tab...');
    console.log('Targets tab initialized');
}

// Load targets when tab is activated
function onTargetsTabActivated() {
    console.log('Targets tab activated');
    // Reset to initial state
    TargetsState.currentMaxff = 2.95;
    TargetsState.maxffHistory = [2.95];
    TargetsState.lastTargetsData = null;
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

// Make functions available globally for onclick handlers
window.goToNextTargetsPage = goToNextTargetsPage;
window.goToPreviousTargetsPage = goToPreviousTargetsPage;
window.handleTargetsMaxffInput = handleTargetsMaxffInput;
