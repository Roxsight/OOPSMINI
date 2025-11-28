const API_BASE = 'http://localhost:8000/api';

// Global variables
let allTransactions = [];
let autoRefreshInterval = null;
let isFormActive = false;

// ============================================
// LOAD USERS
// ============================================

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        const data = await response.json();
        
        const usersContainer = document.getElementById('users-container');
        const senderSelect = document.getElementById('sender');
        const recipientSelect = document.getElementById('recipient');
        
        const currentSender = senderSelect.value;
        const currentRecipient = recipientSelect.value;
        
        usersContainer.innerHTML = '';
        senderSelect.innerHTML = '<option value="">Select sender...</option>';
        recipientSelect.innerHTML = '<option value="">Select recipient...</option>';
        
        data.users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <h3>${user.name}</h3>
                <div class="balance">$${user.balance.toFixed(2)} USDT</div>
                <div class="address">${user.address}</div>
                <span class="badge">${user.type} User</span>
            `;
            usersContainer.appendChild(card);
            
            const senderOption = document.createElement('option');
            senderOption.value = user.address;
            senderOption.textContent = `${user.name} ($${user.balance.toFixed(2)})`;
            senderSelect.appendChild(senderOption);
            
            const recipientOption = document.createElement('option');
            recipientOption.value = user.address;
            recipientOption.textContent = `${user.name} (${user.address.substring(0, 10)}...)`;
            recipientSelect.appendChild(recipientOption);
        });
        
        if (isFormActive) {
            if (currentSender) senderSelect.value = currentSender;
            if (currentRecipient) recipientSelect.value = currentRecipient;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ============================================
// LOAD TRANSACTIONS
// ============================================

async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE}/transactions`);
        const data = await response.json();
        
        allTransactions = data.transactions;
        
        console.log('Loaded transactions:', allTransactions.length);
        
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const statusFilter = document.getElementById('filter-status').value;
        const amountFilter = document.getElementById('filter-amount').value;
        const userFilter = document.getElementById('filter-user').value;
        
        if (searchTerm || statusFilter !== 'ALL' || amountFilter !== 'ALL' || userFilter !== 'ALL') {
            filterTransactions();
        } else {
            displayTransactions(allTransactions);
            updateStats(allTransactions);
        }
        
        if (typeof updateCharts === 'function' && allTransactions.length > 0) {
            updateCharts(allTransactions);
        }
        
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// ============================================
// DISPLAY TRANSACTIONS
// ============================================

function displayTransactions(transactions) {
    const container = document.getElementById('transactions-container');
    const noResults = document.getElementById('no-results');
    
    console.log('Displaying transactions:', transactions.length);
    
    container.innerHTML = '';
    
    if (transactions.length === 0) {
        noResults.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    noResults.style.display = 'none';
    container.style.display = 'block';
    
    transactions.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
            <div>
                <strong>${tx.id}</strong><br>
                ${tx.sender} → ${tx.recipient}<br>
                <small style="color:#999;">${tx.timestamp}</small><br>
                Amount: $${tx.amount.toFixed(2)} USDT | Fee: $${tx.fee.toFixed(2)}
            </div>
            <div style="text-align: right;">
                <span class="status ${tx.status.toLowerCase()}">${tx.status}</span><br>
                <button onclick="viewReceipt('${tx.id}')" class="btn-receipt">
                    📄 View Receipt
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

// ============================================
// UPDATE STATISTICS
// ============================================

function updateStats(transactions) {
    const totalTx = transactions.length;
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0);
    const avgAmount = totalTx > 0 ? totalVolume / totalTx : 0;
    
    document.getElementById('total-transactions').textContent = totalTx;
    document.getElementById('total-volume').textContent = '$' + totalVolume.toFixed(2);
    document.getElementById('avg-transaction').textContent = '$' + avgAmount.toFixed(2);
    document.getElementById('total-fees').textContent = '$' + totalFees.toFixed(2);
}

// ============================================
// FORM INTERACTION TRACKING
// ============================================

document.getElementById('sender').addEventListener('focus', () => {
    isFormActive = true;
    pauseAutoRefresh();
});

document.getElementById('recipient').addEventListener('focus', () => {
    isFormActive = true;
    pauseAutoRefresh();
});

document.getElementById('amount').addEventListener('focus', () => {
    isFormActive = true;
    pauseAutoRefresh();
});

document.getElementById('sender').addEventListener('change', () => {
    isFormActive = true;
});

document.getElementById('recipient').addEventListener('change', () => {
    isFormActive = true;
});

// ============================================
// AUTO-REFRESH CONTROL
// ============================================

function pauseAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('Auto-refresh paused - form is active');
    }
}

function resumeAutoRefresh() {
    if (!autoRefreshInterval) {
        autoRefreshInterval = setInterval(async () => {
            if (!isFormActive) {
                console.log('Auto-refreshing data...');
                await loadUsers();
                await loadTransactions();
                await loadRates();
            }
        }, 5000);
        console.log('Auto-refresh resumed');
    }
}

function refreshData() {
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '⏳ Refreshing...';
        refreshBtn.disabled = true;
        
        Promise.all([loadUsers(), loadTransactions(), loadRates()])
            .then(() => {
                showNotification('✅ Data refreshed successfully!', 'success');
            })
            .catch(() => {
                showNotification('❌ Failed to refresh data', 'error');
            })
            .finally(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            });
    }
}

// ============================================
// SEND MONEY
// ============================================

document.getElementById('send-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sender = document.getElementById('sender').value;
    const recipient = document.getElementById('recipient').value;
    const amount = document.getElementById('amount').value;
    
    console.log('Sending transaction:', { sender, recipient, amount });
    
    if (!sender || !recipient || !amount) {
        showNotification('❌ Please fill all fields', 'error');
        return;
    }
    
    if (sender === recipient) {
        showNotification('❌ Cannot send to yourself!', 'error');
        return;
    }
    
    if (parseFloat(amount) <= 0) {
        showNotification('❌ Amount must be greater than 0', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('.btn-send');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Processing...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, recipient, amount })
        });
        
        const data = await response.json();
        console.log('Transaction response:', data);
        
        if (data.success) {
            showNotification('✅ Transaction successful!', 'success');
            
            document.getElementById('send-form').reset();
            isFormActive = false;
            
            await loadUsers();
            await loadTransactions();
            await loadRates();
            
            if (typeof updateCharts === 'function' && allTransactions.length > 0) {
                setTimeout(() => updateCharts(allTransactions), 500);
            }
            
            resumeAutoRefresh();
            
            setTimeout(() => {
                document.querySelector('.history-section').scrollIntoView({ behavior: 'smooth' });
            }, 800);
        } else {
            showNotification('❌ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Transaction error:', error);
        showNotification('❌ Network error', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// ============================================
// FILTER TRANSACTIONS
// ============================================

function filterTransactions() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const amountFilter = document.getElementById('filter-amount').value;
    const userFilter = document.getElementById('filter-user').value;
    
    let filtered = allTransactions.filter(tx => {
        const matchesSearch = 
            tx.id.toLowerCase().includes(searchTerm) ||
            tx.sender.toLowerCase().includes(searchTerm) ||
            tx.recipient.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
        
        if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
        
        if (amountFilter !== 'ALL') {
            const amount = tx.amount;
            if (amountFilter === '0-50' && (amount < 0 || amount > 50)) return false;
            if (amountFilter === '50-100' && (amount < 50 || amount > 100)) return false;
            if (amountFilter === '100-500' && (amount < 100 || amount > 500)) return false;
            if (amountFilter === '500+' && amount < 500) return false;
        }
        
        if (userFilter !== 'ALL') {
            if (!tx.sender.includes(userFilter) && !tx.recipient.includes(userFilter)) return false;
        }
        
        return true;
    });
    
    displayTransactions(filtered);
    updateStats(filtered);
}

// ============================================
// CLEAR FILTERS
// ============================================

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-status').value = 'ALL';
    document.getElementById('filter-amount').value = 'ALL';
    document.getElementById('filter-user').value = 'ALL';
    displayTransactions(allTransactions);
    updateStats(allTransactions);
    showNotification('✅ Filters cleared', 'success');
}

// ============================================
// EXPORT TO CSV
// ============================================

function exportToCSV() {
    if (allTransactions.length === 0) {
        showNotification('❌ No transactions to export', 'error');
        return;
    }
    
    let csv = 'Transaction ID,Sender,Recipient,Amount (USDT),Fee (USDT),Total,Status,Timestamp\n';
    
    allTransactions.forEach(tx => {
        const total = tx.amount + tx.fee;
        csv += `"${tx.id}","${tx.sender}","${tx.recipient}",${tx.amount.toFixed(2)},${tx.fee.toFixed(2)},${total.toFixed(2)},"${tx.status}","${tx.timestamp}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blockchain_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification(`✅ Exported ${allTransactions.length} transactions`, 'success');
}

// ============================================
// VIEW RECEIPT
// ============================================

function viewReceipt(txId) {
    window.open(`${API_BASE}/receipt?id=${txId}`, '_blank');
}

// ============================================
// SHOW NOTIFICATION
// ============================================

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============================================
// EXCHANGE RATES
// ============================================

async function loadRates() {
    try {
        const response = await fetch(`${API_BASE}/rates`);
        const data = await response.json();
        
        const container = document.getElementById('rates-container');
        container.innerHTML = '';
        
        for (const [currency, info] of Object.entries(data.rates)) {
            const card = document.createElement('div');
            card.className = 'rate-card';
            
            const savingsClass = info.savings >= 0 ? 'positive' : 'negative';
            const savingsText = info.savings >= 0 ? 
                `+${info.savings.toFixed(2)}` : `${info.savings.toFixed(2)}`;
            
            card.innerHTML = `
                <div class="currency-name">${currency}</div>
                <div class="rate-value">${info.rate.toFixed(4)}</div>
                <div class="recommendation ${info.recommendation}">${info.recommendation}</div>
                <div class="savings ${savingsClass}">
                    ${savingsText} vs 7-day avg<br>
                    <small>(for $100 USDT)</small>
                </div>
            `;
            container.appendChild(card);
        }
    } catch (error) {
        console.error('Error loading rates:', error);
    }
}

async function convertCurrency() {
    const amount = document.getElementById('convert-amount').value;
    const currency = document.getElementById('convert-currency').value;
    
    if (!amount || amount <= 0) {
        showNotification('Enter a valid amount', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/convert?amount=${amount}&currency=${currency}`);
        const data = await response.json();
        
        const resultDiv = document.getElementById('convert-result');
        resultDiv.innerHTML = `
            <div>
                💰 $${data.amount.toFixed(2)} USDT = 
                <strong>${data.converted.toFixed(2)} ${data.currency}</strong>
                <br><small>Rate: 1 USDT = ${data.rate.toFixed(4)} ${data.currency}</small>
            </div>
        `;
    } catch (error) {
        console.error('Error converting:', error);
    }
}

// ============================================
// USER REGISTRATION
// ============================================

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('reg-name').value.trim();
    const type = document.getElementById('reg-type').value;
    const balance = document.getElementById('reg-balance').value;
    
    if (!name) {
        showNotification('❌ Please enter a name', 'error');
        return;
    }
    
    if (parseFloat(balance) < 0) {
        showNotification('❌ Balance cannot be negative', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('.btn-register');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Creating User...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, balance })
        });
        
        const data = await response.json();
        console.log('Registration response:', data);
        
        if (data.success) {
            showNotification('✅ User registered successfully!', 'success');
            
            const infoDiv = document.getElementById('new-user-info');
            const detailsSpan = document.getElementById('new-user-details');
            detailsSpan.innerHTML = `
                <strong>Name:</strong> ${data.name || name}<br>
                <strong>Type:</strong> ${type} User<br>
                <strong>Wallet Address:</strong> ${data.address}<br>
                <strong>Initial Balance:</strong> $${parseFloat(balance).toFixed(2)} USDT
            `;
            infoDiv.style.display = 'block';
            
            document.getElementById('register-form').reset();
            
            await loadUsers();
            
            setTimeout(() => {
                infoDiv.style.display = 'none';
            }, 10000);
            
        } else {
            showNotification('❌ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('❌ Failed to register user', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// ============================================
// FAMILY VAULT
// ============================================

function addGuardianField() {
    const guardiansList = document.getElementById('guardians-list');
    const newGuardian = document.createElement('div');
    newGuardian.className = 'guardian-item';
    newGuardian.innerHTML = `
        <input type="text" class="guardian-name" placeholder="Guardian Name">
        <select class="guardian-address">
            <option value="">Select wallet...</option>
        </select>
        <input type="text" class="guardian-role" placeholder="Role (e.g., Father, Elder)">
    `;
    guardiansList.appendChild(newGuardian);
    
    populateWalletSelects();
}

async function populateWalletSelects() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        const data = await response.json();
        
        const creatorSelect = document.getElementById('vault-creator');
        if (creatorSelect) {
            const currentValue = creatorSelect.value;
            creatorSelect.innerHTML = '<option value="">Select your wallet...</option>';
            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.address;
                option.textContent = `${user.name} (${user.address.substring(0, 10)}...)`;
                creatorSelect.appendChild(option);
            });
            if (currentValue) creatorSelect.value = currentValue;
        }
        
        const guardianSelects = document.querySelectorAll('.guardian-address');
        guardianSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select wallet...</option>';
            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.address;
                option.textContent = `${user.name} (${user.address.substring(0, 10)}...)`;
                select.appendChild(option);
            });
            if (currentValue) select.value = currentValue;
        });
    } catch (error) {
        console.error('Error populating wallets:', error);
    }
}

document.getElementById('vault-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const vaultName = document.getElementById('vault-name').value;
    const purpose = document.getElementById('vault-purpose').value;
    const amount = document.getElementById('vault-amount').value;
    const creator = document.getElementById('vault-creator').value;
    
    if (!creator) {
        showNotification('❌ Please select creator wallet', 'error');
        return;
    }
    
    const guardians = [];
    const guardianItems = document.querySelectorAll('.guardian-item');
    
    guardianItems.forEach(item => {
        const name = item.querySelector('.guardian-name').value.trim();
        const address = item.querySelector('.guardian-address').value;
        const role = item.querySelector('.guardian-role').value.trim();
        
        if (name && address && role) {
            guardians.push({ name, address, role });
        }
    });
    
    if (guardians.length < 2) {
        showNotification('❌ Add at least 2 guardians', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('.btn-create-vault');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Creating Vault...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/vault/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: vaultName,
                purpose: purpose,
                amount: amount,
                creator: creator,
                guardians: guardians
            })
        });
        
        const data = await response.json();
        console.log('Vault creation response:', data);
        
        if (data.success) {
            showNotification('✅ Vault created successfully!', 'success');
            document.getElementById('vault-form').reset();
            
            document.getElementById('guardians-list').innerHTML = `
                <div class="guardian-item">
                    <input type="text" class="guardian-name" placeholder="Guardian Name">
                    <select class="guardian-address">
                        <option value="">Select wallet...</option>
                    </select>
                    <input type="text" class="guardian-role" placeholder="Role (e.g., Father, Elder)">
                </div>
            `;
            
            await loadVaults();
            populateWalletSelects();
        } else {
            showNotification('❌ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Vault creation error:', error);
        showNotification('❌ Failed to create vault', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

async function loadVaults() {
    try {
        const response = await fetch(`${API_BASE}/vaults`);
        const data = await response.json();
        
        console.log('Loaded vaults:', data.vaults);
        
        const container = document.getElementById('vaults-grid');
        container.innerHTML = '';
        
        if (data.vaults.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">No vaults created yet. Create your first vault above!</p>';
            return;
        }
        
        data.vaults.forEach(vault => {
            const progressPercent = vault.progress.toFixed(1);
            const card = document.createElement('div');
            card.className = 'vault-card';
            card.innerHTML = `
                <div class="vault-header">
                    <div class="vault-name">🏦 ${vault.name}</div>
                    <div class="vault-status active">${vault.status}</div>
                </div>
                
                <div class="vault-purpose">${vault.purpose}</div>
                
                <div class="vault-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%">
                            ${progressPercent}%
                        </div>
                    </div>
                </div>
                
                <div class="vault-amounts">
                    <div class="amount-box">
                        <div class="label">Remaining</div>
                        <div class="value">$${vault.remaining.toFixed(2)}</div>
                    </div>
                    <div class="amount-box">
                        <div class="label">Total</div>
                        <div class="value">$${vault.total.toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="vault-info">
                    <div>👥 ${vault.guardians} Guardians</div>
                    <div>📅 ${vault.created}</div>
                </div>
                
                ${vault.pending > 0 ? `<div style="text-align:center;margin:10px 0;"><span class="pending-badge">🔔 ${vault.pending} Pending Request${vault.pending > 1 ? 's' : ''}</span></div>` : ''}
                
                <div class="vault-actions">
                    <button onclick="requestWithdrawal('${vault.id}')" class="btn-request">Request Withdrawal</button>
                    <button onclick="viewVaultDetails('${vault.id}')" class="btn-view">View Details</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading vaults:', error);
    }
}

function requestWithdrawal(vaultId) {
    showNotification('🚧 Withdrawal request UI coming soon! VaultID: ' + vaultId, 'success');
}

function viewVaultDetails(vaultId) {
    showNotification('🚧 Vault details view coming soon! VaultID: ' + vaultId, 'success');
}

// ============================================
// DARK MODE
// ============================================

function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        updateToggleButton(true);
    } else {
        updateToggleButton(false);
    }
}

function toggleDarkMode() {
    const body = document.body;
    const toggleBtn = document.getElementById('theme-toggle');
    
    toggleBtn.classList.add('sparkle');
    setTimeout(() => toggleBtn.classList.remove('sparkle'), 600);
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        updateToggleButton(false);
        showNotification('☀️ Light Mode Activated', 'success');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        updateToggleButton(true);
        showNotification('🌙 Dark Mode Activated', 'success');
    }
    
    updateChartColors();
}

function updateToggleButton(isDark) {
    const toggleBtn = document.getElementById('theme-toggle');
    const icon = toggleBtn.querySelector('.toggle-icon');
    const text = toggleBtn.querySelector('.toggle-text');
    
    if (isDark) {
        icon.textContent = '☀️';
        text.textContent = 'Light Mode';
    } else {
        icon.textContent = '🌙';
        text.textContent = 'Dark Mode';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
    }
});

// ============================================
// CHARTS & ANALYTICS
// ============================================

let volumeChart, pieChart, barChart, doughnutChart;

function initCharts() {
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e2e8f0' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    const volumeCtx = document.getElementById('volumeChart').getContext('2d');
    volumeChart = new Chart(volumeCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Transaction Amount (USDT)',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
                x: { ticks: { color: textColor }, grid: { color: gridColor } }
            }
        }
    });
    
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Ahmed', 'Fatima'],
            datasets: [{ data: [0, 0], backgroundColor: ['#667eea', '#764ba2'] }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } } }
        }
    });
    
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['$0-50', '$50-100', '$100-500', '$500+'],
            datasets: [{
                label: 'Transactions',
                data: [0, 0, 0, 0],
                backgroundColor: ['#667eea', '#764ba2', '#a78bfa', '#c4b5fd']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
                x: { ticks: { color: textColor }, grid: { color: gridColor } }
            }
        }
    });
    
    const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
    doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: ['Success', 'Pending', 'Failed'],
            datasets: [{ data: [0, 0, 0], backgroundColor: ['#28a745', '#ffc107', '#dc3545'] }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } } }
        }
    });
}

function updateCharts(transactions) {
    if (!transactions || transactions.length === 0) return;
    
    const last10 = transactions.slice(0, 10).reverse();
    volumeChart.data.labels = last10.map((tx, i) => `TX${i+1}`);
    volumeChart.data.datasets[0].data = last10.map(tx => tx.amount);
    volumeChart.update();
    
    const ahmedTx = transactions.filter(tx => tx.sender === 'Ahmed' || tx.recipient === 'Ahmed').length;
    const fatimaTx = transactions.filter(tx => tx.sender === 'Fatima' || tx.recipient === 'Fatima').length;
    pieChart.data.datasets[0].data = [ahmedTx, fatimaTx];
    pieChart.update();
    
    const range1 = transactions.filter(tx => tx.amount >= 0 && tx.amount <= 50).length;
    const range2 = transactions.filter(tx => tx.amount > 50 && tx.amount <= 100).length;
    const range3 = transactions.filter(tx => tx.amount > 100 && tx.amount <= 500).length;
    const range4 = transactions.filter(tx => tx.amount > 500).length;
    barChart.data.datasets[0].data = [range1, range2, range3, range4];
    barChart.update();
    
    const success = transactions.filter(tx => tx.status === 'SUCCESS').length;
    const pending = transactions.filter(tx => tx.status === 'PENDING').length;
    const failed = transactions.filter(tx => tx.status === 'FAILED').length;
    doughnutChart.data.datasets[0].data = [success, pending, failed];
    doughnutChart.update();
}

function updateChartColors() {
    setTimeout(() => {
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#e2e8f0' : '#333';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        [volumeChart, pieChart, barChart, doughnutChart].forEach(chart => {
            if (chart) {
                chart.options.plugins.legend.labels.color = textColor;
                if (chart.options.scales) {
                    if (chart.options.scales.y) {
                        chart.options.scales.y.ticks.color = textColor;
                        chart.options.scales.y.grid.color = gridColor;
                    }
                    if (chart.options.scales.x) {
                        chart.options.scales.x.ticks.color = textColor;
                        chart.options.scales.x.grid.color = gridColor;
                    }
                }
                chart.update();
            }
        });
    }, 500);
}

// ============================================
// DOCK NAVIGATION
// ============================================

document.querySelectorAll('.dock-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        const targetSection = this.getAttribute('data-section');
        let targetElement;
        
        switch(targetSection) {
            case 'users':
                targetElement = document.querySelector('.users-section');
                break;
            case 'send':
                targetElement = document.querySelector('.transaction-section');
                break;
            case 'rates':
                targetElement = document.querySelector('.rates-section');
                break;
            case 'vault':
                targetElement = document.querySelector('.vault-section');
                break;
            case 'analytics':
                targetElement = document.querySelector('.analytics-section');
                break;
            case 'history':
                targetElement = document.querySelector('.history-section');
                break;
            default:
                targetElement = document.querySelector('.users-section');
        }
        
        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
            });
            
            targetElement.style.animation = 'pulse 0.6s ease';
            setTimeout(() => {
                targetElement.style.animation = '';
            }, 600);
        }
    });
});

let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        updateActiveNavItem();
    }, 100);
});

function updateActiveNavItem() {
    const sections = [
        { element: document.querySelector('.users-section'), name: 'users' },
        { element: document.querySelector('.register-section'), name: 'register' },
        { element: document.querySelector('.transaction-section'), name: 'send' },
        { element: document.querySelector('.rates-section'), name: 'rates' },
        { element: document.querySelector('.vault-section'), name: 'vault' },
        { element: document.querySelector('.analytics-section'), name: 'analytics' },
        { element: document.querySelector('.history-section'), name: 'history' }
    ];
    
    const scrollPosition = window.scrollY + 200;
    
    for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element && section.element.offsetTop <= scrollPosition) {
            document.querySelectorAll('.dock-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-section') === section.name) {
                    item.classList.add('active');
                }
            });
            break;
        }
    }
}

const dockItems = document.querySelectorAll('.dock-item');
const dock = document.querySelector('.dock');

dock.addEventListener('mousemove', (e) => {
    dockItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(e.clientX - itemCenterX);
        const maxDistance = 150;
        
        if (distance < maxDistance) {
            const scale = 1 + (1 - distance / maxDistance) * 0.3;
            const translateY = -(1 - distance / maxDistance) * 12;
            item.style.transform = `translateY(${translateY}px) scale(${scale})`;
        } else {
            item.style.transform = '';
        }
    });
});

dock.addEventListener('mouseleave', () => {
    dockItems.forEach(item => {
        item.style.transform = '';
    });
});

const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.02);
            box-shadow: 0 15px 50px rgba(102, 126, 234, 0.3);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// INITIALIZE EVERYTHING
// ============================================

initDarkMode();

async function initialLoad() {
    await loadUsers();
    await loadTransactions();
    await loadRates();
    await loadVaults();
    await populateWalletSelects();
}

initialLoad();

window.addEventListener('load', function() {
    initCharts();
});

resumeAutoRefresh();

window.debugTransactions = async function() {
    const response = await fetch(`${API_BASE}/transactions`);
    const data = await response.json();
    console.log('Current transactions:', data.transactions);
    console.log('Total:', data.transactions.length);
    return data.transactions;
};
