import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/utils/Footer';
import { Navbar } from '@/components/utils/Navbar';
import { Organizer } from '@/Types/campaign.types';

const mockOrganizer: Organizer = {
  image: '/placeholder.svg',
  name: 'John Doe',
  totalImpact: 1000,
  fundraisersSupported: 5,
  peopleInspired: 20,
  sharedFundraisers: [],
  donations: [],
  relationship: 'Organizer',
  created: new Date().toISOString(),
};

const Impact = () => {
  const [activeTab, setActiveTab] = useState('share-activity');

  return (
    <div>
      <Navbar />
      <main className="container max-w-4xl mx-auto py-16 sm:py-32">
        <div className="relative">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img
                src={mockOrganizer.image || '/placeholder.svg'}
                alt={mockOrganizer.name}
                width={64}
                height={64}
                className="rounded-full"
              />
              <div className="absolute -right-2 -top-2 bg-green-500 text-white rounded-full p-1">
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
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-[72px] text-center font-bold text-[#0a6e31] mb-2">
            ${mockOrganizer.totalImpact}
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Your total impact from donating, organizing and sharing
          </p>

          <Card className="bg-white shadow-sm mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-5 w-5 text-gray-500" />
                    <span className="text-2xl font-bold">{mockOrganizer.fundraisersSupported}</span>
                  </div>
                  <p className="text-sm text-gray-500">Fundraisers supported</p>
                </div>
                <div className="flex flex-col items-center p-4 border-l border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span className="text-2xl font-bold">{mockOrganizer.peopleInspired}</span>
                  </div>
                  <p className="text-sm text-gray-500">People you inspired to help</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f2f1d] text-white mb-8">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold mb-2">Start seeing your impact</h2>
              <p className="text-gray-300 mb-6">
                When you donate to and share fundraisers, you can view the total impact above.
              </p>
              <Link to="/more-campaigns">
                <Button>
                  Find a fundraiser
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Fundraisers Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Fundraisers you support</h2>

          <Tabs defaultValue="share-activity" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger
                value="share-activity"
                className={`rounded-full px-6 py-2 ${activeTab === 'share-activity' ? 'text-primary' : ' text-primary'}`}
              >
                Share activity
              </TabsTrigger>
              <TabsTrigger
                value="your-donations"
                className={`rounded-full px-6 py-2 ${activeTab === 'your-donations' ? 'text-primary' : 'text-primary'}`}
              >
                Your donations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="share-activity" className="pt-4">
              {mockOrganizer.sharedFundraisers.length > 0 ? (
                <div className="grid gap-4">
                  {mockOrganizer.sharedFundraisers.map((fundraiser, index) => (
                    <Card key={index} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                          <div>
                            <h3 className="font-medium">{fundraiser.title}</h3>
                            <p className="text-sm text-gray-500">
                              Shared on {fundraiser.sharedDate}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Donations made from fundraisers you've shared will appear here.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="your-donations" className="pt-4">
              {mockOrganizer.donations.length > 0 ? (
                <div className="grid gap-4">
                  {mockOrganizer.donations.map((donation, index) => (
                    <Card key={index} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                          <div>
                            <h3 className="font-medium">{donation.fundraiserTitle}</h3>
                            <p className="text-sm text-gray-500">
                              ${donation.amount} donated on {donation.date}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Your donations to fundraisers will appear here.</p>
                  <Link to="/more-campaigns" className="mt-4 inline-block">
                    <Button>Donate to a fundraiser</Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Impact;
