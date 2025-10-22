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

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.status(200).end()
})

// Serverless connection middleware - attempt to connect on each request if needed
app.use('/api', async (req, res, next) => {
  // Only attempt connection if not already connected
  if (mongoose.connection.readyState !== 1) {
    try {
      // Quick connection attempt for serverless
      if (process.env.MONGODB_URI && mongoose.connection.readyState === 0) {
        console.log('🔄 Attempting serverless connection for request:', req.path);
        await connectDB();
      }
    } catch (err) {
      // Don't block the request if connection fails
      console.log('⚠️ Serverless connection attempt failed:', err.message);
    }
  }
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

// Initialize application
const initializeApp = async () => {
  try {
    // Connect to database first
    console.log('🚀 Initializing GroChain Backend...');
    
    // Start database connection in background (don't wait for it)
    const dbConnectionPromise = connectDB();
    
    // Set up routes immediately without waiting for database
    console.log('📡 Setting up API routes immediately...');

    // Always set up routes immediately, but add database status checks in individual route handlers
    app.use('/api/auth', require('./routes/auth.routes'));
    app.use('/api/users', require('./routes/user.routes'));
    app.use('/api/partners', require('./routes/partner.routes'));
    app.use('/api/farmers', require('./routes/farmer.routes'));
    app.use('/api/harvests', require('./routes/harvest.routes'));
    app.use('/api/harvest-approval', require('./routes/harvest-approval.routes'));
    app.use('/api/marketplace', require('./routes/marketplace.routes'));
    app.use('/api/upload', require('./routes/upload.routes'));
    app.use('/api/fintech', require('./routes/fintech.routes'));
    app.use('/api/weather', require('./routes/weather.routes'));
    app.use('/api/analytics', require('./routes/analytics.routes'));
    app.use('/api/notifications', require('./routes/notification.routes'));
    app.use('/api/payments', require('./routes/payment.routes'));
    app.use('/api/qr-codes', require('./routes/qrCode.routes'));
    console.log('✅ Registered /api/verify routes (PUBLIC - no auth required)');
    app.use('/api/verify', require('./routes/verify.routes'));
    app.use('/api/referrals', require('./routes/referral.routes'));
    app.use('/api/commissions', require('./routes/commission.routes'));
    app.use('/api/shipments', require('./routes/shipment.routes'));
    app.use('/api/shipping-update', require('./routes/shipping-update.routes'));
    app.use('/api/export-import', require('./routes/exportImport.routes'));
    app.use('/api/auth/google', require('./routes/googleAuth.routes'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/inventory', require('./routes/inventory.routes'));
    app.use('/api/reviews', require('./routes/review.routes'));
    app.use('/api/price-alerts', require('./routes/price-alert.routes'));
    app.use('/api/onboarding', require('./routes/onboarding.routes'));
    app.use('/api/debug', require('./routes/debug.route'));
    
    console.log('✅ All API routes registered successfully');
    
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
            const retryConnected = await connectDB();
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
          const retryConnected = await connectDB();
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
        console.log('🔄 Serverless database error, attempting reconnection...');
        // Attempt to reconnect
        connectDB().then((connected) => {
          if (connected) {
            console.log('✅ Database reconnected, retrying request...');
            // Retry the original request
            return next();
          } else {
            return res.status(503).json({
              status: 'error',
              message: 'Database temporarily unavailable - please try again',
              error: 'DATABASE_CONNECTION_FAILED',
              timestamp: new Date().toISOString()
            });
          }
        }).catch((retryErr) => {
          return res.status(503).json({
            status: 'error',
            message: 'Database temporarily unavailable - please try again',
            error: 'DATABASE_CONNECTION_FAILED',
            timestamp: new Date().toISOString()
          });
        });
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

