// UI Module - All UI update functions
// Depends on: config.js, api.js

// Update progress bars
function updateProgressBars(data) {
    console.log('=== updateProgressBars called ====');
    console.log('Data received:', data);
    console.log('data.bars:', data.bars);
    console.log('data.life:', data.life);
    console.log('data.energy:', data.energy);
    console.log('data.nerve:', data.nerve);
    console.log('data.happy:', data.happy);
    
    const progressSection = document.getElementById('progressBarsSection');
    progressSection.classList.remove('hidden');

    // In API v2, bars data might be under data.bars instead of directly on data
    const bars = data.bars || {};
    const life = data.life || bars.life;
    const energy = data.energy || bars.energy;
    const nerve = data.nerve || bars.nerve;
    const happy = data.happy || bars.happy;
    
    console.log('Extracted bars:', { life, energy, nerve, happy });

    // Update Life bar
    if (life) {
        console.log('Updating life bar:', life);
        updateProgressBar('life', life.current, life.maximum);
    } else {
        console.warn('No life data found');
    }

    // Update Energy bar
    if (energy) {
        console.log('Updating energy bar:', energy);
        updateProgressBar('energy', energy.current, energy.maximum);
    } else {
        console.warn('No energy data found');
    }

    // Update Nerve bar
    if (nerve) {
        console.log('Updating nerve bar:', nerve);
        updateProgressBar('nerve', nerve.current, nerve.maximum);
    } else {
        console.warn('No nerve data found');
    }

    // Update Happy bar
    if (happy) {
        console.log('Updating happy bar:', happy);
        updateProgressBar('happy', happy.current, happy.maximum);
    } else {
        console.warn('No happy data found');
    }

    // Update Money display - show wallet, faction money, city bank, and cayman bank
    const walletElement = document.getElementById('walletValue');
    const factionElement = document.getElementById('factionValue');
    const cityBankElement = document.getElementById('cityBankValue');
    const caymanBankElement = document.getElementById('caymanBankValue');
    
    let walletValue = null;
    let factionValue = null;
    let cityBankValue = null;
    let caymanBankValue = null;
    
    // Check if money object exists and has wallet, faction, citybank, and cayman_bank properties
    if (data.money && typeof data.money === 'object') {
        if (data.money.wallet !== undefined) {
            walletValue = data.money.wallet;
        }
        // Faction money is nested: data.money.faction.money
        if (data.money.faction && typeof data.money.faction === 'object' && data.money.faction.money !== undefined) {
            factionValue = data.money.faction.money;
        }
        // City bank is at: data.money.city_bank.amount
        if (data.money.city_bank && typeof data.money.city_bank === 'object' && data.money.city_bank.amount !== undefined) {
            cityBankValue = data.money.city_bank.amount;
            
            // Calculate days remaining until city bank investment is released
            if (data.money.city_bank.until !== undefined) {
                const untilTimestamp = data.money.city_bank.until;
                const now = Math.floor(Date.now() / 1000); // Current time in seconds
                const secondsRemaining = untilTimestamp - now;
                const daysRemaining = Math.ceil(secondsRemaining / (24 * 60 * 60)); // Convert to days and round up
                
                // Update City Bank label with days remaining
                const cityBankLabel = document.querySelector('#cityBankValue')?.previousElementSibling;
                if (cityBankLabel && cityBankLabel.classList.contains('money-label')) {
                    if (daysRemaining > 0) {
                        cityBankLabel.textContent = `City Bank (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left)`;
                    } else {
                        cityBankLabel.textContent = 'City Bank';
                    }
                }
            } else {
                // Reset label if no until timestamp
                const cityBankLabel = document.querySelector('#cityBankValue')?.previousElementSibling;
                if (cityBankLabel && cityBankLabel.classList.contains('money-label')) {
                    cityBankLabel.textContent = 'City Bank';
                }
            }
        } else {
            // Reset label if no city bank data
            const cityBankLabel = document.querySelector('#cityBankValue')?.previousElementSibling;
            if (cityBankLabel && cityBankLabel.classList.contains('money-label')) {
                cityBankLabel.textContent = 'City Bank';
            }
        }
        // Cayman bank is at: data.money.cayman_bank
        if (data.money.cayman_bank !== undefined) {
            caymanBankValue = data.money.cayman_bank;
        }
    }
    
    // Format value with dollar sign - always display 0 if value is 0
    const formatValue = (value) => {
        if (value !== null && typeof value === 'number' && !isNaN(value)) {
            return '$' + value.toLocaleString('en-US', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
        }
        return '-';
    };
    
    // Update wallet display
    if (walletElement) {
        walletElement.textContent = formatValue(walletValue);
    }
    
    // Update faction display - always show value even if 0
    if (factionElement) {
        if (factionValue !== null && typeof factionValue === 'number' && !isNaN(factionValue)) {
            // Display the value even if it's 0
            factionElement.textContent = formatValue(factionValue);
        } else {
            factionElement.textContent = '-';
        }
    }
    
    // Update city bank display - always show value even if 0
    if (cityBankElement) {
        if (cityBankValue !== null && typeof cityBankValue === 'number' && !isNaN(cityBankValue)) {
            // Display the value even if it's 0
            cityBankElement.textContent = formatValue(cityBankValue);
        } else {
            cityBankElement.textContent = '-';
        }
    }
    
    // Update cayman bank display - always show value even if 0
    if (caymanBankElement) {
        if (caymanBankValue !== null && typeof caymanBankValue === 'number' && !isNaN(caymanBankValue)) {
            // Display the value even if it's 0
            caymanBankElement.textContent = formatValue(caymanBankValue);
        } else {
            caymanBankElement.textContent = '-';
        }
    }
    
    console.log('Money updated - Wallet:', walletValue, 'Faction:', factionValue, 'Faction object:', data.money?.faction);
    
    // Update Travel display with real data from API
    const travelLocationElement = document.getElementById('travelLocation');
    const travelDestinationElement = document.getElementById('travelDestination');
    const travelTimeRemainingElement = document.getElementById('travelTimeRemaining');
    
    const travelData = data.travel || null;
    
    // Format time remaining in seconds to readable format (e.g., "2h 15m" or "45m 30s")
    const formatTimeRemaining = (seconds) => {
        if (!seconds || seconds <= 0) return '-';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        let timeString = '';
        if (hours > 0) {
            timeString += hours + 'h ';
        }
        if (minutes > 0) {
            timeString += minutes + 'm ';
        }
        if (secs > 0 && hours === 0) {
            timeString += secs + 's';
        }
        
        return timeString.trim() || '-';
    };
    
    // Update current location
    if (travelLocationElement) {
        if (travelData && travelData.departing) {
            // If travelling, show where they're departing from
            travelLocationElement.textContent = travelData.departing;
        } else {
            // If not travelling or no travel data, they're in Torn City
            travelLocationElement.textContent = 'Torn City';
        }
    }
    
    // Update destination
    if (travelDestinationElement) {
        if (travelData && travelData.destination) {
            travelDestinationElement.textContent = travelData.destination;
        } else {
            travelDestinationElement.textContent = '-';
        }
    }
    
    // Update time remaining
    if (travelTimeRemainingElement) {
        if (travelData && travelData.time_left !== undefined) {
            travelTimeRemainingElement.textContent = formatTimeRemaining(travelData.time_left);
        } else if (travelData && travelData.timestamp) {
            // Calculate time remaining from timestamp if time_left is not available
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = Math.max(0, travelData.timestamp - now);
            travelTimeRemainingElement.textContent = formatTimeRemaining(timeLeft);
        } else {
            travelTimeRemainingElement.textContent = '-';
        }
    }
    
    console.log('Travel updated:', travelData);
    
    // Update Battle Stats display
    updateBattleStats(data);
}

// Update battle stats (Strength, Defense, Dexterity, Speed) with modifiers
function updateBattleStats(data) {
    const battlestats = data.battlestats || {};
    
    // Format stat value
    const formatStat = (value) => {
        if (value !== null && typeof value === 'number' && !isNaN(value)) {
            return value.toLocaleString('en-US', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
        }
        return '-';
    };
    
    // Format modifiers - extract effect from each modifier and join them
    const formatModifiers = (modifiersArray) => {
        if (!modifiersArray || !Array.isArray(modifiersArray) || modifiersArray.length === 0) {
            return '-';
        }
        
        // Extract effect from each modifier and join with newlines
        const effects = modifiersArray
            .map(modifier => modifier?.effect)
            .filter(effect => effect !== null && effect !== undefined);
        
        if (effects.length === 0) {
            return '-';
        }
        
        return effects.join('\n');
    };
    
    // Update Strength
    const strengthBaseElement = document.getElementById('strengthBase');
    const strengthModifierElement = document.getElementById('strengthModifier');
    if (strengthBaseElement) {
        const baseValue = battlestats.strength?.value || null;
        strengthBaseElement.textContent = formatStat(baseValue);
    }
    if (strengthModifierElement) {
        const modifiers = battlestats.strength?.modifiers || [];
        strengthModifierElement.textContent = formatModifiers(modifiers);
        // Preserve line breaks
        strengthModifierElement.style.whiteSpace = 'pre-line';
    }
    
    // Update Defense
    const defenseBaseElement = document.getElementById('defenseBase');
    const defenseModifierElement = document.getElementById('defenseModifier');
    if (defenseBaseElement) {
        const baseValue = battlestats.defense?.value || null;
        defenseBaseElement.textContent = formatStat(baseValue);
    }
    if (defenseModifierElement) {
        const modifiers = battlestats.defense?.modifiers || [];
        defenseModifierElement.textContent = formatModifiers(modifiers);
        // Preserve line breaks
        defenseModifierElement.style.whiteSpace = 'pre-line';
    }
    
    // Update Dexterity
    const dexterityBaseElement = document.getElementById('dexterityBase');
    const dexterityModifierElement = document.getElementById('dexterityModifier');
    if (dexterityBaseElement) {
        const baseValue = battlestats.dexterity?.value || null;
        dexterityBaseElement.textContent = formatStat(baseValue);
    }
    if (dexterityModifierElement) {
        const modifiers = battlestats.dexterity?.modifiers || [];
        dexterityModifierElement.textContent = formatModifiers(modifiers);
        // Preserve line breaks
        dexterityModifierElement.style.whiteSpace = 'pre-line';
    }
    
    // Update Speed
    const speedBaseElement = document.getElementById('speedBase');
    const speedModifierElement = document.getElementById('speedModifier');
    if (speedBaseElement) {
        const baseValue = battlestats.speed?.value || null;
        speedBaseElement.textContent = formatStat(baseValue);
    }
    if (speedModifierElement) {
        const modifiers = battlestats.speed?.modifiers || [];
        speedModifierElement.textContent = formatModifiers(modifiers);
        // Preserve line breaks
        speedModifierElement.style.whiteSpace = 'pre-line';
    }
    
    // Calculate and display total battlestats (sum of all four stats)
    const battlestatsTotalElement = document.getElementById('battlestatsTotal');
    if (battlestatsTotalElement) {
        const strengthValue = battlestats.strength?.value || 0;
        const defenseValue = battlestats.defense?.value || 0;
        const dexterityValue = battlestats.dexterity?.value || 0;
        const speedValue = battlestats.speed?.value || 0;
        
        const total = strengthValue + defenseValue + dexterityValue + speedValue;
        
        if (total > 0) {
            battlestatsTotalElement.textContent = formatStat(total);
        } else {
            battlestatsTotalElement.textContent = '-';
        }
    }
    
    console.log('Battle stats updated:', battlestats);
    console.log('Strength modifiers:', battlestats.strength?.modifiers);
    console.log('Defense modifiers:', battlestats.defense?.modifiers);
    console.log('Dexterity modifiers:', battlestats.dexterity?.modifiers);
    console.log('Speed modifiers:', battlestats.speed?.modifiers);
}

// Update FFScouter battlestats display
function updateFFScouterBattlestats(statsData) {
    const card = document.getElementById('ffscouterBattlestatsCard');
    if (!card) {
        console.error('FFScouter battlestats card element not found');
        return;
    }
    
    // Show card if we have data, hide if we don't
    if (!statsData) {
        console.log('No statsData provided, hiding FFScouter card');
        card.classList.add('hidden');
        return;
    }
    
    console.log('Updating FFScouter battlestats card with data:', statsData);
    console.log('bs_estimate_human in statsData:', statsData.bs_estimate_human);
    console.log('bs_estimate_human type:', typeof statsData.bs_estimate_human);
    
    card.classList.remove('hidden');
    
    // Format values
    const formatValue = (value) => {
        if (value === null || value === undefined) {
            console.warn('formatValue received null/undefined:', value);
            return '-';
        }
        if (typeof value === 'number') {
            return value.toLocaleString('en-US', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
        }
        return String(value);
    };
    
    // Update BS Estimate (Human)
    const bsEstimateHumanElement = document.getElementById('ffscouterBSEstimateHuman');
    if (bsEstimateHumanElement) {
        const formattedValue = formatValue(statsData.bs_estimate_human);
        console.log('Setting bs_estimate_human to:', formattedValue);
        bsEstimateHumanElement.textContent = formattedValue;
    } else {
        console.error('ffscouterBSEstimateHuman element not found');
    }
    
    console.log('FFScouter battlestats updated:', statsData);
}

// Update Job card with workstats and job data
function updateJobCard(data) {
    console.log('=== updateJobCard called ===');
    console.log('Data received:', data);
    console.log('Job data from API:', data.job);
    console.log('Workstats data from API:', data.workstats);
    
    const jobCard = document.getElementById('jobCard');
    if (!jobCard) {
        console.error('Job card element not found');
        return;
    }
    
    const workstats = data.workstats;
    const jobData = data.job;
    
    // Update workstats section
    if (!workstats) {
        console.warn('No workstats data found');
        // Show placeholder values
        updateJobElement('jobTotal', '-');
        updateJobElement('jobManualLabor', '-');
        updateJobElement('jobIntelligence', '-');
        updateJobElement('jobEndurance', '-');
    } else {
        // Get job stats (manual labor, intelligence, endurance)
        const manualLabor = workstats.manual_labor || 0;
        const intelligence = workstats.intelligence || 0;
        const endurance = workstats.endurance || 0;
        
        // Calculate total
        const total = manualLabor + intelligence + endurance;
        
        // Update display
        updateJobElement('jobTotal', formatJobStat(total));
        updateJobElement('jobManualLabor', formatJobStat(manualLabor));
        updateJobElement('jobIntelligence', formatJobStat(intelligence));
        updateJobElement('jobEndurance', formatJobStat(endurance));
        
        console.log('Workstats updated:', {
            total: total,
            manual_labor: manualLabor,
            intelligence: intelligence,
            endurance: endurance
        });
    }
    
    // Update job information section
    if (!jobData) {
        console.warn('No job data found');
        updateJobElement('jobName', 'N/A');
        updateJobElement('jobRating', '-');
        updateJobElement('jobPosition', 'N/A');
        updateJobElement('jobDaysInCompany', '-');
    } else {
        // Update company name
        const companyName = jobData.company_name || jobData.name || 'Unemployed';
        updateJobElement('jobName', companyName);
        
        // Update rating as stars (1-10 scale)
        const rating = jobData.rating || jobData.job_rating || 0;
        const stars = '⭐'.repeat(Math.min(Math.max(0, Math.floor(rating)), 10));
        updateJobElement('jobRating', stars || '-');
        
        // Update position
        const position = jobData.position || jobData.job_position || '-';
        updateJobElement('jobPosition', position);
        
        // Update days in company
        const daysInCompany = jobData.days_in_company || jobData.company_days || 0;
        updateJobElement('jobDaysInCompany', daysInCompany > 0 ? daysInCompany.toLocaleString('en-US') : '-');
        
        console.log('Job info updated:', {
            name: companyName,
            rating: rating,
            stars: stars,
            position: position,
            days_in_company: daysInCompany
        });
    }
    
    console.log('Job card fully updated');
}

// Helper function to update job element
function updateJobElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    } else {
        console.error(`Job element not found: ${elementId}`);
    }
}

// Helper function to format job stat values
function formatJobStat(value) {
    if (value === null || value === undefined || value === 0) {
        return '-';
    }
    if (typeof value === 'number') {
        return value.toLocaleString('en-US');
    }
    return String(value);
}

// Update status display
function updateStatus(data) {
    const statusCard = document.getElementById('statusCard');
    const statusState = document.getElementById('statusState');
    const statusDescription = document.getElementById('statusDescription');
    const travelCountdown = document.getElementById('travelCountdown');
    
    if (!statusCard || !statusState || !statusDescription) return;
    
    // Debug: Log travel data to console
    if (data.travel) {
        console.log('Travel data received:', data.travel);
    }
    if (data.status) {
        console.log('Status data:', data.status);
    }
    
    // Stop any existing countdown
    stopTravelCountdown();
    
    if (data.status) {
        statusCard.classList.remove('hidden');
        
        // Format status state
        const state = data.status.state || 'Unknown';
        const description = data.status.description || '';
        const color = data.status.color || '#c0c0c0';
        
        statusState.textContent = state;
        statusState.style.color = color;
        
        if (description) {
            statusDescription.textContent = description;
            statusDescription.style.display = 'block';
        } else {
            statusDescription.style.display = 'none';
        }
        
        // Check if travelling and show countdown
        // Check for "travel" in status (handles "Travelling", "Traveling", etc.)
        const isTravelling = state.toLowerCase().includes('travel');
        
        if (isTravelling) {
            let timeLeft = null;
            
            // Try to get time from travel data (multiple possible formats)
            if (data.travel) {
                timeLeft = data.travel.time_left || data.travel.timeleft || data.travel.time_remaining || data.travel.timestamp;
                
                // If timestamp, calculate difference
                if (timeLeft && data.travel.timestamp) {
                    const travelEnd = data.travel.timestamp;
                    const now = Math.floor(Date.now() / 1000);
                    timeLeft = Math.max(0, travelEnd - now);
                }
            }
            
            // Fallback: Try to extract from status description
            if (!timeLeft && description) {
                // Look for time patterns in description like "X minutes", "X seconds", etc.
                const timeMatch = description.match(/(\d+)\s*(second|minute|hour|sec|min|hr)/i);
                if (timeMatch) {
                    const value = parseInt(timeMatch[1]);
                    const unit = timeMatch[2].toLowerCase();
                    if (unit.includes('hour') || unit.includes('hr')) {
                        timeLeft = value * 3600;
                    } else if (unit.includes('minute') || unit.includes('min')) {
                        timeLeft = value * 60;
                    } else if (unit.includes('second') || unit.includes('sec')) {
                        timeLeft = value;
                    }
                }
            }
            
            if (timeLeft && timeLeft > 0) {
                // Calculate end time (timeLeft is in seconds)
                State.travelEndTime = Date.now() + (timeLeft * 1000);
                
                // Show countdown and start timer
                if (travelCountdown) {
                    travelCountdown.classList.remove('hidden');
                    startTravelCountdown();
                }
            } else {
                // Hide if no valid time left
                if (travelCountdown) {
                    travelCountdown.classList.add('hidden');
                }
                State.travelEndTime = null;
            }
        } else {
            // Hide countdown if not travelling
            if (travelCountdown) {
                travelCountdown.classList.add('hidden');
            }
            State.travelEndTime = null;
        }
    } else {
        statusCard.classList.add('hidden');
        if (travelCountdown) {
            travelCountdown.classList.add('hidden');
        }
    }
}

// Start travel countdown timer
function startTravelCountdown() {
    stopTravelCountdown();
    
    if (!State.travelEndTime) return;
    
    // Update immediately
    updateTravelCountdown();
    
    // Update every second
    State.travelCountdownInterval = setInterval(() => {
        updateTravelCountdown();
    }, 1000);
}

// Stop travel countdown timer
function stopTravelCountdown() {
    if (State.travelCountdownInterval) {
        clearInterval(State.travelCountdownInterval);
        State.travelCountdownInterval = null;
    }
}

// Update travel countdown display
function updateTravelCountdown() {
    const countdownTime = document.getElementById('countdownTime');
    if (!countdownTime || !State.travelEndTime) return;
    
    const now = Date.now();
    const remaining = Math.max(0, State.travelEndTime - now);
    
    if (remaining <= 0) {
        countdownTime.textContent = '00:00:00';
        countdownTime.classList.add('countdown-expired');
        stopTravelCountdown();
        return;
    }
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    // Format as HH:MM:SS
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    countdownTime.textContent = formatted;
    countdownTime.classList.remove('countdown-expired');
}

// Update individual progress bar
function updateProgressBar(type, current, maximum) {
    const bar = document.getElementById(`${type}Bar`);
    const valueElement = document.getElementById(`${type}Value`);
    
    if (!bar || !valueElement) return;

    const percentage = maximum > 0 ? (current / maximum) * 100 : 0;
    
    // Get current percentage to avoid unnecessary updates
    const currentPercentage = parseFloat(bar.getAttribute('data-percentage') || '0');
    const newPercentage = parseFloat(percentage.toFixed(1));
    
    // Only update if the value has actually changed (with small tolerance for floating point)
    if (Math.abs(currentPercentage - newPercentage) < 0.1) {
        // Value hasn't changed, just ensure text is up to date and return early
        // This prevents the bar from animating when the value is the same
        valueElement.textContent = `${current.toLocaleString()} / ${maximum.toLocaleString()}`;
        return;
    }
    
    // Add updating class for glow effect
    bar.classList.add('updating');
    setTimeout(() => bar.classList.remove('updating'), 500);

    // Update width - for nerve bar, set immediately without any transition or animation
    if (type === 'nerve') {
        // Completely disable transition and animation for instant, static update
        bar.style.transition = 'none';
        bar.style.animation = 'none';
        bar.style.width = `${percentage}%`;
        // Force reflow to apply the change immediately
        void bar.offsetHeight;
    } else {
        // Other bars can use smooth transition
        bar.style.width = `${percentage}%`;
    }
    bar.setAttribute('data-percentage', newPercentage);

    // Update value text
    valueElement.textContent = `${current.toLocaleString()} / ${maximum.toLocaleString()}`;
}

// Display user information
function displayUserInfo(data) {
    const userInfoDiv = document.getElementById('userInfo');
    
    const formatValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return value;
    };

    const formatMoney = (value) => {
        if (typeof value === 'number') {
            return '$' + value.toLocaleString();
        }
        return formatValue(value);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleString();
    };

    let html = '<h2>User Information</h2>';
    html += '<div class="info-grid">';

    // Basic Information
    if (data.player_id) {
        html += createInfoItem('Player ID', data.player_id);
    }
    if (data.name) {
        html += createInfoItem('Name', data.name);
    }
    if (data.level) {
        html += createInfoItem('Level', data.level);
    }
    if (data.gender) {
        html += createInfoItem('Gender', data.gender);
    }
    if (data.faction) {
        // Display faction information
        if (data.faction) {
            if (typeof data.faction === 'object' && data.faction !== null) {
                // Build faction info string
                let factionInfo = '';
                if (data.faction.faction_name) {
                    factionInfo = data.faction.faction_name;
                } else if (data.faction.name) {
                    factionInfo = data.faction.name;
                } else {
                    factionInfo = 'Unknown Faction';
                }
                
                // Add faction ID if available
                const factionId = data.faction.faction_id || data.faction.id;
                if (factionId) {
                    factionInfo += ` (ID: ${factionId})`;
                }
                
                // Add position if available
                if (data.faction.position) {
                    factionInfo += ` - ${data.faction.position}`;
                }
                
                html += createInfoItem('Faction', factionInfo);
            } else if (typeof data.faction === 'number') {
                html += createInfoItem('Faction', `Faction ID: ${data.faction}`);
            } else {
                html += createInfoItem('Faction', String(data.faction));
            }
        } else {
            html += createInfoItem('Faction', 'None');
        }
    }
    if (data.company) {
        html += createInfoItem('Company', typeof data.company === 'object' ? data.company.company_name || 'N/A' : data.company);
    }

    // Status Information
    if (data.status) {
        html += createInfoItem('Status', data.status.state + (data.status.description ? ' - ' + data.status.description : ''));
    }
    if (data.last_action) {
        html += createInfoItem('Last Action', formatDate(data.last_action.timestamp));
    }

    // Money Information
    if (data.money) {
        html += createInfoItem('Money', formatMoney(data.money));
    }
    if (data.networth) {
        html += createInfoItem('Net Worth', formatMoney(data.networth));
    }

    // Stats - Check both top level and nested
    const stats = data.stats || {};
    if (data.strength || stats.strength) {
        html += createInfoItem('Strength', (data.strength || stats.strength || 0).toLocaleString());
    }
    if (data.defense || stats.defense) {
        html += createInfoItem('Defense', (data.defense || stats.defense || 0).toLocaleString());
    }
    if (data.speed || stats.speed) {
        html += createInfoItem('Speed', (data.speed || stats.speed || 0).toLocaleString());
    }
    if (data.dexterity || stats.dexterity) {
        html += createInfoItem('Dexterity', (data.dexterity || stats.dexterity || 0).toLocaleString());
    }

    // Note: Life, Energy, Nerve, and Happy are now displayed in the progress bars section above

    // Additional Information
    if (data.rank) {
        html += createInfoItem('Rank', data.rank);
    }
    if (data.property) {
        html += createInfoItem('Property', data.property);
    }
    if (data.signup) {
        html += createInfoItem('Signup Date', formatDate(data.signup));
    }
    if (data.awards) {
        html += createInfoItem('Awards', data.awards);
    }
    if (data.friends) {
        html += createInfoItem('Friends', data.friends);
    }
    if (data.enemies) {
        html += createInfoItem('Enemies', data.enemies);
    }
    if (data.forum_posts) {
        html += createInfoItem('Forum Posts', data.forum_posts);
    }
    if (data.karma) {
        html += createInfoItem('Karma', data.karma);
    }
    if (data.age) {
        html += createInfoItem('Age', data.age);
    }
    if (data.role) {
        html += createInfoItem('Role', data.role);
    }
    if (data.donator) {
        html += createInfoItem('Donator', data.donator ? 'Yes' : 'No');
    }
    if (data.player_id && data.player_id === data.id) {
        html += createInfoItem('User ID', data.id);
    }

    html += '</div>';
    userInfoDiv.innerHTML = html;
}

// Create info item HTML
function createInfoItem(label, value) {
    return `
        <div class="info-item">
            <div class="info-label">${label}</div>
            <div class="info-value">${value}</div>
        </div>
    `;
}

// Show error message
function showError(message) {
    const progressSection = document.getElementById('progressBarsSection');
    progressSection.classList.add('hidden');
    console.error('Error:', message);
    alert(message);
    stopAutoRefresh();
    State.currentUserId = null;
}


