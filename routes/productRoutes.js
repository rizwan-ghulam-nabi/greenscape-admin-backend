// backend/routes/product.route.js - FIXED VERSION
import express from 'express';
import Product from '../models/Product.js';
import auth from '../middleware/adminAuth.js';
import cloudinary from '../config/cloudinary.js';
import {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  bulkUpdateStock,
  getDashboardStats,
  getProductVariants,
  toggleProductStatus
} from '../controllers/productController.js';
import multer from 'multer';

const router = express.Router();

// ==========================================
// MULTER CONFIGURATION for file uploads
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ==========================================
// ADMIN AUTH MIDDLEWARE
// ==========================================
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    console.error('❌ Access denied. User is not admin:', req.user?.email);
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  console.log(`✅ Admin access granted for: ${req.user.email}`);
  next();
};

// ==========================================
// 🌐 PUBLIC ROUTES (NO AUTH REQUIRED)
// ==========================================
// These stay as they are - they don't have /admin prefix
// ... (keep all public routes as they are)

// ==========================================
// 🔒 ADMIN ROUTES (PROTECTED) - FIXED
// ==========================================

// Apply auth middleware to all admin routes
router.use(auth, isAdmin);

// 1. GET DASHBOARD STATS
router.get('/dashboard', getDashboardStats);

// 2. GET ALL PRODUCTS (Admin View with full features)
router.get('/products', getAllProducts);

// 3. GET SINGLE PRODUCT (Admin View)
router.get('/products/:id', getSingleProduct);

// 4. GET PRODUCT VARIANTS
router.get('/products/:id/variants', getProductVariants);

// 5. CREATE NEW PRODUCT (with image upload support)
router.post('/products', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  createProduct
);

// 6. UPDATE PRODUCT (with image upload support)
router.put('/products/:id', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  updateProduct
);

// 7. TOGGLE PRODUCT STATUS
router.patch('/products/:id/toggle-status', toggleProductStatus);

// 8. DELETE PRODUCT
router.delete('/products/:id', deleteProduct);

// 9. BULK UPDATE PRODUCTS
router.put('/products/bulk', bulkUpdateProducts);

// 10. BULK UPDATE STOCK
router.patch('/products/stock', bulkUpdateStock);

// 11. GET PRODUCT STATISTICS
router.get('/products/stats', async (req, res) => {
  try {
    console.log('📊 [ADMIN] Fetching product statistics...');
    
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      bestSellerProducts,
      outOfStock,
      lowStock
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isFeatured: true, isActive: true }),
      Product.countDocuments({ isBestSeller: true, isActive: true }),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ 
        $expr: { $lte: ['$stock', '$lowStockAlert'] },
        stock: { $gt: 0 }
      })
    ]);

    console.log('✅ Statistics fetched successfully');

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        featuredProducts,
        bestSellerProducts,
        outOfStock,
        lowStock,
        inactiveProducts: totalProducts - activeProducts
      }
    });
  } catch (err) {
    console.error('❌ Error fetching product statistics:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 12. GET CATEGORY PRODUCT COUNTS
router.get('/categories/stats', async (req, res) => {
  try {
    console.log('📊 [ADMIN] Fetching category statistics...');
    
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get subcategory stats
    const subCategoryStats = await Product.aggregate([
      { $match: { isActive: true, subCategory: { $exists: true, $ne: '' } } },
      { $group: { _id: { category: '$category', subCategory: '$subCategory' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('✅ Category statistics fetched successfully');

    res.json({
      success: true,
      data: {
        categories: categoryStats,
        subCategories: subCategoryStats
      }
    });
  } catch (err) {
    console.error('❌ Error fetching category statistics:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// 13. CLEANUP UNUSED IMAGES (Admin utility)
router.delete('/cleanup-images', async (req, res) => {
  try {
    console.log('🧹 [ADMIN] Cleaning up unused images...');
    
    // Get all product images currently in use
    const products = await Product.find({}, 'image gallery thumbnail');
    const usedImages = new Set();
    
    products.forEach(product => {
      if (product.image) usedImages.add(product.image);
      if (product.thumbnail) usedImages.add(product.thumbnail);
      if (product.gallery) {
        product.gallery.forEach(img => usedImages.add(img));
      }
    });

    // This would need Cloudinary integration to actually delete images
    // For now, return the count of unused images
    const allImages = await cloudinary.api.resources({ type: 'upload', prefix: 'products/' });
    const unusedImages = allImages.resources.filter(img => !usedImages.has(img.secure_url));

    console.log(`✅ Found ${unusedImages.length} unused images`);

    res.json({
      success: true,
      message: `Found ${unusedImages.length} unused images`,
      unusedImages: unusedImages.map(img => img.secure_url)
    });
  } catch (err) {
    console.error('❌ Error cleaning up images:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

export default router;