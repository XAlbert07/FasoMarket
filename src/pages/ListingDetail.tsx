import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MapPin, Eye, Heart, Phone, Calendar, User, Share2, Flag } from "lucide-react";
import { useListing } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatRelativeTime, formatViewsCount } from "@/lib/utils";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listing, loading, error } = useListing(id!);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Chargement de l'annonce...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Annonce introuvable</h1>
            <p className="text-muted-foreground mb-4">
              Cette annonce n'existe pas ou a été supprimée.
            </p>
            <Button onClick={() => navigate('/listings')}>
              Retour aux annonces
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Fonction pour partager l'annonce
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: listing.description,
          url: window.location.href
        });
      } catch (error) {
        // Fallback: copier l'URL dans le presse-papiers
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Lien copié",
          description: "Le lien de l'annonce a été copié dans le presse-papiers"
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié", 
        description: "Le lien de l'annonce a été copié dans le presse-papiers"
      });
    }
  };

  // Fonction pour signaler une annonce
  const handleReport = () => {
    toast({
      title: "Signalement enregistré",
      description: "Merci pour votre signalement. Nous examinerons cette annonce."
    });
  };

  // Fonction pour révéler le numéro de téléphone
  const handleRevealPhone = () => {
    // Cette fonction révèle le numéro. Le problème était probablement
    // que le champ phone n'était pas correctement mappé depuis la base de données
    setPhoneRevealed(true);
    
    // Optionnel: Incrémenter un compteur de "révélations de contact" 
    // pour des statistiques si vous le souhaitez dans le futur
  };

  // Détermination du numéro de téléphone à afficher
  // On vérifie plusieurs champs possibles selon votre structure de données
  const phoneNumber = listing.contact_phone || listing.phone || listing.profiles?.phone;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Informations de l'annonce */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carousel d'images */}
            <Card>
              <CardContent className="p-0">
                {listing.images && listing.images.length > 0 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {listing.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="relative aspect-video">
                            <img
                              src={image}
                              alt={`${listing.title} - Image ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {listing.images.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                    <p className="text-muted-foreground">Aucune image disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations principales de l'annonce */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        {listing.title}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatRelativeTime(listing.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {formatViewsCount(listing.views_count || 0)} vues
                        </div>
                      </div>
                    </div>
                    {/* Boutons d'action rapide */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleFavorite(listing.id)}
                        title={isFavorite(listing.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite(listing.id) ? "fill-destructive text-destructive" : ""}`} />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleShare} title="Partager">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleReport} title="Signaler">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Prix formaté avec F CFA */}
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(listing.price, listing.currency)}
                  </div>

                  {/* Badges et localisation */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant="secondary">
                      {listing.categories?.name || listing.category_id}
                    </Badge>
                    <Badge variant={listing.condition === 'new' ? 'default' : 'outline'}>
                      {listing.condition === 'new' ? 'Neuf' : 
                       listing.condition === 'used' ? 'Occasion' : 
                       'Reconditionné'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {listing.location}
                    </div>
                  </div>

                  {/* Description de l'annonce */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {listing.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Contact et sécurité */}
          <div className="space-y-6">
            {/* Section contact */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact
                </h3>
                
                <div className="space-y-4">
                  {phoneRevealed && phoneNumber ? (
                    // Affichage du numéro révélé
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span className="font-mono">{phoneNumber}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(phoneNumber);
                            toast({
                              title: "Numéro copié",
                              description: "Le numéro a été copié dans le presse-papiers"
                            });
                          }}
                        >
                          Copier
                        </Button>
                      </div>
                      <Button className="w-full" asChild>
                        <a href={`tel:${phoneNumber}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler
                        </a>
                      </Button>
                    </div>
                  ) : (
                    // Bouton pour révéler le numéro
                    <Button
                      className="w-full"
                      onClick={handleRevealPhone}
                      disabled={!phoneNumber}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {phoneNumber ? "Afficher le numéro" : "Numéro non disponible"}
                    </Button>
                  )}
                  
                  {/* Bouton pour envoyer un message (fonctionnalité future) */}
                  <Button variant="outline" className="w-full" disabled>
                    Envoyer un message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Conseils de sécurité */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Conseils de sécurité</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Rencontrez le vendeur dans un lieu public</li>
                  <li>• Vérifiez l'article avant de payer</li>
                  <li>• Ne payez jamais à l'avance</li>
                  <li>• Signaler les annonces suspectes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ListingDetail;