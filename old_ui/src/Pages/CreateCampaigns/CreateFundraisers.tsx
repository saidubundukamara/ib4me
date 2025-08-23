import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import { CheckCircle, Info, Plus, Upload, ArrowLeft, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import Logo from '../../assets/ib4me_logo.png';
import { toast } from 'sonner';
import { campaignService } from '@/services/supabaseService';
// Configure Cloudinary
const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
};

const CreateFundraisers = () => {

  const navigate = useNavigate();
  const { user } = usePrivy();

  // State to track Cloudinary URLs
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('basics');
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formComplete, setFormComplete] = useState({
    basics: false,
    story: false,
    photos: false,
    goal: false,
  });

  // Campaign form data
  const [campaignData, setCampaignData] = useState<{
    title: string;
    category: string;
    urgency: string;
    beneficiary: string;
    summary: string;
    story: string;
    coverImage: File | null;
    coverImageUrl: string | null;
    additionalImages: File[];
    additionalImageUrls: string[];
    videoUrl: string;
    goal: number;
    deadline: string;
    privacy: string;
    showDonors: boolean;
    allowAnonymous: boolean;
    termsAgreed: boolean;
  }>({
    title: '',
    category: '',
    urgency: '',
    beneficiary: 'self',
    summary: '',
    story: '',
    coverImage: null,
    coverImageUrl: null,
    additionalImages: [],
    additionalImageUrls: [],
    videoUrl: '',
    goal: 5000,
    deadline: '',
    privacy: 'public',
    showDonors: true,
    allowAnonymous: true,
    termsAgreed: false,
  });

  // Handle image uploads
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  // Function to upload image to Cloudinary
  
  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData); // helpful for debugging
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      toast('Upload failed', {
        description: 'Failed to upload image. Please try again.',
      });
      return null;
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show local preview immediately
      const localPreviewUrl = URL.createObjectURL(file);
      setCoverImagePreview(localPreviewUrl);
      setCampaignData({ ...campaignData, coverImage: file });

      toast('Uploading image...', {
        description: 'Please wait while we upload your image.',
      });

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file);
      if (cloudinaryUrl) {
        setCoverImageUrl(cloudinaryUrl);
        setCampaignData((prev) => ({ ...prev, coverImageUrl: cloudinaryUrl }));

        toast('Image uploaded', {
          description: 'Your cover image has been uploaded successfully.',
        });
      }
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      const newImagePreviews = newImages.map((file) => URL.createObjectURL(file));

      // Update UI with local previews immediately
      setAdditionalImagePreviews([...additionalImagePreviews, ...newImagePreviews]);
      setCampaignData({
        ...campaignData,
        additionalImages: [...campaignData.additionalImages, ...newImages],
      });

      toast('Uploading images...', {
        description: `Please wait while we upload ${files.length} images.`,
      });

      // Upload each image to Cloudinary
      const uploadPromises = newImages.map((file) => uploadToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      // Filter out any failed uploads
      const successfulUrls = uploadedUrls.filter((url) => url !== null) as string[];

      // Update state with Cloudinary URLs
      setAdditionalImageUrls((prev) => [...prev, ...successfulUrls]);
      setCampaignData((prev) => ({
        ...prev,
        additionalImageUrls: [...(prev.additionalImageUrls || []), ...successfulUrls],
      }));

      toast('Images uploaded', {
        description: `${successfulUrls.length} additional images have been uploaded.`,
      });
    }
  };

  const removeAdditionalImage = (index: number) => {
    const updatedPreviews = [...additionalImagePreviews];
    const updatedImages = [...campaignData.additionalImages];
    const updatedUrls = [...(campaignData.additionalImageUrls || [])];

    updatedPreviews.splice(index, 1);
    updatedImages.splice(index, 1);
    if (updatedUrls.length > index) {
      updatedUrls.splice(index, 1);
    }

    setAdditionalImagePreviews(updatedPreviews);
    setAdditionalImageUrls(updatedUrls);
    setCampaignData({
      ...campaignData,
      additionalImages: updatedImages,
      additionalImageUrls: updatedUrls,
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Calculate completion percentage for preview
  const calculateCompletionPercentage = () => {
    let completed = 0;
    let total = 0;

    // Basics section
    if (campaignData.title) completed++;
    if (campaignData.category) completed++;
    if (campaignData.urgency) completed++;
    if (campaignData.beneficiary) completed++;
    total += 4;

    // Story section
    if (campaignData.summary) completed++;
    if (campaignData.story) completed++;
    total += 2;

    // Photos section
    if (coverImagePreview) completed++;
    total += 1;

    // Goal section
    if (campaignData.goal > 0) completed++;
    if (campaignData.deadline) completed++;
    if (campaignData.termsAgreed) completed++;
    total += 3;

    return Math.round((completed / total) * 100);
  };

  // Mock function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate form
      if (
        !campaignData.title ||
        !campaignData.category ||
        !campaignData.summary ||
        !campaignData.story ||
        //!coverImagePreview ||
        !campaignData.deadline
      ) {
        toast('Missing information', {
          description: 'Please fill in all required fields before submitting.',
          action: {
            label: 'destructive',
            onClick: () => console.log('Undo'),
          },
        });
        return;
      }

      if (!campaignData.termsAgreed) {
        toast('Terms agreement required', {
          description: 'You must agree to the terms of service to create a campaign.',
          action: {
            label: 'destructive',
            onClick: () => console.log('Undo'),
          },
        });
        return;
      }
      console.log('Form data:', campaignData); // Add this line for debugging

      // Convert camelCase to snake_case for database compatibility
      const fullCampaignData = {
        title: campaignData.title,
        category: campaignData.category,
        urgency: campaignData.urgency,
        beneficiary: campaignData.beneficiary,
        summary: campaignData.summary,
        story: campaignData.story,
        cover_image_url: campaignData.coverImageUrl,
        additional_image_urls: campaignData.additionalImageUrls,
        video_url: campaignData.videoUrl,
        goal: campaignData.goal,
        deadline: campaignData.deadline,
        privacy: campaignData.privacy,
        show_donors: campaignData.showDonors,
        allow_anonymous: campaignData.allowAnonymous,
        terms_agreed: campaignData.termsAgreed,
        privy_user_id: user.id,
        status: 'submitted' as 'submitted',
      };

      console.log('Full Campaign Data:', fullCampaignData); // Add this line for debugging

      const campaign = await campaignService.createCampaign(fullCampaignData);

      toast('Campaign created!', {
        description: 'Your campaign has been created successfully.',
      });

      navigate('/my-campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div>
      <header className="border-b">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex font-Lora text-sm sm:text-lg items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button type="button">
              <Link to="#">Save as Draft</Link>
            </Button>
            <Button
              variant="outline"
              onClick={togglePreview}
              className="hidden md:flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={Logo} alt="ib4me logo" className="w-34 h-24 object-contain" />
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 py-10">
        <div
          className={`container mx-auto px-4 md:px-6 ${showPreview ? 'max-w-7xl' : 'max-w-5xl'}`}
        >
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl font-Lora sm:text-3xl font-bold tracking-tight">
                Create Your Campaign
              </h1>
              <p className="text-muted-foreground text-sm sm:text-lg font-lexend-deca mt-1">
                Let's start your healthcare fundraiser in just a few easy steps
              </p>
            </div>
            {/* Mobile Preview Toggle */}
            <div className="md:hidden">
              <Button variant="outline" className="w-full" onClick={togglePreview}>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Preview Campaign'}
              </Button>
            </div>
          </div>
          <div className={`grid ${showPreview ? 'md:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
            {/* Form Section */}
            <div className={`${showPreview && 'md:col-span-1'}`}>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 gap-2 md:grid-cols-4 my-2">
                  <TabsTrigger value="basics" className="flex items-center gap-2 font-Lora ">
                    {formComplete.basics && <CheckCircle className="h-4 w-4 text-primary" />}
                    Basics
                  </TabsTrigger>
                  <TabsTrigger value="story" className="flex items-center gap-2 font-Lora">
                    {formComplete.story && <CheckCircle className="h-4 w-4 text-primary" />}
                    Story
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="flex items-center gap-2 font-Lora">
                    {formComplete.photos && <CheckCircle className="h-4 w-4 text-primary" />}
                    Photos & Media
                  </TabsTrigger>
                  <TabsTrigger value="goal" className="flex items-center gap-2 font-Lora">
                    {formComplete.goal && <CheckCircle className="h-4 w-4 text-primary" />}
                    Goal & Settings
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="basics">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-poppins">Campaign Basics</CardTitle>
                        <CardDescription className="font-pt-serif">
                          Let's start with the core information about your campaign
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="campaign-title">Campaign Title</Label>
                            <Input
                              id="campaign-title"
                              value={campaignData.title}
                              onChange={(e) =>
                                setCampaignData({ ...campaignData, title: e.target.value })
                              }
                              placeholder="e.g., Help Sarah's Cancer Treatment"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="campaign-category">Campaign Category</Label>
                            <Select
                              value={campaignData.category}
                              onValueChange={(value) =>
                                setCampaignData({ ...campaignData, category: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cancer">Cancer Treatment</SelectItem>
                                <SelectItem value="heart">Heart Care</SelectItem>
                                <SelectItem value="pediatric">Pediatric Care</SelectItem>
                                <SelectItem value="mental-health">Mental Health</SelectItem>
                                <SelectItem value="surgery">Surgery</SelectItem>
                                <SelectItem value="medications">Medications</SelectItem>
                                <SelectItem value="disability">Disability Support</SelectItem>
                                <SelectItem value="general">General Medical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="campaign-urgency">Urgency Level</Label>
                            <Select
                              value={campaignData.urgency}
                              onValueChange={(value) =>
                                setCampaignData({ ...campaignData, urgency: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an Urgency Level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cancer">Low</SelectItem>
                                <SelectItem value="heart">Medium</SelectItem>
                                <SelectItem value="pediatric">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="beneficiary">Beneficiary</Label>
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="radio"
                                  id="self"
                                  name="beneficiary"
                                  value="self"
                                  checked={campaignData.beneficiary === 'self'}
                                  onChange={() =>
                                    setCampaignData({ ...campaignData, beneficiary: 'self' })
                                  }
                                  className="h-4 w-4 accent-green-300"
                                />
                                <Label htmlFor="self" className="cursor-pointer">
                                  I'm raising funds for myself
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="radio"
                                  id="someone"
                                  name="beneficiary"
                                  checked={campaignData.beneficiary === 'someone'}
                                  onChange={() =>
                                    setCampaignData({ ...campaignData, beneficiary: 'someone' })
                                  }
                                  value="someone"
                                  className="h-4 w-4 accent-green-300"
                                />
                                <Label htmlFor="someone" className="cursor-pointer">
                                  I'm raising funds for someone else
                                </Label>
                              </div>
                            </div>
                          </div>

                          <Button
                            type="button"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              setFormComplete({ ...formComplete, basics: true });
                              setActiveTab('story');
                            }}
                          >
                            Continue to Story
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="story">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-poppins">Your Story</CardTitle>
                        <CardDescription className="font-pt-serif">
                          Tell potential donors why they should contribute to your campaign
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="campaign-summary">Campaign Summary</Label>
                            <Input
                              id="campaign-summary"
                              placeholder="A brief one-line summary of your campaign"
                              value={campaignData.summary}
                              onChange={(e) =>
                                setCampaignData({ ...campaignData, summary: e.target.value })
                              }
                              maxLength={100}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              This will appear on search results and social shares (max 100
                              characters)
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="campaign-story">Tell Your Story</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <Info className="h-4 w-4" />
                                      <span className="sr-only">Campaign story tips</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="w-80">
                                    <p>
                                      Be clear, specific, and personal. Share the health situation,
                                      what the funds will be used for, and why it matters.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Textarea
                              id="campaign-story"
                              placeholder="Share your story in detail..."
                              value={campaignData.story}
                              onChange={(e) =>
                                setCampaignData({ ...campaignData, story: e.target.value })
                              }
                              className="min-h-[200px]"
                              required
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setActiveTab('basics')}>
                              Back
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                setFormComplete({ ...formComplete, story: true });
                                setActiveTab('photos');
                              }}
                            >
                              Continue to Photos
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="photos">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-poppins">Photos & Media</CardTitle>
                        <CardDescription className="font-pt-serif">
                          Add visual content to make your campaign more compelling
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4">
                          <div className="space-y-2">
                            <Label>Cover Photo</Label>
                            {coverImagePreview ? (
                              <div className="relative rounded-lg overflow-hidden">
                                <img
                                  src={coverImagePreview || '/placeholder.svg'}
                                  alt="Cover preview"
                                  width={600}
                                  height={315}
                                  className="w-full h-[200px] object-cover"
                                />
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                  onClick={() => {
                                    setCoverImagePreview(null);
                                    setCampaignData({ ...campaignData, coverImage: null });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  document.getElementById('cover-photo')?.click();
                                }}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <p className="font-medium">Upload your main campaign image</p>
                                  <p className="text-xs text-muted-foreground">
                                    Recommended size: 1200 x 630 pixels. Max file size: 5MB.
                                  </p>
                                  <Input
                                    type="file"
                                    id="cover-photo"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleCoverImageUpload}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      document.getElementById('cover-photo')?.click();
                                    }}
                                  >
                                    Select Image
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Additional Photos (Optional)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                              {additionalImagePreviews.map((image, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden">
                                  <img
                                    src={image || '/placeholder.svg'}
                                    alt={`Additional image ${index + 1}`}
                                    width={200}
                                    height={150}
                                    className="w-full h-[100px] object-cover"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                                    onClick={() => removeAdditionalImage(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              {additionalImagePreviews.length < 5 && (
                                <div
                                  className="border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors h-[100px]"
                                  onClick={() =>
                                    document.getElementById('additional-photos')?.click()
                                  }
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <Plus className="h-6 w-6 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Add Photo</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <Input
                              type="file"
                              id="additional-photos"
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={handleAdditionalImagesUpload}
                            />
                            <p className="text-xs text-muted-foreground">
                              You can upload up to 5 additional images.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="video-url">Video URL (Optional)</Label>
                            <Input
                              id="video-url"
                              value={campaignData.videoUrl}
                              onChange={(e) =>
                                setCampaignData({ ...campaignData, videoUrl: e.target.value })
                              }
                              placeholder="e.g., https://youtube.com/watch?v=..."
                            />
                            <p className="text-xs text-muted-foreground">
                              You can add a YouTube or Vimeo video link to enhance your story
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setActiveTab('story')}>
                              Back
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                setFormComplete({ ...formComplete, photos: true });
                                setActiveTab('goal');
                              }}
                            >
                              Continue to Goal
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="goal">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-poppins">Fundraising Goal & Settings</CardTitle>
                        <CardDescription className="font-pt-serif">
                          Set your fundraising target and manage campaign settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                          <div className="space-y-2">
                            <Label htmlFor="goal-amount">Fundraising Goal ($)</Label>
                            <Input
                              id="goal-amount"
                              type="number"
                              value={campaignData.goal}
                              onChange={(e) =>
                                setCampaignData({ ...campaignData, goal: Number(e.target.value) })
                              }
                              placeholder="e.g., 10000"
                              min="100"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter the total amount you hope to raise (minimum $100)
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="campaign-deadline">Campaign Deadline</Label>
                            <Input
                              id="campaign-deadline"
                              value={campaignData.deadline}
                              onChange={(e) =>
                                setCampaignData({ ...campaignData, deadline: e.target.value })
                              }
                              type="date"
                              required
                            />
                          </div>

                          <Separator className="my-6" />

                          <div className="space-y-2">
                            <Label>Campaign Privacy</Label>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="radio"
                                  id="public"
                                  checked={campaignData.privacy === 'public'}
                                  onChange={() =>
                                    setCampaignData({ ...campaignData, privacy: 'public' })
                                  }
                                  name="privacy"
                                  value="public"
                                  className="h-4 w-4 accent-green-300"
                                  defaultChecked
                                />
                                <Label htmlFor="public" className="cursor-pointer">
                                  Public - visible to everyone
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="radio"
                                  id="private"
                                  checked={campaignData.privacy === 'private'}
                                  onChange={() =>
                                    setCampaignData({ ...campaignData, privacy: 'private' })
                                  }
                                  name="privacy"
                                  value="private"
                                  className="h-4 w-4 accent-green-300"
                                />
                                <Label htmlFor="private" className="cursor-pointer">
                                  Private - only visible with direct link
                                </Label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Donation Display</Label>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id="show-donors"
                                  checked={campaignData.showDonors}
                                  onCheckedChange={(checked) =>
                                    setCampaignData({ ...campaignData, showDonors: checked })
                                  }
                                />
                                <Label htmlFor="show-donors" className="cursor-pointer">
                                  Show donor names and amounts
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  id="allow-anonymous"
                                  checked={campaignData.allowAnonymous}
                                  onCheckedChange={(checked) =>
                                    setCampaignData({ ...campaignData, allowAnonymous: checked })
                                  }
                                />
                                <Label htmlFor="allow-anonymous" className="cursor-pointer">
                                  Allow anonymous donations
                                </Label>
                              </div>
                            </div>
                          </div>
                          <Separator className="my-6" />
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Input
                              type="checkbox"
                              id="terms"
                              checked={campaignData.termsAgreed}
                              onChange={(e) =>
                                setCampaignData({ ...campaignData, termsAgreed: e.target.checked })
                              }
                              className="h-4 w-4 accent-green-300"
                              required
                            />
                            <Label
                              htmlFor="terms"
                              className="flex-1 text-xs sm:text-sm cursor-pointer"
                            >
                              I agree to the{' '}
                              <Link to="/terms" className="text-primary hover:underline mx-1">
                                Terms of Service
                              </Link>
                              and
                              <Link to="/privacy" className="text-primary hover:underline mx-1">
                                Privacy Policy
                              </Link>
                            </Label>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => setActiveTab('photos')}
                            >
                              Back
                            </Button>
                            <Button
                              type="submit"
                              onClick={() => {
                                setFormComplete({ ...formComplete, goal: true });
                              }}
                            >
                              Create Campaign
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            {/* Preview Section */}
            {showPreview && (
              <div className="md:col-span-1">
                <div className="sticky top-6">
                  <div className="bg-background border rounded-lg overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                      <h3 className="font-medium font-Lora text-xs sm:text-sm">Campaign Preview</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={previewMode === 'mobile' ? 'bg-muted' : ''}
                          onClick={() => setPreviewMode('mobile')}
                        >
                          Mobile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={previewMode === 'desktop' ? 'bg-muted' : ''}
                          onClick={() => setPreviewMode('desktop')}
                        >
                          Desktop
                        </Button>
                      </div>
                    </div>

                    <div
                      className={`p-4 ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}
                    >
                      <div
                        className={`border rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'w-full' : ''}`}
                      >
                        {/* Campaign Preview Content */}
                        <div className="relative">
                          {coverImagePreview ? (
                            <img
                              src={coverImagePreview || '/placeholder.svg'}
                              alt="Campaign cover"
                              width={800}
                              height={400}
                              className="w-full h-[200px] object-cover"
                            />
                          ) : (
                            <div className="w-full h-[200px] bg-muted flex items-center justify-center">
                              <p className="text-muted-foreground">No cover image uploaded</p>
                            </div>
                          )}

                          {campaignData.category && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                {campaignData.category === 'cancer'
                                  ? 'Cancer Treatment'
                                  : campaignData.category === 'heart'
                                    ? 'Heart Care'
                                    : campaignData.category === 'pediatric'
                                      ? 'Pediatric Care'
                                      : campaignData.category === 'mental-health'
                                        ? 'Mental Health'
                                        : campaignData.category === 'surgery'
                                          ? 'Surgery'
                                          : campaignData.category === 'medications'
                                            ? 'Medications'
                                            : campaignData.category === 'disability'
                                              ? 'Disability Support'
                                              : campaignData.category === 'general'
                                                ? 'General Medical'
                                                : campaignData.category}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h2 className="text-sm sm:text-lg font-Lora font-bold mb-2">
                            {campaignData.title || 'Campaign Title'}
                          </h2>

                          <p className="text-sm text-muted-foreground mb-4">
                            {campaignData.summary || 'Campaign summary will appear here...'}
                          </p>

                          <div className="space-y-4 mb-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">$0</span>
                                <span className="text-muted-foreground">
                                  of ${campaignData.goal.toLocaleString()} goal
                                </span>
                              </div>
                              <Progress value={0} className="h-2" />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-muted-foreground"
                                >
                                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                </svg>
                                <span>0 supporters</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-muted-foreground"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>
                                  {campaignData.deadline
                                    ? `${Math.max(0, Math.floor((new Date(campaignData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left`
                                    : 'No deadline set'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full mb-4">Donate Now</Button>

                          <div className="flex gap-2 mb-4">
                            <Button variant="outline" size="sm" className="flex-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-1"
                              >
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                              </svg>
                              Share
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-1"
                              >
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                              </svg>
                              Tweet
                            </Button>
                          </div>

                          <Separator className="my-4" />

                          <div className="space-y-4">
                            <h3 className="font-medium font-poppins">Campaign Story</h3>
                            <div className="text-sm whitespace-pre-line">
                              {campaignData.story || 'Your campaign story will appear here...'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Completion Status */}
                      <div className="mt-6 p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Campaign Completion</h4>
                          <span className="text-sm">{calculateCompletionPercentage()}%</span>
                        </div>
                        <Progress value={calculateCompletionPercentage()} className="h-2 mb-4" />

                        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                          <AlertDescription className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            <span>
                              Complete all required fields before publishing your campaign.
                            </span>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer>
        <div className="py-10 mx-auto  px-10 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Copyright. All rights reserved.</p>
          <ul className="flex gap-4">
            <li className="underline gap-2 hover:text-primary">
              <a href="">Terms and Conditions</a>
              <a href="">Privacy Policy</a>
            </li>
          </ul>
        </div>
      </footer>
      <Toaster />
    </div>
  );
};

export default CreateFundraisers;
