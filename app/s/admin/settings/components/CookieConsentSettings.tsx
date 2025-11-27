"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Cookie, Plus, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsService {
  id: string;
  name: string;
  enabled: boolean;
  trackingId: string;
  category: "analytics" | "marketing" | "functional";
}

interface CookieConsentFormData {
  enabled: boolean;
  banner: {
    title: string;
    message: string;
    acceptAllText: string;
    rejectAllText: string;
    customizeText: string;
  };
  categories: {
    essential: { name: string; description: string };
    analytics: { name: string; description: string };
    marketing: { name: string; description: string };
    functional: { name: string; description: string };
  };
  services: AnalyticsService[];
  consentExpiryDays: number;
}

const DEFAULT_FORM_DATA: CookieConsentFormData = {
  enabled: false,
  banner: {
    title: "Cookie Preferences",
    message: "We use cookies to enhance your browsing experience and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
    acceptAllText: "Accept All",
    rejectAllText: "Reject Non-Essential",
    customizeText: "Customize",
  },
  categories: {
    essential: {
      name: "Essential Cookies",
      description: "Required for the website to function properly. Cannot be disabled.",
    },
    analytics: {
      name: "Analytics Cookies",
      description: "Help us understand how visitors interact with our website.",
    },
    marketing: {
      name: "Marketing Cookies",
      description: "Used to track visitors across websites for advertising purposes.",
    },
    functional: {
      name: "Functional Cookies",
      description: "Enable enhanced functionality and personalization.",
    },
  },
  services: [],
  consentExpiryDays: 365,
};

export default function CookieConsentSettings() {
  const [formData, setFormData] = useState<CookieConsentFormData>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings?category=cookieConsent");
        const data = await response.json();
        if (data.success && data.settings) {
          setFormData({
            ...DEFAULT_FORM_DATA,
            ...data.settings,
            banner: { ...DEFAULT_FORM_DATA.banner, ...data.settings.banner },
            categories: {
              essential: { ...DEFAULT_FORM_DATA.categories.essential, ...data.settings.categories?.essential },
              analytics: { ...DEFAULT_FORM_DATA.categories.analytics, ...data.settings.categories?.analytics },
              marketing: { ...DEFAULT_FORM_DATA.categories.marketing, ...data.settings.categories?.marketing },
              functional: { ...DEFAULT_FORM_DATA.categories.functional, ...data.settings.categories?.functional },
            },
            services: data.settings.services || [],
          });
        }
      } catch (error) {
        console.error("Error fetching cookie consent settings:", error);
        toast.error("Failed to load cookie consent settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = <K extends keyof CookieConsentFormData>(
    field: K,
    value: CookieConsentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleBannerChange = (field: keyof CookieConsentFormData["banner"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      banner: { ...prev.banner, [field]: value },
    }));
    setHasChanges(true);
  };

  const handleServiceChange = (index: number, field: keyof AnalyticsService, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
    setHasChanges(true);
  };

  const addGoogleAnalytics = () => {
    const exists = formData.services.some((s) => s.id === "google_analytics");
    if (exists) {
      toast.error("Google Analytics is already added");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: "google_analytics",
          name: "Google Analytics",
          enabled: false,
          trackingId: "",
          category: "analytics",
        },
      ],
    }));
    setHasChanges(true);
  };

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings?category=cookieConsent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Cookie consent settings saved successfully");
        setHasChanges(false);
      } else {
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving cookie consent settings:", error);
      toast.error("Failed to save cookie consent settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Enable Cookie Consent */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          <h3 className="text-lg font-medium">Cookie Consent System</h3>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label className="font-medium">Enable Cookie Consent Banner</Label>
            <p className="text-sm text-muted-foreground">
              Show a cookie consent banner to users when they first visit the site.
            </p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => handleChange("enabled", checked)}
          />
        </div>
      </div>

      {formData.enabled && (
        <>
          {/* Banner Text */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Banner Text</h3>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="bannerTitle">Banner Title</Label>
                <Input
                  id="bannerTitle"
                  value={formData.banner.title}
                  onChange={(e) => handleBannerChange("title", e.target.value)}
                  placeholder="Cookie Preferences"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerMessage">Banner Message</Label>
                <Textarea
                  id="bannerMessage"
                  value={formData.banner.message}
                  onChange={(e) => handleBannerChange("message", e.target.value)}
                  placeholder="We use cookies to enhance your browsing experience..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acceptAllText">Accept All Button</Label>
                  <Input
                    id="acceptAllText"
                    value={formData.banner.acceptAllText}
                    onChange={(e) => handleBannerChange("acceptAllText", e.target.value)}
                    placeholder="Accept All"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejectAllText">Reject Button</Label>
                  <Input
                    id="rejectAllText"
                    value={formData.banner.rejectAllText}
                    onChange={(e) => handleBannerChange("rejectAllText", e.target.value)}
                    placeholder="Reject Non-Essential"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customizeText">Customize Button</Label>
                  <Input
                    id="customizeText"
                    value={formData.banner.customizeText}
                    onChange={(e) => handleBannerChange("customizeText", e.target.value)}
                    placeholder="Customize"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Services */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <h3 className="text-lg font-medium">Analytics Services</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGoogleAnalytics}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Google Analytics
              </Button>
            </div>

            {formData.services.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No analytics services configured.</p>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Add Google Analytics&quot; to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.services.map((service, index) => (
                  <div key={service.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                          <BarChart3 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Category: {service.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.enabled}
                          onCheckedChange={(checked) =>
                            handleServiceChange(index, "enabled", checked)
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`trackingId-${index}`}>
                        {service.id === "google_analytics"
                          ? "Measurement ID (e.g., G-XXXXXXXXXX)"
                          : "Tracking ID"}
                      </Label>
                      <Input
                        id={`trackingId-${index}`}
                        value={service.trackingId}
                        onChange={(e) =>
                          handleServiceChange(index, "trackingId", e.target.value)
                        }
                        placeholder={
                          service.id === "google_analytics"
                            ? "G-XXXXXXXXXX"
                            : "Enter tracking ID"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Consent Expiry */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Consent Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="consentExpiryDays">Consent Expiry (Days)</Label>
              <Input
                id="consentExpiryDays"
                type="number"
                min="1"
                max="730"
                value={formData.consentExpiryDays}
                onChange={(e) =>
                  handleChange("consentExpiryDays", parseInt(e.target.value) || 365)
                }
              />
              <p className="text-sm text-muted-foreground">
                How long to remember user consent preferences (default: 365 days).
              </p>
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="submit" disabled={!hasChanges || saving}>
          {saving ? (
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

        <p className="text-sm text-muted-foreground">
          {hasChanges ? "You have unsaved changes" : "All changes saved"}
        </p>
      </div>
    </form>
  );
}
