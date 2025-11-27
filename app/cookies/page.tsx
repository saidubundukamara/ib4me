"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Shield, BarChart3, Target, Sparkles, Settings } from "lucide-react";
import { useCookieConsent } from "@/components/cookie-consent";

export default function CookiePolicyPage() {
  const { config, openSettings } = useCookieConsent();

  const cookieCategories = [
    {
      icon: Shield,
      title: "Essential Cookies",
      color: "text-primary",
      bgColor: "bg-primary/10",
      description:
        "These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting your privacy preferences, logging in, or filling in forms.",
      examples: [
        "Authentication cookies to keep you logged in",
        "Security cookies to protect your account",
        "Session cookies to maintain your browsing session",
      ],
      canDisable: false,
    },
    {
      icon: BarChart3,
      title: "Analytics Cookies",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description:
        "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and your experience.",
      examples: [
        "Google Analytics for traffic analysis",
        "Page view and session duration tracking",
        "Device and browser information",
      ],
      canDisable: true,
    },
    {
      icon: Target,
      title: "Marketing Cookies",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description:
        "These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.",
      examples: [
        "Social media tracking pixels",
        "Advertising platform cookies",
        "Conversion tracking",
      ],
      canDisable: true,
    },
    {
      icon: Sparkles,
      title: "Functional Cookies",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description:
        "These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.",
      examples: [
        "Language and region preferences",
        "Display preferences (dark mode, layout)",
        "Personalized content recommendations",
      ],
      canDisable: true,
    },
  ];

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4">
          <Cookie className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-lg text-muted-foreground">
          This policy explains how IB4ME uses cookies and similar technologies to
          recognize you when you visit our website.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: November 2024
        </p>
      </div>

      {/* What Are Cookies */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
        <p className="text-muted-foreground mb-4">
          Cookies are small text files that are placed on your computer or mobile device
          when you visit a website. They are widely used to make websites work more
          efficiently and to provide information to the owners of the site.
        </p>
        <p className="text-muted-foreground">
          We use cookies and similar technologies for various purposes, including
          keeping you signed in, understanding how you use our services, and improving
          your experience.
        </p>
      </section>

      {/* Cookie Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Types of Cookies We Use</h2>
        <div className="space-y-6">
          {cookieCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${category.bgColor} ${category.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {category.title}
                        {!category.canDisable && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded font-normal">
                            Always Active
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium mb-2">Examples:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {category.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Manage Preferences */}
      {config?.enabled && (
        <section className="mb-12">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Settings className="h-6 w-6" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold mb-1">Manage Your Cookie Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    You can change your cookie preferences at any time by clicking the
                    button below.
                  </p>
                </div>
                <Button onClick={openSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Cookie Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Browser Settings */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Browser Cookie Settings</h2>
        <p className="text-muted-foreground mb-4">
          You can also control cookies through your browser settings. Most browsers allow
          you to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>See what cookies are stored and delete them individually</li>
          <li>Block third-party cookies</li>
          <li>Block cookies from particular sites</li>
          <li>Block all cookies from being set</li>
          <li>Delete all cookies when you close your browser</li>
        </ul>
        <p className="text-muted-foreground">
          Please note that if you block or delete cookies, some features of our website
          may not work properly.
        </p>
      </section>

      {/* Updates */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this Cookie Policy from time to time to reflect changes in
          technology, legislation, or our data practices. When we make changes, we will
          update the &quot;Last updated&quot; date at the top of this policy. We encourage you to
          review this policy periodically.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <p className="text-muted-foreground mb-4">
          If you have any questions about our use of cookies or this Cookie Policy,
          please contact us:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Email:{" "}
            <a href="mailto:privacy@ib4me.org" className="text-primary hover:underline">
              privacy@ib4me.org
            </a>
          </li>
          <li>
            Visit our{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact Page
            </Link>
          </li>
        </ul>
      </section>

      {/* Related Links */}
      <section className="border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">Related Policies</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
        </div>
      </section>
    </div>
  );
}
