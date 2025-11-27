"use client";

import { useState, useEffect } from "react";
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
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Update form when fees load
  useEffect(() => {
    if (fees) {
      setFormData({
        individualBps: fees.processingFee?.individualBps || 260,
        organizationBps: fees.processingFee?.organizationBps || 200,
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
      baseFeeMinor: 0, // Always 0 - Monime deducts 1% automatically
      processingFee: {
        individualBps: formData.individualBps,
        organizationBps: formData.organizationBps,
      },
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
    });
    setHasChanges(false);
  };

  // Helper to convert minor units to major (assuming 100 minor = 1 major)
  const minorToMajor = (minor: number) => (minor / 100).toFixed(2);
  // Helper to convert bps to percentage
  const bpsToPercent = (bps: number) => (bps / 100).toFixed(2);

  // Calculate example fees (base fee + processing fee)
  const BASE_FEE_BPS = 100; // Monime's 1% fee
  const exampleDonation = 10000; // 100 Le in minor units
  const baseFee = Math.round(exampleDonation * BASE_FEE_BPS / 10000);
  const individualProcessingFee = Math.round(exampleDonation * formData.individualBps / 10000);
  const organizationProcessingFee = Math.round(exampleDonation * formData.organizationBps / 10000);
  const individualTotalFee = baseFee + individualProcessingFee;
  const organizationTotalFee = baseFee + organizationProcessingFee;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>All fees</strong> are added on top of the donation amount. Donors pay donation + payment fee (1%) + platform fee.
          Campaigns receive 100% of the donation. Monime&apos;s 1% payment processing fee is automatically deducted by Monime.
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
              Current: <strong>{bpsToPercent(formData.individualBps)}%</strong> (100 bps = 1%)
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
              Current: <strong>{bpsToPercent(formData.organizationBps)}%</strong> (100 bps = 1%)
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
            Example fees for a Le {minorToMajor(exampleDonation)} donation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Individual Campaign</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm">Payment fee (1%): Le {minorToMajor(baseFee)}</p>
                <p className="text-sm">Platform fee ({bpsToPercent(formData.individualBps)}%): Le {minorToMajor(individualProcessingFee)}</p>
                <p className="text-sm text-muted-foreground">Total fees ({bpsToPercent(BASE_FEE_BPS + formData.individualBps)}%): Le {minorToMajor(individualTotalFee)}</p>
                <p className="text-sm font-medium border-t pt-1 mt-1">
                  Donor pays: Le {minorToMajor(exampleDonation + individualTotalFee)}
                </p>
                <p className="text-sm text-green-600">
                  Campaign receives: Le {minorToMajor(exampleDonation)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Organization Campaign</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm">Payment fee (1%): Le {minorToMajor(baseFee)}</p>
                <p className="text-sm">Platform fee ({bpsToPercent(formData.organizationBps)}%): Le {minorToMajor(organizationProcessingFee)}</p>
                <p className="text-sm text-muted-foreground">Total fees ({bpsToPercent(BASE_FEE_BPS + formData.organizationBps)}%): Le {minorToMajor(organizationTotalFee)}</p>
                <p className="text-sm font-medium border-t pt-1 mt-1">
                  Donor pays: Le {minorToMajor(exampleDonation + organizationTotalFee)}
                </p>
                <p className="text-sm text-green-600">
                  Campaign receives: Le {minorToMajor(exampleDonation)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * Campaign always receives 100% of the donation amount. All fees are collected on top of the donation.
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
