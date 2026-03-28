/**
 * Migration Script: Medical-Only to General-Purpose Crowdfunding
 *
 * This script renames medical-specific fields to generic ones and activates
 * all pending/draft campaigns. Run against your MongoDB database.
 *
 * Usage:
 *   MONGODB_URI="mongodb://..." node scripts/migrate-medical-to-general.js
 *
 * What it does:
 *   1. Renames fields: patient->beneficiary, diagnosis->details,
 *      hospital->institution, typeOfEmergency->campaignType
 *   2. Removes hospitalVerified from verification subdocument
 *   3. Activates all draft campaigns with pending verification
 *   4. Updates outcome statuses: recovered->successful, deceased->closed
 *   5. Renames institution.hospitalId to remove it
 */

const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is required");
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const campaigns = db.collection("campaigns");

    // Step 1: Rename fields
    console.log("\n--- Step 1: Renaming fields ---");

    const renameResult = await campaigns.updateMany(
      {},
      {
        $rename: {
          patient: "beneficiary",
          diagnosis: "details",
          hospital: "institution",
          typeOfEmergency: "campaignType",
        },
      }
    );
    console.log(`Renamed fields in ${renameResult.modifiedCount} documents`);

    // Step 2: Remove hospitalVerified from verification subdocument
    console.log("\n--- Step 2: Removing hospitalVerified ---");

    const removeHospitalVerifiedResult = await campaigns.updateMany(
      { "verification.hospitalVerified": { $exists: true } },
      { $unset: { "verification.hospitalVerified": "" } }
    );
    console.log(
      `Removed hospitalVerified from ${removeHospitalVerifiedResult.modifiedCount} documents`
    );

    // Step 3: Remove hospitalId from institution subdocument
    console.log("\n--- Step 3: Removing institution.hospitalId ---");

    const removeHospitalIdResult = await campaigns.updateMany(
      { "institution.hospitalId": { $exists: true } },
      { $unset: { "institution.hospitalId": "" } }
    );
    console.log(
      `Removed institution.hospitalId from ${removeHospitalIdResult.modifiedCount} documents`
    );

    // Step 4: Activate all draft campaigns with pending verification
    console.log("\n--- Step 4: Activating draft/pending campaigns ---");

    const activateResult = await campaigns.updateMany(
      {
        $or: [
          { status: "draft", "verification.status": "pending" },
          { status: "draft", "verification.status": "under_review" },
        ],
      },
      {
        $set: {
          status: "active",
          "verification.status": "approved",
          "verification.verifiedAt": new Date(),
        },
      }
    );
    console.log(`Activated ${activateResult.modifiedCount} draft campaigns`);

    // Step 5: Update outcome statuses
    console.log("\n--- Step 5: Updating outcome statuses ---");

    const recoveredResult = await campaigns.updateMany(
      { "outcome.status": "recovered" },
      { $set: { "outcome.status": "successful" } }
    );
    console.log(
      `Updated ${recoveredResult.modifiedCount} 'recovered' -> 'successful'`
    );

    const deceasedResult = await campaigns.updateMany(
      { "outcome.status": "deceased" },
      { $set: { "outcome.status": "closed" } }
    );
    console.log(
      `Updated ${deceasedResult.modifiedCount} 'deceased' -> 'closed'`
    );

    // Summary
    console.log("\n=== Migration Complete ===");
    console.log("Field renames: patient->beneficiary, diagnosis->details,");
    console.log(
      "  hospital->institution, typeOfEmergency->campaignType"
    );
    console.log("Removed: verification.hospitalVerified, institution.hospitalId");
    console.log("Activated draft/pending campaigns");
    console.log("Updated outcome statuses: recovered->successful, deceased->closed");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

migrate();
