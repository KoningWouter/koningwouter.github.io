# Targets Tab - Implementation Guide

## Overview
A new "Targets" tab has been added to the Torn Elite Monitor, positioned before the "Bounties" tab. This tab displays targets data from the `/api/v1/get-targets` endpoint in a paginated table format.

## Features

### 1. **Tab Navigation**
- New tab button with 🎯 icon labeled "Targets"
- Positioned between "Stocks" and "Bounties" tabs
- Bounties tab icon changed to 💰 to differentiate

### 2. **Data Display**
The targets are displayed in a responsive, styled table with the following columns:
- **Name**: Player name (bold, cream color) - Click to view profile
- **Level**: Player level
- **Fair Fight**: Fair fight multiplier (gold color) - **Table is sorted by this column (lowest first)**
- **Battle Stats**: Estimated battle stats in human-readable format (e.g., "2.27b", "1.48m", "62.4k")
- **Last Action**: Relative time since last action (e.g., "5 days ago", "2 hours ago")
- **Actions**: Two action icons:
  - 👤 **Profile Icon** (gold) - Opens player's Torn profile
  - ⚔️ **Attack Icon** (red) - Opens attack page for this player

**Filtering:** Targets are filtered **server-side by the API** using `minff=2.00` and `maxff=3.00` parameters to show only players with fair fight values between 2.00 and 3.00.

**Sorting:** The targets are automatically sorted by Fair Fight in ascending order (lowest values at the top) to help you find the easiest targets first.

### 3. **Pagination**
- **Pagination controls displayed at both TOP and BOTTOM** of the table for convenience
- **Previous Button**: Navigate to previous page (disabled on first page)
- **Page Input Field**: Type any page number and press Enter or blur to jump directly to that page
- **Next Button**: Navigate to next page (disabled when API returns fewer items than the page size)
- Pagination uses the `offset` parameter for API calls
- Page size: Determined by the API's default limit (typically 20 items per page)
- "Has more" is determined by checking if the API returned a full page
- Both top and bottom pagination controls are fully synchronized

### 4. **Interactive Features**
- Automatic sorting by Fair Fight (lowest to highest) for easier target selection
- Click any row cell to open the player's Torn profile in a new tab
- 👤 **Profile icon** - Opens player's profile page
- ⚔️ **Attack icon** - Opens attack page ready to attack this player
- **Direct page navigation** - Type any page number in the input field and press Enter
- Hover effects on rows and buttons for better UX
- Tooltips on action icons

### 5. **Mobile Responsive**
- Table scrolls horizontally on small screens
- Pagination buttons maintain 44px minimum tap targets
- Responsive button sizing and spacing
- Optimized for both portrait and landscape orientations

## Technical Implementation

### Files Created
1. **`js/targets.js`** - Main targets module with:
   - `fetchTargets(offset)` - Fetches targets from API with minff/maxff filtering
   - `displayTargets(data)` - Renders table with inline pagination controls (sorting by fair fight)
   - `generateTargetsPaginationHTML()` - Generates pagination HTML (inline function)
   - `updatePaginationControls()` - Updates pagination UI (legacy, kept for compatibility)
   - `goToNextPage()` / `goToPreviousPage()` - Navigation functions
   - `initializeTargetsTab()` - Sets up event listeners
   - `onTargetsTabActivated()` - Called when tab is activated

### Files Modified

1. **`index.html`**
   - Added targets tab button before bounties
   - Added targets tab content section with table display
   - Added pagination controls container (now hidden, pagination is dynamically generated)
   - Included `targets.js` script tag

2. **`js/tabs.js`**
   - Added targets tab case in tab switching logic
   - Calls `TargetsModule.onActivated()` when tab is opened

3. **`js/main.js`**
   - Added targets module initialization in DOMContentLoaded
   - Updated module dependencies comment

4. **`style.css`**
   - Added pagination control styles
   - Mobile-responsive pagination adjustments
   - Button hover and disabled states

## API Integration

### Endpoint
**FFScouter API** (same as used in the War panel)
```
GET https://ffscouter.com/api/v1/get-targets?key={ffscouterApiKey}&offset={offset}&minff=2.00&maxff=3.00
```

**Parameters:**
- `key` - Your FFScouter API key
- `offset` - Pagination offset (increments based on API's default limit)
- `minff` - Minimum fair fight value (2.00)
- `maxff` - Maximum fair fight value (3.00)

**Filtering:** The API filters targets server-side using the `minff` and `maxff` parameters to return only players with fair fight values between 2.00 and 3.00.

**Note:** This uses your **FFScouter API key**, not your Torn API key.

### Expected Response Format
The API returns an object containing parameters and a targets array:

```json
{
  "parameters": {
    "limit": 20,
    "preset": null,
    "key": "UMwAl1idzIBEtUnO",
    "generated_at": 1764922910
  },
  "targets": [
    {
      "player_id": 3339089,
      "name": "musawenkos",
      "level": 1,
      "fair_fight": 1.05,
      "bss_public": 13,
      "bss_public_timestamp": 1762000780,
      "bs_estimate": 44,
      "bs_estimate_human": "44",
      "last_action": 1719521113
    },
    {
      "player_id": 1919908,
      "name": "dSp",
      "level": 70,
      "fair_fight": 298.55,
      "bss_public": 75429,
      "bss_public_timestamp": 1762144291,
      "bs_estimate": 1479278851,
      "bs_estimate_human": "1.48b",
      "last_action": 1764171136
    }
  ]
}
```

**Response Structure:**
- `parameters` - Object containing request metadata
  - `limit` - Number of results per page (API's default, typically 20)
  - `preset` - Preset filter used (null when no preset is specified)
  - `key` - API key used (obscured)
  - `generated_at` - Unix timestamp when response was generated
- `targets` - Array of target objects (pre-filtered by API using minff/maxff parameters)

**Each target contains:**
- `player_id` - Player's Torn ID
- `name` - Player name
- `level` - Player level
- `fair_fight` - Fair fight multiplier
- `bss_public` - Public battle stats score
- `bss_public_timestamp` - When the public stats were recorded
- `bs_estimate` - Raw battle stats estimate
- `bs_estimate_human` - Human-readable format (e.g., "2.27b", "1.48m", "62.4k")
- `last_action` - Unix timestamp of last action

## State Management

The module maintains its own state in `TargetsState`:
```javascript
{
  currentPage: 1,
  itemsPerPage: 20,  // Default (API's typical limit), updated from API response parameters
  offset: 0,         // Increments based on itemsPerPage (0, 20, 40, 60...)
  totalItems: 0,
  hasMore: false     // True if we received a full page of items
}
```

## Usage

### For Users
1. Navigate to the **Settings** tab
2. Enter your **FFScouter API key** (not Torn API key)
3. Click **Save All**
4. Navigate to the **Targets** tab
5. View targets in the table (sorted by Fair Fight, lowest first)
6. Navigate pages using:
   - **Previous/Next buttons** - Step through pages sequentially
   - **Page input field** - Type any page number and press Enter to jump directly
7. Click any row to view the player's profile
8. Use action icons:
   - 👤 to view profile
   - ⚔️ to attack player

**Important:** The Targets tab uses the **FFScouter API**, so you need to configure your FFScouter API key in Settings.

### For Developers

#### Refresh Targets Manually
```javascript
if (window.TargetsModule) {
    window.TargetsModule.refresh();
}
```

#### Access Targets State
```javascript
// Current page
console.log(TargetsState.currentPage);

// Total items
console.log(TargetsState.totalItems);
```

## Styling

### Table Styling
- Uses existing `faction-members-table` styles for consistency
- Full height display (no vertical scrolling within table)
- Table extends naturally down the page
- Horizontal scrolling enabled for mobile when needed
- Page scrolls naturally to accommodate all rows

### Column Colors
- **Name** - Cream (#f4e4bc) with bold weight
- **Fair Fight** - Gold (#ffd700)
- **Battle Stats** - Gold (#d4af37) with bold weight
- **Last Action** - Light gray (#c0c0c0)
- **Actions Icons**:
  - 👤 Profile icon - Gold (#d4af37)
  - ⚔️ Attack icon - Crimson red (#dc143c)

### Pagination Buttons
- Gold gradient background matching site theme
- Hover effects with transform and glow
- Disabled state with reduced opacity
- Minimum 44px height for accessibility

## Error Handling

### No FFScouter API Key
```
"Please configure your FFScouter API key in Settings first."
```

### API Error
```
"Failed to fetch targets: [error message]"
```

### No Data
```
"No targets found."
```

## Mobile Optimizations

### Tablet (< 768px)
- Pagination buttons: 8px padding, 0.75rem font
- Page info: 0.85rem font
- Action icons: 1.4rem font size with 44x44px minimum tap area
- Maintained functionality and readability

### Small Phones (< 480px)
- Pagination buttons: 8px × 12px padding, 0.7rem font
- Page info: 0.75rem font
- Action icons: 1.3rem font size, still maintaining good tap targets
- Reduced spacing while maintaining tap targets

### Table Behavior
- Horizontal scroll enabled on mobile
- Non-wrapping cells for data integrity
- Touch-friendly scrolling with `-webkit-overflow-scrolling: touch`

## Future Enhancements

Consider adding:
- [ ] Search/filter functionality
- [x] Sort by Fair Fight (lowest first) - **IMPLEMENTED**
- [x] Direct page navigation via input field - **IMPLEMENTED**
- [x] API-side fair fight filtering (minff=2.00, maxff=3.00) - **IMPLEMENTED**
- [ ] User-configurable fair fight range (add min/max inputs in UI to adjust minff/maxff)
- [ ] Toggle sort direction or sort by other columns (name, level, battle stats)
- [ ] Adjustable page size (if API supports limit parameter)
- [ ] Export to CSV
- [ ] Refresh button for manual updates
- [ ] Auto-refresh interval
- [ ] Favorite/bookmark targets
- [ ] Quick actions (attack, trade, message)
- [ ] Bulk selection and operations

## Troubleshooting

### Targets not loading
1. Check **FFScouter API key** is configured in Settings (not Torn API key)
2. Verify FFScouter API endpoint is accessible
3. Check browser console for errors
4. Ensure FFScouter API key is valid and active
5. Check your FFScouter account has access to the targets endpoint

### Pagination not working
1. Check if API is returning the `targets` array in the response object
2. Verify `offset` parameter is being sent correctly
3. Check console logs for errors
4. Ensure the API returns an object with a `targets` field containing the array

### Styling issues on mobile
1. Clear browser cache
2. Test in device mode in Chrome DevTools
3. Verify responsive CSS is loaded

## Testing Checklist

- [ ] Tab switches correctly
- [ ] Data loads on tab activation
- [ ] Table displays all columns (Name, Level, Fair Fight, Battle Stats, Last Action, Actions)
- [ ] **Player ID column removed** ✅
- [ ] **Table is sorted by Fair Fight (lowest to highest)**
- [ ] Clicking any row cell opens profile in new tab
- [ ] 👤 Profile icon opens profile page correctly
- [ ] ⚔️ Attack icon opens attack page with correct player ID
- [ ] Icons have tooltips on hover
- [ ] Column colors display correctly (gold for fair fight and battle stats)
- [ ] Last action timestamps convert to relative time correctly
- [ ] **Pagination controls appear at both top and bottom of table** ✅
- [ ] Previous button disabled on page 1 (both top and bottom)
- [ ] Next button enabled when full page of items returned
- [ ] Next button disabled when partial page returned (last page)
- [ ] **Page input field allows typing custom page number** ✅
- [ ] **Pressing Enter in page input navigates to that page** ✅
- [ ] **Blurring page input navigates to that page** ✅
- [ ] Invalid page numbers reset to current page
- [ ] Both top and bottom pagination controls work identically
- [ ] Both page inputs stay synchronized
- [ ] Offset increments correctly based on page size
- [ ] **Targets are filtered by API (minff=2.00, maxff=3.00)** ✅
- [ ] All displayed targets have fair fight between 2.00 and 3.00
- [ ] Filtering works correctly across pagination
- [ ] Mobile layout works properly (horizontal scroll)
- [ ] Error messages display correctly
- [ ] Loading state shows while fetching
