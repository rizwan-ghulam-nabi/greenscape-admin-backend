// backend/routes/blogRoutes.js
import express from 'express';
import {
  getAllPosts,
  getPostById,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getBlogStats,
  togglePostStatus,
  getRelatedPosts,
  searchPosts,
  getPopularPosts
} from '../controllers/blogController.js';
import auth, { adminOnly } from '../middleware/adminAuth.js';

const router = express.Router();

// ==========================================
// ✅ PUBLIC ROUTES (No auth required)
// ==========================================
router.get('/popular', getPopularPosts);
router.get('/search', searchPosts);
router.get('/slug/:slug', getPostBySlug);
router.get('/related/:id', getRelatedPosts);

// ==========================================
// ✅ AUTH ROUTES (Auth required)
// ==========================================
// GET ALL POSTS
router.get('/', auth, adminOnly, getAllPosts);

// GET BLOG STATS (MUST BE BEFORE /:id)
router.get('/stats', auth, adminOnly, getBlogStats);

// GET SINGLE POST
router.get('/:id', auth, adminOnly, getPostById);

// CREATE POST
router.post('/', auth, adminOnly, createPost);

// UPDATE POST STATUS
router.put('/:id/status', auth, adminOnly, togglePostStatus);

// UPDATE POST
router.put('/:id', auth, adminOnly, updatePost);

// DELETE POST
router.delete('/:id', auth, adminOnly, deletePost);

export default router;