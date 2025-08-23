import Wan from '../../assets/wan.jpg';
import { Campaigninfo } from '../../Types/campaign.types';

export const campaigns: Campaigninfo[] = [
  {
    id: '1',
    title: 'Recovery from my stroke',
    imageUrl: Wan,
    donationsCount: 1300,
    amountRaised: 62843,
    currency: 'GBP',
    urgencyLevel: 'Medium',
    progressPercentage: 85,
    className: 'bg-white shadow-lg',
    image: Wan,
    description:
      'Help me recover from a severe stroke that has impacted my mobility and daily life.',
    raised: 62843,
    goal: 74050,
    supporters: 1300,
    daysLeft: 30,
    updates: [
      {
        title: 'Therapy Update',
        date: '2025-03-15',
        content: 'Started physical therapy last week, making slow but steady progress!',
      },
    ],
    comments: [
      {
        name: 'Alice',
        date: '2025-03-20',
        comment: 'Wishing you a speedy recovery!',
      },
    ],
    donations: [
      {
        name: 'John Smith',
        amount: 50,
        date: '2025-03-10',
        message: 'Get well soon!',
      },
    ],
    organizer: {
      name: 'Jane Doe',
      image: Wan,
      relationship: 'Family',
      created: '2025-03-01',
      totalImpact: 5,
      fundraisersSupported: 3,
      peopleInspired: 10,
      sharedFundraisers: [
        { title: 'Fundraiser 1', sharedDate: '2025-03-01' },
        { title: 'Fundraiser 2', sharedDate: '2025-03-05' },
      ],
      donations: [
        {
          fundraiserTitle: 'Initial Donation',
          amount: 100,
          date: '2025-03-01',
        },
      ],
    },
  },
  {
    id: '2',
    title: "Des's fight against cancer",
    imageUrl: Wan,
    donationsCount: 1600,
    amountRaised: 42643,
    currency: 'GBP',
    progressPercentage: 70,
    className: 'bg-white shadow-lg',
    image: Wan,
    description:
      'Support Des in his battle against cancer with medical expenses and treatment costs.',
    raised: 42643,
    goal: 60919,
    supporters: 1600,
    daysLeft: 45,
    updates: [
      {
        title: 'Chemo Update',
        date: '2025-03-18',
        content: 'First round of chemotherapy completed successfully.',
      },
    ],
    comments: [
      {
        name: 'Bob',
        date: '2025-03-19',
        comment: 'Stay strong, Des!',
      },
    ],
    donations: [
      {
        name: 'Sarah Brown',
        amount: 200,
        date: '2025-03-05',
        message: 'Stay strong!',
      },
    ],
    organizer: {
      name: 'Sarah Brown',
      image: Wan,
      relationship: 'Friend',
      created: '2025-03-05',
      totalImpact: 8,
      fundraisersSupported: 5,
      peopleInspired: 15,
      sharedFundraisers: [
        { title: 'Fundraiser 1', sharedDate: '2025-03-01' },
        { title: 'Fundraiser 2', sharedDate: '2025-03-05' },
      ],
      donations: [
        {
          fundraiserTitle: 'Initial Donation',
          amount: 200,
          date: '2025-03-05',
        },
      ],
    },
  },
  {
    id: '3',
    title: 'Churchtown Playground',
    imageUrl: Wan,
    donationsCount: 9400,
    amountRaised: 271678,
    currency: 'GBP',
    progressPercentage: 95,
    className: 'bg-white shadow-lg',
    image: Wan,
    description: 'Help us build a safe and fun playground for the children of Churchtown.',
    raised: 271678,
    goal: 286029,
    supporters: 9400,
    daysLeft: 20,
    updates: [
      {
        title: 'Construction Started',
        date: '2025-03-20',
        content: 'Groundbreaking ceremony held yesterday!',
      },
    ],
    comments: [
      {
        name: 'Mike',
        date: '2025-03-21',
        comment: 'Great project for the community!',
      },
      {
        name: 'Tom Johnson',
        date: '2025-03-15',
        comment: 'Proud to support our kids!',
      },
    ],
    organizer: {
      name: 'Tom Johnson',
      image: Wan,
      relationship: 'Community Leader',
      created: '2025-03-01',
      totalImpact: 12,
      fundraisersSupported: 7,
      peopleInspired: 20,
      sharedFundraisers: [
        { title: 'Fundraiser 1', sharedDate: '2025-03-01' },
        { title: 'Fundraiser 2', sharedDate: '2025-03-05' },
      ],
      donations: [
        {
          fundraiserTitle: 'Community Support',
          amount: 500,
          date: '2025-03-01',
        },
      ],
    },
    donations: [
      {
        name: 'Emily Clark',
        amount: 100,
        date: '2025-03-15',
        message: 'Excited to see the playground completed!',
      },
    ],
  },
  {
    id: '4',
    title: 'Help Peter David',
    imageUrl: Wan,
    donationsCount: 500,
    amountRaised: 15000,
    currency: 'GBP',
    progressPercentage: 60,
    className: 'bg-white shadow-lg',
    image: Wan,
    description: 'Support Peter David in rebuilding his life after a devastating fire.',
    raised: 15000,
    goal: 25000,
    supporters: 500,
    daysLeft: 15,
    updates: [
      {
        title: 'Relief Fund',
        date: '2025-03-22',
        content: 'Temporary housing secured thanks to your donations.',
      },
    ],
    comments: [
      {
        name: 'Sophie',
        date: '2025-03-26',
        comment: 'Hoping for the best!',
      },
    ],
    donations: [
      {
        name: 'David Lee',
        amount: 200,
        date: '2025-03-18',
        message: 'Stay strong!',
      },
    ],
    organizer: {
      name: 'Lisa White',
      image: Wan,
      relationship: 'Neighbor',
      created: '2025-03-10',
      totalImpact: 6,
      fundraisersSupported: 4,
      peopleInspired: 12,
      sharedFundraisers: [
        { title: 'Fundraiser 1', sharedDate: '2025-03-01' },
        { title: 'Fundraiser 2', sharedDate: '2025-03-05' },
      ],
      donations: [
        {
          fundraiserTitle: 'Relief Support',
          amount: 150,
          date: '2025-03-10',
        },
      ],
    },
  },
];
