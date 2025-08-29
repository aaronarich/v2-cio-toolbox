// Configuration Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load existing configuration into form
    loadConfiguration();
    
    // Update status display
    updateStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    // Listen for Customer.io events
    window.addEventListener('cio-event', handleCIOEvent);
});

function loadConfiguration() {
    const config = Config.load();
    
    // Populate form fields
    document.getElementById('writeKey').value = config.writeKey || '';
    document.getElementById('enableAnonymousInApp').checked = config.enableAnonymousInApp === true;
    document.getElementById('userId').value = config.userId || '';
    document.getElementById('userEmail').value = config.userEmail || '';
    document.getElementById('userAttributes').value = typeof config.userAttributes === 'object' 
        ? JSON.stringify(config.userAttributes, null, 2) 
        : config.userAttributes || '{}';
    document.getElementById('eventName').value = config.eventName || '';
    document.getElementById('eventProperties').value = typeof config.eventProperties === 'object'
        ? JSON.stringify(config.eventProperties, null, 2)
        : config.eventProperties || '{}';
    document.getElementById('enableAnonymous').checked = config.enableAnonymous !== false;
    document.getElementById('anonymousId').value = config.anonymousId || '';
}

function setupEventListeners() {
    // Save configuration
    document.getElementById('saveConfig').addEventListener('click', saveConfiguration);
    
    // Clear configuration
    document.getElementById('clearConfig').addEventListener('click', clearConfiguration);
    
    // Test connection
    document.getElementById('testConnection').addEventListener('click', testConnection);
    
    // Quick actions
    document.getElementById('identifyUser').addEventListener('click', identifyUser);
    document.getElementById('trackEvent').addEventListener('click', trackEvent);
    document.getElementById('trackPageView').addEventListener('click', trackPageView);
    document.getElementById('resetUser').addEventListener('click', resetUser);
    
    // Debug console
    document.getElementById('clearConsole').addEventListener('click', clearConsole);
}

function saveConfiguration() {
    // Gather form data
    const formData = {
        writeKey: document.getElementById('writeKey').value.trim(),
        enableAnonymousInApp: document.getElementById('enableAnonymousInApp').checked,
        userId: document.getElementById('userId').value.trim(),
        userEmail: document.getElementById('userEmail').value.trim(),
        eventName: document.getElementById('eventName').value.trim(),
        enableAnonymous: document.getElementById('enableAnonymous').checked,
        anonymousId: document.getElementById('anonymousId').value.trim()
    };
    
    // Parse JSON fields
    try {
        formData.userAttributes = document.getElementById('userAttributes').value.trim();
        if (formData.userAttributes) {
            formData.userAttributes = JSON.parse(formData.userAttributes);
        }
    } catch (e) {
        showMessage('Invalid JSON in User Attributes field', 'error');
        return;
    }
    
    try {
        formData.eventProperties = document.getElementById('eventProperties').value.trim();
        if (formData.eventProperties) {
            formData.eventProperties = JSON.parse(formData.eventProperties);
        }
    } catch (e) {
        showMessage('Invalid JSON in Event Properties field', 'error');
        return;
    }
    
    // Validate configuration
    const validation = Config.validate();
    if (!formData.writeKey) {
        showMessage('Write Key is required', 'error');
        return;
    }
    
    // Save configuration
    if (Config.save(formData)) {
        showMessage('Configuration saved successfully!', 'success');
        
        // Re-initialize SDK if write key changed
        if (CustomerIO.getStatus().initialized) {
            CustomerIO.initialize();
            showMessage('Customer.io SDK re-initialized with new settings', 'info');
        } else if (formData.writeKey) {
            CustomerIO.initialize();
            showMessage('Customer.io SDK initialized', 'info');
        }
        
        updateStatus();
    } else {
        showMessage('Failed to save configuration', 'error');
    }
}

function clearConfiguration() {
    if (confirm('Are you sure you want to clear all configuration settings?')) {
        Config.clear();
        loadConfiguration();
        showMessage('Configuration cleared', 'info');
        updateStatus();
    }
}

function testConnection() {
    if (!Config.isConfigured()) {
        showMessage('Please save your configuration first', 'error');
        return;
    }
    
    if (!CustomerIO.getStatus().initialized) {
        CustomerIO.initialize();
        setTimeout(() => testConnectionImpl(), 1500);
    } else {
        testConnectionImpl();
    }
}

function testConnectionImpl() {
    showMessage('Testing connection...', 'info');
    
    CustomerIO.testConnection()
        .then(result => {
            showMessage('Connection test successful! Check your Customer.io dashboard for the test event.', 'success');
        })
        .catch(error => {
            showMessage('Connection test failed: ' + error, 'error');
        });
}

function identifyUser() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('Please initialize the SDK first', 'error');
        return;
    }
    
    const userData = Config.getUserData();
    
    // Validate User ID is provided
    if (!userData.id || userData.id.trim() === '') {
        showMessage('User ID is required for identification', 'error');
        document.getElementById('userId').focus();
        return;
    }
    
    if (CustomerIO.identify(userData)) {
        showMessage(`User identified: ${userData.id || userData.email}`, 'success');
        updateStatus();
    } else {
        showMessage('Failed to identify user', 'error');
    }
}

function trackEvent() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('Please initialize the SDK first', 'error');
        return;
    }
    
    const eventData = Config.getEventData();
    if (CustomerIO.track(eventData.name, eventData.properties)) {
        showMessage(`Event tracked: ${eventData.name}`, 'success');
        updateStatus();
    } else {
        showMessage('Failed to track event', 'error');
    }
}

function trackPageView() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('Please initialize the SDK first', 'error');
        return;
    }
    
    const pageName = window.location.pathname;
    if (CustomerIO.page(pageName, { title: document.title })) {
        showMessage(`Page view tracked: ${pageName}`, 'success');
        updateStatus();
    } else {
        showMessage('Failed to track page view', 'error');
    }
}

function resetUser() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('Please initialize the SDK first', 'error');
        return;
    }
    
    if (CustomerIO.reset()) {
        showMessage('User reset/logged out', 'success');
        updateStatus();
    } else {
        showMessage('Failed to reset user', 'error');
    }
}

function updateStatus() {
    const status = CustomerIO.getStatus();
    
    document.getElementById('sdkStatus').textContent = status.initialized ? 
        'Initialized' : 'Not initialized';
    document.getElementById('sdkStatus').style.color = status.initialized ? 
        '#28a745' : '#dc3545';
    
    document.getElementById('currentUser').textContent = status.currentUser || 
        (status.anonymousId ? `Anonymous (${status.anonymousId})` : 'None');
    
    document.getElementById('eventCount').textContent = status.eventCount;
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('statusMessage');
    messageDiv.textContent = message;
    messageDiv.className = 'status-message ' + type;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.className = 'status-message';
        messageDiv.textContent = '';
    }, 5000);
}

function handleCIOEvent(event) {
    const detail = event.detail;
    logToConsole(detail.type, detail.data);
    updateStatus();
}

function logToConsole(type, data) {
    const consoleOutput = document.getElementById('consoleOutput');
    if (!consoleOutput) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const time = new Date().toLocaleTimeString();
    const message = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    
    logEntry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-type">${type}</span>
        <span class="log-message">${message}</span>
    `;
    
    consoleOutput.insertBefore(logEntry, consoleOutput.firstChild);
    
    // Keep only last 50 entries
    while (consoleOutput.children.length > 50) {
        consoleOutput.removeChild(consoleOutput.lastChild);
    }
}

function clearConsole() {
    const consoleOutput = document.getElementById('consoleOutput');
    if (consoleOutput) {
        consoleOutput.innerHTML = '';
    }
    logToConsole('CONSOLE', 'Console cleared');
}
