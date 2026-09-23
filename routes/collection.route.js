// backend/routes/collection.route.js
import express from 'express';
import Collection from '../models/Collection.js';
import auth, { adminOnly } from '../middleware/adminAuth.js';

const router = express.Router();

// ==========================================
// ADMIN ROUTES (AUTH REQUIRED)
// ==========================================

// Get all collections
router.get('/collections', auth, adminOnly, async (req, res) => {
  try {
    const collections = await Collection.find()
      .populate('products', 'name slug price images') // ✅ Populate products
      .populate('category', 'name slug') // ✅ Populate category
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({ success: true, collections });
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single collection
router.get('/collections/:id', auth, adminOnly, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('products', 'name slug price images')
      .populate('category', 'name slug');

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    res.json({ success: true, collection });
  } catch (err) {
    console.error('Error fetching collection:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create collection
router.post('/collections', auth, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, image, category, products, isActive, featured, sortOrder } = req.body;

    // Check if collection already exists
    const existing = await Collection.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Collection already exists' });
    }

    const collection = new Collection({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
      image,
      category,
      products,
      isActive,
      featured,
      sortOrder
    });

    await collection.save();

    res.status(201).json({ success: true, collection });
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update collection
router.put('/collections/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, image, category, products, isActive, featured, sortOrder } = req.body;

    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      { name, slug, description, image, category, products, isActive, featured, sortOrder },
      { new: true, runValidators: true }
    ).populate('products', 'name slug price images')
     .populate('category', 'name slug');

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    res.json({ success: true, collection });
  } catch (err) {
    console.error('Error updating collection:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete collection
router.delete('/collections/:id', auth, adminOnly, async (req, res) => {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id);

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;