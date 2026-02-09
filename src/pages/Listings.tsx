import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { SearchFilters } from "@/types/database";
import ListingCard from "@/components/listings/ListingCard";

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    location: "",
    priceMin: undefined,
    priceMax: undefined,
    condition: undefined,
    sortBy: "date",
  });

  const categories = ["Véhicules", "Immobilier", "Électronique", "Mode & Beauté", "Maison & Jardin", "Services", "Emploi", "Loisirs & Sports"];

  const locations = ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Pouytenga", "Dédougou", "Kaya"];

  useEffect(() => {
    fetchListings(filters);
  }, []);

  const handleSearch = () => {
    fetchListings(filters);

    const newParams = new URLSearchParams();
    if (filters.query) newParams.set("q", filters.query);
    if (filters.category) newParams.set("category", filters.category);
    setSearchParams(newParams);
  };

  const updateFilter = (key: keyof SearchFilters, value: unknown) => {
    const processedValue = value === "all" || value === "none" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: processedValue }));
  };

  const groupedListings = useMemo(() => {
    const groups = new Map<string, typeof listings>();

    listings.forEach((listing) => {
      const categoryName = listing.category || listing.categories?.name || "Autres";
      const existing = groups.get(categoryName) || [];
      existing.push(listing);
      groups.set(categoryName, existing);
    });

    return Array.from(groups.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [listings]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1 md:mb-2">
            {filters.query ? `Résultats pour "${filters.query}"` : "Toutes les annonces"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">{loading ? "Chargement..." : `${listings.length} annonces trouvées`}</p>
        </div>

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
            <Button variant="outline" className="md:hidden h-11 px-3" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={handleSearch} className="hidden md:flex h-11">
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </div>

        <Card className={`mb-4 md:mb-6 ${showFilters ? "block" : "hidden md:block"}`}>
          <CardContent className="p-3 md:p-4">
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-3 md:mb-4">
              <Select value={filters.category || "all"} onValueChange={(value) => updateFilter("category", value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.location || "all"} onValueChange={(value) => updateFilter("location", value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Localisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.sortBy || "date"} onValueChange={(value) => updateFilter("sortBy", value)}>
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

            <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
              <Input
                type="number"
                placeholder="Prix min"
                value={filters.priceMin || ""}
                onChange={(e) => updateFilter("priceMin", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="h-10"
              />
              <Input
                type="number"
                placeholder="Prix max"
                value={filters.priceMax || ""}
                onChange={(e) => updateFilter("priceMax", e.target.value ? parseInt(e.target.value, 10) : undefined)}
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
                setFilters({ query: "", category: "", location: "", priceMin: undefined, priceMax: undefined, condition: undefined, sortBy: "date" });
                fetchListings({});
              }}
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="space-y-7 md:space-y-9">
            {groupedListings.map((group) => (
              <section key={group.category}>
                <div className="mb-3 flex items-center justify-between border-b border-border/80 pb-2">
                  <h2 className="text-base font-semibold text-foreground md:text-lg">{group.category}</h2>
                  <span className="text-sm text-foreground/70">
                    {group.items.length} annonce{group.items.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {group.items.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isFavorite={isFavorite(listing.id)}
                      onToggleFavorite={toggleFavorite}
                      showCta={true}
                      showCategory={false}
                      showSeller={true}
                      showViews={true}
                    />
                  ))}
                </div>
              </section>
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

export default Listings;
