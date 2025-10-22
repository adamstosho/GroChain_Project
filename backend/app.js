const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const http = require('http')
require('dotenv').config()

const app = express()

// Import auto-verify middleware
const { autoVerifyPayments } = require('./middlewares/auto-verify.middleware')

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:4000',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:4000',
        'http://127.0.0.1:5000',
        "https://gro-chain.vercel.app",
        "https://gro-chain.vercel.app/",
        "https://gro-back.vercel.app",
        "https://gro-back.vercel.app/"
      ]
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // Allow all Vercel preview deployments
    if (origin && origin.includes('.vercel.app')) {
      return callback(null, true)
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log('CORS blocked origin:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}

app.use(cors(corsOptions))

// Handle preflight OPTIONS requests for serverless
app.options('*', (req, res) => {
  const origin = req.headers.origin
  const allowedOrigins = [
    'https://gro-chain.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ]
  
  if (allowedOrigins.includes(origin) || (origin && origin.includes('.vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin)
  } else {
    res.header('Access-Control-Allow-Origin', '*')
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours
  res.status(200).end()
})

// Import serverless database utility
const serverlessDB = require('./utils/serverless-db');

// Fix double slash issue in URLs
app.use((req, res, next) => {
  if (req.url.includes('//')) {
    req.url = req.url.replace(/\/+/g, '/');
  }
  next();
});

// Serverless connection middleware - attempt to connect on each request if needed
app.use('/api', async (req, res, next) => {
  // TEMPORARILY DISABLE DATABASE CONNECTION TO FIX BACKEND
  // Skip database connection for all endpoints until MONGODB_URI is properly configured
  console.log('🔄 API request received:', req.path);
  
  // Only attempt connection if MONGODB_URI exists and connection is not already established
  if (process.env.MONGODB_URI && !serverlessDB.isConnected()) {
    try {
      console.log('🔄 Attempting serverless connection for request:', req.path);
      const connected = await serverlessDB.ensureConnection();
      if (connected) {
        console.log('✅ Database connected for request:', req.path);
      } else {
        console.log('⚠️ Database connection failed for request:', req.path);
      }
    } catch (err) {
      // Don't block the request if connection fails
      console.log('⚠️ Serverless connection attempt failed:', err.message);
    }
  } else if (!process.env.MONGODB_URI) {
    console.log('⚠️ MONGODB_URI not found in environment variables');
  }
  
  // Always proceed with the request regardless of database connection status
  next();
})

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'))
} else {
  app.use(morgan('dev'))
}

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Auto-verify payments middleware
app.use(autoVerifyPayments)

// Global request logger
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Headers:`, req.headers.authorization ? 'Has Auth' : 'No Auth')
  next()
})

// Static file serving for uploaded images with CORS headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Set comprehensive CORS headers for all static files
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['http://localhost:3000']
    const origin = res.req.headers.origin
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
}))

// Additional route for avatar images with explicit CORS handling
app.get('/uploads/avatars/*', (req, res) => {
  const fs = require('fs')
  const path = require('path')
  const filePath = path.join(__dirname, req.path)

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Avatar not found' })
  }

  // Set comprehensive CORS headers
  const allowedOrigins = process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:3000']
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  // Send the file
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending avatar file:', err)
      // Check if headers have already been sent before sending error response
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to serve avatar' })
      }
    }
  })
})

// Handle OPTIONS requests for avatar images
app.options('/uploads/avatars/*', (req, res) => {
  const allowedOrigins = process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:3000']
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.status(200).end()
})

// Metrics
const client = require('prom-client')
client.collectDefaultMetrics()
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType)
    res.end(await client.register.metrics())
  } catch (e) {
    res.status(500).send('Metrics error')
  }
})

// Import rate limiting middleware
const rateLimitMiddleware = require('./middlewares/rateLimit.middleware')

// Apply rate limiting based on environment and flags
const relaxedSecurity = process.env.RELAXED_SECURITY === 'true' || process.env.NODE_ENV !== 'production'
if (process.env.RATE_LIMIT_ENABLED === 'false') {
  console.log('🧪 Rate limiting disabled via RATE_LIMIT_ENABLED=false')
} else if (relaxedSecurity) {
  app.use('/api', rateLimitMiddleware.rateLimit('api'))
  console.log('🔧 Relaxed mode: Using lenient API rate limiting; auth limits disabled if DISABLE_AUTH_RATE_LIMIT=true')
} else {
  app.use('/api/auth', rateLimitMiddleware.rateLimit('auth'))
  app.use('/api', rateLimitMiddleware.rateLimit('api'))
  console.log('🚀 Production mode: Using strict rate limiting')
}

// Serverless-optimized database connection
const connectDB = async () => {
  try {
    // If already connected, return true
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return true;
    }

    // Serverless-optimized connection options
    const options = {
      // Connection timeouts optimized for serverless
      serverSelectionTimeoutMS: 5000,   // 5 seconds for serverless
      socketTimeoutMS: 10000,           // 10 seconds for serverless
      connectTimeoutMS: 5000,           // 5 seconds for serverless
      
      // Connection pooling optimized for serverless
      maxPoolSize: 1,                   // Single connection for serverless
      minPoolSize: 0,                   // No minimum pool for serverless
      maxIdleTimeMS: 30000,            // 30 seconds idle timeout
      
      // Serverless-specific options
      retryWrites: true,
      w: 'majority',
      bufferMaxEntries: 0,             // Disable mongoose buffering
      bufferCommands: false,           // Disable mongoose buffering
      
      // Connection string options for serverless
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Heartbeat frequency for serverless
      heartbeatFrequencyMS: 10000,     // 10 seconds heartbeat
    };

    // Log presence and masked version of the URI
    const rawMongoUri = process.env.MONGODB_URI || '';
    const maskedUri = rawMongoUri
      ? rawMongoUri.replace(/(:\/\/)(.*@)/, '://***@').replace(/(.{50}).*(.{20})/, '$1...$2')
      : '';
    console.log('🔄 Attempting MongoDB connection (serverless optimized)...');
    console.log('🔍 MONGODB_URI present:', !!rawMongoUri, '  masked:', maskedUri);
    
    // Optimize connection string for serverless
    let optimizedUri = rawMongoUri;
    if (optimizedUri && !optimizedUri.includes('retryWrites=true')) {
      optimizedUri += (optimizedUri.includes('?') ? '&' : '?') + 'retryWrites=true&w=majority';
    }
    if (optimizedUri && !optimizedUri.includes('maxPoolSize')) {
      optimizedUri += '&maxPoolSize=1&minPoolSize=0';
    }

    try {
      // Connect with serverless-optimized timeout and URI
      const connectPromise = mongoose.connect(optimizedUri, options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Serverless connection timeout')), 8000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);

      // Quick connection verification
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ MongoDB connected successfully (serverless)');
      console.log('Connection state:', mongoose.connection.readyState);
      
      // Don't log sensitive connection string in production
      if (process.env.NODE_ENV !== 'production') {
        console.log("MONGODB_URI:", process.env.MONGODB_URI);
      }
    } catch (connectErr) {
      console.error('❌ MongoDB connection failed (serverless):', connectErr && connectErr.message ? connectErr.message : connectErr);
      // Print error stack for debugging
      if (connectErr && connectErr.stack) console.error('❌ MongoDB connection error stack:', connectErr.stack);
      return false;
    }
    
    // Handle connection events for serverless
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error (serverless):', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected (serverless)');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected (serverless)');
    });
    
    return true; // Indicate successful connection
  } catch (err) {
    console.error('❌ MongoDB connection failed (serverless):', err);
    return false; // Indicate failed connection
  }
};

// Root endpoint (moved outside initializeApp to ensure it's always available)
app.get('/', (req, res) => {
  const isVercel = process.env.VERCEL === '1';
  const deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${req.protocol}://${req.get('host')}`;
  
  res.json({ 
    status: 'success', 
    message: 'Welcome to GroChain Backend API',
    version: '1.0.0',
    deployment: {
      platform: isVercel ? 'Vercel' : 'Local Development',
      url: deploymentUrl,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    },
    endpoints: {
      health: '/api/health',
      documentation: '/swagger.json',
      websocket: '/notifications',
      metrics: '/metrics'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    cors: {
      origin: req.headers.origin || 'none',
      method: req.method,
      headers: req.headers
    }
  })
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    websocket: {
      enabled: false, 
      connections: 0
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  })
});

// Simplified approach - remove middleware for now

// Simplified debug endpoint for database connection issues
app.get('/api/debug/database', (req, res) => {
  try {
    const debugInfo = {
      environment: process.env.NODE_ENV || 'development',
      mongodbUriExists: !!process.env.MONGODB_URI,
      mongodbUriProdExists: !!process.env.MONGODB_URI_PROD,
      mongooseReadyState: mongoose.connection.readyState,
      serverlessDBConnected: serverlessDB.isConnected(),
      serverlessDBState: serverlessDB.getConnectionState(),
      mongooseHost: mongoose.connection.host,
      mongoosePort: mongoose.connection.port,
      mongooseName: mongoose.connection.name,
      timestamp: new Date().toISOString()
    };

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint to verify routes are working
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    database: serverlessDB.isConnected() ? 'connected' : 'disconnected'
  });
});

// Simple test endpoint for auth routes
app.post('/api/auth/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    database: serverlessDB.isConnected() ? 'connected' : 'disconnected'
  });
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const isConnected = await serverlessDB.ensureConnection();
    res.json({
      status: 'success',
      message: 'Database connection test',
      connected: isConnected,
      mongooseState: mongoose.connection.readyState,
      serverlessDBState: serverlessDB.getConnectionState(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection test failed',
      error: error.message,
      mongooseState: mongoose.connection.readyState,
      serverlessDBState: serverlessDB.getConnectionState(),
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced database connection test endpoint
app.get('/api/db-test-detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test environment variables
    const envVars = {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      VERCEL: process.env.VERCEL || 'Not set'
    };
    
    // Test connection
    const isConnected = await serverlessDB.ensureConnection();
    const connectionTime = Date.now() - startTime;
    
    res.json({
      status: 'success',
      message: 'Detailed database connection test',
      connected: isConnected,
      connectionTime: `${connectionTime}ms`,
      mongooseState: mongoose.connection.readyState,
      serverlessDBState: serverlessDB.getConnectionState(),
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Detailed database connection test failed',
      error: error.message,
      stack: error.stack,
      mongooseState: mongoose.connection.readyState,
      serverlessDBState: serverlessDB.getConnectionState(),
      timestamp: new Date().toISOString()
    });
  }
});

// MongoDB Atlas connection test endpoint
app.get('/api/mongodb-test', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test direct MongoDB connection
    const mongoose = require('mongoose');
    
    // Test connection with detailed error handling
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 10000,
      maxPoolSize: 1,
      minPoolSize: 0,
      retryWrites: true,
      w: 'majority'
    };
    
    console.log('🔄 Testing MongoDB Atlas connection...');
    console.log('🔗 Connection string format:', process.env.MONGODB_URI ? 'Valid' : 'Missing');
    
    const connectionPromise = mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    
    const connectionTime = Date.now() - startTime;
    const isConnected = mongoose.connection.readyState === 1;
    
    res.json({
      status: 'success',
      message: 'MongoDB Atlas connection test',
      connected: isConnected,
      connectionTime: `${connectionTime}ms`,
      mongooseState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    res.status(500).json({
      status: 'error',
      message: 'MongoDB Atlas connection test failed',
      error: error.message,
      errorType: error.name,
      connectionTime: `${connectionTime}ms`,
      mongooseState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  }
});

// Environment variables test endpoint (safe - no database required)
app.get('/api/env-test', (req, res) => {
  const mongoUri = process.env.MONGODB_URI;
  const isMongoUriValid = mongoUri && mongoUri.includes('mongodb') && mongoUri.includes('://');
  
  res.json({
    status: 'success',
    message: 'Environment variables test',
    environment: {
      MONGODB_URI: mongoUri ? 'Set' : 'Not set',
      MONGODB_URI_VALID: isMongoUriValid,
      MONGODB_URI_FORMAT: mongoUri ? (mongoUri.includes('mongodb+srv://') ? 'Atlas (SRV)' : 'Standard') : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      VERCEL: process.env.VERCEL || 'Not set',
      PORT: process.env.PORT || 'Not set'
    },
    timestamp: new Date().toISOString()
  });
});

// Create required directories for serverless
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log('✅ Created uploads/avatars directory');
}

// Load routes immediately outside of initialization
console.log('🚀 Loading routes immediately for serverless...');

// Core routes with error handling
try {
  app.use('/api/auth', require('./routes/auth.routes'));
  console.log('✅ Auth routes loaded immediately');
} catch (error) {
  console.error('❌ Auth routes failed to load:', error.message);
}

try {
  app.use('/api/users', require('./routes/user.routes'));
  console.log('✅ User routes loaded immediately');
} catch (error) {
  console.error('❌ User routes failed to load:', error.message);
}

try {
  app.use('/api/partners', require('./routes/partner.routes'));
  console.log('✅ Partner routes loaded immediately');
} catch (error) {
  console.error('❌ Partner routes failed to load:', error.message);
}

try {
  app.use('/api/farmers', require('./routes/farmer.routes'));
  console.log('✅ Farmer routes loaded immediately');
} catch (error) {
  console.error('❌ Farmer routes failed to load:', error.message);
}

try {
  app.use('/api/harvests', require('./routes/harvest.routes'));
  console.log('✅ Harvest routes loaded immediately');
} catch (error) {
  console.error('❌ Harvest routes failed to load:', error.message);
}

try {
  app.use('/api/marketplace', require('./routes/marketplace.routes'));
  console.log('✅ Marketplace routes loaded immediately');
} catch (error) {
  console.error('❌ Marketplace routes failed to load:', error.message);
}

try {
  app.use('/api/payments', require('./routes/payment.routes'));
  console.log('✅ Payment routes loaded immediately');
} catch (error) {
  console.error('❌ Payment routes failed to load:', error.message);
}

console.log('✅ Core routes loaded immediately for serverless');

// Initialize application
const initializeApp = async () => {
  try {
    // Connect to database first
    console.log('🚀 Initializing GroChain Backend...');
    
    // Start database connection in background (don't wait for it)
    const dbConnectionPromise = serverlessDB.connect();
    
    // Set up routes immediately without waiting for database
    console.log('📡 Setting up API routes immediately...');

    // Set up routes with error handling for serverless
    try {
      console.log('📡 Loading API routes...');
      
      // Core routes
      app.use('/api/auth', require('./routes/auth.routes'));
      console.log('✅ Auth routes loaded');
      
      app.use('/api/users', require('./routes/user.routes'));
      console.log('✅ User routes loaded');
      
      app.use('/api/partners', require('./routes/partner.routes'));
      console.log('✅ Partner routes loaded');
      
      app.use('/api/farmers', require('./routes/farmer.routes'));
      console.log('✅ Farmer routes loaded');
      
      app.use('/api/harvests', require('./routes/harvest.routes'));
      console.log('✅ Harvest routes loaded');
      
      app.use('/api/harvest-approval', require('./routes/harvest-approval.routes'));
      console.log('✅ Harvest approval routes loaded');
      
      app.use('/api/marketplace', require('./routes/marketplace.routes'));
      console.log('✅ Marketplace routes loaded');
      
      app.use('/api/upload', require('./routes/upload.routes'));
      console.log('✅ Upload routes loaded');
      
      app.use('/api/fintech', require('./routes/fintech.routes'));
      console.log('✅ Fintech routes loaded');
      
      app.use('/api/weather', require('./routes/weather.routes'));
      console.log('✅ Weather routes loaded');
      
      app.use('/api/analytics', require('./routes/analytics.routes'));
      console.log('✅ Analytics routes loaded');
      
      app.use('/api/notifications', require('./routes/notification.routes'));
      console.log('✅ Notification routes loaded');
      
      app.use('/api/payments', require('./routes/payment.routes'));
      console.log('✅ Payment routes loaded');
      
      app.use('/api/qr-codes', require('./routes/qrCode.routes'));
      console.log('✅ QR Code routes loaded');
      
      app.use('/api/verify', require('./routes/verify.routes'));
      console.log('✅ Verify routes loaded');
      
      app.use('/api/referrals', require('./routes/referral.routes'));
      console.log('✅ Referral routes loaded');
      
      app.use('/api/commissions', require('./routes/commission.routes'));
      console.log('✅ Commission routes loaded');
      
      app.use('/api/shipments', require('./routes/shipment.routes'));
      console.log('✅ Shipment routes loaded');
      
      app.use('/api/shipping-update', require('./routes/shipping-update.routes'));
      console.log('✅ Shipping update routes loaded');
      
      app.use('/api/export-import', require('./routes/exportImport.routes'));
      console.log('✅ Export/Import routes loaded');
      
      app.use('/api/auth/google', require('./routes/googleAuth.routes'));
      console.log('✅ Google Auth routes loaded');
      
      app.use('/api/admin', require('./routes/admin'));
      console.log('✅ Admin routes loaded');
      
      app.use('/api/inventory', require('./routes/inventory.routes'));
      console.log('✅ Inventory routes loaded');
      
      app.use('/api/reviews', require('./routes/review.routes'));
      console.log('✅ Review routes loaded');
      
      app.use('/api/price-alerts', require('./routes/price-alert.routes'));
      console.log('✅ Price alert routes loaded');
      
      app.use('/api/onboarding', require('./routes/onboarding.routes'));
      console.log('✅ Onboarding routes loaded');
      
      app.use('/api/debug', require('./routes/debug.route'));
      console.log('✅ Debug routes loaded');
      
      console.log('✅ All API routes registered successfully');
      
    } catch (routeError) {
      console.error('❌ Error loading routes:', routeError);
      console.error('❌ Route error details:', routeError.message);
      console.error('❌ Route error stack:', routeError.stack);
      
      // Add fallback route for debugging
      app.use('/api/*', (req, res) => {
        res.status(500).json({
          status: 'error',
          message: 'Route loading failed',
          error: routeError.message,
          timestamp: new Date().toISOString()
        });
      });
    }
    
    // Initialize inventory cleanup service
    const inventoryService = require('./services/inventory.service')
    inventoryService.startCleanupService(30) // Clean up every 30 minutes
    console.log('🧹 Inventory cleanup service started')
    
    // Check database connection status in background with retry
    dbConnectionPromise.then((dbConnected) => {
      if (dbConnected) {
        console.log('✅ Database connected successfully (serverless)');
      } else {
        console.log('⚠️ Database connection failed - retrying in background...');
        // Retry connection in background
        setTimeout(async () => {
          try {
            const retryConnected = await serverlessDB.connect();
            if (retryConnected) {
              console.log('✅ Database reconnected successfully (serverless)');
            } else {
              console.log('⚠️ Database retry failed - routes will handle database errors gracefully');
            }
          } catch (retryErr) {
            console.log('⚠️ Database retry error:', retryErr.message);
          }
        }, 5000); // Retry after 5 seconds
      }
    }).catch((err) => {
      console.log('⚠️ Database connection error (serverless):', err.message);
      // Retry connection in background
        setTimeout(async () => {
          try {
            const retryConnected = await serverlessDB.connect();
            if (retryConnected) {
              console.log('✅ Database reconnected successfully (serverless)');
            } else {
              console.log('⚠️ Database retry failed - routes will handle database errors gracefully');
            }
          } catch (retryErr) {
            console.log('⚠️ Database retry error:', retryErr.message);
          }
        }, 5000); // Retry after 5 seconds
    });
    
    // Update health check endpoint with WebSocket info
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        websocket: {
          enabled: !!webSocketService,
          connections: webSocketService ? webSocketService.getConnectionStats().totalConnections : 0
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
      })
    });
    
    // Import error handling middleware
    const { errorHandler, notFound } = require('./middlewares/error.middleware')
    
    // Serverless-specific error handler for database errors
    app.use('/api', (err, req, res, next) => {
      if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError' || err.message.includes('database')) {
        console.log('🔄 Serverless database error detected, but not blocking request...');
        // Don't block the request - just log the error and continue
        console.log('⚠️ Database error:', err.message);
        return next(); // Continue with the request
      } else {
        return next(err);
      }
    });
    
    // 404 handler
    app.use(notFound)
    
    // Global error handler
    app.use(errorHandler)
    
    console.log('✅ Application initialized successfully');
    
    // Create HTTP server for Socket.IO
    const server = http.createServer(app);

    // Configure server timeouts suitable for Render
    try {
      server.headersTimeout = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 65000)
      server.requestTimeout = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 60000)
      server.keepAliveTimeout = Number(process.env.SERVER_KEEPALIVE_TIMEOUT_MS || 60000)
      console.log('⏱️ Server timeouts configured:', {
        headersTimeout: server.headersTimeout,
        requestTimeout: server.requestTimeout,
        keepAliveTimeout: server.keepAliveTimeout
      })
    } catch (timeoutErr) {
      console.warn('⏱️ Failed to apply custom server timeouts:', timeoutErr?.message || timeoutErr)
    }

    // Initialize WebSocket service before starting the server
    const webSocketService = require('./services/websocket.service');
    
    // WebSocket endpoint is handled by Socket.IO service at /notifications path
    
    // Initialize WebSocket with server
    webSocketService.initialize(server);
    
    // Initialize inventory cleanup service
    const inventoryCleanupService = require('./services/inventory-cleanup.service');
    inventoryCleanupService.start();
    
    // Initialize shipping update service
    const shippingUpdateService = require('./services/shipping-update.service');
    shippingUpdateService.start(30); // Run every 30 minutes
    
    // Start the server only after everything is set up
    const PORT = process.env.PORT || 5000;
    const isVercel = process.env.VERCEL === '1';
    const deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${PORT}`;
    
    server.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 GROCHAIN BACKEND API DEPLOYED SUCCESSFULLY! 🚀');
      console.log('='.repeat(60));
      
      if (isVercel) {
        console.log(`🌍 DEPLOYMENT: Vercel Production Environment`);
        console.log(`🔗 API URL: ${deploymentUrl}`);
        console.log(`🏥 Health Check: ${deploymentUrl}/api/health`);
        console.log(`📚 API Documentation: ${deploymentUrl}/swagger.json`);
        console.log(`🔌 WebSocket: ${deploymentUrl.replace('https://', 'wss://')}/notifications`);
      } else {
        console.log(`🏠 LOCAL DEVELOPMENT ENVIRONMENT`);
        console.log(`🔗 API URL: ${deploymentUrl}`);
        console.log(`🏥 Health Check: ${deploymentUrl}/api/health`);
        console.log(`📚 API Documentation: ${deploymentUrl}/swagger.json`);
        console.log(`🔌 WebSocket: ${deploymentUrl.replace('http://', 'ws://')}/notifications`);
      }
      
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🧹 Inventory Cleanup: ✅ Active`);
      console.log(`📦 Shipping Updates: ✅ Active`);
      console.log(`🔔 Notifications: ✅ WebSocket Ready`);
      console.log('='.repeat(60));
      console.log('🎉 GroChain Backend is ready to serve requests!');
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    process.exit(1);
  }
};

// Start the application
initializeApp();

module.exports = app

