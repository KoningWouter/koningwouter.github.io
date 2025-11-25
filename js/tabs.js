// Tabs Module - Tab management functions
// Depends on: config.js, worldmap.js, stocks.js, bounties.js

// Setup tab functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Stop world map updates when switching away from world map tab
            if (targetTab !== 'world-map') {
                stopWorldMapUpdates();
            }
            
            // Stop stock price updates when switching away from stocks tab
            if (targetTab !== 'stocks') {
                if (State.stockPriceUpdateInterval) {
                    clearInterval(State.stockPriceUpdateInterval);
                    State.stockPriceUpdateInterval = null;
                    console.log('Stock price auto-update stopped');
                }
            }
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            
            if (targetTab === 'search') {
                document.getElementById('searchTab').classList.add('active');
                // Stop world map refresh when switching to another tab
                if (State.worldMapUpdateInterval) {
                    clearInterval(State.worldMapUpdateInterval);
                    State.worldMapUpdateInterval = null;
                    console.log('World map auto-refresh stopped');
                }
            } else if (targetTab === 'player-info') {
                document.getElementById('playerInfoTab').classList.add('active');
                // Stop world map refresh when switching to another tab
                if (State.worldMapUpdateInterval) {
                    clearInterval(State.worldMapUpdateInterval);
                    State.worldMapUpdateInterval = null;
                    console.log('World map auto-refresh stopped');
                }
            } else if (targetTab === 'world-map') {
                const worldMapTab = document.getElementById('worldMapTab');
                if (worldMapTab) {
                    worldMapTab.classList.add('active');
                    console.log('World Map tab activated');
                    
                    // Initialize map if not already initialized, or invalidate size if it exists
                    if (!State.worldMap) {
                        initializeFactionMap();
                    } else {
                        // Invalidate map size when tab becomes visible to ensure proper rendering
                        setTimeout(() => {
                            if (State.worldMap) {
                                State.worldMap.invalidateSize();
                            }
                        }, 100);
                    }
                    
                    // Load faction data when world map tab is opened
                    loadFactionData();
                    
                    // Set up automatic refresh every 1 minute (60000 milliseconds)
                    // Clear any existing interval first
                    if (State.worldMapUpdateInterval) {
                        clearInterval(State.worldMapUpdateInterval);
                    }
                    
                    // Refresh every minute
                    State.worldMapUpdateInterval = setInterval(() => {
                        console.log('Auto-refreshing world map data...');
                        loadFactionData();
                    }, 60000); // 60000ms = 1 minute
                    
                    console.log('World map auto-refresh started (every 1 minute)');
                } else {
                    console.error('World Map tab element not found');
                }
            } else if (targetTab === 'faction-map') {
                const factionMapTab = document.getElementById('factionMapTab');
                factionMapTab.classList.add('active');
                
                // Stop world map refresh when switching to another tab
                if (State.worldMapUpdateInterval) {
                    clearInterval(State.worldMapUpdateInterval);
                    State.worldMapUpdateInterval = null;
                    console.log('World map auto-refresh stopped');
                }
            } else if (targetTab === 'settings') {
                const settingsTab = document.getElementById('settingsTab');
                if (settingsTab) {
                    settingsTab.classList.add('active');
                    console.log('Settings tab activated');
                } else {
                    console.error('Settings tab element not found');
                }
            } else if (targetTab === 'docs') {
                const docsTab = document.getElementById('docsTab');
                if (docsTab) {
                    docsTab.classList.add('active');
                    console.log('Docs tab activated');
                } else {
                    console.error('Docs tab element not found');
                }
            } else if (targetTab === 'stocks') {
                const stocksTab = document.getElementById('stocksTab');
                if (stocksTab) {
                    stocksTab.classList.add('active');
                    console.log('Stocks tab activated');
                    // Load stock data when tab is activated
                    loadStocksData();
                } else {
                    console.error('Stocks tab element not found');
                }
            } else if (targetTab === 'bounties') {
                const bountiesTab = document.getElementById('bountiesTab');
                if (bountiesTab) {
                    bountiesTab.classList.add('active');
                    console.log('Bounties tab activated');
                    // Load bounties data when tab is activated
                    loadBountiesData();
                } else {
                    console.error('Bounties tab element not found');
                }
            } else if (targetTab === 'war') {
                const warTab = document.getElementById('warTab');
                if (warTab) {
                    warTab.classList.add('active');
                    console.log('War tab activated');
                    
                    // Invalidate map size when tab becomes visible
                    setTimeout(() => {
                        if (State.warMap) {
                            State.warMap.invalidateSize();
                        }
                    }, 100);
                    
                    // Load war data when tab is activated
                    loadWarData();
                    // Start war map auto-refresh
                    startWarMapUpdates();
                } else {
                    console.error('War tab element not found');
                }
            } else {
                // Stop war map updates when switching away from war tab
                stopWarMapUpdates();
            }
        });
    });
}


