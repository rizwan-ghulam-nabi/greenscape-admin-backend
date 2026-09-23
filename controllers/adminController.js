// backend/controllers/adminAuthController.js
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ==========================================
// ADMIN LOGIN (Generates JWT + Sets HTTP Cookie)
// ==========================================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the admin in Admin collection
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Check if admin is active
    if (admin.status === 'inactive' || admin.status === 'suspended') {
      return res.status(403).json({ error: 'Admin account is inactive or suspended.' });
    }

    // 3. Check the password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      // Increment login attempts
      await admin.incrementLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Check if locked
    if (admin.isLocked()) {
      return res.status(403).json({ error: 'Account is locked. Try again in 15 minutes.' });
    }

    // 5. Reset login attempts and update last login
    await admin.resetLoginAttempts();

    // 6. Log activity
    await admin.logActivity('login', 'Admin logged in', req.ip);

    // 7. Generate a JWT using the Admin Model's function
    const token = admin.generateAuthToken();

    // ✅ STEP 8: SET THE HTTP-ONLY COOKIE
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax',
      path: '/',
    });

    // 9. Send the standard JSON response
    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        isAdmin: admin.isAdmin,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ADMIN LOGOUT
// ==========================================
export const adminLogout = async (req, res) => {
  try {
    // Log activity
    if (req.admin) {
      await req.admin.logActivity('logout', 'Admin logged out', req.ip);
    }

    // Clear the httpOnly cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Admin logged out successfully'
    });
  } catch (err) {
    console.error('Admin logout error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// GET CURRENT ADMIN
// ==========================================
export const getCurrentAdmin = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      admin: {
        id: req.admin._id,
        firstName: req.admin.firstName,
        lastName: req.admin.lastName,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions,
        lastLogin: req.admin.lastLogin
      }
    });
  } catch (err) {
    console.error('Error fetching admin:', err);
    res.status(500).json({ error: err.message });
  }
};