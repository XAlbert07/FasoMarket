// components/Footer.tsx

import { useState } from "react"
import { Facebook, Instagram, Mail, Phone, MapPin, ChevronDown, ChevronUp, ExternalLink, Shield } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const Footer = () => {
  // États pour gérer l'expansion des sections sur mobile
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: false,
    links: false,
    legal: false
  })

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  // Fonction pour basculer l'expansion d'une section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Gestion de l'inscription newsletter
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return

    setNewsletterLoading(true)
    try {
      // Ici, vous ajouterez votre logique d'inscription newsletter
      console.log('Newsletter subscription:', newsletterEmail)
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset du formulaire
      setNewsletterEmail("")
      
      // Ici, vous pourriez afficher un toast de succès
    } catch (error) {
      console.error('Erreur newsletter:', error)
      // Ici, vous pourriez afficher un toast d'erreur
    } finally {
      setNewsletterLoading(false)
    }
  }

  // Données des catégories populaires pour le footer
  const popularCategories = [
    { name: "Véhicules", href: "/listings?category=Véhicules" },
    { name: "Immobilier", href: "/listings?category=Immobilier" },
    { name: "Téléphones", href: "/listings?category=Téléphones" },
    { name: "Mode & Beauté", href: "/listings?category=Mode & Beauté" },
    { name: "Maison & Jardin", href: "/listings?category=Maison & Jardin" },
    { name: "Emploi & Services", href: "/listings?category=Emploi & Services" }
  ]

  // Liens rapides utiles
  const quickLinks = [
    { name: "Comment publier", href: "/how-to-publish" },
    { name: "Conseils sécurité", href: "/help-support" },
    { name: "Aide & Support", href: "/help-support" },
    { name: "À propos", href: "/about" },
    //{ name: "Blog", href: "/blog", external: true },
    { name: "Blog", href: "#", external: true },
    { name: "Télécharger l'app", href: "#", external: true }
  ]

  // Liens légaux obligatoires
  const legalLinks = [
    { name: "Conditions d'utilisation", href: "/terms-of-service" },
    { name: "Politique de confidentialité", href: "/privacy-policy" },
    { name: "Mentions légales", href: "/legal-notice" },
    { name: "Signaler un contenu", href: "/help-support" }
  ]

  return (
    <footer className="bg-foreground text-white">
      {/* MOBILE: Structure compacte et expandable */}
      <div className="block md:hidden">
        <div className="container mx-auto px-4 py-8">
          
          {/* Brand et présentation - toujours visible sur mobile */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
                <span className="text-lg font-bold text-white">F</span>
              </div>
              <span className="text-2xl font-heading font-bold">
                FasoMarket
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto">
              La plateforme de référence pour acheter et vendre au Burkina Faso
            </p>
          </div>

          {/* Newsletter - priorité mobile pour engagement */}
          <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-center mb-4">
              <h3 className="font-heading font-semibold text-lg mb-2">
                Restez informé
              </h3>
              <p className="text-white/80 text-sm">
                Les meilleures offres directement dans votre boîte mail
              </p>
            </div>
            
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Votre adresse email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-primary"
                required
              />
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-hover" 
                disabled={newsletterLoading}
              >
                {newsletterLoading ? "Inscription..." : "S'abonner gratuitement"}
              </Button>
            </form>
          </div>

          {/* Contact - information essentielle toujours visible */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <h3 className="font-heading font-semibold text-base mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              Contact & Localisation
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-white/80">
                  Koudougou, Burkina Faso
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="tel:+22660194555" className="text-white/80 hover:text-primary transition-colors">
                  +226 60194555
                </a>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:contact@fasomarket.bf" className="text-white/80 hover:text-primary transition-colors">
                  contact@fasomarket.bf
                </a>
              </div>
            </div>
          </div>

          {/* Réseaux sociaux - engagement communautaire */}
          <div className="mb-6 text-center">
            <h3 className="font-heading font-semibold text-base mb-3">
              Suivez-nous
            </h3>
            <div className="flex justify-center space-x-4">
              <a 
                href="#" 
                className="bg-white/10 hover:bg-primary p-3 rounded-lg transition-colors"
                aria-label="Suivre sur Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="bg-white/10 hover:bg-primary p-3 rounded-lg transition-colors"
                aria-label="Suivre sur Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Sections expandables - architecture progressive */}
          
          {/* Catégories populaires */}
          <div className="border-t border-white/20 pt-6 mb-6">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto text-left text-white hover:text-primary"
              onClick={() => toggleSection('categories')}
            >
              <span className="font-heading font-semibold text-base">
                Catégories populaires
              </span>
              {expandedSections.categories ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
            
            {expandedSections.categories && (
              <div className="mt-4 space-y-2 pl-4">
                {popularCategories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.href}
                    className="block text-sm text-white/80 hover:text-primary transition-colors py-1"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Liens utiles */}
          <div className="border-t border-white/20 pt-6 mb-6">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto text-left text-white hover:text-primary"
              onClick={() => toggleSection('links')}
            >
              <span className="font-heading font-semibold text-base">
                Liens utiles
              </span>
              {expandedSections.links ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
            
            {expandedSections.links && (
              <div className="mt-4 space-y-2 pl-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="flex items-center text-sm text-white/80 hover:text-primary transition-colors py-1"
                  >
                    {link.name}
                    {link.external && <ExternalLink className="h-3 w-3 ml-1" />}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Informations légales */}
          <div className="border-t border-white/20 pt-6 mb-6">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto text-left text-white hover:text-primary"
              onClick={() => toggleSection('legal')}
            >
              <span className="font-heading font-semibold text-base flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Informations légales
              </span>
              {expandedSections.legal ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
            
            {expandedSections.legal && (
              <div className="mt-4 space-y-2 pl-4">
                {legalLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block text-sm text-white/80 hover:text-primary transition-colors py-1"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Copyright - toujours visible */}
          <div className="text-center pt-6 border-t border-white/20">
            <p className="text-white/60 text-sm">
              © 2025 FasoMarket. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP: Structure traditionnelle enrichie */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4">
          
          {/* Main Footer Desktop */}
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
                  {popularCategories.map((category) => (
                    <li key={category.name}>
                      <Link 
                        to={category.href}
                        className="text-white/80 hover:text-primary transition-colors"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-heading font-semibold text-lg mb-6">Liens rapides</h3>
                <ul className="space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.name}>
                      <Link 
                        to={link.href} 
                        className="text-white/80 hover:text-primary transition-colors flex items-center"
                      >
                        {link.name}
                        {link.external && <ExternalLink className="h-3 w-3 ml-1" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-heading font-semibold text-lg mb-6">Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-white/80">
                      Koudougou, Burkina Faso
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href="tel:+22660194555" className="text-white/80 hover:text-primary transition-colors">
                      +226 60194555
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href="mailto:contact@fasomarket.bf" className="text-white/80 hover:text-primary transition-colors">
                      contact@fasomarket.bf
                    </a>
                  </div>
                </div>
                
                {/* Newsletter Desktop */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Newsletter</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Recevez les meilleures offres
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="flex">
                    <Input
                      type="email"
                      placeholder="Votre email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-white/60 focus:outline-none focus:border-primary"
                      required
                    />
                    <Button 
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-r-lg transition-colors"
                      disabled={newsletterLoading}
                    >
                      {newsletterLoading ? "..." : "S'abonner"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Desktop */}
          <div className="border-t border-white/20 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-white/80 text-sm">
                © 2025 FasoMarket. Tous droits réservés.
              </p>
              
              <div className="flex space-x-6 text-sm">
                {legalLinks.map((link) => (
                  <Link 
                    key={link.name}
                    to={link.href} 
                    className="text-white/80 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}