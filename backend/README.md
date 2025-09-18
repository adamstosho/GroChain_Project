# GroChain Backend API

A comprehensive Node.js/Express.js backend API for the GroChain agricultural marketplace platform, designed to revolutionize Nigeria's agriculture value chain with end-to-end supply chain transparency, digital identities, and fintech services.

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role authentication (farmers, partners, buyers, admins)
- **Harvest Management**: Complete harvest lifecycle with QR code tracking
- **Marketplace**: Product listings, orders, and payment processing
- **Fintech Services**: Credit scoring, loan referrals, and payment processing
- **Partner System**: Referral management with commission tracking
- **QR Code System**: Provenance verification and supply chain transparency
- **Notification System**: SMS, email, and push notifications
- **Analytics**: Comprehensive reporting and insights

### Technical Features
- **RESTful API**: Well-structured endpoints with comprehensive documentation
- **Authentication**: JWT-based authentication with role-based access control
- **Security**: Rate limiting, input validation, and security headers
- **File Uploads**: Cloudinary integration for image and document storage
- **Payment Integration**: Paystack payment gateway integration
- **SMS Integration**: Multi-provider SMS support (Twilio, Africa's Talking, Termii)
- **Database**: MongoDB with Mongoose ODM and comprehensive indexing
- **Error Handling**: Centralized error handling with detailed logging
- **Validation**: Request validation using Joi schemas
- **Testing**: Comprehensive test coverage (target: ≥90%)

## 🏗️ Architecture

```
backend/
├── controllers/          # Business logic and request handlers
├── models/              # Database schemas and models
├── routes/              # API route definitions
├── middlewares/         # Custom middleware functions
├── utils/               # Utility functions and helpers
├── public/              # Static files and templates
├── app.js               # Main application file
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **Validation**: Joi schema validation
- **File Uploads**: Multer with Cloudinary
- **Payment**: Paystack integration
- **SMS**: Multi-provider support (Twilio, Africa's Talking, Termii)
- **Email**: SendGrid integration
- **Security**: Helmet, CORS, rate limiting
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB instance running (local or Atlas)
- Cloudinary account for file uploads
- Paystack account for payments
- SMS provider account (Twilio, Africa's Talking, or Termii)
- SendGrid account for emails

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GroChain/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp env.template .env
   # Edit .env with your actual configuration values
   ```

4. **Database setup**
   ```bash
   # Ensure MongoDB is running
   # The app will automatically create collections on first run
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

Copy `env.template` to `.env` and configure:

```bash
# Server
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/grochain

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Payment (Paystack)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1234567890

# File Uploads (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users` - Get all users (admin only)
- `DELETE /users/:id` - Delete user (admin only)

### Harvest Management
- `POST /harvests` - Create new harvest
- `GET /harvests` - Get user's harvests
- `GET /harvests/:id` - Get specific harvest
- `PUT /harvests/:id` - Update harvest
- `DELETE /harvests/:id` - Delete harvest

### Marketplace
- `POST /marketplace/products` - Create product listing
- `GET /marketplace/products` - Browse products
- `GET /marketplace/products/:id` - Get product details
- `POST /marketplace/orders` - Place order
- `GET /marketplace/orders` - Get user's orders

### Fintech Services
- `POST /fintech/credit-score` - Calculate credit score
- `POST /fintech/loan-application` - Submit loan application
- `GET /fintech/loan-status` - Check loan status
- `POST /fintech/payment` - Process payment

### Partner System
- `POST /partners/bulk-onboard` - Bulk farmer onboarding
- `GET /partners/referrals` - Get referral list
- `GET /partners/commissions` - Get commission earnings
- `POST /partners/referrals` - Create new referral

### QR Code System
- `GET /qr-codes` - Get user's QR codes
- `POST /qr-codes` - Generate new QR code
- `GET /qr-codes/stats` - QR code statistics
- `DELETE /qr-codes/:id` - Delete QR code

### Verification System
- `GET /verify/:batchId` - Public QR verification
- `GET /verify/harvest/:batchId` - Get harvest provenance
- `GET /verify/product/:productId` - Get product provenance

### Analytics
- `GET /analytics/dashboard` - Dashboard metrics
- `GET /analytics/harvests` - Harvest analytics
- `GET /analytics/marketplace` - Marketplace analytics
- `GET /analytics/financial` - Financial analytics

### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read
- `DELETE /notifications/:id` - Delete notification

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "farmer|partner|buyer|admin",
  "iat": "issued_at_timestamp",
  "exp": "expiration_timestamp"
}
```

### Role-Based Access Control
- **Farmer**: Harvest management, marketplace selling, profile management
- **Partner**: Referral management, commission tracking, bulk onboarding
- **Buyer**: Marketplace browsing, order placement, payment processing
- **Admin**: Full system access, user management, analytics

### Protected Routes
All routes except `/auth/*`, `/verify/*`, and `/health` require valid JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 🗄️ Database Models

### Core Models
- **User**: User accounts and authentication
- **FarmerProfile**: Extended farmer information
- **Harvest**: Harvest records with QR codes
- **Product**: Marketplace product listings
- **Order**: Customer orders and transactions
- **Transaction**: Payment and financial records
- **Partner**: Partner organization details
- **Referral**: Referral relationships
- **Commission**: Commission tracking
- **Notification**: User notifications
- **BVNVerification**: Nigerian bank verification
- **LoanReferral**: Loan referral system

### Database Indexes
Comprehensive indexing for optimal performance:
- User authentication fields
- Harvest tracking fields
- Marketplace search fields
- Financial transaction fields
- Geographic location fields

## 🔒 Security Features

### Input Validation
- Joi schema validation for all requests
- SQL injection prevention
- XSS protection
- File upload validation

### Rate Limiting
- API rate limiting (100 requests per 15 minutes)
- Authentication rate limiting (5 attempts per 15 minutes)
- Role-based rate limiting

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy
- HSTS enforcement

### Authentication Security
- JWT token expiration
- Secure password hashing (bcrypt)
- Role-based access control
- Session management

## 📊 Monitoring & Logging

### Request Logging
- Morgan HTTP request logging
- Request/response logging
- Error logging with stack traces
- Performance monitoring

### Health Checks
- Database connectivity
- External service status
- System resource monitoring
- API endpoint health

### Metrics
- Request count and response times
- Error rates and types
- Database query performance
- External API performance

## 🧪 Testing

### Test Coverage Target
- **Unit Tests**: ≥90% coverage
- **Integration Tests**: All API endpoints
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Load testing and stress testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:security
```

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up environment variables
4. Use PM2 or similar process manager
5. Set up reverse proxy (Nginx)
6. Configure SSL certificates

### Docker Deployment
```bash
# Build image
docker build -t grochain-backend .

# Run container
docker run -p 5000:5000 --env-file .env grochain-backend
```

### Environment-Specific Configs
- **Development**: Local MongoDB, mock services
- **Staging**: Staging database, real external services
- **Production**: Production database, all services enabled

## 📈 Performance Optimization

### Database Optimization
- Comprehensive indexing
- Query optimization
- Connection pooling
- Read replicas for scaling

### Caching Strategy
- Redis for session storage
- In-memory caching for frequently accessed data
- CDN for static assets

### API Optimization
- Response compression
- Pagination for large datasets
- Field selection to reduce payload
- Batch operations for bulk data

## 🔄 API Versioning

### Version Strategy
- URL-based versioning: `/api/v1/`
- Backward compatibility maintained
- Deprecation notices for old versions
- Migration guides for version updates

### Current Version
- **v1**: Current stable API
- All endpoints documented above are v1

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Ensure test coverage ≥90%
5. Submit pull request
6. Code review and merge

### Code Standards
- ESLint configuration
- Prettier formatting
- Conventional commit messages
- Comprehensive documentation

## 📞 Support

### Documentation
- API documentation: `/api/docs` (Swagger)
- Code comments and JSDoc
- README files in each directory
- Architecture documentation

### Issues & Support
- GitHub Issues for bug reports
- Feature requests via Issues
- Technical support via Discussions
- Community Discord/Slack

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- GroChain development team
- Open source community
- Nigerian agricultural stakeholders
- Technology partners and integrations

---

**GroChain Backend** - Revolutionizing Nigeria's Agriculture Value Chain through Technology and Innovation.
