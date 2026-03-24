"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function ContactSettings() {
  const { contact, updating, updateContactSettings } = useSettings();
  
  const [formData, setFormData] = useState({
    email: contact?.email || "",
    phone: contact?.phone || "",
    address: contact?.address || "",
    city: contact?.city || "",
    state: contact?.state || "",
    zipCode: contact?.zipCode || "",
    country: contact?.country || "Sierra Leone",
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.email.trim()) {
      toast.error("Email address is required");
      return;
    }

    const success = await updateContactSettings(formData);
    if (success) {
      setHasChanges(false);
      toast.success("Contact settings updated successfully");
    } else {
      toast.error("Failed to update contact settings");
    }
  };

  const handleReset = () => {
    setFormData({
      email: contact?.email || "",
      phone: contact?.phone || "",
      address: contact?.address || "",
      city: contact?.city || "",
      state: contact?.state || "",
      zipCode: contact?.zipCode || "",
      country: contact?.country || "Sierra Leone",
    });
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Primary Contact Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h3 className="text-lg font-medium">Primary Contact</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="contact@ib4me.org"
              required
            />
            <p className="text-sm text-muted-foreground">
              Main contact email for support and inquiries.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-foreground bg-muted border border-r-0 border-border rounded-l-md">
                +232
              </span>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="XX XXX XXXX"
                className="rounded-l-none"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Primary phone number for urgent contact.
            </p>
          </div>
        </div>
      </div>

      {/* Physical Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <h3 className="text-lg font-medium">Physical Address</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Freetown"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="Western Area"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Postal Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleChange("zipCode", e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              placeholder="Sierra Leone"
            />
          </div>
        </div>
      </div>

      {/* Usage Note */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="font-medium text-blue-700 mb-2">How This Information Is Used</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Contact email appears in the footer and support pages</li>
          <li>• Phone number is displayed for urgent inquiries</li>
          <li>• Address is shown in the &quot;About Us&quot; and legal pages</li>
          <li>• This information helps build trust with donors and campaign creators</li>
        </ul>
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