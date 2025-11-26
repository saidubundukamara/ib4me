"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, Globe, FileText, MapPin, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface OrganizationProfile {
  name?: string | null;
  type?: "ngo" | "charity" | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  description?: string | null;
  website?: string | null;
  address?: {
    street?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
}

export default function OrganizationProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<OrganizationProfile>({});
  const [isOrganization, setIsOrganization] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/user/organization");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data || {});
        setIsOrganization(true);
      } else if (response.status === 403) {
        setIsOrganization(false);
      }
    } catch (error) {
      console.error("Error fetching organization profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/user/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast.success("Organization profile updated successfully");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating organization profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const updateAddressField = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value || null,
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isOrganization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Not an Organization Account
              </h3>
              <p className="text-gray-600">
                This page is only available for organization accounts.
                <br />
                If you represent an NGO or charity, please register a new account
                as an organization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your organization&apos;s information and details
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Your organization&apos;s name, type, and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="Your organization name"
                  value={profile.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Organization Type</Label>
                <Select
                  value={profile.type || ""}
                  onValueChange={(value) => updateField("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ngo">NGO (Non-Governmental Organization)</SelectItem>
                    <SelectItem value="charity">Charity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your organization"
                value={profile.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Registration Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Registration Details
            </CardTitle>
            <CardDescription>
              Official registration numbers and tax information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  placeholder="NGO/Charity registration number"
                  value={profile.registrationNumber || ""}
                  onChange={(e) => updateField("registrationNumber", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  placeholder="Tax identification number"
                  value={profile.taxId || ""}
                  onChange={(e) => updateField("taxId", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Online Presence
            </CardTitle>
            <CardDescription>Your organization&apos;s website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourorganization.org"
                value={profile.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Address
            </CardTitle>
            <CardDescription>
              Your organization&apos;s physical address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                placeholder="Street address"
                value={profile.address?.street || ""}
                onChange={(e) => updateAddressField("street", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={profile.address?.city || ""}
                  onChange={(e) => updateAddressField("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={profile.address?.country || ""}
                  onChange={(e) => updateAddressField("country", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-[150px]">
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
