"use client";

import { useMemo, useState } from "react";

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

  const [payTab, setPayTab] = useState<"card" | "mobile" | "paypal">("card");

  // Card inputs
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Donor details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  const amount = useMemo(() => {
    if (selectedPreset === "custom") {
      const n = Number.parseFloat(customAmount || "0");
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    return selectedPreset;
  }, [selectedPreset, customAmount]);

  const donateLabel = `Donate ${formatAmount(amount, currency)}`;

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

          {/* Payment Method Tabs */}
          <div className="rounded-lg border p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">Payment Method</div>
                <div className="text-xs text-gray-600">Select your preferred payment method</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm ${payTab === "card" ? "bg-white" : "bg-neutral-50"}`}
                  onClick={() => setPayTab("card")}
                >
                  Credit Card
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm ${payTab === "mobile" ? "bg-white" : "bg-neutral-50"}`}
                  onClick={() => setPayTab("mobile")}
                >
                  Mobile Money
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm ${payTab === "paypal" ? "bg-white" : "bg-neutral-50"}`}
                  onClick={() => setPayTab("paypal")}
                >
                  PayPal
                </button>
              </div>

              {payTab === "card" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs text-gray-700">Name on Card</label>
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="Name on Card"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-700">Card Number</label>
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="Card Number"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-700">Expiry Date</label>
                      <input
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-700">CVC</label>
                      <input
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="CVC"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-block h-4 w-4 rounded-full bg-neutral-200" />
                    Your payment information is encrypted and secure.
                  </div>
                </div>
              )}

              {payTab === "mobile" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs text-gray-700">Mobile Number</label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="e.g. +232 7x xxx xxx"
                      inputMode="tel"
                    />
                  </div>
                  <div className="text-xs text-gray-600">We’ll redirect you to your provider to approve the payment.</div>
                </div>
              )}

              {payTab === "paypal" && (
                <div className="mt-4 text-sm text-gray-700">You will be redirected to PayPal to complete your donation.</div>
              )}
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

          {/* CTA */}
          <div className="flex items-center justify-between gap-4">
            <button type="button" className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800">
              {donateLabel}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="inline-block h-4 w-4 rounded-full bg-neutral-200" />
              Secure donation processed by Ib4me
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <aside>
        <div className="rounded-lg border p-4 md:p-6">
          <div className="text-sm font-medium">Donation Summary</div>
          <div className="mt-4 flex items-center gap-3">
            <img src={imageUrl} alt={title} className="h-16 w-16 rounded object-cover" />
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


