// // backend/middleware/adminAuth.js
// import jwt from 'jsonwebtoken';
// import Admin from '../models/Admin.js';

// // ✅ Admin Authentication Middleware
// const adminAuth = async (req, res, next) => {
//   try {
//     // Get token from cookie first
//     let token = req.cookies?.adminToken;
    
//     // If not in cookie, check Authorization header
//     if (!token && req.headers.authorization?.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Admin authentication required.' 
//       });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Invalid or expired admin token.' 
//       });
//     }

//     // Check if admin exists in Admin collection
//     const admin = await Admin.findById(decoded.id);
//     if (!admin) {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Admin no longer exists.' 
//       });
//     }

//     // Check if admin is active
//     if (admin.status === 'inactive' || admin.status === 'suspended') {
//       return res.status(403).json({ 
//         success: false,
//         error: 'Admin account is inactive or suspended.' 
//       });
//     }

//     // Update last login
//     admin.lastLogin = new Date();
//     await admin.save();

//     // Attach admin to request
//     req.admin = admin;
//     req.user = admin;
//     req.isAdmin = true;
//     next();

//   } catch (err) {
//     console.error('❌ Admin Auth Error:', err.message);
//     res.status(500).json({ 
//       success: false,
//       error: 'Server error during admin authentication.' 
//     });
//   }
// };

// // ✅ Admin Only Check
// export const adminOnly = (req, res, next) => {
//   if (!req.admin || !req.isAdmin) {
//     return res.status(403).json({ 
//       success: false,
//       error: 'Access denied. Admin privileges required.' 
//     });
//   }
//   next();
// };

// // ✅ Permission Check
// export const requirePermission = (permission) => {
//   return (req, res, next) => {
//     if (!req.admin) {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Authentication required.' 
//       });
//     }

//     if (!req.admin.hasPermission(permission)) {
//       return res.status(403).json({ 
//         success: false,
//         error: `Access denied. ${permission} permission required.` 
//       });
//     }

//     next();
//   };
// };

// export default adminAuth;









// new version 124/09/26
// backend/middleware/adminAuth.js - PRODUCTION
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const adminAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.adminToken;
    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired admin token.',
      });
    }

    // ✅ Support both id and _id in the token payload
    const adminId = decoded.id || decoded._id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin token.',
      });
    }

    const admin = await Admin.findById(adminId).lean();
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin no longer exists.',
      });
    }

    if (admin.status === 'inactive' || admin.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Admin account is inactive or suspended.',
      });
    }

    // ❌ REMOVED: admin.lastLogin = new Date(); admin.save();
    // (that ran on every request — update it in the login controller only)

    req.admin = admin;
    req.user = admin;
    req.isAdmin = true;
    next();
  } catch (err) {
    console.error('❌ Admin Auth Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server error during admin authentication.',
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.admin || !req.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }
  // hasPermission doesn't exist on lean objects — call on a hydrated doc
  const has = typeof req.admin.hasPermission === 'function'
    ? req.admin.hasPermission(permission)
    : Array.isArray(req.admin.permissions) && req.admin.permissions.includes(permission);

  if (!has) {
    return res.status(403).json({
      success: false,
      error: `Access denied. ${permission} permission required.`,
    });
  }
  next();
};

export default adminAuth;