import { Link } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartImage } from '@/components/ui/SmartImage';
import { useListingViews } from "@/hooks/useListingViews";
import { Heart, MapPin, Eye, User, Clock } from 'lucide-react';
import { formatPrice, formatRelativeTime, isListingNew } from '@/lib/utils';

const Favorites = () => {
  const { user } = useAuthContext();
  const { favorites, loading, toggleFavorite, isFavorite } = useFavorites();
  const { formatViewsDisplay } = useListingViews();

  // Cette fonction extrait le nom du vendeur depuis les données enrichies du profil
  const getSellerName = (listing: any) => {
    return listing.profiles?.full_name || "Vendeur anonyme";
  };

  // Page de connexion requise 
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
              <p className="text-muted-foreground">
                Vous devez être connecté pour voir vos favoris.
              </p>
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* En-tête exactement comme dans Listings avec adaptation pour les favoris */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1 md:mb-2">
            Mes Favoris
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {loading ? "Chargement..." : `${favorites.length} ${favorites.length <= 1 ? 'annonce trouvée' : 'annonces trouvées'}`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune annonce trouvée avec ces critères.</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/listings'}
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            {/* AFFICHAGE MOBILE optimisé avec SmartImage */}
            <div className="block md:hidden space-y-3">
              {favorites.map((favorite) => {
                const listing = favorite.listing;
                if (!listing) return null;

                return (
                  <Link
                    key={favorite.id}
                    to={`/listing/${listing.id}`}
                    className="group block bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                  >
                    <div className="flex">
                      {/* Image à gauche optimisée avec SmartImage */}
                      <div className="relative w-32 flex-shrink-0">
                        <SmartImage
                          src={listing.images?.[0] || "/placeholder.svg"}
                          alt={listing.title}
                          context="thumbnail"
                          className="aspect-square w-full group-hover:scale-105 transition-transform duration-300"
                          objectFit="cover"
                          lazy={true}
                          quality="medium"
                          showLoadingState={true}
                          onError={() => console.log(`Erreur de chargement pour l'annonce favorite ${listing.id}`)}
                        />
                        
                        {/* Badge "Nouveau" */}
                        {isListingNew(listing.created_at) && (
                          <div className="absolute top-1 left-1">
                            <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full text-xs font-medium">
                              Nouveau
                            </span>
                          </div>
                        )}
                        
                        {/* Bouton favori */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-white/80 hover:bg-white text-muted-foreground hover:text-primary backdrop-blur-sm h-7 w-7"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(listing.id);
                          }}
                        >
                          <Heart className={`h-3 w-3 ${isFavorite(listing.id) ? "fill-destructive text-destructive" : ""}`} />
                        </Button>
                      </div>

                      {/* Contenu à droite  */}
                      <div className="flex-1 p-3 flex flex-col justify-between min-h-32">
                        <div className="flex-1">
                          {/* Titre  */}
                          <h3 className="font-semibold text-sm leading-tight text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {listing.title}
                          </h3>
                          
                          {/* Prix  */}
                          <div className="text-lg font-bold text-primary mb-2">
                            {formatPrice(listing.price, listing.currency || 'XOF')}
                          </div>

                          {/* Catégorie  */}
                          <Badge variant="secondary" className="text-xs mb-2">
                            {listing.category || 'Non spécifiée'}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          {/* Vendeur */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate font-medium">
                              {getSellerName(listing)}
                            </span>
                          </div>
                          
                          {/* Localisation et vues */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{listing.location}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Eye className="h-3 w-3" />
                              <span>{formatViewsDisplay(listing.views_count || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* AFFICHAGE DESKTOP optimisé avec SmartImage */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => {
                const listing = favorite.listing;
                if (!listing) return null;

                return (
                  <Link
                    key={favorite.id}
                    to={`/listing/${listing.id}`}
                    className="group block bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="relative">
                      <SmartImage
                        src={listing.images?.[0] || "/placeholder.svg"}
                        alt={listing.title}
                        context="card"
                        className="aspect-[4/3] w-full group-hover:scale-105 transition-transform duration-300"
                        objectFit="cover"
                        lazy={true}
                        quality="high"
                        showLoadingState={true}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onLoad={() => console.log(`Image favorite chargée pour l'annonce ${listing.id}`)}
                      />
                      
                      {/* Overlays desktop */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 bg-white/80 hover:bg-white text-muted-foreground hover:text-primary backdrop-blur-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(listing.id);
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isFavorite(listing.id)
                              ? "fill-destructive text-destructive"
                              : ""
                          }`}
                        />
                      </Button>
                      
                      {/* Badge "Nouveau"  */}
                      {isListingNew(listing.created_at) && (
                        <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                          Nouveau
                        </Badge>
                      )}

                      {/* Stats de vues */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        <Eye className="h-3 w-3" />
                        <span>{formatViewsDisplay(listing.views_count || 0)}</span>
                      </div>
                    </div>

                    {/* Contenu de la carte desktop */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      
                      {/* Prix et catégorie */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(listing.price, listing.currency || 'XOF')}
                        </div>
                        <Badge variant="secondary">{listing.category || 'Non spécifiée'}</Badge>
                      </div>

                      {/* Informations vendeur */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {getSellerName(listing)}
                        </span>
                      </div>
                      
                      {/* Localisation et temps */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(listing.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Bouton d'action mobile */}
        <div className="mt-6 md:hidden">
          <Button variant="cta" className="w-full" asChild>
            <Link to="/publish">
              Publier votre annonce gratuitement
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;