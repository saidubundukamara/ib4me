import { ArrowDownRight } from 'lucide-react';
import HeroImage from '../../assets/Hero.png';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface HeroProps {
  heading?: string;
  description?: string;
  buttons?: {
    primary?: {
      text: string;
      url: string;
    };
    secondary?: {
      text: string;
      url: string;
    };
  };
}

const Hero = ({
  heading = " Let's come together as a community and Ib4me",
  description = 'Connect with a community that cares. Raise funds for medical treatments, support healthcare needs, and help others in their journey to wellness.',
  buttons = {
    primary: {
      text: 'Ib4me Now',
      url: '/campaigns',
    },
    secondary: {
      text: 'Start a Campaign',
      url: '/create-campaign',
    },
  },
}: HeroProps) => {
  return (
    <section>
      <div className="container max-w-screen-xl py-5 sm:py-10 px-4 mx-auto my-5 grid items-center gap-6 lg:grid-cols-2 lg:gap-20">
        <div className="mx-auto flex flex-col items-center text-center md:ml-auto lg:max-w-3xl lg:items-start lg:text-left">
          <h1 className="my-6 text-pretty text-3xl font-montserrat font-bold lg:text-5xl xl:text-6xl">
            {heading}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-xl sm:text-xl text-lg font-poppins">
            {description}
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
            {buttons.secondary && (
              <Button asChild className="w-full font-pt-serif sm:w-auto">
                <Link to={buttons.secondary.url}>
                  {buttons.secondary.text}
                  <ArrowDownRight className="ml-2 size-4" />
                </Link>
              </Button>
            )}
            {buttons.primary && (
              <Button asChild variant="outline" className="w-full font-pt-serif sm:w-auto">
                <Link to={buttons.primary.url}>{buttons.primary.text}</Link>
              </Button>
            )}
          </div>
        </div>
        <div className="flex">
          <img
            src={HeroImage}
            alt="placeholder hero"
            className="max-h-[600px] w-full rounded-md object-cover lg:max-h-[800px]"
          />
        </div>
      </div>
    </section>
  );
};

export { Hero };
