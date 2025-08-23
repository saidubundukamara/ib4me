"use client";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

export type LogoutOptions = {
  redirectTo?: string;
  showToast?: boolean;
};

export async function logout(options?: LogoutOptions): Promise<void> {
  const redirectTo = options?.redirectTo ?? "/";
  const showToast = options?.showToast !== false;
  try {
    if (showToast) toast.success("Signed out");
    // Use redirect: false to avoid full reload timing before we control navigation
    await signOut({ redirect: false });
    window.location.href = redirectTo;
  } catch (error) {
    if (showToast) toast.error("Failed to sign out");
  }
}
