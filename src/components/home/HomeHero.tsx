import { FormEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePopularSearches } from "@/hooks/usePopularSearches";

interface HomeHeroProps {
  query: string;
  location: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  listingCount: number;
  activeCategoryCount: number;
  topCities: string[];
  featuredListings?: unknown[];
}

const FALLBACK_TRENDS = ["Immobilier", "Véhicules", "Téléphones", "Services"];

export const HomeHero = ({
  query,
  location,
  onQueryChange,
  onLocationChange,
  onSubmit,
}: HomeHeroProps) => {
  const navigate = useNavigate();
  const { popularSearches, loading: trendsLoading } = usePopularSearches({
    maxItems: 6,
    timeRange: "month",
    minSearches: 1,
    enableDebugLogs: false,
  });

  const trends = useMemo(() => {
    if (popularSearches.length > 0) {
      return popularSearches.map((s) => s.display_query);
    }
    return FALLBACK_TRENDS;
  }, [popularSearches]);

  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <p className="text-sm text-muted-foreground">
          Marketplace locale · Burkina Faso
        </p>
        <h1 className="mt-1 text-xl font-heading font-semibold tracking-tight text-foreground md:text-2xl">
          Achetez et vendez près de chez vous
        </h1>

        <form
          onSubmit={onSubmit}
          className="mt-5 flex flex-col gap-2 rounded-md border border-border bg-card p-2 shadow-sm sm:flex-row sm:items-stretch sm:gap-0 sm:divide-x sm:divide-border sm:p-1.5"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Que recherchez-vous ?"
              className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="relative sm:w-48 md:w-56">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Ville ou région"
              className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button type="submit" className="h-11 shrink-0 px-6 sm:ml-1.5">
            Rechercher
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">Suggestions :</span>
          {(trendsLoading ? FALLBACK_TRENDS : trends).map((term, i) => (
            <span key={term} className="inline-flex items-center gap-3">
              {i > 0 ? <span className="text-border" aria-hidden>·</span> : null}
              <button
                type="button"
                disabled={trendsLoading}
                className="text-foreground/80 underline-offset-2 transition-colors hover:text-primary hover:underline disabled:opacity-60"
                onClick={() => {
                  const params = new URLSearchParams({ q: term });
                  if (location.trim()) params.set("location", location.trim());
                  navigate(`/listings?${params.toString()}`);
                }}
              >
                {term}
              </button>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
