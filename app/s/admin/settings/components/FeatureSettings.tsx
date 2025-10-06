"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save, AlertTriangle, MessageCircle, Smartphone, Mail, DollarSign, Users, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function FeatureSettings() {
  const { features, updating, updateFeatureSettings } = useSettings();
  
  const [formData, setFormData] = useState({
    maintenanceMode: features.maintenanceMode ?? false,
    allowRegistration: features.allowRegistration ?? true,
    requireEmailVerification: features.requireEmailVerification ?? true,
    enableWhatsAppSharing: features.enableWhatsAppSharing ?? true,
    enableSMSNotifications: features.enableSMSNotifications ?? true,
    enableEmailNotifications: features.enableEmailNotifications ?? true,
    minimumWithdrawalAmount: features.minimumWithdrawalAmount || 50000,
    whatsAppAutoPost: features.whatsAppAutoPost ?? false,
    paypalEnabled: features.paypalEnabled ?? false,
    emergencyPoolFund: features.emergencyPoolFund ?? false,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updateFeatureSettings(formData);
    if (success) {
      setHasChanges(false);
      toast.success("Feature settings updated successfully");
    } else {
      toast.error("Failed to update feature settings");
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
      minimumWithdrawalAmount: features.minimumWithdrawalAmount || 50000,
      whatsAppAutoPost: features.whatsAppAutoPost ?? false,
      paypalEnabled: features.paypalEnabled ?? false,
      emergencyPoolFund: features.emergencyPoolFund ?? false,
    });
    setHasChanges(false);
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

      {/* Financial Features */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <h3 className="text-lg font-medium">Financial Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2 max-w-md">
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
              Minimum amount required before campaign owners can request withdrawals.
            </p>
          </div>

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