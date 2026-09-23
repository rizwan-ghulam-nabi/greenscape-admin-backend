// scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Prevents duplicates
    const existingUser = await User.findOne({ email: 'admin@greenscape.com' });
    if (existingUser) {
      console.log('⚠️ Admin already exists! Log in at http://localhost:3001/admin/login');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@greenscape.com',
      password: hashedPassword,
      isAdmin: true,
      role: 'admin', // Explicitly set the role
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@greenscape.com');
    console.log('🔑 Password: Admin123!');
    console.log('🚀 Log in at http://localhost:3001/admin/login');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();