import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Eye, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/SmartImage";
import { Listing } from "@/types/database";
import { formatPrice } from "@/lib/utils";

interface OwnerListingCardProps {
  listing: Listing;
  statusBadge: ReactNode;
  actionMenu: ReactNode;
  suspensionExplanation?: string;
  adminHint?: boolean;
}

export const OwnerListingCard = ({ listing, statusBadge, actionMenu, suspensionExplanation, adminHint = false }: OwnerListingCardProps) => {
  return (
    <Card className="overflow-hidden border-border bg-card hover:shadow-md transition-shadow">
      <div className="relative">
        <SmartImage
          src={listing.images?.[0] || "/placeholder.svg"}
          alt={listing.title}
          context="card"
          className="w-full aspect-[4/3]"
          objectFit="cover"
          lazy={true}
          quality="high"
          showLoadingState={true}
        />

        <div className="absolute top-2 left-2">{statusBadge}</div>
        <div className="absolute top-2 right-2">{actionMenu}</div>
      </div>

      <CardContent className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">
          <Link to={`/listing/${listing.id}`} className="hover:text-primary transition-colors">
            {listing.title}
          </Link>
        </h3>

        <p className="text-xl font-heading font-bold text-foreground">{formatPrice(listing.price, listing.currency || "XOF")}</p>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{listing.location || "Non precise"}</span>
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Eye className="h-3.5 w-3.5" />
            {listing.views_count || 0}
          </span>
        </div>

        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Creee le {new Date(listing.created_at).toLocaleDateString("fr-FR")}</span>
        </div>

        {suspensionExplanation && (
          <div className="rounded-md bg-muted p-2">
            <p className="text-xs text-muted-foreground">{suspensionExplanation}</p>
            {adminHint && <p className="mt-1 text-xs text-red-600">Contactez le support pour plus d'informations</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OwnerListingCard;
