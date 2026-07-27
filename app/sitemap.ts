import type { MetadataRoute } from 'next';
import { getTippingState } from '@/lib/tipping';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only advertise /tip when tipping is actually live — indexing a page that tells
  // visitors the feature is disabled is worse than not indexing it.
  const { enabled: tippingEnabled } = await getTippingState();

  return [
    {
      url: 'https://ib4me.org',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://ib4me.org/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://ib4me.org/pricing',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://ib4me.org/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://ib4me.org/campaigns',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    ...(tippingEnabled
      ? [
          {
            url: 'https://ib4me.org/tip',
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
          },
        ]
      : []),
  ];
}
