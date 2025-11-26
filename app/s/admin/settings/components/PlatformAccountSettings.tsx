"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save, AlertCircle, Wallet, Gift, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function PlatformAccountSettings() {
  const {
    platformAccount,
    tipFinancialAccount,
    tipping,
    updating,
    updatePlatformAccountSettings,
    updateTipFinancialAccountSettings,
    updateTippingSettings,
  } = useSettings();

  const [formData, setFormData] = useState({
    // Platform Financial Account (for receiving fees)
    platformId: platformAccount?.id || "",
    platformUvan: platformAccount?.uvan || "",
    // Tip Financial Account (for receiving tips)
    tipId: tipFinancialAccount?.id || "",
    tipUvan: tipFinancialAccount?.uvan || "",
    // Tipping Settings
    enabled: tipping?.enabled ?? false,
    minAmountMinor: tipping?.minAmountMinor || 100,
    maxAmountMinor: tipping?.maxAmountMinor || 10000000,
    suggestedAmounts: tipping?.suggestedAmounts?.join(", ") || "5000, 10000, 25000, 50000",
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Update form when settings load
  useEffect(() => {
    setFormData({
      platformId: platformAccount?.id || "",
      platformUvan: platformAccount?.uvan || "",
      tipId: tipFinancialAccount?.id || "",
      tipUvan: tipFinancialAccount?.uvan || "",
      enabled: tipping?.enabled ?? false,
      minAmountMinor: tipping?.minAmountMinor || 100,
      maxAmountMinor: tipping?.maxAmountMinor || 10000000,
      suggestedAmounts: tipping?.suggestedAmounts?.join(", ") || "5000, 10000, 25000, 50000",
    });
  }, [platformAccount, tipFinancialAccount, tipping]);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse suggested amounts from comma-separated string
    const suggestedAmountsArray = formData.suggestedAmounts
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    // Update all settings
    const [platformSuccess, tipSuccess, tippingSuccess] = await Promise.all([
      updatePlatformAccountSettings({
        id: formData.platformId || undefined,
        uvan: formData.platformUvan || undefined,
      }),
      updateTipFinancialAccountSettings({
        id: formData.tipId || undefined,
        uvan: formData.tipUvan || undefined,
      }),
      updateTippingSettings({
        enabled: formData.enabled,
        minAmountMinor: formData.minAmountMinor,
        maxAmountMinor: formData.maxAmountMinor,
        suggestedAmounts: suggestedAmountsArray,
      }),
    ]);

    if (platformSuccess && tipSuccess && tippingSuccess) {
      setHasChanges(false);
      toast.success("All settings updated successfully");
    } else {
      toast.error("Failed to update some settings");
    }
  };

  const handleReset = () => {
    setFormData({
      platformId: platformAccount?.id || "",
      platformUvan: platformAccount?.uvan || "",
      tipId: tipFinancialAccount?.id || "",
      tipUvan: tipFinancialAccount?.uvan || "",
      enabled: tipping?.enabled ?? false,
      minAmountMinor: tipping?.minAmountMinor || 100,
      maxAmountMinor: tipping?.maxAmountMinor || 10000000,
      suggestedAmounts: tipping?.suggestedAmounts?.join(", ") || "5000, 10000, 25000, 50000",
    });
    setHasChanges(false);
  };

  // Helper to convert minor units to major
  const minorToMajor = (minor: number) => (minor / 100).toFixed(2);

  const isPlatformAccountConfigured = formData.platformId && formData.platformUvan;
  const isTipAccountConfigured = formData.tipId && formData.tipUvan;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Platform Financial Account Section (for fees) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Platform Financial Account (Fees)
          </CardTitle>
          <CardDescription>
            This account receives platform fees collected from donations (base fee + processing fees).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Get the Account ID and UVAN from your Monime dashboard. This is where donation fees will be deposited.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platformId">Financial Account ID</Label>
              <Input
                id="platformId"
                value={formData.platformId}
                onChange={(e) => handleChange("platformId", e.target.value)}
                placeholder="fa_xxxxxxxxxx"
              />
              <p className="text-sm text-muted-foreground">
                Monime account ID for receiving fees
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformUvan">UVAN</Label>
              <Input
                id="platformUvan"
                value={formData.platformUvan}
                onChange={(e) => handleChange("platformUvan", e.target.value)}
                placeholder="SL0000000000"
              />
              <p className="text-sm text-muted-foreground">
                Universal Virtual Account Number
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isPlatformAccountConfigured ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {isPlatformAccountConfigured
                ? "Platform fees account configured"
                : "Not configured - fees cannot be collected"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tip Financial Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Tip Financial Account
          </CardTitle>
          <CardDescription>
            This account receives tips from supporters who want to directly support IB4ME.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is a separate account from the fees account. Tips from the /tip page will be deposited here.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipId">Financial Account ID</Label>
              <Input
                id="tipId"
                value={formData.tipId}
                onChange={(e) => handleChange("tipId", e.target.value)}
                placeholder="fa_xxxxxxxxxx"
              />
              <p className="text-sm text-muted-foreground">
                Monime account ID for receiving tips
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipUvan">UVAN</Label>
              <Input
                id="tipUvan"
                value={formData.tipUvan}
                onChange={(e) => handleChange("tipUvan", e.target.value)}
                placeholder="SL0000000000"
              />
              <p className="text-sm text-muted-foreground">
                Universal Virtual Account Number
              </p>
            </div>
          </div>

          {!isTipAccountConfigured && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tip account is not configured. Tipping will be disabled until both Account ID and UVAN are set.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tipping Settings Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Tipping Configuration
          </CardTitle>
          <CardDescription>
            Configure platform tipping to allow donors to support IB4ME directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Platform Tipping</Label>
              <p className="text-sm text-muted-foreground">
                Allow donors to tip the platform directly at /tip
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => handleChange("enabled", checked)}
              disabled={!isTipAccountConfigured}
            />
          </div>

          {formData.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmountMinor">Minimum Tip Amount (minor units)</Label>
                  <Input
                    id="minAmountMinor"
                    type="number"
                    min="0"
                    value={formData.minAmountMinor}
                    onChange={(e) => handleChange("minAmountMinor", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Current: <strong>Le {minorToMajor(formData.minAmountMinor)}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAmountMinor">Maximum Tip Amount (minor units)</Label>
                  <Input
                    id="maxAmountMinor"
                    type="number"
                    min="0"
                    value={formData.maxAmountMinor}
                    onChange={(e) => handleChange("maxAmountMinor", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Current: <strong>Le {minorToMajor(formData.maxAmountMinor)}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestedAmounts">Suggested Tip Amounts (minor units, comma-separated)</Label>
                <Input
                  id="suggestedAmounts"
                  value={formData.suggestedAmounts}
                  onChange={(e) => handleChange("suggestedAmounts", e.target.value)}
                  placeholder="5000, 10000, 25000, 50000"
                />
                <p className="text-sm text-muted-foreground">
                  These amounts will be shown as quick-select options for donors.
                  Current: {formData.suggestedAmounts
                    .split(",")
                    .map((s) => `Le ${minorToMajor(parseInt(s.trim()) || 0)}`)
                    .join(", ")}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  isPlatformAccountConfigured ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <div>
                <p className="font-medium">
                  {isPlatformAccountConfigured
                    ? "Fee Collection Active"
                    : "Fee Collection Not Configured"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPlatformAccountConfigured
                    ? "Platform fees will be deposited to the fees account"
                    : "Configure the platform account to collect fees"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  isTipAccountConfigured && formData.enabled ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <div>
                <p className="font-medium">
                  {isTipAccountConfigured && formData.enabled
                    ? "Tipping Active"
                    : isTipAccountConfigured
                    ? "Tip Account Configured, Tipping Disabled"
                    : "Tipping Not Configured"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTipAccountConfigured && formData.enabled
                    ? "Donors can tip the platform at /tip"
                    : isTipAccountConfigured
                    ? "Enable tipping to allow donors to support IB4ME"
                    : "Configure the tip account to enable tipping"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="submit" disabled={!hasChanges || updating}>
          {updating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>

        {hasChanges && (
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        )}

        <p className="text-sm text-muted-foreground">
          {hasChanges ? "You have unsaved changes" : "All changes saved"}
        </p>
      </div>
    </form>
  );
}
