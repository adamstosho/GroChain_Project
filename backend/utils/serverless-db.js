const mongoose = require('mongoose');

// Serverless-optimized database connection utility
class ServerlessDB {
  constructor() {
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.connectionPromise = null;
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
      console.log(`🔄 Serverless DB connection attempt ${this.connectionAttempts}/${this.maxRetries}`);

      // Check if MONGODB_URI exists
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable is not set');
        return false;
      }

      // Serverless-optimized connection options
      const options = {
        // Ultra-fast timeouts for serverless
        serverSelectionTimeoutMS: 5000,   // 5 seconds
        socketTimeoutMS: 10000,           // 10 seconds
        connectTimeoutMS: 5000,          // 5 seconds
        
        // Single connection for serverless
        maxPoolSize: 1,
        minPoolSize: 0,
        maxIdleTimeMS: 30000,            // 30 seconds
        
        // Serverless-specific options
        retryWrites: true,
        w: 'majority',
        bufferMaxEntries: 0,
        bufferCommands: false,
        
        // Connection string options
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // Heartbeat for serverless
        heartbeatFrequencyMS: 10000,     // 10 seconds
        
        // Additional serverless optimizations
        directConnection: false,
        compressors: 'zlib',
        zlibCompressionLevel: 6,
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
        return true;
      } else {
        throw new Error('Connection established but readyState is not 1');
      }

    } catch (error) {
      console.error(`❌ Serverless DB connection failed (attempt ${this.connectionAttempts}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        // Wait and retry with exponential backoff
        const waitTime = Math.pow(2, this.connectionAttempts) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.connectionPromise = null; // Reset for retry
        return this._attemptConnection();
      } else {
        console.error('❌ Serverless DB connection failed after all retries');
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
}

// Export singleton instance
module.exports = new ServerlessDB();
