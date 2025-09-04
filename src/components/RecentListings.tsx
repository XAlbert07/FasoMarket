import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { MapPin, Clock, Eye, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useListings } from "@/hooks/useListings"
import { useFavorites } from "@/hooks/useFavorites"
import { formatPrice, formatRelativeTime, isListingNew, formatViewsCount } from "@/lib/utils"

export const RecentListings = () => {
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchListings({ sortBy: "date" });
  }, []);

  // On récupère les 6 annonces les plus récentes
  const recentListings = listings.slice(0, 6);
  
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Annonces récentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Les dernières opportunités près de chez vous
            </p>
          </div>
          
          <Button variant="outline" className="hidden md:flex" asChild>
            <Link to="/listings">
              Voir toutes les annonces
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Chargement des annonces...</p>
          </div>
        ) : recentListings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune annonce récente disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentListings.map((listing) => (
              <div
                key={listing.id}
                className="group bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Image avec overlays */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={listing.images?.[0] || "/placeholder.svg"}
                    alt={listing.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Badge "Nouveau" - disparaît après 48h */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {isListingNew(listing.created_at) && (
                      <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Nouveau
                      </span>
                    )}
                  </div>
                  
                  {/* Bouton favori */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white text-muted-foreground hover:text-primary backdrop-blur-sm"
                    onClick={() => toggleFavorite(listing.id)}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite(listing.id) ? "fill-destructive text-destructive" : ""}`} />
                  </Button>
                  
                  {/* Statistiques de vues - maintenant avec nombre formaté */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white text-sm">
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
                      <Eye className="h-3 w-3" />
                      <span>{formatViewsCount(listing.views_count || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  
                  {/* Prix formaté en F CFA */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(listing.price, listing.currency)}
                    </div>
                  </div>
                  
                  {/* Localisation et date relative */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(listing.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Bouton d'action */}
                  <Button variant="cta" className="w-full" asChild>
                    <Link to={`/listing/${listing.id}`}>
                      Voir les détails
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Bouton mobile pour voir toutes les annonces */}
        <div className="md:hidden mt-8 text-center">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/listings">
              Voir toutes les annonces
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}