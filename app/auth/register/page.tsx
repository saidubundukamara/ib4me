"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined, password }),
    });
    if (res.ok) {
      router.push("/auth/signin");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Registration failed");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-1">
              <h1 className="text-2xl font-bold">Ib4me</h1>
              <p className="text-neutral-700">Create an account</p>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm">Full name</label>
                <input id="name" className="border w-full px-3 py-2 rounded-md" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm">Email (optional)</label>
                <input id="email" className="border w-full px-3 py-2 rounded-md" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm">Phone (optional)</label>
                <input id="phone" className="border w-full px-3 py-2 rounded-md" placeholder="+232..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm">Password</label>
                <input id="password" className="border w-full px-3 py-2 rounded-md" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button className="w-full rounded-md bg-gray-900 text-white px-4 py-2" type="submit">Register</button>
            </form>
            <p className="mt-4 text-center text-sm">
              Already have an account? <a href="/auth/signin" className="underline">Sign in</a>
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

