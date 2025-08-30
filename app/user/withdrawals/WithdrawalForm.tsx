"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

interface CampaignOption {
  id: string;
  title: string;
  currency: string;
  availableMinor: number;
}

function formatCurrency(minor: number, currency: string): string {
  const value = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

interface WithdrawalFormProps {
  campaignOptions: CampaignOption[];
  requestPayout: (formData: FormData) => Promise<{success: boolean, error?: string}>;
}

export function WithdrawalForm({ campaignOptions, requestPayout }: WithdrawalFormProps) {
  const [payoutType, setPayoutType] = useState<"mobile_money" | "bank">("mobile_money");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await requestPayout(formData);
      
      if (result.success) {
        toast.success("Payout request submitted successfully!", {
          description: "Your withdrawal is being processed and will be sent to your selected destination."
        });
        // Reset form
        formRef.current?.reset();
        setPayoutType("mobile_money");
      } else {
        toast.error(result.error || "Failed to submit payout request", {
          description: "Please check your information and try again."
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again or contact support if the issue persists."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      ref={formRef}
      action={handleSubmit} 
      className={`space-y-4 rounded-2xl border p-4 bg-white/80 dark:bg-white/5 ${isSubmitting ? 'opacity-75 pointer-events-none' : ''}`}
    >
      <div>
        <label className="text-sm">Select Campaign</label>
        <select name="campaignId" required disabled={isSubmitting} className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5 disabled:opacity-50">
          {campaignOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} • Available {formatCurrency(c.availableMinor, c.currency)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm">Payout Method</label>
        <select 
          name="payoutType" 
          required 
          disabled={isSubmitting}
          className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5 disabled:opacity-50" 
          value={payoutType}
          onChange={(e) => setPayoutType(e.target.value as "mobile_money" | "bank")}
        >
          <option value="mobile_money">Mobile Money</option>
          <option value="bank">Bank Transfer</option>
        </select>
      </div>

      <div>
        <label className="text-sm">Amount</label>
        <input name="amount" required disabled={isSubmitting} type="number" step="0.01" min="0.01" className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5 disabled:opacity-50" placeholder="200"/>
      </div>

      {/* Mobile Money Fields */}
      {payoutType === "mobile_money" && (
        <div>
          <label className="text-sm">Mobile Number</label>
          <input 
            name="msisdn" 
            required 
            disabled={isSubmitting}
            type="tel" 
            inputMode="tel" 
            pattern="^\d{7,15}$" 
            className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5 disabled:opacity-50" 
            placeholder="Enter digits only (e.g., 76123456)"
          />
        </div>
      )}

      {/* Bank Transfer Fields */}
      {payoutType === "bank" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm">Bank</label>
            <select name="providerId" required disabled={isSubmitting} className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5 disabled:opacity-50">
              <option value="">Select a bank</option>
              <option value="slb001">Sierra Leone Commercial Bank</option>
              <option value="ecobank">Ecobank Sierra Leone</option>
              <option value="gtb">Guaranty Trust Bank</option>
              <option value="rokel">Rokel Commercial Bank</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Account Number</label>
              <input name="accountNumber" required disabled={isSubmitting} type="text" className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5 disabled:opacity-50" placeholder="Account number"/>
            </div>
            <div>
              <label className="text-sm">Account Name</label>
              <input name="accountName" required disabled={isSubmitting} type="text" className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5 disabled:opacity-50" placeholder="Account holder name"/>
            </div>
          </div>
        </div>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm shadow hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Processing..." : "Request Payout"}
      </button>
    </form>
  );
}