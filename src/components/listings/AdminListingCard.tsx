import { Eye, MapPin, Clock, User2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/SmartImage";

interface AdminListingCardProps {
  listing: any;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  onOpenDetails: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
}

const getStatusMeta = (status: string) => {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-green-500/10 text-green-700 border-green-500/20" };
    case "sold":
      return { label: "Vendue", className: "bg-blue-500/10 text-blue-700 border-blue-500/20" };
    case "expired":
      return { label: "Expiree", className: "bg-muted text-muted-foreground border-border" };
    case "suspended":
      return { label: "Suspendue", className: "bg-red-500/10 text-red-700 border-red-500/20" };
    default:
      return { label: status || "Inconnu", className: "bg-muted text-muted-foreground border-border" };
  }
};

const AdminListingCard = ({
  listing,
  formatCurrency,
  formatDate,
  onOpenDetails,
  onSuspend,
  onUnsuspend,
}: AdminListingCardProps) => {
  const status = getStatusMeta(listing.status);

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <SmartImage
          src={listing.images?.[0] || "/placeholder.svg"}
          alt={listing.title}
          context="card"
          className="w-full aspect-[4/3]"
          objectFit="cover"
          lazy={true}
          showLoadingState={true}
        />
        <div className="absolute left-2 top-2">
          <Badge className={status.className}>{status.label}</Badge>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1">
          <Button variant="secondary" size="sm" className="h-8 w-8 border border-border bg-background p-0" onClick={onOpenDetails}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <h4 className="line-clamp-2 text-sm font-semibold">{listing.title}</h4>
          <p className="text-xs text-muted-foreground">ID: {listing.id?.slice(-8)}</p>
        </div>

        <p className="text-lg font-heading font-bold text-foreground">{formatCurrency(listing.price)}</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
            <User2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{listing.merchant_name || "Marchand"}</span>
          </div>
          <div className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{listing.location || "Non precise"}</span>
          </div>
          <div className="inline-flex items-center gap-1 text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            <span>{listing.views_count || 0} vues</span>
          </div>
          <div className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(listing.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {listing.category_name || "Sans categorie"}
          </Badge>
          {listing.status === "suspended" && (
            <Badge className="bg-red-500/10 text-red-700 border-red-500/20 text-xs">
              {listing.is_temporarily_suspended ? "Susp. temp." : "Susp. perm."}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-2">
          <div className="text-xs text-muted-foreground">{listing.favorites_count || 0} favoris</div>
          <div className="flex items-center gap-1">
            {listing.status === "active" && (
              <>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onSuspend}>
                  Suspendre
                </Button>
              </>
            )}
            {listing.status === "suspended" && (
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onUnsuspend}>
                Reactiver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminListingCard;
