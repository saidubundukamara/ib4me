import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ib4me - Medical Emergency Fundraising',
    short_name: 'ib4me',
    description: 'Raise and donate for medical emergencies in Sierra Leone. Put fɔ wɛlbɔdi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00712D',
    icons: [
      {
        src: '/assets/ib4mefavicon.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/assets/ib4melogo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/ib4melogo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
