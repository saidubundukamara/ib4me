import { Button } from "@/components/ui/button";
import { formatMajor } from "@/lib/currency";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Share2, CheckCircle, ShieldAlert, Heart } from "lucide-react";
import ProgressBar from "@/app/_components/ProgressBar";
import Image from "next/image";
import Link from "next/link";

interface CampaignCardProps {
  title: string;
  description?: string;
  imageUrl?: string | null;
  raised: number;
  goal: number;
  donors: number;
  verified?: boolean;
  ownerVerified?: boolean;
  urgent?: boolean;
  urgency?: "low" | "medium" | "high";
  daysLeft?: number;
  href?: string;
  onShare?: () => void;
  currency?: string;
  category?: string;
}

const CampaignCard = ({
  title,
  description,
  imageUrl,
  raised,
  goal,
  donors,
  verified = false,
  ownerVerified = true,
  urgent = false,
  urgency,
  daysLeft,
  href,
  onShare,
  currency = "SLE",
  category,
}: CampaignCardProps) => {
  const percentage = Math.min(goal > 0 ? (raised / goal) * 100 : 0, 100);

  const currencyCode = (currency || "SLL").toUpperCase();

  const formatCurrency = (value: number) => formatMajor(value, currencyCode);

  const raisedLabel = formatCurrency(raised);
  const goalLabel = formatCurrency(goal);

  const isUrgent = urgent || urgency === "high";
  const isEndingSoon = !isUrgent && urgency === "medium";
  const showDaysLeft = typeof daysLeft === "number" && daysLeft >= 0;

  return (
    <Card className="overflow-hidden rounded-3xl bg-card hover:shadow-[var(--shadow-lift)] transition-all duration-300 hover:-translate-y-1 border-0 cursor-pointer group relative">
      {/* Invisible full-card link — screen readers use "Learn More" button below */}
      {href && (
        <Link href={href} className="absolute inset-0 z-0" aria-hidden tabIndex={-1} />
      )}

      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={imageUrl || "/assets/campaignplaceholderimage.png"}
          alt={title}
          width={800}
          height={450}
          unoptimized
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Goal reached / urgency / days-left badge */}
        {percentage >= 100 ? (
          <div className="absolute top-3 left-3 bg-fun-green text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Goal Reached!
          </div>
        ) : showDaysLeft ? (
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${daysLeft! <= 3 ? "bg-red-500 text-white animate-pulse" : daysLeft! <= 7 ? "bg-red-500 text-white" : "bg-amber-500 text-white"}`}>
            {daysLeft === 0 ? "Last day!" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
          </div>
        ) : isUrgent ? (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg animate-pulse">
            Urgent
          </div>
        ) : isEndingSoon ? (
          <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Ending Soon
          </div>
        ) : null}
        {verified && ownerVerified ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-3 right-3 bg-fun-green backdrop-blur-sm text-white p-1.5 rounded-full shadow-lg cursor-help">
                <CheckCircle className="w-4 h-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px] text-xs">
              ib4me verified the organizer&apos;s identity and campaign purpose.
            </TooltipContent>
          </Tooltip>
        ) : !ownerVerified ? (
          <div className="absolute top-3 right-3 bg-amber-500 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg">
            <ShieldAlert className="w-3 h-3" />
            Unverified
          </div>
        ) : null}
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title & Description */}
        <div>
          <h3 className="text-xl font-bold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {category && (
            <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full mb-2">
              {category}
            </span>
          )}
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Progress Bar with Gradient */}
        <div className="space-y-2">
          <ProgressBar value={percentage} className="h-3" />
          <div className="flex justify-between items-center text-sm">
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-bold text-blaze-orange text-lg cursor-default">
                    {raisedLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {currencyCode} — {currency === "SLE" ? "Sierra Leone Leone" : currency}
                </TooltipContent>
              </Tooltip>
              <span className="text-muted-foreground"> raised of {goalLabel}</span>
            </div>
            <span className="font-semibold text-primary">{Math.round(percentage)}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex -space-x-1">
              {[0, 1, 2].map((i) => {
                const filledHearts = donors >= 50 ? 3 : donors >= 10 ? 2 : donors >= 1 ? 1 : 0;
                const filled = i < filledHearts;
                return (
                  <div key={i} className="h-5 w-5 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center">
                    <Heart
                      className={`h-2.5 w-2.5 transition-colors ${filled ? "fill-red-600 text-red-600" : "text-red-700/40"}`}
                      strokeWidth={1.5}
                      style={filled ? undefined : { fill: "none" }}
                      aria-hidden="true"
                    />
                  </div>
                );
              })}
            </div>
            <span className="font-bold text-card-foreground">{donors.toLocaleString()}</span>
            <span className="text-muted-foreground">donor{donors !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Actions — z-10 so they sit above the invisible overlay link */}
        <div className="flex gap-3 pt-2 relative z-10">
          {href ? (
            <Button asChild className="flex-1">
              <Link href={href}>Learn More</Link>
            </Button>
          ) : (
            <Button className="flex-1">Learn More</Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare?.();
            }}
            type="button"
            aria-label="Share campaign"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CampaignCard;
