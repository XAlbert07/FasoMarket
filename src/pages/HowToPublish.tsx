import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Camera, FileText, Eye, DollarSign, Users } from "lucide-react";

const HowToPublish = () => {
  const steps = [
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Créez votre compte",
      description: "Inscrivez-vous gratuitement en quelques secondes avec votre email",
      tips: ["Utilisez une adresse email valide", "Choisissez un mot de passe sécurisé"]
    },
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: "Ajoutez vos photos",
      description: "Prenez des photos de qualité pour attirer l'attention",
      tips: ["Utilisez un bon éclairage", "Montrez l'objet sous tous les angles", "Maximum 10 photos"]
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Rédigez votre annonce",
      description: "Décrivez votre produit avec précision et honnêteté",
      tips: ["Titre accrocheur", "Description détaillée", "Mentionnez l'état de l'objet"]
    },
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: "Fixez votre prix",
      description: "Proposez un prix juste et compétitif",
      tips: ["Consultez les prix similaires", "Restez négociable", "Indiquez si le prix est ferme"]
    },
    {
      icon: <Eye className="h-8 w-8 text-primary" />,
      title: "Publiez et gérez",
      description: "Votre annonce est en ligne, répondez rapidement aux messages",
      tips: ["Répondez dans les 24h", "Soyez poli et professionnel", "Mettez à jour si vendu"]
    }
  ];

  const categories = [
    "Véhicules", "Immobilier", "Téléphones", "Mode & Beauté", 
    "Maison & Jardin", "Emploi & Services", "Électronique", "Sports & Loisirs"
  ];

  const tips = [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      text: "Photos de qualité = plus de vues"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      text: "Prix réaliste = vente rapide"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      text: "Description honnête = confiance"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      text: "Réponse rapide = meilleure réputation"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">
              Comment publier sur FasoMarket
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Suivez ces étapes simples pour publier votre annonce et atteindre des milliers d'acheteurs potentiels
            </p>
          </div>

        {/* Étapes */}
        <div className="grid md:grid-cols-1 gap-8 mb-16">
          {steps.map((step, index) => (
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-primary/10 p-4 rounded-full flex-shrink-0">
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary" className="text-sm">
                          Étape {index + 1}
                        </Badge>
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <div className="grid md:grid-cols-2 gap-2">
                        {step.tips.map((tip, tipIndex) => (
                          <div key={tipIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
           
          ))}
        </div>

        {/* Catégories populaires */}
        
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Catégories les plus populaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((category, index) => (
                  <Badge key={index} variant="outline" className="justify-center p-3">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
       

        {/* Conseils de réussite */}
          <Card>
            <CardHeader>
              <CardTitle>Conseils pour réussir vos ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {tip.icon}
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        
      </main>

      <Footer />
    </div>
  );
};

export default HowToPublish;