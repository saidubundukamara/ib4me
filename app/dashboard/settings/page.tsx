"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type User = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  whatsappOptIn?: boolean;
  address?: {
    country?: string;
    city?: string;
  };
  payoutPreferences?: {
    mobileMoney?: {
      provider?: string;
      msisdn?: string;
      accountName?: string;
    };
    bank?: {
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    };
  };
};

const SETTINGS_TABS = [
  { value: "profile", label: "Profile", icon: UserRound },
  { value: "security", label: "Password & Security", icon: KeyRound },
  // { value: "payouts", label: "Payouts", icon: Wallet },
  { value: "address", label: "Address", icon: MapPin },
  { value: "support", label: "Support", icon: Phone },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  icon: LucideIcon;
}>;

type SettingsTabValue = (typeof SETTINGS_TABS)[number]["value"];

const DEFAULT_TAB: SettingsTabValue = "profile";

const isValidTabValue = (value: string | null): value is SettingsTabValue =>
  Boolean(value && SETTINGS_TABS.some((tab) => tab.value === value));

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<SettingsTabValue>(
    isValidTabValue(tabParam) ? tabParam : DEFAULT_TAB,
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const nextTab = isValidTabValue(tabParam) ? tabParam : DEFAULT_TAB;
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    if (!isValidTabValue(value)) return;
    setActiveTab(value);

    if (!pathname) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_TAB) {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };


  useEffect(() => {
    if (session?.user?.id) {
      fetchUser();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (user) {
      setWhatsappOptIn(Boolean(user.whatsappOptIn));
    }
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(user?.photoUrl ?? null);
    }
  }, [avatarFile, user?.photoUrl]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be under 5MB.");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(user?.photoUrl ?? null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function fetchUser() {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      toast.error("Unable to load profile right now.");
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profileLoading || avatarUploading) return;

    setProfileLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      let photoUrl = user?.photoUrl as string | undefined;

      if (avatarFile) {
        setAvatarUploading(true);
        const avatarForm = new FormData();
        avatarForm.append("file", avatarFile);

        const uploadRes = await fetch("/api/user/avatar", {
          method: "POST",
          body: avatarForm,
        });

        const uploadPayload = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          toast.error(uploadPayload.error || "Failed to upload avatar.");
          throw new Error("avatar_upload_failed");
        }

        if (uploadPayload?.url) {
          photoUrl = String(uploadPayload.url);
        }
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          whatsappOptIn,
          photoUrl,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload.error || "Failed to update profile.");
      }

      const updatedUser = payload as User;
      setUser(updatedUser);
      setWhatsappOptIn(Boolean(updatedUser?.whatsappOptIn));
      setAvatarFile(null);
      setAvatarPreview(updatedUser?.photoUrl ?? photoUrl ?? null);
      toast.success("Profile updated successfully.");
    } catch (error) {
      if (error instanceof Error && error.message === "avatar_upload_failed") {
        // already handled
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Network error updating profile.");
      }
    } finally {
      setAvatarUploading(false);
      setProfileLoading(false);
    }
  }

  async function updateAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addressLoading) return;

    setAddressLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/user/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: formData.get("country"),
          city: formData.get("city"),
        }),
      });

      const addressPayload = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(addressPayload.error || "Failed to update address.");
      } else {
        setUser(addressPayload as User);
        toast.success("Address updated successfully.");
      }
    } catch {
      toast.error("Network error updating address.");
    } finally {
      setAddressLoading(false);
    }
  }



  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordLoading) return;

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        toast.success("Password updated successfully.");
        event.currentTarget.reset();
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "Failed to update password.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error updating password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  const heroName = useMemo(
    () => user?.name || session?.user?.name || "there",
    [session?.user?.name, user?.name],
  );

  const initials = useMemo(() => {
    return heroName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U";
  }, [heroName]);

  const heroAvatar = avatarPreview ?? user?.photoUrl ?? null;
  const isProfileBusy = loading || profileLoading || avatarUploading;

  const primaryEmail = user?.email || session?.user?.email || "Add an email address";
  const primaryPhone = user?.phone || "Add a phone number";

  return (
    <div className="flex w-full flex-col gap-8 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-border/40  p-4 sm:p-8 lg:p-10 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.45)]">
        <div className="relative flex flex-col gap-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-4 sm:items-center sm:gap-6 min-w-0 w-full sm:w-auto">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-blaze-orange bg-background shadow-lg flex-shrink-0">
                {heroAvatar ? (
                  <AvatarImage src={heroAvatar} alt={heroName} />
                ) : (
                  <AvatarFallback className="text-lg sm:text-xl">{initials}</AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-2 min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3rem] text-primary">Dashboard - Settings</p>
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate">Hey {heroName}, this is your control centre.</h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">Keep your profile up to date, secure your account, and manage payout preferences easily.</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProfileBusy}
              >
                {avatarUploading ? "Uploading..." : "Update photo"}
              </Button>
              {avatarFile && (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl w-full sm:w-auto"
                  onClick={handleRemoveAvatar}
                  disabled={isProfileBusy}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="flex items-center rounded-2xl border border-border/50 bg-background/80 p-3 sm:p-4 shadow-sm min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium  tracking-widest text-muted-foreground">Primary Email</p>
                <p className="truncate text-sm sm:text-base font-semibold text-foreground">{primaryEmail}</p>
              </div>
            </div>
            <div className="flex items-center rounded-2xl border border-border/50 bg-background/80 p-3 sm:p-4 shadow-sm min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary-foreground flex-shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold tracking-widest text-muted-foreground">Phone Number</p>
                <p className="truncate text-sm sm:text-base font-semibold text-foreground">{primaryPhone}</p>
              </div>
            </div>
            <div className="flex items-center rounded-2xl border border-border/50 bg-background/80 p-3 sm:p-4 shadow-sm min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fun-green/10 text-fun-green flex-shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold tracking-widest text-muted-foreground">WhatsApp Alerts</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">{whatsappOptIn ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-24 sm:space-y-12 lg:space-y-16">
          <TabsList className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-muted/50 p-1 sm:flex sm:flex-wrap sm:gap-2 md:flex-nowrap md:overflow-x-auto lg:overflow-visible">
            {SETTINGS_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex w-full items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-medium transition focus-visible:outline-none data-[state=active]:bg-blaze-orange data-[state=active]:text-white data-[state=active]:shadow sm:flex-auto sm:px-4 sm:py-2 sm:text-sm md:w-auto"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile" className="focus-visible:outline-none">
            <Card className="border border-border/40 bg-card shadow-lg">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl sm:text-2xl">Profile</CardTitle>
                  <CardDescription>Personal information used across the platform.</CardDescription>
                </div>
                <UserRound className="h-8 w-8 text-primary/60" />
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form onSubmit={updateProfile} className="space-y-6">
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border border-blaze-orange bg-background shadow">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt={heroName} />
                        ) : (
                          <AvatarFallback className="text-base">{initials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-foreground">Profile photo</p>
                        <p className="text-xs text-muted-foreground">PNG or JPG up to 5MB.</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProfileBusy}
                      >
                        {avatarUploading ? "Uploading..." : "Choose image"}
                      </Button>
                      {avatarFile ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-2xl"
                          onClick={handleRemoveAvatar}
                          disabled={isProfileBusy}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Jane Doe"
                        autoComplete="name"
                        defaultValue={user?.name ?? ""}
                        disabled={isProfileBusy}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        defaultValue={user?.email ?? ""}
                        disabled
                        className="rounded-2xl bg-muted/50 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">
                        Contact support to change your email address
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+232 00 000 000"
                        autoComplete="tel"
                        defaultValue={user?.phone ?? ""}
                        disabled={isProfileBusy}
                        className="rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">WhatsApp notifications</p>
                      <p className="text-xs text-muted-foreground">Receive campaign updates and important alerts via WhatsApp.</p>
                    </div>
                    <Switch
                      checked={whatsappOptIn}
                      onCheckedChange={(checked) => setWhatsappOptIn(Boolean(checked))}
                      disabled={isProfileBusy}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isProfileBusy} className="rounded-2xl">
                      {profileLoading ? "Saving..." : "Save profile"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="focus-visible:outline-none">
            <Card className="border border-border/40 bg-card shadow-lg">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl sm:text-2xl">Password & Security</CardTitle>
                  <CardDescription>Choose a strong password to secure your account.</CardDescription>
                </div>
                <KeyRound className="h-8 w-8 text-primary/60" />
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form onSubmit={updatePassword} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="currentPassword">Current password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          autoComplete="current-password"
                          disabled={passwordLoading}
                          className="rounded-2xl"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          disabled={passwordLoading}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Create a new password"
                          autoComplete="new-password"
                          disabled={passwordLoading}
                          className="rounded-2xl"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          disabled={passwordLoading}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repeat new password"
                          autoComplete="new-password"
                          disabled={passwordLoading}
                          className="rounded-2xl"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          disabled={passwordLoading}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:text-sm">
                    <p>Make sure your password is at least 8 characters long and includes a mix of letters, numbers and symbols.</p>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={passwordLoading} className="rounded-2xl">
                      {passwordLoading ? "Saving..." : "Update password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

{/* Payouts tab commented out for now
          <TabsContent value="payouts" className="focus-visible:outline-none">
            <Card className="border border-border/40 bg-card shadow-lg">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl sm:text-2xl">Payout Details</CardTitle>
                  <CardDescription>Add payment information for faster withdrawals.</CardDescription>
                </div>
                <Wallet className="h-8 w-8 text-primary/60" />
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form onSubmit={updatePayouts} className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Mobile money</p>
                    <p className="text-xs text-muted-foreground">Funds will be routed to this account when you select mobile money withdrawals.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="mm_provider">Provider</Label>
                      <Input
                        id="mm_provider"
                        name="mm_provider"
                        placeholder="e.g. Orange Money"
                        defaultValue={user?.payoutPreferences?.mobileMoney?.provider ?? ""}
                        disabled={loading || payoutsLoading}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mm_msisdn">Number</Label>
                      <Input
                        id="mm_msisdn"
                        name="mm_msisdn"
                        placeholder="+232 00 000 000"
                        defaultValue={user?.payoutPreferences?.mobileMoney?.msisdn ?? ""}
                        disabled={loading || payoutsLoading}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mm_name">Account name</Label>
                      <Input
                        id="mm_name"
                        name="mm_name"
                        placeholder="Registered account name"
                        defaultValue={user?.payoutPreferences?.mobileMoney?.accountName ?? ""}
                        disabled={loading || payoutsLoading}
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Bank account</p>
                    <p className="text-xs text-muted-foreground">Provide bank information for larger withdrawals or settlements.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank name</Label>
                      <Input
                        id="bank_name"
                        name="bank_name"
                        placeholder="Bank name"
                        defaultValue={user?.payoutPreferences?.bank?.bankName ?? ""}
                        disabled={loading || payoutsLoading}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_number">Account number</Label>
                      <Input
                        id="bank_number"
                        name="bank_number"
                        placeholder="XXXX XXXX XXXX"
                        defaultValue={user?.payoutPreferences?.bank?.accountNumber ?? ""}
                        disabled={loading || payoutsLoading}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_acc_name">Account name</Label>
                      <Input
                        id="bank_acc_name"
                        name="bank_acc_name"
                        placeholder="Account holder name"
                        defaultValue={user?.payoutPreferences?.bank?.accountName ?? ""}
                        disabled={loading || payoutsLoading}
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading || payoutsLoading} className="rounded-2xl">
                      {payoutsLoading ? "Saving..." : "Save payout details"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
*/}

          <TabsContent value="address" className="focus-visible:outline-none">
            <Card className="border border-border/40 bg-card shadow-lg">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl sm:text-2xl">Address</CardTitle>
                  <CardDescription>Let supporters know where you operate from.</CardDescription>
                </div>
                <MapPin className="h-8 w-8 text-primary/60" />
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form onSubmit={updateAddress} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="Country"
                      defaultValue={user?.address?.country ?? ""}
                      disabled={loading || addressLoading}
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="City"
                      defaultValue={user?.address?.city ?? ""}
                      disabled={loading || addressLoading}
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading || addressLoading} className="rounded-2xl">
                      {addressLoading ? "Saving..." : "Save address"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="focus-visible:outline-none">
            <Card className="border border-border/40 bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Need a hand?</CardTitle>
                <CardDescription>Our support desk can help you verify documents, manage payouts, or troubleshoot your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send an email to <a href="mailto:support@ib4me.com" className="font-semibold text-primary hover:underline">support@ib4me.com</a> and we will respond within 24 hours. For urgent payout questions call <span className="font-semibold">+232 30 000 000</span>.
                </p>
                <Button variant="outline" className="w-full rounded-2xl" asChild>
                  <a href="mailto:ib4me.organisation@gmail.com">Contact support</a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}

