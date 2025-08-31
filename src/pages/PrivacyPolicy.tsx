import { Shield, Eye, Lock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-muted-foreground text-lg">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Engagement de Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  FasoMarket s'engage à protéger et respecter votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles conformément aux lois burkinabè et internationales.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5" />
                  Informations Collectées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Informations personnelles :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Nom, prénom et informations de contact</li>
                    <li>Adresse email et numéro de téléphone</li>
                    <li>Localisation géographique (si autorisée)</li>
                    <li>Informations de profil utilisateur</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Données d'utilisation :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Historique de navigation sur la plateforme</li>
                    <li>Interactions avec les annonces</li>
                    <li>Préférences de recherche</li>
                    <li>Données techniques (adresse IP, navigateur)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Utilisation des Données
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Nous utilisons vos informations pour :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Fournir et améliorer nos services</li>
                  <li>Faciliter les transactions entre utilisateurs</li>
                  <li>Personnaliser votre expérience</li>
                  <li>Assurer la sécurité de la plateforme</li>
                  <li>Vous envoyer des communications importantes</li>
                  <li>Respecter nos obligations légales</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Protection des Données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Nous mettons en place des mesures de sécurité appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.
                </p>
                
                <div>
                  <h3 className="font-semibold mb-2">Mesures de sécurité :</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Chiffrement des données sensibles</li>
                    <li>Accès restreint aux données personnelles</li>
                    <li>Surveillance continue des systèmes</li>
                    <li>Formation du personnel sur la protection des données</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vos Droits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Vous disposez des droits suivants concernant vos données personnelles :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Droit d'accès à vos données</li>
                  <li>Droit de rectification</li>
                  <li>Droit à l'effacement</li>
                  <li>Droit à la portabilité</li>
                  <li>Droit d'opposition au traitement</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Pour exercer ces droits, contactez-nous à : contact@fasomarket.bf
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pour toute question concernant cette politique de confidentialité, contactez-nous :
                </p>
                <div className="mt-4 text-muted-foreground">
                  <p>Email : contact@fasomarket.bf</p>
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

export default PrivacyPolicy;