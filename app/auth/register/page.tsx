"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "../_components/AuthLayout";
import { RegisterAside } from "../_components/AuthSidePanels";
import { ContinueDivider } from "../_components/ContinueDivider";
import { SOCIAL_PROVIDERS, type SocialProvider } from "../_components/social-providers";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      toast.error("Please accept the terms to continue.");
      return;
    }

    if (!email && !phone) {
      const message = "Please provide an email or phone number.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Registration failed.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Registration successful! Signing you in…");
      const identifier = email || phone;
      const result = await signIn("credentials", {
        redirect: false,
        callbackUrl: "/",
        identifier,
        password,
      });

      if (result?.error) {
        toast.error("Auto sign-in failed. Please log in manually.");
        router.push("/auth/signin");
        return;
      }

      router.push(result?.url ?? "/");
    } catch (submitError) {
      console.error(submitError);
      const message = "Registration failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider["id"]) => {
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch (submitError) {
      console.error(submitError);
      toast.error("Social login failed. Please try again.");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join ib4me to support urgent medical needs."
      highlight={
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-blaze-orange md:justify-start">
          Start making a difference today
          <Sparkles className="h-4 w-4 text-accent" />
        </p>
      }
      lead={
        <div className="space-y-4 sm:space-y-5">
          <div className="grid w-full gap-3 sm:grid-cols-3">
            {SOCIAL_PROVIDERS.map(({ id, icon: Icon, hover, iconColor }) => (
              <Button
                key={id}
                type="button"
                variant="outline"
                className={`h-12 border-border/50 transition-all ${hover}`}
                onClick={() => handleSocialLogin(id)}
                disabled={isLoading}
              >
                <Icon className={`h-5 w-5 ${iconColor ?? ""}`} />
              </Button>
            ))}
          </div>

          <ContinueDivider label="Or continue with email" />
        </div>
      }
      aside={<RegisterAside />}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold text-foreground">
            Full Name
          </Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="John Doe"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-12 rounded-xl text-base"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email 
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+232 00 000 000"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-12 rounded-xl pr-12 text-base"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              <span className="sr-only">Toggle password visibility</span>
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/60 p-3">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))}
            className="mt-1"
          />
          <Label htmlFor="terms" className="text-sm text-blaze-orange">
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-primary hover:underline">
              terms &amp; conditions
            </Link>{" "}
            and confirm that my information is accurate.
          </Label>
        </div>

        <Button
          type="submit"
          className="group flex h-12 w-full items-center justify-center rounded-xl text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
          disabled={isLoading}
        >
          {isLoading ? "Please wait…" : "Create Account"}
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </AuthLayout>
  );
}
