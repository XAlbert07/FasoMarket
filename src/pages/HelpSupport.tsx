import { HelpCircle, MessageCircle, Shield, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const HelpSupport = () => {
  const faqItems = [
    {
      question: "Comment créer un compte sur FasoMarket ?",
      answer: "Pour créer un compte, cliquez sur 'Connexion' en haut à droite, puis sélectionnez 'Créer un compte'. Remplissez le formulaire avec vos informations personnelles et confirmez votre adresse email."
    },
    {
      question: "Comment publier une annonce ?",
      answer: "Une fois connecté, cliquez sur 'Publier une annonce', choisissez la catégorie appropriée, ajoutez des photos de qualité, rédigez une description détaillée et indiquez votre prix. Votre annonce sera publiée après validation."
    },
    {
      question: "Est-ce que FasoMarket est gratuit ?",
      answer: "Oui, la publication d'annonces et la consultation du site sont entièrement gratuites. Nous proposons également des options premium pour augmenter la visibilité de vos annonces."
    },
    {
      question: "Comment contacter un vendeur ?",
      answer: "Sur chaque annonce, vous trouverez un bouton 'Contacter le vendeur'. Vous pouvez envoyer un message ou voir le numéro de téléphone du vendeur (si partagé)."
    },
    {
      question: "Comment signaler une annonce suspecte ?",
      answer: "Chaque annonce dispose d'un bouton 'Signaler'. Cliquez dessus et indiquez la raison du signalement. Notre équipe examinera votre signalement dans les plus brefs délais."
    },
    {
      question: "Que faire si je suis victime d'une arnaque ?",
      answer: "Contactez immédiatement notre support à security@fasomarket.bf. Signalez également l'incident aux autorités locales. Nous prendrons des mesures contre le compte frauduleux."
    },
    {
      question: "Comment modifier ou supprimer mon annonce ?",
      answer: "Connectez-vous à votre compte, allez dans 'Mes annonces', trouvez l'annonce concernée et utilisez les options 'Modifier' ou 'Supprimer'."
    },
    {
      question: "Comment récupérer mon mot de passe ?",
      answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié', entrez votre adresse email et suivez les instructions reçues par email pour réinitialiser votre mot de passe."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">
              Aide & Support
            </h1>
            <p className="text-muted-foreground text-lg">
              Trouvez rapidement les réponses à vos questions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
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

            <Card className="text-center">
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

            <Card className="text-center">
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

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Questions Fréquemment Posées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Conseils de Sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Pour les Acheteurs :</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Rencontrez le vendeur dans un lieu public et sûr</li>
                  <li>Vérifiez l'état du produit avant le paiement</li>
                  <li>Méfiez-vous des prix anormalement bas</li>
                  <li>Ne payez jamais à l'avance sans avoir vu le produit</li>
                  <li>Signalez tout comportement suspect</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Pour les Vendeurs :</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Prenez des photos réelles et récentes de vos produits</li>
                  <li>Soyez honnête dans vos descriptions</li>
                  <li>Rencontrez les acheteurs dans des lieux publics</li>
                  <li>Ne communiquez jamais d'informations bancaires</li>
                  <li>Méfiez-vous des demandes de paiement inhabituelles</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Support Général :</h3>
                  <p className="text-muted-foreground">support@fasomarket.bf</p>
                  <p className="text-muted-foreground">+226 XX XX XX XX</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Sécurité :</h3>
                  <p className="text-muted-foreground">security@fasomarket.bf</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Partenariats :</h3>
                  <p className="text-muted-foreground">partenaires@fasomarket.bf</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horaires d'Ouverture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-muted-foreground">
                  <p><span className="font-semibold">Lundi - Vendredi :</span> 8h00 - 18h00</p>
                  <p><span className="font-semibold">Samedi :</span> 9h00 - 15h00</p>
                  <p><span className="font-semibold">Dimanche :</span> Fermé</p>
                </div>
                
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note :</strong> Pour les urgences de sécurité, 
                    notre équipe est disponible 24h/7j à security@fasomarket.bf
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