import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/useCategories";
import { useListings } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { Listing } from "@/types/database";
import ListingCard from "@/components/listings/ListingCard";
import SponsoredListingsSection from "@/components/home/SponsoredListingsSection";
import HeroAdCarousel from "@/components/home/HeroAdCarousel";

const toKey = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const inCollection = (listing: Listing, keywords: string[]) => {
  const haystack = `${toKey(listing.title)} ${toKey(listing.description)} ${toKey(listing.category)} ${toKey(listing.categories?.name)}`;
  return keywords.some((term) => haystack.includes(term));
};

export const PremiumHome = () => {
  const ENABLE_HERO_ADS = false;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const { categories } = useCategories();
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchListings({ sortBy: "date" });
  }, [fetchListings]);

  const topCategories = useMemo(
    () => [...categories].sort((a, b) => b.listing_count - a.listing_count).slice(0, 6),
    [categories]
  );

  const highlightedListings = useMemo(() => listings.slice(0, 8), [listings]);
  const sponsoredListings = useMemo(
    () => listings.filter((listing) => Boolean(listing.featured)).slice(0, 8),
    [listings]
  );
  const heroSponsoredListings = useMemo(() => sponsoredListings.slice(0, 5), [sponsoredListings]);

  const cityCount = useMemo(() => new Set(listings.map((listing) => listing.location)).size, [listings]);
  const collectionAuto = useMemo(
    () => listings.filter((listing) => inCollection(listing, ["vehicule", "auto", "voiture", "moto", "camion"])).slice(0, 6),
    [listings]
  );
  const collectionImmo = useMemo(
    () => listings.filter((listing) => inCollection(listing, ["immobilier", "maison", "appartement", "terrain", "parcelle"])).slice(0, 6),
    [listings]
  );
  const collectionServices = useMemo(
    () => listings.filter((listing) => inCollection(listing, ["service", "depannage", "maintenance", "coiffure", "menage"])).slice(0, 6),
    [listings]
  );

  const collectionCards = [
    {
      id: "auto",
      label: "Collection Auto",
      title: "Voitures et motos pretes a partir",
      description: "Vehicules verifies, prix clairs et vendeurs locaux accessibles rapidement.",
      href: "/listings?q=Vehicules",
      className: "lg:col-span-7",
      listings: collectionAuto,
    },
    {
      id: "immo",
      label: "Collection Immo",
      title: "Appartements, parcelles et maisons",
      description: "Selection d'annonces immobilieres avec localisation et contact direct.",
      href: "/listings?q=Immobilier",
      className: "lg:col-span-5",
      listings: collectionImmo,
    },
    {
      id: "services",
      label: "Collection Services",
      title: "Prestataires de confiance pres de chez vous",
      description: "Depannage, menage, maintenance et services du quotidien.",
      href: "/listings?q=Services",
      className: "lg:col-span-5",
      listings: collectionServices,
    },
  ];

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-gradient-hero">
        <div className="container mx-auto px-4 py-6 md:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="hidden text-4xl font-heading font-extrabold leading-tight text-foreground md:block md:text-6xl">
              Trouvez rapidement la bonne annonce pres de chez vous.
            </h1>
            <p className="mx-auto mt-5 hidden max-w-3xl text-lg text-muted-foreground md:block">
              FasoMarket simplifie la vente et l'achat entre particuliers et professionnels, avec une recherche claire et des annonces utiles.
            </p>
            <div className="md:hidden">
              <h1 className="mt-3 text-left text-2xl font-heading font-bold leading-tight text-foreground">
                Rechercher. Comparer. Contacter.
              </h1>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-4 max-w-4xl rounded-xl border border-primary/15 bg-card p-3 shadow-lg md:mt-10"
          >
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Que recherchez-vous ?"
                  className="h-12 pl-10"
                />
              </div>
              <div className="relative md:w-60">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Ville ou region"
                  className="h-12 pl-10"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Rechercher
              </Button>
            </div>
          </form>

          <div className="mx-auto mt-3 w-full max-w-4xl rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4 md:hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.09em] text-foreground/70">C'est le moment de vendre</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm leading-6 text-foreground">Publiez gratuitement et trouvez rapidement des acheteurs.</p>
              <Button size="sm" asChild>
                <Link to="/publish">Publier</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-4 flex max-w-4xl gap-2 overflow-x-auto text-sm md:mt-5 md:flex-wrap md:items-center md:justify-center md:overflow-visible">
            <span className="hidden font-medium text-muted-foreground md:inline">Tendances:</span>
            {["Immobilier", "Vehicules", "Telephones", "Materiel pro"].map((term) => (
              <button
                key={term}
                className="whitespace-nowrap rounded-full border border-border bg-background px-3 py-1 text-foreground transition-colors hover:border-primary/40"
                onClick={() => navigate(`/listings?q=${encodeURIComponent(term)}`)}
              >
                {term}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-8 hidden max-w-5xl gap-4 md:grid md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted-foreground">Annonces actives</p>
              <p className="mt-2 text-3xl font-heading font-bold text-foreground">{listings.length.toLocaleString("fr-FR")}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted-foreground">Villes couvertes</p>
              <p className="mt-2 text-3xl font-heading font-bold text-foreground">{cityCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted-foreground">Confiance</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Moderation et signalement actif
              </div>
            </div>
          </div>
        </div>
      </section>

      {ENABLE_HERO_ADS && heroSponsoredListings.length > 0 && <HeroAdCarousel listings={heroSponsoredListings} />}

      <section className="container mx-auto px-4 py-8 md:py-14">
        <div className="mb-5 flex items-end justify-between gap-3 md:mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">Categories prioritaires</p>
            <h2 className="mt-2 text-2xl font-heading font-bold text-foreground md:text-3xl">Commencez par les secteurs les plus actifs</h2>
          </div>
          <Button variant="ghost" className="hidden md:inline-flex" asChild>
            <Link to="/listings">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="md:hidden -mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex w-max gap-3">
            {topCategories.map((category) => (
              <Link
                key={category.id}
                to={category.href}
                className="min-w-[190px] rounded-xl border border-border bg-card p-4"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.09em] text-foreground/80">{category.name}</p>
                <p className="mt-2 text-2xl font-heading font-bold text-foreground">{category.count}</p>
                <p className="text-sm leading-6 text-foreground/70">annonces</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          {topCategories.map((category) => (
            <Link
              key={category.id}
              to={category.href}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/35"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted-foreground">{category.name}</p>
              <p className="mt-3 text-3xl font-heading font-bold text-foreground">{category.count}</p>
              <p className="text-sm text-muted-foreground">annonces disponibles</p>
            </Link>
          ))}
        </div>
      </section>

      {sponsoredListings.length > 0 && <SponsoredListingsSection listings={sponsoredListings} />}

      <section className="container mx-auto px-4 py-8 md:py-14">
        <div className="mb-5 flex items-end justify-between gap-3 md:mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">Collections</p>
            <h2 className="mt-2 text-2xl font-heading font-bold text-foreground md:text-3xl">Explorez par besoin</h2>
          </div>
          <Button variant="ghost" className="hidden md:inline-flex" asChild>
            <Link to="/listings">
              Explorer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="md:hidden -mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex w-max gap-3">
            {collectionCards.map((collection) => (
              <Link key={collection.id} to={collection.href} className="block w-[270px] rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.1em] text-foreground/75">{collection.label}</p>
                <h3 className="mt-2 text-lg font-heading font-bold leading-tight text-foreground">{collection.title}</h3>
                <p className="mt-1 text-sm leading-6 text-foreground/70">{collection.listings.length} annonces recentes</p>
                {collection.listings.length > 0 ? (
                  <div className="mt-3 grid h-20 grid-cols-2 gap-2 overflow-hidden rounded-lg">
                    {collection.listings.slice(0, 2).map((listing) => (
                      <div key={listing.id} className="overflow-hidden rounded-md bg-muted">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden gap-4 md:grid lg:grid-cols-12">
          <Link
            to={collectionCards[0].href}
            className={`${collectionCards[0].className} group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/35`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{collectionCards[0].label}</p>
            <h3 className="mt-4 max-w-md text-3xl font-heading font-bold leading-tight text-foreground">{collectionCards[0].title}</h3>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">{collectionCards[0].description}</p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">{collectionCards[0].listings.length} annonces recentes</p>

            {collectionCards[0].listings.length > 0 ? (
              <div className="mt-5 grid h-48 grid-cols-3 gap-2 overflow-hidden rounded-xl">
                {collectionCards[0].listings.slice(0, 3).map((listing) => (
                  <div key={listing.id} className="relative overflow-hidden rounded-lg bg-muted">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              Voir les annonces
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <div className="grid gap-4 lg:col-span-5">
            {collectionCards.slice(1).map((collection) => (
              <Link
                key={collection.id}
                to={collection.href}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/35"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{collection.label}</p>
                <h3 className="mt-3 text-2xl font-heading font-bold leading-tight text-foreground">{collection.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{collection.description}</p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">{collection.listings.length} annonces recentes</p>
                {collection.listings.length > 0 ? (
                  <div className="mt-4 grid h-24 grid-cols-2 gap-2 overflow-hidden rounded-lg">
                    {collection.listings.slice(0, 2).map((listing) => (
                      <div key={listing.id} className="overflow-hidden rounded-md bg-muted">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  Ouvrir
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container mx-auto px-4 py-8 md:py-14">
          <div className="mb-5 flex items-center justify-between gap-3 md:mb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">Vitrine</p>
              <h2 className="mt-2 text-2xl font-heading font-bold text-foreground md:text-3xl">Annonces recentes</h2>
            </div>
            <Button asChild className="hidden md:inline-flex">
              <Link to="/listings">Toutes les annonces</Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Chargement des annonces...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {highlightedListings.map((listing) => (
                <div key={listing.id}>
                  <ListingCard
                    listing={listing}
                    isFavorite={isFavorite(listing.id)}
                    onToggleFavorite={toggleFavorite}
                    showCta={true}
                    showCategory={true}
                    showSeller={true}
                    showViews={true}
                    showFavorite={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto hidden px-4 py-14 md:block">
        <div className="rounded-xl border border-border bg-card px-6 py-10 text-center md:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">C'est le moment de vendre</p>
          <h2 className="mt-2 text-3xl font-heading font-bold text-foreground">Deposez une annonce gratuite en toute simplicite</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Avec FasoMarket, trouvez la bonne affaire sur le site referent de petites annonces de particulier a particulier et de professionnels.
            Trouvez la bonne occasion dans nos categories voitures, immobilier, service, Electronique, vetements, etc. Deposez une annonce
            gratuite en toute simplicite pour vendre, rechercher, donner vos biens de seconde main ou promouvoir vos services.
          </p>
          <Button size="lg" className="mt-7 px-8" asChild>
            <Link to="/publish">Publier une annonce</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default PremiumHome;
