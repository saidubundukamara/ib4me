"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Save, Search, Globe, Share, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function SEOSettings() {
  const { seo, updating, updateSeoSettings } = useSettings();
  
  const [formData, setFormData] = useState({
    metaTitle: seo?.metaTitle || "",
    metaDescription: seo?.metaDescription || "",
    metaKeywords: seo?.metaKeywords || "",
    ogTitle: seo?.ogTitle || "",
    ogDescription: seo?.ogDescription || "",
    ogImage: seo?.ogImage || "",
    twitterCard: seo?.twitterCard || "summary_large_image",
    twitterSite: seo?.twitterSite || "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [charCounts, setCharCounts] = useState({
    metaTitle: formData.metaTitle.length,
    metaDescription: formData.metaDescription.length,
    ogTitle: formData.ogTitle.length,
    ogDescription: formData.ogDescription.length,
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);

    // Update character counts
    if (["metaTitle", "metaDescription", "ogTitle", "ogDescription"].includes(field)) {
      setCharCounts(prev => ({ ...prev, [field]: value.length }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updateSeoSettings(formData);
    if (success) {
      setHasChanges(false);
      toast.success("SEO settings updated successfully");
    } else {
      toast.error("Failed to update SEO settings");
    }
  };

  const handleReset = () => {
    const resetData = {
      metaTitle: seo?.metaTitle || "",
      metaDescription: seo?.metaDescription || "",
      metaKeywords: seo?.metaKeywords || "",
      ogTitle: seo?.ogTitle || "",
      ogDescription: seo?.ogDescription || "",
      ogImage: seo?.ogImage || "",
      twitterCard: seo?.twitterCard || "summary_large_image",
      twitterSite: seo?.twitterSite || "",
    };
    
    setFormData(resetData);
    setCharCounts({
      metaTitle: resetData.metaTitle.length,
      metaDescription: resetData.metaDescription.length,
      ogTitle: resetData.ogTitle.length,
      ogDescription: resetData.ogDescription.length,
    });
    setHasChanges(false);
  };

  const getCharCountColor = (count: number, max: number) => {
    if (count > max) return "text-red-600";
    if (count > max * 0.9) return "text-yellow-600";
    return "text-muted-foreground";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic SEO */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <h3 className="text-lg font-medium">Search Engine Optimization</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle}
              onChange={(e) => handleChange("metaTitle", e.target.value)}
              placeholder="IB4ME - Crowdfunding Platform for Social Good in Sierra Leone"
              maxLength={70}
            />
            <div className="flex justify-between text-sm">
              <p className="text-muted-foreground">
                The title that appears in search results and browser tabs.
              </p>
              <span className={getCharCountColor(charCounts.metaTitle, 60)}>
                {charCounts.metaTitle}/60 optimal
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => handleChange("metaDescription", e.target.value)}
              placeholder="Raise and donate for causes that matter in Sierra Leone. Secure donations via mobile money and cards. Verified campaigns with transparent fund management."
              rows={3}
              maxLength={170}
            />
            <div className="flex justify-between text-sm">
              <p className="text-muted-foreground">
                Brief description shown in search results.
              </p>
              <span className={getCharCountColor(charCounts.metaDescription, 160)}>
                {charCounts.metaDescription}/160 optimal
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaKeywords">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              value={formData.metaKeywords}
              onChange={(e) => handleChange("metaKeywords", e.target.value)}
              placeholder="crowdfunding, sierra leone, fundraising, social good, donations, education, community"
            />
            <p className="text-sm text-muted-foreground">
              Comma-separated keywords (less important for modern SEO, but still useful).
            </p>
          </div>
        </div>
      </div>

      {/* Open Graph (Facebook) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <h3 className="text-lg font-medium">Open Graph (Facebook)</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ogTitle">Open Graph Title</Label>
            <Input
              id="ogTitle"
              value={formData.ogTitle}
              onChange={(e) => handleChange("ogTitle", e.target.value)}
              placeholder="IB4ME - Crowdfunding Platform for Social Good in Sierra Leone"
              maxLength={95}
            />
            <div className="flex justify-between text-sm">
              <p className="text-muted-foreground">
                Title when shared on Facebook and other social platforms.
              </p>
              <span className={getCharCountColor(charCounts.ogTitle, 95)}>
                {charCounts.ogTitle}/95 characters
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogDescription">Open Graph Description</Label>
            <Textarea
              id="ogDescription"
              value={formData.ogDescription}
              onChange={(e) => handleChange("ogDescription", e.target.value)}
              placeholder="Join thousands supporting Sierra Leoneans through crowdfunding for education, community projects, personal needs, and more. Every donation makes a difference."
              rows={3}
              maxLength={300}
            />
            <div className="flex justify-between text-sm">
              <p className="text-muted-foreground">
                Description when shared on social media.
              </p>
              <span className={getCharCountColor(charCounts.ogDescription, 300)}>
                {charCounts.ogDescription}/300 characters
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImage">Open Graph Image URL</Label>
            <Input
              id="ogImage"
              type="url"
              value={formData.ogImage}
              onChange={(e) => handleChange("ogImage", e.target.value)}
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="text-sm text-muted-foreground">
              Image displayed when sharing on social media. Recommended size: 1200x630 pixels.
            </p>
          </div>
        </div>
      </div>

      {/* Twitter Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Share className="h-5 w-5" />
          <h3 className="text-lg font-medium">Twitter Cards</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitterCard">Twitter Card Type</Label>
            <Select value={formData.twitterCard} onValueChange={(value) => handleChange("twitterCard", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Card</SelectItem>
                <SelectItem value="summary_large_image">Summary Card with Large Image</SelectItem>
                <SelectItem value="app">App Card</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Type of Twitter card to display when links are shared.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterSite">Twitter Site Handle</Label>
            <Input
              id="twitterSite"
              value={formData.twitterSite}
              onChange={(e) => handleChange("twitterSite", e.target.value)}
              placeholder="@ib4me_sl"
            />
            <p className="text-sm text-muted-foreground">
              Your Twitter handle (include the @). Used to attribute the site in Twitter cards.
            </p>
          </div>
        </div>
      </div>

      {/* SEO Tips */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">SEO Best Practices:</p>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li>Keep meta titles under 60 characters for full visibility in search results</li>
              <li>Meta descriptions should be 150-160 characters with compelling call-to-action</li>
              <li>Use relevant keywords naturally in titles and descriptions</li>
              <li>Open Graph images should be high-quality and 1200x630 pixels</li>
              <li>Test your social sharing with Facebook Debugger and Twitter Card Validator</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

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