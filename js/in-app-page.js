// In-App Messaging Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize SDK if configured
    if (Config.isConfigured() && !CustomerIO.getStatus().initialized) {
        CustomerIO.initialize();
    }
    
    // Update status display
    updateStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    // Listen for Customer.io events
    window.addEventListener('cio-event', handleCIOEvent);
    
    // Track page view
    setTimeout(() => {
        if (CustomerIO.getStatus().initialized) {
            CustomerIO.page('/in-app', { title: 'In-App Messaging Test' });
        }
    }, 1000);
});

function setupEventListeners() {
    // Message triggers
    document.getElementById('identifyForMessage').addEventListener('click', identifyForMessage);
    document.getElementById('triggerPageView').addEventListener('click', triggerPageView);
    document.getElementById('triggerCustomEvent').addEventListener('click', triggerCustomEvent);
    
    // Anonymous messaging
    document.getElementById('setAnonymous').addEventListener('click', setAnonymous);
    document.getElementById('triggerAnonymousEvent').addEventListener('click', triggerAnonymousEvent);
    document.getElementById('convertAnonymous').addEventListener('click', convertAnonymous);
    
    // Debug console
    document.getElementById('clearConsole').addEventListener('click', clearConsole);
}

function updateStatus() {
    const status = CustomerIO.getStatus();
    
    document.getElementById('currentUserId').textContent = status.currentUser || 'Not identified';
    document.getElementById('anonymousId').textContent = status.anonymousId || 'Not set';
    document.getElementById('sdkStatus').textContent = status.initialized ? 
        'Initialized' : 'Not initialized';
    document.getElementById('sdkStatus').style.color = status.initialized ? 
        '#28a745' : '#dc3545';
}

function identifyForMessage() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized. Please configure in the Configuration page.', 'error');
        return;
    }
    
    const userData = Config.getUserData();
    if (CustomerIO.identify(userData)) {
        showMessage(`User identified: ${userData.id}`, 'success');
        logToConsole('IDENTIFY', `User: ${userData.id}, Email: ${userData.email}`);
        updateStatus();
    }
}

function triggerPageView() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    const pageName = '/in-app-test-' + Date.now();
    if (CustomerIO.page(pageName, { 
        title: 'In-App Test Page',
        test: true,
        timestamp: new Date().toISOString()
    })) {
        showMessage(`Page view triggered: ${pageName}`, 'success');
        logToConsole('PAGE_VIEW', pageName);
    }
}

function triggerCustomEvent() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    const eventName = document.getElementById('customEventName').value || 'in_app_test';
    let eventData = {};
    
    try {
        const dataText = document.getElementById('customEventData').value;
        if (dataText) {
            eventData = JSON.parse(dataText);
        }
    } catch (e) {
        showMessage('Invalid JSON in event data', 'error');
        return;
    }
    
    if (CustomerIO.track(eventName, eventData)) {
        showMessage(`Custom event triggered: ${eventName}`, 'success');
        logToConsole('CUSTOM_EVENT', `${eventName}: ${JSON.stringify(eventData)}`);
    }
}

function setAnonymous() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    const anonymousId = CustomerIO.generateAnonymousId();
    Config.set('anonymousId', anonymousId);
    
    // Reset and set up anonymous tracking
    CustomerIO.reset();
    showMessage(`Set as anonymous user: ${anonymousId}`, 'success');
    logToConsole('ANONYMOUS', `ID: ${anonymousId}`);
    updateStatus();
}

function triggerAnonymousEvent() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    if (!CustomerIO.getStatus().anonymousId) {
        showMessage('No anonymous user set. Click "Set as Anonymous User" first.', 'error');
        return;
    }
    
    if (CustomerIO.track('anonymous_event', {
        source: 'in-app-page',
        anonymous_id: CustomerIO.getStatus().anonymousId,
        timestamp: new Date().toISOString()
    })) {
        showMessage('Anonymous event triggered', 'success');
        logToConsole('ANON_EVENT', 'anonymous_event');
    }
}

function convertAnonymous() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    if (!CustomerIO.getStatus().anonymousId) {
        showMessage('No anonymous user to convert', 'error');
        return;
    }
    
    const userData = Config.getUserData();
    if (CustomerIO.convertAnonymous(userData)) {
        showMessage(`Anonymous user converted to: ${userData.id}`, 'success');
        logToConsole('CONVERT', `Anonymous -> ${userData.id}`);
        updateStatus();
    }
}

// Test scenario functions
function testWelcomeMessage() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    // Simulate a new user identification
    const newUserId = 'new_user_' + Date.now();
    CustomerIO.identify({
        id: newUserId,
        email: `${newUserId}@test.com`,
        created_at: Math.floor(Date.now() / 1000),
        first_time_user: true
    });
    
    CustomerIO.track('first_visit', {
        page: 'in-app-test',
        source: 'test_scenario'
    });
    
    showMessage('Welcome message test triggered', 'info');
    logToConsole('TEST', 'Welcome message scenario');
}

function testFeatureAnnouncement() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    CustomerIO.track('feature_viewed', {
        feature: 'new_feature',
        version: '2.0',
        first_time: true
    });
    
    showMessage('Feature announcement test triggered', 'info');
    logToConsole('TEST', 'Feature announcement scenario');
}

function testSurvey() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    // Simulate time on page
    CustomerIO.track('time_on_page', {
        page: 'in-app-test',
        duration_seconds: 60,
        engagement: 'high'
    });
    
    showMessage('Survey test triggered', 'info');
    logToConsole('TEST', 'Survey/feedback scenario');
}

function testPromo() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    // Update user attributes for segmentation
    const userData = Config.getUserData();
    CustomerIO.identify({
        ...userData,
        eligible_for_promo: true,
        last_purchase_days_ago: 30
    });
    
    CustomerIO.track('promo_eligible', {
        promo_type: 'discount',
        value: 20
    });
    
    showMessage('Promotional test triggered', 'info');
    logToConsole('TEST', 'Promotional scenario');
}

function handleCIOEvent(event) {
    const { type, data } = event.detail;
    logToConsole(type, JSON.stringify(data));
}

function logToConsole(type, message) {
    const consoleOutput = document.getElementById('consoleOutput');
    const time = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-type">${type}</span>
        <span class="log-message">${message}</span>
    `;
    
    consoleOutput.appendChild(logEntry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
    document.getElementById('consoleOutput').innerHTML = '';
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('statusMessage');
    messageDiv.textContent = message;
    messageDiv.className = 'status-message ' + type;
    
    setTimeout(() => {
        messageDiv.className = 'status-message';
        messageDiv.textContent = '';
    }, 5000);
}

// Make test functions globally available
window.testWelcomeMessage = testWelcomeMessage;
window.testFeatureAnnouncement = testFeatureAnnouncement;
window.testSurvey = testSurvey;
window.testPromo = testPromo;
