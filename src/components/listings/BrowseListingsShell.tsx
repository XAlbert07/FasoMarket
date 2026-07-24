import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ListingCard from "@/components/listings/ListingCard";
import { ListingCardSkeletonRow } from "@/components/home/ListingCardSkeleton";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { useCategories } from "@/hooks/useCategories";
import { SearchFilters } from "@/types/database";

const LOCATIONS = [
  "Ouagadougou",
  "Bobo-Dioulasso",
  "Koudougou",
  "Banfora",
  "Ouahigouya",
  "Pouytenga",
  "Dédougou",
  "Kaya",
];

function filtersFromSearchParams(
  searchParams: URLSearchParams,
  lockedCategoryName?: string
): SearchFilters {
  const priceMinRaw = searchParams.get("priceMin");
  const priceMaxRaw = searchParams.get("priceMax");
  const condition = searchParams.get("condition");
  const sort = searchParams.get("sort") || "date";

  return {
    query: searchParams.get("q") || "",
    category: lockedCategoryName || searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    condition:
      condition === "new" || condition === "used" || condition === "refurbished"
        ? condition
        : undefined,
    priceMin: priceMinRaw ? parseInt(priceMinRaw, 10) : undefined,
    priceMax: priceMaxRaw ? parseInt(priceMaxRaw, 10) : undefined,
    sortBy:
      sort === "price_asc" || sort === "price_desc" || sort === "views" || sort === "date"
        ? sort
        : "date",
  };
}

function filtersToSearchParams(
  filters: SearchFilters,
  options?: { omitCategory?: boolean }
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category && !options?.omitCategory) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.sortBy && filters.sortBy !== "date") params.set("sort", filters.sortBy);
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  return params;
}

export interface BrowseListingsShellProps {
  /** When set (category page), lock category filter to this display name */
  lockedCategoryName?: string;
  /** Page title override */
  title?: string;
  /** Hide category select (category route) */
  lockCategory?: boolean;
}

export const BrowseListingsShell = ({
  lockedCategoryName,
  title,
  lockCategory = false,
}: BrowseListingsShellProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories();
  const { listings, loading, loadingMore, hasMore, fetchListings, loadMoreListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [showFilters, setShowFilters] = useState(false);

  const urlFilters = useMemo(
    () => filtersFromSearchParams(searchParams, lockedCategoryName),
    [searchParams, lockedCategoryName]
  );

  const [draft, setDraft] = useState<SearchFilters>(urlFilters);

  // Keep draft in sync when URL / locked category changes (back/forward, category route)
  useEffect(() => {
    setDraft(urlFilters);
  }, [urlFilters]);

  // Fetch whenever URL filters change
  const urlKey = searchParams.toString() + "|" + (lockedCategoryName || "");

  useEffect(() => {
    fetchListings({
      query: urlFilters.query || undefined,
      category: urlFilters.category || undefined,
      location: urlFilters.location || undefined,
      condition: urlFilters.condition,
      priceMin: urlFilters.priceMin,
      priceMax: urlFilters.priceMax,
      sortBy: urlFilters.sortBy || "date",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refetch on URL key only
  }, [urlKey]);

  const updateDraft = useCallback((key: keyof SearchFilters, value: unknown) => {
    const processed =
      value === "all" || value === "none" || value === "" ? (key === "sortBy" ? "date" : undefined) : value;
    setDraft((prev) => ({ ...prev, [key]: processed }));
  }, []);

  const applySearch = useCallback(() => {
    const next = {
      ...draft,
      category: lockCategory ? lockedCategoryName || draft.category : draft.category,
    };
    setSearchParams(filtersToSearchParams(next, { omitCategory: lockCategory }));
  }, [draft, lockCategory, lockedCategoryName, setSearchParams]);

  const resetFilters = useCallback(() => {
    const empty: SearchFilters = {
      query: "",
      category: lockCategory ? lockedCategoryName || "" : "",
      location: "",
      priceMin: undefined,
      priceMax: undefined,
      condition: undefined,
      sortBy: "date",
    };
    setDraft(empty);
    setSearchParams(filtersToSearchParams(empty, { omitCategory: lockCategory }));
  }, [lockCategory, lockedCategoryName, setSearchParams]);

  const pageTitle =
    title ||
    (urlFilters.query
      ? `Résultats pour « ${urlFilters.query} »`
      : urlFilters.category
        ? urlFilters.category
        : "Toutes les annonces");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-4 md:py-6">
        <div className="mb-4">
          <h1 className="text-xl font-heading font-semibold tracking-tight text-foreground md:text-2xl">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading && listings.length === 0
              ? "Chargement…"
              : `${listings.length}${hasMore ? "+" : ""} annonce${listings.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="mb-3 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une annonce…"
              value={draft.query || ""}
              onChange={(e) => updateDraft("query", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              className="h-11 pl-9"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 px-3 md:hidden"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={applySearch} className="hidden h-11 md:inline-flex">
            Rechercher
          </Button>
        </div>

        <div
          className={`mb-5 space-y-3 border border-border bg-surface p-3 md:block md:p-4 ${
            showFilters ? "block" : "hidden"
          }`}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {!lockCategory && (
              <Select
                value={draft.category || "all"}
                onValueChange={(value) => updateDraft("category", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={draft.location || "all"}
              onValueChange={(value) => updateDraft("location", value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={draft.condition || "all"}
              onValueChange={(value) => updateDraft("condition", value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="État" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                <SelectItem value="new">Neuf</SelectItem>
                <SelectItem value="used">Occasion</SelectItem>
                <SelectItem value="refurbished">Reconditionné</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={draft.sortBy || "date"}
              onValueChange={(value) => updateDraft("sortBy", value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Plus récent</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="views">Plus vues</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Prix min"
              value={draft.priceMin ?? ""}
              onChange={(e) =>
                updateDraft("priceMin", e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              className="h-10"
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Prix max"
              value={draft.priceMax ?? ""}
              onChange={(e) =>
                updateDraft("priceMax", e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              className="h-10"
            />
            <Button onClick={applySearch} className="h-10 md:col-span-1">
              Appliquer
            </Button>
            <Button variant="ghost" onClick={resetFilters} className="h-10">
              Réinitialiser
            </Button>
          </div>
        </div>

        {loading && listings.length === 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            <ListingCardSkeletonRow count={10} />
          </div>
        ) : listings.length === 0 ? (
          <div className="border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Aucune annonce avec ces critères.</p>
            <Button variant="outline" onClick={resetFilters} className="mt-4">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={isFavorite(listing.id)}
                  onToggleFavorite={toggleFavorite}
                  showCategory={!lockCategory}
                  showSeller={true}
                  showViews={true}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => loadMoreListings()}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Chargement…" : "Voir plus d'annonces"}
                </Button>
              </div>
            )}
          </>
        )}

        <div className="mt-8 md:hidden">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/publish">Déposer une annonce</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BrowseListingsShell;
