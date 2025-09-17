import { Scale, UserCheck, AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main content avec padding mobile-first optimisé */}
      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* En-tête avec typographie responsive */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-3 sm:mb-4 leading-tight px-2">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-4">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Sections avec espacement mobile-optimisé */}
          <div className="space-y-6 sm:space-y-8">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Scale className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                  <span className="leading-tight">Objet et Acceptation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme FasoMarket. En accédant et en utilisant notre service, vous acceptez pleinement et sans réserve les présentes conditions.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <UserCheck className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                  <span className="leading-tight">Inscription et Compte Utilisateur</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-5 sm:space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-primary text-base sm:text-lg">Conditions d'inscription :</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Être âgé de 18 ans révolus ou avoir l'autorisation parentale</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Fournir des informations exactes et à jour</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Disposer d'une adresse email valide</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Accepter les présentes CGU</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 text-primary text-base sm:text-lg">Responsabilités :</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Maintenir la confidentialité de vos identifiants</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Informer immédiatement de toute utilisation non autorisée</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Mettre à jour vos informations personnelles</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Respecter les conditions d'utilisation</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Utilisation de la Plateforme</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-5 sm:space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-green-700 text-base sm:text-lg">Usages autorisés :</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 flex-shrink-0 font-bold">✓</span>
                      <span>Publication d'annonces légales et conformes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 flex-shrink-0 font-bold">✓</span>
                      <span>Recherche et consultation d'annonces</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 flex-shrink-0 font-bold">✓</span>
                      <span>Communication avec d'autres utilisateurs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 flex-shrink-0 font-bold">✓</span>
                      <span>Partage d'avis et d'évaluations constructifs</span>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-2 border-t border-red-100">
                  <h3 className="font-semibold mb-3 text-red-700 text-base sm:text-lg">Usages interdits :</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">✗</span>
                      <span>Publication de contenus illégaux, offensants ou trompeurs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">✗</span>
                      <span>Utilisation de la plateforme à des fins commerciales non autorisées</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">✗</span>
                      <span>Tentative de contournement des mesures de sécurité</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">✗</span>
                      <span>Harcèlement ou comportement abusif envers d'autres utilisateurs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">✗</span>
                      <span>Publication de contenu violant les droits de propriété intellectuelle</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <AlertTriangle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-amber-600" />
                  <span className="leading-tight">Publications et Annonces</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-5 sm:space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold mb-3 text-green-800 text-base sm:text-lg">Règles de publication :</h3>
                  <ul className="space-y-2 text-green-700 text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Les annonces doivent être véridiques et précises</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Les images doivent correspondre aux produits proposés</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Les prix doivent être clairement indiqués</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 flex-shrink-0 font-bold">•</span>
                      <span>Respect des catégories et sous-catégories</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold mb-3 text-red-800 text-base sm:text-lg">Contenus prohibés :</h3>
                  <ul className="space-y-2 text-red-700 text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">⚠</span>
                      <span>Produits illégaux ou contrefaits</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">⚠</span>
                      <span>Armes, drogues, médicaments</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">⚠</span>
                      <span>Contenus à caractère pornographique</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">⚠</span>
                      <span>Services financiers non autorisés</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2 mt-1 flex-shrink-0 font-bold">⚠</span>
                      <span>Animaux protégés ou en voie de disparition</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-blue-200">
              <CardHeader className="pb-3 sm:pb-4 bg-blue-50">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-600" />
                  <span className="leading-tight text-blue-800">Sécurité et Fraude</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5 sm:space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-blue-700 text-base sm:text-lg">Conseils de sécurité :</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1 flex-shrink-0 font-bold">🛡️</span>
                      <span>Rencontrez les vendeurs dans des lieux publics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1 flex-shrink-0 font-bold">🛡️</span>
                      <span>Vérifiez les produits avant l'achat</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1 flex-shrink-0 font-bold">🛡️</span>
                      <span>Méfiez-vous des offres trop alléchantes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1 flex-shrink-0 font-bold">🛡️</span>
                      <span>Ne communiquez jamais vos données bancaires</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold mb-3 text-amber-800 text-base sm:text-lg">Signalement :</h3>
                  <p className="text-amber-700 text-sm sm:text-base leading-relaxed">
                    Tout comportement suspect ou frauduleux doit être immédiatement signalé à notre équipe via le système de signalement intégré ou par email à : 
                    <span className="font-medium break-all"> security@fasomarket.bf</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Responsabilité et Garanties</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4 sm:space-y-5">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  FasoMarket agit en tant qu'intermédiaire technique. Nous ne sommes pas responsables :
                </p>
                
                <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                  <li className="flex items-start">
                    <span className="text-amber-600 mr-2 mt-1 flex-shrink-0 font-bold">⚪</span>
                    <span>De la qualité, légalité ou conformité des biens et services proposés</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-600 mr-2 mt-1 flex-shrink-0 font-bold">⚪</span>
                    <span>De l'exécution des transactions entre utilisateurs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-600 mr-2 mt-1 flex-shrink-0 font-bold">⚪</span>
                    <span>Des dommages résultant de l'utilisation de la plateforme</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-600 mr-2 mt-1 flex-shrink-0 font-bold">⚪</span>
                    <span>Des pertes de données ou interruptions de service</span>
                  </li>
                </ul>
                
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    <strong>Important :</strong> Chaque utilisateur est responsable de ses actions et de la véracité des informations qu'il communique.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Modification et Résiliation</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4 sm:space-y-5">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  FasoMarket se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou notification sur la plateforme.
                </p>
                
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                  <p className="text-red-700 text-sm sm:text-base leading-relaxed">
                    <strong>Attention :</strong> En cas de non-respect des CGU, FasoMarket peut suspendre ou supprimer votre compte sans préavis.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-primary">
              <CardHeader className="pb-3 sm:pb-4 bg-primary/5">
                <CardTitle className="text-lg sm:text-xl text-primary">Contact et Réclamations</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-muted-foreground mb-4 text-sm sm:text-base leading-relaxed">
                  Pour toute question ou réclamation concernant nos services :
                </p>
                <div className="space-y-2 text-muted-foreground text-sm sm:text-base">
                  <p className="flex items-center">
                    <span className="font-medium w-20 flex-shrink-0">Email :</span>
                    <span className="break-all">support@fasomarket.bf</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium w-20 flex-shrink-0">Téléphone :</span>
                    <span>+226 60 19 45 55</span>
                  </p>
                  <p className="flex items-start">
                    <span className="font-medium w-20 flex-shrink-0 mt-0">Adresse :</span>
                    <span>Koudougou, Burkina Faso</span>
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

export default TermsOfService;