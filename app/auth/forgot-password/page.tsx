"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthLayout } from "../_components/AuthLayout";
import { ForgotPasswordAside } from "../_components/AuthSidePanels";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      const message = "Please enter the email or phone number linked to your account.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmedIdentifier }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Unable to send reset code.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("If the account exists, a reset code is on the way.");
      router.push(`/auth/reset-password?identifier=${encodeURIComponent(trimmedIdentifier)}`);
    } catch (submitError) {
      console.error(submitError);
      const message = "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries, we’ll help you regain access."
      highlight={
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-blaze-orange md:justify-start">
          We&apos;ll send a 6-digit reset code
          <MailCheck className="h-4 w-4 text-accent" />
        </p>
      }
      lead={
        <div className="mb-6 rounded-xl border border-dashed border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
          Enter the email address or phone number you used to sign up. We’ll send you a verification code that expires in ten
          minutes.
        </div>
      }
      aside={<ForgotPasswordAside />}
      footer={
        <>
          Remember your password?{" "}
          <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
            Sign in
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
          />
          <p className="text-xs text-muted-foreground">
            We’ll send the reset code to the contact details on your ib4me account.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="submit"
          className="group flex h-12 w-full items-center justify-center rounded-xl text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
          disabled={isLoading}
        >
          {isLoading ? "Sending code..." : "Send reset code"}
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </AuthLayout>
  );
}
