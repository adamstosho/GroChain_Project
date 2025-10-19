# Real-Time Commission System

## Overview

The real-time commission system ensures that partner dashboards update immediately when new payments are made and commissions are earned. This eliminates the need for manual refresh and provides instant feedback to partners.

## Architecture

### Backend Components

1. **Real-Time Commission Service** (`services/commission-realtime.service.js`)
   - Processes commissions when payments are made
   - Creates commission records in the database
   - Updates partner's `totalCommissions` field
   - Emits real-time updates via WebSocket
   - Creates notifications for partners

2. **WebSocket Service** (`services/websocket.service.js`)
   - Handles real-time communication between server and clients
   - Manages user connections and authentication
   - Emits commission updates to specific users and role-based rooms

3. **Payment Controller** (`controllers/payment.controller.js`)
   - Integrated with real-time commission service
   - Processes payments and triggers commission creation
   - Handles both manual payment verification and webhook processing

### Frontend Components

1. **Commission Updates Hook** (`hooks/use-commission-updates.ts`)
   - Establishes WebSocket connection for real-time updates
   - Handles commission update events
   - Provides connection status and error handling
   - Auto-reconnects on connection loss

2. **Partner Dashboard** (`components/dashboard/partner-dashboard.tsx`)
   - Uses the commission updates hook
   - Displays real-time status indicator
   - Shows toast notifications for new commissions
   - Updates commission values automatically

## How It Works

### 1. Payment Processing Flow

```
Payment Made → Payment Controller → Real-Time Commission Service → Database Update → WebSocket Emission → Frontend Update
```

1. **Payment Verification**: When a payment is verified (manual or webhook)
2. **Commission Calculation**: Real-time service calculates 2% commission for partner
3. **Database Update**: Commission record created, partner's `totalCommissions` updated
4. **WebSocket Emission**: Update sent to partner's connected devices
5. **Frontend Update**: Dashboard automatically updates with new commission data

### 2. Real-Time Update Flow

```
WebSocket Connection → Authentication → Role Room Join → Commission Update Event → Dashboard Update → Toast Notification
```

1. **Connection**: Partner dashboard establishes WebSocket connection
2. **Authentication**: JWT token verified for secure connection
3. **Room Join**: Partner joins role-based room for targeted updates
4. **Event Handling**: Commission update events processed
5. **UI Update**: Dashboard values updated, toast notification shown

## Features

### Real-Time Updates
- ✅ Instant commission updates when payments are made
- ✅ Live connection status indicator
- ✅ Automatic reconnection on connection loss
- ✅ Role-based update targeting

### User Experience
- ✅ Toast notifications for new commissions
- ✅ Visual feedback with live update indicator
- ✅ No need for manual refresh
- ✅ Error handling and connection status

### Data Integrity
- ✅ Database consistency maintained
- ✅ Commission records properly created
- ✅ Partner totals accurately updated
- ✅ Fallback mechanisms for failed updates

## Configuration

### Environment Variables

```env
# WebSocket Configuration
WS_URL=ws://localhost:5000/notifications
NEXT_PUBLIC_WS_URL=ws://localhost:5000/notifications

# Database
MONGODB_URI=mongodb://localhost:27017/grochain

# JWT
JWT_SECRET=your-jwt-secret
```

### WebSocket Connection

The frontend connects to the WebSocket server using:
- **URL**: `ws://localhost:5000/notifications`
- **Authentication**: JWT token in query parameter
- **Auto-reconnect**: 5-second delay on connection loss

## Testing

### Manual Test

1. Run the test script:
   ```bash
   node backend/test-realtime-commission.js
   ```

2. Check the partner dashboard for real-time updates

### Integration Test

1. Make a real payment through the platform
2. Verify commission appears instantly on partner dashboard
3. Check WebSocket connection status indicator

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if backend server is running
   - Verify WebSocket URL configuration
   - Check JWT token validity

2. **Commission Not Updating**
   - Verify payment was processed successfully
   - Check database for commission records
   - Review WebSocket service logs

3. **Dashboard Not Refreshing**
   - Check browser console for errors
   - Verify WebSocket connection status
   - Test manual refresh functionality

### Debug Logs

Enable debug logging by checking:
- Backend: Console logs in `commission-realtime.service.js`
- Frontend: Browser console for WebSocket events
- Network tab for WebSocket connection status

## Future Enhancements

- [ ] Commission history real-time updates
- [ ] Push notifications for mobile apps
- [ ] Commission payout real-time tracking
- [ ] Multi-currency support
- [ ] Advanced analytics real-time updates

## Security Considerations

- WebSocket connections authenticated with JWT
- Role-based access control for updates
- Rate limiting on WebSocket connections
- Secure token transmission
- Connection timeout handling
