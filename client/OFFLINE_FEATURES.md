# GroChain Offline Features

This document describes the offline functionality implemented in the GroChain application.

## Overview

GroChain now supports offline functionality through Progressive Web App (PWA) capabilities, allowing users to continue working even when internet connectivity is limited or unavailable.

## Features Implemented

### 1. Progressive Web App (PWA)
- **Service Worker**: Automatically caches resources and provides offline functionality
- **Web App Manifest**: Enables installation on mobile devices and desktop
- **Install Prompt**: Guides users to install the app for better experience
- **Offline Page**: Custom page shown when no cached content is available

### 2. Offline Data Management
- **Local Caching**: Critical data is cached locally for offline access
- **Action Queuing**: User actions are queued when offline and synced when online
- **Smart Sync**: Automatic synchronization when connection is restored
- **Cache Management**: Intelligent cache expiration and cleanup

### 3. Offline UI Components
- **Offline Indicator**: Shows connection status and pending actions
- **Offline Banner**: Top banner indicating offline status
- **Sync Status**: Real-time sync progress and status
- **Pending Actions**: List of queued actions waiting for sync

## Technical Implementation

### Service Worker Configuration
```javascript
// next.config.mjs
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // API caching with NetworkFirst strategy
    // Image caching with CacheFirst strategy
    // Font caching with CacheFirst strategy
  ],
});
```

### Offline Data Storage
- **localStorage**: Stores pending actions and user preferences
- **IndexedDB**: For larger data sets (future implementation)
- **Cache API**: Service worker managed caching

### Supported Offline Actions
- **Harvest Management**: Create, update harvest records
- **Marketplace**: Create listings, place orders
- **Shipments**: Create and update shipment records
- **User Profile**: View and update profile information

## Usage

### For Users
1. **Install the App**: Use the install prompt to add GroChain to your home screen
2. **Work Offline**: Continue using the app even without internet
3. **Automatic Sync**: Actions are automatically synced when online
4. **Manual Sync**: Use the sync button to manually sync pending actions

### For Developers
1. **Use Offline API**: Import `offlineApiService` for offline-capable requests
2. **Handle Offline States**: Use `useOffline` hook to detect connection status
3. **Cache Management**: Use `offlineCache` for local data storage
4. **UI Components**: Use offline indicator components for user feedback

## Configuration

### Environment Variables
- `NODE_ENV`: Controls PWA behavior (disabled in development)
- Service worker is automatically registered in production

### Cache Strategies
- **NetworkFirst**: For API calls (tries network first, falls back to cache)
- **CacheFirst**: For static assets (images, fonts, etc.)
- **StaleWhileRevalidate**: For frequently updated content

## Browser Support

- **Chrome/Edge**: Full PWA support
- **Firefox**: Full PWA support
- **Safari**: Limited PWA support (iOS 11.3+)
- **Mobile Browsers**: Full support on modern mobile browsers

## Performance Considerations

- **Cache Size**: Limited to prevent storage bloat
- **Cache Expiration**: Automatic cleanup of expired data
- **Sync Throttling**: Prevents excessive sync attempts
- **Background Sync**: Syncs data when app is not active

## Security

- **Data Encryption**: Sensitive data is encrypted before storage
- **HTTPS Required**: PWA features require secure connection
- **Token Management**: Authentication tokens are securely managed

## Troubleshooting

### Common Issues
1. **Service Worker Not Registering**: Check HTTPS and browser support
2. **Cache Not Updating**: Clear browser cache and reload
3. **Sync Failures**: Check network connection and server status
4. **Install Prompt Not Showing**: Ensure PWA criteria are met

### Debug Tools
- **Chrome DevTools**: Application tab for service worker debugging
- **Network Tab**: Monitor offline/online behavior
- **Console**: Service worker registration logs

## Future Enhancements

- **Background Sync**: Sync data when app is not active
- **Push Notifications**: Notify users of sync status
- **Conflict Resolution**: Handle data conflicts during sync
- **Offline Analytics**: Track offline usage patterns
- **Advanced Caching**: More sophisticated cache strategies

## Testing

### Manual Testing
1. Disable network in browser DevTools
2. Perform actions (create harvest, listing, etc.)
3. Re-enable network and verify sync
4. Check offline page functionality

### Automated Testing
- Service worker registration tests
- Cache functionality tests
- Sync mechanism tests
- Offline UI component tests

## Monitoring

- **Service Worker Status**: Monitor registration and updates
- **Cache Performance**: Track cache hit rates and storage usage
- **Sync Success Rate**: Monitor successful sync operations
- **User Engagement**: Track offline usage patterns

## Support

For issues related to offline functionality:
1. Check browser console for errors
2. Verify service worker registration
3. Clear browser cache and reload
4. Check network connectivity
5. Contact development team with specific error details



