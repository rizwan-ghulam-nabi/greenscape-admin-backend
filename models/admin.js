// backend/models/Admin.js
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFO
    // ==========================================
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, trim: true },
    avatar: { type: String, default: null },

    // ==========================================
    // ROLE & PERMISSIONS
    // ==========================================
    isAdmin: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ['admin', 'superadmin', 'editor', 'manager'],
      default: 'admin',
    },
    permissions: {
      products: { type: Boolean, default: true },
      orders: { type: Boolean, default: true },
      customers: { type: Boolean, default: true },
      categories: { type: Boolean, default: true },
      collections: { type: Boolean, default: true },
      blog: { type: Boolean, default: true },
      banners: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      settings: { type: Boolean, default: false },
    },

    // ==========================================
    // STATUS
    // ==========================================
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    lastLogin: { type: Date },
    lastActivity: { type: Date },

    // ==========================================
    // SECURITY
    // ==========================================
    refreshToken: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // ==========================================
    // ACTIVITY LOG
    // ==========================================
    activityLog: [
      {
        action: { type: String },
        description: { type: String },
        ip: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ==========================================
// ✅ JWT METHODS
// ==========================================
AdminSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, type: 'admin', isAdmin: true, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

AdminSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id, type: 'admin', isAdmin: true },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, // ✅ separate secret
    { expiresIn: '7d' }
  );
};

// ==========================================
// ✅ PRE-SAVE HOOK — Hash password (modern syntax)
// ==========================================
AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ==========================================
// ✅ PASSWORD METHODS
// ==========================================
AdminSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ==========================================
// ✅ LOGIN ATTEMPT METHODS
// ==========================================
AdminSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

AdminSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 15 * 60 * 1000;
  }
  await this.save();
};

AdminSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save();
};

// ==========================================
// ✅ ACTIVITY LOGGING
// ==========================================
AdminSchema.methods.logActivity = async function (action, description, ip) {
  this.activityLog.push({
    action,
    description,
    ip,
    timestamp: new Date(),
  });

  // Keep only last 50 entries
  if (this.activityLog.length > 50) {
    this.activityLog = this.activityLog.slice(-50);
  }

  this.lastActivity = new Date();
  await this.save();
};

// ==========================================
// ✅ PERMISSION CHECK
// ==========================================
AdminSchema.methods.hasPermission = function (permission) {
  return this.permissions[permission] === true;
};

// ==========================================
// ✅ TO JSON TRANSFORM
// ==========================================
AdminSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    return ret;
  },
});

const Admin = mongoose.model('Admin', AdminSchema);
export default Admin;
