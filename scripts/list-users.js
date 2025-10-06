#!/usr/bin/env node

/**
 * List Users Script
 * 
 * Lists all users in the database to verify what's there
 * 
 * Usage: node scripts/list-users.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// MongoDB connection function
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env");
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

async function listUsers() {
  let connection = null;
  
  try {
    console.log('🚀 Starting user listing...');
    
    // Connect to database
    console.log('📊 Connecting to MongoDB...');
    connection = await connectDB();
    console.log('✅ Connected to MongoDB successfully');
    console.log('🏪 Database name:', mongoose.connection.db?.databaseName || 'Unknown');
    
    // Get all users
    console.log('👥 Fetching all users...');
    const users = await User.find({}).select('name email roles status createdAt').sort({ createdAt: -1 });
    
    console.log(`\n📋 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.roles || 'User'}`);
      console.log(`   Status: ${user.status || 'active'}`);
      console.log(`   Created: ${user.createdAt || 'N/A'}`);
      console.log(`   ID: ${user._id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:');
    console.error(error.message);
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
  listUsers()
    .then(() => {
      console.log('✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { listUsers };