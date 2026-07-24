import { Link } from "react-router-dom";
import {
  Car,
  Building2,
  Smartphone,
  Shirt,
  Sofa,
  Briefcase,
  Bike,
  Package,
  Wrench,
  Laptop,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const IconMap: Record<string, LucideIcon> = {
  Car,
  Building2,
  Smartphone,
  Shirt,
  Sofa,
  Briefcase,
  Bike,
  Package,
  Wrench,
  Laptop,
};

/** Soft tinted tiles: readable icon + clear category association */
const ToneMap: Record<string, { tile: string; icon: string }> = {
  Car: { tile: "bg-sky-100", icon: "text-sky-700" },
  Building2: { tile: "bg-amber-100", icon: "text-amber-800" },
  Smartphone: { tile: "bg-violet-100", icon: "text-violet-700" },
  Shirt: { tile: "bg-rose-100", icon: "text-rose-700" },
  Sofa: { tile: "bg-teal-100", icon: "text-teal-800" },
  Briefcase: { tile: "bg-slate-200", icon: "text-slate-700" },
  Bike: { tile: "bg-orange-100", icon: "text-orange-700" },
  Wrench: { tile: "bg-emerald-100", icon: "text-emerald-800" },
  Laptop: { tile: "bg-indigo-100", icon: "text-indigo-700" },
  Package: { tile: "bg-muted", icon: "text-muted-foreground" },
};

interface CategoryItem {
  id: string;
  name: string;
  count: string;
  listing_count: number;
  href: string;
  icon: string;
  slug?: string;
  color: string;
}

interface CategoryBentoProps {
  categories: CategoryItem[];
}

const getIcon = (name: string): LucideIcon => IconMap[name] ?? Package;

export const CategoryBento = ({ categories }: CategoryBentoProps) => {
  if (categories.length === 0) return null;

  const grid = categories.slice(0, 8);

  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-5 md:py-6">
        <h2 className="mb-4 text-base font-heading font-semibold text-foreground md:text-lg">
          Catégories
        </h2>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {grid.map((cat) => {
            const Icon = getIcon(cat.icon);
            const tone = ToneMap[cat.icon] || ToneMap.Package;
            const href = cat.slug ? `/category/${cat.slug}` : cat.href;

            return (
              <Link
                key={cat.id}
                to={href}
                className="group flex flex-col items-center rounded-md border border-border bg-card px-2 py-3.5 text-center transition-colors hover:border-foreground/20 hover:bg-muted/40"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-md transition-transform group-hover:scale-[1.03]",
                    tone.tile
                  )}
                >
                  <Icon className={cn("h-5 w-5", tone.icon)} strokeWidth={1.75} />
                </span>
                <p className="mt-2.5 line-clamp-1 text-[13px] font-medium text-foreground">
                  {cat.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {cat.count} annonces
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
