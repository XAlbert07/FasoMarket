import { Link } from "react-router-dom";
import { Heart, MapPin, Eye, UserCheck, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/SmartImage";
import { Listing } from "@/types/database";
import { cn, formatPrice, formatRelativeTime, formatViewsCount, isListingNew } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  variant?: "grid" | "list";
  showCategory?: boolean;
  showSeller?: boolean;
  showFavorite?: boolean;
  showViews?: boolean;
  showCta?: boolean;
  showFeatured?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (listingId: string) => void;
  href?: string;
  className?: string;
}

export const ListingCard = ({
  listing,
  variant = "grid",
  showCategory = true,
  showSeller = true,
  showFavorite = true,
  showViews = true,
  showCta: _showCta = true,
  showFeatured = true,
  isFavorite = false,
  onToggleFavorite,
  href,
  className,
}: ListingCardProps) => {
  const listingHref = href || `/listing/${listing.id}`;

  return (
    <Link
      to={listingHref}
      className={cn(
        "group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/35 hover:shadow-md",
        variant === "list" ? "flex flex-col md:flex-row" : "",
        className
      )}
    >
      <div className={cn("relative", variant === "list" ? "w-full md:w-[300px] md:flex-shrink-0" : "")}>
        <SmartImage
          src={listing.images?.[0] || "/placeholder.svg"}
          alt={listing.title}
          context={variant === "list" ? "thumbnail" : "card"}
          className={cn(
            "w-full object-cover",
            variant === "list" ? "aspect-[16/9] md:h-full md:min-h-[180px] md:aspect-auto" : "aspect-[4/3]"
          )}
          objectFit="cover"
          lazy={true}
          quality="high"
          showLoadingState={true}
        />

        {showFavorite && onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 bg-white/85 text-muted-foreground backdrop-blur-sm hover:bg-white hover:text-primary"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite(listing.id);
            }}
          >
            <Heart className={cn("h-4 w-4", isFavorite ? "fill-destructive text-destructive" : "")} />
          </Button>
        )}

        {isListingNew(listing.created_at) && (
          <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">Nouveau</Badge>
        )}

        {showFeatured && listing.featured && (
          <Badge className="absolute bottom-2 left-2 gap-1 bg-secondary text-secondary-foreground">
            <Star className="h-3 w-3" />
            Vedette
          </Badge>
        )}

        {showViews && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/55 px-2 py-1 text-xs text-white">
            <Eye className="h-3 w-3" />
            <span>{formatViewsCount(listing.views_count || 0)}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 p-2.5 sm:space-y-2.5 sm:p-3">
        <p className="line-clamp-2 min-h-[2.35rem] break-words text-[13px] font-semibold leading-tight text-foreground transition-colors group-hover:text-primary sm:min-h-0 sm:text-[15px] sm:leading-snug">
          {listing.title}
        </p>

        <p className="text-[18px] font-heading font-bold leading-none tracking-tight text-foreground sm:text-[22px]">
          {formatPrice(listing.price, listing.currency || "XOF")}
        </p>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{listing.location || "Non precise"}</span>
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeTime(listing.created_at)}
          </span>
        </div>

        {(showSeller || showCategory) && <div className="h-px bg-border/70" />}

        {(showSeller || showCategory) && (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            {showSeller ? (
              <div className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <UserCheck className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span className="truncate">{listing.profiles?.full_name || "Vendeur verifie"}</span>
              </div>
            ) : (
              <span />
            )}

            {showCategory && (
              <Badge
                variant="outline"
                className="h-6 w-fit max-w-full rounded-full border-border/80 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {listing.category || listing.categories?.name || "Non specifiee"}
              </Badge>
            )}
          </div>
        )}

      </div>
    </Link>
  );
};

export default ListingCard;
