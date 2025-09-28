import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Eye, Heart, Phone, Search, Filter, User, Clock } from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { SearchFilters } from "@/types/database";
import { Link } from "react-router-dom";
import { formatPrice, formatRelativeTime, isListingNew, formatViewsCount } from "@/lib/utils";

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [revealedPhones, setRevealedPhones] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false); 
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    location: "",
    priceMin: undefined,
    priceMax: undefined,
    condition: undefined,
    sortBy: "date"
  });

  const categories = [
    "Véhicules",
    "Immobilier", 
    "Électronique",
    "Mode & Beauté",
    "Maison & Jardin",
    "Services",
    "Emploi",
    "Loisirs & Sports"
  ];

  const locations = [
    "Ouagadougou",
    "Bobo-Dioulasso",
    "Koudougou", 
    "Banfora",
    "Ouahigouya",
    "Pouytenga",
    "Dédougou",
    "Kaya"
  ];

  useEffect(() => {
    fetchListings(filters);
  }, []);

  const handleSearch = () => {
    fetchListings(filters);
    
    // Mettre à jour l'URL
    const newParams = new URLSearchParams();
    if (filters.query) newParams.set("q", filters.query);
    if (filters.category) newParams.set("category", filters.category);
    setSearchParams(newParams);
  };

  // Fonction pour gérer les valeurs spéciales
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    // Convertir les valeurs spéciales en chaînes vides pour le filtrage
    const processedValue = (value === "all" || value === "none") ? "" : value;
    setFilters(prev => ({ ...prev, [key]: processedValue }));
  };

  const revealPhone = (id: string) => {
    setRevealedPhones(prev => [...prev, id]);
  };

  // Fonction utilitaire pour obtenir le nom du vendeur
  const getSellerName = (listing: any) => {
    return listing.profiles?.full_name || "Vendeur anonyme";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* En-tête mobile-first optimisé */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1 md:mb-2">
            {filters.query ? `Résultats pour "${filters.query}"` : "Toutes les annonces"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {loading ? "Chargement..." : `${listings.length} annonces trouvées`}
          </p>
        </div>

        {/* Barre de recherche principale mobile-first */}
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher une annonce..."
                value={filters.query}
                onChange={(e) => updateFilter("query", e.target.value)}
                className="pr-10 h-11"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button 
              variant="outline"
              className="md:hidden h-11 px-3"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSearch} 
              className="hidden md:flex h-11"
            >
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </div>

        {/* Filtres avancés - Mobile collapsible, Desktop toujours visible */}
        <Card className={`mb-4 md:mb-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <CardContent className="p-3 md:p-4">
            {/* Filtres principaux */}
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-3 md:mb-4">
              <Select 
                value={filters.category || "all"} 
                onValueChange={(value) => updateFilter("category", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.location || "all"} 
                onValueChange={(value) => updateFilter("location", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Localisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.sortBy || "date"} 
                onValueChange={(value) => updateFilter("sortBy", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Plus récent</SelectItem>
                  <SelectItem value="price_asc">Prix croissant</SelectItem>
                  <SelectItem value="price_desc">Prix décroissant</SelectItem>
                  <SelectItem value="views">Plus vues</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="h-10 md:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </div>

            {/* Filtres de prix */}
            <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
              <Input
                type="number"
                placeholder="Prix min"
                value={filters.priceMin || ""}
                onChange={(e) => updateFilter("priceMin", e.target.value ? parseInt(e.target.value) : undefined)}
                className="h-10"
              />
              <Input
                type="number"
                placeholder="Prix max"
                value={filters.priceMax || ""}
                onChange={(e) => updateFilter("priceMax", e.target.value ? parseInt(e.target.value) : undefined)}
                className="h-10"
              />
              <Button onClick={handleSearch} className="hidden md:flex h-10">
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune annonce trouvée avec ces critères.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  query: "",
                  category: "",
                  location: "",
                  priceMin: undefined,
                  priceMax: undefined,
                  condition: undefined,
                  sortBy: "date"
                });
                fetchListings({});
              }}
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            {/* AFFICHAGE MOBILE : Liste horizontale avec image à gauche */}
            <div className="block md:hidden space-y-3">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="group block bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex">
                    {/* Image à gauche - 35% de la largeur */}
                    <div className="relative w-32 flex-shrink-0">
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={listing.images?.[0] || "/placeholder.svg"}
                          alt={listing.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                    </div>

                    {/* Contenu à droite - 65% de la largeur */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-h-32">
                      <div className="flex-1">
                        {/* Titre - 2 lignes max */}
                        <h3 className="font-semibold text-sm leading-tight text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                        
                        {/* Prix - plus visible */}
                        <div className="text-lg font-bold text-primary mb-2">
                          {formatPrice(listing.price, listing.currency || 'XOF')}
                        </div>

                        {/* Catégorie */}
                        <Badge variant="secondary" className="text-xs mb-2">
                          {listing.category}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        {/* Vendeur avec nom plus visible - CORRECTION APPLIQUÉE */}
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
                            <span>{formatViewsCount(listing.views_count || 0)}</span>
                          </div>
                        </div>
                        
                        {/* Actions mobiles supprimées - annonce entièrement cliquable */}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* AFFICHAGE DESKTOP : Grid classique avec annonces cliquables */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="group block bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="relative">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={listing.images?.[0] || "/placeholder.svg"}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Overlays desktop */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 bg-white/80 hover:bg-white text-muted-foreground hover:text-primary backdrop-blur-sm"
                      onClick={() => toggleFavorite(listing.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFavorite(listing.id)
                            ? "fill-destructive text-destructive"
                            : ""
                        }`}
                      />
                    </Button>
                    
                    {isListingNew(listing.created_at) && (
                      <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                        Nouveau
                      </Badge>
                    )}

                    {/* Stats de vues */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      <Eye className="h-3 w-3" />
                      <span>{formatViewsCount(listing.views_count || 0)}</span>
                    </div>
                  </div>

                  {/* Contenu de la carte desktop - simplifié sans boutons */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    
                    {/* Prix et catégorie */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(listing.price, listing.currency || 'XOF')}
                      </div>
                      <Badge variant="secondary">{listing.category}</Badge>
                    </div>

                    {/* Informations vendeur - CORRECTION APPLIQUÉE */}
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
              ))}
            </div>
          </>
        )}

        {/* Bouton d'action mobile pour encourager la publication */}
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

export default Listings;