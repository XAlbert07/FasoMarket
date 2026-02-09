import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OptimizedImageDisplay } from "@/components/OptimizedImageDisplay";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, Crown, Info, MapPin, Package, Tag } from "lucide-react";

interface ListingHeroSectionProps {
  listing: any;
  currentImageIndex: number;
  onOpenImageViewer: () => void;
  onImageNavigation: (direction: "prev" | "next") => void;
  onSelectImage: (index: number) => void;
}

const ListingHeroSection = ({
  listing,
  currentImageIndex,
  onOpenImageViewer,
  onImageNavigation,
  onSelectImage,
}: ListingHeroSectionProps) => {
  const listingRef = (listing.id || "").toString().slice(0, 8).toUpperCase() || "N/A";
  const [isImageFading, setIsImageFading] = useState(false);

  useEffect(() => {
    setIsImageFading(true);
    const timeout = setTimeout(() => setIsImageFading(false), 180);
    return () => clearTimeout(timeout);
  }, [currentImageIndex]);

  return (
    <>
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          {listing.images && listing.images.length > 0 ? (
            <div className="relative">
              <div
                className="relative aspect-square max-h-[520px] cursor-pointer overflow-hidden rounded-lg bg-muted md:aspect-[18/10] lg:aspect-[21/10]"
                onClick={onOpenImageViewer}
              >
                <OptimizedImageDisplay
                  key={currentImageIndex}
                  src={listing.images[currentImageIndex]?.url || listing.images[currentImageIndex]}
                  alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                  className={`transition-all duration-300 ${isImageFading ? "scale-[1.01] opacity-80" : "opacity-100 hover:scale-105"}`}
                  aspectRatio="auto"
                  quality="large"
                  enableZoom={true}
                  onZoomClick={onOpenImageViewer}
                  priority={currentImageIndex === 0}
                />

                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageNavigation("prev");
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black/80"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageNavigation("next");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black/80"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 md:hidden">
                      {listing.images.map((_: unknown, index: number) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectImage(index);
                          }}
                          className={`h-2 w-2 rounded-full transition-all ${
                            index === currentImageIndex ? "scale-125 bg-white" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                      {currentImageIndex + 1} / {listing.images.length}
                    </div>
                  </>
                )}

                <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                  Appuyer pour agrandir
                </div>
              </div>

              {listing.images.length > 1 && (
                <div className="hidden items-center gap-2 overflow-x-auto border-t border-border/60 bg-muted/20 p-3 md:flex">
                  {listing.images.map((image: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => onSelectImage(index)}
                      className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md border transition-all ${
                        index === currentImageIndex
                          ? "border-foreground/70 ring-1 ring-foreground/30"
                          : "border-border/70 opacity-80 hover:opacity-100"
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
            <div className="aspect-square rounded-lg bg-muted md:aspect-video">
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <div>
                  <Package className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-sm">Aucune image disponible</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-5 p-4 md:space-y-6 md:p-6">
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-xl font-bold leading-tight md:text-2xl lg:text-3xl">{listing.title}</h1>

            <div className="flex items-start justify-between gap-3">
              <div className="text-[28px] font-bold leading-none tracking-tight text-foreground md:text-[34px]">
                {formatPrice(listing.price, listing.currency)}
              </div>
              {listing.featured && (
                <Badge variant="outline" className="text-xs">
                  <Crown className="mr-1 h-3 w-3" />
                  En vedette
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {listing.location || "Localisation non précisée"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatRelativeTime(listing.created_at)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {listing.condition === "new"
                  ? "Neuf"
                  : listing.condition === "refurbished"
                    ? "Reconditionné"
                    : "Occasion"}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {listing.categories?.name || "Non catégorisé"}
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 md:p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fiche rapide</p>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">État</p>
                <p className="font-medium">
                  {listing.condition === "new"
                    ? "Neuf"
                    : listing.condition === "refurbished"
                      ? "Reconditionné"
                      : "Occasion"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Catégorie</p>
                <p className="font-medium">{listing.categories?.name || "Non définie"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ville</p>
                <p className="font-medium">{listing.location || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Réf.</p>
                <p className="font-mono text-[13px] font-medium">{listingRef}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 md:space-y-4">
            <h3 className="flex items-center gap-2 text-base font-semibold md:text-lg">
              <Info className="h-4 w-4 md:h-5 md:w-5" />
              Description
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground md:text-base">
                {listing.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ListingHeroSection;
