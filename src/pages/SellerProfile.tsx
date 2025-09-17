// pages/SellerProfile.tsx
// Version mobile-first avec design professionnel et UX optimisée
// Conçue pour une expérience parfaite sur smartphone

import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Mail,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  Award
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
  
  // États pour l'interface mobile optimisée
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [activeTab, setActiveTab] = useState('listings');
  const [showContactOptions, setShowContactOptions] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
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
    limit: 12
  });
  
  const { 
    reviews,
    stats: reviewsStats,
    loading: reviewsLoading,
    error: reviewsError
  } = useSellerReviews(sellerId || '', { 
    limit: 8
  });

  const { favorites, addToFavorites, removeFromFavorites, loading: favLoading } = useFavorites();

  // Détection du scroll pour animations
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        const rate = scrolled * -0.5;
        heroRef.current.style.transform = `translateY(${rate}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gestion des états avec fallbacks intelligents
  const loading = profileLoading;
  const error = profileError || (!profile && !profileLoading ? 'Profil introuvable' : null);

  // Fonction de contact améliorée avec options multiples
  const handleContact = () => {
    if (!profile) {
      toast({
        title: "Erreur",
        description: "Informations du vendeur non disponibles",
        variant: "destructive"
      });
      return;
    }
    setShowContactOptions(true);
  };

  // Contact direct par téléphone
  const handlePhoneCall = () => {
    if (profile?.phone) {
      window.location.href = `tel:${profile.phone}`;
      setShowContactOptions(false);
      toast({
        title: "Appel en cours",
        description: "Redirection vers l'application téléphone..."
      });
    }
  };

  // Contact par WhatsApp
  const handleWhatsApp = () => {
    if (profile?.phone) {
      const message = encodeURIComponent(`Bonjour ${profile.full_name}, je vous contacte via votre profil FasoMarket.`);
      window.open(`https://wa.me/${profile.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
      setShowContactOptions(false);
    }
  };

  // Fonction de partage du profil optimisée mobile
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

  // Gestion des favoris optimisée pour mobile
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

  // Fonction pour le rendu des étoiles optimisée
  const renderStars = (rating: number, size = "h-4 w-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 
          i < rating ? 'text-yellow-400 fill-yellow-200' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Badges de confiance avec design mobile
  const getTrustBadges = () => {
    const badges = [];
    
    if (profile?.is_verified) {
      badges.push({
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Vérifié",
        className: "bg-green-100 text-green-700 border-green-200"
      });
    }
    
    if (profile?.average_rating >= 4.7 && profile?.total_reviews >= 15) {
      badges.push({
        icon: <Crown className="h-3 w-3" />,
        text: "Excellence",
        className: "bg-yellow-100 text-yellow-700 border-yellow-200"
      });
    } else if (profile?.average_rating >= 4.5 && profile?.total_reviews >= 10) {
      badges.push({
        icon: <Shield className="h-3 w-3" />,
        text: "Confiance",
        className: "bg-blue-100 text-blue-700 border-blue-200"
      });
    }
    
    return badges;
  };

  // Skeleton mobile optimisé
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="pb-4">
          {/* Hero skeleton */}
          <div className="bg-white">
            <div className="container mx-auto px-3 py-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-10 bg-slate-200 rounded flex-1"></div>
                  <div className="h-10 bg-slate-200 rounded flex-1"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats skeleton */}
          <div className="container mx-auto px-3 py-4">
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl animate-pulse">
                  <div className="h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion d'erreur optimisée mobile
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-3 py-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Profil introuvable</h2>
                <p className="text-muted-foreground text-sm">
                  Ce profil vendeur n'existe pas ou n'est plus disponible.
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={() => navigate('/listings')} className="w-full">
                  Voir toutes les annonces
                </Button>
                <Button onClick={() => window.history.back()} variant="outline" className="w-full">
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

  const trustBadges = getTrustBadges();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Section Hero mobile-first */}
      <div ref={heroRef} className="bg-gradient-to-br from-blue-50 to-white border-b">
        <div className="container mx-auto px-3 py-6">
          {/* Navigation mobile */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="p-2">
                <Share2 className="h-4 w-4" />
              </Button>
              
              <EnhancedReportDialog
                profileId={sellerId}
                profileName={profile.full_name}
                trigger={
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 p-2">
                    <Flag className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>

          {/* Profil principal mobile */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                  <AvatarImage 
                    src={profile.avatar_url} 
                    alt={`Photo de ${profile.full_name}`}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Indicateur en ligne */}
                {new Date().getTime() - new Date(profile.last_seen || profile.created_at).getTime() < 3600000 && (
                  <div className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 rounded-full border-3 border-white"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 truncate">
                    {profile.full_name}
                  </h1>
                  
                  {/* Badges de confiance */}
                  {trustBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {trustBadges.map((badge, index) => (
                        <Badge 
                          key={index}
                          className={`text-xs ${badge.className}`}
                        >
                          {badge.icon}
                          <span className="ml-1">{badge.text}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Évaluation et localisation */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(profile.average_rating, "h-3 w-3")}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {profile.average_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({profile.total_reviews} avis)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {profile.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{profile.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Depuis {new Date(profile.created_at).getFullYear()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action mobile */}
            <div className="flex gap-2">
              <Button onClick={handleContact} className="flex-1 h-12">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter
              </Button>
              
              <Button variant="outline" className="flex-1 h-12">
                <Mail className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>

            {/* Bio expandable */}
            {profile.bio && (
              <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl">
                <div className="text-sm text-slate-700 leading-relaxed">
                  <p className={showFullBio ? "" : "line-clamp-2"}>
                    {profile.bio}
                  </p>
                  {profile.bio.length > 100 && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="text-blue-600 text-xs mt-1 flex items-center gap-1 hover:text-blue-700 transition-colors"
                    >
                      {showFullBio ? (
                        <>Voir moins <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Voir plus <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques en grille mobile - 3 colonnes seulement */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">{profile.active_listings}</div>
                <p className="text-xs text-blue-700">Annonces</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-900">{profile.average_rating.toFixed(1)}</div>
                <p className="text-xs text-yellow-700">Note</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">{profile.total_reviews}</div>
                <p className="text-xs text-green-700">Avis</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 py-4">
        {/* Alerte pour nouveaux vendeurs */}
        {profile.total_reviews === 0 && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-sm">
              Vendeur nouveau sur FasoMarket. Privilégiez les rencontres en lieu public 
              et vérifiez les produits avant paiement.
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation par onglets mobile-first */}
        <div className="sticky top-16 z-10 bg-slate-50 pb-2 mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="listings" className="text-sm">
                Annonces ({profile.active_listings})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-sm">
                Avis ({profile.total_reviews})
              </TabsTrigger>
            </TabsList>

            {/* Section des annonces optimisée mobile - Layout horizontal */}
            <TabsContent value="listings" className="mt-4 space-y-3">
              {listingsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="overflow-hidden border-0 shadow-sm">
                      <div className="flex">
                        <div className="w-24 h-24 bg-slate-200 animate-pulse flex-shrink-0"></div>
                        <div className="flex-1 p-3 space-y-2">
                          <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                          <div className="h-5 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                          <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : listingsError ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-8 pb-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="font-semibold mb-2">Erreur de chargement</h3>
                    <p className="text-muted-foreground text-sm">
                      Impossible de charger les annonces.
                    </p>
                  </CardContent>
                </Card>
              ) : listings.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-16 pb-16 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucune annonce</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Ce vendeur n'a pas d'annonces actives pour le moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {listings.map((listing) => {
                    const isFavorite = favorites.some(fav => fav.listing_id === listing.id);
                    
                    return (
                      <Link key={listing.id} to={`/listing/${listing.id}`}>
                        <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.98] touch-manipulation">
                          <div className="flex">
                            {/* Image de l'annonce - taille fixe pour cohérence */}
                            <div className="relative w-24 h-24 flex-shrink-0">
                              <img
                                src={listing.images[0] || '/placeholder.svg'}
                                alt={listing.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              
                              {/* Badge de condition en overlay */}
                              <Badge 
                                className="absolute top-1 right-1 text-xs py-0 px-1" 
                                variant={listing.condition === 'new' ? 'default' : 'secondary'}
                              >
                                {listing.condition === 'new' ? 'Neuf' : 'Occ.'}
                              </Badge>
                              
                              {/* Bouton favori optimisé tactile - positionné en bas à gauche */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-1 left-1 bg-white/90 hover:bg-white w-6 h-6 p-0 rounded-full shadow-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleFavoriteToggle(listing.id);
                                }}
                                disabled={favLoading}
                              >
                                {isFavorite ? (
                                  <Heart className="h-3 w-3 text-red-500 fill-current" />
                                ) : (
                                  <HeartOff className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            {/* Contenu de l'annonce - informations à droite */}
                            <div className="flex-1 p-3 min-w-0">
                              {/* Titre de l'annonce - ligne principale */}
                              <h3 className="font-semibold text-sm line-clamp-2 text-slate-900 mb-1 leading-tight">
                                {listing.title}
                              </h3>
                              
                              {/* Prix - élément le plus important */}
                              <div className="text-lg font-bold text-blue-600 mb-2">
                                {formatPrice(listing.price, listing.currency)}
                              </div>
                              
                              {/* Métadonnées - localisation et vues */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{listing.location}</span>
                                </div>
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                  <Eye className="h-3 w-3" />
                                  <span>{listing.views_count || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* Indicateur de clic - flèche subtile */}
                            <div className="flex items-center pr-2">
                              <div className="w-1 h-8 bg-gradient-to-b from-transparent via-blue-200 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                  
                  {/* Message de fin de liste si beaucoup d'annonces */}
                  {listings.length >= 12 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        {listings.length} annonces affichées
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Section des avis optimisée mobile */}
            <TabsContent value="reviews" className="mt-4 space-y-4">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
                            <div className="h-3 bg-slate-200 rounded w-20 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviewsError ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-8 pb-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="font-semibold mb-2">Erreur de chargement</h3>
                    <p className="text-muted-foreground text-sm">
                      Impossible de charger les avis.
                    </p>
                  </CardContent>
                </Card>
              ) : reviews.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-16 pb-16 text-center">
                    <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucun avis</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Ce vendeur n'a pas encore reçu d'évaluations. 
                      Soyez le premier à laisser un avis après un achat.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="h-10 w-10 border-2 border-slate-200">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm font-semibold">
                              {review.reviewer_name?.charAt(0).toUpperCase() || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-slate-900 truncate">
                                {review.reviewer_name || 'Acheteur vérifié'}
                              </h4>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(review.created_at), {
                                  addSuffix: false,
                                  locale: fr
                                }).replace('il y a ', '')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-0.5">
                                {renderStars(review.rating, "h-3 w-3")}
                              </div>
                              {review.transaction_confirmed && (
                                <Badge className="text-xs px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle className="h-2 w-2 mr-1" />
                                  Vérifié
                                </Badge>
                              )}
                            </div>
                            
                            {review.comment && (
                              <p className="text-sm text-slate-700 leading-relaxed mb-2">
                                "{review.comment}"
                              </p>
                            )}
                            
                            {review.listing_title && (
                              <div className="text-xs text-muted-foreground bg-slate-50 px-2 py-1 rounded">
                                <Package className="h-3 w-3 inline mr-1" />
                                {review.listing_title}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Bouton voir plus si nécessaire */}
                  {reviewsStats && reviewsStats.totalReviews > reviews.length && (
                    <Card className="border-dashed border-2 border-slate-200">
                      <CardContent className="pt-6 pb-6 text-center">
                        <p className="text-muted-foreground mb-3 text-sm">
                          {reviewsStats.totalReviews - reviews.length} autres avis disponibles
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <Award className="h-4 w-4 mr-2" />
                          Voir tous les avis
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* MOBILE STICKY BOTTOM BAR - Actions principales */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 lg:hidden z-20 shadow-lg">
        <div className="flex gap-2">
          <Button 
            onClick={handleContact} 
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Contacter
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 h-12"
            onClick={() => {
              // Logique pour message privé
              toast({
                title: "Message privé",
                description: "Fonctionnalité de message privé à implémenter"
              });
            }}
          >
            <Mail className="h-5 w-5 mr-2" />
            Message
          </Button>
        </div>
      </div>

      {/* Padding bottom pour compenser la sticky bar */}
      <div className="h-20 lg:hidden"></div>

      {/* Modal de contact optimisé mobile */}
      <Dialog open={showContactOptions} onOpenChange={setShowContactOptions}>
        <DialogContent className="mx-3 rounded-xl sm:mx-auto bottom-0 sm:bottom-auto translate-y-0 sm:translate-y-[-50%] animate-slide-up">
          <DialogHeader>
            <DialogTitle className="text-lg">Contacter {profile.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choisissez votre méthode de contact préférée
            </p>
            
            <div className="grid gap-3">
              {profile.phone && (
                <Button
                  onClick={handlePhoneCall}
                  className="w-full h-12 justify-start bg-green-600 hover:bg-green-700"
                >
                  <Phone className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Appeler</div>
                    <div className="text-xs opacity-90">Appel direct</div>
                  </div>
                </Button>
              )}
              
              {profile.phone && (
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="w-full h-12 justify-start border-green-200 hover:bg-green-50"
                >
                  <MessageCircle className="h-5 w-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">WhatsApp</div>
                    <div className="text-xs text-muted-foreground">Message instantané</div>
                  </div>
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full h-12 justify-start"
                onClick={() => {
                  setShowContactOptions(false);
                  toast({
                    title: "Message privé",
                    description: "Redirection vers la messagerie..."
                  });
                }}
              >
                <Mail className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Message privé</div>
                  <div className="text-xs text-muted-foreground">Via FasoMarket</div>
                </div>
              </Button>
            </div>
            
            <div className="pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowContactOptions(false)}
                className="w-full"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de partage optimisé mobile */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="mx-3 rounded-xl sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Partager ce profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Partagez le profil de {profile.full_name} avec vos contacts
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                value={window.location.href} 
                readOnly 
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-xs"
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
                  setIsShareModalOpen(false);
                }}
                className="h-12"
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
                  setIsShareModalOpen(false);
                }}
                className="h-12"
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