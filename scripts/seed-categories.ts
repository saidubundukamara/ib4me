import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { connectDB } from "../lib/db";
import { categoryService } from "../services/CategoryService";

async function seedCategories() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Seeding categories...");
    const result = await categoryService.seedInitialCategories();

    console.log(`Done! Created: ${result.created}, Skipped (already exist): ${result.skipped}`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
}

seedCategories();
