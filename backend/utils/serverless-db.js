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

      // Serverless-optimized connection options
      const options = {
        // Ultra-fast timeouts for serverless
        serverSelectionTimeoutMS: 3000,   // 3 seconds
        socketTimeoutMS: 5000,            // 5 seconds
        connectTimeoutMS: 3000,           // 3 seconds
        
        // Single connection for serverless
        maxPoolSize: 1,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,            // 10 seconds
        
        // Serverless-specific options
        retryWrites: true,
        w: 'majority',
        bufferMaxEntries: 0,
        bufferCommands: false,
        
        // Connection string options
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // Heartbeat for serverless
        heartbeatFrequencyMS: 5000,      // 5 seconds
      };

      // Optimize connection string for serverless
      let optimizedUri = process.env.MONGODB_URI;
      if (optimizedUri && !optimizedUri.includes('retryWrites=true')) {
        optimizedUri += (optimizedUri.includes('?') ? '&' : '?') + 'retryWrites=true&w=majority';
      }
      if (optimizedUri && !optimizedUri.includes('maxPoolSize')) {
        optimizedUri += '&maxPoolSize=1&minPoolSize=0';
      }

      // Connect with ultra-fast timeout
      const connectPromise = mongoose.connect(optimizedUri, options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Serverless connection timeout')), 5000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);

      // Quick verification
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ Serverless DB connected successfully');
      return true;

    } catch (error) {
      console.error(`❌ Serverless DB connection failed (attempt ${this.connectionAttempts}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
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
