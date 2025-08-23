import { Link } from 'react-router-dom';
import { Heart, Check, ArrowRight, Globe, Users, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/utils/Navbar';
import Footer from '@/components/utils/Footer';

const About = () => {
  return (
    <div>
      <Navbar />
      <main>
        <section className="py-12  md:py-24 bg-muted">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">About Ib4me</h1>
            <p className="text-xl text-muted-foreground md:w-3/4 mx-auto mb-8">
              We're on a mission to make healthcare accessible to everyone through the power of
              community fundraising.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="#how-it-works">
                <Button size="lg">How It Works</Button>
              </Link>
              <Link to="/discover">
                <Button variant="outline" size="lg">
                  Explore Campaigns
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How Ib4me Works Section */}
        <section id="how-it-works" className="py-16 bg-background">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">How Ib4me Works</h2>
                <p className="text-muted-foreground md:text-xl max-w-3xl">
                  Learn how our platform operates and what you can do with it
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16">
              <div className="rounded-lg overflow-hidden">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Ib4me platform"
                  width={600}
                  height={400}
                  className="object-cover"
                />
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">A Platform for Health Needs</h3>
                <p className="text-muted-foreground">
                  Ib4me is dedicated exclusively to healthcare fundraising, allowing individuals to
                  raise money for medical treatments, hospital bills, specialized care, and other
                  health-related expenses. Our platform is designed to be easy to use, secure, and
                  effective.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Quick Setup</h4>
                      <p className="text-sm text-muted-foreground">
                        Create your fundraising campaign in minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Easy Sharing</h4>
                      <p className="text-sm text-muted-foreground">
                        Share your campaign across social media, email, and messaging apps
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Secure Donations</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive funds through our secure payment system
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Fast Withdrawals</h4>
                      <p className="text-sm text-muted-foreground">
                        Access your funds quickly when you need them most
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">For Fundraisers</CardTitle>
                  <CardDescription>Create and manage your healthcare campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Start a campaign for yourself or a loved one in need of medical financial
                    support. Our platform provides all the tools you need to create a compelling
                    campaign, share it widely, and manage donations.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Easy campaign creation
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Campaign management tools
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Shareable content
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Donor communication
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/start-campaign">
                    <Button className="w-full">Start a Campaign</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">For Donors</CardTitle>
                  <CardDescription>Support healthcare campaigns that matter to you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Browse and donate to healthcare campaigns that touch your heart. Making a
                    difference is easy, secure, and transparent on our platform.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Secure payment processing
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Campaign verification
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Campaign updates
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Tax receipts
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/discover">
                    <Button className="w-full">Browse Campaigns</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">For Organizations</CardTitle>
                  <CardDescription>Partner with us to amplify your impact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Healthcare organizations, nonprofits, and businesses can partner with Ib4me to
                    create broader impact through coordinated fundraising initiatives.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Partnership programs
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Matching campaigns
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Sponsored initiatives
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Corporate giving
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/organizations">
                    <Button className="w-full">Learn More</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Supported Countries Section */}
        <section id="supported-countries" className="py-16 bg-background">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Supported Countries
                </h2>
                <p className="text-muted-foreground md:text-xl max-w-3xl">
                  See where our services are currently available
                </p>
              </div>
            </div>

            <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
              <img
                src="/placeholder.svg?height=500&width=1200"
                alt="World map"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">Global Reach, Local Impact</h3>
                <p className="text-muted-foreground">
                  We're constantly expanding our reach to help more people access the healthcare
                  they need.
                </p>
              </div>
            </div>

            <Tabs defaultValue="all">
              <div className="flex justify-center mb-8">
                <TabsList>
                  <TabsTrigger value="all">All Regions</TabsTrigger>
                  <TabsTrigger value="americas">Americas</TabsTrigger>
                  <TabsTrigger value="europe">Europe</TabsTrigger>
                  <TabsTrigger value="africa">Africa</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[
                    'United States',
                    'Canada',
                    'United Kingdom',
                    'Australia',
                    'Germany',
                    'France',
                    'Sierra Leone',
                    'Kenya',
                    'Nigeria',
                    'Ghana',
                  ].map((country) => (
                    <div key={country} className="flex items-center gap-2 p-3 border rounded-md">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{country}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="americas">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {['United States', 'Canada'].map((country) => (
                    <div key={country} className="flex items-center gap-2 p-3 border rounded-md">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{country}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="europe">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {['United Kingdom', 'Germany', 'France', 'Belgium'].map((country) => (
                    <div key={country} className="flex items-center gap-2 p-3 border rounded-md">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{country}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="africa">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {['Nigeria', 'Ghana', 'Sierra Leone'].map((country) => (
                    <div key={country} className="flex items-center gap-2 p-3 border rounded-md">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{country}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-8 text-center">
              <Button variant="outline">
                View Detailed Country Information <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Transparent Pricing
                </h2>
                <p className="text-muted-foreground md:text-xl max-w-3xl">
                  Explore our simple and transparent fee structure
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Platform Fee</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">2.9%</span>
                    <span className="text-muted-foreground"> + $0.30</span>
                  </div>
                  <CardDescription className="mt-2">Per successful donation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Payment processing
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Platform maintenance
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Customer support
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <div className="bg-primary text-white text-xs px-3 py-1 rounded-full w-fit mx-auto mb-2">
                    MOST POPULAR
                  </div>
                  <CardTitle>Donor-Covered Fees</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">0%</span>
                  </div>
                  <CardDescription className="mt-2">For campaign organizers</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Donors can choose to cover the platform fee, meaning 100% of their intended
                    donation goes to your campaign.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Most donors choose this option
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Maximize your fundraising
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Completely optional for donors
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Enterprise Solutions</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                  <CardDescription className="mt-2">For healthcare organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tailored solutions for healthcare providers, nonprofits, and corporate partners.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Volume discounts
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Dedicated account manager
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> Custom integration options
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-12 p-6 bg-background rounded-lg border">
              <h3 className="text-xl font-bold mb-4 text-center">No Hidden Fees, No Surprises</h3>
              <p className="text-center text-muted-foreground mb-8">
                We believe in complete transparency. Our fee structure is straightforward and
                designed to ensure the maximum amount of each donation goes directly to support
                healthcare needs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium">No Setup Fees</h4>
                  <p className="text-sm text-muted-foreground">
                    Creating a campaign is completely free
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium">No Monthly Fees</h4>
                  <p className="text-sm text-muted-foreground">
                    We only charge when you receive donations
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium">Fast Payouts</h4>
                  <p className="text-sm text-muted-foreground">
                    Access funds quickly with no additional fees
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-primary/5">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the Ib4me community today and help make healthcare accessible to those who need
              it most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/start-campaign">
                <Button size="lg">Start a Campaign</Button>
              </Link>
              <Link to="/discover">
                <Button variant="outline" size="lg">
                  Explore Campaigns
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
