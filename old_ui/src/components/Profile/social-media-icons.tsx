import type React from 'react';

import {
  Instagram,
  TwitterIcon as TikTok,
  Facebook,
  Youtube,
  Linkedin,
  LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialHandle {
  platform: string;
  handle: string;
}

interface SocialMediaIconsProps {
  socialHandles: SocialHandle[];
  isOwnProfile: boolean;
  onAddSocialHandles: () => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-6 w-6 text-[#E1306C]" />,
  tiktok: <TikTok className="h-6 w-6 text-black" />,
  x: <XIcon className="h-6 w-6 text-black" />,
  facebook: <Facebook className="h-6 w-6 text-[#1877F2]" />,
  linktree: <LinkIcon className="h-6 w-6 text-[#43E660]" />,
  youtube: <Youtube className="h-6 w-6 text-[#FF0000]" />,
  linkedin: <Linkedin className="h-6 w-6 text-[#0A66C2]" />,
  twitch: <TwitchIcon className="h-6 w-6 text-[#9146FF]" />,
};

export default function SocialMediaIcons({
  socialHandles,
  isOwnProfile,
  onAddSocialHandles,
}: SocialMediaIconsProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-center gap-3 mb-3">
        {socialHandles.length > 0 ? (
          socialHandles.map((handle, index) => (
            <a
              key={index}
              href={`https://www.${handle.platform}.com/${handle.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-2 hover:bg-muted transition-colors"
            >
              {platformIcons[handle.platform.toLowerCase()] || <LinkIcon className="h-6 w-6" />}
            </a>
          ))
        ) : (
          <div className="flex gap-2">
            <Instagram className="h-6 w-6 text-muted-foreground" />
            <TikTok className="h-6 w-6 text-muted-foreground" />
            <XIcon className="h-6 w-6 text-muted-foreground" />
            <Facebook className="h-6 w-6 text-muted-foreground" />
            <LinkIcon className="h-6 w-6 text-muted-foreground" />
            <Youtube className="h-6 w-6 text-muted-foreground" />
            <Linkedin className="h-6 w-6 text-muted-foreground" />
            <TwitchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {isOwnProfile && (
        <Button variant="outline" size="sm" onClick={onAddSocialHandles} className="rounded-full">
          Add social handles
        </Button>
      )}
    </div>
  );
}

// Custom icons for platforms without Lucide equivalents
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function TwitchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" />
    </svg>
  );
}
