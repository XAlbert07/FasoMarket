// components/RecentListings.tsx 

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { MapPin, Clock, Eye, Heart, User } from "lucide-react"
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
    <section className="py-8 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* En-tête de section - Optimisé mobile */}
        <div className="mb-6 md:mb-12">
          <div className="text-center md:text-left md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2 md:mb-4">
                Annonces récentes
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Les dernières opportunités près de chez vous
              </p>
            </div>
            
            {/* Bouton desktop uniquement */}
            <Button variant="outline" className="hidden lg:flex" asChild>
              <Link to="/listings">
                Voir toutes les annonces
              </Link>
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
          <>
            {/* AFFICHAGE MOBILE : Liste horizontale avec image à gauche */}
            <div className="block md:hidden space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="group block bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex">
                    {/* Image à gauche - 40% de la largeur */}
                    <div className="relative w-28 flex-shrink-0">
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={listing.images?.[0] || "/placeholder.svg"}
                          alt={listing.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Badge "Nouveau" - plus petit sur mobile */}
                        {isListingNew(listing.created_at) && (
                          <div className="absolute top-1 left-1">
                            <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full text-xs font-medium">
                              Nouveau
                            </span>
                          </div>
                        )}
                        
                        {/* Bouton favori - plus petit sur mobile */}
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
                    </div>

                    {/* Contenu à droite - 60% de la largeur */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-h-28">
                      <div className="flex-1">
                        {/* Titre - 2 lignes max sur mobile */}
                        <h3 className="font-semibold text-sm leading-tight text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                        
                        {/* Prix - plus proéminent */}
                        <div className="text-lg font-bold text-primary mb-2">
                          {formatPrice(listing.price, listing.currency)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        {/* Vendeur avec icône - gestion correcte de la propriété profiles */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {/*  Utilisation correcte de la propriété profiles */}
                            {listing.profiles?.full_name || "Vendeur anonyme"}
                          </span>
                          {/* Espace réservé pour le badge premium */}
                          <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-full font-medium hidden">
                            ★
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
                            <span>{formatViewsCount(listing.views_count || 0)}</span>
                          </div>
                        </div>
                        
                        {/* Temps - discret */}
                        <div className="text-xs text-muted-foreground/80">
                          {formatRelativeTime(listing.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* AFFICHAGE DESKTOP : Grid classique maintenu */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    
                    {/* Badge "Nouveau" */}
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
                    
                    {/* Statistiques de vues */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white text-sm">
                      <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
                        <Eye className="h-3 w-3" />
                        <span>{formatViewsCount(listing.views_count || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contenu de la carte desktop */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    
                    {/* Prix */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(listing.price, listing.currency)}
                      </div>
                    </div>
                    
                    {/*  Informations vendeur pour desktop */}
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {/* Utilisation correcte de la propriété profiles */}
                        {listing.profiles?.full_name || "Vendeur anonyme"}
                      </span>
                      {/* Badge premium potentiel */}
                      {listing.profiles?.full_name && (
                        <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full font-medium hidden">
                          Vérifié
                        </span>
                      )}
                    </div>
                    
                    {/* Localisation et date */}
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
          </>
        )}
        
        {/* Boutons mobile pour voir toutes les annonces - amélioration UX */}
        <div className="mt-6 md:mt-8 text-center space-y-3">
          <Button variant="outline" className="w-full md:hidden" asChild>
            <Link to="/listings">
              Voir toutes les annonces
            </Link>
          </Button>
          
          {/* Bouton pour publier - ajout pour conversion mobile */}
          <Button variant="cta" className="w-full md:hidden" asChild>
            <Link to="/publish">
              Publier votre annonce gratuitement
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}