"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
// import { useRouter } from "next/navigation"; // Future use

export type DonateClientProps = {
  slug: string;
  currency: string;
  title: string;
  organizerName?: string | null;
  progressPercent: number; // 0-100
  amountRaised: number; // major units
  goalAmount: number; // major units
  imageUrl: string;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DonateClient(props: DonateClientProps) {
  const { slug, currency, title, organizerName, progressPercent, amountRaised, goalAmount, imageUrl } = props;

  const presetAmounts = [25, 50, 100];
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Removed payment method selection since Monime handles this

  // Donor details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const router = useRouter(); // Future use for programmatic navigation

  const amount = useMemo(() => {
    if (selectedPreset === "custom") {
      const n = Number.parseFloat(customAmount || "0");
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    return selectedPreset;
  }, [selectedPreset, customAmount]);

  const donateLabel = `Donate ${formatAmount(amount, currency)}`;

  const handleDonateSubmit = async () => {
    // Clear any previous errors
    setError(null);
    
    // Basic validation
    if (amount <= 0) {
      setError("Please enter a valid donation amount");
      return;
    }

    if (!anonymous && (!firstName.trim() || !email.trim())) {
      setError("Please provide your name and email address");
      return;
    }

    if (email && !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare donation data
      const donationData = {
        campaignSlug: slug,
        amount,
        currency,
        donor: anonymous ? undefined : {
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: email.trim(),
        },
        isAnonymous: anonymous,
        message: message.trim() || undefined,
        // Payment methods handled by Monime checkout page
      };

      // Create donation and get checkout URL
      const response = await fetch("/api/donations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(donationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create donation");
      }

      // Redirect to Monime checkout
      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Donation creation error:", error);
      setError(error instanceof Error ? error.message : "Failed to process donation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = amount > 0 && (anonymous || (firstName.trim() && email.trim()));

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="lg:col-span-2">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold">Make a Donation</h1>
            <p className="text-gray-600 mt-1">Your contribution will help {title}</p>
          </div>

          {/* Donation Amount */}
          <div className="rounded-lg border p-4 md:p-6">
            <div className="text-sm font-medium">Donation Amount</div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`rounded-md border px-4 py-2 text-sm ${selectedPreset === amt ? "border-gray-900" : "border-neutral-300"}`}
                  onClick={() => setSelectedPreset(amt)}
                >
                  {formatAmount(amt, currency)}
                </button>
              ))}
              <button
                type="button"
                className={`rounded-md border px-4 py-2 text-sm ${selectedPreset === "custom" ? "border-gray-900" : "border-neutral-300"}`}
                onClick={() => setSelectedPreset("custom")}
              >
                Custom
              </button>
            </div>
            {selectedPreset === "custom" && (
              <div className="mt-3 max-w-xs">
                <label className="text-xs text-gray-700">Enter amount</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="rounded-lg border p-4 md:p-6">
            <div className="text-sm font-medium">Payment</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-6 w-6 bg-blue-100 rounded text-blue-600 text-xs flex items-center justify-center font-medium">📱</span>
                  Mobile Money
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-6 w-6 bg-green-100 rounded text-green-600 text-xs flex items-center justify-center font-medium">💳</span>
                  Credit/Debit Cards
                </div>
              </div>
              <div className="text-xs text-gray-600">
                You&apos;ll choose your preferred payment method on the secure checkout page.
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="inline-block h-4 w-4 rounded-full bg-green-200" />
                Secured by Monime - Your payment information is encrypted and secure
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="rounded-lg border p-4 md:p-6">
            <div className="text-sm font-medium">Personal Details</div>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-700">First Name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900" placeholder="First Name" />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Last Name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900" placeholder="Last Name" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-700">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900" placeholder="Email" inputMode="email" />
                <p className="text-xs text-gray-600 mt-1">Your receipt will be sent to this email address.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4" />
                Make this donation anonymous
              </label>
            </div>
          </div>

          {/* Message */}
          <div className="rounded-lg border p-4 md:p-6">
            <div className="text-sm font-medium">Leave a Message (Optional)</div>
            <div className="mt-4">
              <label className="text-xs text-gray-700">Your Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900" rows={4} placeholder="Write a kind note..." />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <span className="inline-block h-4 w-4 rounded-full bg-red-300" />
                {error}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between gap-4">
            <button 
              type="button" 
              onClick={handleDonateSubmit}
              disabled={isSubmitting || !isFormValid}
              className={`inline-flex items-center rounded-md px-4 py-2 text-white transition-colors ${
                isSubmitting || !isFormValid
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                donateLabel
              )}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="inline-block h-4 w-4 rounded-full bg-green-200" />
              Secure donation processed by Monime
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <aside>
        <div className="rounded-lg border p-4 md:p-6">
          <div className="text-sm font-medium">Donation Summary</div>
          <div className="mt-4 flex items-center gap-3">
            <Image src={imageUrl} alt={title} width={64} height={64} className="h-16 w-16 rounded object-cover" />
            <div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-xs text-gray-600">{organizerName ? `by ${organizerName}` : ""}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-600">Campaign Progress</div>
              <div className="font-medium">{progressPercent}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">{formatAmount(amountRaised, currency)}</div>
              <div className="text-xs text-gray-600">of {formatAmount(goalAmount, currency)}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-gray-600">Your Donation</div>
              <div className="font-medium">{formatAmount(amount, currency)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-600">Processing Fee</div>
              <div className="font-medium">{formatAmount(0, currency)}</div>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <div className="font-medium">Total</div>
              <div className="font-semibold">{formatAmount(amount, currency)}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-xs text-green-800">
            <span className="inline-block h-4 w-4 rounded-full bg-green-300" />
            100% of your donation goes directly to the campaign.
          </div>
        </div>
      </aside>
    </div>
  );
}


