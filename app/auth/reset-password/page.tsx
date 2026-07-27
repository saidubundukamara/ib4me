"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthLayout } from "../_components/AuthLayout";
import { ResetPasswordAside } from "../_components/AuthSidePanels";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState(() => searchParams.get("identifier") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paramIdentifier = searchParams.get("identifier");
    if (paramIdentifier && !identifier) {
      setIdentifier(paramIdentifier);
    }
  }, [searchParams, identifier]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedIdentifier = identifier.trim();
    const trimmedCode = code.trim();

    if (!trimmedIdentifier || !trimmedCode || !newPassword || !confirmPassword) {
      const message = "Please fill in all required fields.";
      setError(message);
      toast.error(message);
      return;
    }

    if (newPassword !== confirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: trimmedIdentifier,
          code: trimmedCode,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Unable to reset password.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Password updated. You can sign in with your new credentials.");
      router.push("/auth/signin");
    } catch (submitError) {
      console.error(submitError);
      const message = "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      const message = "Enter the email or phone number to resend the code.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmedIdentifier }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "We couldn’t resend the code.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("A new code is on its way.");
    } catch (resendError) {
      console.error(resendError);
      const message = "Something went wrong while resending the code.";
      setError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the verification code and choose a new password."
      highlight={
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-blaze-orange md:justify-start">
          Keep your account secure
          <ShieldCheck className="h-4 w-4 text-accent" />
        </p>
      }
      lead={
        <div className="mb-6 rounded-xl border border-dashed border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
          Use the six digit code we sent you. Each code expires ten minutes after it is requested.
        </div>
      }
      aside={<ResetPasswordAside />}
      footer={
        <>
          Need a fresh code?{" "}
          <Link href="/auth/forgot-password" className="font-semibold text-primary hover:underline">
            Request again
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-sm font-semibold text-foreground">
            Email or phone number
          </Label>
          <Input
            id="identifier"
            autoComplete="username"
            placeholder="m@example.com or +232..."
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            className="h-12 rounded-xl text-base"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-semibold text-foreground">
            6-digit verification code
          </Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            className="h-12 rounded-xl text-base tracking-[0.4em]"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-sm font-semibold text-foreground">
            New password
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              autoComplete="new-password"
              className="h-12 rounded-xl pr-12 text-base"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowNewPassword((prev) => !prev)}
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              <span className="sr-only">Toggle password visibility</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
              className="h-12 rounded-xl pr-12 text-base"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              <span className="sr-only">Toggle password visibility</span>
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="submit"
          className="group flex h-12 w-full items-center justify-center rounded-xl text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset password"}
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Didn&apos;t receive a code?</span>
          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            disabled={isLoading || isResending}
            className="px-0 text-sm font-semibold"
          >
            {isResending ? "Resending..." : "Resend code"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
