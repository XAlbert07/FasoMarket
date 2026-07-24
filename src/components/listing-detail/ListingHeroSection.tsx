import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { OptimizedImageDisplay } from "@/components/OptimizedImageDisplay";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Eye,
  MapPin,
  Package,
  ChevronRight as Chevron,
} from "lucide-react";

interface ListingHeroSectionProps {
  listing: any;
  currentImageIndex: number;
  onOpenImageViewer: () => void;
  onImageNavigation: (direction: "prev" | "next") => void;
  onSelectImage: (index: number) => void;
  sellerProfile?: any;
  displayListingsCount?: string;
}

const conditionLabels: Record<string, string> = {
  new: "Neuf",
  refurbished: "Reconditionné",
  used: "Occasion",
};

const ListingHeroSection = ({
  listing,
  currentImageIndex,
  onOpenImageViewer,
  onImageNavigation,
  onSelectImage,
}: ListingHeroSectionProps) => {
  const [isImageFading, setIsImageFading] = useState(false);
  const categoryName = listing.categories?.name || "Sans catégorie";
  const conditionKey = listing.condition || "used";
  const conditionText = conditionLabels[conditionKey] || "Occasion";

  useEffect(() => {
    setIsImageFading(true);
    const timeout = setTimeout(() => setIsImageFading(false), 180);
    return () => clearTimeout(timeout);
  }, [currentImageIndex]);

  return (
    <div className="space-y-4 md:space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">
          Accueil
        </Link>
        <Chevron className="h-3.5 w-3.5" />
        <Link to="/listings" className="transition-colors hover:text-foreground">
          Annonces
        </Link>
        <Chevron className="h-3.5 w-3.5" />
        <Link
          to={`/category/${listing.categories?.slug || listing.category_id || ""}`}
          className="transition-colors hover:text-foreground"
        >
          {categoryName}
        </Link>
      </nav>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        {listing.images && listing.images.length > 0 ? (
          <div className="relative">
            <div
              className="relative aspect-square max-h-[480px] cursor-pointer overflow-hidden bg-muted md:aspect-[16/10]"
              onClick={onOpenImageViewer}
            >
              <OptimizedImageDisplay
                key={currentImageIndex}
                src={listing.images[currentImageIndex]?.url || listing.images[currentImageIndex]}
                alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                className={`transition-opacity duration-200 ${isImageFading ? "opacity-70" : "opacity-100"}`}
                aspectRatio="auto"
                quality="large"
                enableZoom={true}
                onZoomClick={onOpenImageViewer}
                priority={currentImageIndex === 0}
              />

              {listing.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageNavigation("prev");
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageNavigation("next");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
                    {listing.images.map((_: unknown, index: number) => (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectImage(index);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                        }`}
                        aria-label={`Image ${index + 1}`}
                      />
                    ))}
                  </div>

                  <div className="absolute right-3 top-3 rounded bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                </>
              )}
            </div>

            {listing.images.length > 1 && (
              <div className="hidden items-center gap-2 overflow-x-auto border-t border-border bg-muted/40 p-2.5 md:flex">
                {listing.images.map((image: any, index: number) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onSelectImage(index)}
                    className={`relative h-14 w-16 flex-shrink-0 overflow-hidden rounded border transition-opacity ${
                      index === currentImageIndex
                        ? "border-foreground opacity-100"
                        : "border-transparent opacity-55 hover:opacity-100"
                    }`}
                  >
                    <OptimizedImageDisplay
                      src={image?.url || image}
                      alt={`${listing.title} miniature ${index + 1}`}
                      className="h-full w-full object-cover"
                      aspectRatio="auto"
                      quality="medium"
                      enableZoom={false}
                      priority={index === 0}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground md:aspect-video">
            <div className="text-center">
              <Package className="mx-auto mb-2 h-12 w-12 opacity-40" />
              <p className="text-sm">Aucune image</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {listing.featured && (
            <Badge className="border-0 bg-foreground/80 text-[11px] font-medium text-background">
              <Crown className="mr-1 h-3 w-3" />
              Vedette
            </Badge>
          )}
          <Badge variant="outline" className="text-[11px] font-medium">
            {conditionText}
          </Badge>
          <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
            {categoryName}
          </Badge>
        </div>

        <h1 className="text-xl font-heading font-semibold leading-tight tracking-tight text-foreground md:text-2xl">
          {listing.title}
        </h1>

        <p className="text-3xl font-heading font-bold tracking-tight text-foreground md:text-[2rem]">
          {formatPrice(listing.price, listing.currency || "XOF")}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {listing.location || "Localisation non précisée"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatRelativeTime(listing.created_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {listing.views_count || 0} vues
          </span>
        </div>

        <div className="border-t border-border pt-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {listing.description || "Aucune description fournie."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListingHeroSection;
