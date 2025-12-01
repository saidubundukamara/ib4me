"use client";

import Ib4meLogo from "@/public/assets/ib4melogowhite.png";
import Link from "next/link";
import Image from "next/image";
import { StaticImageData } from "next/image";
import { Facebook, X, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/cookie-consent";
import { useSettings } from "@/lib/settings-provider";

// Helper to validate URL - checks for valid non-empty string that isn't "null"
const isValidUrl = (url: unknown): url is string => {
  return typeof url === 'string' && url.length > 0 && url !== 'null' && url !== 'undefined';
};

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
        src: string | StaticImageData;
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

const Footer = ({
    logo = {
        src: Ib4meLogo,
        alt: "Ib4me Logo",
        url: "/",
    },
    menuItems = [
        {
            title: "Quick Links",
            links: [
                { text: "Browse Campaigns", url: "/more-campaigns" },
                { text: "Start Fundraising", url: "#" },
                { text: "How Ib4me works", url: "/how-ib4me-works" },
                { text: "Success Stories", url: "/success-stories" },
                { text: "About Us", url: "/about-us" },
            ],
        },
        {
            title: "Support",
            links: [
                { text: "Help Center", url: "/" },
                { text: "FAQs", url: "/faqs" },
                { text: "Privacy Policy", url: "/privacy" },
                { text: "Terms of Service", url: "/terms" },
                { text: "Contact Us", url: "/contact" },
            ],
        },
    ],
    copyright = `© ${new Date().getFullYear()} Copyright. All rights reserved.`,
    bottomLinks = [
        { text: "Terms and Conditions", url: "/terms" },
        { text: "Privacy Policy", url: "/privacy" },
    ],
}: FooterProps
) => {
    const { config, openSettings } = useCookieConsent();
    const { social } = useSettings();

    return (
        <section data-testid="footer" className="mt-16 pt-10 bg-primary text-white font-Sora">
            <div>
                <footer>
                    <div className=" container max-w-screen-2xl mx-auto px-10 grid grid-cols-2 gap-8 lg:grid-cols-5 lg:gap-16">
                        <div className="col-span-2 mb-8 lg:mb-0">
                            <div className="flex items-center gap-2 lg:justify-start">
                                <Link href="/">
                                    <Image
                                        src={logo.src}
                                        alt={logo.alt}
                                        className="h-28 w-48 object-contain"
                                    />
                                </Link>
                            </div>
                            <p className="text-primary-foreground/80 text-sm leading-relaxed">
                                A trusted platform connecting communities to support those in need of life-changing healthcare.
                            </p>
                            <div className="flex gap-3">
                                {isValidUrl(social.facebook) && (
                                    <Link href={social.facebook} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-blaze-orange hover:text-white">
                                            <Facebook className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                )}
                                {isValidUrl(social.twitter) && (
                                    <Link href={social.twitter} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-blaze-orange hover:text-white">
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                )}
                                {isValidUrl(social.instagram) && (
                                    <Link href={social.instagram} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-blaze-orange hover:text-white">
                                            <Instagram className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                )}
                                {isValidUrl(social.linkedin) && (
                                    <Link href={social.linkedin} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-blaze-orange hover:text-white">
                                            <Linkedin className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                        {menuItems.map((section, sectionIdx) => (
                            <div key={sectionIdx}>
                                <h3 className="mb-4 font-bold text-lg">{section.title}</h3>
                                <ul className="space-y-4 text-primary-foreground/70 transition-colors">
                                    {section.links.map((link, linkIdx) => (
                                        <li
                                            key={linkIdx}
                                            className="font-medium hover:text-orange-blaze"
                                        >
                                            <Link href={link.url}>{link.text}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="py-10 mt-24 px-10 flex flex-col justify-between gap-4 border-t  text-sm font-medium text-primary-foreground/80 md:flex-row md:items-center">
                        <p>{copyright}</p>
                        <ul className="flex gap-4">
                            {bottomLinks.map((link, linkIdx) => (
                                <li key={linkIdx} className="underline hover:text-orange-blaze">
                                    <Link href={link.url}>{link.text}</Link>
                                </li>
                            ))}
                            {config?.enabled && (
                                <li className="underline hover:text-orange-blaze">
                                    <button
                                        onClick={openSettings}
                                        className="hover:text-orange-blaze"
                                    >
                                        Cookie Settings
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                </footer>
            </div>
        </section>
    )
}

export default Footer







