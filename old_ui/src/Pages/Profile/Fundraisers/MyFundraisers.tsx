import type React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Edit,
  Eye,
  FileEdit,
  Wallet,
  Heart,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Footer from '@/components/utils/Footer';
import { Navbar } from '@/components/utils/Navbar';
import wan from '../../../assets/wan.jpg';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const activeCampaigns = [
  {
    id: 1,
    title: "Help Sarah's Cancer Treatment",
    image: wan,
    category: 'Cancer Treatment',
    description:
      'Sarah needs support for her ongoing cancer treatment. Your donation will help cover medical costs.',
    raised: 12500,
    goal: 25000,
    daysLeft: 12,
    supporters: 128,
    views: 2450,
    shares: 87,
    createdAt: '2023-11-15',
    status: 'active',
  },
  {
    id: 2,
    title: "John's Heart Surgery Fund",
    image: wan,
    category: 'Heart Surgery',
    description:
      'John requires urgent heart surgery. Help him get the medical care he desperately needs.',
    raised: 18200,
    goal: 30000,
    daysLeft: 8,
    supporters: 214,
    views: 3120,
    shares: 156,
    createdAt: '2023-12-01',
    status: 'active',
  },
];

const draftCampaigns = [
  {
    id: 3,
    title: 'Medical Support for Baby Emma',
    image: wan,
    category: 'Pediatric Care',
    description:
      'Baby Emma was born with a rare condition. Your support will help her parents afford specialized treatment.',
    goal: 15000,
    lastEdited: '2024-01-10',
    status: 'draft',
    completionPercentage: 75,
  },
  {
    id: 4,
    title: 'Help Michael Fight Leukemia',
    image: wan,
    category: 'Cancer Treatment',
    description:
      'Michael was recently diagnosed with leukemia. He needs your help to fund his treatment and recovery.',
    goal: 50000,
    lastEdited: '2024-01-05',
    status: 'draft',
    completionPercentage: 30,
  },
];

const archivedCampaigns = [
  {
    id: 5,
    title: "Support Lisa's Rehabilitation",
    image: wan,
    category: 'Rehabilitation',
    description:
      'After a severe accident, Lisa needs physical therapy and rehabilitation. Your support makes a difference.',
    raised: 12000,
    goal: 12000,
    supporters: 76,
    endDate: '2023-10-15',
    status: 'completed',
  },
  {
    id: 6,
    title: 'Emergency Surgery for Tom',
    image: wan,
    category: 'Surgery',
    description:
      "Tom needs an emergency surgery that his insurance won't fully cover. Please help with his medical bills.",
    raised: 7200,
    goal: 15000,
    supporters: 62,
    endDate: '2023-09-20',
    status: 'ended',
  },
];

const MyFundraisers = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateCampaignId, setUpdateCampaignId] = useState<number | null>(null);

  const handleDeleteCampaign = (id: number) => {
    setCampaignToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    toast(`Deleting campaign`, {
      description: `Campaign ID: ${campaignToDelete}`,
    });
    setShowDeleteDialog(false);
    setCampaignToDelete(null);
  };

  const handlePostUpdate = (id: number) => {
    setUpdateCampaignId(id);
    setShowUpdateDialog(true);
  };

  const submitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Update posted', {
      description: `Update posted for campaign ID: ${updateCampaignId}`,
    });
    setShowUpdateDialog(false);
    setUpdateCampaignId(null);
  };

  return (
    <div>
      <Navbar />
      <main className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Campaigns</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track all your fundraising campaigns
              </p>
            </div>
            <Link to="/create-campaign">
              <Button className="w-full cursor-pointer md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Create New Campaign
              </Button>
            </Link>
          </div>

          <Tabs
            defaultValue="active"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="relative">
                Active
                {activeCampaigns.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {activeCampaigns.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="drafts" className="relative">
                Drafts
                {draftCampaigns.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {draftCampaigns.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" className="relative">
                Archived
                {archivedCampaigns.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {archivedCampaigns.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeCampaigns.length === 0 ? (
                <EmptyState
                  title="No active campaigns"
                  description="You don't have any active campaigns yet. Start a new campaign to begin fundraising."
                  buttonText="Start a Campaign"
                  buttonLink="/start-campaign"
                />
              ) : (
                <div className="grid gap-6">
                  {activeCampaigns.map((campaign) => (
                    <ActiveCampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onPostUpdate={handlePostUpdate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="drafts" className="mt-6">
              {draftCampaigns.length === 0 ? (
                <EmptyState
                  title="No draft campaigns"
                  description="You don't have any campaigns saved as drafts. Start creating a campaign and save it as a draft to continue later."
                  buttonText="Start a Campaign"
                  buttonLink="/start-campaign"
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {draftCampaigns.map((campaign) => (
                    <DraftCampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onDelete={() => handleDeleteCampaign(campaign.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived" className="mt-6">
              {archivedCampaigns.length === 0 ? (
                <EmptyState
                  title="No archived campaigns"
                  description="You don't have any archived campaigns. Completed or ended campaigns will appear here."
                  buttonText="View Active Campaigns"
                  buttonLink="#"
                  onClick={() => setActiveTab('active')}
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {archivedCampaigns.map((campaign) => (
                    <ArchivedCampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Post Campaign Update</DialogTitle>
            <DialogDescription>
              Share the latest news about your campaign with your supporters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="update-title">Update Title</Label>
                <Input id="update-title" placeholder="Enter a title for your update" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-content">Update Content</Label>
                <Textarea
                  id="update-content"
                  placeholder="Share your progress, thank your supporters, or provide important information..."
                  className="min-h-[150px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowUpdateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Post Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  onClick?: () => void;
}

function EmptyState({ title, description, buttonText, buttonLink, onClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <Heart className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {onClick ? (
        <Button onClick={onClick}>{buttonText}</Button>
      ) : (
        <Link to={buttonLink}>
          <Button>{buttonText}</Button>
        </Link>
      )}
    </div>
  );
}

interface ActiveCampaignCardProps {
  campaign: (typeof activeCampaigns)[0];
  onPostUpdate: (id: number) => void;
}

function ActiveCampaignCard({ campaign, onPostUpdate }: ActiveCampaignCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <div className="grid md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
          <div className="relative aspect-[16/9] md:aspect-auto md:h-full">
            <img
              src={campaign.image || '/placeholder.svg'}
              alt={campaign.title}
              width={350}
              height={250}
              className="object-cover w-full h-full rounded-lg"
            />
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-primary text-white hover:bg-primary/90">
                {campaign.category}
              </Badge>
            </div>
          </div>

          <div className="p-6 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {campaign.description}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      navigate(`/campaign/${campaign.id}`);
                      toast('Viewing campaign', {
                        description: 'Loading campaign details...',
                      });
                    }}
                    className="flex items-center cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" /> View Campaign
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigate(`/campaign/${campaign.id}/edit`);
                      toast('Edit campaign', {
                        description: 'Loading campaign editor...',
                      });
                    }}
                    className="flex items-center cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Campaign
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPostUpdate(campaign.id)}
                    className="flex items-center cursor-pointer"
                  >
                    <FileEdit className="mr-2 h-4 w-4" /> Post Update
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigate(`/campaign/${campaign.id}/settings`);
                      toast('Campaign settings', {
                        description: 'Loading settings page...',
                      });
                    }}
                    className="flex items-center cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" /> Campaign Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      navigate(`/campaign/${campaign.id}/donors`);
                      toast('View donors', {
                        description: 'Loading donor information...',
                      });
                    }}
                    className="flex items-center cursor-pointer"
                  >
                    <Users className="mr-2 h-4 w-4" /> View Donors
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigate(`/campaign/${campaign.id}/withdraw`);
                      toast('Withdraw funds', {
                        description: 'Loading withdrawal page...',
                      });
                    }}
                    className="flex items-center cursor-pointer"
                  >
                    <Wallet className="mr-2 h-4 w-4" /> Withdraw Funds
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-auto">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">${campaign.raised.toLocaleString()}</span>
                <span className="text-muted-foreground">of ${campaign.goal.toLocaleString()}</span>
              </div>
              <Progress value={(campaign.raised / campaign.goal) * 100} className="h-2" />

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{campaign.supporters} supporters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{campaign.daysLeft} days left</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DraftCampaignCardProps {
  campaign: (typeof draftCampaigns)[0];
  onDelete: () => void;
}

function DraftCampaignCard({ campaign, onDelete }: DraftCampaignCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{campaign.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/start-campaign?draft=${campaign.id}`} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" /> Continue Editing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/campaign/${campaign.id}/preview`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          Last edited on {new Date(campaign.lastEdited).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {campaign.image ? (
              <img
                src={campaign.image || '/placeholder.svg'}
                alt={campaign.title}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <FileEdit className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm line-clamp-2">{campaign.description || 'No description yet'}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{campaign.category}</Badge>
              <Badge variant="outline">${campaign.goal.toLocaleString()} goal</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion</span>
            <span>{campaign.completionPercentage}%</span>
          </div>
          <Progress value={campaign.completionPercentage} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/campaign/${campaign.id}/preview`}>
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link to={`/start-campaign?draft=${campaign.id}`}>Continue Editing</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ArchivedCampaignCardProps {
  campaign: (typeof archivedCampaigns)[0];
}

function ArchivedCampaignCard({ campaign }: ArchivedCampaignCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{campaign.title}</CardTitle>
            <CardDescription>
              {campaign.status === 'completed' ? 'Successfully Completed' : 'Ended'} on{' '}
              {new Date(campaign.endDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
            {campaign.status === 'completed' ? 'Completed' : 'Ended'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-md overflow-hidden">
            <img
              src={campaign.image || '/placeholder.svg'}
              alt={campaign.title}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm line-clamp-2">{campaign.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{campaign.category}</Badge>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="text-xs">{campaign.supporters} supporters</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">${campaign.raised.toLocaleString()}</span>
            <span className="text-muted-foreground">of ${campaign.goal.toLocaleString()} goal</span>
          </div>
          <Progress
            value={(campaign.raised / campaign.goal) * 100}
            className={`h-2 ${campaign.status === 'completed' ? 'bg-primary/20' : 'bg-muted'}`}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/campaign/${campaign.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Campaign
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/campaign/${campaign.id}/certificate`}>
            <ArrowUpRight className="mr-2 h-4 w-4" /> View Certificate
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Missing Clock component
function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default MyFundraisers;
