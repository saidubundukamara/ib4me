"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { formatMinor, toMinor } from "@/lib/currency";
import { computePayoutSplit } from "@/lib/fees";
import { Smartphone, Ban, Loader2, CheckCircle2 } from "lucide-react";
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

/**
 * There is no client-side buffer any more.
 *
 * This used to reserve 1% (`WITHDRAWAL_BUFFER_PERCENT = 0.99`) as a stand-in for Monime's
 * payout fee. It was worse than useless: the server never enforced it, so anyone could
 * bypass it by posting to /api/payouts directly, and it displayed two different
 * "available" numbers on the same screen. Monime takes its fee out of the amount sent, so
 * withdrawing the full balance is legal — and the fee is now quoted explicitly instead of
 * being silently withheld (MONIME-FEE-MODEL.md §8.7).
 */

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  // Mobile-money KYC (holder-name lookup) state
  const [msisdn, setMsisdn] = useState("");
  const [kycState, setKycState] = useState<
    "idle" | "verifying" | "verified" | "error"
  >("idle");
  const [kycHolder, setKycHolder] = useState<{
    holderName: string;
    providerName: string;
  } | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);

  const isMsisdnValid = /^\d{7,15}$/.test(msisdn);
  const needsKyc = payoutType === "mobile_money";
  const isKycVerified = kycState === "verified";

  const resetKyc = () => {
    setKycState("idle");
    setKycHolder(null);
    setKycError(null);
  };

  const handleMsisdnChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setMsisdn(digits);
    // Any edit invalidates a prior verification — the user must re-verify.
    if (kycState !== "idle") resetKyc();
  };

  const handleVerify = async () => {
    if (!isMsisdnValid) return;
    setKycState("verifying");
    setKycError(null);
    try {
      const res = await fetch(
        `/api/payouts/kyc?msisdn=${encodeURIComponent(msisdn)}`,
      );
      const data = await res.json();
      if (res.ok) {
        setKycHolder({
          holderName: data.holderName,
          providerName: data.providerName,
        });
        setKycState("verified");
      } else {
        setKycHolder(null);
        setKycError(data.error || "Unable to verify this number.");
        setKycState("error");
      }
    } catch {
      setKycHolder(null);
      setKycError("Network error. Please check your connection and try again.");
      setKycState("error");
    }
  };

  const hasCampaigns = campaignOptions.length > 0;
  const campaignSelectPlaceholder = hasCampaigns
    ? "Choose a campaign"
    : "No campaigns available";
  const isWithdrawalsBlocked = withdrawalBlockStatus?.blocked ?? false;

  const selectedCampaignOption = useMemo(
    () => campaignOptions.find((c) => c.id === selectedCampaign),
    [campaignOptions, selectedCampaign],
  );
  // One "available" number on this screen, and it is the whole balance.
  const availableMinor = selectedCampaignOption?.availableMinor ?? 0;
  const maxWithdrawable = availableMinor / 100;
  const currency = selectedCampaignOption?.currency ?? "SLE";

  // Amount validation
  const amountValue = parseFloat(amount) || 0;
  const amountMinor = toMinor(amountValue);
  const isAmountExceeded = amountMinor > availableMinor && availableMinor > 0;
  const isAmountValid = amountValue > 0 && !isAmountExceeded;

  const hasNoFundsAvailable = !!(selectedCampaign && selectedCampaign !== "__none" && availableMinor <= 0);

  /**
   * The quote: requested / fee / you receive. Never a silent deduction.
   *
   * Computed with the same function the server runs, on minor units, so the two cannot
   * disagree. The exact fee is confirmed by Monime when the payout settles.
   */
  const quote = useMemo(
    () => computePayoutSplit({ requestedMinor: amountMinor }),
    [amountMinor],
  );

  const isSubmitDisabled =
    isSubmitting ||
    isLoading ||
    !hasCampaigns ||
    !selectedCampaign ||
    selectedCampaign === "__none" ||
    isWithdrawalsBlocked ||
    !isAmountValid ||
    hasNoFundsAvailable ||
    (needsKyc && !isKycVerified);

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
            Available {formatMinor(c.availableMinor, c.currency)}
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
        if (result.status === "threshold_review") {
          toast.success("Withdrawal submitted for review", {
            description:
              "This amount is below the minimum withdrawal threshold, so it needs admin approval before it can be paid out.",
          });
        } else if (result.status === "failed") {
          toast.error("Withdrawal could not be processed", {
            description:
              "We couldn't complete the payout with the provider. Please try again or contact support.",
          });
        } else {
          toast.success("Withdrawal request submitted!", {
            description: result.payoutId
              ? `Reference: #${String(result.payoutId).slice(-8).toUpperCase()} — Your withdrawal is being processed.`
              : "Your withdrawal is being processed and will be sent to your selected destination.",
          });
        }
        formRef.current?.reset();
        setPayoutType("mobile_money");
        setSelectedCampaign(undefined);
        setAmount("");
        setMsisdn("");
        resetKyc();
        onSuccess?.();
      } else {
        const errorMessage = result.error || "Failed to submit payout request";
        const description = errorMessage.includes("Insufficient funds")
          // Report the real balance, not a buffered figure — this used to quote the
          // 99% number back as if it were the balance.
          ? `Available balance: ${formatMinor(availableMinor, currency)}`
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
          {selectedCampaignOption && availableMinor > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Available {formatMinor(availableMinor, currency)}
              </span>
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setAmount((availableMinor / 100).toFixed(2))}
              >
                Withdraw all
              </button>
            </div>
          )}
          {isAmountExceeded && selectedCampaignOption && (
            <p className="text-sm text-red-500">
              You can withdraw up to {formatMinor(availableMinor, currency)}.
            </p>
          )}
          {/*
            The withdrawal fee, stated before they commit. Monime takes it out of the
            amount sent, so the owner receives less than they requested — saying so up
            front is the whole point (§8.7).
          */}
          {selectedCampaignOption && isAmountValid && (
            <div className="space-y-1 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">You requested</span>
                <span className="font-medium">{formatMinor(quote.requestedMinor, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Withdrawal fee</span>
                <span className="font-medium">≈ -{formatMinor(quote.feeMinor, currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-1">
                <span className="font-medium text-foreground">You&apos;ll receive</span>
                <span className="font-semibold text-foreground">
                  ≈ {formatMinor(quote.netAmountMinor, currency)}
                </span>
              </div>
              <p className="pt-1 text-[11px] text-muted-foreground">
                Mobile money providers charge a fee on every withdrawal. The exact amount
                is confirmed when the payout settles.
              </p>
            </div>
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
            </SelectContent>
          </Select>
          <input type="hidden" name="payoutType" value={payoutType} />
          <p className="text-xs text-muted-foreground">More payout methods coming soon.</p>
        </div>
      </div>

      {payoutType === "mobile_money" && (
        <div className="space-y-2 min-w-0">
          <Label htmlFor="msisdn">Mobile Number</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="msisdn"
              name="msisdn"
              required
              disabled={isSubmitting}
              type="tel"
              inputMode="tel"
              pattern="^\d{7,15}$"
              value={msisdn}
              onChange={(e) => handleMsisdnChange(e.target.value)}
              placeholder="Enter digits only (e.g., 76123456)"
              className="rounded-xl"
            />
            {!isKycVerified && (
              <Button
                type="button"
                variant="outline"
                disabled={!isMsisdnValid || kycState === "verifying" || isSubmitting}
                onClick={handleVerify}
                className="shrink-0"
              >
                {kycState === "verifying" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  "Verify number"
                )}
              </Button>
            )}
          </div>

          {(kycState === "idle" || kycState === "verifying") && (
            <p className="text-xs text-muted-foreground">
              We check the name registered to this mobile money wallet before
              sending funds.
            </p>
          )}

          {kycState === "error" && kycError && (
            <Alert variant="destructive">
              <Ban className="h-4 w-4" />
              <AlertDescription>{kycError}</AlertDescription>
            </Alert>
          )}

          {isKycVerified && kycHolder && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-foreground">
                    {kycHolder.holderName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registered on {kycHolder.providerName}. Confirm this is the
                    correct account before withdrawing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {needsKyc && !isKycVerified && (
          <p className="text-xs text-muted-foreground">
            Verify your mobile number to enable withdrawal.
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Processing..." : "Request Payout"}
        </Button>
      </form>
      )}
    </div>
  );
}


