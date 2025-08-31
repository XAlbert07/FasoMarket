import { Scale, UserCheck, AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-muted-foreground text-lg">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scale className="mr-2 h-5 w-5" />
                  Objet et Acceptation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme FasoMarket. En accédant et en utilisant notre service, vous acceptez pleinement et sans réserve les présentes conditions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="mr-2 h-5 w-5" />
                  Inscription et Compte Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Conditions d'inscription :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Être âgé de 18 ans révolus ou avoir l'autorisation parentale</li>
                    <li>Fournir des informations exactes et à jour</li>
                    <li>Disposer d'une adresse email valide</li>
                    <li>Accepter les présentes CGU</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Responsabilités :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Maintenir la confidentialité de vos identifiants</li>
                    <li>Informer immédiatement de toute utilisation non autorisée</li>
                    <li>Mettre à jour vos informations personnelles</li>
                    <li>Respecter les conditions d'utilisation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilisation de la Plateforme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Usages autorisés :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Publication d'annonces légales et conformes</li>
                    <li>Recherche et consultation d'annonces</li>
                    <li>Communication avec d'autres utilisateurs</li>
                    <li>Partage d'avis et d'évaluations constructifs</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Usages interdits :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Publication de contenus illégaux, offensants ou trompeurs</li>
                    <li>Utilisation de la plateforme à des fins commerciales non autorisées</li>
                    <li>Tentative de contournement des mesures de sécurité</li>
                    <li>Harcèlement ou comportement abusif envers d'autres utilisateurs</li>
                    <li>Publication de contenu violant les droits de propriété intellectuelle</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Publications et Annonces
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Règles de publication :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Les annonces doivent être véridiques et précises</li>
                    <li>Les images doivent correspondre aux produits proposés</li>
                    <li>Les prix doivent être clairement indiqués</li>
                    <li>Respect des catégories et sous-catégories</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Contenus prohibés :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Produits illégaux ou contrefaits</li>
                    <li>Armes, drogues, médicaments</li>
                    <li>Contenus à caractère pornographique</li>
                    <li>Services financiers non autorisés</li>
                    <li>Animaux protégés ou en voie de disparition</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Sécurité et Fraude
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Conseils de sécurité :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Rencontrez les vendeurs dans des lieux publics</li>
                    <li>Vérifiez les produits avant l'achat</li>
                    <li>Méfiez-vous des offres trop alléchantes</li>
                    <li>Ne communiquez jamais vos données bancaires</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Signalement :</h3>
                  <p className="text-muted-foreground">
                    Tout comportement suspect ou frauduleux doit être immédiatement signalé à notre équipe via le système de signalement intégré ou par email à : security@fasomarket.bf
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsabilité et Garanties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  FasoMarket agit en tant qu'intermédiaire technique. Nous ne sommes pas responsables :
                </p>
                
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>De la qualité, légalité ou conformité des biens et services proposés</li>
                  <li>De l'exécution des transactions entre utilisateurs</li>
                  <li>Des dommages résultant de l'utilisation de la plateforme</li>
                  <li>Des pertes de données ou interruptions de service</li>
                </ul>
                
                <p className="text-muted-foreground mt-4">
                  Chaque utilisateur est responsable de ses actions et de la véracité des informations qu'il communique.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modification et Résiliation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  FasoMarket se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou notification sur la plateforme.
                </p>
                
                <p className="text-muted-foreground">
                  En cas de non-respect des CGU, FasoMarket peut suspendre ou supprimer votre compte sans préavis.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact et Réclamations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Pour toute question ou réclamation concernant nos services :
                </p>
                <div className="text-muted-foreground">
                  <p>Email : support@fasomarket.bf</p>
                  <p>Téléphone : +226 XX XX XX XX</p>
                  <p>Adresse : Ouagadougou, Burkina Faso</p>
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