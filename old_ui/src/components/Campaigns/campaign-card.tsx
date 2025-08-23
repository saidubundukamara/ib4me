import type { FC } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ProgressBar } from './progress';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CampaignCardProps } from '../../Types/campaign.types';

const CampaignCard: FC<CampaignCardProps> = ({
  id,
  title,
  imageUrl,
  donationsCount,
  amountRaised,
  currency = 'USD',
  goalAmount,
  progressPercentage,
  className,
}) => {
  const formatDonationsCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K donations`;
    }
    return `${count} donations`;
  };

  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  };

  const progress = progressPercentage || (goalAmount ? (amountRaised / goalAmount) * 100 : 100);

  return (
    <Link to={`/campaign/${id}`} className="block" aria-label={`View details for ${title}`}>
      <Card className={cn('overflow-hidden flex flex-col h-full group', className)}>
        <div className="relative">
          <div className="aspect-[16/9] overflow-hidden relative">
            <img
              width={400}
              height={255}
              src={imageUrl || '/placeholder.svg?height=225&width=400'}
              alt={title}
              className="object-cover transition-transform group-hover:scale-105 duration-500 w-full h-full"
            />
          </div>
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm font-medium px-3 py-1 rounded-full">
            {formatDonationsCount(donationsCount)}
          </div>
        </div>
        <CardContent className="flex-grow p-4">
          <h4 className="font-semibold text-sm sm:text-lg font-Lora line-clamp-2 mb-2">{title}</h4>
        </CardContent>
        <CardFooter className="flex flex-col items-start p-4 pt-0 gap-2">
          <ProgressBar value={progress} className="h-2 w-full" />
          <p className="font-bold text-sm sm:text-lg">
            {formatAmount(amountRaised, currency)} raised
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default CampaignCard;
