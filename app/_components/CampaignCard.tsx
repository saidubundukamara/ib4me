import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";

interface CampaignCardProps {
  title: string;
  description?: string;
  imageUrl: string;
  raised: number;
  goal: number;
  donors: number;
  verified?: boolean;
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

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${currencyCode} ${value.toLocaleString()}`;
    }
  };

  const raisedLabel = formatCurrency(raised);
  const goalLabel = formatCurrency(goal);

  const isUrgent = urgent || urgency === "high";
  const isEndingSoon = !isUrgent && urgency === "medium";
  const showDaysLeft = typeof daysLeft === "number" && daysLeft >= 0;

  const cardContent = (
    <Card className="overflow-hidden rounded-3xl bg-card hover:shadow-[var(--shadow-lift)] transition-all duration-300 hover:-translate-y-1 border-0 cursor-pointer group">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          width={800}
          height={450}
          unoptimized
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Urgency / days-left badge */}
        {showDaysLeft ? (
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
        {verified && (
          <div className="absolute top-3 right-3 bg-fun-green backdrop-blur-sm text-white p-1.5 rounded-full shadow-lg">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
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
          <Progress
            value={percentage}
            className="h-3 bg-muted"
          />
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-bold text-blaze-orange text-lg">
                {raisedLabel}
              </span>
              <span className="text-muted-foreground"> raised of {goalLabel}</span>
            </div>
            <span className="font-semibold text-primary">{Math.round(percentage)}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex -space-x-1">
              {[0,1,2].map(i => (
                <div key={i} className="h-5 w-5 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center">
                  <span className="text-[8px] text-primary font-bold">♥</span>
                </div>
              ))}
            </div>
            <span className="font-bold text-card-foreground">{donors.toLocaleString()}</span>
            <span className="text-muted-foreground">donor{donors !== 1 ? "s" : ""}</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">{Math.round(percentage)}% funded</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button className="flex-1">Learn More</Button>
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
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default CampaignCard;
