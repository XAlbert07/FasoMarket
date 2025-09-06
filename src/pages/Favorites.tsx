import { Link } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Eye, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const Favorites = () => {
  const { user } = useAuthContext();
  const { favorites, loading, toggleFavorite } = useFavorites();

  // ✅ Suppression du useEffect redondant qui causait le double chargement
  // Le hook useFavorites gère déjà le chargement automatique

  if (!user) {
    return (
      <div className="min-h-screen">
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
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2">Mes Favoris</h1>
          <p className="text-muted-foreground">
            Retrouvez toutes les annonces que vous avez ajoutées à vos favoris
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement de vos favoris...</p>
          </div>
        ) : favorites.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Aucun favori</h2>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore ajouté d'annonces à vos favoris.
              </p>
              <Button asChild>
                <Link to="/listings">Explorer les annonces</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const listing = favorite.listing;
              if (!listing) return null;

              return (
                <Card key={favorite.id} className="group hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                        <span className="text-muted-foreground">Aucune image</span>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={() => toggleFavorite(listing.id)}
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </Button>

                    {listing.featured_until && new Date(listing.featured_until) > new Date() && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
                        En vedette
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        <Link to={`/listing/${listing.id}`}>
                          {listing.title}
                        </Link>
                      </CardTitle>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {listing.price.toLocaleString()} FCFA
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {listing.location}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDistanceToNow(new Date(listing.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Eye className="h-4 w-4 mr-1" />
                        {listing.views} vues
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant={listing.condition === 'new' ? 'default' : 'secondary'}>
                          {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                        </Badge>
                        <Badge variant="outline">
                          {listing.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button asChild className="w-full">
                        <Link to={`/listing/${listing.id}`}>
                          Voir les détails
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;