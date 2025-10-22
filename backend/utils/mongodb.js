const mongoose = require('mongoose');

// ChatGPT's recommended MongoDB connection caching for serverless
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) throw new Error('MONGODB_URI not set');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔄 Creating new MongoDB connection...');
    const opts = {
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Optimized for serverless
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority',
      heartbeatFrequencyMS: 10000
    };
    
    cached.promise = mongoose.connect(MONGO_URI, opts).then(mongoose => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch(err => {
      console.error('❌ MongoDB connection failed:', err);
      cached.promise = null; // Reset on failure
      throw err;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// Health check function
async function checkHealth() {
  try {
    if (mongoose.connection.readyState === 1) {
      return { connected: true, state: 'connected' };
    } else {
      return { connected: false, state: mongoose.connection.readyState };
    }
  } catch (err) {
    return { connected: false, state: 'error', error: err.message };
  }
}

// Force reconnection
async function forceReconnect() {
  console.log('🔄 Forcing MongoDB reconnection...');
  cached.conn = null;
  cached.promise = null;
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  
  return await connect();
}

module.exports = { connect, checkHealth, forceReconnect };
