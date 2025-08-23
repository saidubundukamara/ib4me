import type React from 'react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Navbar } from '@/components/utils/Navbar';
import Footer from '@/components/utils/Footer';

const Settings = () => {
  const navigate = useNavigate();

  const { id: campaignId } = useParams<{ id: string }>();

  const campaign = {
    id: Number.parseInt(campaignId || '0'),
    title: "Help Sarah's Cancer Treatment",
    description:
      'Sarah needs support for her ongoing cancer treatment. Your donation will help cover medical costs.',
    category: 'Cancer Treatment',
    goal: 25000,
    endDate: '2024-06-15',
    visibility: 'public',
    allowComments: true,
    showDonorNames: true,
    showDonationAmounts: true,
    enableTeamFundraising: false,
    enableMatchingDonations: false,
    thankYouMessage:
      'Thank you so much for your generous donation! Your support means the world to Sarah and her family during this difficult time.',
    notificationEmails: ['sarah@example.com'],
    socialSharing: {
      facebook: true,
      twitter: true,
      instagram: false,
      linkedin: false,
    },
  };

  const [formData, setFormData] = useState(campaign);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEndCampaignDialog, setShowEndCampaignDialog] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSocialSharingChange = (platform: string, checked: boolean) => {
    setFormData({
      ...formData,
      socialSharing: {
        ...formData.socialSharing,
        [platform]: checked,
      },
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      toast('Settings saved', {
        description: 'Your campaign settings have been updated successfully.',
      });
    }, 1000);
  };

  const handleDeleteCampaign = () => {
    toast.success('Campaign deleted', {
      description: 'Your campaign has been deleted successfully.',
    });
    navigate('/my-campaigns');
  };

  const handleEndCampaign = () => {
    toast('Campaign ended', {
      description: 'Your campaign has been ended successfully.',
    });
    navigate('/my-campaigns');
  };

  return (
    <div>
      <Navbar />
      <main className="flex-1 py-12 sm:py-16">
        <div className="container max-w-5xl mx-auto px-4 md:px-6">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to={`/campaign/${campaignId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaign
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Campaign Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage and configure your campaign settings
            </p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSaveSettings}>
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Update your campaign's basic information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Campaign Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Campaign Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleSelectChange('category', value)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cancer Treatment">Cancer Treatment</SelectItem>
                          <SelectItem value="Heart Surgery">Heart Surgery</SelectItem>
                          <SelectItem value="Pediatric Care">Pediatric Care</SelectItem>
                          <SelectItem value="Rehabilitation">Rehabilitation</SelectItem>
                          <SelectItem value="Surgery">Surgery</SelectItem>
                          <SelectItem value="Other Medical">Other Medical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="goal">Fundraising Goal ($)</Label>
                      <Input
                        id="goal"
                        name="goal"
                        type="number"
                        value={formData.goal}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thank You Message</CardTitle>
                    <CardDescription>
                      Customize the message that donors receive after contributing to your campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      id="thankYouMessage"
                      name="thankYouMessage"
                      rows={4}
                      value={formData.thankYouMessage}
                      onChange={handleInputChange}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visibility" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Visibility</CardTitle>
                    <CardDescription>
                      Control who can see your campaign and how it appears
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="visibility">Visibility Setting</Label>
                      <Select
                        value={formData.visibility}
                        onValueChange={(value) => handleSelectChange('visibility', value)}
                      >
                        <SelectTrigger id="visibility">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public - Anyone can find and view</SelectItem>
                          <SelectItem value="unlisted">
                            Unlisted - Only accessible via direct link
                          </SelectItem>
                          <SelectItem value="private">
                            Private - Only visible to you and team members
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showDonorNames">Show Donor Names</Label>
                        <p className="text-sm text-muted-foreground">
                          Display the names of people who donate to your campaign
                        </p>
                      </div>
                      <Switch
                        id="showDonorNames"
                        checked={formData.showDonorNames}
                        onCheckedChange={(checked) => handleSwitchChange('showDonorNames', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showDonationAmounts">Show Donation Amounts</Label>
                        <p className="text-sm text-muted-foreground">
                          Display the amount each donor contributes
                        </p>
                      </div>
                      <Switch
                        id="showDonationAmounts"
                        checked={formData.showDonationAmounts}
                        onCheckedChange={(checked) =>
                          handleSwitchChange('showDonationAmounts', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowComments">Allow Comments</Label>
                        <p className="text-sm text-muted-foreground">
                          Let supporters leave comments on your campaign
                        </p>
                      </div>
                      <Switch
                        id="allowComments"
                        checked={formData.allowComments}
                        onCheckedChange={(checked) => handleSwitchChange('allowComments', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Sharing</CardTitle>
                    <CardDescription>Configure social media sharing options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="facebook">Enable Facebook Sharing</Label>
                      <Switch
                        id="facebook"
                        checked={formData.socialSharing.facebook}
                        onCheckedChange={(checked) =>
                          handleSocialSharingChange('facebook', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="twitter">Enable Twitter Sharing</Label>
                      <Switch
                        id="twitter"
                        checked={formData.socialSharing.twitter}
                        onCheckedChange={(checked) => handleSocialSharingChange('twitter', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="instagram">Enable Instagram Sharing</Label>
                      <Switch
                        id="instagram"
                        checked={formData.socialSharing.instagram}
                        onCheckedChange={(checked) =>
                          handleSocialSharingChange('instagram', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="linkedin">Enable LinkedIn Sharing</Label>
                      <Switch
                        id="linkedin"
                        checked={formData.socialSharing.linkedin}
                        onCheckedChange={(checked) =>
                          handleSocialSharingChange('linkedin', checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Manage email notifications for your campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="notificationEmails">Notification Emails</Label>
                      <Input
                        id="notificationEmails"
                        placeholder="Enter email addresses separated by commas"
                        value={formData.notificationEmails.join(', ')}
                        onChange={(e) => {
                          const emails = e.target.value.split(',').map((email) => email.trim());
                          setFormData({
                            ...formData,
                            notificationEmails: emails,
                          });
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        These email addresses will receive notifications about donations and updates
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="space-y-0.5">
                        <Label>Donation Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive an email when someone donates to your campaign
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Comment Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive an email when someone comments on your campaign
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Goal Milestone Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive an email when your campaign reaches 25%, 50%, 75%, and 100% of its
                          goal
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Management</CardTitle>
                    <CardDescription>End or delete your campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">End Campaign</h3>
                      <p className="text-sm text-muted-foreground">
                        Ending your campaign will stop accepting new donations, but the campaign
                        will still be visible.
                      </p>
                      <AlertDialog
                        open={showEndCampaignDialog}
                        onOpenChange={setShowEndCampaignDialog}
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" type="button">
                            End Campaign
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>End Campaign</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to end this campaign? This will stop accepting
                              new donations. This action can be reversed by contacting support.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleEndCampaign}>
                              End Campaign
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium text-destructive">Delete Campaign</h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your campaign. This action cannot be undone.
                      </p>
                      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" type="button">
                            Delete Campaign
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this campaign? This action cannot be
                              undone and all campaign data will be permanently lost.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteCampaign}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete Campaign
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end mt-6">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Settings
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
