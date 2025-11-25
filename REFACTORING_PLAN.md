# Code Refactoring Plan

## File Structure
```
TornEliteMonitor/
├── index.html
├── style.css
├── js/
│   ├── config.js          - Constants, API config, global state
│   ├── api.js             - All API fetching functions
│   ├── ui.js              - UI update functions (progress bars, status, money, battle stats)
│   ├── tabs.js            - Tab management
│   ├── stocks.js          - Stocks-related functions
│   ├── bounties.js        - Bounties-related functions
│   ├── worldmap.js        - World map functionality
│   ├── utils.js           - Utility functions (helpers, animations, etc.)
│   └── main.js            - Main initialization and event handlers
└── script.js (to be removed after refactoring)
```

## Module Dependencies
1. config.js - No dependencies (base)
2. api.js - Depends on: config.js
3. ui.js - Depends on: config.js
4. tabs.js - Depends on: config.js, api.js, ui.js, stocks.js, bounties.js, worldmap.js
5. stocks.js - Depends on: config.js, api.js
6. bounties.js - Depends on: config.js, api.js
7. worldmap.js - Depends on: config.js, api.js
8. utils.js - Depends on: config.js
9. main.js - Depends on: all modules

## Loading Order in HTML
1. config.js
2. api.js
3. ui.js
4. utils.js
5. stocks.js
6. bounties.js
7. worldmap.js
8. tabs.js
9. main.js

