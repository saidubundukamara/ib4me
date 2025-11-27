#!/usr/bin/env node

/**
 * Migration Script: Hide Unapproved Campaigns
 *
 * This script updates all campaigns that are currently "active" but have
 * "pending" verification status to "draft" status (hidden from public).
 *
 * This enforces the new rule that campaigns must be approved by admin
 * before they become visible to the public.
 *
 * Usage: node scripts/migrate-unapproved-campaigns.js
 * Or:    npm run migrate:unapproved-campaigns
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// MongoDB connection function
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";

  console.log('Using MongoDB URI:', MONGODB_URI ? MONGODB_URI.substring(0, 30) + '...' : 'Not found');

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  return mongoose.connect(MONGODB_URI);
}

// Campaign Schema Definition (inline to avoid import issues)
const campaignSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    patient: {
      name: { type: String, trim: true },
      age: { type: Number, min: 0 },
      photoAssetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    },
    diagnosis: { type: String },
    hospital: {
      hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
      name: { type: String, trim: true },
    },
    goal: {
      currency: { type: String, trim: true },
      amountMinor: { type: Number, min: 0 },
    },
    story: { type: String },
    documents: [
      {
        type: { type: String, required: true },
        assetId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MediaAsset",
          required: true,
        },
      },
    ],
    verification: {
      status: {
        type: String,
        enum: ["pending", "under_review", "approved", "rejected"],
        default: "pending",
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      verifiedAt: { type: Date, default: null },
      hospitalVerified: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "archived"],
      default: "draft",
      index: true,
    },
    outcome: {
      status: {
        type: String,
        enum: ["ongoing", "recovered", "deceased", "completed"],
        default: "ongoing",
      },
      date: { type: Date, default: null },
      nextOfKin: {
        name: { type: String },
        relation: { type: String },
        contact: { type: String },
        payoutDecision: { type: String },
      },
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    typeOfEmergency: { type: String },
    category: { type: String, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    share: {
      whatsAppPostId: { type: String, default: null },
    },
    totals: {
      raisedMinor: { type: Number, default: 0, min: 0 },
      donationCount: { type: Number, default: 0, min: 0 },
      uniqueDonorCount: { type: Number, default: 0, min: 0 },
      lastDonationAt: { type: Date, default: null },
    },
    withdrawals: {
      totalPaidMinor: { type: Number, default: 0, min: 0 },
      count: { type: Number, default: 0, min: 0 },
    },
    financial_account: {
      id: { type: String },
      uvan: { type: String },
    },
    flags: {
      featured: { type: Boolean, default: false },
      adminVerified: { type: Boolean, default: false },
    },
    ownerVerification: {
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ["not_started", "pending", "under_review", "approved", "rejected"],
        default: "not_started",
      },
    },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Create Campaign model
const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

async function migrateUnapprovedCampaigns() {
  let connection = null;

  try {
    console.log('Starting migration: Hide unapproved campaigns...');
    console.log('');

    // Connect to database
    console.log('Connecting to MongoDB...');
    connection = await connectDB();
    console.log('Connected to MongoDB successfully');
    console.log('Database name:', mongoose.connection.db?.databaseName || 'Unknown');
    console.log('');

    // Find campaigns that need to be migrated
    // These are campaigns that are "active" but NOT "approved"
    const campaignsToMigrate = await Campaign.find({
      status: "active",
      "verification.status": { $ne: "approved" }
    }).select('_id slug patient.name status verification.status createdAt');

    console.log(`Found ${campaignsToMigrate.length} campaigns that are active but not approved.`);
    console.log('');

    if (campaignsToMigrate.length === 0) {
      console.log('No campaigns need to be migrated. All active campaigns are already approved.');
      return;
    }

    // List campaigns that will be updated
    console.log('Campaigns to be updated (set to draft):');
    console.log('-'.repeat(80));
    campaignsToMigrate.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.slug}`);
      console.log(`   Patient: ${campaign.patient?.name || 'N/A'}`);
      console.log(`   Current Status: ${campaign.status}`);
      console.log(`   Verification: ${campaign.verification?.status || 'pending'}`);
      console.log(`   Created: ${campaign.createdAt}`);
      console.log('');
    });

    // Perform the migration
    console.log('Updating campaigns...');
    const result = await Campaign.updateMany(
      {
        status: "active",
        "verification.status": { $ne: "approved" }
      },
      {
        $set: { status: "draft" }
      }
    );

    console.log('');
    console.log('Migration completed!');
    console.log(`Updated ${result.modifiedCount} campaigns from "active" to "draft" status.`);
    console.log('');
    console.log('These campaigns are now hidden from the public.');
    console.log('An admin needs to approve them before they become visible again.');

  } catch (error) {
    console.error('Error during migration:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Close database connection
    if (connection) {
      console.log('');
      console.log('Closing database connection...');
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  migrateUnapprovedCampaigns()
    .then(() => {
      console.log('');
      console.log('Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { migrateUnapprovedCampaigns };
