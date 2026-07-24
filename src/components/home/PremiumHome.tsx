import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { HomeHero } from "@/components/home/HomeHero";
import { CategoryBento } from "@/components/home/CategoryBento";
import { ListingsFeed } from "@/components/home/ListingsFeed";
import SponsoredListingsSection from "@/components/home/SponsoredListingsSection";
import { PublishStrip } from "@/components/home/PublishStrip";
import FadeIn from "@/components/ui/fade-in";

export const PremiumHome = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const { categories } = useCategories();
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchListings({ sortBy: "date" });
  }, [fetchListings]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => b.listing_count - a.listing_count),
    [categories]
  );

  const recentListings = useMemo(() => listings.slice(0, 10), [listings]);
  const sponsoredListings = useMemo(
    () => listings.filter((listing) => Boolean(listing.featured)).slice(0, 5),
    [listings]
  );

  const activeCategoryCount = useMemo(
    () => categories.filter((c) => c.listing_count > 0).length,
    [categories]
  );

  const topCities = useMemo(() => {
    const counts = new Map<string, number>();
    listings.forEach((l) => {
      if (!l.location?.trim()) return;
      const city = l.location.trim();
      counts.set(city, (counts.get(city) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([city]) => city);
  }, [listings]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="bg-background">
      <HomeHero
        query={query}
        location={location}
        onQueryChange={setQuery}
        onLocationChange={setLocation}
        onSubmit={handleSearch}
        listingCount={listings.length}
        activeCategoryCount={activeCategoryCount}
        topCities={topCities}
      />

      <FadeIn duration={0.35} yOffset={8}>
        <CategoryBento categories={sortedCategories.slice(0, 8)} />
      </FadeIn>

      {sponsoredListings.length > 0 && (
        <FadeIn delay={0.05} duration={0.35} yOffset={8}>
          <SponsoredListingsSection listings={sponsoredListings} />
        </FadeIn>
      )}

      <FadeIn delay={0.08} duration={0.35} yOffset={8}>
        <ListingsFeed
          listings={recentListings}
          loading={loading}
          categories={sortedCategories}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      </FadeIn>

      <PublishStrip />
    </div>
  );
};

export default PremiumHome;
