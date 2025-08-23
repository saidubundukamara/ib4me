export type Campaign = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  donationsCount: number;
  amountRaised: number;
  currency: string;
  goalAmount: number;
};

export const sampleCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Recovery from my stroke",
    slug: "recovery-from-my-stroke",
    imageUrl: "/assets/wan.jpg",
    donationsCount: 1300,
    amountRaised: 62843,
    currency: "GBP",
    goalAmount: 74050,
  },
  {
    id: "2",
    title: "Des's fight against cancer",
    slug: "des-fight-against-cancer",
    imageUrl: "/assets/wan.jpg",
    donationsCount: 1600,
    amountRaised: 42643,
    currency: "GBP",
    goalAmount: 60919,
  },
  {
    id: "3",
    title: "Churchtown Playground",
    slug: "churchtown-playground",
    imageUrl: "/assets/wan.jpg",
    donationsCount: 9400,
    amountRaised: 271678,
    currency: "GBP",
    goalAmount: 286029,
  },
  {
    id: "4",
    title: "Help Peter David",
    slug: "help-peter-david",
    imageUrl: "/assets/wan.jpg",
    donationsCount: 500,
    amountRaised: 15000,
    currency: "GBP",
    goalAmount: 25000,
  },
];
