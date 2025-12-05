// Stocks Module - Stocks-related functions
// Depends on: config.js, api.js

// Calculate and display total current value of all stocks in the Money card
async function updateStocksTotalInMoneyCard() {
    console.log('=== updateStocksTotalInMoneyCard() called ===');

    const stocksTotalElement = document.getElementById('stocksTotalValue');
    if (!stocksTotalElement) {
        console.warn('stocksTotalValue element not found in DOM');
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured, cannot fetch stocks total');
        stocksTotalElement.textContent = '-';
        return;
    }

    if (!State.currentUserId) {
        console.warn('No current user selected, cannot fetch stocks total');
        stocksTotalElement.textContent = '-';
        return;
    }

    try {
        // Ensure we have current stock prices loaded
        await fetchStockNames();

        // Try to use cached bars data first (which includes stocks) to avoid duplicate API call
        let stocks = {};
        if (State.cachedBarsData && State.cachedBarsData.stocks) {
            console.log('Using cached stocks data from bars data fetch');
            stocks = State.cachedBarsData.stocks;
        } else {
            // Fallback to separate API call if cached data not available
            const stocksUrl = `${API_BASE_URL}/user/${State.currentUserId}?selections=stocks&key=${apiKey}`;
            console.log('Fetching user stocks for Money card from URL:', stocksUrl.replace(apiKey, 'KEY_HIDDEN'));

            const response = await fetch(stocksUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('User stocks API response status:', response.status);
            console.log('User stocks API response data:', data);

            if (data.error) {
                console.error('Error fetching user stocks for Money card:', data.error);
                stocksTotalElement.textContent = '-';
                return;
            }

            stocks = data.stocks || {};
        }
        const stockIds = Object.keys(stocks);

        if (stockIds.length === 0) {
            // User has no stocks
            stocksTotalElement.textContent = '$0';
            return;
        }

        let totalCurrentValue = 0;

        stockIds.forEach(stockId => {
            const stock = stocks[stockId] || {};

            // Determine total number of shares for this stock
            let totalShares = 0;
            if (stock.total_shares !== undefined && stock.total_shares !== null) {
                totalShares = Number(stock.total_shares) || 0;
            } else if (stock.transactions) {
                // Fallback: sum shares from transactions if total_shares is not present
                if (Array.isArray(stock.transactions)) {
                    stock.transactions.forEach(tx => {
                        if (tx && tx.shares !== undefined && tx.shares !== null) {
                            totalShares += Number(tx.shares) || 0;
                        }
                    });
                } else if (typeof stock.transactions === 'object') {
                    Object.values(stock.transactions).forEach(tx => {
                        if (tx && tx.shares !== undefined && tx.shares !== null) {
                            totalShares += Number(tx.shares) || 0;
                        }
                    });
                }
            }

            if (totalShares <= 0) {
                return;
            }

            // Get current price for this stock
            let currentPrice = State.stockPricesMap[stockId];
            if (currentPrice === undefined && stock.current_price !== undefined) {
                currentPrice = stock.current_price;
            }

            if (currentPrice === undefined || currentPrice === null) {
                return;
            }

            const currentValue = Number(currentPrice) * totalShares;
            if (!isNaN(currentValue) && currentValue > 0) {
                totalCurrentValue += currentValue;
            }
        });

        // Format and display total current value
        const formatTotal = (value) => {
            if (typeof value === 'number' && !isNaN(value)) {
                return '$' + value.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
            }
            return '-';
        };

        stocksTotalElement.textContent = formatTotal(totalCurrentValue);
        console.log('Total stocks value for Money card:', totalCurrentValue);
    } catch (error) {
        console.error('Error calculating total stocks value for Money card:', error);
        stocksTotalElement.textContent = '-';
    }
}

// Load and display stock data from Torn API
async function loadStocksData() {
    console.log('=== loadStocksData() called ===');
    
    const stocksDisplay = document.getElementById('stocksDisplay');
    if (!stocksDisplay) {
        console.error('Stocks display element not found in DOM');
        return;
    }
    
    // Show loading state
    stocksDisplay.innerHTML = '<p style="color: #c0c0c0; font-style: italic;">Loading stock data...</p>';
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API key not configured');
        stocksDisplay.innerHTML = '<p style="color: #ff6b6b;">API key not configured. Please enter your API key in the Settings tab.</p>';
        return;
    }
    
    // Check if user is selected
    if (!State.currentUserId) {
        stocksDisplay.innerHTML = '<p style="color: #ff6b6b;">Please search for a user first to view their stock portfolio.</p>';
        return;
    }
    
    try {
        // First, ensure we have stock names loaded
        await fetchStockNames();
        
        // Try to use cached bars data first (which includes stocks) to avoid duplicate API call
        let stocks = {};
        let stocksData = null;
        
        if (State.cachedBarsData && State.cachedBarsData.stocks) {
            console.log('Using cached stocks data from bars data fetch');
            stocksData = { stocks: State.cachedBarsData.stocks };
            stocks = State.cachedBarsData.stocks;
        } else {
            // Fallback to separate API call if cached data not available
            const stocksUrl = `${API_BASE_URL}/user/${State.currentUserId}?selections=stocks&key=${apiKey}`;
            console.log('Fetching stocks data from URL:', stocksUrl.replace(apiKey, 'KEY_HIDDEN'));
            
            const stocksResponse = await fetch(stocksUrl);
            
            if (!stocksResponse.ok) {
                throw new Error(`HTTP error! status: ${stocksResponse.status}`);
            }
            
            stocksData = await stocksResponse.json();
            
            console.log('Stocks API response status:', stocksResponse.status);
            console.log('Stocks API response data:', stocksData);
            
            if (stocksData.error) {
                stocksDisplay.innerHTML = `<p style="color: #ff6b6b;">Error: ${stocksData.error.error || JSON.stringify(stocksData.error)}</p>`;
                return;
            }
            
            stocks = stocksData.stocks || {};
        }
        
        // Display stocks in a table
        let html = '';
            
        // Handle the API response structure: { "stocks": { "stockId": {...}, ... } }
        const stockIds = Object.keys(stocks);
        
        if (stockIds.length === 0) {
            html = '<p style="color: #c0c0c0; font-style: italic;">No stock data found. This user does not own any stocks.</p>';
        } else {
            // Convert stocks object to array and add stock names from stockNamesMap
            const stocksArray = stockIds.map(id => {
                const stockData = {
                    stock_id: id,
                    ...stocks[id]
                };
                // Add stock name from our mapping if available
                if (State.stockNamesMap[id]) {
                    stockData.name = State.stockNamesMap[id];
                }
                // Add benefit data from our mapping if available (user stocks API doesn't include full benefit info)
                if (State.stockBenefitsMap[id]) {
                    stockData.benefit = State.stockBenefitsMap[id];
                }
                return stockData;
            });
            
            // Get all unique keys from all stocks to create comprehensive table headers
            const allKeys = new Set();
            stocksArray.forEach(stock => {
                Object.keys(stock).forEach(key => allKeys.add(key));
            });
            
            // Define column order (most important first, then alphabetical for the rest)
            const priorityKeys = ['name', 'shares', 'bought_price', 'current_price', 'total_cost', 'total_value', 'profit', 'profit_percent'];
            const orderedKeys = [];
            priorityKeys.forEach(key => {
                if (allKeys.has(key)) {
                    orderedKeys.push(key);
                    allKeys.delete(key);
                }
            });
            const remainingKeys = Array.from(allKeys).sort();
            const finalKeys = [...orderedKeys, ...remainingKeys].filter(key => key !== 'stock_id' && key !== 'dividend' && key !== 'benefit');
            
            // Insert "Price" column right after "name"
            const nameIndex = finalKeys.indexOf('name');
            if (nameIndex >= 0) {
                finalKeys.splice(nameIndex + 1, 0, 'price');
            } else {
                finalKeys.unshift('price');
            }
            
            // Insert "Total Value" column right after "price"
            const priceIndex = finalKeys.indexOf('price');
            if (priceIndex >= 0) {
                finalKeys.splice(priceIndex + 1, 0, 'total_value_calculated');
            }
            
            // Create table
            html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
            html += '<thead>';
            html += '<tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.3);">';
            
            // Add expand/collapse column header
            html += '<th style="padding: 12px; text-align: center; vertical-align: top; color: #d4af37; font-weight: 600; font-size: 1.1rem; width: 50px;">';
            html += '</th>';
            
            // Add "Ready" column header
            html += '<th style="padding: 12px; text-align: center; vertical-align: top; color: #d4af37; font-weight: 600; font-size: 1.1rem; width: 80px;">Ready</th>';
            
            // Add "Benefit" column header
            html += '<th style="padding: 12px; text-align: left; vertical-align: top; color: #d4af37; font-weight: 600; font-size: 1.1rem;">Benefit</th>';
            
            // Create header row
            finalKeys.forEach(key => {
                let headerLabel;
                if (key === 'price') {
                    headerLabel = 'Price';
                } else if (key === 'total_value_calculated') {
                    headerLabel = 'Total Value';
                } else {
                    headerLabel = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                }
                const isNumeric = ['shares', 'bought_price', 'current_price', 'total_cost', 'total_value', 'profit', 'profit_percent', 'price', 'total_value_calculated'].includes(key);
                const align = isNumeric ? 'right' : 'left';
                html += `<th style="padding: 12px; text-align: ${align}; vertical-align: top; color: #d4af37; font-weight: 600; font-size: 1.1rem;">${headerLabel}</th>`;
            });
            
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';
            
            stocksArray.forEach(stock => {
                const stockId = stock.stock_id;
                const hasTransactions = stock.transactions && (
                    (Array.isArray(stock.transactions) && stock.transactions.length > 0) ||
                    (typeof stock.transactions === 'object' && !Array.isArray(stock.transactions) && Object.keys(stock.transactions).length > 0)
                );
                
                html += `<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);" data-stock-id="${stockId}">`;
                
                // Add expand/collapse icon cell
                if (hasTransactions) {
                    html += `<td style="padding: 12px; text-align: center; vertical-align: top; cursor: pointer;" class="expand-collapse-icon" data-stock-id="${stockId}" onclick="toggleTransactions('${stockId}')">`;
                    html += `<span id="icon-${stockId}" style="color: #d4af37; font-size: 1.2rem; user-select: none;">▶</span>`;
                    html += '</td>';
                } else {
                    html += '<td style="padding: 12px; text-align: center; vertical-align: top;"></td>';
                }
                
                // Add "Ready" column cell - check if total shares >= benefit.requirement
                let isReady = false;
                
                // Get total shares
                let totalShares = 0;
                if (stock.total_shares !== undefined && stock.total_shares !== null) {
                    totalShares = Number(stock.total_shares) || 0;
                } else if (stock.transactions) {
                    // Fallback: sum shares from transactions if total_shares is not present
                    if (Array.isArray(stock.transactions)) {
                        stock.transactions.forEach(tx => {
                            if (tx && tx.shares !== undefined && tx.shares !== null) {
                                totalShares += Number(tx.shares) || 0;
                            }
                        });
                    } else if (typeof stock.transactions === 'object') {
                        Object.values(stock.transactions).forEach(tx => {
                            if (tx && tx.shares !== undefined && tx.shares !== null) {
                                totalShares += Number(tx.shares) || 0;
                            }
                        });
                    }
                }
                
                // Check if benefit requirement is met
                if (stock.benefit && stock.benefit.requirement !== undefined && stock.benefit.requirement !== null) {
                    const requirement = Number(stock.benefit.requirement) || 0;
                    isReady = totalShares >= requirement;
                } else {
                    // Fallback: check if dividend has a value (for stocks without benefit requirement)
                    const hasDividend = stock.dividend !== undefined && stock.dividend !== null && 
                        (typeof stock.dividend === 'object' ? Object.keys(stock.dividend).length > 0 : stock.dividend !== '');
                    isReady = hasDividend;
                }
                
                const readyIcon = isReady 
                    ? '<span style="color: #4ade80; font-size: 1.2rem;" title="Active">✓</span>' 
                    : '<span style="color: #ff6b6b; font-size: 1.2rem;" title="Inactive">✗</span>';
                
                html += `<td style="padding: 12px; text-align: center; vertical-align: top;">${readyIcon}</td>`;
                
                // Add "Benefit" column cell - display benefit.description
                let benefitDescription = '-';
                if (stock.benefit && stock.benefit.description) {
                    benefitDescription = String(stock.benefit.description);
                }
                html += `<td style="padding: 12px; color: #c0c0c0; font-size: 0.95rem; text-align: left; vertical-align: top;">${benefitDescription}</td>`;
                
                finalKeys.forEach(key => {
                    // Special handling for Price column
                    if (key === 'price') {
                        const currentPrice = State.stockPricesMap[stockId];
                        const displayValue = currentPrice !== undefined 
                            ? `$${Number(currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : '-';
                        html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; vertical-align: top; font-weight: 600;" class="stock-price-cell" data-stock-id="${stockId}">${displayValue}</td>`;
                        return;
                    }
                    
                    // Special handling for Total Value column (price * total_shares)
                    if (key === 'total_value_calculated') {
                        const currentPrice = State.stockPricesMap[stockId];
                        const totalShares = stock.total_shares !== undefined ? Number(stock.total_shares) : 0;
                        let displayValue = '-';
                        
                        if (currentPrice !== undefined && totalShares > 0) {
                            const totalValue = currentPrice * totalShares;
                            displayValue = `$${Number(totalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        
                        html += `<td style="padding: 12px; color: #d4af37; font-size: 0.95rem; text-align: right; vertical-align: top; font-weight: 600;" class="stock-total-value-cell" data-stock-id="${stockId}" data-total-shares="${totalShares}">${displayValue}</td>`;
                        return;
                    }
                    
                    const value = stock[key];
                    
                    // Keys that should be displayed as JSON strings if they are objects
                    const jsonStringifyKeys = ['benefit', 'dividend'];
                    const shouldStringify = jsonStringifyKeys.includes(key.toLowerCase());
                    
                    const isNumeric = ['shares', 'bought_price', 'current_price', 'total_cost', 'total_value', 'profit', 'profit_percent'].includes(key);
                    // JSON columns should always be left-aligned
                    const align = shouldStringify ? 'left' : (isNumeric ? 'right' : 'left');
                    let displayValue = '-';
                    
                    // Special handling for transactions column - create nested table (collapsible)
                    if (key.toLowerCase() === 'transactions' && value !== undefined && value !== null) {
                        const hasTransactions = (Array.isArray(value) && value.length > 0) || 
                                               (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0);
                        
                        if (hasTransactions) {
                            // Wrap transactions table in a collapsible div (hidden by default)
                            displayValue = `<div id="transactions-${stockId}" style="display: none;">`;
                            
                            if (Array.isArray(value) && value.length > 0) {
                                // Create nested table for transactions
                                displayValue += '<table style="width: 100%; border-collapse: collapse; margin: 0;">';
                                displayValue += '<thead>';
                                displayValue += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">';
                                displayValue += '<th style="padding: 6px 8px; text-align: right; color: #d4af37; font-weight: 600; font-size: 0.85rem;">Shares</th>';
                                displayValue += '<th style="padding: 6px 8px; text-align: right; color: #d4af37; font-weight: 600; font-size: 0.85rem;">Bought Price</th>';
                                displayValue += '<th style="padding: 6px 8px; text-align: left; color: #d4af37; font-weight: 600; font-size: 0.85rem;">Time Bought</th>';
                                displayValue += '</tr>';
                                displayValue += '</thead>';
                                displayValue += '<tbody>';
                                
                                value.forEach(transaction => {
                                    const shares = transaction.shares !== undefined ? Number(transaction.shares).toLocaleString('en-US') : '-';
                                    const boughtPrice = transaction.bought_price !== undefined 
                                        ? `$${Number(transaction.bought_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                        : '-';
                                    const timeBought = transaction.time_bought !== undefined 
                                        ? new Date(transaction.time_bought * 1000).toLocaleString() 
                                        : '-';
                                    
                                    displayValue += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
                                    displayValue += `<td style="padding: 6px 8px; color: #c0c0c0; font-size: 0.85rem; text-align: right;">${shares}</td>`;
                                    displayValue += `<td style="padding: 6px 8px; color: #c0c0c0; font-size: 0.85rem; text-align: right;">${boughtPrice}</td>`;
                                    displayValue += `<td style="padding: 6px 8px; color: #c0c0c0; font-size: 0.85rem; text-align: left;">${timeBought}</td>`;
                                    displayValue += '</tr>';
                                });
                                
                                displayValue += '</tbody>';
                                displayValue += '</table>';
                            } else if (typeof value === 'object' && !Array.isArray(value)) {
                                // Handle case where transactions might be an object instead of array
                                const transactionsArray = Object.values(value);
                                if (transactionsArray.length > 0) {
                                    displayValue += '<table style="width: 100%; border-collapse: collapse; margin: 0;">';
                                    displayValue += '<thead>';
                                    displayValue += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">';
                                    displayValue += '<th style="padding: 6px 8px; text-align: right; color: #d4af37; font-weight: 600; font-size: 0.85rem;">Shares</th>';
                                    displayValue += '<th style="padding: 6px 8px; text-align: right; color: #d4af37; font-weight: 600; font-size: 0.85rem;">Bought Price</th>';
                                    displayValue += '<th style="padding: 6px 8px; text-align: left; color: #d4af37; font-weight: 600; font-size: 0.85rem;">Time Bought</th>';
                                    displayValue += '</tr>';
                                    displayValue += '</thead>';
                                    displayValue += '<tbody>';
                                
                                    transactionsArray.forEach(transaction => {
                                        const shares = transaction.shares !== undefined ? Number(transaction.shares).toLocaleString('en-US') : '-';
                                        const boughtPrice = transaction.bought_price !== undefined 
                                            ? `$${Number(transaction.bought_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                            : '-';
                                        const timeBought = transaction.time_bought !== undefined 
                                            ? new Date(transaction.time_bought * 1000).toLocaleString() 
                                            : '-';
                                        
                                        displayValue += '<tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">';
                                        displayValue += `<td style="padding: 6px 8px; color: #c0c0c0; font-size: 0.85rem; text-align: right;">${shares}</td>`;
                                        displayValue += `<td style="padding: 6px 8px; color: #c0c0c0; font-size: 0.85rem; text-align: right;">${boughtPrice}</td>`;
                                        displayValue += `<td style="padding: 6px 8px; color: #c0c0c0; font-size: 0.85rem; text-align: left;">${timeBought}</td>`;
                                        displayValue += '</tr>';
                                    });
                                    
                                    displayValue += '</tbody>';
                                    displayValue += '</table>';
                                }
                            }
                            
                            displayValue += '</div>';
                        }
                    } else if (value !== undefined && value !== null) {
                        if (typeof value === 'object' && shouldStringify) {
                            // Stringify objects for benefit and dividend
                            displayValue = JSON.stringify(value, null, 2);
                        } else if (typeof value === 'number') {
                            if (key.includes('price') || key.includes('cost') || key.includes('value') || key.includes('profit')) {
                                displayValue = `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            } else if (key === 'profit_percent') {
                                displayValue = `${Number(value).toFixed(2)}%`;
                            } else if (key === 'shares') {
                                displayValue = Number(value).toLocaleString('en-US');
                            } else {
                                displayValue = Number(value).toLocaleString('en-US');
                            }
                        } else if (typeof value === 'boolean') {
                            displayValue = value ? 'Yes' : 'No';
                        } else {
                            displayValue = String(value);
                        }
                    }
                    
                    const textColor = key === 'profit' || key === 'profit_percent' 
                        ? (value > 0 ? '#4ade80' : value < 0 ? '#ff6b6b' : '#c0c0c0')
                        : '#c0c0c0';
                    
                    // Special styling for JSON stringified columns (but not transactions)
                    const jsonStyle = shouldStringify && typeof value === 'object' && key.toLowerCase() !== 'transactions'
                        ? 'word-wrap: break-word; white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; max-width: 400px;' 
                        : '';
                    
                    // Add data attribute for shares column to help with Total Value updates
                    const dataAttribute = key === 'shares' && typeof value === 'number' ? ` data-shares="${value}"` : '';
                    
                    html += `<td style="padding: 12px; color: ${textColor}; font-size: 0.95rem; text-align: ${align}; vertical-align: top; ${jsonStyle}"${dataAttribute}>${displayValue}</td>`;
                });
                
                html += '</tr>';
            });
            
            html += '</tbody>';
            html += '</table>';
        }
        
        stocksDisplay.innerHTML = html;
        console.log('Stock data loaded and displayed successfully');
        
        // Clear any existing stock price update interval
        if (State.stockPriceUpdateInterval) {
            clearInterval(State.stockPriceUpdateInterval);
        }
        
        // Set up interval to update stock prices every 10 seconds
        State.stockPriceUpdateInterval = setInterval(async () => {
            await updateStockPrices();
        }, 10000);
        
    } catch (error) {
        console.error('Error loading stocks data:', error);
        stocksDisplay.innerHTML = `<p style="color: #ff6b6b;">Error loading stock data: ${error.message}</p>`;
    }
}

// Toggle transactions visibility for a specific stock
window.toggleTransactions = function(stockId) {
    const transactionsDiv = document.getElementById(`transactions-${stockId}`);
    const iconSpan = document.getElementById(`icon-${stockId}`);
    
    if (transactionsDiv && iconSpan) {
        if (transactionsDiv.style.display === 'none') {
            transactionsDiv.style.display = 'block';
            iconSpan.textContent = '▼';
        } else {
            transactionsDiv.style.display = 'none';
            iconSpan.textContent = '▶';
        }
    }
};


