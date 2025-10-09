"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Card from "../_components/Card";

type User = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsappOptIn?: boolean;
  address?: {
    country?: string;
    city?: string;
  };
  payoutPreferences?: {
    mobileMoney?: {
      provider?: string;
      msisdn?: string;
      accountName?: string;
    };
    bank?: {
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    };
  };
};

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUser();
    }
  }, [session]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (profileLoading) return;

    setProfileLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          whatsappOptIn: formData.get("whatsappOptIn") === "on",
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        toast.success("Profile updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch {
      toast.error("Network error updating profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function updateAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (addressLoading) return;

    setAddressLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/user/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: formData.get("country"),
          city: formData.get("city"),
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        toast.success("Address updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update address");
      }
    } catch {
      toast.error("Network error updating address");
    } finally {
      setAddressLoading(false);
    }
  }

  async function updatePayouts(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (payoutsLoading) return;

    setPayoutsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/user/payouts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobileMoney: {
            provider: formData.get("mm_provider"),
            msisdn: formData.get("mm_msisdn"),
            accountName: formData.get("mm_name"),
          },
          bank: {
            bankName: formData.get("bank_name"),
            accountNumber: formData.get("bank_number"),
            accountName: formData.get("bank_acc_name"),
          },
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        toast.success("Payout details updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update payout details");
      }
    } catch {
      toast.error("Network error updating payout details");
    } finally {
      setPayoutsLoading(false);
    }
  }

if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 border-border bg-card">
              <div className="flex items-center gap-4">
                <Skeleton className="p-3 rounded-xl w-12 h-12" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Withdrawals Card Skeleton */}
        <Card className="p-6 border-border bg-card">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-6">
            {/* WithdrawalForm Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Recent Withdrawals List Skeleton */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-background">
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your profile, security, and payout details.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={updateProfile} className="rounded-2xl border p-4 bg-white/80 dark:bg-white/5 space-y-3">
          <h3 className="font-medium">Profile</h3>
          <Input 
            name="name" 
            defaultValue={user?.name ?? ""} 
            placeholder="Full name"
            disabled={profileLoading}
          />
          <Input 
            name="email" 
            defaultValue={user?.email ?? ""} 
            placeholder="Email"
            disabled={profileLoading}
          />
          <Input 
            name="phone" 
            defaultValue={user?.phone ?? ""} 
            placeholder="Phone"
            disabled={profileLoading}
          />
          <div className="flex items-center gap-2 text-sm">
            <Input 
              id="whatsappOptIn" 
              name="whatsappOptIn" 
              type="checkbox" 
              defaultChecked={Boolean(user?.whatsappOptIn)} 
              className="rounded border"
              disabled={profileLoading}
            />
            <label htmlFor="whatsappOptIn">WhatsApp notifications</label>
          </div>
          <button 
            type="submit"
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={profileLoading}
          >
            {profileLoading ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <form onSubmit={updateAddress} className="rounded-2xl border p-4 bg-white/80 dark:bg-white/5 space-y-3">
          <h3 className="font-medium">Address</h3>
          <Input 
            name="country" 
            defaultValue={user?.address?.country ?? ""} 
            placeholder="Country"
            disabled={addressLoading}
          />
          <Input 
            name="city" 
            defaultValue={user?.address?.city ?? ""} 
            placeholder="City"
            disabled={addressLoading}
          />
          <Button 
            type="submit"
            disabled={addressLoading}
          >
            {addressLoading ? "Saving..." : "Save Address"}
          </Button>
        </form>

        <form onSubmit={updatePayouts} className="rounded-2xl border p-4 bg-white/80 dark:bg-white/5 space-y-3 md:col-span-2">
          <h3 className="font-medium">Payout Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input 
              name="mm_provider" 
              defaultValue={user?.payoutPreferences?.mobileMoney?.provider ?? ""} 

              placeholder="MM Provider"
              disabled={payoutsLoading}
            />
            <Input 
              name="mm_msisdn" 
              defaultValue={user?.payoutPreferences?.mobileMoney?.msisdn ?? ""} 

              placeholder="Mobile Number"
              disabled={payoutsLoading}
            />
            <Input 
              name="mm_name" 
              defaultValue={user?.payoutPreferences?.mobileMoney?.accountName ?? ""} 

              placeholder="MM Account Name"
              disabled={payoutsLoading}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input 
              name="bank_name" 
              defaultValue={user?.payoutPreferences?.bank?.bankName ?? ""} 

              placeholder="Bank name"
              disabled={payoutsLoading}
            />
            <Input 
              name="bank_number" 
              defaultValue={user?.payoutPreferences?.bank?.accountNumber ?? ""} 

              placeholder="Account number"
              disabled={payoutsLoading}
            />
            <Input 
              name="bank_acc_name" 
              defaultValue={user?.payoutPreferences?.bank?.accountName ?? ""} 

              placeholder="Account name"
              disabled={payoutsLoading}
            />
          </div>
          <Button 
            type="submit"
            disabled={payoutsLoading}
          >
            {payoutsLoading ? "Saving..." : "Save Payout Details"}
          </Button>
        </form>
      </div>
    </div>
  );
}