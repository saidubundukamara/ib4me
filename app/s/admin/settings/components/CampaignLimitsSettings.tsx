"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Users, Building2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface CampaignLimitsData {
  maxActiveCampaignsIndividual: number;
  maxActiveCampaignsOrganization: number;
}

export default function CampaignLimitsSettings() {
  const [formData, setFormData] = useState<CampaignLimitsData>({
    maxActiveCampaignsIndividual: 2,
    maxActiveCampaignsOrganization: 8,
  });
  const [initialData, setInitialData] = useState<CampaignLimitsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings?category=campaignLimits");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            const settings = {
              maxActiveCampaignsIndividual: data.settings.maxActiveCampaignsIndividual ?? 2,
              maxActiveCampaignsOrganization: data.settings.maxActiveCampaignsOrganization ?? 8,
            };
            setFormData(settings);
            setInitialData(settings);
          }
        }
      } catch (error) {
        console.error("Failed to fetch campaign limits settings:", error);
        toast.error("Failed to load campaign limits settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field: keyof CampaignLimitsData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.maxActiveCampaignsIndividual < 1) {
      toast.error("Individual user limit must be at least 1");
      return;
    }
    if (formData.maxActiveCampaignsOrganization < 1) {
      toast.error("Organization limit must be at least 1");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/settings?category=campaignLimits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setInitialData(formData);
        setHasChanges(false);
        toast.success("Campaign limits updated successfully");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update campaign limits");
      }
    } catch (error) {
      console.error("Failed to update campaign limits:", error);
      toast.error("Failed to update campaign limits");
    } finally {
      setUpdating(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h3 className="text-lg font-medium">Campaign Limits</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure the maximum number of active campaigns users can have based
          on their account type. Active campaigns are those with status
          &quot;active&quot; and verification status &quot;approved&quot;.
        </p>
      </div>

      {/* Individual Users Limit */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <Label className="font-medium">Individual Users</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxActiveCampaignsIndividual">
            Maximum Active Campaigns
          </Label>
          <Input
            id="maxActiveCampaignsIndividual"
            type="number"
            min="1"
            max="100"
            value={formData.maxActiveCampaignsIndividual}
            onChange={(e) =>
              handleChange(
                "maxActiveCampaignsIndividual",
                parseInt(e.target.value) || 1
              )
            }
            className="w-32"
          />
          <p className="text-sm text-muted-foreground">
            Default: 2 campaigns. Individual users creating campaigns for
            themselves or family members.
          </p>
        </div>
      </div>

      {/* Organizations Limit */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <Label className="font-medium">Organizations</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxActiveCampaignsOrganization">
            Maximum Active Campaigns
          </Label>
          <Input
            id="maxActiveCampaignsOrganization"
            type="number"
            min="1"
            max="100"
            value={formData.maxActiveCampaignsOrganization}
            onChange={(e) =>
              handleChange(
                "maxActiveCampaignsOrganization",
                parseInt(e.target.value) || 1
              )
            }
            className="w-32"
          />
          <p className="text-sm text-muted-foreground">
            Default: 8 campaigns. NGOs and charitable organizations managing
            multiple beneficiaries.
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
