"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/lib/settings-provider";
import { Loader2, Settings, CreditCard, ToggleLeft, Phone, Share2, Search, BarChart3, Percent, Wallet, Cookie } from "lucide-react";
// import { toast } from "sonner";

// Import setting components (we'll create these)
import GeneralSettings from "./components/GeneralSettings";
import PaymentSettings from "./components/PaymentSettings";
import FeatureSettings from "./components/FeatureSettings";
import ContactSettings from "./components/ContactSettings";
import SocialSettings from "./components/SocialSettings";
import SEOSettings from "./components/SEOSettings";
import CampaignLimitsSettings from "./components/CampaignLimitsSettings";
import FeeSettings from "./components/FeeSettings";
import PlatformAccountSettings from "./components/PlatformAccountSettings";
import CookieConsentSettings from "./components/CookieConsentSettings";

export default function AdminSettingsPage() {
  const { loading, error, clearError } = useSettings();
  const [activeTab, setActiveTab] = useState("general");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure platform settings, payment integrations, and system features.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-10">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Fees</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Platform</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="cookies" className="flex items-center gap-2">
            <Cookie className="h-4 w-4" />
            <span className="hidden sm:inline">Cookies</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic site information, branding, and appearance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Platform Fees</CardTitle>
              <CardDescription>
                Configure base fees and processing fees for donations. Fees are added on top of donations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeeSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle>Platform Account & Tipping</CardTitle>
              <CardDescription>
                Configure the platform&apos;s financial account for receiving tips and manage tipping settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlatformAccountSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Manage payment methods, fees, and provider configurations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
              <CardDescription>
                Enable or disable platform features and set operational parameters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Limits</CardTitle>
              <CardDescription>
                Configure maximum active campaigns per user type to manage platform capacity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignLimitsSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Set up your organization&apos;s contact details and address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>
                Configure social media profiles and integration settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Meta Tags</CardTitle>
              <CardDescription>
                Optimize search engine visibility with meta tags and social cards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SEOSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cookies">
          <Card>
            <CardHeader>
              <CardTitle>Cookie Consent & Analytics</CardTitle>
              <CardDescription>
                Configure cookie consent banners and analytics tracking for GDPR compliance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CookieConsentSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


