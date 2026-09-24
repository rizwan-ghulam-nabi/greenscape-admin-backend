//  new version 24/09/2026

// backend/controllers/categoryController.js
import Category from "../models/Category.js";
import Product from "../models/Product.js";

// ==========================================
// 1. GET ALL CATEGORIES
// ==========================================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 2. GET ALL CATEGORIES WITH PRODUCT COUNTS ✅ NEW
// ==========================================
export const getCategoriesWithCounts = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products', // ⚠️ MongoDB collection name — usually plural of model
          let: { catName: '$name' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$category', '$$catName'] },
                // isActive: true, // uncomment if your Product model has this
              },
            },
            { $count: 'count' },
          ],
          as: 'productData',
        },
      },
      {
        $addFields: {
          productCount: {
            $ifNull: [{ $arrayElemAt: ['$productData.count', 0] }, 0],
          },
        },
      },
      { $project: { productData: 0 } },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(categories);
  } catch (err) {
    console.error('getCategoriesWithCounts error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 3. GET SINGLE CATEGORY
// ==========================================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 4. CREATE NEW CATEGORY
// ==========================================
export const createCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    // Validate required name
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    // Duplicate check (case-insensitive)
    const existing = await Category.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: 'A category with this name already exists.' });
    }

    // Generate slug
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const category = new Category({
      name: name.trim(),
      slug,
      description,
      image: image || 'https://via.placeholder.com/100',
      status: status || 'Active',
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    console.error('Create Category Error:', err);
    res.status(400).json({ error: err.message });
  }
};

// ==========================================
// 5. UPDATE CATEGORY (SAFE PARTIAL UPDATE) ✅ FIXED
// ==========================================
export const updateCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    const updateData = {};

    // If name is provided, validate + regenerate slug
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Category name cannot be empty.' });
      }

      // Duplicate check (case-insensitive, exclude self)
      const existing = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ error: 'A category with this name already exists.' });
      }

      updateData.name = name.trim();
      updateData.slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (status !== undefined) updateData.status = status;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (err) {
    console.error('Update Category Error:', err);
    res.status(400).json({ error: err.message });
  }
};

// ==========================================
// 6. DELETE CATEGORY
// ==========================================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 7. GET CATEGORY WITH PRODUCT COUNT (single)
// ==========================================
export const getCategoryWithProductCount = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const productCount = await Product.countDocuments({
      category: category.name,
      // isActive: true, // uncomment if applicable
    });

    res.json({
      ...category.toObject(),
      productCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};