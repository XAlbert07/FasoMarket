import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const popularCategories = [
  { name: "Vehicules", href: "/listings?category=Vehicules" },
  { name: "Immobilier", href: "/listings?category=Immobilier" },
  { name: "Telephones", href: "/listings?category=Telephones" },
  { name: "Maison & Jardin", href: "/listings?category=Maison%20%26%20Jardin" },
];

const platformLinks = [
  { name: "Comment publier", href: "/how-to-publish" },
  { name: "Aide & Support", href: "/help-support" },
  { name: "A propos", href: "/about" },
  { name: "Blog", href: "/blog" },
];

const legalLinks = [
  { name: "Conditions d'utilisation", href: "/terms-of-service" },
  { name: "Politique de confidentialite", href: "/privacy-policy" },
  { name: "Mentions legales", href: "/legal-notice" },
];

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-sm font-heading font-bold text-foreground">
                F
              </div>
              <span className="text-xl font-heading font-bold text-foreground">FasoMarket</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Marketplace locale pour acheter et vendre au Burkina Faso avec une experience claire, fiable et rapide.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a href="#" aria-label="Facebook" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">Categories</h3>
            <ul className="space-y-2.5 text-sm">
              {popularCategories.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-foreground/85 hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">Plateforme</h3>
            <ul className="space-y-2.5 text-sm">
              {platformLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-foreground/85 hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">Contact</h3>
            <ul className="space-y-3 text-sm text-foreground/85">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>Koudougou, Burkina Faso</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-primary" />
                <a href="tel:+22660194555" className="hover:text-foreground">+226 60 19 45 55</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <a href="mailto:contact@fasomarket.bf" className="hover:text-foreground">contact@fasomarket.bf</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {year} FasoMarket. Tous droits reserves.</p>
          <div className="flex flex-wrap gap-5">
            {legalLinks.map((link) => (
              <Link key={link.name} to={link.href} className="hover:text-foreground">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
