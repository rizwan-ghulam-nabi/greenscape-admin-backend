// backend/controllers/discountController.js
import Discount from '../models/Discount.js';
import Product from '../models/Product.js';

// ==========================================
// ✅ GET ALL DISCOUNTS (with filters)
// ==========================================
export const getDiscounts = async (req, res) => {
  try {
    const { 
      search, 
      type, 
      status, 
      startDate, 
      endDate,
      page = 1, 
      limit = 10 
    } = req.query;

    let filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Type filter
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Status filter
    if (status && status !== 'all') {
      const now = new Date();
      
      if (status === 'active') {
        filter.isActive = true;
        filter.startDate = { $lte: now };
        filter.endDate = { $gte: now };
      } else if (status === 'scheduled') {
        filter.isActive = true;
        filter.startDate = { $gt: now };
      } else if (status === 'expired') {
        filter.endDate = { $lt: now };
      } else if (status === 'inactive') {
        filter.isActive = false;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const total = await Discount.countDocuments(filter);
    const discounts = await Discount.find(filter)
      .populate('products', 'name image price')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // ✅ Stats
    const now = new Date();
    const [totalAll, activeCount, scheduledCount, expiredCount] = await Promise.all([
      Discount.countDocuments(),
      Discount.countDocuments({ 
        isActive: true, 
        startDate: { $lte: now }, 
        endDate: { $gte: now } 
      }),
      Discount.countDocuments({ 
        isActive: true, 
        startDate: { $gt: now } 
      }),
      Discount.countDocuments({ 
        endDate: { $lt: now } 
      })
    ]);

    res.json({
      success: true,
      discounts,
      stats: {
        total: totalAll,
        active: activeCount,
        scheduled: scheduledCount,
        expired: expiredCount
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching discounts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ GET SINGLE DISCOUNT
// ==========================================
export const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('products', 'name image price')
      .populate('categories', 'name');

    if (!discount) {
      return res.status(404).json({ success: false, error: 'Discount not found' });
    }

    res.json({ success: true, discount });
  } catch (err) {
    console.error('Error fetching discount:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ CREATE DISCOUNT
// ==========================================
export const createDiscount = async (req, res) => {
  try {
    const {
      name, description, code, type, value,
      appliesTo, products, categories,
      minPurchase, maxUses, maxUsesPerCustomer,
      startDate, endDate, isActive, image, badgeText
    } = req.body;

    // Validate required fields
    if (!name || !code || !type || !value || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Check if code already exists
    const existing = await Discount.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discount code already exists' 
      });
    }

    const discount = new Discount({
      name,
      description,
      code: code.toUpperCase(),
      type,
      value,
      appliesTo: appliesTo || 'all_products',
      products: products || [],
      categories: categories || [],
      minPurchase: minPurchase || 0,
      maxUses: maxUses || 0,
      maxUsesPerCustomer: maxUsesPerCustomer || 1,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive : true,
      image,
      badgeText: badgeText || (type === 'percentage' ? `${value}% OFF` : `Rs. ${value} OFF`),
      createdBy: req.user?._id
    });

    await discount.save();
    await discount.populate('products', 'name image price');
    await discount.populate('categories', 'name');

    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      discount
    });
  } catch (err) {
    console.error('Error creating discount:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ UPDATE DISCOUNT
// ==========================================
export const updateDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({ success: false, error: 'Discount not found' });
    }

    const {
      name, description, code, type, value,
      appliesTo, products, categories,
      minPurchase, maxUses, maxUsesPerCustomer,
      startDate, endDate, isActive, image, badgeText
    } = req.body;

    // Check if new code conflicts with another discount
    if (code && code.toUpperCase() !== discount.code) {
      const existing = await Discount.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: discount._id }
      });
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          error: 'Discount code already exists' 
        });
      }
    }

    // Update fields
    if (name) discount.name = name;
    if (description !== undefined) discount.description = description;
    if (code) discount.code = code.toUpperCase();
    if (type) discount.type = type;
    if (value !== undefined) discount.value = value;
    if (appliesTo) discount.appliesTo = appliesTo;
    if (products) discount.products = products;
    if (categories) discount.categories = categories;
    if (minPurchase !== undefined) discount.minPurchase = minPurchase;
    if (maxUses !== undefined) discount.maxUses = maxUses;
    if (maxUsesPerCustomer !== undefined) discount.maxUsesPerCustomer = maxUsesPerCustomer;
    if (startDate) discount.startDate = new Date(startDate);
    if (endDate) discount.endDate = new Date(endDate);
    if (isActive !== undefined) discount.isActive = isActive;
    if (image !== undefined) discount.image = image;
    if (badgeText) discount.badgeText = badgeText;

    await discount.save();
    await discount.populate('products', 'name image price');
    await discount.populate('categories', 'name');

    res.json({
      success: true,
      message: 'Discount updated successfully',
      discount
    });
  } catch (err) {
    console.error('Error updating discount:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ DELETE DISCOUNT
// ==========================================
export const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);

    if (!discount) {
      return res.status(404).json({ success: false, error: 'Discount not found' });
    }

    res.json({
      success: true,
      message: 'Discount deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting discount:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ TOGGLE DISCOUNT STATUS
// ==========================================
export const toggleDiscountStatus = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({ success: false, error: 'Discount not found' });
    }

    discount.isActive = !discount.isActive;
    await discount.save();

    res.json({
      success: true,
      message: `Discount ${discount.isActive ? 'activated' : 'deactivated'}`,
      discount
    });
  } catch (err) {
    console.error('Error toggling discount:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// ✅ VALIDATE DISCOUNT CODE (Public)
// ==========================================
export const validateDiscountCode = async (req, res) => {
  try {
    const { code, cartTotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discount code is required' 
      });
    }

    const discount = await Discount.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!discount) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid discount code' 
      });
    }

    const now = new Date();

    // Check date validity
    if (now < discount.startDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discount is not yet active' 
      });
    }

    if (now > discount.endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discount has expired' 
      });
    }

    // Check usage limit
    if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discount usage limit reached' 
      });
    }

    // Check minimum purchase
    if (cartTotal < discount.minPurchase) {
      return res.status(400).json({ 
        success: false, 
        error: `Minimum purchase of Rs. ${discount.minPurchase} required` 
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (cartTotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    // Don't exceed cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    res.json({
      success: true,
      valid: true,
      discount: {
        id: discount._id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        discountAmount,
        badgeText: discount.badgeText
      }
    });
  } catch (err) {
    console.error('Error validating discount:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};