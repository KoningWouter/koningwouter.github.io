# Torn Elite Monitor - Codebase Structure

## Overview
Torn Elite Monitor is a premium player intelligence dashboard for the Torn City game.

## File Structure

### Core Files
- **index.html** - Main HTML structure
- **style.css** - Styling and animations
- **favicon.ico** - Site icon

### JavaScript Modules (Load Order)
1. **config.js** - Configuration, constants, and global state
2. **api.js** - API fetching functions (Torn API, FFScouter)
3. **ui.js** - UI update functions (progress bars, status, battle stats)
4. **utils.js** - Utility functions (search, animations, auto-refresh)
5. **stocks.js** - Stock portfolio management
6. **bounties.js** - Bounties listing with pagination
7. **war.js** - War management and opponent tracking
8. **worldmap.js** - Leaflet world map for faction tracking
9. **tabs.js** - Tab navigation logic
10. **main.js** - Application initialization

## Module Dependencies

```
config.js (no dependencies)
  ↓
api.js (depends on: config.js)
  ↓
ui.js (depends on: config.js, api.js)
  ↓
utils.js (depends on: config.js, api.js, ui.js)
  ↓
stocks.js (depends on: config.js, api.js)
bounties.js (depends on: config.js, api.js)
war.js (depends on: config.js, api.js, worldmap.js)
worldmap.js (depends on: config.js, api.js)
  ↓
tabs.js (depends on: all above)
  ↓
main.js (depends on: all above)
```

## Key Features

### Player Info Tab
- Live stats auto-refresh (every 5 seconds)
- Progress bars (Life, Energy, Nerve, Happy)
- Money display (Wallet, Stocks, Faction, Banks)
- Travel information
- Battle stats (Strength, Defense, Dexterity, Speed)
- FFScouter integration

### Stocks Tab
- User's stock portfolio
- Real-time price updates (every 10 seconds)
- Profit/loss calculations
- Collapsible transaction history

### World Map Tab
- Leaflet-based world map
- Faction member tracking
- Live location updates
- Travel status visualization

### Bounties Tab
- Paginated bounty listing
- FFScouter battle stats integration
- Fair fight color coding
- Direct attack links

### War Tab
- War score display
- Live war clock
- Opponent faction members
- World map integration
- Auto-refresh (every 5 seconds)

### Settings Tab
- Torn API key configuration
- FFScouter API key configuration
- LocalStorage persistence

## State Management

Global state is managed through the `State` object in `config.js`:
- `currentUserId` - Currently viewed user
- `currentFactionId` - Currently viewed faction
- `refreshInterval` - Auto-refresh timer
- `cachedBarsData` - Cached user data for reducing API calls
- Stock, bounty, and war-specific state

## API Integration

### Torn API (v2)
- `/user/` - User data endpoint
- `/faction/` - Faction data endpoint  
- `/torn/bounties` - Bounties endpoint
- `/faction/wars` - Wars endpoint
- `/torn/` - General game data endpoint

### FFScouter API
- `/api/v1/get-stats` - Battle stats estimation

## Best Practices

1. **Error Handling**: All API calls should handle errors gracefully
2. **API Rate Limiting**: Batch requests and use delays between calls
3. **Caching**: Reuse fetched data when possible (e.g., cachedBarsData)
4. **Loading States**: Always show loading indicators during API calls
5. **Null Checks**: Always validate API responses before accessing properties
6. **Console Logging**: Keep only essential error logs, remove debug logs
7. **Code Comments**: Use JSDoc for function documentation

## Recent Improvements

- Combined duplicate `/user/` API calls into single requests
- Implemented pagination for bounties with direct page navigation
- Added proper handling for "no war" state when `wars.ranked` is null
- Improved war button highlighting logic
- Added caching to reduce API calls

## Future Improvements

- Add unit tests
- Implement error retry logic
- Add more comprehensive JSDoc comments
- Consider using a state management library
- Add TypeScript for better type safety
