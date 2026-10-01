import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dns from 'dns';

// 🔧 Only load .env files locally — Vercel uses dashboard env vars
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
  dotenv.config();
}

if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

import connectDB, { getMongoStatus } from './config/db.js';
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


const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: false }));

// 🔧 CORS — make it loud if FRONTEND_URL is missing
// const allowedOrigins = [
//   'http://localhost:3000',
//   'http://localhost:3001',
//   process.env.FRONTEND_URL,
//   process.env.FRONTEND_URL_ALT,
// ].filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://greenscape-admin-frontend.vercel.app',         // ← hardcoded
  'https://greenscape-admin-frontend.vercel.app/',        // ← with slash (safety)
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
].filter(Boolean);

// 🔍 Debug log so we can see what's allowed on each cold start
console.log('🔓 CORS allowed origins:', allowedOrigins);

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('❌ FRONTEND_URL is not set — CORS will block your admin panel!');
}
console.log('✅ CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.warn('🚫 CORS blocked:', origin);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'x-setup-secret', 'x-test-secret'],
}));




app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
  });
}

connectDB().catch(() => {});

app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (req.path === '/health') return next();
  if (getMongoStatus().readyState === 1) return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: 'Database unavailable',
      details: global.__lastMongoError || err.message,
    });
  }
});

app.get('/health', async (req, res) => {
  const uri = process.env.MONGO_URI || '';
  const maskedUri = uri.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.*)/, '$1***$3');
  if (getMongoStatus().readyState !== 1) {
    try { await connectDB(); } catch {}
  }
  const { state, error } = getMongoStatus();
  res.json({
    ok: true, db: state, env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    mongoUriPresent: !!uri, mongoUriLength: uri.length,
    mongoUriMasked: maskedUri || '(EMPTY)', mongoError: error,
  });
});

// 🔧 Routes — verify no path collisions across these routers
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

// 🔧 REMOVED /api/test-email — it's an attack surface. If you keep it, fix the secret check.

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
});

app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Admin Backend running on http://localhost:${PORT}`);
    testEmailConnection().then((r) => {
      console.log(r.success ? '✅ Email ready' : `⚠️ Email not ready: ${r.error}`);
    });
  });
}

export default app;