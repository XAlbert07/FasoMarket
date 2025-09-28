// pages/HowToPublish.tsx 

import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { 
  CheckCircle, Camera, FileText, Eye, DollarSign, Users, ChevronDown, ChevronUp, 
  PlayCircle, Star, Clock, Phone, MapPin, Shield, Zap, ArrowRight, HelpCircle,
  Lightbulb, TrendingUp, MessageCircle
} from "lucide-react";

const HowToPublish = () => {
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [showQuickTips, setShowQuickTips] = useState(true);

  // Configuration des étapes 
  const steps = [
    {
      icon: <Camera className="h-6 w-6 text-primary" />,
      title: "Prenez de belles photos",
      subtitle: "La clé du succès",
      description: "Des photos de qualité multiplient vos chances de vente par 5",
      quickTip: "Utilisez la lumière naturelle",
      detailedTips: [
        "Photographiez près d'une fenêtre pour un éclairage naturel",
        "Montrez votre objet sous 3-4 angles différents",
        "Évitez le flash qui crée des reflets",
        "Nettoyez bien l'objet avant la photo",
        "Incluez les accessoires dans une photo séparée"
      ],
      mobileSpecific: "Tenez votre téléphone horizontalement pour les gros objets",
      timeEstimate: "5 min",
      difficulty: "Facile"
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Rédigez un titre accrocheur",
      subtitle: "Premier contact",
      description: "Un bon titre = 3x plus de clics sur votre annonce",
      quickTip: "Marque + Modèle + État",
      detailedTips: [
        "Commencez par la marque et le modèle",
        "Précisez l'état (neuf, très bon état, etc.)",
        "Ajoutez 1-2 caractéristiques importantes",
        "Évitez les majuscules et les points d'exclamation",
        "Maximum 60 caractères pour un affichage optimal"
      ],
      mobileSpecific: "Testez votre titre : est-il lisible sur petit écran ?",
      timeEstimate: "2 min",
      difficulty: "Facile"
    },
    {
      icon: <DollarSign className="h-6 w-6 text-primary" />,
      title: "Fixez le bon prix",
      subtitle: "L'art de la négociation",
      description: "Un prix réaliste accélère la vente de 70%",
      quickTip: "Vérifiez les prix similaires",
      detailedTips: [
        "Consultez 3-5 annonces similaires sur FasoMarket",
        "Déduisez 10-15% pour l'usure si occasion",
        "Ajoutez 5-10% de marge de négociation",
        "Indiquez si le prix est ferme ou négociable",
        "Justifiez un prix élevé dans la description"
      ],
      mobileSpecific: "Utilisez la recherche rapide pour comparer les prix",
      timeEstimate: "3 min",
      difficulty: "Moyen"
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary" />,
      title: "Précisez votre localisation",
      subtitle: "Faciliter la rencontre",
      description: "Une localisation précise génère 2x plus de contacts",
      quickTip: "Quartier + point de repère",
      detailedTips: [
        "Indiquez votre quartier ou secteur",
        "Ajoutez un point de repère connu",
        "Proposez un lieu de rencontre public",
        "Mentionnez si livraison possible",
        "Soyez flexible sur le lieu de rendez-vous"
      ],
      mobileSpecific: "Activez la géolocalisation pour suggérer automatiquement",
      timeEstimate: "1 min",
      difficulty: "Facile"
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
      title: "Répondez rapidement",
      subtitle: "Service client",
      description: "Une réponse sous 2h = 90% de chances de vendre",
      quickTip: "Notifications activées",
      detailedTips: [
        "Activez les notifications push de l'app",
        "Répondez dans les 2 heures si possible",
        "Soyez poli même si vous refusez une offre",
        "Posez des questions pour qualifier l'acheteur",
        "Confirmez le rendez-vous par SMS/WhatsApp"
      ],
      mobileSpecific: "Utilisez les réponses rapides prédéfinies",
      timeEstimate: "Continu",
      difficulty: "Facile"
    }
  ];

  // Conseils rapides contextuels pour mobile
  const quickActionTips = [
    {
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      title: "Vendez plus vite",
      tip: "Prix réaliste + photos qualité + réponse rapide",
      color: "bg-amber-50 border-amber-200"
    },
    {
      icon: <Shield className="h-4 w-4 text-green-500" />,
      title: "Restez sécurisé",
      tip: "Rencontre publique + paiement comptant + confiance mutuelle",
      color: "bg-green-50 border-green-200"
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
      title: "Maximisez vos gains",
      tip: "Comparez les prix + négociation + timing optimal",
      color: "bg-blue-50 border-blue-200"
    }
  ];

  // Catégories populaires avec engagement
  const popularCategories = [
    { name: "Téléphones", sales: "Vente rapide", color: "bg-purple-100 text-purple-800" },
    { name: "Véhicules", sales: "Prix élevés", color: "bg-blue-100 text-blue-800" },
    { name: "Immobilier", sales: "Forte demande", color: "bg-green-100 text-green-800" },
    { name: "Mode", sales: "Renouvellement", color: "bg-pink-100 text-pink-800" },
    { name: "Électronique", sales: "Techno", color: "bg-orange-100 text-orange-800" },
    { name: "Maison", sales: "Déco tendance", color: "bg-teal-100 text-teal-800" }
  ];

  const toggleStep = (index: number) => {
    setOpenStep(openStep === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        
        {/* MOBILE: En-tête optimisé avec CTA immédiat */}
        <div className="text-center mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-heading font-bold mb-2 md:mb-4">
            Comment bien vendre sur FasoMarket
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto mb-4 md:mb-6">
            Suivez ces étapes simples et vendez plus rapidement à des milliers d'acheteurs
          </p>
          
          {/* CTA primaire - Mobile prominant */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/publish">
                <PlayCircle className="w-4 h-4 mr-2" />
                Créer mon annonce
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto md:hidden" asChild>
              <Link to="/listings">
                Voir les annonces
              </Link>
            </Button>
          </div>
        </div>

        {/* MOBILE: Conseils rapides collapsibles */}
        <Card className="mb-6 md:hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Conseils express
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickTips(!showQuickTips)}
              >
                {showQuickTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {showQuickTips && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {quickActionTips.map((tip, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${tip.color}`}>
                    <div className="flex items-start gap-2">
                      {tip.icon}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{tip.title}</div>
                        <div className="text-xs mt-1 text-muted-foreground">{tip.tip}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* MOBILE: Étapes avec progressive disclosure */}
        <div className="space-y-3 md:space-y-6">
          {steps.map((step, index) => (
            <Card key={index} className="overflow-hidden">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => toggleStep(index)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      {/* Icône avec numéro d'étape */}
                      <div className="relative flex-shrink-0">
                        <div className="bg-primary/10 p-3 rounded-full">
                          {step.icon}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {index + 1}
                        </Badge>
                      </div>

                      {/* Contenu principal */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base md:text-lg truncate">
                            {step.title}
                          </h3>
                          <span className="text-xs text-muted-foreground hidden md:inline">
                            • {step.timeEstimate}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1 md:line-clamp-none">
                          {step.description}
                        </p>
                        
                        {/* Astuce rapide toujours visible */}
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-amber-700 truncate">
                            {step.quickTip}
                          </span>
                        </div>
                      </div>

                      {/* Indicateur d'expansion */}
                      <div className="flex-shrink-0">
                        {openStep === index ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>

                {/* Contenu détaillé expandable */}
                <CollapsibleContent>
                  {openStep === index && (
                    <CardContent className="pt-0 pb-4 px-4 md:px-6">
                      <div className="ml-12 md:ml-16 space-y-4">
                        
                        {/* Conseils détaillés */}
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Guide détaillé
                          </h4>
                          <div className="space-y-2">
                            {step.detailedTips.map((tip, tipIndex) => (
                              <div key={tipIndex} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                <span className="text-muted-foreground">{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Conseil spécifique mobile */}
                        <Alert className="border-blue-200 bg-blue-50">
                          <Phone className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Sur mobile :</strong> {step.mobileSpecific}
                          </AlertDescription>
                        </Alert>

                        {/* Métriques de performance */}
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Temps : {step.timeEstimate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Niveau : {step.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* DESKTOP: Vue d'ensemble étendue */}
        <div className="hidden md:block mt-12 space-y-8">
          
          {/* Conseils stratégiques desktop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Conseils pour maximiser vos ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActionTips.map((tip, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${tip.color}`}>
                    <div className="flex items-start gap-3">
                      {tip.icon}
                      <div>
                        <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                        <p className="text-xs text-muted-foreground">{tip.tip}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Catégories populaires avec insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Catégories les plus demandées
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choisissez la bonne catégorie pour toucher votre audience cible
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {popularCategories.map((category, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${category.color} hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <div className="font-medium text-sm mb-1">{category.name}</div>
                    <div className="text-xs opacity-75">{category.sales}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MOBILE: Catégories en carrousel horizontal */}
        <div className="md:hidden mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Catégories populaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {popularCategories.map((category, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 px-3 py-2 rounded-full border ${category.color} text-xs font-medium whitespace-nowrap`}
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA de fin - Mobile proéminent */}
        <div className="mt-8 md:mt-12 text-center">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 md:p-8">
              <h3 className="font-semibold text-lg md:text-xl mb-2">
                Prêt à publier votre première annonce ?
              </h3>
              <p className="text-muted-foreground text-sm md:text-base mb-4 md:mb-6">
                Suivez le guide et vendez rapidement sur FasoMarket
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link to="/publish">
                    <Camera className="w-4 h-4 mr-2" />
                    Publier maintenant
                  </Link>
                </Button>
                
                <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                  <Link to="/listings">
                    <Eye className="w-4 h-4 mr-2" />
                    Parcourir les annonces
                  </Link>
                </Button>
              </div>

              {/* Statistiques encourageantes */}
              <div className="mt-6 pt-4 border-t border-primary/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg md:text-xl font-bold text-primary">85%</div>
                    <div className="text-xs text-muted-foreground">Taux de vente</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-xl font-bold text-primary">2j</div>
                    <div className="text-xs text-muted-foreground">Vente moyenne</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-xl font-bold text-primary">24h</div>
                    <div className="text-xs text-muted-foreground">Premier contact</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section FAQ rapide - Mobile */}
        <div className="mt-6 md:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Questions fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { q: "Combien coûte la publication ?", a: "C'est gratuit !" },
                { q: "Combien de photos puis-je ajouter ?", a: "Jusqu'à 08 photos" },
                { q: "Ma localisation est-elle publique ?", a: "Seule votre ville est visible" },
                { q: "Comment modifier mon annonce ?", a: "Via 'Mes annonces' dans votre profil" }
              ].map((faq, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium text-sm mb-1">{faq.q}</div>
                  <div className="text-xs text-muted-foreground">{faq.a}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowToPublish;