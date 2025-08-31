import { Heart, Users, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">
              À Propos de FasoMarket
            </h1>
            <p className="text-muted-foreground text-lg">
              La plateforme de référence pour acheter et vendre au Burkina Faso
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Notre Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  FasoMarket a été créé avec une mission simple mais ambitieuse : connecter les Burkinabè en facilitant l'achat et la vente de biens et services dans tout le pays. Nous croyons en la force de notre communauté et en sa capacité à créer un écosystème commercial local dynamique et prospère.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Notre Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Devenir la plateforme de référence pour le commerce local au Burkina Faso, en offrant une solution moderne, sécurisée et accessible à tous. Nous aspirons à digitaliser l'économie locale tout en préservant les valeurs de proximité et de confiance qui caractérisent notre culture.
                </p>
              </CardContent>
            </Card>

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
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Confiance :</span>
                      <span>Créer un environnement sûr pour tous</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Simplicité :</span>
                      <span>Une plateforme facile à utiliser</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Proximité :</span>
                      <span>Favoriser le commerce local</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Innovation :</span>
                      <span>Adapter la technologie à nos besoins</span>
                    </li>
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

            <Card>
              <CardHeader>
                <CardTitle>Notre Histoire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  FasoMarket est né de la vision d'entrepreneurs burkinabè qui ont identifié le besoin croissant d'une plateforme moderne pour faciliter les échanges commerciaux dans notre pays. Face à l'essor du commerce électronique dans le monde et à la digitalisation progressive de notre économie, nous avons décidé de créer une solution adaptée aux réalités locales.
                </p>
                
                <p className="text-muted-foreground">
                  Lancée en 2024, notre plateforme a rapidement gagné la confiance des utilisateurs grâce à son interface intuitive, ses fonctionnalités pratiques et son engagement envers la sécurité des transactions. Nous continuons d'évoluer pour répondre aux besoins changeants de notre communauté.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pourquoi Choisir FasoMarket ?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Pour les Vendeurs :</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Publication gratuite d'annonces</li>
                      <li>Interface simple et intuitive</li>
                      <li>Outils de gestion avancés</li>
                      <li>Support client dédié</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Pour les Acheteurs :</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Large sélection de produits</li>
                      <li>Recherche avancée et filtres</li>
                      <li>Communication directe avec les vendeurs</li>
                      <li>Conseils de sécurité intégrés</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Notre équipe est à votre disposition pour répondre à vos questions et vous accompagner dans votre expérience FasoMarket.
                </p>
                <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
                  <div>
                    <h3 className="font-semibold mb-2">Informations de contact :</h3>
                    <p>Email : contact@fasomarket.bf</p>
                    <p>Téléphone : +226 XX XX XX XX</p>
                    <p>Adresse : Ouagadougou, Burkina Faso</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Horaires d'ouverture :</h3>
                    <p>Lundi - Vendredi : 8h00 - 18h00</p>
                    <p>Samedi : 9h00 - 15h00</p>
                    <p>Dimanche : Fermé</p>
                  </div>
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

export default About;