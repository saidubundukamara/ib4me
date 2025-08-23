import { Badge } from '@/components/ui/badge';
import type React from 'react';
import { useState } from 'react';
import {
  Bell,
  CreditCard,
  Mail,
  SettingsIcon,
  User,
  UserCog,
  Shield,
  Upload,
  Check,
  DollarSign,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Navbar } from '@/components/utils/Navbar';
import Footer from '@/components/utils/Footer';

const userData = {
  id: '',
  name: '',
  email: '',
  profileImage: '',
  bio: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  notifications: {
    email: true,
    push: true,
    sms: false,
    newsletter: true,
    campaignUpdates: true,
    donationReceipts: true,
    marketingOffers: false,
  },
  paymentMethods: [{ id: '', type: '', last4: '', brand: '', expMonth: 12, expYear: 2025 }],
  accountCreated: '',
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    name: userData.name,
    email: userData.email,
    bio: userData.bio,
    profileImage: userData.profileImage,
  });

  const [personalData, setPersonalData] = useState({
    phone: userData.phone,
    street: userData.address.street,
    city: userData.address.city,
    state: userData.address.state,
    zipCode: userData.address.zipCode,
    country: userData.address.country,
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState(userData.notifications);

  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage('Profile updated successfully');
      toast('Profile updated', {
        description: 'Your profile information has been updated successfully.',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1000);
  };

  // Handle personal information form submission
  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage('Personal information updated successfully');
      toast('Information updated', {
        description: 'Your personal information has been updated successfully.',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1000);
  };

  // Handle security form submission
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast("Passwords don't match", {
        description: 'Your new password and confirmation password do not match.',
        action: {
          label: 'destructive',
          onClick: () => console.log('Undo'),
        },
      });
      return;
    }

    if (securityData.newPassword.length < 8) {
      toast('Password too short', {
        description: 'Your password must be at least 8 characters long.',
        action: {
          label: 'destructive',
          onClick: () => console.log('Undo'),
        },
      });
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage('Password updated successfully');
      toast('Password updated', {
        description: 'Your password has been updated successfully.',
      });

      // Reset form
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1000);
  };

  // Handle notification settings submission
  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage('Notification preferences updated successfully');
      toast('Preferences updated', {
        description: 'Your notification preferences have been updated successfully.',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1000);
  };

  // Handle profile image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileData({
        ...profileData,
        profileImage: imageUrl,
      });

      toast('Image uploaded', {
        description: 'Your profile image has been updated.',
      });
    }
  };

  const sidebarNavItems = [
    {
      title: 'Profile',
      icon: <User className="h-4 w-4" />,
      value: 'profile',
    },
    {
      title: 'Personal Information',
      icon: <UserCog className="h-4 w-4" />,
      value: 'personal',
    },
    {
      title: 'Security',
      icon: <Shield className="h-4 w-4" />,
      value: 'security',
    },
    {
      title: 'Notifications',
      icon: <Bell className="h-4 w-4" />,
      value: 'notifications',
    },
    {
      title: 'Payment Methods',
      icon: <CreditCard className="h-4 w-4" />,
      value: 'payment',
    },
    {
      title: 'Account',
      icon: <SettingsIcon className="h-4 w-4" />,
      value: 'account',
    },
  ];

  return (
    <>
      <Navbar />
      <div className=" py-10 container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10 py-8">
          {/* Sidebar Navigation */}
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-15rem)] w-full shrink-0 md:sticky md:block border rounded-2xl p-4 md:pr-6">
            <nav className="grid items-start gap-2">
              {sidebarNavItems.map((item) => (
                <Button
                  key={item.value}
                  variant={activeTab === item.value ? 'default' : 'ghost'}
                  className="justify-start"
                  onClick={() => setActiveTab(item.value)}
                >
                  {item.icon}
                  <span className="ml-2">{item.title}</span>
                </Button>
              ))}
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <div className="flex items-center justify-between md:hidden mb-6">
            <h1 className="text-sm font-Lora sm:texl-lg font-bold tracking-tight">Settings</h1>
            <Select value={activeTab} onValueChange={(value) => setActiveTab(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sidebarNavItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Main Content */}
          <main className="flex w-full flex-col overflow-hidden">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-Lora font-bold tracking-tight">
                    Profile
                  </h3>
                  <p className="text-muted-foreground font-pt-serif">
                    Manage your public profile information.
                  </p>
                </div>

                {successMessage && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleProfileSubmit}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your profile details and public information.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="relative">
                            <Avatar className="h-24 w-24">
                              <AvatarImage src={profileData.profileImage} alt={profileData.name} />
                              <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2">
                              <Label htmlFor="profile-image" className="cursor-pointer">
                                <div className="rounded-full bg-primary p-1 text-white">
                                  <Upload className="h-4 w-4" />
                                </div>
                              </Label>
                              <Input
                                id="profile-image"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">JPG, PNG or GIF. 1MB max.</p>
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name" className="font-Lora">
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              value={profileData.name}
                              onChange={(e) =>
                                setProfileData({ ...profileData, name: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="email" className="font-Lora">
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={profileData.email}
                              onChange={(e) =>
                                setProfileData({ ...profileData, email: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="bio" className="font-Lora">
                              Bio
                            </Label>
                            <Textarea
                              id="bio"
                              value={profileData.bio}
                              onChange={(e) =>
                                setProfileData({ ...profileData, bio: e.target.value })
                              }
                              placeholder="Tell others about yourself and your fundraising mission"
                              className="min-h-[120px]"
                            />
                            <p className="text-xs text-muted-foreground">
                              This will be displayed on your public profile and campaign pages.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" disabled={loading} className="font-Lora">
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </div>
            )}

            {/* Personal Information Settings */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-Lora font-bold tracking-tight">
                    Personal Information
                  </h3>
                  <p className="text-muted-foreground font-pt-serif">
                    Manage your personal contact information and address.
                  </p>
                </div>

                {successMessage && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handlePersonalSubmit}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                      <CardDescription>
                        Update your contact details and address information.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="phone" className="font-Lora">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={personalData.phone}
                            onChange={(e) =>
                              setPersonalData({ ...personalData, phone: e.target.value })
                            }
                          />
                        </div>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-3">Address</h4>
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="street" className="font-Lora">
                                Street Address
                              </Label>
                              <Input
                                id="street"
                                value={personalData.street}
                                onChange={(e) =>
                                  setPersonalData({ ...personalData, street: e.target.value })
                                }
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="city" className="font-Lora">
                                  City
                                </Label>
                                <Input
                                  id="city"
                                  value={personalData.city}
                                  onChange={(e) =>
                                    setPersonalData({ ...personalData, city: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="state" className="font-Lora">
                                  State / Province
                                </Label>
                                <Input
                                  id="state"
                                  value={personalData.state}
                                  onChange={(e) =>
                                    setPersonalData({ ...personalData, state: e.target.value })
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="zipCode" className="font-Lora">
                                  ZIP / Postal Code
                                </Label>
                                <Input
                                  id="zipCode"
                                  value={personalData.zipCode}
                                  onChange={(e) =>
                                    setPersonalData({ ...personalData, zipCode: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="country" className="font-Lora">
                                  Country
                                </Label>
                                <Select
                                  value={personalData.country}
                                  onValueChange={(value) =>
                                    setPersonalData({ ...personalData, country: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="United States">United States</SelectItem>
                                    <SelectItem value="Canada">Canada</SelectItem>
                                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                    <SelectItem value="Australia">Australia</SelectItem>
                                    <SelectItem value="Germany">Germany</SelectItem>
                                    <SelectItem value="France">France</SelectItem>
                                    <SelectItem value="Japan">Japan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" disabled={loading} className="font-Lora">
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-Lora font-bold tracking-tight">
                    Security
                  </h3>
                  <p className="text-muted-foreground font-pt-serif">
                    Manage your account security and password.
                  </p>
                </div>

                {successMessage && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSecuritySubmit}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password" className="font-Lora">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={securityData.currentPassword}
                          onChange={(e) =>
                            setSecurityData({ ...securityData, currentPassword: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="new-password" className="font-Lora">
                          New Password
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={securityData.newPassword}
                          onChange={(e) =>
                            setSecurityData({ ...securityData, newPassword: e.target.value })
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 8 characters long and include a mix of letters,
                          numbers, and symbols.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password" className="font-Lora">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={securityData.confirmPassword}
                          onChange={(e) =>
                            setSecurityData({ ...securityData, confirmPassword: e.target.value })
                          }
                          required
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" disabled={loading} className="font-Lora">
                        {loading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Authenticator App</h4>
                        <p className="text-sm text-muted-foreground">
                          Use an authenticator app to generate one-time codes.
                        </p>
                      </div>
                      <Button variant="outline">Set Up</Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">SMS Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive a code via SMS to verify your identity.
                        </p>
                      </div>
                      <Button variant="outline">Set Up</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Login History</CardTitle>
                    <CardDescription>Recent login activity on your account.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">San Francisco, CA, USA</p>
                          <p className="text-xs text-muted-foreground">
                            Today, 10:30 AM • Chrome on macOS
                          </p>
                        </div>
                        <Badge>Current</Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="link" className="px-0">
                      View All Login Activity
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-Lora font-bold tracking-tight">
                    Notifications
                  </h3>
                  <p className="text-muted-foreground font-pt-serif">
                    Manage how and when you receive notifications.
                  </p>
                </div>

                {successMessage && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleNotificationSubmit}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Channels</CardTitle>
                      <CardDescription>
                        Choose how you'd like to receive notifications.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Label
                            htmlFor="email-notifications"
                            className="text-sm font-medium font-Lora"
                          >
                            Email Notifications
                          </Label>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notificationSettings.email}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, email: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <Label
                            htmlFor="push-notifications"
                            className="text-sm font-medium font-Lora"
                          >
                            Push Notifications
                          </Label>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={notificationSettings.push}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, push: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Label
                            htmlFor="sms-notifications"
                            className="text-sm font-medium font-Lora"
                          >
                            SMS Notifications
                          </Label>
                        </div>
                        <Switch
                          id="sms-notifications"
                          checked={notificationSettings.sms}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, sms: checked })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Choose what types of notifications you want to receive.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Campaign Updates</p>
                          <p className="text-xs text-muted-foreground">
                            Receive updates about campaigns you've created or donated to.
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.campaignUpdates}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              campaignUpdates: checked,
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Donation Receipts</p>
                          <p className="text-xs text-muted-foreground">
                            Receive receipts for your donations.
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.donationReceipts}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              donationReceipts: checked,
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Newsletter</p>
                          <p className="text-xs text-muted-foreground">
                            Receive our monthly newsletter with fundraising tips and success
                            stories.
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.newsletter}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              newsletter: checked,
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Marketing Offers</p>
                          <p className="text-xs text-muted-foreground">
                            Receive special offers and promotions from our partners.
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.marketingOffers}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              marketingOffers: checked,
                            })
                          }
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </div>
            )}

            {/* Payment Methods Settings */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-Lora font-bold tracking-tight">
                    Payment Methods
                  </h3>
                  <p className="text-muted-foreground">
                    Manage your payment methods for donations and campaign withdrawals.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Payment Methods</CardTitle>
                    <CardDescription>Manage your saved payment methods.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userData.paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between border rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          {method.brand === 'Visa' ? (
                            <div className="h-8 w-12 bg-blue-600 rounded text-white flex items-center justify-center text-sm font-bold">
                              VISA
                            </div>
                          ) : (
                            <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center text-sm font-bold">
                              CARD
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {method.brand} •••• {method.last4}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expires {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Add New Payment Method
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payout Methods</CardTitle>
                    <CardDescription>
                      Manage how you receive funds from your campaigns.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Bank Account (Primary)</p>
                          <p className="text-xs text-muted-foreground">Chase Bank •••• 5678</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>

                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Payout Method
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-Lora font-bold tracking-tight">
                    Account
                  </h3>
                  <p className="text-muted-foreground font-pt-serif">
                    Manage your account settings and preferences.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>View and manage your account details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Account ID</p>
                        <p className="text-sm font-medium">{userData.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="text-sm font-medium">
                          {new Date(userData.accountCreated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Language Preference</h4>
                      <Select defaultValue="en-US">
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-GB">English (UK)</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Time Zone</h4>
                      <Select defaultValue="America/Los_Angeles">
                        <SelectTrigger>
                          <SelectValue placeholder="Select time zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            Mountain Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time (US & Canada)
                          </SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Control your privacy preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Profile Visibility</p>
                        <p className="text-xs text-muted-foreground">
                          Allow others to see your profile and donation activity.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Anonymous Donations</p>
                        <p className="text-xs text-muted-foreground">
                          Make all your donations anonymous by default.
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Data Sharing</p>
                        <p className="text-xs text-muted-foreground">
                          Allow us to share anonymized data for research purposes.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible and destructive actions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Download Your Data</p>
                        <p className="text-xs text-muted-foreground">
                          Get a copy of all your personal data.
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Deactivate Account</p>
                        <p className="text-xs text-muted-foreground">
                          Temporarily disable your account.
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Deactivate
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-destructive">Delete Account</p>
                        <p className="text-xs text-muted-foreground">
                          Permanently delete your account and all data. This action cannot be
                          undone.
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
      <Toaster />
    </>
  );
};

export default Settings;
