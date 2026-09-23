// backend/routes/paymentRoutes.js
import express from 'express';
import auth from '../middleware/adminAuth.js';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats
} from '../controllers/paymentController.js';

const router = express.Router();

// ==========================================
// ADMIN MIDDLEWARE
// ==========================================
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// ==========================================
// ✅ ADMIN PAYMENT ROUTES
// ==========================================

// GET payment statistics
router.get('/payments/stats', auth, isAdmin, getPaymentStats);

// GET all payments
router.get('/payments', auth, isAdmin, getAllPayments);

// GET single payment
router.get('/payments/:id', auth, isAdmin, getPaymentById);

// POST create payment for order
router.post('/payments', auth, isAdmin, createPayment);

// PUT update payment status
router.put('/payments/:id/status', auth, isAdmin, updatePaymentStatus);

// DELETE payment
router.delete('/payments/:id', auth, isAdmin, deletePayment);

export default router;