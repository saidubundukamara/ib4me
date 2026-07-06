"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Menu, ChevronRight, PhoneCall, Heart, MessageCircleQuestion, DollarSign,
    LogOutIcon, Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import Userprofile from "./UserMenu";
import Ib4meLogo from "@/public/assets/ib4melogo.png"
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { logout } from "@/lib/authClient";
import { useSession } from "next-auth/react";


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
        src: string | StaticImageData;
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
        url: "/",
        src: Ib4meLogo,
        alt: "logo",
    },
    menu = [
        {
            title: "Campaigns",
            url: "/campaigns",
        },
        {
            title: "Mobile Fundraisers",
            url: "/mobile-fundraisers",
        },
        {
            title: "About",
            url: "",
            items: [
                {
                    title: "How Ib4me Works",
                    description: "Learn how our platform operates and what you can do with it.",
                    icon: <MessageCircleQuestion className="size-5 shrink-0" />,
                    url: "/how-ib4me-works",
                },
                {
                    title: "Pricing",
                    description: "Explore our pricing.",
                    icon: <DollarSign className="size-5 shrink-0" />,
                    url: "/pricing",
                },
                {
                    title: "Contact Us",
                    description: "Get in touch with our support team.",
                    icon: <PhoneCall className="size-5 shrink-0" />,
                    url: "/contact",
                },
                {
                    title: "About ib4me",
                    description: "Learn more about our mission and team.",
                    icon: <Heart className="size-5 shrink-0" />,
                    url: "/about"
                },
            ],
        },

    ],
    auth = {
        login: { text: "Log in", url: "/auth/signin" },
        startcampaign: { text: "Start a Campaign", url: "/dashboard/campaigns/new" },
    },
}: NavbarProps) => {
    const [hasScrolled, setHasScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setHasScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (q) {
            router.push(`/campaigns?q=${encodeURIComponent(q)}`);
            setSearchQuery("");
            setSearchOpen(false);
        }
    };
    const avatarUrl = session?.user?.image ?? null;
    const name = session?.user?.name ?? "User";
    const avatarSeed = session?.user?.id ?? name;
    return (
        <section data-testid="navbar" className={`sticky top-0 z-40 w-full bg-background transition-all duration-200 ${hasScrolled ? "py-1.5 border-b border-border shadow-sm" : "py-3 border-b-0"}`}>
            <div className="container max-w-screen-xl px-5 mx-auto">
                {/* Desktop Menu */}
                <nav className="hidden justify-between lg:flex items-center">
                    <div className="flex items-center gap-6">
                        <a href={logo.url} className="flex items-center gap-2 shrink-0">
                            <Image src={logo.src} className="object-contain h-12 w-auto max-w-[180px]" alt={logo.alt} />
                        </a>
                        <div className="flex items-center font-Sora text-neutral-900 gap-1">
                            {menu.map((item) => {
                                if (item.items) {
                                    return (
                                        <NavigationMenu key={item.title}>
                                            <NavigationMenuList>
                                                {renderMenuItem(item, pathname)}
                                            </NavigationMenuList>
                                        </NavigationMenu>
                                    );
                                }
                                const isActive = item.url ? pathname === item.url || pathname.startsWith(item.url + "/") : false;
                                return (
                                    <a
                                        key={item.title}
                                        href={item.url}
                                        className={`inline-flex h-10 items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`}
                                    >
                                        {item.title}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 font-Sora">
                        {/* Search */}
                        <form onSubmit={handleSearchSubmit} className={`relative flex items-center transition-all duration-200 ${searchOpen ? "w-52" : "w-9"}`}>
                            <button
                                type="button"
                                onClick={() => { setSearchOpen((v) => !v); setTimeout(() => searchRef.current?.focus(), 50); }}
                                className="absolute left-0 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                aria-label="Search campaigns"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                            <input
                                ref={searchRef}
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                                placeholder="Search campaigns..."
                                className={`h-9 rounded-full border border-border bg-muted pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${searchOpen ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"}`}
                                aria-label="Search campaigns"
                            />
                        </form>
                        {isAuthenticated ? (
                            <Userprofile />
                        ) : (
                            <>
                                <Button asChild variant="outline" size="sm">
                                    <a href={auth.login.url}>{auth.login.text}</a>
                                </Button>
                                <Button asChild size="sm">
                                    <a href={auth.startcampaign.url}>{auth.startcampaign.text}</a>
                                </Button>
                            </>
                        )}
                    </div>
                </nav>
                {/* Mobile Menu */}
                <div className="block lg:hidden">
                    <div className="flex items-center justify-between">
                        <a href={logo.url} className="flex items-center gap-2">
                            <Image src={logo.src} className="h-10 w-auto max-w-[160px] object-contain" alt={logo.alt} />
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
                                            <Image src={logo.src} className="h-14 w-auto max-w-[200px] object-contain" alt={logo.alt} />
                                        </a>
                                    </SheetTitle>
                                </SheetHeader>
                                {status === "authenticated" && (
                                    <Card className="border-none shadow-none">
                                        <CardContent className="flex flex-col items-center text-center">
                                            <UserAvatar
                                                photoUrl={avatarUrl}
                                                seed={avatarSeed}
                                                name={name}
                                                className="h-20 w-20"
                                                imgClassName="h-full w-full object-cover"
                                            />

                                            <h2 className="mt-2 text-sm sm:text-lg font-Sora font-semibold">{name}</h2>
                                            <div className="w-full mt-4 space-y-2">
                                                <a href="/dashboard">
                                                    <button className="flex w-full cursor-pointer justify-between items-center hover:text-fun-green px-4 py-2 rounded-lg hover:bg-muted">
                                                        Manage Campaigns <ChevronRight size={16} />
                                                    </button>
                                                </a>
                                                <Button
                                                    type="button"
                                                    onClick={() => logout({ redirectTo: "/" })}
                                                    variant="default"
                                                    className="inline-flex items-center gap-2 mt-2 bg-blaze-orange hover:bg-blaze-orange/90 text-white"
                                                >
                                                    <LogOutIcon size={16} className="opacity-70" aria-hidden="true" />
                                                    <span>LogOut</span>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                <div className="flex flex-col gap-6 p-4">
                                    <Accordion
                                        type="single"
                                        collapsible
                                        className="flex w-full flex-col gap-4"
                                    >
                                        {menu.map((item) => renderMobileMenuItem(item, pathname))}
                                    </Accordion>
                                    <div className="flex flex-col gap-3">
                                        {status !== "authenticated" && (
                                            <>
                                                <Button asChild variant="outline" size="sm">
                                                    <a href={auth.login.url}>{auth.login.text}</a>
                                                </Button>
                                                <Button asChild size="sm">
                                                    <a href={auth.startcampaign.url}>{auth.startcampaign.text}</a>
                                                </Button>
                                            </>
                                        )}
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

const renderMenuItem = (item: MenuItem, pathname: string) => {
    const isActive = item.url ? pathname === item.url || pathname.startsWith(item.url + "/") : false;
    const hasActiveChild = item.items?.some(
        (sub) => sub.url && (pathname === sub.url || pathname.startsWith(sub.url + "/"))
    );

    if (item.items) {
        return (
            <NavigationMenuItem key={item.title} className="text-neutral-700">
                <NavigationMenuTrigger className={hasActiveChild ? "text-primary font-semibold" : ""}>
                    {item.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                    <div className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {item.items.map((subItem) => (
                            <NavigationMenuLink asChild key={subItem.title} className="w-80">
                                <SubMenuLink item={subItem} pathname={pathname} />
                            </NavigationMenuLink>
                        ))}
                    </div>
                </NavigationMenuContent>
            </NavigationMenuItem>
        );
    }

    return (
        <NavigationMenuItem key={item.title}>
            <a
                className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground ${
                    isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "bg-background text-muted-foreground"
                }`}
                href={item.url}
            >
                {item.title}
            </a>
        </NavigationMenuItem>
    );
};

const renderMobileMenuItem = (item: MenuItem, pathname: string) => {
    const isActive = item.url ? pathname === item.url || pathname.startsWith(item.url + "/") : false;

    if (item.items) {
        return (
            <AccordionItem key={item.title} value={item.title} className="border-b-0">
                <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
                    {item.title}
                </AccordionTrigger>
                <AccordionContent className="mt-2">
                    {item.items.map((subItem) => (
                        <SubMenuLink key={subItem.title} item={subItem} pathname={pathname} />
                    ))}
                </AccordionContent>
            </AccordionItem>
        );
    }

    return (
        <a
            key={item.title}
            href={item.url}
            className={`flex items-center justify-between py-2 text-base font-semibold transition-colors border-b border-border/40 last:border-0 ${isActive ? "text-primary" : "text-foreground hover:text-primary"}`}
        >
            {item.title}
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </a>
    );
};

const SubMenuLink = ({ item, pathname }: { item: MenuItem; pathname?: string }) => {
    const isActive = pathname && item.url
        ? pathname === item.url || pathname.startsWith(item.url + "/")
        : false;

    return (
        <a
            className={`flex flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground ${
                isActive ? "bg-primary/10 text-primary" : ""
            }`}
            href={item.url}
        >
            <div>{item.icon}</div>
            <div>
                <div className={`text-sm font-semibold ${isActive ? "text-primary" : ""}`}>
                    {item.title}
                </div>
                {item.description && (
                    <p className="text-sm leading-snug text-muted-foreground">
                        {item.description}
                    </p>
                )}
            </div>
        </a>
    );
};

export { Navbar };
