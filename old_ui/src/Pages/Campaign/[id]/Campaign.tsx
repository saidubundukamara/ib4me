import type React from 'react';
import { useState, useEffect } from 'react';
import { Clock, Heart } from 'lucide-react';
import { FaInstagram, FaFacebook, FaWhatsapp, FaLinkedinIn } from 'react-icons/fa';
import { FaSquareXTwitter } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/utils/Navbar';
import Footer from '@/components/utils/Footer';
import { Campaigninfo } from '../../../Types/campaign.types';
import { campaigns } from '@/components/Campaigns/campaign-data';
import { Link, useParams } from 'react-router-dom';

const Campaign: React.FC = () => {
  const [campaign, setCampaign] = useState<Campaigninfo | null>(null);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const foundCampaign = campaigns.find((c) => c.id === id);
    if (foundCampaign) {
      setCampaign(foundCampaign);
    }
  }, [id]);

  if (!campaign) {
    return <div>Loading campaign...</div>;
  }

  return (
    <div>
      <Navbar />
      <main className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content - 2/3 width on desktop */}
            <div className="lg:col-span-2">
              <div className="relative aspect-[16/9] w-full mb-6">
                <img
                  src={campaign.image || '/placeholder.svg'}
                  alt={campaign.title}
                  width={800}
                  height={500}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
              <h1 className="text-2xl font-Lora sm:text-3xl font-bold mb-4">{campaign.title}</h1>
              <Tabs defaultValue="story">
                <TabsList className="grid font-lexend-deca w-full grid-cols-3">
                  <TabsTrigger value="story">Story</TabsTrigger>
                  <TabsTrigger value="updates">Updates ({campaign.updates.length})</TabsTrigger>
                  <TabsTrigger value="comments">Comments ({campaign.comments.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="story" className="mt-6">
                  <div className="space-y-4 font-poppins whitespace-pre-line">
                    <p>{campaign.description}</p>
                  </div>
                </TabsContent>
                <TabsContent value="updates" className="mt-6">
                  <div className="space-y-6">
                    {campaign.updates.map((update, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{update.title}</CardTitle>
                            <span className="text-sm text-muted-foreground">{update.date}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p>{update.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="comments" className="mt-6">
                  <div className="space-y-6">
                    {campaign.comments.map((comment, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex justify-between">
                          <p className="font-medium">{comment.name}</p>
                          <span className="text-sm text-muted-foreground">{comment.date}</span>
                        </div>
                        <p className="mt-2">{comment.comment}</p>
                      </div>
                    ))}
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Leave a Comment</h3>
                      <form className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" placeholder="Your name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comment">Comment</Label>
                          <Textarea id="comment" placeholder="Write your message of support..." />
                        </div>
                        <Button>Post Comment</Button>
                      </form>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            {/* Sidebar - 1/3 width on desktop */}
            <div>
              <div className="sticky top-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-lg font-bold">
                          ${campaign.raised.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          of ${campaign.goal.toLocaleString()} goal
                        </span>
                      </div>
                      <Progress value={(campaign.raised / campaign.goal) * 100} className="h-2" />

                      <div className="flex items-center justify-between mt-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.supporters} supporters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.daysLeft} days left</span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/donate/${campaign.id}/payment`}>
                      <Button className="w-full cursor-pointer mb-4 font-Lora">Donate Now</Button>
                    </Link>
                    <h1 className="text-center my-2 font-Lora text-xs sm:text-sm">Help Share</h1>
                    <div className="flex gap-2 mb-6">
                      <Button variant="outline" size="sm" className="flex-1">
                        <FaFacebook className="h-4 w-4 mr-1" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FaSquareXTwitter className="h-4 w-4 mr-1" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FaInstagram className="h-4 w-4 mr-1" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FaWhatsapp className="h-4 w-4 mr-1" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FaLinkedinIn className="h-4 w-4 mr-1" />
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full">
                        <img
                          src={campaign.organizer.image || '/placeholder.svg'}
                          alt={campaign.organizer.name}
                          onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                          className="h-full w-full border-green-300 border-2 object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium font-Lora text-sm sm:text-lg">
                          {campaign.organizer.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          <span className="mr-1">{campaign.organizer.relationship}</span> •
                          <span className="ml-1">
                            Campaign created {campaign.organizer.created}
                          </span>
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <h4 className="font-medium mb-3 font-lexend-deca">Recent Donations</h4>
                    <div className="space-y-4">
                      {campaign.donations.slice(0, 3).map((donation, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <p className="font-medium">{donation.name}</p>
                            <span className="font-medium">${donation.amount}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground mt-0.5">
                            <span>{donation.date}</span>
                          </div>
                          {donation.message && (
                            <p className="mt-1 text-muted-foreground">{donation.message}</p>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        See All Donations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Campaign;
