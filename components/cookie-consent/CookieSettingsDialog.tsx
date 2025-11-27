"use client";

import { useState, useEffect } from "react";
import { useCookieConsent } from "./CookieConsentProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Shield, BarChart3, Target, Sparkles } from "lucide-react";

interface CookieSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookieSettingsDialog({ open, onOpenChange }: CookieSettingsDialogProps) {
  const { config, preferences, savePreferences, acceptAll, rejectAll } = useCookieConsent();

  const [localPrefs, setLocalPrefs] = useState({
    analytics: false,
    marketing: false,
    functional: false,
  });

  // Sync local state with actual preferences when dialog opens
  useEffect(() => {
    if (open && preferences) {
      setLocalPrefs({
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        functional: preferences.functional,
      });
    }
  }, [open, preferences]);

  if (!config) return null;

  const handleSave = () => {
    savePreferences(localPrefs);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            Manage your cookie preferences. Essential cookies are required for the website to function and cannot be disabled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Essential Cookies - Always enabled */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary mt-0.5">
                <Shield className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <Label className="font-medium">
                  {config.categories.essential.name}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {config.categories.essential.description}
                </p>
              </div>
            </div>
            <Switch checked disabled className="opacity-50" />
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500 mt-0.5">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="analytics" className="font-medium cursor-pointer">
                  {config.categories.analytics.name}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {config.categories.analytics.description}
                </p>
              </div>
            </div>
            <Switch
              id="analytics"
              checked={localPrefs.analytics}
              onCheckedChange={(checked) =>
                setLocalPrefs((prev) => ({ ...prev, analytics: checked }))
              }
            />
          </div>

          {/* Marketing Cookies */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-500 mt-0.5">
                <Target className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="marketing" className="font-medium cursor-pointer">
                  {config.categories.marketing.name}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {config.categories.marketing.description}
                </p>
              </div>
            </div>
            <Switch
              id="marketing"
              checked={localPrefs.marketing}
              onCheckedChange={(checked) =>
                setLocalPrefs((prev) => ({ ...prev, marketing: checked }))
              }
            />
          </div>

          {/* Functional Cookies */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="functional" className="font-medium cursor-pointer">
                  {config.categories.functional.name}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {config.categories.functional.description}
                </p>
              </div>
            </div>
            <Switch
              id="functional"
              checked={localPrefs.functional}
              onCheckedChange={(checked) =>
                setLocalPrefs((prev) => ({ ...prev, functional: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={rejectAll} className="sm:mr-auto">
            Reject All
          </Button>
          <Button variant="outline" onClick={acceptAll}>
            Accept All
          </Button>
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
