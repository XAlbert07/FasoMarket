import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroAdCarouselProps {
  listings: any[];
}

const HeroAdCarousel = ({ listings }: HeroAdCarouselProps) => {
  const slides = useMemo(() => (Array.isArray(listings) ? listings.slice(0, 5) : []), [listings]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [slides.length, activeIndex]);

  if (slides.length === 0) return null;

  const current = slides[activeIndex];
  const image =
    Array.isArray(current.images) && current.images.length > 0
      ? current.images[0]
      : "https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=1600&q=80";

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-[300px] sm:h-[360px]">
          <img src={image} alt={current.title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
            <span className="mb-3 inline-flex w-fit rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Sponsorisé
            </span>
            <h3 className="max-w-2xl text-2xl font-heading font-bold text-white sm:text-3xl">{current.title}</h3>
            <p className="mt-2 text-white/90">
              {(current.location || "Burkina Faso") + " · " + new Intl.NumberFormat("fr-FR").format(current.price || 0) + " FCFA"}
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link to={`/listing/${current.id}`}>Voir l'annonce</Link>
              </Button>
            </div>
          </div>

          {slides.length > 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 border-white/30 bg-black/35 text-white hover:bg-black/50"
                onClick={() => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 border-white/30 bg-black/35 text-white hover:bg-black/50"
                onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border bg-card p-3">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-foreground" : "w-2.5 bg-muted-foreground/40"}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Voir slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroAdCarousel;

