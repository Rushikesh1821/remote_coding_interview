import mongoose from "mongoose";
import dns from "dns";

import { ENV } from "./env.js";

let isConnecting = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

// Use system DNS instead of forcing specific DNS servers
// This allows the system to use its configured DNS (which might work better)
// Only set DNS if system DNS is not working
try {
  // Try to use system DNS first by not overriding it
  // If that doesn't work, we'll fall back to public DNS
} catch (error) {
  // Fallback to public DNS if needed
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}

export const connectDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If already connecting, wait for it
  if (isConnecting) {
    return new Promise((resolve, reject) => {
      const checkConnection = setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(checkConnection);
          resolve(mongoose.connection);
        } else if (mongoose.connection.readyState === 0 && !isConnecting) {
          clearInterval(checkConnection);
          reject(new Error("Connection failed"));
        }
      }, 100);
    });
  }

  try {
    if (!ENV.DB_URL) {
      console.warn("⚠️  DB_URL is not defined in environment variables");
      return;
    }

    isConnecting = true;
    
    // Ensure connection string has proper parameters
    let connectionUrl = ENV.DB_URL;
    if (!connectionUrl.includes('?')) {
      connectionUrl += '?retryWrites=true&w=majority';
    }
    
    // Connection options optimized for reliability
    // Don't force IPv4 - let system decide (might be IPv6 issue)
    const conn = await mongoose.connect(connectionUrl, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
      // Don't force IPv4 - let mongoose/system handle it
      // family: 4, // Removed - let system decide
      // Additional options for better connection handling
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    
    isConnecting = false;
    connectionRetries = 0;
    console.log("✅ Connected to MongoDB:", conn.connection.host);
    return conn;
  } catch (error) {
    isConnecting = false;
    connectionRetries++;
    
    console.error("❌ Error connecting to MongoDB:", error.message);
    if (error.message.includes("IP")) {
      console.error("💡 Make sure your IP address (0.0.0.0/0) is whitelisted in MongoDB Atlas");
    }
    
    // Retry connection in background (don't block server startup)
    if (ENV.NODE_ENV === "development" && connectionRetries < MAX_RETRIES) {
      console.log(`🔄 Will retry connection in background (${connectionRetries}/${MAX_RETRIES})...`);
      // Retry in background without blocking - retry more frequently
      setTimeout(() => {
        connectDB().catch(() => {
          // Silently fail retries
        });
      }, 5000);
    }
    
    console.warn("⚠️  Server will continue without database connection. Some features may not work.");
    // Don't exit in development - allow server to start for testing
    if (ENV.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

// Export a function to check connection status
export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};
