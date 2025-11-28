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

  const cardContent = (
    <Card className="overflow-hidden rounded-3xl bg-card hover:shadow-[var(--shadow-lift)] transition-all duration-300 hover:-translate-y-2 border-0 cursor-pointer">
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          width={800}
          height={600}
          unoptimized
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {urgent && (
          <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-4 py-2 rounded-full text-xs font-bold uppercase shadow-lg animate-pulse">
            Urgent
          </div>
        )}
        {verified && (
          <div className="absolute top-4 right-4 bg-fun-green backdrop-blur-sm text-white p-2 rounded-full shadow-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
        )}
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
          <div className="text-sm">
            <span className="font-bold text-card-foreground">{donors}</span>
            <span className="text-muted-foreground"> donors</span>
          </div>
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
