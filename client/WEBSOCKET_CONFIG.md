# WebSocket Configuration Guide

## Overview
The GroChain application uses WebSocket connections for real-time notifications. If you're experiencing WebSocket errors, follow this guide to resolve them.

## Environment Variables

Add these to your `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000

# WebSocket Configuration
NEXT_PUBLIC_DISABLE_WEBSOCKET=false
```

## Troubleshooting WebSocket Errors

### 1. Backend Server Not Running
**Error**: `websocket error` or connection timeout
**Solution**: 
- Ensure the backend server is running on port 5000
- Check that WebSocket service is initialized in `backend/app.js`

### 2. CORS Issues
**Error**: CORS policy blocking WebSocket connection
**Solution**:
- Verify CORS configuration in `backend/services/websocket.service.js`
- Ensure client URL is in the allowed origins list

### 3. Authentication Issues
**Error**: Authentication token required
**Solution**:
- Ensure user is logged in
- Check that auth token is stored in localStorage
- Verify JWT_SECRET is set in backend environment

### 4. Disable WebSocket (Fallback)
If WebSocket continues to fail, you can disable it:

```env
NEXT_PUBLIC_DISABLE_WEBSOCKET=true
```

This will fallback to polling for notifications.

## Development Setup

1. **Start Backend Server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend Server**:
   ```bash
   cd client
   npm run dev
   ```

3. **Verify WebSocket Connection**:
   - Open browser dev tools
   - Look for WebSocket connection logs
   - Check Network tab for WebSocket connections

## Error Handling

The application includes robust error handling:
- **Error Boundary**: Catches WebSocket errors and shows user-friendly messages
- **Automatic Fallback**: Falls back to polling if WebSocket fails
- **Retry Logic**: Attempts to reconnect with exponential backoff
- **Graceful Degradation**: App continues to work without real-time features

## Testing WebSocket Connection

Use the WebSocket test component at `/debug/websocket-test` to:
- Test WebSocket connectivity
- View connection logs
- Send test notifications
- Debug authentication issues

## Production Considerations

- Ensure proper SSL certificates for WSS connections
- Configure load balancer for WebSocket support
- Set appropriate timeout values
- Monitor WebSocket connection health


