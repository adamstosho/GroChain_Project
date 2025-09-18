# Settings Components

This directory contains role-based settings components for the GroChain application, providing customized settings interfaces for different user roles.

## Overview

The settings components provide role-specific configuration options for users to customize their experience, manage preferences, and control their data visibility and security settings.

## Components

### 1. FarmerSettings (`farmer-settings.tsx`)

**Purpose**: Provides farming-specific settings and preferences for agricultural producers.

**Features**:
- **Notifications**: Email, SMS, push notifications for harvest, weather, market alerts
- **Privacy & Security**: Profile visibility, location sharing, two-factor authentication
- **Farming Preferences**: Measurement units, crop calendar, harvest reminders
- **Language & Region**: Local language support, currency, timezone settings
- **Password Management**: Secure password change functionality
- **Data Management**: Export farming data, backup settings, partner sync

**Key Settings**:
- Harvest reminders and weather alerts
- Farm location and details visibility
- Preferred crops and farming methods
- Metric/imperial measurement units
- Nigerian local languages (Yoruba, Igbo, Hausa)

### 2. BuyerSettings (`buyer-settings.tsx`)

**Purpose**: Provides purchasing and procurement settings for agricultural buyers and processors.

**Features**:
- **Notifications**: Order updates, shipment tracking, price alerts, promotions
- **Privacy & Security**: Profile visibility, order history sharing, security settings
- **Purchasing Preferences**: Auto-reorder, bulk discounts, quality assurance
- **Language & Region**: Local preferences and currency settings
- **Password Management**: Secure password change functionality
- **Data Management**: Export purchasing data, supplier sync

**Key Settings**:
- Order and shipment notifications
- Quality standards and payment terms
- Delivery preferences and auto-reorder
- Bulk order discount preferences
- Supplier data synchronization

### 3. PartnerSettings (`partner-settings.tsx`)

**Purpose**: Provides organizational and operational settings for agricultural partners and NGOs.

**Features**:
- **Notifications**: Farmer updates, project updates, grant opportunities
- **Privacy & Security**: Profile visibility, farmer count sharing, security settings
- **Operational Preferences**: Communication methods, meeting frequency, auto-approval
- **Language & Region**: Local preferences and dashboard layouts
- **Password Management**: Secure password change functionality
- **Data Management**: Export partner data, farmer sync, data sharing

**Key Settings**:
- Preferred communication methods
- Meeting frequency and report formats
- Quality monitoring and performance tracking
- Dashboard layout preferences
- Data sharing with farmers

### 4. AdminSettings (`admin-settings.tsx`)

**Purpose**: Provides system administration and security settings for platform administrators.

**Features**:
- **Notifications**: System alerts, security events, backup status, compliance alerts
- **Privacy & Security**: Profile visibility, activity logs, advanced security
- **System Preferences**: Dashboard layouts, data refresh rates, audit logging
- **Language & Region**: Local preferences and number formats
- **Password Management**: Secure password change functionality
- **Data Management**: Export admin data, data archiving, real-time sync

**Key Settings**:
- System monitoring and alerts
- Audit logging and performance monitoring
- Data refresh rates and session management
- Advanced security features
- System backup and archiving

## API Integration

### Endpoints Used

All settings components integrate with the following backend endpoints:

```typescript
// User Preferences
GET /api/users/preferences/me
PUT /api/users/preferences/me

// User Settings
GET /api/users/settings/me
PUT /api/users/settings/me

// Password Change
POST /api/users/change-password

// Data Export
POST /api/export-import/export/{role}-data
```

### Data Structure

Each settings component uses a comprehensive interface structure:

```typescript
interface RoleSettings {
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    // Role-specific notification types
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'partners' | 'suppliers' | 'staff'
    showLocation: boolean
    showContact: boolean
    // Role-specific privacy options
  }
  preferences: {
    language: string
    theme: 'light' | 'dark' | 'auto'
    currency: string
    timezone: string
    // Role-specific preferences
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    loginNotifications: boolean
    // Role-specific security options
  }
  data: {
    autoBackup: boolean
    backupFrequency: string
    exportFormat: string
    // Role-specific data options
  }
}
```

## Usage

### Basic Implementation

```tsx
import { FarmerSettings } from '@/components/settings'

export default function SettingsPage() {
  return (
    <div>
      <FarmerSettings />
    </div>
  )
}
```

### Role-Based Rendering

```tsx
import { 
  FarmerSettings, 
  BuyerSettings, 
  PartnerSettings, 
  AdminSettings 
} from '@/components/settings'

const renderSettings = (userRole: string) => {
  switch (userRole) {
    case 'farmer':
      return <FarmerSettings />
    case 'buyer':
      return <BuyerSettings />
    case 'partner':
      return <PartnerSettings />
    case 'admin':
      return <AdminSettings />
    default:
      return <div>Invalid role</div>
  }
}
```

## Features

### Common Features Across All Components

1. **Real-time Settings Management**
   - Immediate UI updates
   - Optimistic updates with error handling
   - Auto-save functionality

2. **Comprehensive Form Controls**
   - Toggle switches for boolean settings
   - Dropdown selects for enumerated values
   - Input fields for text and password changes

3. **Responsive Design**
   - Grid-based layout for desktop
   - Stacked layout for mobile
   - Consistent spacing and typography

4. **Loading States**
   - Skeleton loaders during data fetch
   - Disabled states during save operations
   - Progress indicators for long operations

5. **Error Handling**
   - Toast notifications for success/error
   - Form validation
   - Graceful fallbacks

### Role-Specific Features

#### Farmer
- Crop-specific preferences
- Farming method selections
- Weather and harvest alerts
- Partner relationship settings

#### Buyer
- Quality standard preferences
- Payment term configurations
- Delivery preference management
- Supplier synchronization

#### Partner
- Communication method preferences
- Meeting frequency settings
- Quality monitoring controls
- Data sharing permissions

#### Admin
- System monitoring preferences
- Security event notifications
- Performance tracking settings
- Advanced data management

## Styling

### Design System

All components use the Shadcn/ui design system with consistent:
- Color schemes and typography
- Spacing and layout patterns
- Interactive states and animations
- Accessibility features

### Theme Support

- Light and dark mode compatibility
- Consistent icon usage (Lucide React)
- Responsive breakpoints
- Accessible color contrasts

## Dependencies

### Core Dependencies
- React 18+ with hooks
- TypeScript for type safety
- Shadcn/ui components
- Lucide React icons

### External Dependencies
- `@/hooks/use-toast` for notifications
- `@/lib/api` for API communication
- `@/components/ui/*` for UI components

## Performance Considerations

1. **Lazy Loading**: Components are loaded only when needed
2. **Optimized Re-renders**: Minimal state updates and efficient re-renders
3. **Debounced Saves**: Settings are saved efficiently without excessive API calls
4. **Cached Data**: Settings are cached locally and synced with backend

## Security Features

1. **Password Management**: Secure password change with current password verification
2. **Two-Factor Authentication**: Support for enhanced security
3. **Session Management**: Configurable timeout and auto-logout
4. **Data Privacy**: Granular control over data visibility
5. **Audit Logging**: Trackable changes for administrative purposes

## Future Enhancements

1. **Bulk Settings Import/Export**: CSV/JSON configuration files
2. **Settings Templates**: Pre-configured settings for common use cases
3. **Advanced Security**: Biometric authentication, IP whitelisting
4. **Real-time Collaboration**: Shared settings for team accounts
5. **Analytics Integration**: Settings usage analytics and recommendations

## Testing

### Unit Tests
- Component rendering
- State management
- API integration
- Error handling

### Integration Tests
- End-to-end settings flow
- Cross-role functionality
- API endpoint validation

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation

## Contributing

When adding new settings or modifying existing ones:

1. **Follow the established pattern** for the specific role
2. **Update the interface** to include new settings
3. **Add appropriate validation** and error handling
4. **Include loading states** for async operations
5. **Update the README** with new features
6. **Test across different roles** and scenarios

## Support

For questions or issues with the settings components:

1. Check the component-specific documentation
2. Review the API endpoint documentation
3. Test with different user roles
4. Verify backend integration
5. Check browser console for errors

