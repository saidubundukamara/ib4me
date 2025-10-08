"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Card } from "../_components/Card";
import { Smartphone, CreditCard } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  onSuccess?: () => void;
}

export function WithdrawalForm({ campaignOptions, onSuccess }: WithdrawalFormProps) {
  const [payoutType, setPayoutType] = useState<"mobile_money" | "bank">("mobile_money");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      const response = await fetch("/api/payouts", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Payout request submitted successfully!", {
          description: "Your withdrawal is being processed and will be sent to your selected destination."
        });
        // Reset form
        formRef.current?.reset();
        setPayoutType("mobile_money");
        // Call success callback to refresh data
        onSuccess?.();
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
    <div className="space-y-6 font-Sora">
      {/* Withdrawal Form */}
      <Card className="p-6 border-border bg-card">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-foreground">Request Withdrawal</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Withdraw funds from your campaign to your preferred payment method
          </p>
        </div>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="campaign" className="text-sm">Select Campaign</Label>
            <Select name="campaignId" required disabled={isSubmitting}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Choose a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaignOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title} • Available {formatCurrency(c.availableMinor, c.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payoutType">Payout Method</Label>
            <Select
              required
              disabled={isSubmitting}
              value={payoutType}
              onValueChange={(value) => setPayoutType(value as "mobile_money" | "bank")}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile Money
                  </div>
                </SelectItem>
                <SelectItem value="bank">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="payoutType" value={payoutType} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input name="amount" required disabled={isSubmitting} type="number" step="0.01" min="0.01" className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5 disabled:opacity-50" placeholder="200" />
          </div>

          {/* Mobile Money Fields */}
          {payoutType === "mobile_money" && (
            <div className="space-y-2">
              <Label htmlFor="msisdn">Mobile Number</Label>
              <Input
                name="msisdn"
                required
                disabled={isSubmitting}
                type="tel"
                inputMode="tel"
                pattern="^\d{7,15}$"
                placeholder="Enter digits only (e.g., 76123456)"
              />
              <p className="text-xs text-muted-foreground">Enter phone number without country code</p>
            </div>
          )}

          {/* Bank Transfer Fields */}
          {payoutType === "bank" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <Select disabled={isSubmitting}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slb001">Sierra Leone Commercial Bank</SelectItem>
                    <SelectItem value="ecobank">Ecobank Sierra Leone</SelectItem>
                    <SelectItem value="gtb">Guaranty Trust Bank</SelectItem>
                    <SelectItem value="rokel">Rokel Commercial Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Account number"
                    disabled={isSubmitting}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    type="text"
                    placeholder="Account holder name"
                    disabled={isSubmitting}
                    required
                    className="bg-background"
                  />
                </div>
              </div>
            </div>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Request Payout"}
          </Button>
        </form>
      </Card>
    </div >

  );
}