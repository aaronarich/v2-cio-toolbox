// Form Capture Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize SDK if configured
    if (Config.isConfigured() && !CustomerIO.getStatus().initialized) {
        CustomerIO.initialize();
    }
    
    // Set up form tracking
    setupFormTracking();
    
    // Set up event listeners
    setupEventListeners();
    
    // Listen for Customer.io events
    window.addEventListener('cio-event', handleCIOEvent);
    
    // Track page view
    setTimeout(() => {
        if (CustomerIO.getStatus().initialized) {
            CustomerIO.page('/form', { title: 'Form Capture Test' });
        }
    }, 1000);
});

function setupFormTracking() {
    const forms = document.querySelectorAll('.test-form');
    
    forms.forEach(form => {
        const formId = form.getAttribute('data-cio-form') || form.id;
        let formStarted = false;
        let fieldsInteracted = new Set();
        
        // Track form view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    CustomerIO.trackFormView(formId);
                    logFormEvent('FORM_VIEW', formId);
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(form);
        
        // Track form field interactions
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (!formStarted) {
                    CustomerIO.trackFormStart(formId);
                    logFormEvent('FORM_START', formId);
                    formStarted = true;
                }
                fieldsInteracted.add(input.name || input.id);
            });
            
            input.addEventListener('blur', () => {
                if (input.value) {
                    fieldsInteracted.add(input.name || input.id);
                }
            });
        });
        
        // Track form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {};
            
            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                if (data[key]) {
                    // Handle multiple values (like checkboxes)
                    if (Array.isArray(data[key])) {
                        data[key].push(value);
                    } else {
                        data[key] = [data[key], value];
                    }
                } else {
                    data[key] = value;
                }
            }
            
            // Track the submission
            CustomerIO.trackFormSubmission(formId, data);
            logFormEvent('FORM_SUBMIT', `${formId}: ${JSON.stringify(data)}`);
            
            // Show success message
            showMessage(`Form "${formId}" submitted successfully!`, 'success');
            
            // Reset form
            form.reset();
            formStarted = false;
            fieldsInteracted.clear();
            
            // If email was captured, optionally identify the user
            if (data.email && document.getElementById('autoCapture').checked) {
                const userData = {
                    id: data.email,
                    email: data.email
                };
                
                // Add other captured fields if enabled
                if (document.getElementById('captureAllFields').checked) {
                    Object.keys(data).forEach(key => {
                        if (key !== 'email' && key !== 'password') {
                            userData[key] = data[key];
                        }
                    });
                }
                
                CustomerIO.identify(userData);
                logFormEvent('AUTO_IDENTIFY', `Email: ${data.email}`);
            }
        });
        
        // Track form abandonment
        let abandonTimeout;
        form.addEventListener('focusin', () => {
            clearTimeout(abandonTimeout);
        });
        
        form.addEventListener('focusout', () => {
            abandonTimeout = setTimeout(() => {
                if (formStarted && fieldsInteracted.size > 0) {
                    // Check if form is still incomplete
                    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
                    let hasEmptyRequired = false;
                    
                    inputs.forEach(input => {
                        if (!input.value) {
                            hasEmptyRequired = true;
                        }
                    });
                    
                    if (hasEmptyRequired) {
                        CustomerIO.trackFormAbandon(formId, Array.from(fieldsInteracted));
                        logFormEvent('FORM_ABANDON', `${formId}: Fields interacted: ${fieldsInteracted.size}`);
                    }
                }
            }, 5000); // Consider abandoned after 5 seconds of inactivity
        });
    });
}

function setupEventListeners() {
    // Form interaction buttons
    document.getElementById('trackFormView').addEventListener('click', manualTrackFormView);
    document.getElementById('trackFormStart').addEventListener('click', manualTrackFormStart);
    document.getElementById('trackFormAbandon').addEventListener('click', manualTrackFormAbandon);
    
    // Clear log button
    document.getElementById('clearFormLog').addEventListener('click', clearFormLog);
    
    // Settings checkboxes
    document.getElementById('autoCapture').addEventListener('change', (e) => {
        Config.set('autoCaptureForms', e.target.checked);
        logFormEvent('SETTING', `Auto capture: ${e.target.checked}`);
    });
    
    document.getElementById('captureAllFields').addEventListener('change', (e) => {
        Config.set('captureAllFields', e.target.checked);
        logFormEvent('SETTING', `Capture all fields: ${e.target.checked}`);
    });
}

function manualTrackFormView() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    CustomerIO.trackFormView('manual_test_form');
    logFormEvent('MANUAL', 'Form view tracked');
    showMessage('Form view event tracked', 'success');
}

function manualTrackFormStart() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    CustomerIO.trackFormStart('manual_test_form');
    logFormEvent('MANUAL', 'Form start tracked');
    showMessage('Form start event tracked', 'success');
}

function manualTrackFormAbandon() {
    if (!CustomerIO.getStatus().initialized) {
        showMessage('SDK not initialized', 'error');
        return;
    }
    
    CustomerIO.trackFormAbandon('manual_test_form', ['field1', 'field2']);
    logFormEvent('MANUAL', 'Form abandonment tracked');
    showMessage('Form abandonment event tracked', 'success');
}

function handleCIOEvent(event) {
    const { type, data } = event.detail;
    
    // Only log form-related events
    if (type.toLowerCase().includes('form') || 
        (data && JSON.stringify(data).toLowerCase().includes('form'))) {
        logFormEvent('CIO_EVENT', `${type}: ${JSON.stringify(data)}`);
    }
}

function logFormEvent(type, message) {
    const logOutput = document.getElementById('formLogOutput');
    const time = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-type">${type}</span>
        <span class="log-message">${message}</span>
    `;
    
    logOutput.appendChild(logEntry);
    logOutput.scrollTop = logOutput.scrollHeight;
}

function clearFormLog() {
    document.getElementById('formLogOutput').innerHTML = '';
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
