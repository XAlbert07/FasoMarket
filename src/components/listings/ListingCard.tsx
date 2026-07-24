import { Link } from "react-router-dom";
import { Heart, MapPin, Clock, Star, ImageIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SmartImage } from "@/components/ui/SmartImage";
import { Listing } from "@/types/database";
import { cn, formatPrice, formatRelativeTime } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  variant?: "grid" | "list";
  showCategory?: boolean;
  showSeller?: boolean;
  showFavorite?: boolean;
  showViews?: boolean;
  showFeatured?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (listingId: string) => void;
  href?: string;
  className?: string;
}

function isNewListing(created_at: string): boolean {
  const created = new Date(created_at);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return diffMs < 24 * 60 * 60 * 1000;
}

function formatViewsCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(".0", "")}k`;
  return String(count);
}

const CONDITION_STYLES: Record<string, { label: string; className: string }> = {
  new: {
    label: "Neuf",
    className: "bg-background/90 text-foreground border-border",
  },
  used: {
    label: "Occasion",
    className: "bg-background/90 text-foreground border-border",
  },
  refurbished: {
    label: "Reconditionné",
    className: "bg-background/90 text-foreground border-border",
  },
};

export const ListingCard = ({
  listing,
  variant = "grid",
  showCategory = false,
  showSeller = false,
  showFavorite = true,
  showViews = false,
  showFeatured = true,
  isFavorite = false,
  onToggleFavorite,
  href,
  className,
}: ListingCardProps) => {
  const listingHref = href || `/listing/${listing.id}`;
  const hasImage = Boolean(listing.images?.[0]);
  const categoryLabel = listing.category || listing.categories?.name;
  const isNew = isNewListing(listing.created_at);
  const conditionInfo = listing.condition ? CONDITION_STYLES[listing.condition] : null;
  const sellerName = listing.profiles?.full_name?.trim();
  const sellerInitial =
    sellerName?.charAt(0).toUpperCase() ||
    listing.profiles?.email?.charAt(0).toUpperCase() ||
    "V";
  const viewCount = listing.views_count || 0;

  return (
    <Link
      to={listingHref}
      className={cn(
        "group block overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-foreground/20",
        variant === "list" ? "flex flex-col md:flex-row" : "",
        className
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          variant === "list" ? "w-full md:w-[280px] md:flex-shrink-0" : ""
        )}
      >
        {hasImage ? (
          <SmartImage
            src={listing.images![0]}
            alt={listing.title}
            context={variant === "list" ? "thumbnail" : "card"}
            className={cn(
              "w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
              variant === "list"
                ? "aspect-[16/9] md:h-full md:min-h-[180px] md:aspect-auto"
                : "aspect-[4/3]"
            )}
            objectFit="cover"
            lazy={true}
            quality="high"
            showLoadingState={true}
          />
        ) : (
          <div
            className={cn(
              "flex w-full flex-col items-center justify-center bg-muted text-muted-foreground",
              variant === "list"
                ? "aspect-[16/9] md:min-h-[180px]"
                : "aspect-[4/3]"
            )}
          >
            <ImageIcon className="h-8 w-8 opacity-25" />
            {categoryLabel && (
              <span className="mt-2 text-xs font-medium opacity-50">{categoryLabel}</span>
            )}
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {showFeatured && listing.featured && (
            <Badge className="gap-0.5 border-0 bg-foreground/80 px-1.5 py-0 text-[10px] font-medium text-background">
              <Star className="h-2.5 w-2.5 fill-current" />
              Vedette
            </Badge>
          )}
          {isNew && !listing.featured && (
            <Badge className="border-0 bg-primary px-1.5 py-0 text-[10px] font-medium text-primary-foreground">
              Nouveau
            </Badge>
          )}
        </div>

        {conditionInfo && (
          <div className="absolute bottom-2 left-2">
            <Badge
              variant="outline"
              className={cn(
                "border px-1.5 py-0 text-[10px] font-medium backdrop-blur-sm",
                conditionInfo.className
              )}
            >
              {conditionInfo.label}
            </Badge>
          </div>
        )}

        {showFavorite && onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/90 text-muted-foreground shadow-sm hover:bg-background hover:text-red-500"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite(listing.id);
            }}
          >
            <Heart
              className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "")}
            />
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {showCategory && categoryLabel && (
          <p className="text-[11px] text-muted-foreground">{categoryLabel}</p>
        )}

        <p className="text-base font-heading font-semibold tracking-tight text-foreground">
          {formatPrice(listing.price, listing.currency || "XOF")}
        </p>

        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground/85 group-hover:text-foreground">
          {listing.title}
        </h3>

        {showSeller && sellerName && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Avatar className="h-4 w-4 border border-border">
              <AvatarImage src={listing.profiles?.avatar_url || undefined} alt="" />
              <AvatarFallback className="text-[8px]">
                {sellerInitial}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{sellerName.split(" ")[0]}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{listing.location || "BF"}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2">
            {showViews && viewCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {formatViewsCount(viewCount)}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(listing.created_at)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
