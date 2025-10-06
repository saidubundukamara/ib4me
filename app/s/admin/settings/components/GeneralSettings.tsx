"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function GeneralSettings() {
  const { website, updating, updateWebsiteSettings } = useSettings();
  const [formData, setFormData] = useState({
    siteName: website.siteName || "",
    siteDescription: website.siteDescription || "",
    logo: website.logo || "",
    favicon: website.favicon || "",
    primaryColor: website.primaryColor || "#007bff",
    secondaryColor: website.secondaryColor || "#6c757d",
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updateWebsiteSettings(formData);
    if (success) {
      setHasChanges(false);
      toast.success("General settings updated successfully");
    } else {
      toast.error("Failed to update general settings");
    }
  };

  const handleReset = () => {
    setFormData({
      siteName: website.siteName || "",
      siteDescription: website.siteDescription || "",
      logo: website.logo || "",
      favicon: website.favicon || "",
      primaryColor: website.primaryColor || "#007bff",
      secondaryColor: website.secondaryColor || "#6c757d",
    });
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Name */}
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            value={formData.siteName}
            onChange={(e) => handleChange("siteName", e.target.value)}
            placeholder="IB4ME"
          />
          <p className="text-sm text-muted-foreground">
            The name of your platform that appears in the header and throughout the site.
          </p>
        </div>

        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex items-center gap-3">
            <Input
              id="primaryColor"
              type="color"
              value={formData.primaryColor}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
              className="w-16 h-10 p-1 border rounded cursor-pointer"
            />
            <Input
              value={formData.primaryColor}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
              placeholder="#007bff"
              className="flex-1"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Main brand color used for buttons and accents.
          </p>
        </div>
      </div>

      {/* Site Description */}
      <div className="space-y-2">
        <Label htmlFor="siteDescription">Site Description</Label>
        <Textarea
          id="siteDescription"
          value={formData.siteDescription}
          onChange={(e) => handleChange("siteDescription", e.target.value)}
          placeholder="Medical Emergency Crowdfunding Platform for Sierra Leone"
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          A brief description of your platform shown in search results and social shares.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo URL */}
        <div className="space-y-2">
          <Label htmlFor="logo">Logo URL</Label>
          <Input
            id="logo"
            value={formData.logo}
            onChange={(e) => handleChange("logo", e.target.value)}
            placeholder="https://example.com/logo.png"
            type="url"
          />
          <p className="text-sm text-muted-foreground">
            URL to your platform&apos;s logo image.
          </p>
        </div>

        {/* Favicon URL */}
        <div className="space-y-2">
          <Label htmlFor="favicon">Favicon URL</Label>
          <Input
            id="favicon"
            value={formData.favicon}
            onChange={(e) => handleChange("favicon", e.target.value)}
            placeholder="https://example.com/favicon.ico"
            type="url"
          />
          <p className="text-sm text-muted-foreground">
            URL to your platform&apos;s favicon (16x16 or 32x32 pixels).
          </p>
        </div>
      </div>

      {/* Secondary Color */}
      <div className="space-y-2">
        <Label htmlFor="secondaryColor">Secondary Color</Label>
        <div className="flex items-center gap-3 max-w-md">
          <Input
            id="secondaryColor"
            type="color"
            value={formData.secondaryColor}
            onChange={(e) => handleChange("secondaryColor", e.target.value)}
            className="w-16 h-10 p-1 border rounded cursor-pointer"
          />
          <Input
            value={formData.secondaryColor}
            onChange={(e) => handleChange("secondaryColor", e.target.value)}
            placeholder="#6c757d"
            className="flex-1"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Secondary color used for subtle UI elements and text.
        </p>
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