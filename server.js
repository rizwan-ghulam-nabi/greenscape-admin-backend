// server.js — VERCEL PRODUCTION VERSION
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dns from 'dns';

// ✅ Load env FIRST
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

// ✅ Local dev DNS (Vercel manages its own)
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

// ✅ Mongo (single source of truth)
import connectDB, { getMongoStatus } from './config/db.js';

// ✅ Services
import { testEmailConnection } from './utils/emailService.js';

// ✅ Routes
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

// ===== ✅ SECURITY HEADERS =====
app.use(helmet({ crossOriginResourcePolicy: false }));

// ===== ✅ CORS (env-driven) =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl
      if (allowedOrigins.includes(origin)) return cb(null, true);
      console.warn('🚫 CORS blocked:', origin);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'x-setup-secret', 'x-test-secret'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ===== ✅ Request log (dev only) =====
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
  });
}

// ===== ✅ MongoDB — eager connect + per-request guard =====
connectDB().catch(() => {
  // Error stored in global.__lastMongoError — visible via /health
});

app.use(async (req, res, next) => {
  // Skip health + CORS preflight
  if (req.method === 'OPTIONS') return next();
  if (req.path === '/health' || req.path === '/api/test-email') return next();

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

// ==========================================
// ✅ HEALTH CHECK
// ==========================================
app.get('/health', async (req, res) => {
  const uri = process.env.MONGO_URI || '';
  const maskedUri = uri.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.*)/, '$1***$3');

  // Force a connect attempt if not connected — captures the real error
  if (getMongoStatus().readyState !== 1) {
    try {
      await connectDB();
    } catch {
      // stored in global.__lastMongoError
    }
  }

  const { state, error } = getMongoStatus();

  res.json({
    ok: true,
    db: state,
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    mongoUriPresent: !!uri,
    mongoUriLength: uri.length,
    mongoUriMasked: maskedUri || '(EMPTY)',
    mongoError: error,
  });
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

// ==========================================
// ✅ SECURED TEST EMAIL
// ==========================================
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

// ==========================================
// ✅ 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
  });
});

// ==========================================
// ✅ GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
  });
});

// ==========================================
// ✅ LOCAL DEV ONLY — listen + test email
// ==========================================
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Admin Backend running on http://localhost:${PORT}`);
    testEmailConnection().then((r) => {
      console.log(r.success ? '✅ Email ready' : `⚠️ Email not ready: ${r.error}`);
    });
  });
}

// ✅ Export for Vercel serverless
export default app;