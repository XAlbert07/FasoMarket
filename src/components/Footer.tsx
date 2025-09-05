import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

export const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
                  <span className="text-lg font-bold text-white">F</span>
                </div>
                <span className="text-2xl font-heading font-bold">
                  FasoMarket
                </span>
              </div>
              <p className="text-white/80 mb-6 leading-relaxed">
                La plateforme de référence pour acheter et vendre au Burkina Faso. 
                Connectez-vous avec votre communauté locale.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <a href="#" className="bg-white/10 hover:bg-primary p-2 rounded-lg transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-white/10 hover:bg-primary p-2 rounded-lg transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-6">Catégories</h3>
              <ul className="space-y-3">
                {[
                  "Véhicules",
                  "Immobilier", 
                  "Téléphones",
                  "Mode & Beauté",
                  "Maison & Jardin",
                  "Emploi & Services"
                ].map((category) => (
                  <li key={category}>
                    <a href="#" className="text-white/80 hover:text-primary transition-colors">
                      {category}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-6">Liens rapides</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="how-to-publish" className="text-white/80 hover:text-primary transition-colors">
                    Comment publier
                  </Link>
                </li>
                <li>
                  <Link to="/help-support" className="text-white/80 hover:text-primary transition-colors">
                    Conseils sécurité
                  </Link>
                </li>
                <li>
                  <Link to="/help-support" className="text-white/80 hover:text-primary transition-colors">
                    Aide & Support
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-white/80 hover:text-primary transition-colors">
                    À propos
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <Link to="/terms-of-service" className="text-white/80 hover:text-primary transition-colors">
                    Conditions d'utilisation
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-6">Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-white/80">
                    Ouagadougou, Burkina Faso
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-white/80">
                    +226 XX XX XX XX
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-white/80">
                    contact@fasomarket.bf
                  </span>
                </div>
              </div>
              
              {/* Newsletter */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Newsletter</h4>
                <p className="text-white/80 text-sm mb-4">
                  Recevez les meilleures offres
                </p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Votre email"
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-white/60 focus:outline-none focus:border-primary"
                  />
                  <button className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-r-lg transition-colors">
                    S'abonner
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-white/20 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/80 text-sm">
              © 2024 FasoMarket. Tous droits réservés.
            </p>
            
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy-policy" className="text-white/80 hover:text-primary transition-colors">
                Politique de confidentialité
              </Link>
              <Link to="/legal-notice" className="text-white/80 hover:text-primary transition-colors">
                Mentions légales
              </Link>
              <Link to="/terms-of-service" className="text-white/80 hover:text-primary transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}