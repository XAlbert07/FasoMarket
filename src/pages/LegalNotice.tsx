import { Building, Users, FileText, Shield, Gavel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const LegalNotice = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {/* En-tête optimisé mobile */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl font-heading font-bold mb-3 sm:mb-4 leading-tight">
              Mentions Légales
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg px-2">
              Informations légales concernant FasoMarket
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            
            {/* Section Contact - La plus importante pour les utilisateurs */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Building className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Éditeur du Site</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">Nom du projet :</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">FasoMarket</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">Statut :</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Projet en développement
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">Contact :</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Email : contact@fasomarket.com<br />
                    Localisation : Koudougou, Burkina Faso
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hébergement - Information technique importante */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Gavel className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Hébergement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Hébergeur du site :</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    Supabase Inc.<br />
                    970 Toa Payoh North #07-04<br />
                    Singapore 318992<br />
                    <span className="inline-block mt-2">
                      Site web : <a href="https://supabase.com" className="text-primary underline">supabase.com</a>
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Propriété Intellectuelle - Simplifié */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Propriété Intellectuelle</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Le contenu de ce site (design, textes, logos, fonctionnalités) est protégé par le droit de la propriété intellectuelle.
                </p>
                
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Toute reproduction ou utilisation non autorisée est interdite sans accord préalable.
                </p>
              </CardContent>
            </Card>

            {/* Responsabilité - Essentiel pour une marketplace */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Limitation de Responsabilité</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  FasoMarket fonctionne comme une plateforme permettant aux utilisateurs de publier des annonces.
                </p>
                
                <div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Nous ne sommes pas responsables de :</h3>
                  <div className="space-y-1 text-muted-foreground text-sm sm:text-base">
                    <p>• La véracité des annonces publiées</p>
                    <p>• Les transactions entre utilisateurs</p>
                    <p>• La qualité des biens et services proposés</p>
                    <p>• Les litiges entre acheteurs et vendeurs</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4 rounded-lg mt-4">
                  <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                    <strong>À savoir :</strong> FasoMarket est une nouvelle plateforme qui développe continuellement ses services pour mieux servir la communauté burkinabè.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Droit applicable - Simplifié */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Droit Applicable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Ces mentions légales sont régies par le droit burkinabè. 
                  En cas de litige, les tribunaux de Ouagadougou seront compétents après tentative de règlement amiable.
                </p>
              </CardContent>
            </Card>

            {/* Mise à jour */}
            <Card className="shadow-sm bg-muted/30">
              <CardContent className="pt-4 sm:pt-6">
                <p className="text-muted-foreground text-xs sm:text-sm text-center">
                  Dernière mise à jour : Septembre 2025<br />
                  Ces mentions évoluent avec le développement du projet.
                </p>
              </CardContent>
            </Card>
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalNotice;