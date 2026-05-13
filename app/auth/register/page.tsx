"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Sparkles, Building, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthLayout } from "../_components/AuthLayout";
import { RegisterAside } from "../_components/AuthSidePanels";
import { ContinueDivider } from "../_components/ContinueDivider";
import { SOCIAL_PROVIDERS } from "../_components/social-providers";

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

  // Organization fields
  const [accountType, setAccountType] = useState<"individual" | "organization">("individual");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<"ngo" | "charity">("ngo");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");

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

    // Validate organization fields
    if (accountType === "organization" && !orgName) {
      const message = "Organization name is required.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    try {
      const requestBody: Record<string, unknown> = {
        name,
        email: email || undefined,
        phone: phone || undefined,
        password,
        accountType,
      };

      // Add organization data if registering as organization
      if (accountType === "organization") {
        requestBody.organization = {
          name: orgName,
          type: orgType,
          description: orgDescription || undefined,
          website: orgWebsite || undefined,
        };
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
        callbackUrl: "/dashboard",
        identifier,
        password,
      });

      if (result?.error) {
        toast.error("Auto sign-in failed. Please log in manually.");
        router.push("/auth/signin");
        return;
      }

      router.push(result?.url ?? "/dashboard");
    } catch (submitError) {
      console.error(submitError);
      const message = "Registration failed. Please try again.";
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
      title="Create your account"
      subtitle="Join ib4me to support causes that matter."
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
        {/* Account Type Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Account Type</Label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setAccountType("individual")}
              className={`flex items-center justify-center gap-1.5 rounded-xl border-2 p-3 sm:gap-2 sm:p-4 transition-all ${
                accountType === "individual"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <User className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="text-sm font-medium sm:text-base">Individual</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("organization")}
              className={`flex items-center justify-center gap-1.5 rounded-xl border-2 p-3 sm:gap-2 sm:p-4 transition-all ${
                accountType === "organization"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Building className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="text-sm font-medium sm:text-base">Organization</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold text-foreground">
            {accountType === "organization" ? "Contact Person Name" : "Full Name"}
          </Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder={accountType === "organization" ? "Contact person name" : "John Doe"}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-12 rounded-xl text-base"
          />
        </div>

        {/* Organization Fields */}
        {accountType === "organization" && (
          <div className="space-y-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Building className="h-4 w-4" />
              Organization Details
            </h3>

            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-sm font-semibold text-foreground">
                Organization Name *
              </Label>
              <Input
                id="orgName"
                placeholder="Your NGO/Charity name"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                required
                className="h-12 rounded-xl text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgType" className="text-sm font-semibold text-foreground">
                Organization Type *
              </Label>
              <Select value={orgType} onValueChange={(value: "ngo" | "charity") => setOrgType(value)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ngo">NGO (Non-Governmental Organization)</SelectItem>
                  <SelectItem value="charity">Charity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgDescription" className="text-sm font-semibold text-foreground">
                Description (optional)
              </Label>
              <Textarea
                id="orgDescription"
                placeholder="Brief description of your organization"
                value={orgDescription}
                onChange={(event) => setOrgDescription(event.target.value)}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgWebsite" className="text-sm font-semibold text-foreground">
                Website (optional)
              </Label>
              <Input
                id="orgWebsite"
                type="url"
                placeholder="https://yourorganization.org"
                value={orgWebsite}
                onChange={(event) => setOrgWebsite(event.target.value)}
                className="h-12 rounded-xl text-base"
              />
            </div>
          </div>
        )}

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
