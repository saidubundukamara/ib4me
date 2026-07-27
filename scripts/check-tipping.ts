/**
 * Why is the tip link not showing?
 *
 * Tipping is only offered to donors when THREE things are true, and the admin panel can
 * look "enabled" while one of them is not. This prints exactly which one is failing.
 *
 *   1. tipFinancialAccount.id   is set
 *   2. tipFinancialAccount.uvan is set   <- the one people miss
 *   3. tipping.enabled          is true
 *
 * Read-only.
 *
 *   npm run check:tipping
 */
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import Setting from "../models/Setting";
import { formatMinor } from "../lib/currency";

type PlatformSettings = {
  tipFinancialAccount?: { id?: string; uvan?: string };
  tipping?: {
    enabled?: boolean;
    suggestedAmounts?: number[];
    minAmountMinor?: number;
    maxAmountMinor?: number;
  };
};

function mask(value?: string): string {
  if (!value) return "MISSING";
  return value.length <= 8 ? value : `${value.slice(0, 6)}…${value.slice(-2)}`;
}

async function main() {
  await connectDB();

  const settings = (await Setting.findById("platform").lean()) as PlatformSettings | null;
  if (!settings) {
    console.log("\nNo platform settings document exists at all (_id: 'platform').");
    console.log("Save anything in admin settings once to create it.\n");
    await mongoose.disconnect();
    return;
  }

  const account = settings.tipFinancialAccount ?? {};
  const tipping = settings.tipping ?? {};

  const hasId = Boolean(account.id);
  const hasUvan = Boolean(account.uvan);
  const isConfigured = hasId && hasUvan;
  const enabledFlag = tipping.enabled === true;
  const live = isConfigured && enabledFlag;

  const tick = (ok: boolean) => (ok ? "OK  " : "FAIL");

  console.log("\n" + "─".repeat(64));
  console.log("Tipping gate");
  console.log("─".repeat(64));
  console.log(`  ${tick(hasId)}  tipFinancialAccount.id     ${mask(account.id)}`);
  console.log(`  ${tick(hasUvan)}  tipFinancialAccount.uvan   ${mask(account.uvan)}`);
  console.log(
    `  ${tick(enabledFlag)}  tipping.enabled            ${
      tipping.enabled === undefined ? "not set" : String(tipping.enabled)
    }`
  );
  console.log("─".repeat(64));
  console.log(`  Donors see tipping: ${live ? "YES" : "NO"}`);
  console.log("─".repeat(64));

  if (!live) {
    console.log("\nWhy not:");
    if (!hasId) console.log("  · No tip financial account id. Set it in admin settings.");
    if (hasId && !hasUvan) {
      console.log("  · The tip account has an id but no uvan. BOTH are required —");
      console.log("    this is the usual cause, because the admin Enable switch unlocks");
      console.log("    as soon as you start typing, before the account is fully saved.");
    }
    if (!enabledFlag) {
      console.log("  · tipping.enabled is not true. Turn it on in admin settings and SAVE.");
    }
    console.log(
      "\nEverything is behaving correctly given this state — the tip link, the\n" +
        "thank-you-page prompt and the sitemap entry are all hidden on purpose when\n" +
        "tipping cannot actually take money.\n"
    );
  } else {
    console.log("\nConfigured amounts:");
    const amounts = tipping.suggestedAmounts ?? [];
    console.log(
      `  presets  ${amounts.length ? amounts.map((a) => formatMinor(a)).join(" · ") : "(none set — the thank-you CTA needs at least one)"}`
    );
    console.log(`  min      ${formatMinor(tipping.minAmountMinor ?? 0)}`);
    console.log(`  max      ${formatMinor(tipping.maxAmountMinor ?? 0)}`);
    console.log(
      "\nIf the link still is not visible: the flag is cached for 60s, so wait a\n" +
        "minute, and restart `npm run dev` if the layout was changed while it ran.\n" +
        "Note the navbar and footer are hidden on /dashboard, /admin, /s and /user.\n"
    );
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("\nERROR:", err instanceof Error ? err.message : err);
  console.error(
    "\nIf this is a missing MONGODB_URI, run it with the same env your app uses.\n"
  );
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
