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

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listing, loading, error } = useListing(id!);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: listing.description,
          url: window.location.href
        });
      } catch (error) {
        // Fallback: copier l'URL
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

  const handleReport = () => {
    toast({
      title: "Signalement enregistré",
      description: "Merci pour votre signalement. Nous examinerons cette annonce."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
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

            {/* Informations principales */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        {listing.title}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {listing.views} vues
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleFavorite(listing.id)}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite(listing.id) ? "fill-destructive text-destructive" : ""}`} />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleReport}>
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-3xl font-bold text-primary">
                    {listing.price.toLocaleString()} XOF
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{listing.category}</Badge>
                    <Badge variant={listing.condition === 'new' ? 'default' : 'outline'}>
                      {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {listing.location}
                    </div>
                  </div>

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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact
                </h3>
                
                <div className="space-y-4">
                  {phoneRevealed ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span className="font-mono">{listing.phone}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(listing.phone);
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
                        <a href={`tel:${listing.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => setPhoneRevealed(true)}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Afficher le numéro
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full" disabled>
                    Envoyer un message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sécurité */}
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