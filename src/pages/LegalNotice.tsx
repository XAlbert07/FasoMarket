import { Building, Gavel, Users, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const LegalNotice = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">
              Mentions Légales
            </h1>
            <p className="text-muted-foreground text-lg">
              Informations légales concernant FasoMarket
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Informations sur l'Éditeur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Dénomination sociale :</h3>
                  <p className="text-muted-foreground">FasoMarket SARL</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Siège social :</h3>
                  <p className="text-muted-foreground">
                    Secteur 15, Avenue Kwame Nkrumah<br />
                    Ouagadougou, Burkina Faso
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">RCCM :</h3>
                  <p className="text-muted-foreground">BF-OUA-2024-XXXXX</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">IFU :</h3>
                  <p className="text-muted-foreground">00XXXXXXX</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Capital social :</h3>
                  <p className="text-muted-foreground">5 000 000 FCFA</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Directeur de Publication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Directeur de la publication : [Nom du Directeur]<br />
                  Qualité : Gérant de FasoMarket SARL
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gavel className="mr-2 h-5 w-5" />
                  Hébergement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Hébergeur du site :</h3>
                    <p className="text-muted-foreground">
                      Supabase Inc.<br />
                      970 Toa Payoh North #07-04<br />
                      Singapore 318992
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Contact hébergeur :</h3>
                    <p className="text-muted-foreground">
                      Site web : https://supabase.com<br />
                      Email : support@supabase.io
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Propriété Intellectuelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  L'ensemble des contenus présents sur le site FasoMarket (textes, images, graphismes, logos, icônes, sons, logiciels) constitue une œuvre protégée par les lois en vigueur sur la propriété intellectuelle.
                </p>
                
                <p className="text-muted-foreground">
                  Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
                </p>
                
                <p className="text-muted-foreground">
                  Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle burkinabè.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsabilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  FasoMarket agit en qualité d'intermédiaire technique permettant aux utilisateurs de publier et consulter des annonces. La responsabilité de FasoMarket ne saurait être engagée pour :
                </p>
                
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>La véracité ou l'exactitude des informations contenues dans les annonces</li>
                  <li>Les transactions effectuées entre utilisateurs</li>
                  <li>La qualité, la conformité ou la disponibilité des biens et services proposés</li>
                  <li>Les dommages directs ou indirects résultant de l'utilisation du site</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Droit Applicable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Les présentes mentions légales sont régies par le droit burkinabè. En cas de litige, et après échec de toute tentative de règlement amiable, les tribunaux de Ouagadougou seront seuls compétents.
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