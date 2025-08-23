import CampaignCard from '../Campaigns/campaign-card';
import { campaigns } from '../Campaigns/campaign-data';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, MegaphoneIcon, TargetIcon, CloudLightning } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Campaigns() {
  const [api, setApi] = useState<CarouselApi | null>(null);

  return (
    <main className="container max-w-screen-xl mx-auto py-16 px-4">
      <div className="flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center gap-4 py-5">
        <h1 className="text-2xl font-bold font-Lora m-0">
          Discover Campaigns inspired by what you care about
        </h1>
        <Link to="/campaigns">
          <Button>View All Campaigns</Button>
        </Link>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Help save Lives
                <ChevronDownIcon className="-me-1 opacity-60" size={16} aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-(--radix-dropdown-menu-trigger-width)">
              <DropdownMenuItem className="cursor-pointer">
                <div
                  className="bg-background flex size-8 items-center justify-center rounded-md border"
                  aria-hidden="true"
                >
                  <MegaphoneIcon size={16} className="opacity-60 text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">Just Started</div>
                  <div className="text-muted-foreground text-xs">
                    Fundraisers started in the last two days
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <div
                  className="bg-background flex size-8 items-center justify-center rounded-md border"
                  aria-hidden="true"
                >
                  <TargetIcon size={16} className="opacity-60 text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">Close to goal</div>
                  <div className="text-muted-foreground text-xs">
                    Fundraisers within 5% of their goal
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <div
                  className="bg-background flex size-8 items-center justify-center rounded-md border"
                  aria-hidden="true"
                >
                  <CloudLightning size={16} className="opacity-60 text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">Needs Momentum</div>
                  <div className="text-muted-foreground text-xs">
                    Fundraisers that needs a boost
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => api?.scrollPrev()}
            className="p-2 cursor-pointer rounded-full border text-green-400"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="p-2 cursor-pointer rounded-full border text-green-400"
          >
            <ArrowRight />
          </button>
        </div>
      </div>
      <Carousel setApi={setApi} opts={{ align: 'start' }}>
        <CarouselContent>
          {campaigns.map((campaign) => (
            <CarouselItem key={campaign.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <CampaignCard {...campaign} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </main>
  );
}
