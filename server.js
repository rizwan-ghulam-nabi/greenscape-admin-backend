
// server.js - VERCEL PRODUCTION VERSION
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dns from 'dns';

dotenv.config({ path: '.env.local' });

// ✅ Fallback to .env if .env.local is missing (useful for CI/prod)
dotenv.config();

import { testEmailConnection } from './utils/emailService.js';
import adminRoutes from './routes/admin.route.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/category.route.js';
import bannerRoutes from './routes/banner.route.js';
import adminCustomerRoutes from './routes/Customer.route.js';
import blogRoutes from './routes/blogRoutes.js';
import collectionRoutes from './routes/collection.route.js';
import paymentRoutes from './routes/paymentRoutes.js';
import discountRoutes from './routes/discount.route.js';
import adminChatRoutes from './routes/adminChat.route.js';
import adminActionsRoutes from './routes/adminActions.route.js';
import adminReviewRoutes from './routes/adminReview.route.js';

// Only set DNS in local/dev — Vercel manages DNS
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

const app = express();
app.set('trust proxy', 1);

// ===== ✅ SECURITY HEADERS =====
app.use(helmet({ crossOriginResourcePolicy: false }));

// ===== ✅ CORS (env-driven) =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,          // e.g. https://admin-greenscape.vercel.app
  process.env.FRONTEND_URL_ALT,      // optional second domain
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow server-to-server / curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.warn('🚫 CORS blocked:', origin);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ===== ✅ Request log (prod-safe) =====
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
  });
}

// ===== ✅ MONGOOSE — cached connection for serverless =====
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  });
  isConnected = true;
  console.log('✅ MongoDB Connected');
}

// Connect eagerly (best-effort) — errors caught by requests later
connectDB().catch(err => console.error('❌ MongoDB initial connect failed:', err.message));

// Ensure DB is connected before handling any route
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ DB connect error:', err.message);
    res.status(500).json({ success: false, error: 'Database unavailable' });
  }
});

// ==========================================
// ✅ ROUTES
// ==========================================
app.use('/api/admin', adminRoutes);
app.use('/api/admin/chat', adminChatRoutes);
app.use('/api/admin/actions', adminActionsRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/admin', bannerRoutes);
app.use('/api/admin/blog', blogRoutes);
app.use('/api/admin', categoryRoutes);
app.use('/api/admin', collectionRoutes);
app.use('/api/admin', adminCustomerRoutes);
app.use('/api/admin', discountRoutes);
app.use('/api/admin', orderRoutes);
app.use('/api/admin', productRoutes);
app.use('/api/admin', paymentRoutes);

// ===== ✅ Health check (for Vercel / uptime monitors) =====
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

// ===== ✅ Email test (SECURED — requires secret header) =====
app.get('/api/test-email', async (req, res) => {
  if (req.headers['x-test-secret'] !== process.env.TEST_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const { sendEmail, testEmailConnection } = await import('./utils/emailService.js');
    const connectionTest = await testEmailConnection();
    if (!connectionTest.success) {
      return res.json({ success: false, error: connectionTest.error });
    }
    const result = await sendEmail(
      process.env.TEST_EMAIL_TO || 'you@example.com',
      '✅ GreenScape Test Email',
      `<h1>Email test OK</h1><p>${new Date().toISOString()}</p>`
    );
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ Test email error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ✅ 404 handler =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
  });
});

// ===== ✅ Error handler (no stack traces in prod) =====
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
  });
});

// ===== ✅ ONLY listen in local dev =====
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Admin Backend running on http://localhost:${PORT}`);
    testEmailConnection().then(r => {
      console.log(r.success ? '✅ Email ready' : `⚠️ Email not ready: ${r.error}`);
    });
  });
}

// ✅ Export for Vercel serverless
export default app;