# Code Refactoring Guide
# test
# test 2

## Overview
The `script.js` file (4295 lines) is being refactored into multiple modular files for better maintainability and readability.

## Module Structure

### 1. `js/config.js` ✅ Created
- Constants (API_BASE_URL, API_ENDPOINTS, SELECTOR_DESCRIPTIONS)
- Global state variables (State object)
- Torn cities data
- No dependencies

### 2. `js/api.js` (To be created)
- `getApiKey()` - Get API key from input or localStorage
- `fetchUserData()` - Fetch user data from API
- `fetchBarsData()` - Fetch bars data for quick refresh
- `fetchStatusData()` - Fetch status data
- `fetchFactionData()` - Fetch faction data
- `fetchUserLocation()` - Fetch user location
- `fetchStockNames()` - Fetch stock names
- `updateStockPrices()` - Update stock prices
- Depends on: config.js

### 3. `js/ui.js` (To be created)
- `updateProgressBars()` - Update all progress bars
- `updateBattleStats()` - Update battle stats
- `updateStatus()` - Update status display
- `updateProgressBar()` - Update individual progress bar
- `startTravelCountdown()` - Start travel countdown
- `stopTravelCountdown()` - Stop travel countdown
- `updateTravelCountdown()` - Update travel countdown display
- `displayUserInfo()` - Display user information
- `createInfoItem()` - Create info item HTML
- `showError()` - Show error message
- Depends on: config.js, api.js

### 4. `js/tabs.js` (To be created)
- `setupTabs()` - Setup tab navigation
- Depends on: config.js, api.js, ui.js, stocks.js, bounties.js, worldmap.js

### 5. `js/stocks.js` (To be created)
- `loadStocksData()` - Load and display stocks data
- `toggleTransactions()` - Toggle transactions visibility
- Depends on: config.js, api.js

### 6. `js/bounties.js` (To be created)
- `loadBountiesData()` - Load and display bounties data
- Depends on: config.js, api.js

### 7. `js/worldmap.js` (To be created)
- All world map related functions
- Depends on: config.js, api.js

### 8. `js/utils.js` (To be created)
- Utility functions (search, animations, etc.)
- Depends on: config.js

### 9. `js/main.js` (To be created)
- Main initialization
- DOMContentLoaded event handler
- Depends on: all modules

## HTML Loading Order
```html
<script src="js/config.js"></script>
<script src="js/api.js"></script>
<script src="js/ui.js"></script>
<script src="js/utils.js"></script>
<script src="js/stocks.js"></script>
<script src="js/bounties.js"></script>
<script src="js/worldmap.js"></script>
<script src="js/tabs.js"></script>
<script src="js/main.js"></script>
```

## Migration Steps
1. ✅ Create js/config.js
2. Create js/api.js with API functions
3. Create js/ui.js with UI update functions
4. Create js/utils.js with utility functions
5. Create js/stocks.js with stocks functions
6. Create js/bounties.js with bounties functions
7. Create js/worldmap.js with world map functions
8. Create js/tabs.js with tab management
9. Create js/main.js with initialization
10. Update index.html to load modules
11. Test the application
12. Remove old script.js (or keep as backup)

## Notes
- All global variables should be moved to State object in config.js
- Functions should be organized by their primary responsibility
- Dependencies should be clearly defined
- Test after each module is created

