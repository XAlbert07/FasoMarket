import { useState } from "react";
import { HelpCircle, MessageCircle, Shield, Search, ArrowLeft, ChevronDown, ChevronRight, Mail, AlertTriangle, CheckCircle, Users, Book, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const HelpSupport = () => {
  // États pour l'interface mobile interactive
  const [activeSection, setActiveSection] = useState<'faq' | 'security' | 'contact'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // FAQ organisée par catégories pour une meilleure navigation mobile
  const faqCategories = [
    {
      id: 'account',
      title: 'Compte & Connexion',
      icon: <Users className="w-4 h-4" />,
      questions: [
        {
          question: "Comment créer un compte sur FasoMarket ?",
          answer: "Pour créer un compte, cliquez sur 'Connexion' en haut à droite, puis sélectionnez 'Créer un compte'. Remplissez le formulaire avec vos informations personnelles et confirmez votre adresse email.",
          keywords: ['compte', 'inscription', 'créer', 'email']
        },
        {
          question: "Comment récupérer mon mot de passe ?",
          answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié', entrez votre adresse email et suivez les instructions reçues par email pour réinitialiser votre mot de passe.",
          keywords: ['mot de passe', 'oublié', 'récupérer', 'réinitialiser']
        }
      ]
    },
    {
      id: 'listing',
      title: 'Annonces & Vente',
      icon: <Book className="w-4 h-4" />,
      questions: [
        {
          question: "Comment publier une annonce ?",
          answer: "Une fois connecté, cliquez sur 'Publier une annonce', choisissez la catégorie appropriée, ajoutez des photos de qualité, rédigez une description détaillée et indiquez votre prix. Votre annonce sera publiée après validation.",
          keywords: ['publier', 'annonce', 'vendre', 'photos']
        },
        {
          question: "Comment modifier ou supprimer mon annonce ?",
          answer: "Connectez-vous à votre compte, allez dans 'Mes annonces', trouvez l'annonce concernée et utilisez les options 'Modifier' ou 'Supprimer'.",
          keywords: ['modifier', 'supprimer', 'annonce', 'mes annonces']
        },
        {
          question: "Est-ce que FasoMarket est gratuit ?",
          answer: "Oui, la publication d'annonces et la consultation du site sont entièrement gratuites. Nous proposons également des options premium pour augmenter la visibilité de vos annonces.",
          keywords: ['gratuit', 'prix', 'payant', 'premium']
        }
      ]
    },
    {
      id: 'buying',
      title: 'Achat & Contact',
      icon: <MessageCircle className="w-4 h-4" />,
      questions: [
        {
          question: "Comment contacter un vendeur ?",
          answer: "Sur chaque annonce, vous trouverez un bouton 'Contacter le vendeur'. Vous pouvez envoyer un message ou voir le numéro de téléphone du vendeur (si partagé).",
          keywords: ['contacter', 'vendeur', 'message', 'téléphone']
        },
        {
          question: "Comment signaler une annonce suspecte ?",
          answer: "Chaque annonce dispose d'un bouton 'Signaler'. Cliquez dessus et indiquez la raison du signalement. Notre équipe examinera votre signalement dans les plus brefs délais.",
          keywords: ['signaler', 'suspect', 'arnaque', 'problème']
        }
      ]
    },
    {
      id: 'security',
      title: 'Sécurité & Fraude',
      icon: <Shield className="w-4 h-4" />,
      questions: [
        {
          question: "Que faire si je suis victime d'une arnaque ?",
          answer: "Contactez immédiatement notre support à support@fasomarket.bf. Signalez également l'incident aux autorités locales. Nous prendrons des mesures contre le compte frauduleux.",
          keywords: ['arnaque', 'victime', 'fraude', 'security', 'signaler']
        }
      ]
    }
  ];

  // Conseils de sécurité organisés par catégorie pour mobile
  const securityTips = {
    buyers: [
      {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        tip: "Rencontrez le vendeur dans un lieu public et sûr",
        priority: 'high'
      },
      {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        tip: "Vérifiez l'état du produit avant le paiement",
        priority: 'high'
      },
      {
        icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
        tip: "Méfiez-vous des prix anormalement bas",
        priority: 'medium'
      },
      {
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        tip: "Ne payez jamais à l'avance sans avoir vu le produit",
        priority: 'high'
      },
      {
        icon: <Shield className="w-4 h-4 text-blue-600" />,
        tip: "Signalez tout comportement suspect",
        priority: 'medium'
      }
    ],
    sellers: [
      {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        tip: "Prenez des photos réelles et récentes de vos produits",
        priority: 'high'
      },
      {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        tip: "Soyez honnête dans vos descriptions",
        priority: 'high'
      },
      {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        tip: "Rencontrez les acheteurs dans des lieux publics",
        priority: 'high'
      },
      {
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        tip: "Ne communiquez jamais d'informations bancaires",
        priority: 'high'
      },
      {
        icon: <Shield className="w-4 h-4 text-blue-600" />,
        tip: "Méfiez-vous des demandes de paiement inhabituelles",
        priority: 'medium'
      }
    ]
  };

  // Fonction de recherche dans la FAQ
  const filterQuestions = (query: string) => {
    if (!query.trim()) return faqCategories;
    
    const filtered = faqCategories.map(category => ({
      ...category,
      questions: category.questions.filter(q => 
        q.question.toLowerCase().includes(query.toLowerCase()) ||
        q.answer.toLowerCase().includes(query.toLowerCase()) ||
        q.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      )
    })).filter(category => category.questions.length > 0);
    
    return filtered;
  };

  const filteredCategories = filterQuestions(searchQuery);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* MOBILE: En-tête compact avec navigation par onglets */}
          <div className="md:hidden mb-6">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold mb-2">Aide & Support</h1>
              <p className="text-muted-foreground text-sm">
                Trouvez rapidement les réponses à vos questions
              </p>
            </div>

            {/* Navigation par onglets mobile */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveSection('faq')}
                className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === 'faq'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <HelpCircle className="w-4 h-4 mx-auto mb-1" />
                FAQ
              </button>
              <button
                onClick={() => setActiveSection('security')}
                className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === 'security'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-4 h-4 mx-auto mb-1" />
                Sécurité
              </button>
              <button
                onClick={() => setActiveSection('contact')}
                className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === 'contact'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageCircle className="w-4 h-4 mx-auto mb-1" />
                Contact
              </button>
            </div>
          </div>

          {/* DESKTOP: En-tête traditionnel avec cartes d'aperçu */}
          <div className="hidden md:block text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">
              Aide & Support
            </h1>
            <p className="text-muted-foreground text-lg">
              Trouvez rapidement les réponses à vos questions
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Card className="text-center cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>FAQ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Consultez notre foire aux questions pour des réponses rapides
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Support Direct</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Contactez notre équipe pour une assistance personnalisée
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Sécurité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Apprenez à utiliser FasoMarket en toute sécurité
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* MOBILE: Contenu par onglets */}
          <div className="md:hidden">
            
            {/* Section FAQ Mobile */}
            {activeSection === 'faq' && (
              <div className="space-y-4">
                {/* Barre de recherche mobile-optimisée */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher dans l'aide..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Catégories FAQ avec accordéon mobile */}
                <div className="space-y-3">
                  {filteredCategories.map((category) => (
                    <Card key={category.id} className="overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {category.icon}
                          <div className="text-left">
                            <h3 className="font-medium">{category.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {category.questions.length} question{category.questions.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          expandedCategory === category.id ? 'rotate-90' : ''
                        }`} />
                      </button>
                      
                      {expandedCategory === category.id && (
                        <div className="border-t border-border">
                          <Accordion type="single" collapsible className="w-full">
                            {category.questions.map((item, qIndex) => (
                              <AccordionItem key={qIndex} value={`${category.id}-${qIndex}`} className="border-0">
                                <AccordionTrigger className="px-4 py-3 text-left text-sm hover:no-underline">
                                  {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
                                  {item.answer}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium mb-2">Aucun résultat trouvé</h3>
                    <p className="text-sm text-muted-foreground">
                      Essayez d'autres mots-clés ou contactez notre support
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Section Sécurité Mobile */}
            {activeSection === 'security' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                  <h2 className="text-lg font-bold">Conseils de Sécurité</h2>
                  <p className="text-sm text-muted-foreground">
                    Protégez-vous lors de vos transactions
                  </p>
                </div>

                {/* Conseils pour acheteurs */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Pour les Acheteurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {securityTips.buyers.map((tip, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {tip.icon}
                        <div className="flex-1">
                          <p className="text-sm">{tip.tip}</p>
                          {tip.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Important
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Conseils pour vendeurs */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      Pour les Vendeurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {securityTips.sellers.map((tip, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {tip.icon}
                        <div className="flex-1">
                          <p className="text-sm">{tip.tip}</p>
                          {tip.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Important
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Alerte urgence */}
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-900 mb-1">En cas d'urgence</h3>
                        <p className="text-sm text-red-800 mb-2">
                          Si vous êtes victime d'une arnaque ou d'un comportement suspect, contactez-nous immédiatement.
                        </p>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          <Mail className="w-3 h-3 mr-1" />
                          support@fasomarket.bf
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section Contact Mobile */}
            {activeSection === 'contact' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <MessageCircle className="w-12 h-12 text-primary mx-auto mb-2" />
                  <h2 className="text-lg font-bold">Nous Contacter</h2>
                  <p className="text-sm text-muted-foreground">
                    Notre équipe est là pour vous aider
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Support Général</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="mailto:support@fasomarket.bf">
                        <Mail className="w-4 h-4 mr-2" />
                        support@fasomarket.bf
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="tel:+226XXXXXXXX">
                        <Phone className="w-4 h-4 mr-2" />
                        +226 60 19 45 55
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-amber-900 mb-2">Temps de réponse</h3>
                    <div className="space-y-1 text-sm text-amber-800">
                      <p>• Questions générales : 24-48h</p>
                      <p>• Problèmes techniques : 4-8h</p>
                      <p>• Urgences sécurité : Immédiat</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* DESKTOP: Interface traditionnelle complète */}
          <div className="hidden md:block space-y-8">
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  Questions Fréquemment Posées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher dans la FAQ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  {filteredCategories.map((category) => (
                    <div key={category.id}>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        {category.icon}
                        {category.title}
                      </h3>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((item, qIndex) => (
                          <AccordionItem key={qIndex} value={`${category.id}-${qIndex}`}>
                            <AccordionTrigger className="text-left">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Conseils de Sécurité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Pour les Acheteurs :
                  </h3>
                  <div className="grid gap-3">
                    {securityTips.buyers.map((tip, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        {tip.icon}
                        <span className="text-sm">{tip.tip}</span>
                        {tip.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs ml-auto">
                            Important
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    Pour les Vendeurs :
                  </h3>
                  <div className="grid gap-3">
                    {securityTips.sellers.map((tip, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        {tip.icon}
                        <span className="text-sm">{tip.tip}</span>
                        {tip.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs ml-auto">
                            Important
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Support Général :</h3>
                  <p className="text-muted-foreground">support@fasomarket.bf</p>
                  <p className="text-muted-foreground">+226 60 19 45 55</p>
                </div>
                
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note :</strong> Pour les urgences de sécurité, 
                    notre équipe répond prioritairement à support@fasomarket.bf
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpSupport;