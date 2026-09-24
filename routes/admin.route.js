// backend/routes/admin.route.js - PRODUCTION VERSION (Vercel-ready)
import express from 'express';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import bcrypt from 'bcryptjs';
import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
} from '../controllers/adminController.js';
import adminAuth, {
  adminOnly,
  requirePermission,
} from '../middleware/adminAuth.js';

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';

// Cookie options shared by all auth routes
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};

// ==========================================
// CREATE ADMIN — one-time setup, secret-protected
// ==========================================
router.post('/create-admin', async (req, res) => {
  try {
    // 1. Require a setup secret in the header
    const provided = req.headers['x-setup-secret'];
    if (!process.env.SETUP_SECRET || provided !== process.env.SETUP_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 2. Refuse if any admin already exists (one-time only)
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({ error: 'Setup already completed' });
    }

    // 3. Never trust role from the request body
    const { firstName, lastName, email, password } = req.body;

    if (!email || !password || password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Email and password (min 8 chars) required' });
    }

    const admin = await Admin.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      password,
      role: 'superadmin',
      isAdmin: true,
      status: 'active',
    });

    const token = admin.generateAuthToken();
    res.cookie('adminToken', token, cookieOptions);

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
    console.error('Error creating admin:', err.message);
    res.status(500).json({ error: 'Server error' });
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
// GET ALL USERS (paginated, deduplicated)
// ==========================================
router.get('/users', adminAuth, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [users, admins, totalUsers, totalAdmins] = await Promise.all([
      User.find()
        .select(
          '-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Admin.find()
        .select('-password -refreshToken -loginAttempts -lockUntil')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
      Admin.countDocuments(),
    ]);

    // Deduplicate by email (lowercase), admins take priority
    const seenEmails = new Set();
    const allUsers = [];

    for (const admin of admins) {
      const email = admin.email?.toLowerCase();
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        allUsers.push({
          ...admin,
          _id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          isAdmin: true,
          status: admin.status || 'active',
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
          userType: 'admin',
        });
      }
    }

    for (const user of users) {
      const email = user.email?.toLowerCase();
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        allUsers.push({
          ...user,
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          status: user.status || 'active',
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          userType: 'user',
        });
      }
    }

    res.json({
      success: true,
      users: allUsers,
      pagination: {
        page,
        limit,
        totalUsers,
        totalAdmins,
        total: totalUsers + totalAdmins,
        hasMore: skip + limit < totalUsers + totalAdmins,
      },
    });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==========================================
// GET SINGLE USER BY ID
// ==========================================
router.get('/users/:id', adminAuth, adminOnly, async (req, res) => {
  try {
    let user = await User.findById(req.params.id)
      .select(
        '-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires'
      )
      .lean();

    if (!user) {
      const admin = await Admin.findById(req.params.id)
        .select('-password -refreshToken -loginAttempts -lockUntil')
        .lean();

      if (admin) {
        return res.json({
          success: true,
          user: {
            ...admin,
            _id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: admin.role,
            isAdmin: true,
            status: admin.status || 'active',
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt,
            userType: 'admin',
          },
        });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==========================================
// UPDATE USER (role change restricted to superadmin)
// ==========================================
router.put('/users/:id', adminAuth, adminOnly, async (req, res) => {
  try {
    const requester = req.user || req.admin;
    const isSuperAdmin = requester?.role === 'superadmin';

    const {
      firstName,
      lastName,
      email,
      phone,
      status,
      isActive,
      password,
      role,
    } = req.body;

    const updateData = { firstName, lastName, email, phone, status, isActive };

    // Only superadmin can change roles
    if (isSuperAdmin && role) updateData.role = role;

    // Only hash/change password if provided
    if (password && password.length >= 8) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Strip undefined so we don't overwrite fields with nothing
    Object.keys(updateData).forEach(
      (k) => updateData[k] === undefined && delete updateData[k]
    );

    // Try User collection first
    let user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .select(
        '-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires'
      )
      .lean();

    if (!user) {
      const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .select('-password -refreshToken -loginAttempts -lockUntil')
        .lean();

      if (admin) {
        return res.json({
          success: true,
          user: {
            ...admin,
            _id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: admin.role,
            isAdmin: true,
            status: admin.status || 'active',
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt,
            userType: 'admin',
          },
        });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==========================================
// DELETE USER (self-delete and last-admin protected)
// ==========================================
router.delete('/users/:id', adminAuth, adminOnly, async (req, res) => {
  try {
    const requester = req.user || req.admin;

    if (requester && String(requester._id) === String(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: 'You cannot delete your own account' });
    }

    // Prevent deleting the last admin
    const targetIsAdmin = await Admin.exists({ _id: req.params.id });
    if (targetIsAdmin) {
      const adminCount = await Admin.countDocuments();
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ success: false, error: 'Cannot delete the last admin' });
      }
    }

    let user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      const admin = await Admin.findByIdAndDelete(req.params.id);
      if (admin) {
        return res.json({
          success: true,
          message: 'User deleted successfully',
        });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==========================================
// GET ALL ROLES
// ==========================================
router.get('/roles', adminAuth, adminOnly, async (req, res) => {
  try {
    const roles = [
      {
        name: 'superadmin',
        label: 'Super Admin',
        description: 'Has full access to all features and settings.',
      },
      {
        name: 'admin',
        label: 'Admin',
        description: 'Can manage products, orders, customers, and settings.',
      },
      {
        name: 'editor',
        label: 'Editor',
        description: 'Can manage blog posts, banners, and content.',
      },
      {
        name: 'manager',
        label: 'Manager',
        description: 'Can manage orders, customers, and inventory.',
      },
      {
        name: 'support',
        label: 'Support',
        description: 'Can view orders and manage customer queries.',
      },
      {
        name: 'viewer',
        label: 'Viewer',
        description: 'Has read-only access to all features.',
      },
    ];

    res.json({ success: true, roles });
  } catch (err) {
    console.error('Error fetching roles:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==========================================
// DASHBOARD (parallelized, admin only)
// ==========================================
router.get('/dashboard', adminAuth, adminOnly, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.query.days) || 30));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchWindow = { createdAt: { $gte: startDate } };

    // ✅ Run all queries in parallel — massive speedup on serverless
    const [
      totalOrders,
      totalRevenueAgg,
      totalCustomers,
      totalProductsSoldAgg,
      recentOrders,
      topProducts,
      lowStockProducts,
      salesOverview,
      orderStatus,
      categoryStats,
    ] = await Promise.all([
      Order.countDocuments(matchWindow),

      Order.aggregate([
        { $match: matchWindow },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      User.countDocuments({ role: 'customer', isAdmin: false }),

      Order.aggregate([
        { $match: matchWindow },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } },
      ]),

      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName email')
        .lean(),

      Order.aggregate([
        { $match: matchWindow },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: {
              $sum: { $multiply: ['$items.price', '$items.quantity'] },
            },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $project: {
            name: { $arrayElemAt: ['$product.name', 0] },
            image: { $arrayElemAt: ['$product.images', 0] },
            sold: '$totalSold',
            totalRevenue: '$totalRevenue',
          },
        },
      ]),

      Product.find({ stock: { $lt: 10 } })
        .sort({ stock: 1 })
        .limit(5)
        .lean(),

      Order.aggregate([
        { $match: matchWindow },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        { $match: matchWindow },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      Product.aggregate([
        { $group: { _id: '$category', value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const totalProfit = 0; // placeholder

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenueAgg[0]?.total || 0,
        totalCustomers,
        totalProductsSold: totalProductsSoldAgg[0]?.total || 0,
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
    console.error('Dashboard Error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;