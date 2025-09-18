# Profile Components

This directory contains role-based profile components for the GroChain application. Each component is designed to handle the specific profile data and functionality for different user roles.

## Components

### FarmerProfile
- **File**: `farmer-profile.tsx`
- **Purpose**: Displays and manages farmer-specific profile information
- **Features**:
  - Farm details (name, size, location, crops)
  - Farming methods and irrigation types
  - Bank account information
  - Performance metrics
  - Verification status
  - Preferences and settings

### BuyerProfile
- **File**: `buyer-profile.tsx`
- **Purpose**: Displays and manages buyer-specific profile information
- **Features**:
  - Business details (name, type, size, location)
  - Product preferences and quality standards
  - Payment terms and credit limits
  - Bank account information
  - Performance metrics
  - Verification status
  - Preferences and settings

### PartnerProfile
- **File**: `partner-profile.tsx`
- **Purpose**: Displays and manages partner organization profile information
- **Features**:
  - Organization details (name, type, size, location)
  - Services offered and target regions
  - Funding sources and budget information
  - Bank account information
  - Performance metrics
  - Verification status
  - Operational preferences

### AdminProfile
- **File**: `admin-profile.tsx`
- **Purpose**: Displays and manages administrative profile information
- **Features**:
  - Employment details (ID, department, position)
  - Access levels and system permissions
  - Office location and contact information
  - Performance metrics
  - Verification status
  - System preferences and security settings

## Common Features

All profile components share the following features:

- **Edit Mode**: Toggle between view and edit modes
- **Form Validation**: Input validation and error handling
- **API Integration**: Fetch and update profile data via API
- **Loading States**: Loading spinners during API calls
- **Toast Notifications**: Success/error feedback
- **Responsive Design**: Mobile-friendly grid layouts
- **Role-Based Data**: Specific fields and options for each role

## Usage

The profile components are automatically rendered based on the user's role through the main profile page (`/dashboard/profile`). The main page determines which component to display using role-based routing.

```tsx
// Example usage in main profile page
const renderProfile = () => {
  switch (user.role) {
    case "farmer":
      return <FarmerProfile />
    case "buyer":
      return <BuyerProfile />
    case "partner":
      return <PartnerProfile />
    case "admin":
      return <AdminProfile />
    default:
      return <div>Invalid role</div>
  }
}
```

## API Endpoints

The profile components use the following API endpoints:

- **GET** `/api/profiles/{role}/me` - Fetch profile data
- **PUT** `/api/profiles/{role}/me` - Update profile data

Where `{role}` is one of: `farmers`, `buyers`, `partners`, `admins`

## Data Structure

Each profile component expects data in a specific format defined by the corresponding interface:

- `FarmerProfileData`
- `BuyerProfileData`
- `PartnerProfileData`
- `AdminProfileData`

## Styling

The components use:
- **Shadcn/ui components** for consistent UI elements
- **Tailwind CSS** for responsive layouts and styling
- **CSS Grid** for flexible card layouts
- **Badge components** for status indicators
- **Form components** for input fields and validation

## State Management

Each component manages its own state using React hooks:
- `useState` for local component state
- `useEffect` for data fetching
- `useToast` for user feedback
- Local state for edit mode and form data

## Error Handling

- API errors are displayed via toast notifications
- Loading states prevent multiple API calls
- Form validation ensures data integrity
- Graceful fallbacks for missing data

