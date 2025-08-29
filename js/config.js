// Configuration Management Module
const Config = (function() {
    const CONFIG_KEY = 'customerio_test_config';
    
    // Default configuration
    const defaultConfig = {
        writeKey: '',
        userId: 'test_user_001',
        userEmail: 'test@example.com',
        userAttributes: {
            first_name: 'Test',
            last_name: 'User',
            plan: 'premium',
            created_at: Math.floor(Date.now() / 1000)
        },
        eventName: 'page_viewed',
        eventProperties: {
            page: 'test_page',
            category: 'testing',
            timestamp: 'auto'
        },
        enableAnonymous: true,
        enableAnonymousInApp: false,
        anonymousId: '',
        autoCaptureForms: true,
        captureAllFields: true
    };

    // Load configuration from localStorage
    function load() {
        try {
            const stored = localStorage.getItem(CONFIG_KEY);
            if (stored) {
                return { ...defaultConfig, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Error loading configuration:', e);
        }
        return defaultConfig;
    }

    // Save configuration to localStorage
    function save(config) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
            return true;
        } catch (e) {
            console.error('Error saving configuration:', e);
            return false;
        }
    }

    // Clear configuration
    function clear() {
        try {
            localStorage.removeItem(CONFIG_KEY);
            return true;
        } catch (e) {
            console.error('Error clearing configuration:', e);
            return false;
        }
    }

    // Get a specific configuration value
    function get(key) {
        const config = load();
        return config[key];
    }

    // Set a specific configuration value
    function set(key, value) {
        const config = load();
        config[key] = value;
        return save(config);
    }

    // Update multiple configuration values
    function update(updates) {
        const config = load();
        Object.assign(config, updates);
        return save(config);
    }

    // Validate configuration
    function validate() {
        const config = load();
        const errors = [];

        if (!config.writeKey || config.writeKey.trim() === '') {
            errors.push('Write Key is required');
        }

        // Validate JSON fields
        if (typeof config.userAttributes === 'string') {
            try {
                JSON.parse(config.userAttributes);
            } catch (e) {
                errors.push('User Attributes must be valid JSON');
            }
        }

        if (typeof config.eventProperties === 'string') {
            try {
                JSON.parse(config.eventProperties);
            } catch (e) {
                errors.push('Event Properties must be valid JSON');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Get configuration for Customer.io SDK
    function getSDKConfig() {
        const config = load();
        return {
            writeKey: config.writeKey,
            enableAnonymous: config.enableAnonymous,
            enableAnonymousInApp: config.enableAnonymousInApp
        };
    }

    // Get user identification data
    function getUserData() {
        const config = load();
        let attributes = config.userAttributes;
        
        // Parse if it's a string
        if (typeof attributes === 'string') {
            try {
                attributes = JSON.parse(attributes);
            } catch (e) {
                attributes = {};
            }
        }

        return {
            id: config.userId,
            email: config.userEmail,
            ...attributes
        };
    }

    // Get event data
    function getEventData() {
        const config = load();
        let properties = config.eventProperties;
        
        // Parse if it's a string
        if (typeof properties === 'string') {
            try {
                properties = JSON.parse(properties);
            } catch (e) {
                properties = {};
            }
        }

        // Add timestamp if set to 'auto'
        if (properties.timestamp === 'auto') {
            properties.timestamp = new Date().toISOString();
        }

        return {
            name: config.eventName,
            properties: properties
        };
    }

    // Check if SDK is configured
    function isConfigured() {
        const config = load();
        return config.writeKey && config.writeKey.trim() !== '';
    }

    // Public API
    return {
        load,
        save,
        clear,
        get,
        set,
        update,
        validate,
        getSDKConfig,
        getUserData,
        getEventData,
        isConfigured,
        defaultConfig
    };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}
