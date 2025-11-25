import Image from "next/image";
import Link from "next/link";

import { KeyRound, ShieldCheck, Sparkles } from "lucide-react";

import logo from "@/public/assets/ib4melogo.png";

export function RegisterAside() {
  return (
    <>
      <div>
        <Link href="/" className="inline-block">
          <Image
            src={logo}
            alt="ib4me"
            className="h-16 w-auto rounded-lg border border-white/10 bg-white p-2 shadow-lg backdrop-blur"
            priority
          />
        </Link>
        <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight">
          Join the ib4me community
        </h1>
        <p className="mt-4 max-w-sm text-base text-primary-foreground/70">
          Create an account to support medical emergencies, track your impact, and connect with a caring community.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
          <Sparkles className="h-6 w-6 shrink-0 text-blaze-orange" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
              Your generosity matters
            </p>
            <p className="text-sm text-primary-foreground/60">
              Every contribution goes directly to urgent medical needs in Sierra Leone.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function SignInAside() {
  return (
    <>
      <div>
        <Link href="/" className="inline-block">
          <Image
            src={logo}
            alt="ib4me"
            className="h-16 w-auto rounded-lg border border-white/10 bg-white p-2 shadow-lg backdrop-blur"
            priority
          />
        </Link>
        <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight">
          Welcome back to ib4me
        </h1>
        <p className="mt-4 max-w-sm text-base text-primary-foreground/70">
          Pick up where you left off, stay updated on campaigns you care about, and continue making an impact.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
          <Sparkles className="h-6 w-6 shrink-0 text-blaze-orange" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
              Community-driven care
            </p>
            <p className="text-sm text-primary-foreground/60">
              Stay connected with campaigns and receive updates from the people you support.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function ForgotPasswordAside() {
  return (
    <>
      <div>
        <Link href="/" className="inline-block">
          <Image
            src={logo}
            alt="ib4me"
            className="h-16 w-auto rounded-lg border border-white/10 bg-white p-2 shadow-lg backdrop-blur"
            priority
          />
        </Link>
        <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight">
          We are here to help
        </h1>
        <p className="mt-4 max-w-sm text-base text-primary-foreground/70">
          Enter the email address or phone number linked to your account and we will send a six digit code to reset your password.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
          <KeyRound className="h-6 w-6 shrink-0 text-blaze-orange" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
              Secure access
            </p>
            <p className="text-sm text-primary-foreground/60">
              Your reset code expires in ten minutes to keep your account safe.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function ResetPasswordAside() {
  return (
    <>
      <div>
        <Link href="/" className="inline-block">
          <Image
            src={logo}
            alt="ib4me"
            className="h-16 w-auto rounded-lg border border-white/10 bg-white p-2 shadow-lg backdrop-blur"
            priority
          />
        </Link>
        <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight">
          Finish resetting your password
        </h1>
        <p className="mt-4 max-w-sm text-base text-primary-foreground/70">
          Enter the six digit code we sent you along with a new password to get back to supporting medical campaigns.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
          <ShieldCheck className="h-6 w-6 shrink-0 text-blaze-orange" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
              Protecting your account
            </p>
            <p className="text-sm text-primary-foreground/60">
              Choose a strong password that you have not used on other services.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
