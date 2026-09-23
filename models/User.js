// // backend/models/User.js - ADMIN BACKEND VERSION
// import mongoose from 'mongoose';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';

// const UserSchema = new mongoose.Schema(
//   {
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true, minlength: 6 },
//     phone: { type: String },
//     country: { type: String },
    
//     // ✅ Admin fields
//     isAdmin: { type: Boolean, default: false },
//     role: { 
//       type: String, 
//       enum: ['customer', 'admin', 'superadmin', 'editor', 'manager'], 
//       default: 'customer' 
//     },
    
//     // ✅ Status tracking (for customers)
//     status: { 
//       type: String, 
//       enum: ['active', 'inactive', 'suspended'], 
//       default: 'active' 
//     },
//     isActive: { type: Boolean, default: true },
//     lastLogin: { type: Date },
    
//     // ✅ Profile
//     profileImage: { type: String, default: null },
//     bio: { type: String, default: '' },
//     gender: { type: String, default: 'Prefer not to say' },
    
//     // ✅ Newsletter
//     subscribedToNewsletter: { type: Boolean, default: false },
    
//     // ✅ Email verification
//     emailVerified: { type: Boolean, default: false },
//     emailVerificationToken: { type: String },
//     emailVerificationExpires: { type: Date },
    
//     // ✅ Security
//     refreshToken: { type: String },
//     loginAttempts: { type: Number, default: 0 },
//     lockUntil: { type: Date },
    
//     // ✅ Cart (embedded)
//     cart: [
//       {
//         product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
//         quantity: { type: Number, default: 1 },
//         addedAt: { type: Date, default: Date.now }
//       }
//     ],
    
//     // ✅ Wishlist
//     wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    
//     // ✅ Shipping addresses
//     addresses: [
//       {
//         label: { type: String },
//         fullName: { type: String },
//         phone: { type: String },
//         address: { type: String },
//         city: { type: String },
//         state: { type: String },
//         postalCode: { type: String },
//         country: { type: String },
//         isDefault: { type: Boolean, default: false }
//       }
//     ]
//   },
//   { timestamps: true }
// );

// // ==========================================
// // ✅ JWT METHODS
// // ==========================================

// UserSchema.methods.generateAuthToken = function () {
//   return jwt.sign(
//     { id: this._id, isAdmin: this.isAdmin, role: this.role },
//     process.env.JWT_SECRET,
//     { expiresIn: '4h' }
//   );
// };

// UserSchema.methods.generateRefreshToken = function () {
//   return jwt.sign(
//     { id: this._id },
//     process.env.JWT_SECRET,
//     { expiresIn: '7d' }
//   );
// };

// // ==========================================
// // ✅ PASSWORD METHODS
// // ==========================================

// // Hash password before save
// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// UserSchema.methods.matchPassword = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

// // ==========================================
// // ✅ LOGIN ATTEMPT METHODS
// // ==========================================

// UserSchema.methods.isLocked = function () {
//   return this.lockUntil && this.lockUntil > Date.now();
// };

// UserSchema.methods.incrementLoginAttempts = async function () {
//   this.loginAttempts += 1;
//   if (this.loginAttempts >= 5) {
//     this.lockUntil = Date.now() + 15 * 60 * 1000;
//   }
//   await this.save();
// };

// UserSchema.methods.resetLoginAttempts = async function () {
//   this.loginAttempts = 0;
//   this.lockUntil = undefined;
//   this.lastLogin = new Date();
//   await this.save();
// };

// // ==========================================
// // ✅ TO JSON TRANSFORM
// // ==========================================

// UserSchema.set('toJSON', {
//   transform: (doc, ret) => {
//     delete ret.password;
//     delete ret.refreshToken;
//     delete ret.emailVerificationToken;
//     delete ret.emailVerificationExpires;
//     return ret;
//   }
// });

// const User = mongoose.model('User', UserSchema);
// export default User;














//  new version 17/9/2026
// backend/models/User.js
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
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
      trim: true 
    },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    country: { type: String, trim: true },

    // ==========================================
    // ROLE & STATUS
    // ==========================================
    role: {
      type: String,
      enum: ['customer', 'admin', 'superadmin', 'editor', 'manager'],
      default: 'customer',
    },
    isAdmin: { type: Boolean, default: false },   // Kept for JWT convenience
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    lastLogin: { type: Date },

    // ==========================================
    // PROFILE
    // ==========================================
    profileImage: { type: String, default: null },
    bio: { type: String, default: '' },
    gender: { type: String, default: 'Prefer not to say' },
    subscribedToNewsletter: { type: Boolean, default: false },

    // ==========================================
    // EMAIL VERIFICATION
    // ==========================================
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },

    // ==========================================
    // SECURITY
    // ==========================================
    refreshToken: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // ==========================================
    // WISHLIST
    // ==========================================
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // ==========================================
    // ADDRESSES
    // ==========================================
    addresses: [
      {
        label: { type: String },
        fullName: { type: String },
        phone: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// ==========================================
// ✅ JWT METHODS
// ==========================================
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, isAdmin: this.isAdmin, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '4h' }
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ==========================================
// ✅ SYNC isAdmin WITH role (pre-save hook)
// ==========================================
UserSchema.pre('save', async function () {
  // Sync isAdmin boolean from role
  this.isAdmin = ['admin', 'superadmin'].includes(this.role);

  // Hash password if changed
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// ==========================================
// ✅ PASSWORD METHODS
// ==========================================
UserSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ==========================================
// ✅ LOGIN ATTEMPT METHODS
// ==========================================
UserSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

UserSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
  }
  await this.save();
};

UserSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save();
};

// ==========================================
// ✅ TO JSON TRANSFORM (hide sensitive fields)
// ==========================================
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    return ret;
  },
});

const User = mongoose.model('User', UserSchema);
export default User;


