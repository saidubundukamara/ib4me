"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function PaymentSettings() {
  const { payment, updating, updatePaymentSettings } = useSettings();
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  const [formData, setFormData] = useState({
    currency: payment?.currency || "SLE",
    currencySymbol: payment?.currencySymbol || "Le",
    platformFeeRate: payment?.platformFeeRate || 5,
    enableOrangeMoney: payment?.enableOrangeMoney ?? true,
    enableAfriMoney: payment?.enableAfriMoney ?? true,
    enableStripe: payment?.enableStripe ?? true,
    enablePaypal: payment?.enablePaypal ?? false,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updatePaymentSettings(formData);
    if (success) {
      setHasChanges(false);
      toast.success("Payment settings updated successfully");
    } else {
      toast.error("Failed to update payment settings");
    }
  };

  const handleReset = () => {
    setFormData({
      currency: payment?.currency || "SLE",
      currencySymbol: payment?.currencySymbol || "Le",
      platformFeeRate: payment?.platformFeeRate || 5,
      enableOrangeMoney: payment?.enableOrangeMoney ?? true,
      enableAfriMoney: payment?.enableAfriMoney ?? true,
      enableStripe: payment?.enableStripe ?? true,
      enablePaypal: payment?.enablePaypal ?? false,
    });
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Currency Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Currency Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Base Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => handleChange("currency", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SLE">Sierra Leone Leone (SLE)</SelectItem>
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currencySymbol">Currency Symbol</Label>
            <Input
              id="currencySymbol"
              value={formData.currencySymbol}
              onChange={(e) => handleChange("currencySymbol", e.target.value)}
              placeholder="Le"
            />
          </div>
        </div>
      </div>

      {/* Fee Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Platform Fees</h3>
        
        <div className="space-y-2 max-w-md">
          <Label htmlFor="platformFeeRate">Platform Fee (%)</Label>
          <Input
            id="platformFeeRate"
            type="number"
            min="0"
            max="25"
            step="0.1"
            value={formData.platformFeeRate}
            onChange={(e) => handleChange("platformFeeRate", parseFloat(e.target.value) || 0)}
          />
          <p className="text-sm text-muted-foreground">
            Percentage fee charged on successful donations (0-25%).
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        
        <div className="space-y-4">
          {/* Mobile Money */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Orange Money</Label>
              <p className="text-sm text-muted-foreground">
                Enable Orange Money payments via Monime
              </p>
            </div>
            <Switch
              checked={formData.enableOrangeMoney}
              onCheckedChange={(checked) => handleChange("enableOrangeMoney", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>AfriMoney</Label>
              <p className="text-sm text-muted-foreground">
                Enable AfriMoney payments via Monime
              </p>
            </div>
            <Switch
              checked={formData.enableAfriMoney}
              onCheckedChange={(checked) => handleChange("enableAfriMoney", checked)}
            />
          </div>

          {/* International Payment Methods */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Stripe (Credit Cards)</Label>
              <p className="text-sm text-muted-foreground">
                Enable international credit/debit card payments
              </p>
            </div>
            <Switch
              checked={formData.enableStripe}
              onCheckedChange={(checked) => handleChange("enableStripe", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>PayPal</Label>
              <p className="text-sm text-muted-foreground">
                Enable PayPal payments for international donors
              </p>
            </div>
            <Switch
              checked={formData.enablePaypal}
              onCheckedChange={(checked) => handleChange("enablePaypal", checked)}
            />
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">API Keys</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowApiKeys(!showApiKeys)}
          >
            {showApiKeys ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Keys
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Keys
              </>
            )}
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            API keys are configured via environment variables for security. Contact your system administrator to update these values.
          </AlertDescription>
        </Alert>

        {showApiKeys && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monime API Key</Label>
              <Input
                value={payment?.monimeApiKey || "Not configured"}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Environment variable: MONIME_API_KEY
              </p>
            </div>

            <div className="space-y-2">
              <Label>Stripe Publishable Key</Label>
              <Input
                value={payment?.stripePublishableKey || "Not configured"}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Environment variable: STRIPE_PUBLISHABLE_KEY
              </p>
            </div>

            <div className="space-y-2">
              <Label>PayPal Client ID</Label>
              <Input
                value={payment?.paypalClientId || "Not configured"}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Environment variable: PAYPAL_CLIENT_ID
              </p>
            </div>
          </div>
        )}
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