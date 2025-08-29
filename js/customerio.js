// Customer.io SDK Integration Module
const CustomerIO = (function() {
    let isInitialized = false;
    let eventCount = 0;
    let currentUser = null;
    let anonymousId = null;

    // Initialize the Customer.io SDK with the new JS SDK (Pipelines SDK)
    function initializeSDK() {
        const config = Config.getSDKConfig();
        
        if (!config.writeKey) {
            console.error('Write Key is required to initialize Customer.io JS SDK');
            return false;
        }

        // Remove any existing SDK script
        const existingScript = document.getElementById('cio-analytics-script');
        if (existingScript) {
            existingScript.remove();
        }

        // Create and inject the Customer.io JS SDK (Pipelines SDK) script
        const script = document.createElement('script');
        script.id = 'cio-analytics-script';
        script.type = 'text/javascript';
        script.innerHTML = `
            !function(){var i="cioanalytics", analytics=(window[i]=window[i]||[]);if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute('data-global-customerio-analytics-key', i);t.src="https://cdp.customer.io/v1/analytics-js/snippet/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._writeKey=key;analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.15.3";
                analytics.load(
                    "${config.writeKey}",
                    ${config.enableAnonymousInApp ? `{
                        "integrations": {
                            "Customer.io In-App Plugin": {
                                anonymousInApp: true
                            }
                        }
                    }` : '{}'}
                );
                analytics.page();
            }}();
        `;
        document.head.appendChild(script);

        // Initialize with configuration
        window.cioanalytics = window.cioanalytics || [];
        
        // Wait for SDK to load and configure
        setTimeout(() => {
            if (window.cioanalytics) {
                // Set up anonymous tracking if enabled
                if (config.enableAnonymous) {
                    setupAnonymousTracking();
                }

                isInitialized = true;
                logEvent('SDK Initialized', { writeKey: config.writeKey.substring(0, 8) + '...' });
            }
        }, 1000);

        return true;
    }

    // Set up anonymous tracking
    function setupAnonymousTracking() {
        const config = Config.load();
        anonymousId = config.anonymousId || generateAnonymousId();
        
        if (window.cioanalytics) {
            // Set anonymous ID for the new SDK
            window.cioanalytics.setAnonymousId(anonymousId);
            logEvent('Anonymous Tracking Enabled', { anonymousId });
        }
    }

    // Generate a random anonymous ID
    function generateAnonymousId() {
        return 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Identify a user
    function identify(userData) {
        if (!window.cioanalytics) {
            console.error('Customer.io SDK not initialized');
            return false;
        }

        const data = userData || Config.getUserData();
        
        try {
            window.cioanalytics.identify(data.id || data.email, data);
            currentUser = data.id || data.email;
            logEvent('User Identified', data);
            return true;
        } catch (e) {
            console.error('Error identifying user:', e);
            return false;
        }
    }

    // Track an event
    function track(eventName, properties) {
        if (!window.cioanalytics) {
            console.error('Customer.io SDK not initialized');
            return false;
        }

        try {
            window.cioanalytics.track(eventName, properties || {});
            eventCount++;
            logEvent('Event Tracked', { name: eventName, properties });
            return true;
        } catch (e) {
            console.error('Error tracking event:', e);
            return false;
        }
    }

    // Track a page view
    function page(name, properties) {
        if (!window.cioanalytics) {
            console.error('Customer.io SDK not initialized');
            return false;
        }

        const pageName = name || window.location.pathname;
        
        try {
            window.cioanalytics.page(pageName, properties || {});
            eventCount++;
            logEvent('Page View Tracked', { page: pageName, properties });
            return true;
        } catch (e) {
            console.error('Error tracking page view:', e);
            return false;
        }
    }

    // Reset/logout user
    function reset() {
        if (!window.cioanalytics) {
            console.error('Customer.io SDK not initialized');
            return false;
        }

        try {
            // Reset the user session
            window.cioanalytics.reset();
            currentUser = null;
            
            const config = Config.load();
            if (config.enableAnonymous) {
                setupAnonymousTracking();
            }
            
            logEvent('User Reset', {});
            return true;
        } catch (e) {
            console.error('Error resetting user:', e);
            return false;
        }
    }

    // Convert anonymous user to identified
    function convertAnonymous(userData) {
        if (!window.cioanalytics || !anonymousId) {
            console.error('No anonymous user to convert');
            return false;
        }

        const data = userData || Config.getUserData();
        
        try {
            // Identify the user - the SDK will automatically handle the merge
            window.cioanalytics.identify(data.id || data.email, {
                ...data,
                anonymous_id: anonymousId
            });
            
            currentUser = data.id || data.email;
            const prevAnonymousId = anonymousId;
            anonymousId = null;
            logEvent('Anonymous User Converted', { from: prevAnonymousId, to: currentUser });
            return true;
        } catch (e) {
            console.error('Error converting anonymous user:', e);
            return false;
        }
    }

    // Track form submission
    function trackFormSubmission(formId, formData) {
        const eventName = `form_submitted_${formId}`;
        return track(eventName, {
            form_id: formId,
            ...formData,
            timestamp: new Date().toISOString()
        });
    }

    // Track form view
    function trackFormView(formId) {
        return track('form_viewed', {
            form_id: formId,
            timestamp: new Date().toISOString()
        });
    }

    // Track form started
    function trackFormStart(formId) {
        return track('form_started', {
            form_id: formId,
            timestamp: new Date().toISOString()
        });
    }

    // Track form abandonment
    function trackFormAbandon(formId, fieldsCompleted) {
        return track('form_abandoned', {
            form_id: formId,
            fields_completed: fieldsCompleted,
            timestamp: new Date().toISOString()
        });
    }

    // Get SDK status
    function getStatus() {
        return {
            initialized: isInitialized,
            currentUser: currentUser,
            anonymousId: anonymousId,
            eventCount: eventCount,
            sdkLoaded: typeof window.cioanalytics !== 'undefined'
        };
    }

    // Log events to console (for debugging)
    function logEvent(type, data) {
        const logEntry = {
            time: new Date().toLocaleTimeString(),
            type: type,
            data: data
        };
        
        console.log(`[Customer.io] ${type}:`, data);
        
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('cio-event', { detail: logEntry }));
    }

    // Test connection to Customer.io
    function testConnection() {
        if (!window.cioanalytics) {
            return Promise.reject('SDK not initialized');
        }

        return new Promise((resolve, reject) => {
            // Try to track a test event
            try {
                track('test_connection', {
                    timestamp: new Date().toISOString(),
                    source: 'test_site'
                });
                resolve('Connection successful');
            } catch (e) {
                reject('Connection failed: ' + e.message);
            }
        });
    }

    // Public API
    return {
        initialize: initializeSDK,
        identify,
        track,
        page,
        reset,
        convertAnonymous,
        trackFormSubmission,
        trackFormView,
        trackFormStart,
        trackFormAbandon,
        getStatus,
        testConnection,
        generateAnonymousId
    };
})();

// Auto-initialize on page load if configured
document.addEventListener('DOMContentLoaded', function() {
    if (Config.isConfigured()) {
        CustomerIO.initialize();
    }
});
