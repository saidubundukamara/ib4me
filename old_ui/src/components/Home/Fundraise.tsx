import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { User, HeartHandshake, Users } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const Fundraise = () => {
  return (
    <section className=" py-8 md:py-16">
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-Lora font-semibold lg:text-4xl">
            Raise funds for anyone
          </h2>
        </div>
        <Card className="@min-4xl:max-w-full @min-4xl:grid-cols-3 @min-4xl:divide-x @min-4xl:divide-y-0 mx-auto mt-8 grid max-w-sm divide-y overflow-hidden shadow-zinc-950/5 *:text-center md:mt-16">
          <Link to="/campaigns">
            <div className="group shadow-zinc-950/5">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <User className="size-6" aria-hidden />
                </CardDecorator>

                <h3 className="mt-6 font-semibold font-pt-serif">Yourself</h3>
              </CardHeader>

              <CardContent>
                <p className="text-sm font-lexend-deca mb-2">
                  Funds are delivered to your bank account for your own use
                </p>
              </CardContent>
            </div>
          </Link>
          <Link to="/campaigns">
            <div className="group shadow-zinc-950/5">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <Users className="size-6" aria-hidden />
                </CardDecorator>

                <h3 className="mt-6 font-semibold font-pt-serif">Friends and family</h3>
              </CardHeader>

              <CardContent>
                <p className=" text-sm font-lexend-deca mb-2">
                  You'll invite a beneficiary to receive funds or distribute them yourself.
                </p>
              </CardContent>
            </div>
          </Link>
          <Link to="/campaigns">
            <div className="group shadow-zinc-950/5">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <HeartHandshake className="size-6" aria-hidden />
                </CardDecorator>

                <h3 className="mt-6 font-semibold font-pt-serif">Charity</h3>
              </CardHeader>

              <CardContent>
                <p className="text-sm font-lexend-deca">
                  Funds are delivered to your chosen nonprofit for you.
                </p>
              </CardContent>
            </div>
          </Link>
        </Card>
      </div>
    </section>
  );
};

export default Fundraise;

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
    />
    <div aria-hidden className="bg-radial to-background absolute inset-0 from-transparent to-75%" />
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
      {children}
    </div>
  </div>
);
