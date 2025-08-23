export interface CampaignCardProps {
  id: string;
  title: string;
  imageUrl: string;
  donationsCount: number;
  amountRaised: number;
  currency?: string;
  goalAmount?: number;
  category?: string;
  urgencyLevel?: string;
  progressPercentage?: number;
  className?: string;
}

export interface Campaigninfo extends CampaignCardProps {
  image?: string;
  description: string;
  raised: number;
  goal: number;
  supporters: number;
  daysLeft: number;
  updates: CampaignUpdate[];
  comments: CampaignComment[];
  donations: Donation[];
  organizer: Organizer;
}

export interface CampaignUpdate {
  title: string;
  date: string;
  content: string;
}

export interface CampaignComment {
  name: string;
  date: string;
  comment: string;
}

export interface Donation {
  name: string;
  amount: string | number;
  date: string;
  message?: string;
}

export interface Organizer {
  name: string;
  image?: string;
  relationship: string;
  created: string;
  totalImpact: number;
  fundraisersSupported: number;
  peopleInspired: number;
  sharedFundraisers: { title: string; sharedDate: string }[];
  donations: { fundraiserTitle: string; amount: number; date: string }[];
}

export interface DonationFormData {
  amount: string | number;
  name: string;
  email: string;
  anonymous: boolean;
  message?: string;
}
