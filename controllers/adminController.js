// // backend/controllers/adminAuthController.js
// import Admin from '../models/Admin.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// // ==========================================
// // ADMIN LOGIN (Generates JWT + Sets HTTP Cookie)
// // ==========================================
// export const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // 1. Find the admin in Admin collection
//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // 2. Check if admin is active
//     if (admin.status === 'inactive' || admin.status === 'suspended') {
//       return res.status(403).json({ error: 'Admin account is inactive or suspended.' });
//     }

//     // 3. Check the password
//     const isMatch = await admin.matchPassword(password);
//     if (!isMatch) {
//       // Increment login attempts
//       await admin.incrementLoginAttempts();
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // 4. Check if locked
//     if (admin.isLocked()) {
//       return res.status(403).json({ error: 'Account is locked. Try again in 15 minutes.' });
//     }

//     // 5. Reset login attempts and update last login
//     await admin.resetLoginAttempts();

//     // 6. Log activity
//     await admin.logActivity('login', 'Admin logged in', req.ip);

//     // 7. Generate a JWT using the Admin Model's function
//     const token = admin.generateAuthToken();

//     // ✅ STEP 8: SET THE HTTP-ONLY COOKIE
//     res.cookie('adminToken', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
//       path: '/',
//     });

//     // 9. Send the standard JSON response
//     res.json({
//       success: true,
//       token,
//       admin: {
//         id: admin._id,
//         firstName: admin.firstName,
//         lastName: admin.lastName,
//         email: admin.email,
//         isAdmin: admin.isAdmin,
//         role: admin.role,
//         lastLogin: admin.lastLogin
//       }
//     });

//   } catch (err) {
//     console.error('Admin login error:', err);
//     res.status(500).json({ error: err.message });
//   }
// };


// // ==========================================
// // RESET PASSWORD — Set new password with token
// // ==========================================
// export const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     if (!token || !password) {
//       return res.status(400).json({
//         success: false,
//         error: 'Token and password are required',
//       });
//     }

//     if (password.length < 8) {
//       return res.status(400).json({
//         success: false,
//         error: 'Password must be at least 8 characters',
//       });
//     }

//     // 1. Hash the incoming token (DB stores hashed version)
//     const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

//     // 2. Find admin with matching token that hasn't expired
//     const admin = await Admin.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!admin) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid or expired reset token. Please request a new one.',
//       });
//     }

//     // 3. Set new password (hashed by pre-save hook)
//     admin.password = password;
//     admin.resetPasswordToken = null;
//     admin.resetPasswordExpires = null;
//     await admin.save();

//     // 4. Optional activity log
//     if (admin.logActivity) {
//       try {
//         await admin.logActivity('password_reset', 'Password reset via email link', req.ip);
//       } catch (e) {
//         // Non-critical
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Password reset successful. You can now log in with your new password.',
//     });
//   } catch (err) {
//     console.error('❌ Reset password error:', err);
//     res.status(500).json({ success: false, error: 'Failed to reset password' });
//   }
// };


// // ==========================================
// // ADMIN LOGOUT
// // ==========================================
// export const adminLogout = async (req, res) => {
//   try {
//     // Log activity
//     if (req.admin) {
//       await req.admin.logActivity('logout', 'Admin logged out', req.ip);
//     }

//     // Clear the httpOnly cookie
//     res.clearCookie('adminToken', {
//        httpOnly: true,
//        secure: process.env.NODE_ENV === 'production',
//        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
//       path: '/',
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Admin logged out successfully'
//     });
//   } catch (err) {
//     console.error('Admin logout error:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // ==========================================
// // GET CURRENT ADMIN
// // ==========================================
// export const getCurrentAdmin = async (req, res) => {
//   try {
//     res.status(200).json({
//       success: true,
//       admin: {
//         id: req.admin._id,
//         firstName: req.admin.firstName,
//         lastName: req.admin.lastName,
//         email: req.admin.email,
//         role: req.admin.role,
//         permissions: req.admin.permissions,
//         lastLogin: req.admin.lastLogin
//       }
//     });
//   } catch (err) {
//     console.error('Error fetching admin:', err);
//     res.status(500).json({ error: err.message });
//   }
// };











// new version with reset password function
// backend/controllers/adminController.js
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailService.js';

// ==========================================
// ADMIN LOGIN
// ==========================================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (admin.status === 'inactive' || admin.status === 'suspended') {
      return res.status(403).json({ error: 'Admin account is inactive or suspended.' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      await admin.incrementLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (admin.isLocked()) {
      return res.status(403).json({ error: 'Account is locked. Try again in 15 minutes.' });
    }

    await admin.resetLoginAttempts();
    await admin.logActivity('login', 'Admin logged in', req.ip);

    const token = admin.generateAuthToken();

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

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
        lastLogin: admin.lastLogin,
      },
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
    if (req.admin) {
      await req.admin.logActivity('logout', 'Admin logged out', req.ip);
    }

    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Admin logged out successfully',
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
        lastLogin: req.admin.lastLogin,
      },
    });
  } catch (err) {
    console.error('Error fetching admin:', err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// FORGOT PASSWORD — Send reset email (with DEBUG)
// ==========================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    // 🔒 Always return success (prevents email enumeration)
    if (!admin) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
        debug: { reason: 'no admin found with that email' },
      });
    }

    // Generate + hash reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await admin.save();

    // Build reset URL — points to FRONTEND page
    const frontendUrl =
      process.env.FRONTEND_URL || 'https://greenscape-admin-frontend.vercel.app';
    const resetUrl = `${frontendUrl}/admin/reset-password/${resetToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9f6;">
        <div style="background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h1 style="color: #0f5a2e; margin-bottom: 20px;">🌿 GreenScape Admin — Password Reset</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${admin.firstName || 'Admin'},</p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            You requested a password reset for your GreenScape admin account.
            Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #0f5a2e; color: #ffffff;
                      text-decoration: none; padding: 14px 32px; border-radius: 8px;
                      font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">Or copy this link:</p>
          <p style="color: #0f5a2e; font-size: 13px; word-break: break-all; background: #f0f4f0; padding: 12px; border-radius: 6px;">
            ${resetUrl}
          </p>
          <p style="color: #999; font-size: 13px; margin-top: 30px;">
            ⏰ This link expires in <strong>1 hour</strong>.
          </p>
          <p style="color: #999; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    // ===== DEBUG BLOCK (temporary) =====
    let emailResult;
    try {
      console.log('📧 [forgotPassword] Attempting email to:', admin.email);
      console.log('📧 [forgotPassword] RESEND_API_KEY present?', !!process.env.RESEND_API_KEY);
      console.log(
        '📧 [forgotPassword] Key prefix:',
        (process.env.RESEND_API_KEY || '').slice(0, 8)
      );

      emailResult = await sendEmail(
        admin.email,
        '🌿 Reset Your GreenScape Admin Password',
        emailHtml
      );

      console.log('📧 [forgotPassword] sendEmail returned:', JSON.stringify(emailResult));
    } catch (emailErr) {
      console.error('❌ Email send failed:', emailErr);
      console.error('❌ Error message:', emailErr.message);
      console.error('❌ Error stack:', emailErr.stack);
      emailResult = { success: false, error: emailErr.message };
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
      debug: emailResult, // ⚠️ REMOVE after debugging
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Failed to send reset email' });
  }
};

// ==========================================
// RESET PASSWORD — Set new password with token
// ==========================================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token. Please request a new one.',
      });
    }

    admin.password = password;
    admin.resetPasswordToken = null;
    admin.resetPasswordExpires = null;
    await admin.save();

    if (admin.logActivity) {
      try {
        await admin.logActivity('password_reset', 'Password reset via email link', req.ip);
      } catch (e) {
        // Non-critical
      }
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};