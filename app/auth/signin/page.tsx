"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "../_components/AuthLayout";
import { ContinueDivider } from "../_components/ContinueDivider";
import { SignInAside } from "../_components/AuthSidePanels";
import { SOCIAL_PROVIDERS } from "../_components/social-providers";

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await signIn("credentials", {
        redirect: false,
        callbackUrl: "/dashboard",
        identifier,
        password,
      });

      if (response?.error) {
        const message = response.error === "CredentialsSignin" ? "Invalid credentials" : response.error;
        setError(message);
        toast.error(message);
        return;
      }

      if (response?.ok) {
        toast.success("Signed in successfully!");
        router.push("/dashboard");
      }
    } catch (submitError) {
      console.error(submitError);
      const message = "Unable to sign in. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = () => {
    toast.info("Coming soon! Social login will be available shortly.");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to keep supporting lifesaving campaigns."
      highlight={
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-blaze-orange md:justify-start">
          We&apos;re glad you&apos;re here
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
                onClick={handleSocialLogin}
                disabled={isLoading}
              >
                <Icon className={`h-5 w-5 ${iconColor ?? ""}`} />
              </Button>
            ))}
          </div>

          <ContinueDivider label="Or continue with email" />
        </div>
      }
      aside={<SignInAside />}
      footer={
        <>
          Don&#39;t have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-sm font-semibold text-foreground">
            Email or phone
          </Label>
          <Input
            id="identifier"
            placeholder="m@example.com or +232..."
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
            className="h-12 rounded-xl text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
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
        <Link href="/auth/forgot-password" className="text-sm font-medium  text-primary hover:underline">
          Forget password?
        </Link>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="submit"
          className="group flex h-12 w-full items-center justify-center rounded-xl mt-2 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
