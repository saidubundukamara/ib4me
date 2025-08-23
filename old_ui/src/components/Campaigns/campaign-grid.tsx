import type { FC } from 'react';
import CampaignCard from './campaign-card';
import { CampaignCardProps } from '../../Types/campaign.types';
import clsx from 'clsx';

interface CampaignGridProps {
  campaigns: Omit<CampaignCardProps, 'className'>[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const CampaignGrid: FC<CampaignGridProps> = ({ campaigns, columns = 3, className }) => {
  const columnClasses = {
    2: 'sm:grid-cols-1 md:grid-cols-2',
    3: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={clsx('grid grid-cols-1 gap-6', columnClasses[columns], className)}>
      {campaigns.map((campaign, index) => (
        <CampaignCard key={campaign.id || index} {...campaign} />
      ))}
    </div>
  );
};

export default CampaignGrid;
