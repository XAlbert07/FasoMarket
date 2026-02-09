import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublishButton from "@/components/PublishButton";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import ListingCard from "@/components/listings/ListingCard";

export const RecentListings = () => {
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchListings({ sortBy: "date" });
  }, []);

  const recentListings = listings.slice(0, 6);

  return (
    <section className="py-8 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-6 md:mb-12">
          <div className="text-center md:text-left md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2 md:mb-4">Annonces récentes</h2>
              <p className="text-base md:text-lg text-muted-foreground">Les dernières opportunités près de chez vous</p>
            </div>

            <Button variant="outline" className="hidden lg:flex" asChild>
              <Link to="/listings">Voir toutes les annonces</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        ) : recentListings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune annonce récente disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={isFavorite(listing.id)}
                onToggleFavorite={toggleFavorite}
                showCta={true}
                showCategory={true}
                showSeller={true}
                showViews={true}
              />
            ))}
          </div>
        )}

        <div className="mt-6 md:mt-8 text-center space-y-3">
          <Button variant="outline" className="w-full md:hidden" asChild>
            <Link to="/listings">Voir toutes les annonces</Link>
          </Button>

          <PublishButton variant="cta" className="w-full md:hidden" showIcon={false}>
            Publier votre annonce gratuitement
          </PublishButton>
        </div>
      </div>
    </section>
  );
};
