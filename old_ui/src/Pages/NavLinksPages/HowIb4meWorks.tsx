import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/utils/Footer';
import { Navbar } from '@/components/utils/Navbar';
import Ib4meVideo from '@/components/Home/Ib4meVideo';

const HowIb4meWorks = () => {
  return (
    <div>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h1 className="text-4xl font-Lora md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
              How Fundraising on ib4me Works
            </h1>
            <p className="text-lg text-muted-foreground font-pt-serif mb-8 max-w-3xl">
              Ib4me is the trusted place to fundraise for what you care about. With no pressure to
              hit your fundraising goal, but helpful tools to help you reach it, you can confidently
              start fundraising. Learn step-by-step what to expect—from writing your story and
              sharing your fundraiser to receiving the money raised.
            </p>
            <Link to="/start-campaign">
              <Button size="lg" className="font-Lora">
                Start a Campaign
              </Button>
            </Link>
          </div>
          {/* Video Section */}
          <Ib4meVideo />
        </section>

        {/* Step-by-Step Guide */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-10">
              Here's what to expect when fundraising on ib4me:
            </h2>

            {/* Step 1 */}
            <div className="grid md:grid-cols-5 gap-8 mb-16">
              <div className="md:col-span-3">
                <h3 className="text-2xl font-bold mb-6">
                  <span className="text-primary">1.</span> Follow the prompts to set up your
                  fundraiser
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Click the <span className="font-semibold">'Start a Campaign'</span> button
                        and answer a few questions to get started
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Add a{' '}
                        <span className="font-semibold">photo or video for your fundraiser</span>{' '}
                        (You can always change this later)
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        In your <span className="font-semibold">fundraiser description</span>, share
                        the reason you are fundraising in 1-3 paragraphs
                      </p>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>Add details such as:</li>
                        <li className="ml-6">Who or what you're fundraising for</li>
                        <li className="ml-6">How funds will be used</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Finally, you can always choose a goal amount, and edit your goal at any
                        time.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <div className="bg-[#f0f9f5] p-6 rounded-xl">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt="Setup fundraiser interface"
                    width={300}
                    height={300}
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-5 gap-8 mb-16">
              <div className="md:col-span-3">
                <h3 className="text-2xl font-bold mb-6">
                  <span className="text-primary">2.</span> Share your fundraiser
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        <span className="font-semibold">Share</span> your fundraiser link with your
                        closest friends and family through text messages and emails to start gaining
                        momentum
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Post your fundraiser more broadly by using social media, sharing in-person
                        with a printable poster, or{' '}
                        <span className="font-semibold">writing a letter</span> to people you know
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>Continue to share your fundraiser each day to help reach your goals</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Add <span className="font-semibold">team</span> members you know and trust
                        to your fundraiser to help spread the word
                      </p>
                    </div>
                  </li>
                </ul>
                <p className="mt-6">
                  Want more <span className="font-semibold">tips</span> on how to get greater
                  support for your fundraiser? Check out our{' '}
                  <Link to="/fundraiser-tips" className="text-primary hover:underline">
                    fundraiser awareness
                  </Link>{' '}
                  video.
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="bg-[#f0f9f5] p-6 rounded-xl">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt="Share fundraiser interface"
                    width={300}
                    height={300}
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-5 gap-8 mb-16">
              <div className="md:col-span-3">
                <h3 className="text-2xl font-bold mb-6">
                  <span className="text-primary">3.</span> Post updates and thank donors
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Throughout your fundraising journey, you can post{' '}
                        <span className="font-semibold">fundraiser updates</span> to help increase
                        donations and keep donors informed
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Easily <span className="font-semibold">thank donors</span> within your
                        fundraising dashboard
                      </p>
                    </div>
                  </li>
                </ul>
                <p className="mt-6">
                  Find more tips on our blog about{' '}
                  <Link to="/blog/ask-for-donations" className="text-primary hover:underline">
                    how to ask for donations
                  </Link>{' '}
                  and how to write a{' '}
                  <Link
                    to="/blog/donation-thank-you-letter"
                    className="text-primary hover:underline"
                  >
                    donation thank-you letter
                  </Link>
                  .
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="bg-[#f0f9f5] p-6 rounded-xl">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt="Thank donors interface"
                    width={300}
                    height={300}
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid md:grid-cols-5 gap-8 mb-16">
              <div className="md:col-span-3">
                <h3 className="text-2xl font-bold mb-6">
                  <span className="text-primary">4.</span> Set up bank transfers
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        <span className="font-semibold">Add bank information</span> to start
                        receiving funds (you don't need to hit your fundraising goal to receive your
                        money)
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p>Add a beneficiary if you're raising donations for someone else</p>
                    </div>
                  </li>
                </ul>
                <p className="mt-6 text-sm italic">
                  *One small transaction fee is automatically deducted per donation. For more{' '}
                  <Link to="/help" className="text-primary hover:underline">
                    help with ib4me
                  </Link>{' '}
                  and information about{' '}
                  <Link to="/fees" className="text-primary hover:underline">
                    ib4me fees
                  </Link>
                  , visit our{' '}
                  <Link to="/pricing" className="text-primary hover:underline">
                    Pricing
                  </Link>{' '}
                  page.
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="bg-[#f0f9f5] p-6 rounded-xl">
                  <img
                    src="/placeholder.svg?height=300&width=300"
                    alt="Bank transfer interface"
                    width={300}
                    height={300}
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 mb-16">
              <Link to="/start-campaign">
                <Button size="lg" className="font-Lora">
                  Start a Campaign
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust & Safety Section */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6 font-Lora">
              Fast and safe fundraising on ib4me
            </h2>

            <p className="mb-4">
              Ib4me has become a trusted leader in online fundraising in Sierra Leone. That's why
              ib4me is the top platform of choice to{' '}
              <Link to="/start-campaign" className="text-primary hover:underline">
                start a fundraiser
              </Link>{' '}
              than any other fundraising site. Our{' '}
              <span className="font-semibold">Trust & Safety team</span> is dedicated to protecting
              organizers and donors so you can safely start a fundraiser or donate to a cause you
              care about. Learn more about our{' '}
              <Link to="/guarantee" className="text-primary hover:underline">
                ib4me Giving Guarantee
              </Link>{' '}
              and find answers to{' '}
              <Link to="/common-questions" className="text-primary hover:underline">
                common fundraising questions
              </Link>
              .
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-10">
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2 font-Lora">Secure Platform</h3>
                <p className="text-sm text-muted-foreground font-pt-serif">
                  Industry-leading security measures to protect your information and donations
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2 font-Lora">Fast Transfers</h3>
                <p className="text-sm text-muted-foreground font-pt-serif">
                  Receive your funds quickly with our streamlined withdrawal process
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2 font-Lora">24/7 Support</h3>
                <p className="text-sm text-muted-foreground font-pt-serif">
                  Our dedicated team is always available to assist with any questions
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 md:py-16 bg-[#0a8045]/5">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold mb-4 font-Lora">
              Ready to start your fundraiser?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join people who have successfully raised money for themselves, loved ones, and causes
              they care about.
            </p>
            <Link to="/start-campaign">
              <Button size="lg" className="font-Lora">
                Start a Campaign <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowIb4meWorks;
