#!/usr/bin/env node

/**
 * Reset User Password Script
 *
 * Resets a user's password to a new known value and clears any login lockout
 * (loginAttempts -> 0, lockUntil -> null). Use this for owner-initiated account
 * recovery — a bcrypt passwordHash cannot be reversed, it can only be replaced.
 *
 * Operates on the raw `users` collection to avoid depending on a hand-maintained
 * inline schema (the model's `roles` enum, etc. can drift over time).
 *
 * Usage:
 *   node scripts/reset-password.js <email> <newPassword>
 *   npm run reset-password -- <email> <newPassword>
 *
 * Example:
 *   npm run reset-password -- ib4me@gmail.com 'ChosenNewPassword1'
 */

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;

// MongoDB connection function
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';

  console.log('🔍 Using MongoDB URI:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'Not found');

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in .env.local');
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  return mongoose.connect(MONGODB_URI);
}

async function resetPassword() {
  const [, , rawEmail, newPassword] = process.argv;

  // Validate arguments
  if (!rawEmail || !newPassword) {
    console.error('❌ Missing arguments.');
    console.error('   Usage: node scripts/reset-password.js <email> <newPassword>');
    console.error("   Example: npm run reset-password -- ib4me@gmail.com 'ChosenNewPassword1'");
    process.exit(1);
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    console.error(`❌ Password too short. Must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();
  let connection = null;

  try {
    console.log('🚀 Starting password reset...');
    console.log('📊 Connecting to MongoDB...');
    connection = await connectDB();
    console.log('✅ Connected to MongoDB successfully');
    console.log('🏪 Database name:', mongoose.connection.db?.databaseName || 'Unknown');

    const users = mongoose.connection.db.collection('users');

    // Find the user
    console.log(`🔍 Looking up user with email '${email}'...`);
    const user = await users.findOne({ email });

    if (!user) {
      console.error(`❌ No user found with email '${email}'.`);
      process.exit(1);
    }

    console.log('👤 User found:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.roles || 'User'}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Currently locked: ${user.lockUntil && new Date(user.lockUntil) > new Date() ? 'Yes' : 'No'}`);

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear lockout state
    const result = await users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          passwordChangedAt: new Date(),
          loginAttempts: 0,
          lockUntil: null,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount !== 1) {
      console.error('❌ Update did not modify the user record. Aborting.');
      process.exit(1);
    }

    console.log('');
    console.log('🎉 Password reset successfully!');
    console.log(`   Email: ${email}`);
    console.log('   Lockout cleared: loginAttempts=0, lockUntil=null');
    console.log('   passwordChangedAt updated.');
    console.log('');
    console.log('🔑 You can now log in with the new password you provided.');
  } catch (error) {
    console.error('❌ Error resetting password:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      console.log('🔌 Closing database connection...');
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  resetPassword()
    .then(() => {
      console.log('✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { resetPassword };
