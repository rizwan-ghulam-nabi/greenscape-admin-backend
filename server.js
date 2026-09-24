
// new version
// server.js - FIXED VERSION
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import dns from "dns";

// ✅ LOAD ENV FIRST (BEFORE any imports that use env)
dotenv.config();

// ✅ NOW import services that use env variables
import { testEmailConnection } from './utils/emailService.js';

import adminRoutes from './routes/admin.route.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/category.route.js';
import bannerRoutes from './routes/banner.route.js';
import adminCustomerRoutes from './routes/Customer.route.js';
import blogRoutes from "./routes/blogRoutes.js";
import collectionRoutes from './routes/collection.route.js';
import paymentRoutes from './routes/paymentRoutes.js';
import discountRoutes from './routes/discount.route.js';
import adminChatRoutes from './routes/adminChat.route.js';
import adminActionsRoutes from './routes/adminActions.route.js';
import adminReviewRoutes from './routes/adminReview.route.js';


dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// ===== ✅ FIXED CORS CONFIGURATION =====
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ✅ Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ==========================================
// ✅ ROUTES - ALL MOUNTED HERE
// ==========================================
app.use('/api/admin', adminRoutes);
app.use("/api/admin/chat", adminChatRoutes);
app.use("/api/admin/actions", adminActionsRoutes);
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

// ✅ Test email connection AFTER env is loaded
testEmailConnection().then(result => {
  if (result.success) {
    console.log('✅ Email service ready');
  } else {
    console.log('⚠️ Email service not ready:', result.error);
  }
});

// ✅ 404 handler
app.use((req, res, next) => {
  console.log('❌ 404 - Route not found:', req.method, req.url);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`
  });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// ==========================================
// ✅ TEST EMAIL ENDPOINT
// ==========================================
app.get('/api/test-email', async (req, res) => {
  try {
    const { sendEmail, testEmailConnection } = await import('./utils/emailService.js');
    
    // Test connection first
    const connectionTest = await testEmailConnection();
    
    if (!connectionTest.success) {
      return res.json({
        success: false,
        error: connectionTest.error,
        message: 'Email connection failed'
      });
    }
    
    // Send test email
    const result = await sendEmail(
      'sheikhrizwanghulamnabi555@gmail.com',
      '✅ GreenScape Test Email',
      `
        <h1 style="color: #2B7A4B;">Email Test Successful!</h1>
        <p>Your GreenScape email service is working properly.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>EMAIL_USER: ${process.env.EMAIL_USER}</li>
          <li>EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing'}</li>
        </ul>
      `
    );
    
    res.json({
      success: true,
      result,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// ✅ START SERVER
// ==========================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Admin Backend running on http://localhost:${PORT}`);
  console.log('✅ Blog routes mounted at /api/admin/blog');
  console.log('✅ Discount routes mounted at /api/admin/discounts');

  // ==========================================
  // ✅ DEBUG: List all blog routes
  // ==========================================
  console.log('\n📋 Blog routes:');
  if (blogRoutes && blogRoutes.stack) {
    blogRoutes.stack.forEach((route) => {
      if (route.route) {
        const methods = Object.keys(route.route.methods);
        methods.forEach(method => {
          console.log(`  ${method.toUpperCase()} /api/admin/blog${route.route.path}`);
        });
      }
    });
  } else {
    console.log('  ❌ No blog routes loaded');
  }

  // ==========================================
  // ✅ DEBUG: List all discount routes
  // ==========================================
  console.log('\n📋 Discount routes:');
  if (discountRoutes && discountRoutes.stack) {
    discountRoutes.stack.forEach((route) => {
      if (route.route) {
        const methods = Object.keys(route.route.methods);
        methods.forEach(method => {
          console.log(`  ${method.toUpperCase()} /api/admin${route.route.path}`);
        });
      }
    });
  } else {
    console.log('  ❌ No discount routes loaded');
  }

  // ==========================================
  // ✅ DEBUG: List all collection routes
  // ==========================================
  console.log('\n📋 Collection routes:');
  if (collectionRoutes && collectionRoutes.stack) {
    collectionRoutes.stack.forEach((route) => {
      if (route.route) {
        const methods = Object.keys(route.route.methods);
        methods.forEach(method => {
          console.log(`  ${method.toUpperCase()} /api/admin${route.route.path}`);
        });
      }
    });
  } else {
    console.log('  ❌ No collection routes loaded');
  }

  console.log('\n✅ All routes registered successfully');
});
