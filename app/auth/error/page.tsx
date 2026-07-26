"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const errorMessages: Record<string, { title: string; description: string; complex?: boolean }> = {
  Configuration: { title: "Configuration error", description: "The authentication system is misconfigured. Please contact support.", complex: true },
  AccessDenied: { title: "Access denied", description: "You do not have permission to access this page." },
  Verification: { title: "Verification failed", description: "The verification link has expired or is invalid. Please request a new one." },
  OAuthSignin: { title: "Sign-in failed", description: "Could not initiate the sign-in process. Please try again." },
  OAuthCallback: { title: "Sign-in error", description: "There was a problem completing sign-in. Please try again." },
  OAuthAccountNotLinked: { title: "Account not linked", description: "This account is not linked to this login method." },
  EmailCreateAccount: { title: "Email error", description: "Could not send the sign-in email. Please try again or use a different method." },
  CredentialsSignin: { title: "Invalid credentials", description: "The email/phone or password you entered is incorrect." },
  SessionRequired: { title: "Sign in required", description: "Please sign in to access this page." },
};

function AuthError() {
  const params = useSearchParams();
  const code = params.get("error") ?? "";
  const info = errorMessages[code] ?? {
    title: "Authentication error",
    description: "An unexpected error occurred during authentication.",
    complex: true,
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="pb-3">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{info.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{info.description}</p>
          {info.complex && (
            <p className="text-xs text-muted-foreground">
              If this keeps happening,{" "}
              <a href="mailto:support@ib4me.com" className="font-medium text-primary hover:underline">
                contact support
              </a>
              {" "}and include the error code below.
            </p>
          )}
          {code && (
            <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              Error code: {code}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button asChild>
            <Link href="/auth/signin">Back to sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AuthError />
    </Suspense>
  );
}
