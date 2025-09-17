import { useState } from "react";
import { Shield, Eye, Lock, User, ChevronDown, ChevronUp, Search, Clock, Mail, Phone, MapPin, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PrivacyPolicy = () => {
  // États pour l'interface mobile interactive
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickAccess, setActiveQuickAccess] = useState<string | null>(null);

  // Structure hiérarchisée pour navigation mobile
  const privacySections = [
    {
      id: 'commitment',
      title: 'Notre Engagement',
      icon: <Shield className="w-5 h-5 text-green-600" />,
      priority: 'high',
      summary: 'Protection et respect de votre vie privée',
      content: "FasoMarket s'engage à protéger et respecter votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles conformément aux lois burkinabè et internationales.",
      keywords: ['engagement', 'protection', 'respect', 'vie privée']
    },
    {
      id: 'data-collection',
      title: 'Données Collectées',
      icon: <Eye className="w-5 h-5 text-blue-600" />,
      priority: 'high',
      summary: 'Quelles informations nous collectons',
      content: {
        personal: {
          title: "Informations personnelles",
          items: [
            "Nom, prénom et informations de contact",
            "Adresse email et numéro de téléphone", 
            "Localisation géographique (si autorisée)",
            "Informations de profil utilisateur"
          ]
        },
        usage: {
          title: "Données d'utilisation",
          items: [
            "Historique de navigation sur la plateforme",
            "Interactions avec les annonces",
            "Préférences de recherche",
            "Données techniques (adresse IP, navigateur)"
          ]
        }
      },
      keywords: ['données', 'collecte', 'informations', 'personnelles']
    },
    {
      id: 'data-usage',
      title: 'Utilisation des Données',
      icon: <User className="w-5 h-5 text-purple-600" />,
      priority: 'medium',
      summary: 'Comment nous utilisons vos informations',
      content: [
        "Fournir et améliorer nos services",
        "Faciliter les transactions entre utilisateurs", 
        "Personnaliser votre expérience",
        "Assurer la sécurité de la plateforme",
        "Vous envoyer des communications importantes",
        "Respecter nos obligations légales"
      ],
      keywords: ['utilisation', 'traitement', 'services', 'sécurité']
    },
    {
      id: 'data-protection',
      title: 'Protection des Données',
      icon: <Lock className="w-5 h-5 text-red-600" />,
      priority: 'high',
      summary: 'Comment nous sécurisons vos données',
      content: {
        description: "Nous mettons en place des mesures de sécurité appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.",
        measures: [
          "Chiffrement des données sensibles",
          "Accès restreint aux données personnelles",
          "Surveillance continue des systèmes", 
          "Formation du personnel sur la protection des données"
        ]
      },
      keywords: ['sécurité', 'protection', 'chiffrement', 'surveillance']
    },
    {
      id: 'user-rights',
      title: 'Vos Droits',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      priority: 'high',
      summary: 'Vos droits sur vos données personnelles',
      content: [
        "Droit d'accès à vos données",
        "Droit de rectification",
        "Droit à l'effacement", 
        "Droit à la portabilité",
        "Droit d'opposition au traitement"
      ],
      keywords: ['droits', 'accès', 'rectification', 'effacement', 'portabilité']
    }
  ];

  // Accès rapide aux informations les plus recherchées
  const quickAccessItems = [
    {
      id: 'contact-data',
      title: 'Exercer mes droits',
      description: 'Comment supprimer ou modifier mes données',
      action: () => setActiveQuickAccess('rights')
    },
    {
      id: 'data-safety',
      title: 'Sécurité des données',
      description: 'Comment mes données sont protégées',
      action: () => setActiveQuickAccess('security')
    },
    {
      id: 'contact-support',
      title: 'Contacter le support',
      description: 'Questions sur la confidentialité',
      action: () => setActiveQuickAccess('contact')
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Fonction de recherche dans le contenu
  const filterSections = (query: string) => {
    if (!query.trim()) return privacySections;
    
    return privacySections.filter(section => 
      section.title.toLowerCase().includes(query.toLowerCase()) ||
      section.summary.toLowerCase().includes(query.toLowerCase()) ||
      section.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const filteredSections = filterSections(searchQuery);

  const formatLastUpdate = () => {
    return new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* MOBILE: En-tête compact avec informations essentielles */}
          <div className="text-center mb-6 md:mb-12">
            <div className="mb-3 md:hidden">
              <Badge variant="outline" className="mb-2">
                <FileText className="w-3 h-3 mr-1" />
                Document légal
              </Badge>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-heading font-bold mb-2 md:mb-4">
              Politique de Confidentialité
            </h1>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 md:mb-0">
              <Clock className="w-4 h-4" />
              <span>Mise à jour : {formatLastUpdate()}</span>
            </div>
          </div>

          {/* MOBILE: Barre de recherche et accès rapide */}
          <div className="md:hidden mb-6 space-y-4">
            
            {/* Recherche dans le contenu */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher dans la politique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base"
              />
            </div>

            {/* Accès rapide aux informations critiques */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Accès rapide :</p>
              <div className="grid gap-2">
                {quickAccessItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3"
                    onClick={item.action}
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* MOBILE: Contenu en accordéon avec priorités visuelles */}
          <div className="md:hidden space-y-3">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <Card key={section.id} className={`overflow-hidden ${
                  section.priority === 'high' ? 'border-primary/20' : ''
                }`}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {section.icon}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm">{section.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {section.summary}
                          </p>
                          {section.priority === 'high' && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Important
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        expandedSection === section.id ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </button>
                  
                  {expandedSection === section.id && (
                    <div className="border-t border-border p-4 bg-muted/20">
                      {section.id === 'data-collection' && typeof section.content === 'object' && 'personal' in section.content ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">{section.content.personal.title} :</h4>
                            <ul className="space-y-1">
                              {section.content.personal.items.map((item, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">{section.content.usage.title} :</h4>
                            <ul className="space-y-1">
                              {section.content.usage.items.map((item, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : section.id === 'data-protection' && typeof section.content === 'object' && 'description' in section.content ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {section.content.description}
                          </p>
                          <div>
                            <h4 className="font-medium text-sm mb-2">Mesures de sécurité :</h4>
                            <ul className="space-y-1">
                              {section.content.measures.map((measure, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  {measure}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : Array.isArray(section.content) ? (
                        <ul className="space-y-2">
                          {section.content.map((item, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {section.content as string}
                        </p>
                      )}
                      
                      {section.id === 'user-rights' && (
                        <Alert className="mt-4 border-blue-200 bg-blue-50">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Comment exercer vos droits :</strong> Contactez-nous à contact@fasomarket.bf avec votre demande détaillée.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-2">Aucun résultat trouvé</h3>
                <p className="text-sm text-muted-foreground">
                  Essayez d'autres mots-clés ou consultez toutes les sections
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setSearchQuery('')}
                >
                  Voir toutes les sections
                </Button>
              </div>
            )}

            {/* Contact et actions importantes */}
            <Card className="border-green-200 bg-green-50 mt-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-2">Questions ou exercice de vos droits ?</h3>
                    <div className="space-y-2 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span>contact@fasomarket.bf</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <span>+226 60 19 45 55</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3 h-3 mt-0.5" />
                        <span>Koudougou, Burkina Faso</span>
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-3 bg-green-600 hover:bg-green-700">
                      <Mail className="w-3 h-3 mr-1" />
                      Nous contacter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DESKTOP: Interface traditionnelle préservée avec améliorations */}
          <div className="hidden md:block space-y-8">
            
            {/* Barre de recherche desktop */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher dans la politique de confidentialité..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sections principales */}
            {privacySections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {section.icon}
                    <span className="ml-2">{section.title}</span>
                    {section.priority === 'high' && (
                      <Badge variant="secondary" className="ml-2">
                        Important
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {section.id === 'data-collection' && typeof section.content === 'object' && 'personal' in section.content ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">{section.content.personal.title} :</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {section.content.personal.items.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{section.content.usage.title} :</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {section.content.usage.items.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : section.id === 'data-protection' && typeof section.content === 'object' && 'description' in section.content ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        {section.content.description}
                      </p>
                      <div>
                        <h3 className="font-semibold mb-2">Mesures de sécurité :</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {section.content.measures.map((measure, index) => (
                            <li key={index}>{measure}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : section.id === 'data-usage' ? (
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Nous utilisons vos informations pour :
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        {(section.content as string[]).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : section.id === 'user-rights' ? (
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Vous disposez des droits suivants concernant vos données personnelles :
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                        {(section.content as string[]).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                      <p className="text-muted-foreground">
                        Pour exercer ces droits, contactez-nous à : contact@fasomarket.bf
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {section.content as string}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Pour toute question concernant cette politique de confidentialité, contactez-nous :
                </p>
                <div className="text-muted-foreground">
                  <p>Email : contact@fasomarket.bf</p>
                  <p>Téléphone : +226 60 19 45 55</p>
                  <p>Adresse : Koudougou, Burkina Faso</p>
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

export default PrivacyPolicy;