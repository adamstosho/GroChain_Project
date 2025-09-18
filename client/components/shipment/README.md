# Shipment System Components

This directory contains all the components and functionality for the GroChain shipment system. The shipment system provides end-to-end tracking and management of agricultural product deliveries.

## Components Overview

### Core Components

1. **ShipmentStatusBadge** (`shipment-status-badge.tsx`)
   - Displays shipment status with appropriate colors and icons
   - Supports all shipment statuses: pending, confirmed, in_transit, out_for_delivery, delivered, failed, returned

2. **ShipmentCard** (`shipment-card.tsx`)
   - Compact card view for displaying shipment information
   - Shows key details: route, carrier, estimated delivery, costs
   - Includes action buttons for viewing details

3. **ShipmentTrackingTimeline** (`shipment-tracking-timeline.tsx`)
   - Visual timeline of shipment tracking events
   - Shows status changes with timestamps and locations
   - Highlights the latest event

4. **ShipmentCreationForm** (`shipment-creation-form.tsx`)
   - Comprehensive form for creating new shipments
   - Includes shipping method, carrier selection, costs, special requirements
   - Supports temperature control, fragile items, packaging details

5. **ShipmentTrackingWidget** (`shipment-tracking-widget.tsx`)
   - Compact widget for displaying shipment info in order details
   - Shows latest tracking status and key information
   - Links to full shipment details

## Features

### Shipment Management
- ✅ Create shipments from confirmed orders
- ✅ Track shipment status in real-time
- ✅ Update shipment status with location and description
- ✅ Confirm delivery with proof (signature, photo, notes)
- ✅ Report issues (damage, delay, loss, quality, other)

### Tracking & Visibility
- ✅ Real-time tracking timeline
- ✅ Status updates with notifications
- ✅ Route information (origin to destination)
- ✅ Estimated vs actual delivery times
- ✅ Carrier and tracking number management

### Special Requirements
- ✅ Temperature control for perishable goods
- ✅ Fragile item handling
- ✅ Custom packaging specifications
- ✅ Special instructions
- ✅ Insurance coverage

### Integration
- ✅ Seamless integration with order flow
- ✅ Dashboard navigation for all user roles
- ✅ Offline support for shipment operations
- ✅ Mobile-responsive design

## User Roles & Permissions

### Farmers
- Create shipments for their confirmed orders
- Update shipment status during transit
- Confirm delivery when completed
- View all their shipments

### Buyers
- Track shipments for their orders
- Receive status update notifications
- Report issues with deliveries
- View shipment history

### Partners
- Manage shipments for their farmers
- Update status for partnered shipments
- Access shipment analytics
- Handle issue resolution

### Admins
- Full access to all shipments
- System-wide shipment management
- Analytics and reporting
- Issue resolution oversight

## API Integration

The shipment system integrates with the following backend endpoints:

- `POST /api/shipments` - Create new shipment
- `GET /api/shipments` - List shipments with filters
- `GET /api/shipments/:id` - Get shipment details
- `PUT /api/shipments/:id/status` - Update shipment status
- `PUT /api/shipments/:id/delivery` - Confirm delivery
- `POST /api/shipments/:id/issues` - Report issue
- `GET /api/shipments/stats/overview` - Get shipment statistics
- `GET /api/shipments/search/query` - Search shipments

## Usage Examples

### Creating a Shipment
```tsx
import { ShipmentCreationForm } from '@/components/shipment/shipment-creation-form'

<ShipmentCreationForm
  orderId="order123"
  onSuccess={(shipment) => {
    // Handle successful creation
    router.push(`/dashboard/shipments/${shipment._id}`)
  }}
  onCancel={() => router.back()}
/>
```

### Displaying Shipment Status
```tsx
import { ShipmentStatusBadge } from '@/components/shipment/shipment-status-badge'

<ShipmentStatusBadge status="in_transit" />
```

### Tracking Timeline
```tsx
import { ShipmentTrackingTimeline } from '@/components/shipment/shipment-tracking-timeline'

<ShipmentTrackingTimeline
  trackingEvents={shipment.trackingEvents}
  currentStatus={shipment.status}
/>
```

## Styling & Theming

All components use Tailwind CSS classes and follow the GroChain design system:
- Green primary colors for success states
- Blue for informational states
- Orange for warnings
- Red for errors
- Gray for neutral states

## Responsive Design

All components are fully responsive and work seamlessly across:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Accessibility

Components include proper ARIA labels, keyboard navigation, and screen reader support:
- Semantic HTML elements
- Proper color contrast ratios
- Focus management
- Descriptive alt text for icons

## Performance

- Optimized with React.memo where appropriate
- Lazy loading for large shipment lists
- Efficient re-rendering with proper dependency arrays
- Minimal bundle size impact

## Future Enhancements

- Real-time WebSocket updates
- GPS tracking integration
- Photo upload for delivery proof
- SMS/Email notifications
- Integration with external logistics APIs
- Advanced analytics and reporting
- Mobile app integration

