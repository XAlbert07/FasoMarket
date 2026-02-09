import ListingCard from "@/components/listings/ListingCard";
import { useFavorites } from "@/hooks/useFavorites";

interface SponsoredListingsSectionProps {
  listings: any[];
}

const SponsoredListingsSection = ({ listings }: SponsoredListingsSectionProps) => {
  const { toggleFavorite, isFavorite } = useFavorites();

  if (!Array.isArray(listings) || listings.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">Mise en avant</p>
          <h2 className="mt-2 text-3xl font-heading font-bold text-foreground">Annonces sponsorisées</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {listings.map((listing) => (
          <div key={listing.id} className="space-y-2">
            <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Sponsorisé
            </span>
            <ListingCard
              listing={listing}
              isFavorite={isFavorite(listing.id)}
              onToggleFavorite={toggleFavorite}
              showCta={true}
              showCategory={true}
              showSeller={true}
              showViews={true}
              showFavorite={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default SponsoredListingsSection;
