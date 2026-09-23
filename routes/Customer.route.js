// backend/routes/adminCustomer.route.js
import express from 'express';
import adminAuth, { adminOnly } from '../middleware/adminAuth.js';
import { getCustomers, getCustomerById } from '../controllers/CustomerController.js';

const router = express.Router();

// ==========================================
// ADMIN CUSTOMER ROUTES (Admin Only)
// ==========================================
router.get('/customers', adminAuth, adminOnly, getCustomers);
router.get('/customers/:id', adminAuth, adminOnly, getCustomerById);

export default router;