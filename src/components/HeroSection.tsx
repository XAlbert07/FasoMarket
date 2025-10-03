// components/HeroSection.tsx - Version optimisée avec recherches populaires

import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, MapPin, TrendingUp, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/contexts/AuthContext"
import { usePopularSearches } from "@/hooks/usePopularSearches"
import heroImage from "@/assets/hero-marketplace.jpg"

// Recherches de fallback si le système ne retourne rien
const FALLBACK_SEARCHES = ["Téléphones", "Voitures", "Maisons", "Motos", "Laptops", "Vêtements"];

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  // Hook pour les recherches populaires avec configuration optimisée
  const {
    popularSearches,
    loading: searchesLoading,
    error: searchesError,
    trackSearch,
    totalSearches
  } = usePopularSearches({
    maxItems: 6,
    timeRange: 'month',
    minSearches: 2,
    excludeQueries: ['test', 'aaa', 'zzz'],
    enableDebugLogs: false
  });

  // Calcul des recherches à afficher (populaires ou fallback)
  const displaySearches = useMemo(() => {
    if (popularSearches.length > 0) {
      return popularSearches.map(s => s.display_query);
    }
    return FALLBACK_SEARCHES;
  }, [popularSearches]);

  /**
   * Gestion de la soumission de recherche avec tracking
   */
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = searchQuery.trim();
    const trimmedLocation = location.trim();
    
    if (!trimmedQuery) return;

    // Tracking asynchrone (non-bloquant)
    trackSearch({
      search_query: trimmedQuery,
      location_query: trimmedLocation || undefined,
      user_id: user?.id,
      source_page: 'hero',
      category_filter: undefined
    }).catch(err => {
      // Le tracking ne doit pas bloquer la navigation
      console.warn('Erreur tracking (ignorée):', err);
    });

    // Navigation immédiate vers les résultats
    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (trimmedLocation) params.set("location", trimmedLocation);

    navigate(`/listings?${params.toString()}`);
  }, [searchQuery, location, navigate, trackSearch, user?.id]);

  /**
   * Gestion du clic sur une recherche populaire
   */
  const handlePopularSearchClick = useCallback(async (query: string) => {
    // Tracking asynchrone
    trackSearch({
      search_query: query,
      location_query: location.trim() || undefined,
      user_id: user?.id,
      source_page: 'hero',
      category_filter: 'popular_click'
    }).catch(err => {
      console.warn('Erreur tracking (ignorée):', err);
    });

    // Navigation immédiate
    const params = new URLSearchParams();
    params.set("q", query);
    if (location.trim()) params.set("location", location.trim());
    
    navigate(`/listings?${params.toString()}`);
  }, [location, navigate, trackSearch, user?.id]);

  /**
   * Rendu des recherches populaires avec gestion d'état
   */
  const renderPopularSearches = () => {
    // Pendant le chargement initial
    if (searchesLoading) {
      return (
        <div className="mt-6">
          <p className="text-white/70 text-sm mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-1.5 animate-spin" />
            Chargement des recherches populaires...
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-24 bg-white/20 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      );
    }

    // En cas d'erreur, utiliser le fallback silencieusement
    const searches = searchesError ? FALLBACK_SEARCHES : displaySearches;
    const isRealData = !searchesError && popularSearches.length > 0;

    return (
      <div className="mt-6">
        <p className="text-white/70 text-sm mb-3 flex items-center">
          {isRealData ? (
            <>
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Recherches populaires
              {totalSearches > 0 && (
                <span className="ml-2 text-white/50 text-xs">
                  ({totalSearches} recherches)
                </span>
              )}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Suggestions de recherche
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {searches.map((query, index) => (
            <button
              key={`${query}-${index}`}
              onClick={() => handlePopularSearchClick(query)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {query}
            </button>
          ))}
        </div>
        
        {/* Indicateur discret pour les admins en mode dev */}
        {process.env.NODE_ENV === 'development' && isRealData && (
          <p className="mt-2 text-white/40 text-xs">
            ✓ Données en temps réel
          </p>
        )}
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

          {/* Section des recherches populaires */}
          {renderPopularSearches()}
        </div>
      </div>
    </section>
  )
}

export default HeroSection;