"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Smartphone, CreditCard, Ban } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface WithdrawalBlockStatus {
  blocked: boolean;
  reason?: string;
}

interface WithdrawalFormProps {
  campaignOptions: CampaignOption[];
  onSuccess?: () => void;
  isLoading?: boolean;
  withdrawalBlockStatus?: WithdrawalBlockStatus;
}

// 99% of available balance can be withdrawn (1% buffer reserved)
const WITHDRAWAL_BUFFER_PERCENT = 0.99;

export function WithdrawalForm({
  campaignOptions,
  onSuccess,
  isLoading = false,
  withdrawalBlockStatus,
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
  const [amount, setAmount] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  const hasCampaigns = campaignOptions.length > 0;
  const campaignSelectPlaceholder = hasCampaigns
    ? "Choose a campaign"
    : "No campaigns available";
  const isWithdrawalsBlocked = withdrawalBlockStatus?.blocked ?? false;

  // Calculate max withdrawable amount with buffer
  const selectedCampaignOption = useMemo(
    () => campaignOptions.find((c) => c.id === selectedCampaign),
    [campaignOptions, selectedCampaign],
  );
  const availableMinor = selectedCampaignOption?.availableMinor ?? 0;
  const maxWithdrawableMinor = Math.floor(availableMinor * WITHDRAWAL_BUFFER_PERCENT);
  const maxWithdrawable = maxWithdrawableMinor / 100; // Convert to major units

  // Amount validation
  const amountValue = parseFloat(amount) || 0;
  const isAmountExceeded = amountValue > maxWithdrawable && maxWithdrawable > 0;
  const isAmountValid = amountValue > 0 && !isAmountExceeded;

  const hasNoFundsAvailable = !!(selectedCampaign && selectedCampaign !== "__none" && maxWithdrawable <= 0);

  const isSubmitDisabled =
    isSubmitting ||
    isLoading ||
    !hasCampaigns ||
    !selectedCampaign ||
    selectedCampaign === "__none" ||
    isWithdrawalsBlocked ||
    !isAmountValid ||
    hasNoFundsAvailable;

  useEffect(() => {
    if (!hasCampaigns) {
      setSelectedCampaign(undefined);
      setAmount("");
      return;
    }
    if (
      selectedCampaign &&
      !campaignOptions.some((option) => option.id === selectedCampaign)
    ) {
      setSelectedCampaign(undefined);
      setAmount("");
    }
  }, [hasCampaigns, campaignOptions, selectedCampaign]);

  // Reset amount when campaign selection changes
  useEffect(() => {
    setAmount("");
  }, [selectedCampaign]);

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
        setAmount("");
        onSuccess?.();
      } else {
        const errorMessage = result.error || "Failed to submit payout request";
        const description = errorMessage.includes("Insufficient funds")
          ? `Available balance: ${formatCurrency(maxWithdrawableMinor, selectedCampaignOption?.currency ?? "SLE")}`
          : "Please check your information and try again.";

        toast.error(errorMessage, { description });
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

      {isWithdrawalsBlocked && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertTitle>Withdrawals Temporarily Disabled</AlertTitle>
          <AlertDescription>
            {withdrawalBlockStatus?.reason
              ? withdrawalBlockStatus.reason
              : "Withdrawals are currently disabled. Please check back later or contact support for more information."}
          </AlertDescription>
        </Alert>
      )}

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
              <SelectValue placeholder={campaignSelectPlaceholder} />
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
            disabled={!selectedCampaign || isSubmitting || isWithdrawalsBlocked || hasNoFundsAvailable}
            type="number"
            step="0.01"
            min="0.01"
            max={maxWithdrawable > 0 ? maxWithdrawable : undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`rounded-xl border bg-white/70 px-3 py-2 dark:bg-white/5 disabled:opacity-50 ${
              isAmountExceeded ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            placeholder={maxWithdrawable > 0 ? `Max: ${maxWithdrawable.toFixed(2)}` : "200"}
          />
          {isAmountExceeded && selectedCampaignOption && (
            <p className="text-sm text-red-500">
              Maximum withdrawable is {formatCurrency(maxWithdrawableMinor, selectedCampaignOption.currency)} (1% buffer reserved)
            </p>
          )}
          {selectedCampaignOption && !isAmountExceeded && maxWithdrawable > 0 && (
            <p className="text-xs text-muted-foreground">
              Max withdrawable: {formatCurrency(maxWithdrawableMinor, selectedCampaignOption.currency)}
            </p>
          )}
          {hasNoFundsAvailable && selectedCampaignOption && (
            <p className="text-sm text-amber-600">
              This campaign has no funds available for withdrawal yet.
            </p>
          )}
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


