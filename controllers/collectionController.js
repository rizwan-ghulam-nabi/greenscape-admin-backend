// backend/controllers/collectionController.js
import Collection from '../models/Collection.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

// ==========================================
// GET ALL COLLECTIONS
// ==========================================
export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .populate('products', 'name slug price images')
      .populate('category', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({ success: true, collections });
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// GET SINGLE COLLECTION
// ==========================================
export const getCollectionById = async (req, res) => {
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
};

// ==========================================
// CREATE COLLECTION
// ==========================================
export const createCollection = async (req, res) => {
  try {
    const { name, slug, description, image, category, products, isActive, featured, sortOrder } = req.body;

    // Check if collection already exists
    const existing = await Collection.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Collection already exists' });
    }

    // Validate category exists
    if (category) {
      const catExists = await Category.findOne({ name: category });
      if (!catExists) {
        return res.status(400).json({ success: false, error: 'Category not found' });
      }
    }

    // Validate products exist
    if (products && products.length > 0) {
      const productCount = await Product.countDocuments({ _id: { $in: products } });
      if (productCount !== products.length) {
        return res.status(400).json({ success: false, error: 'Some products not found' });
      }
    }

    const collection = new Collection({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
      image,
      category,
      products,
      isActive: isActive !== undefined ? isActive : true,
      featured: featured || false,
      sortOrder: sortOrder || 0
    });

    await collection.save();

    // Populate for response
    await collection.populate('products', 'name slug price images');
    await collection.populate('category', 'name slug');

    res.status(201).json({ success: true, collection });
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// UPDATE COLLECTION
// ==========================================
export const updateCollection = async (req, res) => {
  try {
    const { name, slug, description, image, category, products, isActive, featured, sortOrder } = req.body;

    // Validate category exists
    if (category) {
      const catExists = await Category.findOne({ name: category });
      if (!catExists) {
        return res.status(400).json({ success: false, error: 'Category not found' });
      }
    }

    // Validate products exist
    if (products && products.length > 0) {
      const productCount = await Product.countDocuments({ _id: { $in: products } });
      if (productCount !== products.length) {
        return res.status(400).json({ success: false, error: 'Some products not found' });
      }
    }

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
};

// ==========================================
// DELETE COLLECTION
// ==========================================
export const deleteCollection = async (req, res) => {
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
};

// ==========================================
// ADD PRODUCTS TO COLLECTION
// ==========================================
export const addProductsToCollection = async (req, res) => {
  try {
    const { productIds } = req.body;

    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    // Add products (avoid duplicates)
    const existingIds = collection.products.map(id => id.toString());
    const newProducts = productIds.filter(id => !existingIds.includes(id));

    collection.products.push(...newProducts);
    await collection.save();

    await collection.populate('products', 'name slug price images');

    res.json({ success: true, collection });
  } catch (err) {
    console.error('Error adding products to collection:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// REMOVE PRODUCT FROM COLLECTION
// ==========================================
export const removeProductFromCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    collection.products = collection.products.filter(
      id => id.toString() !== req.params.productId
    );
    await collection.save();

    await collection.populate('products', 'name slug price images');

    res.json({ success: true, collection });
  } catch (err) {
    console.error('Error removing product from collection:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// GET COLLECTION STATS
// ==========================================
export const getCollectionStats = async (req, res) => {
  try {
    const stats = await Collection.aggregate([
      {
        $group: {
          _id: null,
          totalCollections: { $sum: 1 },
          activeCollections: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          featuredCollections: { $sum: { $cond: [{ $eq: ['$featured', true] }, 1, 0] } }
        }
      }
    ]);

    res.json({ success: true, stats: stats[0] || { totalCollections: 0, activeCollections: 0, featuredCollections: 0 } });
  } catch (err) {
    console.error('Error fetching collection stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};