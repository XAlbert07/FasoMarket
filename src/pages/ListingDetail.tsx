import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MapPin, Eye, Heart, Phone, Calendar, User, Share2, Flag, Star, MessageCircle, CheckCircle } from "lucide-react";

// Import des hooks existants
import { useListing } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";

// NOUVEAU : Import du hook spécialisé pour les informations vendeur
// Ce hook remplace la fonction getSellerStats() improvisée
import { useSellerBasicInfo } from '@/hooks/useSellerProfile';

import { formatPrice, formatRelativeTime, formatViewsCount } from "@/lib/utils";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hook existant pour récupérer les données de l'annonce
  const { listing, loading, error } = useListing(id!);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // TRANSFORMATION CLÉE : Utilisation du hook spécialisé pour le vendeur
  // Ce hook se déclenche seulement quand nous avons l'ID du vendeur
  // Cela évite les appels inutiles et améliore les performances
  const { 
    basicInfo: seller, 
    loading: sellerLoading, 
    error: sellerError 
  } = useSellerBasicInfo(listing?.user_id || '');
  
  // États locaux pour la gestion de l'interface utilisateur
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Gestion intelligente des états de chargement
  // Le chargement de l'annonce est prioritaire car c'est l'information principale
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion des erreurs critiques
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

  // Fonctions utilitaires pour les interactions utilisateur
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: listing.description,
          url: window.location.href
        });
      } catch (error) {
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

  const handleRevealPhone = () => {
    setPhoneRevealed(true);
  };

  // AMÉLIORATION : Logique simplifiée pour le numéro de téléphone
  // Cette approche est plus robuste et évite les répétitions
  const phoneNumber = listing.contact_phone || seller?.phone;

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

                  {/* Prix formaté avec devise locale */}
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(listing.price, listing.currency)}
                  </div>

                  {/* Badges informatifs et localisation */}
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

                  {/* Description détaillée de l'annonce */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {listing.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION AMÉLIORÉE - Informations sur le vendeur avec vraies données */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">À propos du vendeur</h3>
                
                {/* Gestion intelligente du chargement des informations vendeur */}
                {sellerLoading ? (
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-muted rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="space-y-1">
                            <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : sellerError ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Impossible de charger les informations du vendeur
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {/* Avatar cliquable avec effet de hover */}
                    <Link 
                      to={`/seller-profile/${seller?.id || listing.user_id}`}
                      className="flex-shrink-0 group"
                    >
                      <Avatar className="h-16 w-16 group-hover:ring-2 group-hover:ring-primary transition-all">
                        <AvatarImage 
                          src={seller?.avatar_url} 
                          alt={seller?.full_name || "Photo du vendeur"} 
                        />
                        <AvatarFallback className="text-lg">
                          {seller?.full_name?.charAt(0) || listing.profiles?.full_name?.charAt(0) || 'V'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link 
                          to={`/seller-profile/${seller?.id || listing.user_id}`}
                          className="font-semibold text-lg hover:text-primary transition-colors"
                        >
                          {seller?.full_name || listing.profiles?.full_name || 'Vendeur anonyme'}
                        </Link>
                        
                        {/* Indicateur de vérification avec vraies données */}
                        {seller?.is_verified && (
                          <CheckCircle className="h-5 w-5 text-green-500" title="Vendeur vérifié" />
                        )}
                      </div>

                      {/* AMÉLIORATION MAJEURE : Statistiques réelles du vendeur */}
                      {/* Ces données proviennent maintenant du hook useSellerBasicInfo */}
                      {/* au lieu d'être calculées de manière improvisée */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Membre depuis</p>
                          <p className="font-medium">
                            {seller?.created_at ? (
                              new Date(seller.created_at).toLocaleDateString('fr-FR', { 
                                month: 'long', 
                                year: 'numeric' 
                              })
                            ) : (
                              new Date(listing.created_at).toLocaleDateString('fr-FR', { 
                                month: 'long', 
                                year: 'numeric' 
                              })
                            )}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">Annonces actives</p>
                          <p className="font-medium">
                            {seller?.active_listings || seller?.total_listings || '1'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">Taux de réponse</p>
                          <p className="font-medium text-green-600">
                            {seller?.response_rate ? `${seller.response_rate}%` : 'N/A'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <div>
                            <p className="text-muted-foreground">Note moyenne</p>
                            {seller?.average_rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{seller.average_rating}</span>
                              </div>
                            ) : (
                              <p className="font-medium text-muted-foreground">Pas d'avis</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Localisation du vendeur avec données réelles */}
                      {seller?.city && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            Basé à {seller.city}
                          </p>
                        </div>
                      )}

                      {/* Affichage de la bio si disponible */}
                      {seller?.bio && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {seller.bio}
                          </p>
                        </div>
                      )}

                      {/* Bouton pour accéder au profil complet */}
                      <div className="mt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/seller-profile/${seller?.id || listing.user_id}`}>
                            <User className="h-4 w-4 mr-2" />
                            Voir le profil complet
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Contact et informations complémentaires */}
          <div className="space-y-6">
            {/* Section contact améliorée */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contacter le vendeur
                </h3>
                
                <div className="space-y-4">
                  {phoneRevealed && phoneNumber ? (
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
                          Appeler maintenant
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleRevealPhone}
                      disabled={!phoneNumber}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {phoneNumber ? "Afficher le numéro" : "Numéro non disponible"}
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Button>
                </div>

                {/* Informations de disponibilité basées sur les données réelles */}
                <Separator className="my-4" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong>Temps de réponse habituel :</strong> 
                    {seller?.response_rate && seller.response_rate > 90 
                      ? " Quelques heures" 
                      : " Quelques jours"}
                  </p>
                  <p>
                    <strong>Disponibilité :</strong> 8h - 18h
                  </p>
                  {seller?.is_verified && (
                    <div className="mt-2 flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs">Vendeur vérifié</span>
                    </div>
                  )}
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
                  <li>• Privilégiez les vendeurs vérifiés</li>
                </ul>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Astuce :</strong> Consultez le profil du vendeur pour en savoir plus sur sa réputation avant d'acheter.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation vers d'autres annonces du vendeur */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Autres annonces de ce vendeur</h3>
                {seller?.active_listings && seller.active_listings > 1 ? (
                  <div className="text-sm text-muted-foreground mb-3">
                    Ce vendeur a {seller.active_listings - 1} autre{seller.active_listings > 2 ? 's' : ''} annonce{seller.active_listings > 2 ? 's' : ''} active{seller.active_listings > 2 ? 's' : ''}.
                  </div>
                ) : null}
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/seller-profile/${seller?.id || listing.user_id}`}>
                    Voir toutes ses annonces
                  </Link>
                </Button>
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