import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  User
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatRelativeTime, formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Conservation de la logique métier robuste avec les hooks spécialisés
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { useSellerListings } from '@/hooks/useSellerListings';
import { useSellerReviews } from '@/hooks/useSellerReviews';

// Interfaces maintenues pour assurer la compatibilité
interface SellerProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  created_at: string;
  is_verified: boolean;
  total_listings: number;
  active_listings: number;
  average_rating: number;
  total_reviews: number;
  phone?: string;
}

interface SellerListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  condition: string;
  images: string[];
  created_at: string;
  views_count: number;
  category_name: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
  listing_title: string;
}

const SellerProfile = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Conservation de la logique de données sophistiquée
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
    limit: 8  // Augmenté pour une meilleure présentation
  });
  
  const { 
    reviews,
    stats: reviewsStats,
    loading: reviewsLoading,
    error: reviewsError
  } = useSellerReviews(sellerId || '', { 
    limit: 6  // Augmenté pour une meilleure vue d'ensemble
  });

  // Gestion intelligente des états préservée
  const loading = profileLoading;
  const error = profileError || (!profile && !profileLoading ? 'Profil introuvable' : null);

  // Fonction de contact améliorée conservée
  const handleContact = () => {
    if (profile?.phone) {
      window.location.href = `tel:${profile.phone}`;
    } else {
      toast({
        title: "Contact non disponible",
        description: "Les informations de contact de ce vendeur ne sont pas publiques",
        variant: "destructive"
      });
    }
  };

  // Fonction pour le rendu des étoiles avec style épuré
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Fonction pour déterminer les badges appropriés basée sur les performances
  const getBadges = () => {
    const badges = [];
    
    // Badge de vérification en vert pour la confiance de base
    if (profile?.is_verified) {
      badges.push({
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Vérifié",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100"
      });
    }
    
    // Badge d'excellence en doré pour les vendeurs exceptionnels
    if (profile?.average_rating >= 4.7 && profile?.total_reviews >= 10) {
      badges.push({
        icon: <Crown className="h-4 w-4" />,
        text: "Excellence",
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100"
      });
    }
    
    return badges;
  };

  // État de chargement épuré
  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement du profil...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion des erreurs avec design épuré
  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Vendeur introuvable</h2>
              <p className="text-muted-foreground mb-4">
                Ce profil vendeur n'existe pas ou n'est plus disponible.
              </p>
              <Button onClick={() => navigate('/listings')}>
                Retour aux annonces
              </Button>
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
        
        {/* Section principale du profil repensée */}
        <Card className="mb-6">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Colonne gauche : Avatar et contact */}
              <div className="flex flex-col items-center lg:items-start gap-6">
                <Avatar className="h-28 w-28 ring-4 ring-primary/10">
                  <AvatarImage 
                    src={profile.avatar_url} 
                    alt={`Photo de ${profile.full_name}`}
                  />
                  <AvatarFallback className="text-2xl font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Boutons d'action repositionnés */}
                <div className="flex flex-col w-full gap-3 lg:max-w-xs">
                  <Button onClick={handleContact} className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contacter le vendeur
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Button>
                </div>
              </div>

              {/* Colonne droite : Informations détaillées */}
              <div className="flex-1 space-y-6">
                
                {/* Nom et badges repositionnés stratégiquement */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">
                      {profile.full_name}
                    </h1>
                    {/* Badges près du nom pour impact visuel maximal */}
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
                  </div>
                </div>

                {/* Bio intégrée dans la section principale */}
                {profile.bio && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Présentation</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Évaluation et statistiques épurées */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    {renderStars(profile.average_rating)}
                    <span className="font-medium text-foreground">
                      {profile.average_rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({profile.total_reviews} avis)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques épurées et ciblées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
        </div>

        {/* Navigation par onglets simplifiée */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="listings">
              Annonces ({profile.active_listings})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Avis ({profile.total_reviews})
            </TabsTrigger>
          </TabsList>

          {/* Section des annonces avec présentation améliorée */}
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
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Erreur de chargement</h3>
                  <p className="text-muted-foreground">
                    Impossible de charger les annonces pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucune annonce active</h3>
                  <p className="text-muted-foreground">
                    Ce vendeur n'a pas d'annonces disponibles actuellement.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <Card key={listing.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="relative aspect-square">
                      <img
                        src={listing.images[0] || '/placeholder.svg'}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge 
                        className="absolute top-3 right-3" 
                        variant={listing.condition === 'new' ? 'default' : 'secondary'}
                      >
                        {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                      </Badge>
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="outline" className="bg-white/90 text-xs">
                          {listing.category_name}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold line-clamp-2 text-foreground">
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

                      <Button asChild className="w-full" size="sm">
                        <Link to={`/listing/${listing.id}`}>
                          Voir l'annonce
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Section des avis épurée */}
          <TabsContent value="reviews" className="space-y-4">
            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                            <div className="h-3 bg-muted rounded w-20 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-16 bg-muted rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviewsError ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Erreur de chargement</h3>
                  <p className="text-muted-foreground">
                    Impossible de charger les avis pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun avis pour le moment</h3>
                  <p className="text-muted-foreground">
                    Ce vendeur n'a pas encore reçu d'évaluations d'acheteurs.
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
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {review.reviewer_name?.charAt(0).toUpperCase() || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {review.reviewer_name || 'Acheteur anonyme'}
                            </h4>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(review.rating)}
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
                        <p className="text-muted-foreground leading-relaxed mb-3">
                          {review.comment}
                        </p>
                      )}

                      {review.listing_title && (
                        <div className="text-sm text-muted-foreground border-t pt-3">
                          Concernant : <span className="font-medium">{review.listing_title}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SellerProfile;