import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Search, Filter } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";

const CategoryListings = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "date");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showFilters, setShowFilters] = useState(false);

  const categoryNames: Record<string, string> = {
    vehicules: "Véhicules",
    immobilier: "Immobilier",
    telephones: "Téléphones",
    mode: "Mode",
    maison: "Maison",
    emploi: "Emploi",
    loisirs: "Loisirs",
    autres: "Autres",
  };

  const categoryName = category ? categoryNames[category] || category : "Toutes les annonces";

  useEffect(() => {
    const filters = {
      category: categoryName !== "Toutes les annonces" ? categoryName : undefined,
      query: searchQuery || undefined,
      location: location || undefined,
      condition: condition !== "all" ? (condition as "new" | "used" | "refurbished") : undefined,
      sortBy: sortBy as "date" | "price_asc" | "price_desc" | "views",
      priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
      priceMax: priceRange[1] < 1000000 ? priceRange[1] : undefined,
    };

    fetchListings(filters);

    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("location", location);
    if (condition !== "all") params.set("condition", condition);
    if (sortBy !== "date") params.set("sort", sortBy);

    setSearchParams(params);
  }, [category, searchQuery, location, condition, sortBy, priceRange]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2">{categoryName}</h1>
          <p className="text-muted-foreground">{loading ? "Chargement..." : `${listings.length} annonces trouvées`}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans cette categorie..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>

              {showFilters && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Localisation</label>
                      <Input placeholder="Ville..." value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Etat</label>
                      <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les etats" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les etats</SelectItem>
                          <SelectItem value="new">Neuf</SelectItem>
                          <SelectItem value="used">Occasion</SelectItem>
                          <SelectItem value="refurbished">Reconditionne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Trier par</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Plus recent</SelectItem>
                          <SelectItem value="price_asc">Prix croissant</SelectItem>
                          <SelectItem value="price_desc">Prix decroissant</SelectItem>
                          <SelectItem value="views">Plus vus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-4 block">
                      Prix: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} FCFA
                    </label>
                    <Slider value={priceRange} onValueChange={setPriceRange} max={1000000} step={10000} className="w-full" />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Aucune annonce trouvée</h2>
              <p className="text-muted-foreground">Essayez de modifier vos critères de recherche ou de filtrage.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {listings.map((listing) => (
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

        <div className="mt-8 md:hidden">
          <Button variant="cta" className="w-full" asChild>
            <Link to="/publish">Publier votre annonce gratuitement</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryListings;
