// backend/routes/discount.route.js
import express from 'express';
import adminAuth, { adminOnly } from '../middleware/adminAuth.js';
import {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscountStatus,
  validateDiscountCode
} from '../controllers/discountController.js';

const router = express.Router();

console.log('✅ Discount router loaded');

// Public
router.post('/validate', validateDiscountCode);

// Admin
router.get('/discounts', adminAuth, adminOnly, getDiscounts);
router.get('/discounts/:id', adminAuth, adminOnly, getDiscountById);
router.post('/discounts', adminAuth, adminOnly, createDiscount);
router.put('/discounts/:id', adminAuth, adminOnly, updateDiscount);
router.delete('/discounts/:id', adminAuth, adminOnly, deleteDiscount);
router.patch('/discounts/:id/toggle', adminAuth, adminOnly, toggleDiscountStatus);

export default router;