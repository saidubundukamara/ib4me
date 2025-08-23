import { Link } from 'react-router-dom';
import { Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Navbar } from '@/components/utils/Navbar';
import Footer from '@/components/utils/Footer';
import { AnimatedTestimonials } from '@/components/ui/animated-testimonials';

const Guarantee = () => {
  const testimonials = [
    {
      quote:
        "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for.",
      name: 'Sarah Chen',
      designation: 'Product Manager at TechFlow',
      src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      quote:
        "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable.",
      name: 'Michael Rodriguez',
      designation: 'CTO at InnovateSphere',
      src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      quote:
        "This solution has significantly improved our team's productivity. The intuitive interface makes complex tasks simple.",
      name: 'Emily Watson',
      designation: 'Operations Director at CloudScale',
      src: 'https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      quote:
        "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
      name: 'James Kim',
      designation: 'Engineering Lead at DataPro',
      src: 'https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      quote:
        'The scalability and performance have been game-changing for our organization. Highly recommend to any growing business.',
      name: 'Lisa Thompson',
      designation: 'VP of Technology at FutureNet',
      src: 'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ];

  return (
    <div>
      <Navbar />
      <main>
        <section className="py-12  md:py-24 bg-muted">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full">
              <Shield className="h-10 w-10 text-ib4me-purple" />
            </div>
            <h2 className="heading-md mb-6 text-3xl font-Lora sm:text-4xl font-semibold">
              Our Promise to You
            </h2>
            <p className="text-lg mb-8 mx-auto max-w-3xl text-muted-foreground">
              At Ib4me, we understand that trust is paramount when it comes to online fundraising.
              Our Giving Guarantee is our commitment to providing a safe, secure, and transparent
              platform for donors and fundraisers alike.
            </p>
            <div className="border-t-4 border-b-4 border-primary  py-4 max-w-3xl mx-auto">
              <p className="text-xl font-medium">
                "We promise to maintain the highest standards of safety and security while ensuring
                that funds reach those who need them."
              </p>
            </div>
          </div>
        </section>
        {/* Ib4me Giving Guarantee Section */}
        <section id="giving-guarantee" className="py-10 bg-white">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ib4me Giving Guarantee
                </h2>
                <p className="text-muted-foreground md:text-xl max-w-3xl">
                  Our commitment to transparency and impact in healthcare giving
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  When you donate through Ib4me, we want you to feel confident that your
                  contribution is making a real difference. Our Giving Guarantee outlines our
                  commitment to ensuring transparency, security, and impact in every donation.
                </p>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Campaign Verification</AccordionTrigger>
                    <AccordionContent>
                      We verify all campaigns on our platform to ensure legitimacy. Our team reviews
                      each campaign for authenticity before it goes live, and we have systems in
                      place to flag any suspicious activity.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Secure Donations</AccordionTrigger>
                    <AccordionContent>
                      All donations are processed through our secure payment system, which uses
                      industry-standard encryption to protect your financial information. We never
                      store your payment details on our servers.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Transparent Fees</AccordionTrigger>
                    <AccordionContent>
                      We're completely transparent about our platform fees. We charge a small fee to
                      cover our operating costs, but the vast majority of your donation goes
                      directly to the campaign you've chosen to support.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Money-Back Guarantee</AccordionTrigger>
                    <AccordionContent>
                      If you discover that a campaign you've donated to is fraudulent, we'll work
                      with you to refund your donation. Our Trust & Safety team investigates all
                      reported campaigns promptly.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="bg-background rounded-lg p-8 border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">The Ib4me Guarantee</h3>
                    <p className="text-muted-foreground">
                      Our commitment to donors and fundraisers
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Verified Campaigns</h4>
                      <p className="text-sm text-muted-foreground">
                        All campaigns are reviewed and verified for authenticity
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Secure Platform</h4>
                      <p className="text-sm text-muted-foreground">
                        Industry-leading security measures to protect all transactions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Full Transparency</h4>
                      <p className="text-sm text-muted-foreground">
                        Clear reporting on where and how funds are used
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">24/7 Support</h4>
                      <p className="text-sm text-muted-foreground">
                        Our team is always available to assist with any issues
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Testimonials Section */}
        <section className="py-12 md:py-16 bg-muted">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 font-Lora">
              Here's what people are saying about ib4me
            </h2>
            <div>
              {/* Testimonials */}
              <AnimatedTestimonials testimonials={testimonials} />;
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-10">
          <div className="container-custom text-center">
            <p className="text-lg font-pt-serif opacity-90 max-w-2xl mx-auto mb-8">
              Join people who have successfully raised money on Ib4me with confidence and peace of
              mind.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg">
                <Link to="/create-campaign">Start a Fundraiser</Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link to="/discover">Explore Fundraisers</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Guarantee;
