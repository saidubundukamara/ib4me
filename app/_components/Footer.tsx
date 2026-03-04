"use client";

import Ib4meLogo from "@/public/assets/ib4melogowhite.png";
import Link from "next/link";
import Image from "next/image";
import { StaticImageData } from "next/image";
import { Facebook, X, Instagram, Linkedin, Mail, ArrowRight } from "lucide-react";
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
        { text: "Browse Campaigns", url: "/campaigns" },
        { text: "Start Fundraising", url: "/dashboard" },
        { text: "How ib4me Works", url: "/how-ib4me-works" },
        { text: "About Us", url: "/about" },
        { text: "Pricing & Fees", url: "/pricing" },
      ],
    },
    {
      title: "Support",
      links: [
        { text: "FAQs", url: "/faqs" },
        { text: "Contact Us", url: "/contact" },
        { text: "Privacy Policy", url: "/privacy" },
        { text: "Terms of Service", url: "/terms" },
      ],
    },
  ],
  copyright = `\u00A9 ${new Date().getFullYear()} ib4me. All rights reserved.`,
  bottomLinks = [
    { text: "Terms and Conditions", url: "/terms" },
    { text: "Privacy Policy", url: "/privacy" },
  ],
}: FooterProps) => {
  const { config, openSettings } = useCookieConsent();
  const { social } = useSettings();

  const hasSocials =
    isValidUrl(social.facebook) ||
    isValidUrl(social.twitter) ||
    isValidUrl(social.instagram) ||
    isValidUrl(social.linkedin);

  return (
    <footer data-testid="footer" className="relative border-t-2 border-white/20 bg-primary text-white font-Sora">
      <div className="container mx-auto max-w-screen-xl px-6 pt-14 pb-8 sm:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 space-y-5">
            <Link href="/">
              <Image
                src={logo.src}
                alt={logo.alt}
                className="h-24 w-44 object-contain"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/80">
              A trusted platform connecting communities to support those in need through crowdfunding for social good.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Mail className="h-4 w-4 shrink-0" />
              <a href="mailto:ib4me.organisation@gmail.com" className="hover:text-white transition-colors">
                ib4me.organisation@gmail.com
              </a>
            </div>

            {hasSocials && (
              <div className="flex gap-2 pt-1">
                {isValidUrl(social.facebook) && (
                  <Link href={social.facebook} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/10 hover:bg-blaze-orange hover:text-white transition-colors">
                      <Facebook className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {isValidUrl(social.twitter) && (
                  <Link href={social.twitter} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/10 hover:bg-blaze-orange hover:text-white transition-colors">
                      <X className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {isValidUrl(social.instagram) && (
                  <Link href={social.instagram} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/10 hover:bg-blaze-orange hover:text-white transition-colors">
                      <Instagram className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {isValidUrl(social.linkedin) && (
                  <Link href={social.linkedin} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/10 hover:bg-blaze-orange hover:text-white transition-colors">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Link columns */}
          {menuItems.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/90">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.url}
                      className="text-sm text-white/60 transition-colors hover:text-blaze-orange"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CTA column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/90">
              Get Started
            </h3>
            <p className="mb-4 text-sm text-white/60">
              Ready to make a difference? Start your own campaign today.
            </p>
            <Button
              asChild
              className="rounded-xl bg-blaze-orange hover:bg-blaze-orange/90 text-white"
            >
              <Link href="/dashboard">
                Start a Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-xs text-white/50 sm:flex-row">
          <p>{copyright}</p>
          <ul className="flex flex-wrap items-center gap-4">
            {bottomLinks.map((link, linkIdx) => (
              <li key={linkIdx}>
                <Link href={link.url} className="hover:text-blaze-orange transition-colors">
                  {link.text}
                </Link>
              </li>
            ))}
            {config?.enabled && (
              <li>
                <button
                  onClick={openSettings}
                  className="hover:text-blaze-orange transition-colors"
                >
                  Cookie Settings
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
