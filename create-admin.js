// create-admin.mjs
// Run: node create-admin.mjs
// Delete this file after use!

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: '.env.local' });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env.local');
  process.exit(1);
}

// ==========================================
// CONFIGURE HERE
// ==========================================
const ADMIN = {
  firstName: 'Rizwan',
  lastName: 'Sheikh',
  email: 'sheikhrizwanghulamnabi555@gmail.com',
  password: 'Admin@123456', // ⚠️ Change this!
  role: 'superadmin',
  isAdmin: true,
  status: 'active',
};
// ==========================================

// Minimal Admin schema (matches your Admin.js)
const AdminSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: String,
    role: { type: String, default: 'admin' },
    isAdmin: { type: Boolean, default: true },
    status: { type: String, default: 'active' },
  },
  { timestamps: true }
);

const Admin = mongoose.model('Admin', AdminSchema);

async function createAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    const email = ADMIN.email.toLowerCase().trim();

    // Check if exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`⚠️ Admin already exists: ${email}`);
      console.log('   Deleting and recreating...');
      await Admin.deleteOne({ email });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN.password, 10);

    // Create
    console.log('📝 Creating admin...');
    const admin = await Admin.create({
      ...ADMIN,
      email,
      password: hashedPassword,
    });

    console.log('');
    console.log('════════════════════════════════════════');
    console.log('  ✅ ADMIN CREATED SUCCESSFULLY');
    console.log('════════════════════════════════════════');
    console.log('  ID:       ', admin._id.toString());
    console.log('  Email:    ', admin.email);
    console.log('  Password: ', ADMIN.password, '(plaintext — change after login)');
    console.log('  Role:     ', admin.role);
    console.log('════════════════════════════════════════');
    console.log('');
    console.log('🔑 Log in at: https://greenscape-admin-frontend.vercel.app/admin/login');
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

createAdmin();