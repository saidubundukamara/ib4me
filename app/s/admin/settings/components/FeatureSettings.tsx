"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save, AlertTriangle, MessageCircle, Smartphone, Mail, DollarSign, Users, Shield, Banknote, Ban, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function FeatureSettings() {
  const { data: session } = useSession();
  const { features, updating, updateFeatureSettings, updateWithdrawalBlock } = useSettings();
  const isSuperAdmin = session?.user?.roles?.includes("SuperAdmin");

  const [formData, setFormData] = useState({
    maintenanceMode: features.maintenanceMode ?? false,
    allowRegistration: features.allowRegistration ?? true,
    requireEmailVerification: features.requireEmailVerification ?? true,
    enableWhatsAppSharing: features.enableWhatsAppSharing ?? true,
    enableSMSNotifications: features.enableSMSNotifications ?? true,
    enableEmailNotifications: features.enableEmailNotifications ?? true,
    thresholdEnabled: features.thresholdEnabled ?? true,
    minimumWithdrawalAmount: features.minimumWithdrawalAmount || 50000,
    minimumWithdrawalPercent: features.minimumWithdrawalPercent || 10,
    allowEmergencyOverride: features.allowEmergencyOverride ?? true,
    dailyWithdrawalLimitMinor: features.dailyWithdrawalLimitMinor ?? 0,
    monthlyWithdrawalLimitMinor: features.monthlyWithdrawalLimitMinor ?? 0,
    whatsAppAutoPost: features.whatsAppAutoPost ?? false,
    paypalEnabled: features.paypalEnabled ?? false,
    emergencyPoolFund: features.emergencyPoolFund ?? false,
    donorFeeChoiceEnabled: features.donorFeeChoiceEnabled ?? false,
  });

  const [donationPresetsInput, setDonationPresetsInput] = useState(
    (features.donationPresets ?? [50, 250, 500]).join(", ")
  );

  const [withdrawalBlockData, setWithdrawalBlockData] = useState({
    withdrawalsBlocked: features.withdrawalsBlocked ?? false,
    blockedReason: features.blockedReason ?? "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [hasBlockChanges, setHasBlockChanges] = useState(false);
  const [blockUpdating, setBlockUpdating] = useState(false);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleBlockChange = (field: string, value: string | boolean) => {
    setWithdrawalBlockData(prev => ({ ...prev, [field]: value }));
    setHasBlockChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const donationPresets = donationPresetsInput
      .split(",")
      .map((s: string) => Number(s.trim()))
      .filter((n: number) => Number.isFinite(n) && n > 0);

    const success = await updateFeatureSettings({ ...formData, donationPresets });
    if (success) {
      setHasChanges(false);
      toast.success("Feature settings updated successfully");
    } else {
      toast.error("Failed to update feature settings");
    }
  };

  const handleBlockSubmit = async () => {
    if (!isSuperAdmin) {
      toast.error("Only superadmins can change the withdrawal block setting");
      return;
    }

    setBlockUpdating(true);
    try {
      const success = await updateWithdrawalBlock(
        withdrawalBlockData.withdrawalsBlocked,
        withdrawalBlockData.blockedReason
      );
      if (success) {
        setHasBlockChanges(false);
        toast.success(
          withdrawalBlockData.withdrawalsBlocked
            ? "Withdrawals have been blocked"
            : "Withdrawals have been unblocked"
        );
      } else {
        toast.error("Failed to update withdrawal block setting");
      }
    } finally {
      setBlockUpdating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      maintenanceMode: features.maintenanceMode ?? false,
      allowRegistration: features.allowRegistration ?? true,
      requireEmailVerification: features.requireEmailVerification ?? true,
      enableWhatsAppSharing: features.enableWhatsAppSharing ?? true,
      enableSMSNotifications: features.enableSMSNotifications ?? true,
      enableEmailNotifications: features.enableEmailNotifications ?? true,
      thresholdEnabled: features.thresholdEnabled ?? true,
      minimumWithdrawalAmount: features.minimumWithdrawalAmount || 50000,
      minimumWithdrawalPercent: features.minimumWithdrawalPercent || 10,
      allowEmergencyOverride: features.allowEmergencyOverride ?? true,
      dailyWithdrawalLimitMinor: features.dailyWithdrawalLimitMinor ?? 0,
      monthlyWithdrawalLimitMinor: features.monthlyWithdrawalLimitMinor ?? 0,
      whatsAppAutoPost: features.whatsAppAutoPost ?? false,
      paypalEnabled: features.paypalEnabled ?? false,
      emergencyPoolFund: features.emergencyPoolFund ?? false,
      donorFeeChoiceEnabled: features.donorFeeChoiceEnabled ?? false,
    });
    setDonationPresetsInput((features.donationPresets ?? [50, 250, 500]).join(", "));
    setHasChanges(false);
  };

  const handleBlockReset = () => {
    setWithdrawalBlockData({
      withdrawalsBlocked: features.withdrawalsBlocked ?? false,
      blockedReason: features.blockedReason ?? "",
    });
    setHasBlockChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* System Features */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-medium">System Features</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <Label className="font-medium">Maintenance Mode</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Put the platform in maintenance mode. Only admins can access the site.
              </p>
            </div>
            <Switch
              checked={formData.maintenanceMode}
              onCheckedChange={(checked) => handleChange("maintenanceMode", checked)}
            />
          </div>

          {formData.maintenanceMode && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Maintenance mode is enabled. Regular users will not be able to access the platform.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* User Registration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">User Registration</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">Allow New Registrations</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to create accounts on the platform.
              </p>
            </div>
            <Switch
              checked={formData.allowRegistration}
              onCheckedChange={(checked) => handleChange("allowRegistration", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">Require Email Verification</Label>
              <p className="text-sm text-muted-foreground">
                New users must verify their email address before accessing the platform.
              </p>
            </div>
            <Switch
              checked={formData.requireEmailVerification}
              onCheckedChange={(checked) => handleChange("requireEmailVerification", checked)}
            />
          </div>
        </div>
      </div>

      {/* Notification Features */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-medium">Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">WhatsApp Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to share campaigns via WhatsApp.
              </p>
            </div>
            <Switch
              checked={formData.enableWhatsAppSharing}
              onCheckedChange={(checked) => handleChange("enableWhatsAppSharing", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">WhatsApp Auto-Post</Label>
              <p className="text-sm text-muted-foreground">
                Automatically post approved campaigns to WhatsApp groups.
              </p>
            </div>
            <Switch
              checked={formData.whatsAppAutoPost}
              onCheckedChange={(checked) => handleChange("whatsAppAutoPost", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <Label className="font-medium">SMS Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Send SMS notifications for important events.
              </p>
            </div>
            <Switch
              checked={formData.enableSMSNotifications}
              onCheckedChange={(checked) => handleChange("enableSMSNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Label className="font-medium">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Send email notifications for donations, updates, and important events.
              </p>
            </div>
            <Switch
              checked={formData.enableEmailNotifications}
              onCheckedChange={(checked) => handleChange("enableEmailNotifications", checked)}
            />
          </div>
        </div>
      </div>

      {/* Withdrawal Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          <h3 className="text-lg font-medium">Withdrawal Settings</h3>
        </div>

        {/* Global Withdrawal Block - Superadmin Only */}
        <div className="p-4 border rounded-lg border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-500" />
                  <Label className="font-medium">Block All Withdrawals</Label>
                  {!isSuperAdmin && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      <Lock className="h-3 w-3" />
                      Superadmin Only
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Temporarily block ALL withdrawals platform-wide. This will prevent new requests and block processing of existing payouts.
                </p>
              </div>
              <Switch
                checked={withdrawalBlockData.withdrawalsBlocked}
                onCheckedChange={(checked) => handleBlockChange("withdrawalsBlocked", checked)}
                disabled={!isSuperAdmin}
              />
            </div>

            {withdrawalBlockData.withdrawalsBlocked && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> All withdrawals are currently blocked. Campaign owners cannot request or receive funds.
                    {features.blockedBy && features.blockedAt && (
                      <span className="block mt-1 text-xs">
                        Blocked on {new Date(features.blockedAt).toLocaleDateString()} at {new Date(features.blockedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="blockedReason">Block Reason (optional)</Label>
                  <Textarea
                    id="blockedReason"
                    placeholder="Enter the reason for blocking withdrawals..."
                    value={withdrawalBlockData.blockedReason}
                    onChange={(e) => handleBlockChange("blockedReason", e.target.value)}
                    disabled={!isSuperAdmin}
                    className="h-20"
                  />
                  <p className="text-sm text-muted-foreground">
                    This reason will be shown to users when they attempt to withdraw.
                  </p>
                </div>
              </>
            )}

            {isSuperAdmin && hasBlockChanges && (
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant={withdrawalBlockData.withdrawalsBlocked ? "destructive" : "default"}
                  onClick={handleBlockSubmit}
                  disabled={blockUpdating}
                >
                  {blockUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {withdrawalBlockData.withdrawalsBlocked ? "Block Withdrawals" : "Unblock Withdrawals"}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleBlockReset}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Threshold Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label className="font-medium">Enable Withdrawal Threshold</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, campaigns must meet minimum requirements before withdrawing.
              When disabled, campaigns can withdraw any amount at any time.
            </p>
          </div>
          <Switch
            checked={formData.thresholdEnabled}
            onCheckedChange={(checked) => handleChange("thresholdEnabled", checked)}
          />
        </div>

        {/* Withdrawal Thresholds - Only shown when threshold is enabled */}
        {formData.thresholdEnabled && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumWithdrawalAmount">Minimum Withdrawal Amount (SLE)</Label>
                <Input
                  id="minimumWithdrawalAmount"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.minimumWithdrawalAmount}
                  onChange={(e) => handleChange("minimumWithdrawalAmount", parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Fixed minimum amount required for withdrawal requests.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumWithdrawalPercent">Minimum Percentage of Raised Amount (%)</Label>
                <Input
                  id="minimumWithdrawalPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.minimumWithdrawalPercent}
                  onChange={(e) => handleChange("minimumWithdrawalPercent", parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Withdrawal must be at least this % of total donations raised.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Allow Emergency Override</Label>
                <p className="text-sm text-muted-foreground">
                  Allow admins to bypass withdrawal thresholds for urgent cases.
                </p>
              </div>
              <Switch
                checked={formData.allowEmergencyOverride}
                onCheckedChange={(checked) => handleChange("allowEmergencyOverride", checked)}
              />
            </div>
          </div>
        )}

        {/* Per-User Withdrawal Limits */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label className="font-medium">Per-User Withdrawal Limits</Label>
            <p className="text-sm text-muted-foreground">
              Limit how much any single user can withdraw in a given period. Set to 0 to disable the limit.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyWithdrawalLimitMinor">Daily Limit (SLE minor units)</Label>
              <Input
                id="dailyWithdrawalLimitMinor"
                type="number"
                min="0"
                step="10000"
                value={formData.dailyWithdrawalLimitMinor}
                onChange={(e) => handleChange("dailyWithdrawalLimitMinor", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Max per user per 24h. {formData.dailyWithdrawalLimitMinor > 0 ? `= SLE ${(formData.dailyWithdrawalLimitMinor / 100).toFixed(2)}` : "Unlimited"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyWithdrawalLimitMinor">Monthly Limit (SLE minor units)</Label>
              <Input
                id="monthlyWithdrawalLimitMinor"
                type="number"
                min="0"
                step="100000"
                value={formData.monthlyWithdrawalLimitMinor}
                onChange={(e) => handleChange("monthlyWithdrawalLimitMinor", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Max per user per 30 days. {formData.monthlyWithdrawalLimitMinor > 0 ? `= SLE ${(formData.monthlyWithdrawalLimitMinor / 100).toFixed(2)}` : "Unlimited"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Features */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <h3 className="text-lg font-medium">Other Financial Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">PayPal Integration</Label>
              <p className="text-sm text-muted-foreground">
                Enable PayPal for international donations.
              </p>
            </div>
            <Switch
              checked={formData.paypalEnabled}
              onCheckedChange={(checked) => handleChange("paypalEnabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">Emergency Pool Fund</Label>
              <p className="text-sm text-muted-foreground">
                Enable community emergency pool fund for urgent cases.
              </p>
            </div>
            <Switch
              checked={formData.emergencyPoolFund}
              onCheckedChange={(checked) => handleChange("emergencyPoolFund", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">Donor Fee Choice</Label>
              <p className="text-sm text-muted-foreground">
                Allow donors to choose whether to cover transaction fees. When disabled,
                fees are always deducted from the donation amount.
              </p>
            </div>
            <Switch
              checked={formData.donorFeeChoiceEnabled}
              onCheckedChange={(checked) => handleChange("donorFeeChoiceEnabled", checked)}
            />
          </div>
        </div>
      </div>

      {/* Donation Presets */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <h3 className="text-lg font-medium">Donation Presets</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="donationPresets">Quick-pick amounts on donate page</Label>
          <Input
            id="donationPresets"
            value={donationPresetsInput}
            onChange={(e) => { setDonationPresetsInput(e.target.value); setHasChanges(true); }}
            placeholder="50, 250, 500"
          />
          <p className="text-sm text-muted-foreground">
            Comma-separated amounts in major units (e.g. <code>50, 250, 500</code> for SLE 50, SLE 250 and SLE 500).
          </p>
        </div>
      </div>

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