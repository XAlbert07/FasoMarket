import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";
import { useFavorites } from "@/hooks/useFavorites";

interface SponsoredListingsSectionProps {
  listings: any[];
}

const SponsoredListingsSection = ({ listings }: SponsoredListingsSectionProps) => {
  const { toggleFavorite, isFavorite } = useFavorites();

  if (!Array.isArray(listings) || listings.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-4 py-6 md:py-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-heading font-semibold text-foreground md:text-lg">
            Annonces en vedette
          </h2>
          <Link
            to="/listings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorite={isFavorite(listing.id)}
              onToggleFavorite={toggleFavorite}
              showCategory={true}
              showFeatured={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsoredListingsSection;
