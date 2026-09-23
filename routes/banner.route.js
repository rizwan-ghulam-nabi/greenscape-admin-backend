// backend/routes/banner.route.js
import express from 'express';
import auth from '../middleware/adminAuth.js';
import {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/bannerController.js';

const router = express.Router();

// Admin Check Middleware
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// ==========================================
// BANNER ROUTES
// ==========================================
router.get('/banners', auth, isAdmin, getBanners);
router.get('/banners/:id', auth, isAdmin, getBannerById);
router.post('/banners', auth, isAdmin, createBanner);
router.put('/banners/:id', auth, isAdmin, updateBanner);
router.delete('/banners/:id', auth, isAdmin, deleteBanner);

export default router;