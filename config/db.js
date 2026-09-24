// backend/config/db.js — PRODUCTION VERSION (Vercel-safe)
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
    const err = new Error('MONGO_URI is not defined');
    console.error('❌', err.message);
    throw err;   // let the caller handle it — DON'T exit
  }

  connectPromise = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      family: 4,
    })
    .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      console.error(`❌ MongoDB Error: ${err.message}`);
      connectPromise = null;   // allow retry on next call
      throw err;               // propagate to caller — DON'T exit
    });

  return connectPromise;
};

export default connectDB;