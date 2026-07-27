"use client";

import { useState, useEffect } from "react";
import { formatMinor, formatBps } from "@/lib/currency";
import { computeDonationSplit } from "@/lib/fees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save, AlertCircle, Calculator } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function FeeSettings() {
  const { fees, updating, updateFeeSettings } = useSettings();

  const [formData, setFormData] = useState({
    individualBps: fees?.processingFee?.individualBps || 260,
    organizationBps: fees?.processingFee?.organizationBps || 200,
    monimeCollectionFeeBpsEstimate: fees?.monimeCollectionFeeBpsEstimate ?? 100,
    payoutFeeBpsEstimate: fees?.payoutFeeBpsEstimate ?? 100,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Update form when fees load
  useEffect(() => {
    if (fees) {
      setFormData({
        individualBps: fees.processingFee?.individualBps || 260,
        organizationBps: fees.processingFee?.organizationBps || 200,
        monimeCollectionFeeBpsEstimate: fees.monimeCollectionFeeBpsEstimate ?? 100,
        payoutFeeBpsEstimate: fees.payoutFeeBpsEstimate ?? 100,
      });
    }
  }, [fees]);

  const handleChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await updateFeeSettings({
      processingFee: {
        individualBps: formData.individualBps,
        organizationBps: formData.organizationBps,
      },
      monimeCollectionFeeBpsEstimate: formData.monimeCollectionFeeBpsEstimate,
      payoutFeeBpsEstimate: formData.payoutFeeBpsEstimate,
    });

    if (success) {
      setHasChanges(false);
      toast.success("Fee settings updated successfully");
    } else {
      toast.error("Failed to update fee settings");
    }
  };

  const handleReset = () => {
    setFormData({
      individualBps: fees?.processingFee?.individualBps || 260,
      organizationBps: fees?.processingFee?.organizationBps || 200,
      monimeCollectionFeeBpsEstimate: fees?.monimeCollectionFeeBpsEstimate ?? 100,
      payoutFeeBpsEstimate: fees?.payoutFeeBpsEstimate ?? 100,
    });
    setHasChanges(false);
  };

  // The preview runs the SAME function the charge path runs, so what an admin is shown
  // here is exactly what a donor will be charged (MONIME-FEE-MODEL.md §8.4).
  const exampleDonation = 10000; // Le 100.00 in minor units
  const individual = computeDonationSplit({
    grossMinor: exampleDonation,
    platformFeeBps: formData.individualBps,
    monimeFeeBpsFallback: formData.monimeCollectionFeeBpsEstimate,
  });
  const organization = computeDonationSplit({
    grossMinor: exampleDonation,
    platformFeeBps: formData.organizationBps,
    monimeFeeBpsFallback: formData.monimeCollectionFeeBpsEstimate,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>All fees are deducted from the donation</strong>, never added on top. A donor is
          charged exactly what they enter. Monime nets its collection fee out of the money before it
          reaches the platform account, and the platform fee is charged on what arrives.
          <br />
          Monime&apos;s rates below are <strong>estimates used for quoting only</strong> — the fee
          Monime actually reports on each payment always takes precedence.
        </AlertDescription>
      </Alert>

      {/* Processing Fees */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Processing Fee (Percentage)</h3>
        <p className="text-sm text-muted-foreground">
          A percentage-based fee charged on the donation amount. Different rates for individual and organization campaigns.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="individualBps">Individual Campaign Rate (basis points)</Label>
            <Input
              id="individualBps"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={formData.individualBps}
              onChange={(e) => handleChange("individualBps", parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              Current: <strong>{formatBps(formData.individualBps)}</strong> (100 bps = 1%)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationBps">Organization Campaign Rate (basis points)</Label>
            <Input
              id="organizationBps"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={formData.organizationBps}
              onChange={(e) => handleChange("organizationBps", parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              Current: <strong>{formatBps(formData.organizationBps)}</strong> (100 bps = 1%)
            </p>
          </div>
        </div>
      </div>

      {/* Monime's rates — quoting fallbacks only */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Monime Rates (estimates)</h3>
        <p className="text-sm text-muted-foreground">
          Used to quote a donation or a withdrawal before Monime has reported what it
          actually charged. The reported fee always wins — changing these never changes what
          Monime takes, only what we display beforehand.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monimeCollectionFeeBpsEstimate">Collection Fee (basis points)</Label>
            <Input
              id="monimeCollectionFeeBpsEstimate"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={formData.monimeCollectionFeeBpsEstimate}
              onChange={(e) => handleChange("monimeCollectionFeeBpsEstimate", parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              Current: <strong>{formatBps(formData.monimeCollectionFeeBpsEstimate)}</strong> — taken on every donation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payoutFeeBpsEstimate">Payout Fee (basis points)</Label>
            <Input
              id="payoutFeeBpsEstimate"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={formData.payoutFeeBpsEstimate}
              onChange={(e) => handleChange("payoutFeeBpsEstimate", parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              Current: <strong>{formatBps(formData.payoutFeeBpsEstimate)}</strong> — taken on every withdrawal
            </p>
          </div>
        </div>
      </div>

      {/* Fee Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Fee Preview
          </CardTitle>
          <CardDescription>
            Example for a {formatMinor(exampleDonation)} donation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Individual Campaign</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium">Donor pays: {formatMinor(individual.grossMinor)}</p>
                <p className="text-sm">Payment fee ({formatBps(formData.monimeCollectionFeeBpsEstimate)}): -{formatMinor(individual.monimeFeeMinor)}</p>
                <p className="text-sm">Platform fee ({formatBps(formData.individualBps)}): -{formatMinor(individual.platformFeeMinor)}</p>
                <p className="text-sm text-green-600 font-medium border-t pt-1 mt-1">
                  Campaign receives: {formatMinor(individual.campaignReceivesMinor)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Organization Campaign</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium">Donor pays: {formatMinor(organization.grossMinor)}</p>
                <p className="text-sm">Payment fee ({formatBps(formData.monimeCollectionFeeBpsEstimate)}): -{formatMinor(organization.monimeFeeMinor)}</p>
                <p className="text-sm">Platform fee ({formatBps(formData.organizationBps)}): -{formatMinor(organization.platformFeeMinor)}</p>
                <p className="text-sm text-green-600 font-medium border-t pt-1 mt-1">
                  Campaign receives: {formatMinor(organization.campaignReceivesMinor)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * The platform fee is charged on what arrives after Monime&apos;s cut, not on the gross.
            Fees are floored per donation, in the campaign&apos;s favour.
          </p>
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
