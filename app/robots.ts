import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/s/admin/', '/user/', '/dashboard/'],
      },
    ],
    sitemap: 'https://ib4me.org/sitemap.xml',
  };
}
