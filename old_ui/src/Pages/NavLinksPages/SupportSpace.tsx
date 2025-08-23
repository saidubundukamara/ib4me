import { ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Navbar } from '@/components/utils/Navbar';
import Footer from '@/components/utils/Footer';

const SupportSpace = () => {
  const values = [
    {
      title: 'Empathy First',
      description:
        'We put empathy at the center of everything we do, ensuring our platform serves people with compassion and understanding.',
    },
    {
      title: 'Innovation',
      description:
        'We constantly evolve our platform to better serve our users and make fundraising more effective and accessible.',
    },
    {
      title: 'Transparency',
      description:
        'We believe in open communication and clarity in all our operations, building trust with our users and team members.',
    },
    {
      title: 'Inclusion',
      description:
        'We create an environment where everyone feels welcome, valued, and able to contribute their unique perspectives.',
    },
  ];
  return (
    <div>
      <Navbar />
      <main>
        <section className="py-12  md:py-24 bg-muted">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Support Space</h1>
            <p className="text-xl text-muted-foreground md:w-3/4 mx-auto mb-8">
              Join our team and help make a difference in people's lives through the power of
              crowdfunding.
            </p>
          </div>
        </section>

        {/* About Our Workspace Section */}
        <section className="page-section bg-gray-50" id="workspace">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12">
            <p className="text-lg text-muted-foreground mb-12 max-w-3xl">
              At Ib4me, we're building a team of passionate individuals committed to helping people
              raise money for causes that matter. Our collaborative culture empowers team members to
              make a meaningful impact.
            </p>

            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/2">
                <img
                  src="https://source.unsplash.com/photo-1526374965328-7f61d4dc18c5"
                  alt="Ib4me Office"
                  className="rounded-lg shadow-md w-full h-auto object-cover"
                />
              </div>

              <div className="lg:w-1/2 space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-2">Our Values</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {values.map((value, index) => (
                      <div key={index} className="p-4 bg-white rounded-md shadow-sm">
                        <h4 className="font-bold text-ib4me-purple">{value.title}</h4>
                        <p className="mt-2 text-muted-foreground text-sm">{value.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">Benefits</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                    <li>Competitive salary and equity packages</li>
                    <li>Comprehensive health, dental, and vision coverage</li>
                    <li>Flexible work arrangements and unlimited PTO</li>
                    <li>Professional development stipend</li>
                    <li>Volunteer time off to support causes you care about</li>
                    <li>Regular team-building activities and events</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h3 className="text-xl font-bold mb-4">Sound like a place you'd like to work?</h3>
              <Button size="lg">View All Openings</Button>
            </div>
          </div>
        </section>

        {/* Volunteer Opportunities */}
        <section className="page-section">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12">
            <h2 className="heading-md mb-4">Volunteer Opportunities</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
              Not looking for a job but still want to contribute? Explore our volunteer program to
              help support fundraisers and communities in need.
            </p>

            <Card className="border-ib4me-purple/20 bg-ib4me-light-purple/30">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">Ib4me Volunteer Network</h3>
                <p className="mb-6">
                  Our volunteer network helps spread the word about important causes, provides
                  fundraising guidance, and supports community events. Join our growing community of
                  dedicated volunteers making a difference.
                </p>
                <Button>Learn More About Volunteering</Button>
              </CardContent>
            </Card>
          </div>
        </section>
        {/* Help Center Section */}
        <section id="help-center" className="py-16 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Help Center</h2>
                <p className="text-muted-foreground md:text-xl max-w-3xl">
                  Find answers to common questions and get support
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-muted p-6 rounded-lg mb-8">
                  <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq-1">
                      <AccordionTrigger>How do I start a fundraising campaign?</AccordionTrigger>
                      <AccordionContent>
                        Starting a campaign is simple. Click the "Start a Campaign" button, then
                        follow the step-by-step guide to set up your page. You'll need to provide
                        details about your healthcare need, set a fundraising goal, and add photos
                        or videos to help tell your story.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="faq-2">
                      <AccordionTrigger>
                        How quickly can I access the funds I raise?
                      </AccordionTrigger>
                      <AccordionContent>
                        You can withdraw funds as soon as donations start coming in. After your
                        first withdrawal, which may take 2-5 business days to process, subsequent
                        withdrawals are typically faster. We offer multiple payout options including
                        direct deposit and PayPal.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="faq-3">
                      <AccordionTrigger>
                        Is my personal and medical information private?
                      </AccordionTrigger>
                      <AccordionContent>
                        Your privacy is important to us. You control what medical and personal
                        information you share on your campaign page. We never share your private
                        information with third parties without your consent, and our platform is
                        HIPAA-compliant for healthcare data protection.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="faq-4">
                      <AccordionTrigger>How do you verify healthcare campaigns?</AccordionTrigger>
                      <AccordionContent>
                        We have a multi-step verification process for healthcare campaigns. This may
                        include reviewing medical documentation, verifying identity, and confirming
                        the relationship between the campaign organizer and the beneficiary. This
                        helps ensure donations go to legitimate healthcare needs.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="faq-5">
                      <AccordionTrigger>
                        Can I fundraise for someone else's medical expenses?
                      </AccordionTrigger>
                      <AccordionContent>
                        Yes, you can create a campaign on behalf of someone else. You'll need to
                        clearly state your relationship to the beneficiary and, in some cases,
                        provide documentation confirming their consent and your connection to them.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="faq-6">
                      <AccordionTrigger>
                        What if I don't reach my fundraising goal?
                      </AccordionTrigger>
                      <AccordionContent>
                        You keep all funds raised even if you don't reach your goal. There's no
                        penalty for not meeting your target, and you can continue fundraising by
                        extending your campaign or updating your goal as needed.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <Button className="w-full">
                  Visit Full Help Center <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Support</CardTitle>
                    <CardDescription>Our support team is ready to help</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Email Support</h4>
                        <p className="text-sm text-muted-foreground">support@ib4me.com</p>
                        <p className="text-xs text-muted-foreground">Response within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Phone Support</h4>
                        <p className="text-sm text-muted-foreground">1-800-555-HELP</p>
                        <p className="text-xs text-muted-foreground">Mon-Fri, 9am-6pm EST</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Headquarters</h4>
                        <p className="text-sm text-muted-foreground">123 Health Avenue</p>
                        <p className="text-xs text-muted-foreground">San Francisco, CA 94105</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Contact Us</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SupportSpace;
