"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </SessionProvider>
  );
}

