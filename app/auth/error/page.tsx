"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const errorMessages: Record<string, string> = {
  Configuration: "Authentication configuration error.",
  AccessDenied: "Access denied.",
  Verification: "Verification failed or link expired.",
  OAuthSignin: "OAuth sign in failed.",
  OAuthCallback: "OAuth callback failed.",
  OAuthAccountNotLinked: "Account is not linked to this provider.",
  EmailCreateAccount: "Could not send sign-in email.",
  CredentialsSignin: "Invalid credentials.",
  SessionRequired: "Please sign in to continue.",
};

export default function AuthErrorPage() {
  const params = useSearchParams();
  const code = params.get("error") ?? "";
  const message = errorMessages[code] || "An error occurred during authentication.";
  return (
    <div className="container mx-auto max-w-xl p-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-bold mb-2">Authentication error</h1>
        <p className="text-sm text-neutral-700 mb-4">{message}</p>
        {code ? <p className="text-xs text-neutral-500 mb-6">Code: {code}</p> : null}
        <div className="flex gap-3">
          <Link href="/auth/signin" className="rounded-md bg-gray-900 px-4 py-2 text-white">
            Back to sign in
          </Link>
          <Link href="/" className="rounded-md border px-4 py-2">Go home</Link>
        </div>
      </div>
    </div>
  );
}


