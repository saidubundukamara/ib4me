import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export default async function UserSettingsPage() {
  "use server";
  await connectDB();
  const session: Session | null = await getServerSession(authConfig);
  const userId = session?.user?.id ? new mongoose.Types.ObjectId(session.user.id) : null;
  const user = userId ? await UserModel.findById(userId) : null;

  async function updateProfile(formData: FormData) {
    "use server";
    await connectDB();
    const s: Session | null = await getServerSession(authConfig);
    const uid = s?.user?.id ? new mongoose.Types.ObjectId(s.user.id) : null;
    if (!uid) throw new Error("Not authenticated");
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const phone = String(formData.get("phone") || "");
    const whatsappOptIn = String(formData.get("whatsappOptIn") || "false") === "true";
    await UserModel.findByIdAndUpdate(uid, {
      $set: {
        name,
        email: email || null,
        phone: phone || null,
        whatsappOptIn,
      },
    });
    revalidatePath("/user/settings");
  }

  async function updatePayouts(formData: FormData) {
    "use server";
    await connectDB();
    const s: Session | null = await getServerSession(authConfig);
    const uid = s?.user?.id ? new mongoose.Types.ObjectId(s.user.id) : null;
    if (!uid) throw new Error("Not authenticated");

    const provider = String(formData.get("mm_provider") || "");
    const msisdn = String(formData.get("mm_msisdn") || "");
    const mmName = String(formData.get("mm_name") || "");

    const bankName = String(formData.get("bank_name") || "");
    const bankNumber = String(formData.get("bank_number") || "");
    const bankAccName = String(formData.get("bank_acc_name") || "");

    await UserModel.findByIdAndUpdate(uid, {
      $set: {
        payoutPreferences: {
          mobileMoney: {
            provider: provider || null,
            msisdn: msisdn || null,
            accountName: mmName || null,
          },
          bank: {
            bankName: bankName || null,
            accountNumber: bankNumber || null,
            accountName: bankAccName || null,
          },
        },
      },
    });
    revalidatePath("/user/settings");
  }

  async function updateAddress(formData: FormData) {
    "use server";
    await connectDB();
    const s: Session | null = await getServerSession(authConfig);
    const uid = s?.user?.id ? new mongoose.Types.ObjectId(s.user.id) : null;
    if (!uid) throw new Error("Not authenticated");
    const country = String(formData.get("country") || "");
    const city = String(formData.get("city") || "");
    await UserModel.findByIdAndUpdate(uid, {
      $set: {
        address: {
          country: country || null,
          city: city || null,
        },
      },
    });
    revalidatePath("/user/settings");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your profile, security, and payout details.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form action={updateProfile} className="rounded-2xl border p-4 bg-white/80 dark:bg-white/5 space-y-3">
          <h3 className="font-medium">Profile</h3>
          <input name="name" defaultValue={user?.name ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Full name"/>
          <input name="email" defaultValue={user?.email ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Email"/>
          <input name="phone" defaultValue={user?.phone ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Phone"/>
          <div className="flex items-center gap-2 text-sm">
            <input id="whatsappOptIn" name="whatsappOptIn" type="checkbox" defaultChecked={Boolean(user?.whatsappOptIn)} className="rounded border"/>
            <label htmlFor="whatsappOptIn">WhatsApp notifications</label>
          </div>
          <button className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700">Save Profile</button>
        </form>

        <form action={updateAddress} className="rounded-2xl border p-4 bg-white/80 dark:bg-white/5 space-y-3">
          <h3 className="font-medium">Address</h3>
          <input name="country" defaultValue={user?.address?.country ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Country"/>
          <input name="city" defaultValue={user?.address?.city ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="City"/>
          <button className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700">Save Address</button>
        </form>

        <form action={updatePayouts} className="rounded-2xl border p-4 bg-white/80 dark:bg-white/5 space-y-3 md:col-span-2">
          <h3 className="font-medium">Payout Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="mm_provider" defaultValue={user?.payoutPreferences?.mobileMoney?.provider ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="MM Provider"/>
            <input name="mm_msisdn" defaultValue={user?.payoutPreferences?.mobileMoney?.msisdn ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Mobile Number"/>
            <input name="mm_name" defaultValue={user?.payoutPreferences?.mobileMoney?.accountName ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="MM Account Name"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="bank_name" defaultValue={user?.payoutPreferences?.bank?.bankName ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Bank name"/>
            <input name="bank_number" defaultValue={user?.payoutPreferences?.bank?.accountNumber ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Account number"/>
            <input name="bank_acc_name" defaultValue={user?.payoutPreferences?.bank?.accountName ?? ""} className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Account name"/>
          </div>
          <button className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700">Save Payout Details</button>
        </form>
      </div>
    </div>
  );
}


