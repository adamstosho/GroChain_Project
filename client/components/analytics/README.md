# GroChain Analytics Components

This directory contains role-based analytics components for the GroChain platform. Each component provides tailored insights and metrics based on the user's role.

## Components

### 1. FarmerAnalytics
**Purpose**: Provides insights for farmers on their harvest performance, earnings, and farm productivity.

**Key Features**:
- Total harvests count and approval rate
- Revenue tracking and trends
- Active marketplace listings
- Credit score monitoring
- Harvest quality metrics
- Crop performance analysis

**Tabs**:
- **Overview**: Harvest trends, revenue analysis, and quick stats
- **Harvest Analysis**: Monthly harvest volume and revenue growth
- **Crop Performance**: Crop distribution and performance charts
- **Quality Metrics**: Quality breakdown and trends

### 2. BuyerAnalytics
**Purpose**: Tracks purchasing patterns, spending analysis, and supplier performance for buyers.

**Key Features**:
- Total orders and completion rate
- Spending analysis and trends
- Favorite products tracking
- Pending deliveries
- Supplier performance metrics
- Category spending breakdown

**Tabs**:
- **Overview**: Purchase trends, spending analysis, and quick stats
- **Purchase Analysis**: Order volume and spending growth
- **Category Spending**: Spending distribution across categories
- **Supplier Performance**: Supplier ratings and delivery performance

### 3. PartnerAnalytics
**Purpose**: Monitors farmer network performance, commission earnings, and regional impact for partners.

**Key Features**:
- Total farmers in network
- Harvest volume and approval rates
- Commission earnings tracking
- Regional distribution analysis
- Top performing farmers
- Network growth metrics

**Tabs**:
- **Overview**: Network growth, performance trends, and quick stats
- **Farmer Network**: Farmer growth and harvest trends
- **Regional Analysis**: Regional distribution and performance
- **Performance Metrics**: Commission breakdown and network efficiency

### 4. AdminAnalytics
**Purpose**: Platform-wide insights, user growth, and system performance metrics for administrators.

**Key Features**:
- Total users and active users
- Platform revenue and growth
- Harvest statistics and approval rates
- User distribution by role
- Regional performance analysis
- Platform health metrics

**Tabs**:
- **Overview**: Platform growth, performance trends, and quick stats
- **User Analytics**: User distribution and growth trends
- **Regional Data**: Regional performance and user distribution
- **Quality Metrics**: Platform health and quality indicators

## Usage

### Basic Implementation
```tsx
import { FarmerAnalytics, BuyerAnalytics, PartnerAnalytics, AdminAnalytics } from "@/components/analytics"

// Role-based rendering
const renderAnalytics = () => {
  switch (user.role) {
    case "farmer":
      return <FarmerAnalytics />
    case "buyer":
      return <BuyerAnalytics />
    case "partner":
      return <PartnerAnalytics />
    case "admin":
      return <AdminAnalytics />
    default:
      return <div>Invalid role</div>
  }
}
```

### API Integration
Each component automatically fetches data from the appropriate analytics endpoints:

- **Farmers**: `/api/analytics/farmers/me`
- **Buyers**: `/api/analytics/buyers/{buyerId}`
- **Partners**: `/api/analytics/partners/me`
- **Admins**: `/api/analytics/dashboard`

### Customization
Components support:
- Time range selection (7d, 30d, 90d, 1y)
- Data refresh functionality
- Export capabilities
- Responsive design for mobile and desktop

## Data Structure

### Common Analytics Data
```typescript
interface BaseAnalyticsData {
  timeRange: "7d" | "30d" | "90d" | "1y"
  isLoading: boolean
  error: string | null
}
```

### Chart Data
```typescript
interface ChartData {
  name: string
  value: number
  [key: string]: any
}
```

## Dependencies

- **Recharts**: For chart rendering
- **Lucide React**: For icons
- **Tailwind CSS**: For styling
- **Radix UI**: For UI components

## Styling

Components use Tailwind CSS classes and follow the GroChain design system:
- Consistent color scheme
- Responsive grid layouts
- Card-based design
- Interactive hover states
- Loading states and skeletons

## Performance

- Lazy loading of chart components
- Optimized re-renders
- Efficient data fetching
- Responsive chart sizing

## Accessibility

- ARIA labels for charts
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

## Future Enhancements

- Real-time data updates via WebSocket
- Advanced filtering and search
- Custom date range selection
- Data export in multiple formats
- Mobile-optimized charts
- Offline data caching

