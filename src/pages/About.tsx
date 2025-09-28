import { useState } from "react";
import { Heart, Users, Target, Award, MapPin, Mail, Phone, ArrowRight, Building2, Lightbulb, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const About = () => {
  // États pour l'interface mobile interactive
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'story' | 'values' | 'benefits'>('story');

  // Configuration des sections pour navigation mobile
  const aboutSections = [
    {
      id: 'mission',
      title: 'Notre Mission',
      icon: <Heart className="w-5 h-5" />,
      content: "FasoMarket a été créé avec une mission simple mais ambitieuse : connecter les Burkinabè en facilitant l'achat et la vente de biens et services dans tout le pays. Nous croyons en la force de notre communauté et en sa capacité à créer un écosystème commercial local dynamique et prospère.",
      highlight: true
    },
    {
      id: 'vision',
      title: 'Notre Vision',
      icon: <Target className="w-5 h-5" />,
      content: "Devenir la plateforme de référence pour le commerce local au Burkina Faso, en offrant une solution moderne, sécurisée et accessible à tous. Nous aspirons à digitaliser l'économie locale tout en préservant les valeurs de proximité et de confiance qui caractérisent notre culture.",
      highlight: false
    }
  ];

  // Valeurs avec descriptions étendues pour mobile
  const coreValues = [
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      title: 'Confiance',
      description: 'Créer un environnement sûr pour tous',
      details: 'Nous mettons la sécurité au cœur de chaque interaction sur notre plateforme.',
      color: 'blue'
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-green-600" />,
      title: 'Simplicité',
      description: 'Une plateforme facile à utiliser',
      details: 'Interface intuitive pensée pour tous les niveaux de compétence numérique.',
      color: 'green'
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: 'Proximité',
      description: 'Favoriser le commerce local',
      details: 'Connecter les communautés locales pour renforcer l\'économie burkinabè.',
      color: 'purple'
    },
    {
      icon: <Building2 className="w-6 h-6 text-orange-600" />,
      title: 'Innovation',
      description: 'Adapter la technologie à nos besoins',
      details: 'Solutions modernes respectueuses du contexte local et culturel.',
      color: 'orange'
    }
  ];

  // Avantages 
  const benefits = {
    sellers: [
      { feature: 'Publication gratuite d\'annonces', priority: 'high' },
      { feature: 'Interface simple et intuitive', priority: 'high' },
      { feature: 'Outils de gestion avancés', priority: 'medium' },
      { feature: 'Support client dédié', priority: 'medium' }
    ],
    buyers: [
      { feature: 'Large sélection de produits', priority: 'high' },
      { feature: 'Recherche avancée et filtres', priority: 'high' },
      { feature: 'Communication directe avec les vendeurs', priority: 'medium' },
      { feature: 'Conseils de sécurité intégrés', priority: 'medium' }
    ]
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* MOBILE: En-tête hero compact avec call-to-action */}
          <div className="text-center mb-6 md:mb-12">
            <div className="mb-4 md:hidden">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-heading font-bold mb-2 md:mb-4">
              À Propos de FasoMarket
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-4 md:mb-0">
              La plateforme de référence pour acheter et vendre au Burkina Faso
            </p>
            
            {/* CTA mobile pour engagement immédiat */}
            <div className="md:hidden mt-4">
              <Badge variant="secondary" className="mb-3">
                Lancée en 2025 • 100% Burkinabè
              </Badge>
            </div>
          </div>

          {/* MOBILE: Navigation par onglets pour organiser le contenu */}
          <div className="md:hidden mb-6">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('story')}
                className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'story'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Notre Histoire
              </button>
              <button
                onClick={() => setActiveTab('values')}
                className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'values'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Nos Valeurs
              </button>
              <button
                onClick={() => setActiveTab('benefits')}
                className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'benefits'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Avantages
              </button>
            </div>
          </div>

          {/* MOBILE: Contenu organisé par onglets */}
          <div className="md:hidden space-y-4">
            
            {/* Onglet Histoire */}
            {activeTab === 'story' && (
              <div className="space-y-4">
                {aboutSections.map((section) => (
                  <Card key={section.id} className={section.highlight ? 'border-primary/20 bg-primary/5' : ''}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {section.icon}
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {section.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {/* Histoire détaillée avec accordéon */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notre Histoire</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      FasoMarket est né de la vision d'entrepreneurs burkinabè qui ont identifié le besoin croissant d'une plateforme moderne pour faciliter les échanges commerciaux dans notre pays.
                    </p>
                    
                    <button
                      onClick={() => toggleSection('history')}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      {expandedSection === 'history' ? 'Voir moins' : 'Lire la suite'}
                      {expandedSection === 'history' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    {expandedSection === 'history' && (
                      <div className="pt-3 border-t border-border space-y-3">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Face à l'essor du commerce électronique dans le monde et à la digitalisation progressive de notre économie, nous avons décidé de créer une solution adaptée aux réalités locales.
                        </p>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Lancée en 2025, notre plateforme a rapidement gagné la confiance des utilisateurs grâce à son interface intuitive, ses fonctionnalités pratiques et son engagement envers la sécurité des transactions.
                        </p>
                        <div className="bg-primary/10 p-3 rounded-lg mt-3">
                          <p className="text-sm font-medium text-primary">
                            Nous continuons d'évoluer pour répondre aux besoins changeants de notre communauté.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Onglet Valeurs */}
            {activeTab === 'values' && (
              <div className="space-y-3">
                {coreValues.map((value, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-${value.color}-100`}>
                          {value.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{value.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {value.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {value.details}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Engagements */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-green-800">
                      <Award className="w-4 h-4" />
                      Nos Engagements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { title: 'Sécurité', desc: 'Protection de vos données personnelles' },
                      { title: 'Support', desc: 'Assistance en français et mooré' },
                      { title: 'Gratuité', desc: 'Services de base entièrement gratuits' },
                      { title: 'Qualité', desc: 'Amélioration continue de nos services' }
                    ].map((engagement, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-green-800 text-sm">{engagement.title} : </span>
                          <span className="text-green-700 text-sm">{engagement.desc}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Onglet Avantages */}
            {activeTab === 'benefits' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Pour les Vendeurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {benefits.sellers.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <div className={`w-2 h-2 rounded-full ${
                          benefit.priority === 'high' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-sm flex-1">{benefit.feature}</span>
                        {benefit.priority === 'high' && (
                          <Badge variant="secondary" className="text-xs">
                            Essentiel
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Pour les Acheteurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {benefits.buyers.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <div className={`w-2 h-2 rounded-full ${
                          benefit.priority === 'high' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-sm flex-1">{benefit.feature}</span>
                        {benefit.priority === 'high' && (
                          <Badge variant="secondary" className="text-xs">
                            Essentiel
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Call to action pour mobile */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold mb-2">Prêt à commencer ?</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Rejoignez des milliers d'utilisateurs qui font confiance à FasoMarket
                    </p>
                    <Button size="sm" className="w-full">
                      Commencer maintenant
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section contact mobile-optimisée */}
            <Card className="mt-6 border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Mail className="w-4 h-4" />
                  Nous Contacter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href="mailto:contact@fasomarket.bf">
                      <Mail className="w-3 h-3 mr-2" />
                      contact@fasomarket.bf
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href="tel:+226XXXXXXXX">
                      <Phone className="w-3 h-3 mr-2" />
                      +226 60 19 45 55
                    </a>
                  </Button>
                </div>
                <div className="flex items-start gap-2 text-xs text-blue-700 pt-2 border-t border-blue-200">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Koudougou, Burkina Faso</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DESKTOP: Interface traditionnelle complète préservée */}
          <div className="hidden md:block space-y-8">
            
            {/* Sections principales */}
            <div className="space-y-8">
              {aboutSections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {section.icon}
                      <span className="ml-2">{section.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Valeurs et Engagements en grille */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Nos Valeurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-muted-foreground">
                      {coreValues.map((value, index) => (
                        <li key={index} className="flex items-start">
                          <span className="font-semibold mr-2">{value.title} :</span>
                          <span>{value.description}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-2 h-5 w-5" />
                      Nos Engagements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Sécurité :</span>
                        <span>Protection de vos données personnelles</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Support :</span>
                        <span>Assistance en français et mooré</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Gratuité :</span>
                        <span>Services de base entièrement gratuits</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">Qualité :</span>
                        <span>Amélioration continue de nos services</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Histoire détaillée */}
              <Card>
                <CardHeader>
                  <CardTitle>Notre Histoire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    FasoMarket est né de la vision d'entrepreneurs burkinabè qui ont identifié le besoin croissant d'une plateforme moderne pour faciliter les échanges commerciaux dans notre pays. Face à l'essor du commerce électronique dans le monde et à la digitalisation progressive de notre économie, nous avons décidé de créer une solution adaptée aux réalités locales.
                  </p>
                  
                  <p className="text-muted-foreground">
                    Lancée en 2025, notre plateforme a rapidement gagné la confiance des utilisateurs grâce à son interface intuitive, ses fonctionnalités pratiques et son engagement envers la sécurité des transactions. Nous continuons d'évoluer pour répondre aux besoins changeants de notre communauté.
                  </p>
                </CardContent>
              </Card>

              {/* Avantages */}
              <Card>
                <CardHeader>
                  <CardTitle>Pourquoi Choisir FasoMarket ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Pour les Vendeurs :</h3>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        {benefits.sellers.map((benefit, index) => (
                          <li key={index}>{benefit.feature}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Pour les Acheteurs :</h3>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        {benefits.buyers.map((benefit, index) => (
                          <li key={index}>{benefit.feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Notre équipe est à votre disposition pour répondre à vos questions et vous accompagner dans votre expérience FasoMarket.
                  </p>
                  <div className="text-muted-foreground">
                    <h3 className="font-semibold mb-2">Informations de contact :</h3>
                    <p>Email : contact@fasomarket.bf</p>
                    <p>Téléphone : +226 60 19 45 55</p>
                    <p>Adresse : Koudougou, Burkina Faso</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;