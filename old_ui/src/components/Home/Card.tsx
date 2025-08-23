import { Badge } from 'lucide-react';
import { Link } from 'react-router-dom';

const Card = () => {
  return (
    <section className="py-16 md:py-32 bg-green-400">
      <div className="mx-auto max-w-7xl space-y-5 px-6">
        <h2 className="max-w-xl text-4xl text-neutral-50 font-Lora font-medium lg:text-5xl">
          We've got you covered.
        </h2>
        <div className=" space-y-4">
          <p className="text-body text-xl font-lexend-deca text-neutral-200 sm:text-2xl">
            Ib4me is a trusted leader in online fundraising. With{' '}
            <Link to="" className="text-brown-100 underline">
              simple pricing{' '}
            </Link>
            and a team of{' '}
            <Link to="" className="text-brown-100 underline">
              Trust & Safety
            </Link>{' '}
            experts in your corner, you can raise money or make a donation with peace of mind.
          </p>
          <div className="flex items-center gap-2">
            <Badge className="size-4 text-neutral-50" />
            <p className="text-neutral-300 text-xs font-sans sm:text-sm">
              <Link to="" className="hover:text-brown-100">
                Read the Ib4me Giving Guarantee
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Card;
