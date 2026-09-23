// backend/routes/admin.route.js
import express from 'express';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import bcrypt from 'bcryptjs';
import { adminLogin, adminLogout, getCurrentAdmin } from '../controllers/adminController.js';
import adminAuth, { adminOnly, requirePermission } from '../middleware/adminAuth.js';

const router = express.Router();

// ==========================================
// CREATE ADMIN (Public - only for first time setup)
// ==========================================
router.post('/create-admin', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'admin',
      isAdmin: true,
      status: 'active',
    });

    const token = admin.generateAuthToken();

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        email: admin.email,
        role: admin.role,
        isAdmin: admin.isAdmin,
      },
    });

  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN LOGIN
// ==========================================
router.post('/login', adminLogin);

// ==========================================
// ADMIN LOGOUT
// ==========================================
router.post('/logout', adminAuth, adminLogout);

// ==========================================
// GET CURRENT ADMIN
// ==========================================
router.get('/me', adminAuth, getCurrentAdmin);

// ==========================================
// ✅ GET ALL USERS (Deduplicated from both collections)
// ==========================================
router.get('/users', adminAuth, adminOnly, async (req, res) => {
  try {
    // Fetch from User collection
    const users = await User.find()
      .select('-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires')
      .sort({ createdAt: -1 });

    // Fetch from Admin collection
    const admins = await Admin.find()
      .select('-password -refreshToken -loginAttempts -lockUntil')
      .sort({ createdAt: -1 });

    // ✅ Deduplicate by email (lowercase comparison)
    const seenEmails = new Set();
    const allUsers = [];

    // Add admins first (priority)
    for (const admin of admins) {
      const email = admin.email?.toLowerCase();
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        allUsers.push({
          ...admin.toObject(),
          _id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          isAdmin: true,
          status: admin.status || 'active',
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
          userType: 'admin'
        });
      }
    }

    // Add users (skip if already seen)
    for (const user of users) {
      const email = user.email?.toLowerCase();
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        allUsers.push({
          ...user.toObject(),
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          status: user.status || 'active',
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          userType: 'user'
        });
      }
    }

    res.json({ success: true, users: allUsers });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ✅ GET SINGLE USER BY ID
// ==========================================
router.get('/users/:id', adminAuth, adminOnly, async (req, res) => {
  try {
    // Check User collection first
    let user = await User.findById(req.params.id)
      .select('-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires');

    // If not found, check Admin collection
    if (!user) {
      const admin = await Admin.findById(req.params.id)
        .select('-password -refreshToken -loginAttempts -lockUntil');
      
      if (admin) {
        return res.json({ 
          success: true, 
          user: {
            ...admin.toObject(),
            _id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: admin.role,
            isAdmin: true,
            status: admin.status || 'active',
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt,
            userType: 'admin'
          }
        });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ✅ UPDATE USER
// ==========================================
router.put('/users/:id', adminAuth, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, status, isActive } = req.body;

    // Try User collection first
    let user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, phone, role, status, isActive },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires');

    // If not found, try Admin collection
    if (!user) {
      const admin = await Admin.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, email, phone, role, status, isActive },
        { new: true, runValidators: true }
      ).select('-password -refreshToken -loginAttempts -lockUntil');

      if (admin) {
        return res.json({ 
          success: true, 
          user: {
            ...admin.toObject(),
            _id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: admin.role,
            isAdmin: true,
            status: admin.status || 'active',
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt,
            userType: 'admin'
          }
        });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ✅ DELETE USER
// ==========================================
router.delete('/users/:id', adminAuth, adminOnly, async (req, res) => {
  try {
    // Try User collection first
    let user = await User.findByIdAndDelete(req.params.id);

    // If not found, try Admin collection
    if (!user) {
      const admin = await Admin.findByIdAndDelete(req.params.id);
      if (admin) {
        return res.json({ success: true, message: 'User deleted successfully' });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ✅ GET ALL ROLES
// ==========================================
router.get('/roles', adminAuth, adminOnly, async (req, res) => {
  try {
    const roles = [
      { name: 'superadmin', label: 'Super Admin', description: 'Has full access to all features and settings.' },
      { name: 'admin', label: 'Admin', description: 'Can manage products, orders, customers, and settings.' },
      { name: 'editor', label: 'Editor', description: 'Can manage blog posts, banners, and content.' },
      { name: 'manager', label: 'Manager', description: 'Can manage orders, customers, and inventory.' },
      { name: 'support', label: 'Support', description: 'Can view orders and manage customer queries.' },
      { name: 'viewer', label: 'Viewer', description: 'Has read-only access to all features.' }
    ];

    res.json({ success: true, roles });
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// DASHBOARD (Admin Only)
// ==========================================
router.get('/dashboard', adminAuth, adminOnly, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // 1. Total Orders
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });

    // 2. Total Revenue
    const totalRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // 3. Total Customers
    const totalCustomers = await User.countDocuments({ role: 'customer', isAdmin: false });

    // 4. Total Products Sold
    const totalProductsSold = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);

    // 5. Total Profit (placeholder)
    const totalProfit = 0;

    // 6. Recent Orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email');

    // ✅ Product Revenue Only (Price × Quantity)
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ['$product.name', 0] },
          image: { $arrayElemAt: ['$product.images', 0] },
          sold: '$totalSold',
          totalRevenue: '$totalRevenue'
        }
      }
    ]);

    // 8. Low Stock Products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .limit(5);

    // 9. Sales Overview
    const salesOverview = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          totalRevenue: { $sum: "$totalAmount" }, 
          totalOrders: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    // 10. Order Status
    const orderStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);

    // 11. Category Stats
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCustomers,
        totalProductsSold: totalProductsSold[0]?.total || 0,
        totalProfit,
      },
      salesOverview,
      orderStatus,
      recentOrders,
      topProducts,
      lowStockProducts,
      categoryStats,
    });

  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

export default router;