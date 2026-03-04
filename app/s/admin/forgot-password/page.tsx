"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, KeyRound, ShieldCheck, MailCheck } from "lucide-react";
import Logo from "@/public/assets/ib4melogowhite.png";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [siteName, setSiteName] = useState("IB4ME");

  // Fetch website settings for site name
  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const response = await fetch("/api/admin/settings?category=website");
        if (response.ok) {
          const data = await response.json();
          setSiteName(data.settings?.siteName || "IB4ME");
        } else {
          setSiteName("IB4ME");
        }
      } catch (error) {
        console.error("Error fetching site name:", error);
        setSiteName("IB4ME");
      }
    };

    fetchSiteName();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage("If an admin account with this email exists, a password reset link has been sent.");
      } else {
        setIsSuccess(false);
        setMessage(data.message || "An error occurred. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      setIsSuccess(false);
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-Sora">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ backgroundColor: "#00712D" }}
      >
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
            <ShieldCheck className="h-4 w-4" style={{ color: "#FF6000" }} />
            <span>Secure Admin Portal</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Reset Your<br />Password
            </h1>
            <p className="mt-4 max-w-sm text-base text-white/70">
              Enter your admin email address and we&apos;ll send you a secure link to reset your password.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <MailCheck className="h-5 w-5 shrink-0" style={{ color: "#FF6000" }} />
              <div>
                <p className="text-sm font-semibold">Check Your Email</p>
                <p className="text-xs text-white/60">Reset link sent within seconds</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <KeyRound className="h-5 w-5 shrink-0" style={{ color: "#80E10A" }} />
              <div>
                <p className="text-sm font-semibold">Secure Reset Process</p>
                <p className="text-xs text-white/60">Link expires after 1 hour for security</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/40">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="rounded-2xl p-3" style={{ backgroundColor: "#00712D" }}>
              <Image src={Logo} alt="ib4me" className="h-12 w-auto" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#00712D20" }}
            >
              <KeyRound className="h-8 w-8" style={{ color: "#00712D" }} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email address to receive a password reset link
            </p>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl border ${
                isSuccess
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <div className="flex items-start gap-3">
                {isSuccess ? (
                  <svg className="w-5 h-5 mt-0.5 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mt-0.5 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <p className={`text-sm ${isSuccess ? "text-green-700" : "text-red-700"}`}>
                  {message}
                </p>
              </div>
            </div>
          )}

          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": "#00712D" } as React.CSSProperties}
                    placeholder="Enter your admin email"
                    required
                  />
                </div>
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
                    Sending reset link...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to login */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/s/admin/login"
              className="font-medium hover:underline"
              style={{ color: "#00712D" }}
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
