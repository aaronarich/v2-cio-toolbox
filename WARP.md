# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Customer.io test site for validating and debugging Customer.io JavaScript SDK (formerly Pipelines SDK) integrations. It provides a web interface for testing:
- SDK configuration and initialization
- User identification and event tracking
- In-app messaging
- Form capture and tracking

## Architecture

### Directory Structure
```
customerio-test-site/
├── index.html          # Configuration page for SDK setup
├── in-app.html         # In-app messaging test page
├── form.html           # Form capture testing page
├── css/
│   └── styles.css      # Shared styles for all pages
└── js/
    ├── config.js               # Configuration management module
    ├── customerio.js           # Customer.io SDK wrapper/integration module
    ├── configuration-page.js   # Configuration page specific logic
    ├── in-app-page.js         # In-app messaging page logic
    └── form-page.js           # Form capture page logic
```

### Core Modules

#### config.js
Central configuration management using localStorage. Handles:
- SDK credentials (write key)
- User identification data
- Event tracking configuration
- Anonymous tracking settings
- Form capture preferences

Key functions:
- `Config.load()` - Load configuration from localStorage
- `Config.save(config)` - Save configuration
- `Config.getSDKConfig()` - Get SDK-specific configuration
- `Config.getUserData()` - Get user identification data
- `Config.getEventData()` - Get event tracking data

#### customerio.js
Wrapper around the Customer.io JavaScript SDK providing:
- SDK initialization with the new JS SDK (Pipelines SDK)
- User identification and anonymous tracking
- Event and page view tracking
- Form interaction tracking
- Connection testing

Key functions:
- `CustomerIO.initialize()` - Initialize SDK with configuration
- `CustomerIO.identify(userData)` - Identify a user
- `CustomerIO.track(eventName, properties)` - Track custom events
- `CustomerIO.page(name, properties)` - Track page views
- `CustomerIO.reset()` - Reset/logout user
- `CustomerIO.convertAnonymous(userData)` - Convert anonymous to identified user

## Development Commands

### Running the Site
```bash
# Open the site directly in browser (no build process required)
open index.html

# Or use a local HTTP server for better testing
python3 -m http.server 8000
# Then navigate to http://localhost:8000
```

### Git Operations
```bash
# Check current status
git status

# Commit changes
git add .
git commit -m "Your commit message"

# View recent changes
git log --oneline -10
```

## Testing Workflow

### 1. Initial Setup
1. Open `index.html` in browser
2. Enter your Customer.io Write Key (from Data & Integrations > Sources > JavaScript Source)
3. Configure user identification data
4. Save configuration

### 2. Test User Identification
```javascript
// From browser console or use UI buttons:
CustomerIO.identify({
    id: 'test_user_001',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User'
});
```

### 3. Test Event Tracking
```javascript
// Track custom events
CustomerIO.track('button_clicked', {
    button_name: 'test_button',
    page: window.location.pathname
});

// Track page views
CustomerIO.page('/test-page', {
    title: 'Test Page'
});
```

### 4. Test In-App Messaging
1. Navigate to `in-app.html`
2. Ensure user is identified or anonymous tracking is enabled
3. Trigger events that match your campaign conditions
4. Messages will appear in the designated display area

### 5. Test Form Capture
1. Navigate to `form.html`
2. Forms automatically track:
   - Form views (when visible)
   - Form starts (first field interaction)
   - Form submissions
   - Form abandonment (after 5 seconds of inactivity)

## Customer.io SDK Integration Points

### SDK Initialization
The site uses the new Customer.io JavaScript SDK (Pipelines SDK). The SDK is dynamically loaded with:
```javascript
analytics.load("YOUR_WRITE_KEY", {
    integrations: {
        "Customer.io In-App Plugin": {
            anonymousInApp: true  // Enable for anonymous in-app messages
        }
    }
});
```

### Event Naming Conventions
- Form events: `form_submitted_[formId]`, `form_viewed`, `form_started`, `form_abandoned`
- Page views: Use actual pathname or custom names
- Test events: `test_connection`, `in_app_test`, `anonymous_event`

### Data Flow
1. **Configuration** → localStorage → `Config` module
2. **User Actions** → Event handlers → `CustomerIO` wrapper
3. **CustomerIO wrapper** → Customer.io SDK (`window.cioanalytics`)
4. **SDK** → Customer.io platform

## Debugging

### Browser Console
All Customer.io events are logged to console with `[Customer.io]` prefix.

### Event Monitoring
The site dispatches custom `cio-event` events that can be monitored:
```javascript
window.addEventListener('cio-event', (e) => {
    console.log('Customer.io Event:', e.detail);
});
```

### Debug Console
Both in-app.html and form.html include debug consoles that display real-time event logs.

### Common Issues
1. **SDK not initializing**: Check Write Key is correct
2. **No in-app messages**: Verify campaign conditions and user identification
3. **Events not tracking**: Check browser console for errors, ensure SDK is initialized
4. **Form tracking not working**: Verify forms have `data-cio-form` attribute or unique IDs

## Key Files to Modify

### Adding New Test Scenarios
- **In-app messaging**: Modify `js/in-app-page.js` test functions
- **Form types**: Add new forms in `form.html` with class `test-form`
- **Event types**: Add tracking calls in respective page JS files

### Styling Changes
- All styles in `css/styles.css`
- Uses modern CSS with flexbox/grid
- Color scheme: Primary blue (#4B5CFA), success green (#28a745)

### Configuration Options
- Default values in `js/config.js` → `defaultConfig` object
- Add new config fields by extending the object and update save/load logic
