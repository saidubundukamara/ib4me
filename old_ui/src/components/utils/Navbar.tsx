import {
  Group,
  Menu,
  ChevronRight,
  Eclipse,
  MessageCircleQuestion,
  Lightbulb,
  PenLine,
  HeartHandshake,
  DollarSign,
  LifeBuoy,
  Link,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthContext } from '../Auth/AuthContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Userprofile from './Userprofile';
import Ib4meLogo from '@/assets/ib4me_logo.png';
import { Navigate } from 'react-router-dom';

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
  };
  menu?: MenuItem[];
  mobileExtraLinks?: {
    name: string;
    url: string;
  }[];
  auth?: {
    login: {
      text: string;
      url: string;
    };
    startcampaign: {
      text: string;
      url: string;
    };
  };
}

const Navbar = ({
  logo = {
    url: '/',
    src: Ib4meLogo,
    alt: 'logo',
  },
  menu = [
    {
      title: 'Donate',
      url: '#',
      items: [
        {
          title: 'Categories',
          description: 'Browse fundraisers by category',
          icon: <Group className="size-5 shrink-0" />,
          url: '/more-campaigns',
        },
        {
          title: 'Supporter Space',
          description: 'Browse job listing and discover our workspace',
          icon: <Eclipse className="size-5 shrink-0" />,
          url: '/supporter-space',
        },
      ],
    },
    {
      title: 'Fundraise',
      url: '#',
      items: [
        {
          title: 'How to start Ib4me',
          description: 'Step-by-step help, examples, and more',
          icon: <MessageCircleQuestion className="size-5 shrink-0" />,
          url: '/how-to-start-an-ib4me',
        },
        {
          title: 'Fundraising categories',
          description: 'Find the right category for you',
          icon: <Group className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Fundraising tips',
          description: 'The ultimate fundraising tips guide',
          icon: <PenLine className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Fundraising Ideas',
          description: 'Ideas to spark your creativity',
          icon: <Lightbulb className="size-5 shrink-0" />,
          url: '#',
        },
      ],
    },
    {
      title: 'About',
      url: '',
      items: [
        {
          title: 'How Ib4me Works',
          description: 'Learn how our platform operates and what you can do with it.',
          icon: <MessageCircleQuestion className="size-5 shrink-0" />,
          url: '/how-ib4me-works',
        },
        {
          title: 'Ib4me Giving Guarantee',
          description: 'Our commitment to transparency and impact in charitable giving.',
          icon: <HeartHandshake className="size-5 shrink-0" />,
          url: '/guarantee',
        },
        {
          title: 'Pricing',
          description: 'Explore our pricing.',
          icon: <DollarSign className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Help Center',
          description: 'Find answers to common questions and get support.',
          icon: <LifeBuoy className="size-5 shrink-0" />,
          url: '#',
        },
        {
          title: 'Ib4me.org',
          description: 'Discover more about our mission and organization.',
          icon: <Link className="size-5 shrink-0" />,
          url: '#',
        },
      ],
    },
  ],
  auth = {
    login: { text: 'Log in', url: '/auth/sign-in' },
    startcampaign: { text: 'Start a Campaign', url: '/create-campaign' },
  },
}: NavbarProps) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <section
      className={`py-4 sticky top-0 z-40 w-full bg-white transition-all ${
        hasScrolled ? 'border-b border-gray-100 shadow-sm' : 'border-b-0'
      }`}
    >
      <div className="container max-w-screen-xl px-5 mx-auto">
        {/* Desktop Menu */}
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <a href={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className="w-32 h-12 object-contain" alt={logo.alt} />
            </a>
            <div className="flex items-center font-serif text-neutral-900">
              <NavigationMenu>
                <NavigationMenuList>{menu.map((item) => renderMenuItem(item))}</NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex gap-2 font-pt-serif">
            <Button asChild size="sm">
              <a href={auth.startcampaign.url}>{auth.startcampaign.text}</a>
            </Button>
            {isAuthenticated ? (
              <Userprofile />
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <a href={auth.login.url}>{auth.login.text}</a>
                </Button>
              </>
            )}
          </div>
        </nav>
        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <a href={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className="w-32 h-12 object-contain" alt={logo.alt} />
            </a>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <a href={logo.url} className="flex items-center gap-2">
                      <img src={logo.src} className="w-32 h-12 object-contain" alt={logo.alt} />
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <Card className="border-none shadow-none">
                  <CardContent className="flex flex-col items-center text-center">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src="/path-to-image.jpg" alt="Joseph Melvin Kanu" />
                      <AvatarFallback>JM</AvatarFallback>
                    </Avatar>
                    <h2 className="mt-2 text-sm sm:text-lg font-Lora font-semibold">
                      Joseph Melvin Kanu
                    </h2>
                    <a href={`/profile/${name}`}>
                      <Button variant="link">
                        Profile <ChevronRight size={16} />
                      </Button>
                    </a>
                    <div className="w-full mt-4 space-y-2">
                      <button className="flex w-full cursor-pointer justify-between items-center px-4 py-2 rounded-lg hover:bg-gray-100">
                        Your impact <ChevronRight size={16} />
                      </button>
                      <a href="/profile-settings">
                        <button className="flex w-full cursor-pointer justify-between items-center px-4 py-2 rounded-lg hover:bg-gray-100">
                          Account settings <ChevronRight size={16} />
                        </button>
                      </a>
                      <a href="/my-fundraisers">
                        <button className="flex w-full cursor-pointer justify-between items-center px-4 py-2 rounded-lg hover:bg-gray-100">
                          My Fundraisers <ChevronRight size={16} />
                        </button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
                <Separator />
                <div className="flex flex-col gap-6 p-4">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>

                  <div className="flex flex-col gap-3">
                    <Button asChild variant="outline">
                      <a href={auth.login.url}>{auth.login.text}</a>
                    </Button>
                    <Button asChild>
                      <a href={auth.startcampaign.url}>{auth.startcampaign.text}</a>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title} className="text-muted-foreground">
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            {item.items.map((subItem) => (
              <NavigationMenuLink asChild key={subItem.title} className="w-80">
                <SubMenuLink item={subItem} />
              </NavigationMenuLink>
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <a
      key={item.title}
      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      {item.title}
    </a>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <a key={item.title} href={item.url} className="text-md font-semibold">
      {item.title}
    </a>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <a
      className="flex flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      <div>{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-sm leading-snug text-muted-foreground">{item.description}</p>
        )}
      </div>
    </a>
  );
};

export { Navbar };
