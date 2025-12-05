// Targets Module - Handle targets display with pagination
// Depends on: config.js, api.js

// Targets state
const TargetsState = {
    currentPage: 1,
    itemsPerPage: 50, // Default, will be updated from API response
    offset: 0,
    totalItems: 0,
    hasMore: false
};

// Fetch targets data from FFScouter API
async function fetchTargets(offset = 0) {
    // Get FFScouter API key from localStorage
    const ffscouterApiKey = localStorage.getItem('ffscouter_api_key');
    
    if (!ffscouterApiKey) {
        displayTargetsError('Please configure your FFScouter API key in Settings first.');
        return null;
    }

    try {
        console.log(`Fetching targets with offset: ${offset}`);
        
        // Use FFScouter API endpoint with limit=50
        const url = `https://ffscouter.com/api/v1/get-targets?key=${ffscouterApiKey}&offset=${offset}&limit=50`;
        
        console.log('Fetching targets from FFScouter API with limit=50...');
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Targets data received from FFScouter:', data);
        
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
    const pagination = document.getElementById('targetsPagination');
    
    // Extract targets array from response
    const targets = data?.targets;
    
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
        display.innerHTML = '<p style="text-align: center; color: #c0c0c0;">No targets found.</p>';
        pagination.style.display = 'none';
        return;
    }

    // Get the actual limit from API response parameters (it might be 20, not 50)
    const actualLimit = data?.parameters?.limit || TargetsState.itemsPerPage;
    console.log('API returned limit:', actualLimit, 'Items received:', targets.length);
    
    // Update the itemsPerPage in state to match API's limit
    if (data?.parameters?.limit) {
        TargetsState.itemsPerPage = data.parameters.limit;
    }
    
    // Update state - assume there's more data if we got a full page
    TargetsState.hasMore = targets.length >= actualLimit;
    
    console.log('Has more pages?', TargetsState.hasMore, '(received', targets.length, 'items, limit is', actualLimit, ')');
    
    // Sort targets by fair fight (ascending - lowest first)
    targets.sort((a, b) => {
        const ffA = a.fair_fight || 0;
        const ffB = b.fair_fight || 0;
        return ffA - ffB;
    });
    
    console.log('Targets sorted by fair fight (ascending)');
    
    // Function to generate pagination controls HTML (matching bounties style)
    const generateTargetsPaginationHTML = (isTop = false) => {
        const marginStyle = isTop ? 'margin-bottom: 20px;' : 'margin-top: 20px;';
        let paginationHTML = `<div style="${marginStyle} display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap;">`;
        
        // Previous button
        if (TargetsState.currentPage > 1) {
            paginationHTML += `<button onclick="loadTargetsPage(${TargetsState.currentPage - 1})" style="padding: 8px 16px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; color: #d4af37; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'">Previous</button>`;
        } else {
            paginationHTML += `<button disabled style="padding: 8px 16px; background: rgba(192, 192, 192, 0.1); border: 1px solid rgba(192, 192, 192, 0.2); border-radius: 6px; color: #666; cursor: not-allowed; font-size: 0.95rem; font-weight: 600;">Previous</button>`;
        }
        
        // Page input box
        const inputId = isTop ? 'targetsPageInputTop' : 'targetsPageInputBottom';
        paginationHTML += `<span style="color: #c0c0c0; font-size: 0.95rem; padding: 0 10px; display: flex; align-items: center; gap: 5px;">Page <input type="number" id="${inputId}" value="${TargetsState.currentPage}" min="1" style="width: 60px; padding: 4px 8px; background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 4px; color: #d4af37; font-size: 0.95rem; text-align: center; font-weight: 600;" onkeyup="if(event.key==='Enter') { event.preventDefault(); event.stopPropagation(); handleTargetsPageInput(this); return false; }" onblur="handleTargetsPageInput(this)"></span>`;
        
        // Next button
        if (TargetsState.hasMore) {
            paginationHTML += `<button onclick="loadTargetsPage(${TargetsState.currentPage + 1})" style="padding: 8px 16px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; color: #d4af37; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'">Next</button>`;
        } else {
            paginationHTML += `<button disabled style="padding: 8px 16px; background: rgba(192, 192, 192, 0.1); border: 1px solid rgba(192, 192, 192, 0.2); border-radius: 6px; color: #666; cursor: not-allowed; font-size: 0.95rem; font-weight: 600;">Next</button>`;
        }
        
        paginationHTML += '</div>';
        return paginationHTML;
    };
    
    // Create table with pagination at top and bottom
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

    // Add rows for each target
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
    
    // Hide the old pagination controls (we're using inline pagination now)
    pagination.style.display = 'none';
}

// Update pagination controls
function updatePaginationControls() {
    const prevBtn = document.getElementById('targetsPrevBtn');
    const nextBtn = document.getElementById('targetsNextBtn');
    const currentPageSpan = document.getElementById('targetsCurrentPage');
    
    if (!prevBtn || !nextBtn || !currentPageSpan) {
        console.error('Pagination elements not found');
        return;
    }
    
    console.log('Updating pagination controls:', {
        currentPage: TargetsState.currentPage,
        hasMore: TargetsState.hasMore,
        itemsPerPage: TargetsState.itemsPerPage,
        offset: TargetsState.offset
    });
    
    // Update page number display
    currentPageSpan.textContent = TargetsState.currentPage;
    
    // Disable/enable Previous button
    prevBtn.disabled = TargetsState.currentPage <= 1;
    prevBtn.style.opacity = TargetsState.currentPage <= 1 ? '0.5' : '1';
    prevBtn.style.cursor = TargetsState.currentPage <= 1 ? 'not-allowed' : 'pointer';
    
    // Disable/enable Next button
    nextBtn.disabled = !TargetsState.hasMore;
    nextBtn.style.opacity = !TargetsState.hasMore ? '0.5' : '1';
    nextBtn.style.cursor = !TargetsState.hasMore ? 'not-allowed' : 'pointer';
    
    console.log('Pagination buttons updated - Prev disabled:', prevBtn.disabled, 'Next disabled:', nextBtn.disabled);
}

// Display error message
function displayTargetsError(message) {
    const display = document.getElementById('targetsDisplay');
    const pagination = document.getElementById('targetsPagination');
    
    display.innerHTML = `
        <div class="error-message">
            <strong>Error:</strong> ${escapeHtml(message)}
        </div>
    `;
    
    pagination.style.display = 'none';
}

// Load targets for current page
async function loadTargetsPage(page = null) {
    console.log('=== loadTargetsPage() called ===');
    console.log('Page parameter:', page);
    
    // Use provided page or current page from state
    if (page !== null) {
        TargetsState.currentPage = page;
        TargetsState.offset = (page - 1) * TargetsState.itemsPerPage;
        console.log('Set TargetsState.currentPage to:', page, 'offset:', TargetsState.offset);
    }
    
    const display = document.getElementById('targetsDisplay');
    display.innerHTML = '<p style="text-align: center; color: #d4af37;">Loading targets...</p>';
    
    const data = await fetchTargets(TargetsState.offset);
    
    if (data) {
        displayTargets(data);
    }
}

// Handle page input navigation
function handleTargetsPageInput(pageInput) {
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
        
        console.log('handleTargetsPageInput called');
        console.log('Input element:', inputElement);
        console.log('Input element ID:', inputElement.id);
        console.log('Raw input value:', rawValue);
        console.log('Parsed page:', page);
        console.log('Current page in state:', TargetsState.currentPage);
        
        // Validate the page number
        if (isNaN(page) || page < 1) {
            console.log('Invalid page, resetting to current page');
            inputElement.value = TargetsState.currentPage;
            return;
        }
        
        // Always navigate to the specified page
        console.log('Loading page:', page);
        loadTargetsPage(page);
    }, 0);
}

// Go to next page
async function goToNextPage() {
    console.log('Next page clicked. Current state:', TargetsState);
    
    if (!TargetsState.hasMore) {
        console.log('Cannot go to next page - no more data available');
        return;
    }
    
    await loadTargetsPage(TargetsState.currentPage + 1);
}

// Go to previous page
async function goToPreviousPage() {
    console.log('Previous page clicked. Current state:', TargetsState);
    
    if (TargetsState.currentPage <= 1) {
        console.log('Cannot go to previous page - already on page 1');
        return;
    }
    
    await loadTargetsPage(TargetsState.currentPage - 1);
}

// Initialize targets tab
function initializeTargetsTab() {
    console.log('Initializing Targets tab...');
    
    // Set up pagination button event listeners
    const prevBtn = document.getElementById('targetsPrevBtn');
    const nextBtn = document.getElementById('targetsNextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', goToPreviousPage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', goToNextPage);
    }
    
    console.log('Targets tab initialized');
}

// Load targets when tab is activated
function onTargetsTabActivated() {
    console.log('Targets tab activated');
    
    // Load first page (will reset state automatically)
    loadTargetsPage(1);
}

// Export functions for use in other modules and onclick handlers
if (typeof window !== 'undefined') {
    window.TargetsModule = {
        initialize: initializeTargetsTab,
        onActivated: onTargetsTabActivated,
        refresh: loadTargetsPage,
        goToNext: goToNextPage,
        goToPrevious: goToPreviousPage
    };
}

// Make functions available globally for onclick handlers
window.loadTargetsPage = loadTargetsPage;
window.handleTargetsPageInput = handleTargetsPageInput;
