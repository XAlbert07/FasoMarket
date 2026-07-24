import { Link } from "react-router-dom";
import { ArrowRight, Compass, Package, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ListingCard from "@/components/listings/ListingCard";
import { ListingCardSkeletonRow } from "@/components/home/ListingCardSkeleton";
import { Listing } from "@/types/database";

interface CategoryItem {
  id: string;
  name: string;
  count: string;
  listing_count: number;
  href: string;
  color: string;
}

interface ListingsFeedProps {
  listings: Listing[];
  loading: boolean;
  categories: CategoryItem[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

export const ListingsFeed = ({
  listings,
  loading,
  categories: _categories,
  isFavorite,
  onToggleFavorite,
}: ListingsFeedProps) => {
  const hasListings = listings.length > 0;

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-heading font-semibold text-foreground md:text-lg">
            {hasListings ? "Dernières annonces" : "Explorer le marketplace"}
          </h2>
          {hasListings && (
            <Link
              to="/listings"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            <ListingCardSkeletonRow count={5} />
          </div>
        ) : hasListings ? (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={isFavorite(listing.id)}
                  onToggleFavorite={onToggleFavorite}
                  showCategory={true}
                  showFeatured={true}
                />
              ))}
            </div>
            <div className="mt-5 text-center sm:hidden">
              <Button variant="outline" size="sm" asChild>
                <Link to="/listings">
                  Voir toutes les annonces
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-6 py-10 text-center md:py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-heading font-semibold text-foreground">
              Pas encore d&apos;annonces ici
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Soyez parmi les premiers à publier ou explorez les catégories déjà actives.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/publish">
                  <PlusCircle className="h-4 w-4" />
                  Publier une annonce
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/listings">
                  <Compass className="h-4 w-4" />
                  Parcourir
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
