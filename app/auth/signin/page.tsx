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
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign In</h1>
      <div className="space-y-3">
        <button className="border px-3 py-2 w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
          Continue with Google
        </button>
        <button className="border px-3 py-2 w-full" onClick={() => signIn("facebook", { callbackUrl: "/" })}>
          Continue with Facebook
        </button>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="border w-full px-3 py-2"
          placeholder="Email or phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          className="border w-full px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="bg-black text-white px-4 py-2" type="submit">Sign in</button>
      </form>
    </div>
  );
}

