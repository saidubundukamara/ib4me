"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, BarChart2, Users, ShieldCheck, ArrowRight } from "lucide-react";
import Logo from "@/public/assets/ib4melogowhite.png";
import MainLogo from "@/public/assets/ib4melogo.png";

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setUser, setAccessToken } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      setUser(data.user);
      setAccessToken(data.token);
      toast.success("Welcome back!");
      window.location.href = "/s/admin";
    } catch (error) {
      toast.error("Login Failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-Sora">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ backgroundColor: "#00712D" }}>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <Image
              src={Logo}
              alt="ib4me"
              className="h-14 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-[#FF6000]" />
            <span>Secure Admin Portal</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              ib4me Admin<br />Control Panel
            </h1>
            <p className="mt-4 max-w-sm text-base text-white/70">
              Manage campaigns, donations, users, and platform settings with full administrative control.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <BarChart2 className="h-5 w-5 shrink-0 text-[#FF6000]" />
              <div>
                <p className="text-sm font-semibold">Real-time Analytics</p>
                <p className="text-xs text-white/60">Monitor platform performance live</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <Users className="h-5 w-5 shrink-0 text-[#80E10A]" />
              <div>
                <p className="text-sm font-semibold">User &amp; Campaign Management</p>
                <p className="text-xs text-white/60">Full control over all platform content</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/40">
          © {new Date().getFullYear()} ib4me. All rights reserved.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo — hidden on desktop where the sidebar shows the logo */}
          <div className="mb-6 flex justify-center lg:hidden">
            <Image src={MainLogo} alt="ib4me" className="h-16 w-auto" priority />
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <Image
                src={MainLogo}
                alt="ib4me"
                className="h-20 w-auto sm:h-24 drop-shadow-sm"
                priority
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Admin Login</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to access the admin panel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="block h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": "#00712D" } as React.CSSProperties}
                placeholder="admin@ib4me.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block h-12 w-full rounded-xl border border-border bg-background px-4 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded accent-[#00712D]" />
                Remember me
              </label>
              <Link
                href="/s/admin/forgot-password"
                className="text-sm font-medium hover:underline"
                style={{ color: "#00712D" }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#00712D" }}
            >
              {isLoading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Need help?{" "}
            <Link href="/contact" className="font-medium hover:underline" style={{ color: "#00712D" }}>
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
