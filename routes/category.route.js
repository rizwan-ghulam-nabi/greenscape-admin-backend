// backend/routes/category.route.js
import express from 'express';
import auth from '../middleware/adminAuth.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

const router = express.Router();

// ==========================================
// ✅ PUBLIC ROUTE (NO AUTH REQUIRED)
// ==========================================
// This is the route your Header, SidePanel, and Categories page will use
router.get('/public/categories', getCategories);

// ==========================================
// ADMIN ROUTES (AUTH REQUIRED)
// ==========================================
// Admin Check Middleware
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

router.get('/categories', auth, isAdmin, getCategories);
router.get('/categories/:id', auth, isAdmin, getCategoryById);
router.post('/categories', auth, isAdmin, createCategory);
router.put('/categories/:id', auth, isAdmin, updateCategory);
router.delete('/categories/:id', auth, isAdmin, deleteCategory);

export default router;