import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Footer from '@/components/utils/Footer';
import { Navbar } from '@/components/utils/Navbar';
import { campaigns } from '@/components/Campaigns/campaign-data';

const DiscoverCampaigns = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCampaigns, setFilteredCampaigns] = useState(campaigns);
  const categories = [
    'All',
    'Treatments & Procedures',
    'Research & Innovation',
    'Mental Health & Therapy',
    'Equipment & Devices',
    'Patient & Caregiver Support',
    'Community Health Initiatives',
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = campaigns.filter(
      (campaign) =>
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (campaign.category ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredCampaigns(filtered);
  };

  return (
    <div className="">
      <Navbar />
      <main className="py-8 md:py-16">
        <div className="mx-auto max-w-screen-xl container px-6 sm:px-0">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters (Desktop) */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-6 border rounded-lg p-4 space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox id={`category-${category}`} />
                        <label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Progress</h3>
                  <div className="space-y-2">
                    {['Less than 25%', '25% - 50%', '50% - 75%', 'More than 75%'].map((range) => (
                      <div key={range} className="flex items-center space-x-2">
                        <Checkbox id={`progress-${range}`} />
                        <label htmlFor={`progress-${range}`} className="text-sm cursor-pointer">
                          {range}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Time Left</h3>
                  <div className="space-y-2">
                    {['Less than 7 days', '7-14 days', '15-30 days', 'More than 30 days'].map(
                      (time) => (
                        <div key={time} className="flex items-center space-x-2">
                          <Checkbox id={`time-${time}`} />
                          <label htmlFor={`time-${time}`} className="text-sm cursor-pointer">
                            {time}
                          </label>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search for campaigns"
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filters Button (Mobile) */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden">
                        <Filter className="h-4 w-4" />
                        <span className="sr-only">Filters</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 space-y-6">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="categories">
                            <AccordionTrigger>Categories</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                {categories.map((category) => (
                                  <div key={category} className="flex items-center space-x-2">
                                    <Checkbox id={`mobile-category-${category}`} />
                                    <label
                                      htmlFor={`mobile-category-${category}`}
                                      className="text-sm"
                                    >
                                      {category}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="progress">
                            <AccordionTrigger>Progress</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                {['Less than 25%', '25% - 50%', '50% - 75%', 'More than 75%'].map(
                                  (range) => (
                                    <div key={range} className="flex items-center space-x-2">
                                      <Checkbox id={`mobile-progress-${range}`} />
                                      <label
                                        htmlFor={`mobile-progress-${range}`}
                                        className="text-sm"
                                      >
                                        {range}
                                      </label>
                                    </div>
                                  ),
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="timeleft">
                            <AccordionTrigger>Time Left</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                {[
                                  'Less than 7 days',
                                  '7-14 days',
                                  '15-30 days',
                                  'More than 30 days',
                                ].map((time) => (
                                  <div key={time} className="flex items-center space-x-2">
                                    <Checkbox id={`mobile-time-${time}`} />
                                    <label htmlFor={`mobile-time-${time}`} className="text-sm">
                                      {time}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <Button className="w-full">Apply Filters</Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </form>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredCampaigns.length} campaigns
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Sort by:</span>
                  <Select defaultValue="trending">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="trending">Trending</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="most-funded">Most Funded</SelectItem>
                        <SelectItem value="ending-soon">Ending Soon</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex flex-col overflow-hidden border rounded-lg"
                  >
                    <div className="relative aspect-[16/9] w-full">
                      <img
                        src={campaign.image || '/placeholder.svg'}
                        alt={campaign.title}
                        width={350}
                        height={250}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {campaign.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col p-4 gap-3">
                      <h3 className="text-lg font-semibold line-clamp-2">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </p>

                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">${campaign.raised.toLocaleString()}</span>
                          <span className="text-muted-foreground">
                            of ${campaign.goal.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={(campaign.raised / campaign.goal) * 100} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{campaign.supporters} supporters</span>
                        <span>{campaign.daysLeft} days left</span>
                      </div>

                      <Link to={`/campaign/${campaign.id}`} className="mt-auto">
                        <Button className="w-full">Donate Now</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DiscoverCampaigns;
