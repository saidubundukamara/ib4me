"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      redirect: true,
      callbackUrl: "/",
      identifier,
      password,
    });
    if (res?.error) setError(res.error);
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-1">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-neutral-700">Login to your Ib4me account</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="border px-3 py-2 w-full rounded-md" onClick={() => signIn("google", { callbackUrl: "/" })}>
                Continue with Google
              </button>
              <button className="border px-3 py-2 w-full rounded-md" onClick={() => signIn("facebook", { callbackUrl: "/" })}>
                Continue with Facebook
              </button>
            </div>

            <div className="relative my-6 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t">
              <span className="relative mx-auto bg-white px-2 text-neutral-500">Or continue with</span>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="identifier" className="text-sm">Email or phone</label>
                <input
                  id="identifier"
                  className="border w-full px-3 py-2 rounded-md"
                  placeholder="m@example.com or +232..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm">Password</label>
                <input
                  id="password"
                  className="border w-full px-3 py-2 rounded-md"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button className="w-full rounded-md bg-gray-900 text-white px-4 py-2" type="submit">Sign in</button>
            </form>

            <p className="mt-4 text-center text-sm">
              Don’t have an account? <a href="/auth/register" className="underline">Sign up</a>
            </p>
          </div>
          <div className="relative hidden md:block">
            <img src="/assets/donate_illustration.jpg" alt="Illustration" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-neutral-600">
        By clicking continue, you agree to our <a className="underline" href="#">Terms of Service</a> and <a className="underline" href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}

