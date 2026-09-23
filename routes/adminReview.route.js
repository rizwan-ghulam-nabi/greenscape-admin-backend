// backend/routes/adminReview.route.js
import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import {
  getAllReviews,
  getReviewById,
  approveReview,
  rejectReview,
  updateReview,
  deleteReview,
  bulkApprove,
  bulkDelete,
  addAdminResponse,
  createAdminReview,
} from '../controllers/adminReview.controller.js';

const router = express.Router();

// ✅ All routes require admin auth
router.use(adminAuth);

// ==========================================
// COLLECTION ROUTES
// ==========================================
// GET  /api/admin/reviews        — list all with filters
router.get('/', getAllReviews);

// POST /api/admin/reviews        — create admin review
router.post('/', createAdminReview);

// ==========================================
// BULK ROUTES (must come before /:id)
// ==========================================
router.post('/bulk/approve', bulkApprove);
router.post('/bulk/delete', bulkDelete);

// ==========================================
// SINGLE RESOURCE ROUTES
// ==========================================
// GET    /api/admin/reviews/:id
router.get('/:id', getReviewById);

// PUT    /api/admin/reviews/:id/approve
router.put('/:id/approve', approveReview);

// PUT    /api/admin/reviews/:id/reject
router.put('/:id/reject', rejectReview);

// PUT    /api/admin/reviews/:id/reply     ← renamed from "response"
router.put('/:id/reply', addAdminResponse);

// PUT    /api/admin/reviews/:id           — edit
router.put('/:id', updateReview);

// DELETE /api/admin/reviews/:id
router.delete('/:id', deleteReview);

export default router;