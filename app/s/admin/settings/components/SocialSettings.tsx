"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save, Facebook, Twitter, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function SocialSettings() {
  const { social, updating, updateSocialSettings } = useSettings();
  
  const [formData, setFormData] = useState({
    facebook: social?.facebook || "",
    twitter: social?.twitter || "",
    instagram: social?.instagram || "",
    linkedin: social?.linkedin || "",
    whatsapp: social?.whatsapp || "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrl = (url: string, platform: string): boolean => {
    if (!url.trim()) return true; // Empty is valid
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      switch (platform) {
        case "facebook":
          return domain === "facebook.com" || domain === "www.facebook.com" || domain === "m.facebook.com";
        case "twitter":
          return domain === "twitter.com" || domain === "www.twitter.com" || domain === "x.com" || domain === "www.x.com";
        case "instagram":
          return domain === "instagram.com" || domain === "www.instagram.com";
        case "linkedin":
          return domain === "linkedin.com" || domain === "www.linkedin.com";
        case "whatsapp":
          return url.startsWith("https://wa.me/") || url.startsWith("https://api.whatsapp.com/");
        default:
          return true;
      }
    } catch {
      return false;
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);

    // Clear existing error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Validate URL if not empty
    if (value.trim() && !validateUrl(value, field)) {
      setErrors(prev => ({ ...prev, [field]: `Invalid ${field} URL format` }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all URLs
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value.trim() && !validateUrl(value, key)) {
        newErrors[key] = `Invalid ${key} URL format`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the URL format errors");
      return;
    }

    const success = await updateSocialSettings(formData);
    if (success) {
      setHasChanges(false);
      toast.success("Social media settings updated successfully");
    } else {
      toast.error("Failed to update social media settings");
    }
  };

  const handleReset = () => {
    setFormData({
      facebook: social?.facebook || "",
      twitter: social?.twitter || "",
      instagram: social?.instagram || "",
      linkedin: social?.linkedin || "",
      whatsapp: social?.whatsapp || "",
    });
    setErrors({});
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Social Media Profiles */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Social Media Profiles</h3>
        <p className="text-sm text-muted-foreground">
          Add your organization&apos;s social media profiles. These will appear in the footer and can be used for social sharing.
        </p>
        
        <div className="space-y-4">
          {/* Facebook */}
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook Page
            </Label>
            <Input
              id="facebook"
              type="url"
              value={formData.facebook}
              onChange={(e) => handleChange("facebook", e.target.value)}
              placeholder="https://facebook.com/yourpage"
              className={errors.facebook ? "border-red-500" : ""}
            />
            {errors.facebook && (
              <p className="text-sm text-red-600">{errors.facebook}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Full URL to your Facebook page or profile.
            </p>
          </div>

          {/* Twitter/X */}
          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-blue-400" />
              Twitter/X Profile
            </Label>
            <Input
              id="twitter"
              type="url"
              value={formData.twitter}
              onChange={(e) => handleChange("twitter", e.target.value)}
              placeholder="https://twitter.com/yourusername or https://x.com/yourusername"
              className={errors.twitter ? "border-red-500" : ""}
            />
            {errors.twitter && (
              <p className="text-sm text-red-600">{errors.twitter}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Full URL to your Twitter or X profile.
            </p>
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram Profile
            </Label>
            <Input
              id="instagram"
              type="url"
              value={formData.instagram}
              onChange={(e) => handleChange("instagram", e.target.value)}
              placeholder="https://instagram.com/yourusername"
              className={errors.instagram ? "border-red-500" : ""}
            />
            {errors.instagram && (
              <p className="text-sm text-red-600">{errors.instagram}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Full URL to your Instagram profile.
            </p>
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-blue-700" />
              LinkedIn Profile
            </Label>
            <Input
              id="linkedin"
              type="url"
              value={formData.linkedin}
              onChange={(e) => handleChange("linkedin", e.target.value)}
              placeholder="https://linkedin.com/company/yourcompany"
              className={errors.linkedin ? "border-red-500" : ""}
            />
            {errors.linkedin && (
              <p className="text-sm text-red-600">{errors.linkedin}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Full URL to your LinkedIn company page or personal profile.
            </p>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              WhatsApp Contact
            </Label>
            <Input
              id="whatsapp"
              type="url"
              value={formData.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="https://wa.me/232XXXXXXXX"
              className={errors.whatsapp ? "border-red-500" : ""}
            />
            {errors.whatsapp && (
              <p className="text-sm text-red-600">{errors.whatsapp}</p>
            )}
            <p className="text-sm text-muted-foreground">
              WhatsApp contact link (wa.me format) for direct messaging.
            </p>
          </div>
        </div>
      </div>

      {/* Usage Information */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="font-medium text-blue-700 mb-2">How Social Links Are Used</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Social media icons appear in the website footer</li>
          <li>• Links are used for social sharing of campaigns</li>
          <li>• WhatsApp contact enables direct support messaging</li>
          <li>• Helps build credibility and community engagement</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="submit" disabled={!hasChanges || updating || Object.keys(errors).some(key => errors[key])}>
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