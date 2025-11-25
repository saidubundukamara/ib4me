"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Smartphone, CreditCard } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  isLoading?: boolean;
}

export function WithdrawalForm({
  campaignOptions,
  onSuccess,
  isLoading = false,
}: WithdrawalFormProps) {
  const [payoutType, setPayoutType] = useState<"mobile_money" | "bank">(
    "mobile_money",
  );
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>(
    undefined,
  );
  const [selectedBank, setSelectedBank] = useState<string | undefined>(
    undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const hasCampaigns = campaignOptions.length > 0;
  const campaignSelectPlaceholder = hasCampaigns
    ? "Choose a campaign"
    : "No campaigns available";
  const isSubmitDisabled =
    isSubmitting ||
    isLoading ||
    !hasCampaigns ||
    !selectedCampaign ||
    selectedCampaign === "__none";

  useEffect(() => {
    if (!hasCampaigns) {
      setSelectedCampaign(undefined);
      return;
    }
    if (
      selectedCampaign &&
      !campaignOptions.some((option) => option.id === selectedCampaign)
    ) {
      setSelectedCampaign(undefined);
    }
  }, [hasCampaigns, campaignOptions, selectedCampaign]);

  const campaignOptionsContent = useMemo(() => {
    if (!hasCampaigns) {
      return (
        <SelectItem value="__none" disabled>
          No campaigns available
        </SelectItem>
      );
    }
    return campaignOptions.map((c) => (
      <SelectItem key={c.id} value={c.id}>
        <div className="flex max-w-xs flex-col text-left">
          <span className="font-medium truncate">{c.title}</span>
          <span className="text-xs text-muted-foreground">
            Available {formatCurrency(c.availableMinor, c.currency)}
          </span>
        </div>
      </SelectItem>
    ));
  }, [campaignOptions, hasCampaigns]);

  const selectedCampaignOption = useMemo(
    () => campaignOptions.find((c) => c.id === selectedCampaign),
    [campaignOptions, selectedCampaign],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

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
          description:
            "Your withdrawal is being processed and will be sent to your selected destination.",
        });
        formRef.current?.reset();
        setPayoutType("mobile_money");
        setSelectedCampaign(undefined);
        setSelectedBank(undefined);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to submit payout request", {
          description: "Please check your information and try again.",
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred", {
        description:
          "Please try again or contact support if the issue persists.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-Sora">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Request Withdrawal</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Withdraw funds from your campaign to your preferred payout method.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl sm:col-span-2" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2 sm:col-span-2">
            <Label htmlFor="campaignId" className="text-sm">
              Select Campaign
            </Label>
          <Select
            required
            disabled={!hasCampaigns || isSubmitting}
            value={selectedCampaign}
            onValueChange={setSelectedCampaign}
          >
            <SelectTrigger className="flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 py-3 text-left hover:bg-background focus-visible:ring-2">
              <SelectValue placeholder={campaignSelectPlaceholder} className="sr-only" />
              <div className="flex min-w-0 flex-col text-left">
                <span className="font-medium truncate">
                  {selectedCampaignOption?.title ?? campaignSelectPlaceholder}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedCampaignOption
                    ? `Available ${formatCurrency(
                        selectedCampaignOption.availableMinor,
                        selectedCampaignOption.currency,
                      )}`
                    : "Select a campaign to view available balance"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>{campaignOptionsContent}</SelectContent>
          </Select>
          <input
            type="hidden"
            name="campaignId"
            value={selectedCampaign && selectedCampaign !== "__none" ? selectedCampaign : ""}
          />
        </div>

        <div className="space-y-2 min-w-0">
          <Label htmlFor="amount">Amount</Label>
          <Input
            name="amount"
            required
            disabled={isSubmitDisabled}
            type="number"
            step="0.01"
            min="0.01"
            className="rounded-xl border bg-white/70 px-3 py-2 dark:bg-white/5 disabled:opacity-50"
            placeholder="200"
          />
        </div>

        <div className="space-y-2 min-w-0">
          <Label htmlFor="payoutType">Payout Method</Label>
          <Select
            required
            disabled={isSubmitting}
            value={payoutType}
            onValueChange={(value) =>
              setPayoutType(value as "mobile_money" | "bank")
            }
          >
            <SelectTrigger className="w-full bg-background justify-between text-left">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile_money">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Money
                </div>
              </SelectItem>
              <SelectItem value="bank">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Transfer
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="payoutType" value={payoutType} />
        </div>
      </div>

      {payoutType === "mobile_money" && (
        <div className="space-y-2 min-w-0">
          <Label htmlFor="msisdn">Mobile Number</Label>
          <Input
            name="msisdn"
            required
            disabled={isSubmitting}
            type="tel"
            inputMode="tel"
            pattern="^\d{7,15}$"
            placeholder="Enter digits only (e.g., 76123456)"
            className="rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            Enter phone number without country code.
          </p>
        </div>
      )}

      {payoutType === "bank" && (
        <div className="space-y-4">
          <div className="space-y-2 min-w-0">
            <Label htmlFor="bank">Bank</Label>
            <Select
              disabled={isSubmitting}
              value={selectedBank}
              onValueChange={setSelectedBank}
            >
              <SelectTrigger className="w-full bg-background justify-between text-left">
                <SelectValue placeholder="Select a bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slb001">
                  Sierra Leone Commercial Bank
                </SelectItem>
                <SelectItem value="ecobank">Ecobank Sierra Leone</SelectItem>
                <SelectItem value="gtb">Guaranty Trust Bank</SelectItem>
                <SelectItem value="rokel">Rokel Commercial Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                type="text"
                placeholder="Account number"
                disabled={isSubmitting}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                name="accountName"
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
          disabled={isSubmitDisabled}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Processing..." : "Request Payout"}
        </Button>
        <input type="hidden" name="bank" value={selectedBank ?? ""} />
      </form>
      )}
    </div>
  );
}


