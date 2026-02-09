import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";

const Favorites = () => {
  const { user } = useAuthContext();
  const { favorites, loading, toggleFavorite, isFavorite } = useFavorites();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
              <p className="text-muted-foreground">Vous devez être connecté pour voir vos favoris.</p>
              <Button asChild className="mt-4">
                <Link to="/login">Se connecter</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const favoriteListings = favorites
    .map((favorite) => favorite.listing)
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1 md:mb-2">Mes Favoris</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {loading ? "Chargement..." : `${favoriteListings.length} ${favoriteListings.length <= 1 ? "annonce trouvée" : "annonces trouvées"}`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        ) : favoriteListings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Vous n'avez pas encore d'annonces favorites.</p>
            <Button variant="outline" asChild className="mt-4">
              <Link to="/listings">Parcourir les annonces</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {favoriteListings.map((listing) => (
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

        <div className="mt-6 md:hidden">
          <Button variant="cta" className="w-full" asChild>
            <Link to="/publish">Publier votre annonce gratuitement</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
