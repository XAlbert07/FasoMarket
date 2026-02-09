import ListingCard from "@/components/listings/ListingCard";
import { Listing } from "@/types/database";

interface SimilarListingsSectionProps {
  listings: Listing[];
  loading: boolean;
}

const SimilarListingsSection = ({ listings, loading }: SimilarListingsSectionProps) => {
  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Annonces similaires</h2>
        <p className="text-sm text-muted-foreground">Chargement des annonces...</p>
      </section>
    );
  }

  if (!listings.length) return null;

  return (
    <section className="mt-10 border-t pt-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Annonces similaires</h2>
        <p className="text-sm text-muted-foreground">Même catégorie ou zone proche</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
