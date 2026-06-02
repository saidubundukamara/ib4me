import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, MessageCircle, Phone, X } from "lucide-react";
import Ib4meLogoWhite from "@/public/assets/ib4melogowhite.png";

type Contact = {
  email?: string;
  phone?: string;
} | null;

type Social = {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
} | null;

interface MaintenanceScreenProps {
  contact?: Contact;
  social?: Social;
}

export default function MaintenanceScreen({ contact, social }: MaintenanceScreenProps) {
  const socialLinks = [
    { href: social?.facebook, label: "Facebook", Icon: Facebook },
    { href: social?.twitter, label: "X", Icon: X },
    { href: social?.instagram, label: "Instagram", Icon: Instagram },
    { href: social?.linkedin, label: "LinkedIn", Icon: Linkedin },
    {
      href: social?.whatsapp
        ? `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, "")}`
        : undefined,
      label: "WhatsApp",
      Icon: MessageCircle,
    },
  ].filter((s) => Boolean(s.href));

  return (
    <main
      className="font-Sora relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
      style={{
        background:
          "radial-gradient(120% 120% at 50% -10%, #0a8f3c 0%, #00712D 38%, #014a20 100%)",
      }}
    >
      {/* Atmospheric glow orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, #FF6000 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-24 h-[26rem] w-[26rem] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, #80E10A 0%, transparent 70%)" }}
      />

      {/* Fine grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(75% 75% at 50% 40%, #000 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(75% 75% at 50% 40%, #000 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-xl">
        {/* Logo */}
        <div className="animate-fade-up flex justify-center">
          <Image
            src={Ib4meLogoWhite}
            alt="IB4ME"
            width={150}
            height={44}
            priority
            className="h-auto w-[150px]"
          />
        </div>

        {/* Status pill */}
        <div className="animate-fade-up delay-100 mt-10 flex justify-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "#FBB03B", animation: "ms-ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }}
              />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "#FF6000" }} />
            </span>
            Scheduled maintenance
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-150 mt-7 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          We&apos;ll be right{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(100deg, #FBB03B, #FF6000)" }}
          >
            back
          </span>
        </h1>

        {/* Body */}
        <p className="animate-fade-up delay-200 mx-auto mt-5 max-w-md text-base leading-relaxed text-white/70">
          The platform is currently under maintenance. We&apos;re making things better
          for you and will be back online shortly &mdash; please check back later.
        </p>

        {/* Breathing progress shimmer */}
        <div className="animate-fade-up delay-300 mx-auto mt-9 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-1/2 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #80E10A, #FBB03B, transparent)",
              animation: "ms-sweep 2.1s ease-in-out infinite",
            }}
          />
        </div>

        {/* Support + social */}
        {(contact?.email || contact?.phone || socialLinks.length > 0) && (
          <div className="animate-fade-up delay-400 mt-12 border-t border-white/10 pt-8">
            {(contact?.email || contact?.phone) && (
              <div className="flex flex-col items-center justify-center gap-3 text-sm text-white/70 sm:flex-row sm:gap-6">
                <span className="text-white/45">Need help?</span>
                {contact?.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 transition-colors hover:text-white"
                  >
                    <Mail className="h-4 w-4" style={{ color: "#FBB03B" }} />
                    {contact.email}
                  </a>
                )}
                {contact?.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-2 transition-colors hover:text-white"
                  >
                    <Phone className="h-4 w-4" style={{ color: "#FBB03B" }} />
                    {contact.phone}
                  </a>
                )}
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-7 flex items-center justify-center gap-3">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local keyframes */}
      <style>{`
        @keyframes ms-ping { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes ms-sweep {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(340%); }
        }
      `}</style>
    </main>
  );
}
