// World Map Module - World map functionality
// Depends on: config.js, api.js, ui.js

// Initialize world map with Leaflet
async function initializeFactionMap() {
    if (State.mapInitInProgress) {
        return;
    }
    
    const mapContainer = document.getElementById('worldMap');
    
    if (!mapContainer) {
        console.error('World map container not found');
        return;
    }
    
    if (!State.worldMap) {
        State.mapInitInProgress = true;
        
        try {
            // Wait a bit for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if Leaflet is loaded
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }
            
            // Initialize Leaflet map with dark theme
            State.worldMap = L.map('worldMap', {
                center: [0, 0],
                zoom: 2,
                zoomControl: true,
                attributionControl: false,
                minZoom: 2,
                maxZoom: 10,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                keyboard: true,
                dragging: true
            });
            
            // Add dark theme tile layer (CartoDB Dark Matter)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(State.worldMap);
            
            // Wait for map to be ready, then invalidate size
            State.worldMap.whenReady(() => {
                setTimeout(() => {
                    if (State.worldMap) {
                        State.worldMap.invalidateSize();
                    }
                }, 100);
            });
            
            // Add Torn city markers
            addTornCityMarkers();
            
            // Add dashed lines from Torn to other cities
            addTornCityLines();
            
            State.mapInitRetryCount = 0;
            State.mapInitInProgress = false;
            
            console.log('World map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
            State.mapInitRetryCount = 0;
            State.mapInitInProgress = false;
        }
    } else {
        // Map already exists, just invalidate size
        if (State.worldMap) {
            setTimeout(() => {
                State.worldMap.invalidateSize();
            }, 100);
        }
    }
}

// Add Torn city markers to the map with flashing animation
function addTornCityMarkers() {
    if (!State.worldMap) return;
    
    // Clear existing markers
    State.tornCityMarkers.forEach(marker => State.worldMap.removeLayer(marker));
    State.tornCityMarkers = [];
    
    // Clear existing lines
    State.tornCityLines.forEach(line => State.worldMap.removeLayer(line));
    State.tornCityLines = [];
    
    // Remove duplicates
    const uniqueCities = [];
    const seenCoords = new Set();
    
    tornCities.forEach(city => {
        const key = `${city.coords[0]},${city.coords[1]}`;
        if (!seenCoords.has(key)) {
            seenCoords.add(key);
            uniqueCities.push(city);
        }
    });
    
    // Create custom gold icon with flashing animation
    uniqueCities.forEach((city, index) => {
        const goldIcon = L.divIcon({
            className: 'torn-city-marker',
            html: `
                <div class="marker-pulse" style="animation-delay: ${index * 0.1}s;">
                    <div class="marker-glow"></div>
                    <div class="marker-core"></div>
                </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        const marker = L.marker(city.coords, { icon: goldIcon })
            .addTo(State.worldMap)
            .bindPopup(`<strong>${city.name}</strong><br>Torn Travel Destination`);
        
        State.tornCityMarkers.push(marker);
    });
}

// Add dashed lines from Torn to all other cities
function addTornCityLines() {
    if (!State.worldMap) return;
    
    // Find Torn's coordinates
    const tornCity = tornCities.find(city => city.name === 'Torn');
    if (!tornCity) return;
    
    const tornCoords = tornCity.coords;
    
    // Draw lines from Torn to all other cities
    tornCities.forEach(city => {
        // Skip Torn itself
        if (city.name === 'Torn') return;
        
        // Create thin, subtle dashed polyline from Torn to this city
        const line = L.polyline([tornCoords, city.coords], {
            color: '#d4af37',
            weight: 1, // Thin line
            opacity: 0.25, // Very subtle/low opacity
            dashArray: '5, 5', // Small dashes
            interactive: false
        }).addTo(State.worldMap);
        
        State.tornCityLines.push(line);
    });
}

// Setup faction ID input and button
function setupFactionIdInput() {
    const factionIdInput = document.getElementById('factionIdInput');
    const loadFactionBtn = document.getElementById('loadFactionBtn');
    
    if (!factionIdInput || !loadFactionBtn) {
        console.error('Faction ID input or button not found');
        return;
    }
    
    // Handle button click
    loadFactionBtn.addEventListener('click', () => {
        const factionId = factionIdInput.value.trim();
        if (!factionId) {
            alert('Please enter a faction ID');
            return;
        }
        
        if (!/^\d+$/.test(factionId)) {
            alert('Faction ID must be a number');
            return;
        }
        
        loadFactionMembersById(factionId);
    });
    
    // Handle Enter key
    factionIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadFactionBtn.click();
        }
    });
}

// Load faction data - checks if faction ID is set, otherwise loads user's faction
function loadFactionData() {
    const factionIdInput = document.getElementById('factionIdInput');
    const factionId = factionIdInput ? factionIdInput.value.trim() : '';
    
    if (factionId && /^\d+$/.test(factionId)) {
        // Faction ID is set, load that faction
        console.log('Loading faction data for ID:', factionId);
        loadFactionMembersById(factionId);
    } else {
        // No faction ID set, load my faction
        console.log('Loading my faction data');
        loadUserStatus();
    }
}

// Load faction members and display on map
async function loadFactionMembers() {
    console.log('=== loadFactionMembers() CALLED ===');
    console.log('currentFactionId:', State.currentFactionId);
    
    const mapLoading = document.getElementById('mapLoading');
    const mapError = document.getElementById('mapError');
    
    // Always hide loading after a short delay to show the map
    if (mapLoading) {
        setTimeout(() => {
            mapLoading.classList.add('hidden');
        }, 1000);
    }
    
    // Check if we have a faction ID
    if (!State.currentFactionId) {
        console.log('No currentFactionId, returning early');
        if (mapError) {
            mapError.classList.remove('hidden');
            mapError.textContent = 'No faction found. Please search for a user who is in a faction.';
        }
        // Map is still visible, just no markers
        return;
    }
    
    try {
        console.log('=== Starting to fetch faction members ===');
        console.log('Loading faction members for faction ID:', State.currentFactionId);
        
        // Fetch faction members from /faction/members endpoint
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('API key is not configured. Please enter your API key in the Settings tab.');
        }
        
        const membersUrl = `${API_BASE_URL}/faction/members?key=${apiKey}`;
        console.log('Fetching faction members from URL:', membersUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const membersResponse = await fetch(membersUrl);
        const membersData = await membersResponse.json();
        
        console.log('Faction members API response status:', membersResponse.status);
        console.log('Faction members API response data:', membersData);
        
        if (membersData.error) {
            console.error('Faction members API Error:', membersData.error);
            throw new Error(membersData.error.error || 'API Error: ' + JSON.stringify(membersData.error));
        }
        
        // Also fetch faction data for backward compatibility with existing code
        const factionData = await fetchFactionData(State.currentFactionId, 'basic,members');
        console.log('Faction data received:', factionData);
        
        if (!factionData.members) {
            console.error('No members property in faction data:', factionData);
            throw new Error('No members found in faction data');
        }
        
        // Handle different response formats (object with IDs as keys, or array)
        let membersToProcess = [];
        
        if (Array.isArray(factionData.members)) {
            membersToProcess = factionData.members.map((member, index) => ({
                id: member.id || member.user_id || index.toString(),
                data: member
            }));
        } else if (typeof factionData.members === 'object' && factionData.members !== null) {
            const memberIds = Object.keys(factionData.members);
            membersToProcess = memberIds.map(memberId => ({
                id: memberId,
                data: factionData.members[memberId]
            }));
        } else {
            throw new Error('Unexpected members data format: ' + typeof factionData.members);
        }
        
        if (membersToProcess.length === 0) {
            throw new Error('No members found in faction');
        }
        
        // Store member data for display
        State.factionMembersData = [];
        
        membersToProcess.forEach(({ id, data: memberData }) => {
            let memberName = `Member ${id}`;
            let memberStatus = 'Unknown';
            
            if (typeof memberData === 'object' && memberData !== null) {
                memberName = memberData.name || 
                            memberData.player_name || 
                            memberData.username || 
                            memberData.player_id || 
                            (memberData.id ? `User ${memberData.id}` : null) ||
                            memberName;
                if (memberData.status) {
                    memberStatus = typeof memberData.status === 'object' 
                        ? (memberData.status.state || memberData.status.description || memberData.status || 'Unknown')
                        : memberData.status;
                }
            } else if (typeof memberData === 'string') {
                memberName = memberData;
            } else if (typeof memberData === 'number') {
                memberName = `User ${memberData}`;
            }
            
            if (memberName === `Member ${id}` && id) {
                memberName = `User ${id}`;
            }
            
            State.factionMembersData.push({
                id: id,
                name: memberName,
                status: memberStatus,
                location: 'Torn City',
                profile: null
            });
        });
        
        if (mapLoading) mapLoading.classList.add('hidden');
        if (mapError) mapError.classList.add('hidden');
        
    } catch (error) {
        console.error('Error loading faction members:', error);
        if (mapLoading) mapLoading.classList.add('hidden');
        if (mapError) {
            mapError.classList.remove('hidden');
            mapError.textContent = `Error loading faction members: ${error.message}`;
        }
    }
}

// Load and display username and status.description from /faction/members endpoint
async function loadUserStatus() {
    console.log('=== loadUserStatus() called ===');
    
    const statusDisplay = document.getElementById('userStatusDisplay');
    if (!statusDisplay) {
        console.error('User status display element not found in DOM');
        return;
    }
    
    // Show loading state
    statusDisplay.textContent = 'Loading user status...';
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured');
        statusDisplay.textContent = 'API key not configured. Please enter your API key in the Settings tab.';
        return;
    }
    
    try {
        const membersUrl = `${API_BASE_URL}/faction/members?key=${apiKey}`;
        console.log('Fetching faction members from URL:', membersUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const membersResponse = await fetch(membersUrl);
        
        if (!membersResponse.ok) {
            throw new Error(`HTTP error! status: ${membersResponse.status}`);
        }
        
        const membersData = await membersResponse.json();
        
        if (membersData.error) {
            statusDisplay.textContent = `Error: ${membersData.error.error || JSON.stringify(membersData.error)}`;
            return;
        }
        
        // Handle the API response structure
        let membersArray = [];
        if (membersData.members && Array.isArray(membersData.members)) {
            membersArray = membersData.members;
        } else if (Array.isArray(membersData)) {
            membersArray = membersData;
        } else {
            membersArray = Object.values(membersData);
        }
        
        if (membersArray.length === 0) {
            statusDisplay.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">No members found</p>';
        } else {
            // Sort members by name
            const sortedMembers = membersArray.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            
            // Create table
            let html = '<table style="width: 100%; border-collapse: collapse;">';
            html += '<thead>';
            html += '<tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">';
            html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Username</th>';
            html += '<th style="padding: 12px; text-align: left; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Travel Status</th>';
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';
            
            sortedMembers.forEach(member => {
                const username = member.name || `User ${member.id || 'Unknown'}`;
                
                let statusDescription = '';
                if (member.status) {
                    if (typeof member.status === 'string') {
                        statusDescription = member.status;
                    } else if (typeof member.status === 'object' && member.status.description) {
                        statusDescription = member.status.description;
                    }
                }
                
                html += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
                html += `<td style="padding: 12px; color: #f4e4bc; font-size: 1rem;">${username}</td>`;
                html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem;">${statusDescription || 'No status'}</td>`;
                html += '</tr>';
            });
            
            html += '</tbody>';
            html += '</table>';
            statusDisplay.innerHTML = html;
        }
        
        // Update online players in Torn window
        updateOnlinePlayersInTorn(membersArray);
        
        // Place markers at Torn city for each user
        createMarkersFromMembers(membersArray);
    } catch (error) {
        console.error('Error loading user status:', error);
        statusDisplay.textContent = `Error loading user status: ${error.message}`;
    }
}

// Create markers on world map from members array (reusable function)
function createMarkersFromMembers(membersArray) {
    if (!State.worldMap || !membersArray || membersArray.length === 0) {
        return;
    }
    
    // Clear existing user markers and count marker
    if (State.factionMarkers && State.factionMarkers.length > 0) {
        State.factionMarkers.forEach(marker => {
            if (State.worldMap.hasLayer(marker)) {
                State.worldMap.removeLayer(marker);
            }
        });
        State.factionMarkers = [];
    }
    
    // Remove existing Torn count marker
    if (State.tornCountMarker) {
        if (State.worldMap.hasLayer(State.tornCountMarker)) {
            State.worldMap.removeLayer(State.tornCountMarker);
        }
        State.tornCountMarker = null;
    }
    
    // Get Torn city coordinates
    const tornCoords = getCityCoordinates('Torn');
    if (!tornCoords) {
        console.error('Could not find Torn city coordinates');
        return;
    }
    
    let usersInTorn = 0;
    let usersNotInTorn = [];
    
    // Separate users by status
    membersArray.forEach(member => {
        const username = member.name || `User ${member.id || 'Unknown'}`;
        
        let statusDescription = '';
        if (member.status) {
            if (typeof member.status === 'string') {
                statusDescription = member.status;
            } else if (typeof member.status === 'object' && member.status.description) {
                statusDescription = member.status.description;
            }
        }
        
        // Check if user is in Torn (status is "Okay", "Hospitalized", or "In hospital for x mins")
        const statusLower = (statusDescription || '').toLowerCase();
        if (statusDescription === 'Okay' || 
            statusLower === 'hospitalized' || 
            statusLower.includes('in hospital')) {
            usersInTorn++;
        } else {
            usersNotInTorn.push({ member, username, statusDescription });
        }
    });
    
    // Create count marker at Torn city if there are users in Torn
    if (usersInTorn > 0) {
        const countIcon = L.divIcon({
            className: 'faction-member-marker',
            html: `
                <div class="marker-container">
                    <div class="marker-dot" style="background: #dc143c; border-color: #ff6b6b; box-shadow: 0 0 10px rgba(220, 20, 60, 0.8), 0 0 20px rgba(220, 20, 60, 0.5);"></div>
                    <div class="marker-label">${usersInTorn} in Torn</div>
                </div>
            `,
            iconSize: [100, 30],
            iconAnchor: [50, 15]
        });
        
        State.tornCountMarker = L.marker(tornCoords, { icon: countIcon })
            .addTo(State.worldMap)
            .bindPopup(`
                <div class="marker-popup">
                    <strong>Players in Torn</strong><br>
                    <span>${usersInTorn} player${usersInTorn !== 1 ? 's' : ''} currently in Torn City</span>
                </div>
            `);
    }
    
    // Create individual markers for users NOT in Torn based on their status
    const markerDataArray = [];
    
    usersNotInTorn.forEach((userData) => {
        const { member, username, statusDescription } = userData;
        
        let markerCoordinates = null;
        let markerColor = '#dc143c';
        let markerBorderColor = '#ff6b6b';
        let markerShadow = 'rgba(220, 20, 60, 0.8)';
        let markerShadow2 = 'rgba(220, 20, 60, 0.5)';
        
        const statusLower = (statusDescription || '').toLowerCase().trim();
        
        // Check if status starts with "In a <landname> hospital"
        if (statusLower.startsWith('in a ') && statusLower.includes('hospital')) {
            const hospitalMatch = statusDescription.match(/in a\s+([a-z]+)\s+hospital/i);
            if (hospitalMatch && hospitalMatch[1]) {
                const landname = hospitalMatch[1].trim();
                let locationName = landname;
                if (landname.toLowerCase() === 'chinese') {
                    locationName = 'China';
                } else if (landname.toLowerCase() === 'swiss') {
                    locationName = 'Switzerland';
                } else if (landname.toLowerCase() === 'british' || landname.toLowerCase() === 'uk') {
                    locationName = 'United Kingdom';
                } else if (landname.toLowerCase() === 'south african') {
                    locationName = 'South Africa';
                } else if (landname.toLowerCase() === 'united arab emirates' || landname.toLowerCase() === 'uae') {
                    locationName = 'UAE';
                } else {
                    locationName = landname.charAt(0).toUpperCase() + landname.slice(1).toLowerCase();
                }
                markerCoordinates = getCityCoordinates(locationName);
                console.log(`User ${username} is in a ${landname} hospital (${locationName}) - placing red marker`);
            }
        }
        // Check if status starts with "In <landname>"
        else if (statusLower.startsWith('in ')) {
            const landname = statusDescription.substring(3).trim();
            markerCoordinates = getCityCoordinates(landname);
            console.log(`User ${username} is in ${landname} - placing red marker`);
        }
        // Check if status contains "Returning to Torn"
        else if (statusLower.includes('returning to torn')) {
            const originMatch = statusDescription.match(/returning to torn from\s+(.+)/i);
            if (originMatch && originMatch[1]) {
                const originLocation = originMatch[1].trim();
                const originCoords = getCityCoordinates(originLocation);
                
                if (originCoords && tornCoords) {
                    markerCoordinates = getMidpointCoordinates(originCoords, tornCoords);
                    markerColor = '#4169e1';
                    markerBorderColor = '#6495ed';
                    markerShadow = 'rgba(65, 105, 225, 0.8)';
                    markerShadow2 = 'rgba(65, 105, 225, 0.5)';
                    console.log(`User ${username} is returning to Torn from ${originLocation} - placing blue marker at midpoint`);
                }
            }
        }
        // Check if status contains "Traveling to <LandName>" or "Travelling to <LandName>"
        else if (statusLower.includes('traveling to ') || statusLower.includes('travelling to ')) {
            const destMatch = statusDescription.match(/travell?ing to\s+(.+)/i);
            if (destMatch && destMatch[1]) {
                const destination = destMatch[1].trim();
                const destCoords = getCityCoordinates(destination);
                
                if (destCoords && tornCoords) {
                    markerCoordinates = getMidpointCoordinates(tornCoords, destCoords);
                    markerColor = '#00ff00';
                    markerBorderColor = '#32cd32';
                    markerShadow = 'rgba(0, 255, 0, 0.8)';
                    markerShadow2 = 'rgba(0, 255, 0, 0.5)';
                    console.log(`User ${username} is traveling to ${destination} - placing green marker at midpoint`);
                }
            }
        }
        
        // Only add marker data if we have valid coordinates
        if (markerCoordinates) {
            markerDataArray.push({
                coordinates: markerCoordinates,
                username: username,
                memberId: member.id,
                statusDescription: statusDescription,
                markerColor: markerColor,
                markerBorderColor: markerBorderColor,
                markerShadow: markerShadow,
                markerShadow2: markerShadow2
            });
        }
    });
    
    // Stack overlapping labels by grouping markers at same location
    const locationGroups = new Map();
    const tolerance = 0.001;
    
    // First pass: group markers by location
    markerDataArray.forEach((markerData) => {
        const lat = markerData.coordinates[0];
        const lng = markerData.coordinates[1];
        
        let foundGroup = false;
        for (const [key, group] of locationGroups.entries()) {
            const [groupLat, groupLng] = key.split(',').map(Number);
            const latDiff = Math.abs(lat - groupLat);
            const lngDiff = Math.abs(lng - groupLng);
            
            if (latDiff < tolerance && lngDiff < tolerance) {
                group.push(markerData);
                foundGroup = true;
                break;
            }
        }
        
        if (!foundGroup) {
            locationGroups.set(`${lat},${lng}`, [markerData]);
        }
    });
    
    // Second pass: calculate offsets and create markers
    markerDataArray.forEach((markerData) => {
        let verticalOffset = 0;
        
        for (const [key, group] of locationGroups.entries()) {
            const [groupLat, groupLng] = key.split(',').map(Number);
            const latDiff = Math.abs(markerData.coordinates[0] - groupLat);
            const lngDiff = Math.abs(markerData.coordinates[1] - groupLng);
            
            if (latDiff < tolerance && lngDiff < tolerance) {
                const groupIndex = group.findIndex(m => 
                    m.coordinates[0] === markerData.coordinates[0] && 
                    m.coordinates[1] === markerData.coordinates[1] && 
                    m.username === markerData.username
                );
                
                if (group.length > 1 && groupIndex !== -1) {
                    const sortedGroup = [...group].sort((a, b) => 
                        (a.username || '').localeCompare(b.username || '')
                    );
                    
                    const sortedIndex = sortedGroup.findIndex(m => 
                        m.coordinates[0] === markerData.coordinates[0] && 
                        m.coordinates[1] === markerData.coordinates[1] && 
                        m.username === markerData.username
                    );
                    
                    const labelSpacing = 25;
                    const totalOffset = (group.length - 1) * labelSpacing;
                    const startOffset = -totalOffset / 2;
                    verticalOffset = startOffset + (sortedIndex * labelSpacing);
                }
                break;
            }
        }
        
        // Create custom icon with appropriate color and username label (with offset)
        const labelOffsetStyle = verticalOffset !== 0 ? `style="transform: translateY(${verticalOffset}px);"` : '';
        const customIcon = L.divIcon({
            className: 'faction-member-marker',
            html: `
                <div class="marker-container">
                    <div class="marker-dot" style="background: ${markerData.markerColor}; border-color: ${markerData.markerBorderColor}; box-shadow: 0 0 10px ${markerData.markerShadow}, 0 0 20px ${markerData.markerShadow2};"></div>
                    <div class="marker-label" ${labelOffsetStyle}>${markerData.username}</div>
                </div>
            `,
            iconSize: [100, 30],
            iconAnchor: [50, 15]
        });
        
        const marker = L.marker(markerData.coordinates, { icon: customIcon })
            .addTo(State.worldMap)
            .bindPopup(`
                <div class="marker-popup">
                    <strong>${markerData.username}</strong><br>
                    <span>Status: ${markerData.statusDescription || 'Unknown'}</span>
                </div>
            `);
        
        // Store member info with marker
        marker.memberId = markerData.memberId;
        marker._memberName = markerData.username;
        marker._statusDescription = markerData.statusDescription;
        marker._labelOffset = verticalOffset;
        
        State.factionMarkers.push(marker);
    });
    
    console.log(`Created ${State.factionMarkers.length} individual markers and ${usersInTorn > 0 ? '1' : '0'} count marker`);
}

// Load faction members by ID and display on map
async function loadFactionMembersById(factionId) {
    console.log('=== loadFactionMembersById() called ===');
    console.log('Faction ID:', factionId);
    
    if (!factionId) {
        console.error('No faction ID provided');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured');
        alert('API key not configured. Please enter your API key in the Settings tab.');
        return;
    }
    
    try {
        const membersUrl = `${API_BASE_URL}/faction/${factionId}/members?key=${apiKey}`;
        console.log('Fetching faction members from URL:', membersUrl.replace(apiKey, 'KEY_HIDDEN'));
        
        const membersResponse = await fetch(membersUrl);
        
        if (!membersResponse.ok) {
            throw new Error(`HTTP error! status: ${membersResponse.status}`);
        }
        
        const membersData = await membersResponse.json();
        
        if (membersData.error) {
            throw new Error(membersData.error.error || JSON.stringify(membersData.error));
        }
        
        // Handle the API response structure
        let membersArray = [];
        if (membersData.members && Array.isArray(membersData.members)) {
            membersArray = membersData.members;
        } else if (Array.isArray(membersData)) {
            membersArray = membersData;
        } else {
            membersArray = Object.values(membersData);
        }
        
        if (membersArray.length === 0) {
            console.warn('No members found in faction');
            return;
        }
        
        // Create markers from members array
        createMarkersFromMembers(membersArray);
        
        // Update online players in Torn window
        updateOnlinePlayersInTorn(membersArray);
        
        console.log(`Loaded ${membersArray.length} members from faction ${factionId}`);
    } catch (error) {
        console.error('Error loading faction members by ID:', error);
        alert(`Error loading faction members: ${error.message}`);
    }
}

// Calculate midpoint between two coordinates (for showing in-transit markers)
function getMidpointCoordinates(coord1, coord2) {
    if (!coord1 || !coord2) return null;
    
    const lat = (coord1[0] + coord2[0]) / 2;
    const lng = (coord1[1] + coord2[1]) / 2;
    
    return [lat, lng];
}

// Get marker color based on travel status description
function getMarkerColor(description) {
    if (!description) return { bg: '#dc143c', border: '#ff6b6b', shadow: 'rgba(220, 20, 60, 0.8)', shadow2: 'rgba(220, 20, 60, 0.5)' };
    
    const descLower = description.trim().toLowerCase();
    
    // Green: approaching Torn
    if (descLower.startsWith('returning to torn from')) {
        return { 
            bg: '#00ff00', 
            border: '#32cd32', 
            shadow: 'rgba(0, 255, 0, 0.8)',
            shadow2: 'rgba(0, 255, 0, 0.5)'
        };
    }
    
    // Blue: going away from Torn
    if (descLower.startsWith('travelling to') || descLower.startsWith('traveling to')) {
        return { 
            bg: '#4169e1', 
            border: '#6495ed', 
            shadow: 'rgba(65, 105, 225, 0.8)',
            shadow2: 'rgba(65, 105, 225, 0.5)'
        };
    }
    
    // Red (default): at location or other statuses
    return { 
        bg: '#dc143c', 
        border: '#ff6b6b', 
        shadow: 'rgba(220, 20, 60, 0.8)',
        shadow2: 'rgba(220, 20, 60, 0.5)'
    };
}

// Update online players in Torn window
function updateOnlinePlayersInTorn(membersArray) {
    const onlinePlayersList = document.getElementById('onlinePlayersList');
    if (!onlinePlayersList) {
        console.error('Online players list element not found');
        return;
    }
    
    if (!membersArray || membersArray.length === 0) {
        onlinePlayersList.innerHTML = '<div style="color: #c0c0c0; font-style: italic;">No data available</div>';
        return;
    }
    
    // Filter for players who are in Torn
    const playersInTorn = membersArray.filter(member => {
        let statusDescription = '';
        if (member.status) {
            if (typeof member.status === 'string') {
                statusDescription = member.status;
            } else if (typeof member.status === 'object' && member.status.description) {
                statusDescription = member.status.description;
            }
        }
        
        const statusLower = (statusDescription || '').toLowerCase();
        const inTorn = statusDescription === 'Okay' || 
                      statusLower === 'hospitalized' || 
                      statusLower.includes('in hospital');
        
        return inTorn;
    });
    
    // Sort by name
    playersInTorn.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    // Display the list
    if (playersInTorn.length === 0) {
        onlinePlayersList.innerHTML = '<div style="color: #c0c0c0; font-style: italic;">No players in Torn</div>';
    } else {
        let html = '';
        playersInTorn.forEach(member => {
            const username = member.name || `User ${member.id || 'Unknown'}`;
            html += `<div class="online-player-item">${username}</div>`;
        });
        onlinePlayersList.innerHTML = html;
    }
}

// Map Torn city names to coordinates
function getCityCoordinates(cityName) {
    if (!cityName) return null;
    
    const cityCoordinates = {
        'Torn': [39.0997, -94.5786],
        'United Kingdom': [51.5074, -0.1278],
        'UK': [51.5074, -0.1278],
        'Mexico': [31.6904, -106.4244],
        'Cayman Islands': [19.3133, -81.2546],
        'Canada': [43.6532, -79.3832],
        'Hawaii': [21.3099, -157.8581],
        'Switzerland': [47.3769, 8.5417],
        'Argentina': [-34.6037, -58.3816],
        'Japan': [35.6762, 139.6503],
        'China': [39.9042, 116.4074],
        'UAE': [25.2048, 55.2708],
        'United Arab Emirates': [25.2048, 55.2708],
        'South Africa': [-26.2041, 28.0473]
    };
    
    // Try exact match first
    if (cityCoordinates[cityName]) {
        return cityCoordinates[cityName];
    }
    
    // Try case-insensitive match
    const cityNameLower = cityName.toLowerCase().trim();
    for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (city.toLowerCase() === cityNameLower) {
            return coords;
        }
    }
    
    // Try partial match
    for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (cityNameLower.includes(city.toLowerCase()) || city.toLowerCase().includes(cityNameLower)) {
            return coords;
        }
    }
    
    return null;
}

// Start automatic updates for world map markers
function startWorldMapUpdates() {
    // Clear any existing interval
    if (State.worldMapUpdateInterval) {
        clearInterval(State.worldMapUpdateInterval);
    }
    
    // Update immediately
    loadFactionData();
    
    // Then update every 5 minutes (300000 milliseconds)
    State.worldMapUpdateInterval = setInterval(() => {
        loadFactionData();
    }, 300000);
    
    console.log('World map auto-update started (every 5 minutes)');
}

// Stop automatic updates for world map markers
function stopWorldMapUpdates() {
    if (State.worldMapUpdateInterval) {
        clearInterval(State.worldMapUpdateInterval);
        State.worldMapUpdateInterval = null;
        console.log('World map auto-update stopped');
    }
}


