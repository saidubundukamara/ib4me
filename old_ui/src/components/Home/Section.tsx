import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Section = () => {
  return (
    <section className="py-16 md:py-32 bg-brown-300">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-2 md:gap-12">
          <h2 className="text-3xl sm:text-4xl font-medium font-poppins">
            Fundraising on Ib4me is easy, powerful, and trusted.
          </h2>
          <div className="space-y-6 font-pt-serif">
            <p>
              Get what you need to help your fundraiser succeed on Ib4me, whether you're raising
              money for yourself, friends, family, or charity. With no fee to start, Ib4me is the
              Sierra Leones's leading crowdfunding platform for medical emergencies. Whenever you
              need help, you can ask here.
            </p>
            <p>Still have questions? Learn more about how Ib4me works.</p>
            <Button asChild variant="secondary" size="sm" className="gap-1 pr-1.5">
              <Link to="#">
                <span>Learn More</span>
                <ChevronRight className="size-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Section;
