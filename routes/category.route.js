// backend/routes/category.route.js
import express from 'express';
import auth from '../middleware/adminAuth.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithCounts,
  getCategoryWithProductCount,
} from '../controllers/categoryController.js';

const router = express.Router();

// ==========================================
// ✅ PUBLIC ROUTE (NO AUTH REQUIRED)
// ==========================================
router.get('/public/categories', getCategories);

// ==========================================
// ⚠️ IMPORTANT: /with-counts MUST come BEFORE /:id
// ==========================================
router.get('/categories/with-counts', auth, getCategoriesWithCounts);

// ==========================================
// ADMIN ROUTES (AUTH REQUIRED)
// ==========================================
router.get('/categories', auth, getCategories);
router.get('/categories/:id/with-count', auth, getCategoryWithProductCount);
router.get('/categories/:id', auth, getCategoryById);
router.post('/categories', auth, createCategory);
router.put('/categories/:id', auth, updateCategory);
router.delete('/categories/:id', auth, deleteCategory);

export default router;