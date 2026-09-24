// backend/config/db.js — PRODUCTION (Vercel-safe)
import mongoose from 'mongoose';

let connectPromise = null;

const connectDB = async () => {
  // If already connected, resolve immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is in-flight, reuse it
  if (connectPromise) return connectPromise;

  if (!process.env.MONGO_URI) {
    global.__lastMongoError = 'MONGO_URI is not defined';
    console.error('❌', global.__lastMongoError);
    throw new Error(global.__lastMongoError);
  }

  connectPromise = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      family: 4,
    })
    .then((conn) => {
      global.__lastMongoError = null;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      global.__lastMongoError = err.message || String(err);
      console.error(`❌ MongoDB Error: ${err.message}`);
      connectPromise = null; // allow retry on next call
      throw err;             // propagate — caller returns 503, no exit
    });

  return connectPromise;
};

// ✅ Global listeners (attached once)
mongoose.connection.on('connected', () => {
  global.__lastMongoError = null;
  console.log('✅ Mongoose connected');
});

mongoose.connection.on('error', (err) => {
  global.__lastMongoError = err.message || String(err);
  console.error('❌ Mongoose error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected');
});

// ✅ Helper for /health
export function getMongoStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    error: global.__lastMongoError || null,
  };
}

export default connectDB;