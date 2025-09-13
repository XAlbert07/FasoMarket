// pages/SellerProfile.tsx
// Version complète avec système de signalement intégré et interface utilisateur améliorée

import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EnhancedReportDialog } from "@/components/EnhancedReportDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGuestMessages } from '@/hooks/useGuestMessages';
import { 
  MapPin, 
  Calendar, 
  Star, 
  Eye, 
  MessageCircle, 
  Phone, 
  CheckCircle, 
  Crown,
  Package,
  User,
  Flag,
  Shield,
  MoreVertical,
  Share2,
  AlertTriangle,
  Info,
  Heart,
  HeartOff,
  Mail
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatRelativeTime, formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

// Hooks spécialisés avec gestion d'erreur robuste
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { useSellerListings } from '@/hooks/useSellerListings';
import { useSellerReviews } from '@/hooks/useSellerReviews';
import { useFavorites } from '@/hooks/useFavorites';


const SellerProfile = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthContext();
  
  // États pour l'interface utilisateur
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Récupération des données avec gestion d'erreur
  const { 
    profile,
    stats,
    loading: profileLoading,
    error: profileError
  } = useSellerProfile(sellerId || '');
  
  const { 
    listings,
    loading: listingsLoading,
    error: listingsError
  } = useSellerListings(sellerId || '', { 
    status: 'active',
    limit: 12  // Augmenté pour une meilleure présentation
  });
  
  const { 
    reviews,
    stats: reviewsStats,
    loading: reviewsLoading,
    error: reviewsError
  } = useSellerReviews(sellerId || '', { 
    limit: 8  // Augmenté pour une vue d'ensemble complète
  });

  const { favorites, addToFavorites, removeFromFavorites, loading: favLoading } = useFavorites();

  // Gestion des états avec fallbacks intelligents
  const loading = profileLoading;
  const error = profileError || (!profile && !profileLoading ? 'Profil introuvable' : null);

  // Fonction de contact améliorée avec validation
  const handleContact = () => {
    if (!profile) {
      toast({
        title: "Erreur",
        description: "Informations du vendeur non disponibles",
        variant: "destructive"
      });
      return;
    }

    if (profile.phone) {
      window.location.href = `tel:${profile.phone}`;
    } else {
      toast({
        title: "Contact indisponible",
        description: "Ce vendeur n'a pas publié de numéro de téléphone",
        variant: "destructive"
      });
    }
  };

  // Fonction de partage du profil avec options multiples
  const handleShare = async () => {
    const shareData = {
      title: `Profil de ${profile?.full_name || 'Vendeur'} sur FasoMarket`,
      text: `Découvrez le profil de ${profile?.full_name || 'ce vendeur'} sur FasoMarket`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        setIsShareModalOpen(true);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  // Fonction pour copier le lien du profil
  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien du profil a été copié dans le presse-papiers."
      });
      setIsShareModalOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive"
      });
    }
  };

  // Fonction de gestion des favoris sur les annonces
  const handleFavoriteToggle = async (listingId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour ajouter des annonces à vos favoris.",
        variant: "destructive"
      });
      return;
    }

    const isFavorite = favorites.some(fav => fav.listing_id === listingId);
    
    try {
      if (isFavorite) {
        await removeFromFavorites(listingId);
        toast({
          title: "Retiré des favoris",
          description: "L'annonce a été retirée de vos favoris."
        });
      } else {
        await addToFavorites(listingId);
        toast({
          title: "Ajouté aux favoris",
          description: "L'annonce a été ajoutée à vos favoris."
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris pour le moment.",
        variant: "destructive"
      });
    }
  };

  // Fonction pour le rendu des étoiles avec design amélioré
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 
          i < rating ? 'text-yellow-400 fill-yellow-200' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Fonction pour déterminer les badges basés sur les performances et la confiance
  const getBadges = () => {
    const badges = [];
    
    if (profile?.is_verified) {
      badges.push({
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Profil vérifié",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100"
      });
    }
    
    // Badge d'excellence pour les vendeurs exceptionnels
    if (profile?.average_rating >= 4.7 && profile?.total_reviews >= 15) {
      badges.push({
        icon: <Crown className="h-4 w-4" />,
        text: "Vendeur d'excellence",
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100"
      });
    } else if (profile?.average_rating >= 4.5 && profile?.total_reviews >= 10) {
      badges.push({
        icon: <Shield className="h-4 w-4" />,
        text: "Vendeur de confiance",
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100"
      });
    }
    
    return badges;
  };

  // État de chargement avec skeleton moderne
  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <Card>
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex flex-col items-center lg:items-start gap-6">
                    <div className="h-28 w-28 bg-muted rounded-full" />
                    <div className="space-y-3 w-full lg:max-w-xs">
                      <div className="h-12 bg-muted rounded" />
                      <div className="h-12 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="space-y-3">
                      <div className="h-8 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                    <div className="h-20 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 pb-6 text-center">
                    <div className="h-8 w-8 bg-muted rounded mx-auto mb-3" />
                    <div className="h-6 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion d'erreur avec design amélioré et actions recommandées
  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Profil vendeur introuvable</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Ce profil vendeur n'existe pas, a été suspendu ou n'est plus disponible sur FasoMarket.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/listings')} variant="outline">
                  Voir toutes les annonces
                </Button>
                <Button onClick={() => window.history.back()}>
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const badges = getBadges();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* Barre d'actions en haut */}
        <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
          >
            ← Retour
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
            
            {/* Intégration du signalement de profil */}
            <EnhancedReportDialog
              profileId={sellerId}
              profileName={profile.full_name}
              trigger={
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Flag className="h-4 w-4 mr-1" />
                  Signaler
                </Button>
              }
            />
          </div>
        </div>
        
        {/* Section principale du profil */}
        <Card className="mb-6">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Colonne gauche : Avatar et actions */}
              <div className="flex flex-col items-center lg:items-start gap-6">
                <Avatar className="h-32 w-32 ring-4 ring-primary/10">
                  <AvatarImage 
                    src={profile.avatar_url} 
                    alt={`Photo de ${profile.full_name}`}
                  />
                  <AvatarFallback className="text-2xl font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Boutons d'action */}
                <div className="flex flex-col w-full gap-3 lg:max-w-xs">
                  <Button onClick={handleContact} size="lg" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contacter
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>

              {/* Colonne droite : Informations détaillées */}
              <div className="flex-1 space-y-6">
                
                {/* Nom, badges et métadonnées */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-3">
                      <h1 className="text-3xl font-bold text-foreground">
                        {profile.full_name}
                      </h1>
                      
                      {/* Badges de confiance positionnés stratégiquement */}
                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {badges.map((badge, index) => (
                            <Badge 
                              key={index}
                              variant={badge.variant}
                              className={badge.className}
                            >
                              {badge.icon}
                              <span className="ml-1">{badge.text}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Métadonnées du profil */}
                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    {profile.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Membre depuis {formatDistanceToNow(new Date(profile.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>Vu récemment</span>
                    </div>
                  </div>
                </div>

                {/* Bio intégrée */}
                {profile.bio && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-foreground">Présentation</h3>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground leading-relaxed text-base italic">
                        "{profile.bio}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Évaluation et performances */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    {renderStars(profile.average_rating)}
                    <span className="font-semibold text-lg text-foreground">
                      {profile.average_rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({profile.total_reviews} avis)
                    </span>
                  </div>
                  
                  {reviewsStats && reviewsStats.responseRate > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">
                        {reviewsStats.responseRate}% de réponse
                      </span>
                    </div>
                  )}
                </div>

                {/* Alerte pour profils avec peu d'activité */}
                {profile.total_reviews === 0 && (
                  <Alert className="border-amber-200 bg-amber-50/30">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Ce vendeur est nouveau sur FasoMarket. Soyez prudent lors de vos transactions 
                      et privilégiez les rencontres en lieu public.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques consolidées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6 pb-6">
              <Package className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold text-foreground">{profile.active_listings}</div>
              <p className="text-sm text-muted-foreground">Annonces actives</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6 pb-6">
              <Star className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
              <div className="text-2xl font-bold text-foreground">{profile.average_rating.toFixed(1)}</div>
              <p className="text-sm text-muted-foreground">Note moyenne</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6 pb-6">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <div className="text-2xl font-bold text-foreground">{profile.total_reviews}</div>
              <p className="text-sm text-muted-foreground">Avis reçus</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6 pb-6">
              <CheckCircle className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <div className="text-2xl font-bold text-foreground">
                {reviewsStats?.responseRate || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Taux de réponse</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation par onglets avec contenu enrichi */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="listings">
              Annonces ({profile.active_listings})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Avis ({profile.total_reviews})
            </TabsTrigger>
          </TabsList>

          {/* Section des annonces avec favoris intégrés */}
          <TabsContent value="listings" className="space-y-6">
            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse"></div>
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
                      <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : listingsError ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="font-semibold mb-2">Erreur de chargement</h3>
                  <p className="text-muted-foreground">
                    Impossible de charger les annonces pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="pt-16 pb-16 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Aucune annonce active</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Ce vendeur n'a pas d'annonces disponibles actuellement. 
                    Revenez plus tard pour voir ses nouvelles publications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => {
                  const isFavorite = favorites.some(fav => fav.listing_id === listing.id);
                  
                  return (
                    <Card key={listing.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="relative aspect-square">
                        <img
                          src={listing.images[0] || '/placeholder.svg'}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Badge de condition */}
                        <Badge 
                          className="absolute top-3 right-3" 
                          variant={listing.condition === 'new' ? 'default' : 'secondary'}
                        >
                          {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                        </Badge>
                        
                        {/* Bouton favori */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-3 left-3 bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.preventDefault();
                            handleFavoriteToggle(listing.id);
                          }}
                          disabled={favLoading}
                        >
                          {isFavorite ? (
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          ) : (
                            <HeartOff className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {/* Badge catégorie */}
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="outline" className="bg-white/90 text-xs">
                            {listing.category_name}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <h3 className="font-semibold line-clamp-2 text-foreground min-h-[2.5rem]">
                          {listing.title}
                        </h3>
                        
                        <div className="text-xl font-bold text-primary">
                          {formatPrice(listing.price, listing.currency)}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{listing.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{listing.views_count}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button asChild className="flex-1" size="sm">
                            <Link to={`/listing/${listing.id}`}>
                              Voir l'annonce
                            </Link>
                          </Button>
                          
                          {/* Bouton de signalement d'annonce intégré */}
                          <EnhancedReportDialog
                            listingId={listing.id}
                            listingTitle={listing.title}
                            trigger={
                              <Button variant="outline" size="sm" className="px-2">
                                <Flag className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Section des avis avec design amélioré */}
          <TabsContent value="reviews" className="space-y-4">
            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                            <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviewsError ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="font-semibold mb-2">Erreur de chargement</h3>
                  <p className="text-muted-foreground">
                    Impossible de charger les avis pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="pt-16 pb-16 text-center">
                  <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Aucun avis pour le moment</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Ce vendeur n'a pas encore reçu d'évaluations d'acheteurs. 
                    Soyez le premier à laisser un avis après un achat.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10">
                              {review.reviewer_name?.charAt(0).toUpperCase() || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {review.reviewer_name || 'Acheteur vérifié'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                              </div>
                              {review.transaction_confirmed && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Achat vérifié
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      </div>

                      {review.comment && (
                        <div className="mb-4">
                          <p className="text-muted-foreground leading-relaxed">
                            "{review.comment}"
                          </p>
                        </div>
                      )}

                      {review.listing_title && (
                        <div className="text-sm text-muted-foreground border-t pt-3">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>Concernant : <span className="font-medium">{review.listing_title}</span></span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {/* Afficher plus d'avis si disponibles */}
                {reviewsStats && reviewsStats.totalReviews > reviews.length && (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        {reviewsStats.totalReviews - reviews.length} autres avis disponibles
                      </p>
                      <Button variant="outline">
                        Voir tous les avis
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de partage */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partager ce profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Partagez le profil de {profile.full_name} avec vos contacts
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                value={window.location.href} 
                readOnly 
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
              <Button onClick={copyProfileLink} size="sm">
                Copier
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const text = encodeURIComponent(`Découvrez le profil de ${profile.full_name} sur FasoMarket`);
                  const url = encodeURIComponent(window.location.href);
                  window.open(`https://wa.me/?text=${text} ${url}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const text = encodeURIComponent(`Profil ${profile.full_name} sur FasoMarket`);
                  const url = encodeURIComponent(window.location.href);
                  window.open(`sms:?body=${text} ${url}`, '_blank');
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                SMS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SellerProfile;