import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Eye, Heart, Phone, Search, Filter } from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { SearchFilters } from "@/types/database";

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [revealedPhones, setRevealedPhones] = useState<string[]>([]);
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

  // ✅ SOLUTION : Fonction modifiée pour gérer les valeurs spéciales
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    // Convertir les valeurs spéciales en chaînes vides pour le filtrage
    const processedValue = (value === "all" || value === "none") ? "" : value;
    setFilters(prev => ({ ...prev, [key]: processedValue }));
  };

  const revealPhone = (id: string) => {
    setRevealedPhones(prev => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            {filters.query ? `Résultats pour "${filters.query}"` : "Toutes les annonces"}
          </h1>
          <p className="text-muted-foreground">
            {loading ? "Chargement..." : `${listings.length} annonces trouvées`}
          </p>
        </div>

        {/* Filtres de recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Input
                  placeholder="Rechercher..."
                  value={filters.query}
                  onChange={(e) => updateFilter("query", e.target.value)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* ✅ SOLUTION : Utiliser une valeur non-vide pour "toutes les catégories" */}
              <Select 
                value={filters.category || "all"} 
                onValueChange={(value) => updateFilter("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* ✅ SOLUTION : Même correction pour les localisations */}
              <Select 
                value={filters.location || "all"} 
                onValueChange={(value) => updateFilter("location", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Localisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <Input
                type="number"
                placeholder="Prix minimum"
                value={filters.priceMin || ""}
                onChange={(e) => updateFilter("priceMin", e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Prix maximum"
                value={filters.priceMax || ""}
                onChange={(e) => updateFilter("priceMax", e.target.value ? parseInt(e.target.value) : undefined)}
              />
              {/* ✅ SOLUTION : Assurer que sortBy a toujours une valeur valide */}
              <Select 
                value={filters.sortBy || "date"} 
                onValueChange={(value) => updateFilter("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Plus récent</SelectItem>
                  <SelectItem value="price_asc">Prix croissant</SelectItem>
                  <SelectItem value="price_desc">Prix décroissant</SelectItem>
                  <SelectItem value="views">Plus vues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <p>Chargement des annonces...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <img
                    src={listing.images?.[0] || "/placeholder.svg"}
                    alt={listing.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => toggleFavorite(listing.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isFavorite(listing.id)
                          ? "fill-destructive text-destructive"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                  {new Date(listing.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                    <Badge className="absolute top-2 left-2 bg-primary">
                      Nouveau
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {listing.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        {listing.price.toLocaleString()} XOF
                      </span>
                      <Badge variant="secondary">{listing.category}</Badge>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {listing.location}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Eye className="h-4 w-4 mr-1" />
                      {listing.views} vues
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button className="w-full" asChild>
                        <a href={`/listing/${listing.id}`}>
                          Voir les détails
                        </a>
                      </Button>
                      
                      {revealedPhones.includes(listing.id) ? (
                        <div className="flex items-center justify-center space-x-2 p-2 bg-muted rounded">
                          <Phone className="h-4 w-4" />
                          <span className="font-mono">{listing.contact_phone}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(listing.contact_phone)}
                          >
                            Copier
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => revealPhone(listing.id)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Afficher le numéro
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Listings;