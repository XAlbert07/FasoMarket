import ListingCard from "@/components/listings/ListingCard";
import { ListingCardSkeletonRow } from "@/components/home/ListingCardSkeleton";
import { Listing } from "@/types/database";

interface SimilarListingsSectionProps {
  listings: Listing[];
  loading: boolean;
}

const SimilarListingsSection = ({ listings, loading }: SimilarListingsSectionProps) => {
  if (loading) {
    return (
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="mb-4 text-base font-heading font-semibold md:text-lg">Annonces similaires</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          <ListingCardSkeletonRow count={4} />
        </div>
      </section>
    );
  }

  if (!listings.length) return null;

  return (
    <section className="mt-8 border-t border-border pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-heading font-semibold md:text-lg">Annonces similaires</h2>
        <p className="text-sm text-muted-foreground">Même catégorie</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {listings.map((item) => (
          <ListingCard
            key={item.id}
            listing={item}
            showFavorite={false}
            showCategory={true}
            showSeller={true}
            showViews={true}
          />
        ))}
      </div>
    </section>
  );
};

export default SimilarListingsSection;
