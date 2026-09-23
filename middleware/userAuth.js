// backend/middleware/userAuth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ User Authentication Middleware
const userAuth = async (req, res, next) => {
  try {
    // Get token from cookie first
    let token = req.cookies?.userToken;
    
    // If not in cookie, check Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. Please login.' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token.' 
      });
    }

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User no longer exists.' 
      });
    }

    // ✅ Check if user is active
    if (user.status === 'inactive' || user.isActive === false) {
      return res.status(403).json({ 
        success: false,
        error: 'Account is inactive. Contact support.' 
      });
    }

    // ✅ Attach user to request (NO lastLogin update here)
    req.user = user;
    req.isAdmin = user.isAdmin || user.role === 'admin' || user.role === 'superadmin';
    next();

  } catch (err) {
    console.error('❌ User Auth Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error during authentication.' 
    });
  }
};

// ✅ Check if user is active
export const activeUserOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required.' 
    });
  }

  if (req.user.status === 'inactive' || req.user.isActive === false) {
    return res.status(403).json({ 
      success: false,
      error: 'Account is inactive.' 
    });
  }

  next();
};

export default userAuth;