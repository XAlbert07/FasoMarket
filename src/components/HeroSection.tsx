// components/HeroSection.tsx - VERSION SIMPLE CORRIGÉE
// Garde ton design original, corrige juste le problème des recherches populaires

import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, MapPin, TrendingUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/contexts/AuthContext"
import { usePopularSearches } from "@/hooks/usePopularSearches"
import heroImage from "@/assets/hero-marketplace.jpg"

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  // Hook pour les recherches populaires - CORRECTION: suppression de la chaîne vide
  const {
    popularSearches,
    loading: searchesLoading,
    error: searchesError,
    trackSearch,
    totalSearches
  } = usePopularSearches({
    maxItems: 6,
    timeRange: 'all',
    minSearches: 2, // Réduit à 2 pour plus de flexibilité
    excludeQueries: ['test', 'aaa', 'zzz'] // CORRECTION: plus de chaîne vide
  });

  /**
   * Gestion de la soumission de recherche avec tracking automatique
   */
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = searchQuery.trim();
    const trimmedLocation = location.trim();
    
    if (!trimmedQuery) return;

    // Construction des paramètres de recherche
    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (trimmedLocation) params.set("location", trimmedLocation);

    // Tracking de la recherche
    try {
      await trackSearch({
        search_query: trimmedQuery,
        location_query: trimmedLocation || undefined,
        user_id: user?.id,
        source_page: 'hero',
        category_filter: undefined
      });
    } catch (error) {
      console.error('Erreur lors du tracking de la recherche:', error);
    }

    // Navigation vers la page de résultats
    navigate(`/listings?${params.toString()}`);
  }, [searchQuery, location, navigate, trackSearch, user?.id]);

  /**
   * Gestion du clic sur une recherche populaire
   */
  const handlePopularSearchClick = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    try {
      await trackSearch({
        search_query: query,
        location_query: location.trim() || undefined,
        user_id: user?.id,
        source_page: 'hero',
        category_filter: 'popular_click'
      });
    } catch (error) {
      console.error('Erreur lors du tracking du clic populaire:', error);
    }

    const params = new URLSearchParams();
    params.set("q", query);
    if (location.trim()) params.set("location", location.trim());
    
    navigate(`/listings?${params.toString()}`);
  }, [location, navigate, trackSearch, user?.id]);

  /**
   * Rendu simple et propre des recherches populaires
   */
  const renderPopularSearches = () => {
    // En cas d'erreur, afficher un fallback simple
    if (searchesError) {
      return (
        <div className="mt-6">
          <p className="text-white/70 text-sm mb-3">Recherches populaires :</p>
          <div className="flex flex-wrap gap-2">
            {["Téléphones", "Voitures", "Maisons", "Motos"].map((tag) => (
              <button
                key={tag}
                onClick={() => handlePopularSearchClick(tag)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Pendant le chargement
    if (searchesLoading) {
      return (
        <div className="mt-6">
          <p className="text-white/70 text-sm mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Chargement...
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-7 w-20 bg-white/20 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      );
    }

    // Affichage des vraies recherches populaires - SIMPLE ET PROPRE
    if (popularSearches.length > 0) {
      return (
        <div className="mt-6">
          <p className="text-white/70 text-sm mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Recherches populaires :
          </p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search) => (
              <button
                key={search.normalized_query}
                onClick={() => handlePopularSearchClick(search.display_query)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
              >
                {search.display_query}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Fallback si aucune recherche populaire
    return (
      <div className="mt-6">
        <p className="text-white/70 text-sm mb-3">Recherches populaires :</p>
        <div className="flex flex-wrap gap-2">
          {["Téléphones", "Voitures", "Maisons", "Motos"].map((tag) => (
            <button
              key={tag}
              onClick={() => handlePopularSearchClick(tag)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden bg-gradient-surface">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage}
          alt="Marché de Ouagadougou"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
            Acheter et vendre
            <span className="block text-gradient-primary bg-gradient-hero bg-clip-text text-transparent">
              localement
            </span>
            au Burkina Faso
          </h1>
                   
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Trouvez tout ce dont vous avez besoin près de chez vous. 
            Contactez directement. Négociez en toute confiance.
          </p>
            
          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Que recherchez-vous ?"
                  className="pl-10 h-12 text-base border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
                             
              <div className="md:w-64 relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ville ou région"
                  className="pl-10 h-12 text-base border-border"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  autoComplete="off"
                />
              </div>
                             
              <Button type="submit" variant="hero" size="lg" className="h-12 px-8">
                <Search className="mr-2 h-5 w-5" />
                Rechercher
              </Button>
            </div>
          </form>

          {/* Section des recherches populaires - SIMPLE ET PROPRE */}
          {renderPopularSearches()}
        </div>
      </div>
    </section>
  )
}

export default HeroSection;