interface MenuItem {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

interface FooterProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
  };
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}
import Ib4meLogo from '@/assets/ib4me_logo.png';
import { Link } from 'react-router-dom';
const Footer = ({
  logo = {
    src: Ib4meLogo,
    alt: 'Ib4me Logo',
    url: '/',
  },
  tagline = 'Put fɔ wɛlbɔdi',
  menuItems = [
    {
      title: 'Donate',
      links: [
        { text: 'Categories', url: '#' },
        { text: 'Social Impact', url: '#' },
        { text: 'Supporter Space', url: '#' },
      ],
    },
    {
      title: 'Fundraise',
      links: [
        { text: 'How to start Ib4me', url: '#' },
        { text: 'Team fundraising', url: '#' },
        { text: 'Fundraising Blog', url: '#' },
      ],
    },
    {
      title: 'About',
      links: [
        { text: 'How Ib4me works', url: '#' },
        { text: 'Ib4me Giving Guarantee', url: '#' },
        { text: 'Help Center', url: '#' },
        { text: 'Supported countries', url: '#' },
        { text: 'Ib4me.org', url: '#' },
      ],
    },
    {
      title: 'Socials',
      links: [
        { text: 'Twitter', url: '#' },
        { text: 'Instagram', url: '#' },
        { text: 'LinkedIn', url: '#' },
      ],
    },
  ],
  copyright = `© ${new Date().getFullYear()} Copyright. All rights reserved.`,
  bottomLinks = [
    { text: 'Terms and Conditions', url: '#' },
    { text: 'Privacy Policy', url: '#' },
  ],
}: FooterProps) => {
  return (
    <section className="mt-16 pt-10 bg-neutral-100">
      <div>
        <footer>
          <div className=" container max-w-screen-2xl mx-auto px-10 grid grid-cols-2 gap-8 lg:grid-cols-6">
            <div className="col-span-2 mb-8 lg:mb-0">
              <div className="flex items-center gap-2 lg:justify-start">
                <Link to="/">
                  <img src={logo.src} alt={logo.alt} className="h-28 w-48 object-contain" />
                  <p className="font-bold font-Lora text-3xl">{tagline}</p>
                </Link>
              </div>
            </div>
            {menuItems.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="space-y-4 text-muted-foreground">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx} className="font-medium hover:text-primary">
                      <Link to={link.url}>{link.text}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="py-10 mt-24 px-10 flex flex-col justify-between gap-4 border-t  text-sm font-medium text-muted-foreground md:flex-row md:items-center">
            <p>{copyright}</p>
            <ul className="flex gap-4">
              {bottomLinks.map((link, linkIdx) => (
                <li key={linkIdx} className="underline hover:text-primary">
                  <Link to={link.url}>{link.text}</Link>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default Footer;
