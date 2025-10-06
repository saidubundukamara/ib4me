#!/usr/bin/env node

/**
 * Create SuperAdmin User Script
 * 
 * Creates a SuperAdmin user with:
 * - Email: superadmin@example.com
 * - Password: password
 * - Role: SuperAdmin
 * - Status: active
 * 
 * Usage: npm run create-superadmin
 */

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// MongoDB connection function
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  
  console.log('🔍 Using MongoDB URI:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'Not found');
  
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  return mongoose.connect(MONGODB_URI);
}

// User Schema Definition (inline to avoid import issues)
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: null },
    photoUrl: { type: String, default: null },
    passwordHash: { type: String, default: null },
    emailVerified: { type: Date, default: null },
    phoneVerified: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    roles: {
      type: String,
      enum: ["SuperAdmin", "Admin", "User"],
      default: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },
    whatsappOptIn: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: {
      type: String,
      enum: ["sms", "email", "totp"],
      default: null,
    },
    twoFactorSecret: { type: String, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null, index: true },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    lastLoginUserAgent: { type: String, default: null },
    payoutPreferences: {
      mobileMoney: {
        provider: { type: String, default: null },
        msisdn: { type: String, default: null },
        accountName: { type: String, default: null },
      },
      bank: {
        bankName: { type: String, default: null },
        accountNumber: { type: String, default: null },
        accountName: { type: String, default: null },
      },
    },
    address: {
      country: { type: String, default: null },
      city: { type: String, default: null },
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

// Create User model
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createSuperAdmin() {
  let connection = null;
  
  try {
    console.log('🚀 Starting SuperAdmin creation...');
    
    // Connect to database
    console.log('📊 Connecting to MongoDB...');
    connection = await connectDB();
    console.log('✅ Connected to MongoDB successfully');
    console.log('🏪 Database name:', mongoose.connection.db?.databaseName || 'Unknown');
    console.log('📋 Collection name: users');
    
    // Check existing users count
    const userCount = await User.countDocuments();
    console.log('👥 Total users in database:', userCount);
    
    // SuperAdmin details
    const superAdminData = {
      name: 'Super Admin',
      email: 'admin@ib4me.com',
      password: 'admin123',
      role: 'SuperAdmin',
      status: 'active'
    };
    
    // Check if SuperAdmin already exists
    console.log(`🔍 Checking if user with email '${superAdminData.email}' already exists...`);
    const existingUser = await User.findOne({ email: superAdminData.email });
    
    if (existingUser) {
      console.log('⚠️  SuperAdmin user already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.roles || 'User'}`);
      console.log(`   Status: ${existingUser.status}`);
      console.log(`   Created: ${existingUser.createdAt}`);
      
      // Check if existing user is actually a SuperAdmin
      if (existingUser.roles === 'SuperAdmin' || (Array.isArray(existingUser.roles) && existingUser.roles.includes('SuperAdmin'))) {
        console.log('✅ Existing user already has SuperAdmin role. No action needed.');
      } else {
        console.log('❌ Existing user does not have SuperAdmin role.');
        console.log('   Please manually update the user role or use a different email.');
      }
      
      return;
    }
    
    // Hash the password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(superAdminData.password, saltRounds);
    console.log('✅ Password hashed successfully');
    
    // Create the SuperAdmin user
    console.log('👤 Creating SuperAdmin user...');
    const superAdmin = await User.create({
      name: superAdminData.name,
      email: superAdminData.email,
      phone: `+232${Date.now().toString().slice(-8)}`, // Generate unique phone number
      passwordHash: passwordHash,
      roles: superAdminData.role,
      status: superAdminData.status,
      emailVerified: new Date(), // Mark email as verified
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('🎉 SuperAdmin user created successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log(`   ID: ${superAdmin._id}`);
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.roles}`);
    console.log(`   Status: ${superAdmin.status}`);
    console.log(`   Email Verified: ${superAdmin.emailVerified ? 'Yes' : 'No'}`);
    console.log(`   Created: ${superAdmin.createdAt}`);
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${superAdminData.email}`);
    console.log(`   Password: ${superAdminData.password}`);
    console.log('');
    console.log('🌐 You can now login at: http://admin.localhost:3001/login');
    
  } catch (error) {
    console.error('❌ Error creating SuperAdmin user:');
    console.error(error.message);
    
    if (error.code === 11000) {
      console.error('   This is a duplicate key error - the user likely already exists.');
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    if (connection) {
      console.log('🔌 Closing database connection...');
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createSuperAdmin };