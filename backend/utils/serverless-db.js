const mongoose = require('mongoose');

// Serverless-optimized database connection utility
class ServerlessDB {
  constructor() {
    this.connectionAttempts = 0;
    this.maxRetries = 5; // Increased retries
    this.connectionPromise = null;
    this.lastConnectionTime = null;
    this.connectionHealth = 'unknown';
    this.retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
    this.healthCheckInterval = null;
    this.isConnecting = false;
  }

  async connect() {
    // If already connected, return true
    if (mongoose.connection.readyState === 1) {
      return true;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection promise
    this.connectionPromise = this._attemptConnection();
    return this.connectionPromise;
  }

  async _attemptConnection() {
    try {
      this.connectionAttempts++;
      this.isConnecting = true;
      console.log(`🔄 Serverless DB connection attempt ${this.connectionAttempts}/${this.maxRetries}`);

      // Check if MONGODB_URI exists
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable is not set');
        this.connectionHealth = 'error';
        this.isConnecting = false;
        return false;
      }

      // Ultra-optimized connection options for serverless
      const options = {
        // Ultra-fast timeouts for serverless
        serverSelectionTimeoutMS: 3000,   // 3 seconds
        socketTimeoutMS: 5000,             // 5 seconds
        connectTimeoutMS: 3000,          // 3 seconds
        
        // Optimized connection pooling for serverless
        maxPoolSize: 1,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,            // 10 seconds
        
        // Serverless-specific optimizations
        retryWrites: true,
        w: 'majority',
        bufferMaxEntries: 0,
        bufferCommands: false,
        
        // Connection string options
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // Optimized heartbeat for serverless
        heartbeatFrequencyMS: 5000,      // 5 seconds
        
        // Performance optimizations
        directConnection: false,
        compressors: 'zlib',
        zlibCompressionLevel: 6,
        
        // Additional serverless optimizations
        maxStalenessSeconds: 90,
        readPreference: 'primaryPreferred',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true }
      };

      // Optimize connection string for serverless
      let optimizedUri = process.env.MONGODB_URI;
      
      // Add serverless-specific parameters
      const serverlessParams = [
        'retryWrites=true',
        'w=majority',
        'maxPoolSize=1',
        'minPoolSize=0',
        'serverSelectionTimeoutMS=5000',
        'socketTimeoutMS=10000',
        'connectTimeoutMS=5000'
      ];
      
      const separator = optimizedUri.includes('?') ? '&' : '?';
      optimizedUri += separator + serverlessParams.join('&');

      console.log('🔗 Connecting to MongoDB with optimized URI...');

      // Connect with timeout
      const connectPromise = mongoose.connect(optimizedUri, options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Serverless connection timeout')), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);

      // Verify connection
      if (mongoose.connection.readyState === 1) {
        console.log('✅ Serverless DB connected successfully');
        this.connectionHealth = 'connected';
        this.lastConnectionTime = Date.now();
        this.isConnecting = false;
        this.startHealthMonitoring();
        return true;
      } else {
        throw new Error('Connection established but readyState is not 1');
      }

    } catch (error) {
      console.error(`❌ Serverless DB connection failed (attempt ${this.connectionAttempts}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        // Wait and retry with optimized backoff
        const waitTime = this.retryDelays[this.connectionAttempts - 1] || 16000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        this.connectionHealth = 'retrying';
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.connectionPromise = null; // Reset for retry
        return this._attemptConnection();
      } else {
        console.error('❌ Serverless DB connection failed after all retries');
        this.connectionHealth = 'failed';
        this.isConnecting = false;
        this.connectionPromise = null;
        return false;
      }
    }
  }

  async ensureConnection() {
    try {
      if (mongoose.connection.readyState === 1) {
        return true;
      }
      
      return await this.connect();
    } catch (error) {
      console.error('❌ Serverless DB ensure connection failed:', error.message);
      return false;
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  getConnectionState() {
    return mongoose.connection.readyState;
  }

  // Start health monitoring
  startHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ Database connection lost, attempting reconnection...');
        this.connectionHealth = 'disconnected';
        this.ensureConnection().catch(err => {
          console.log('⚠️ Health check reconnection failed:', err.message);
        });
      }
    }, 30000); // Check every 30 seconds
  }

  // Get comprehensive connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      health: this.connectionHealth,
      state: this.getConnectionState(),
      attempts: this.connectionAttempts,
      lastConnection: this.lastConnectionTime,
      isConnecting: this.isConnecting,
      uptime: this.lastConnectionTime ? Date.now() - this.lastConnectionTime : 0
    };
  }

  // Force reconnection
  async forceReconnect() {
    console.log('🔄 Forcing database reconnection...');
    this.connectionHealth = 'reconnecting';
    this.connectionAttempts = 0;
    this.connectionPromise = null;
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    return await this.connect();
  }

  // Cleanup
  cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Export singleton instance
module.exports = new ServerlessDB();
