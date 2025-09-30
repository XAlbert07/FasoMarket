// pages/SellerProfile.tsx

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
import { SmartImage } from "@/components/ui/SmartImage"; 
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
  Award,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatRelativeTime, formatPrice, formatViewsCount, isListingNew } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

// Hooks spécialisés
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { useSellerListings } from '@/hooks/useSellerListings';
import { useSellerReviews } from '@/hooks/useSellerReviews';
import { useFavorites } from '@/hooks/useFavorites';

const SellerProfile = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthContext();
  
  //  Gestion intelligente de la navigation de retour
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('returnTo');
  const returnUrl = searchParams.get('returnUrl');
  
  // États pour l'interface mobile optimisée
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [activeTab, setActiveTab] = useState('listings');
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
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
    loading,
    error,
    isEmpty,
    hasResults,
    pagination,
    nextPage
  } = useSellerListings(sellerId || '', { 
    status: 'active',
    limit: 12
  });
  
  const { 
    reviews,
    stats: reviewsStats,
    loading: reviewsLoading,
    error: reviewsError,
    isEmpty: reviewsIsEmpty
  } = useSellerReviews(sellerId || '', { 
    limit: 8
  });

  const { favorites, addToFavorites, removeFromFavorites, loading: favLoading } = useFavorites();

  /**
   * Fonction pour gérer le retour intelligent
   * Utilise les paramètres de retour pour revenir au bon endroit
   */
  const handleSmartBack = () => {
    if (returnTo === 'messages' && returnUrl) {
      try {
        const decodedReturnUrl = decodeURIComponent(returnUrl);
        console.log('Retour intelligent vers:', decodedReturnUrl);
        navigate(decodedReturnUrl);
        return;
      } catch (error) {
        console.error('Erreur lors du décodage de l\'URL de retour:', error);
      }
    }
    
    // Fallback: retour classique
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/listings');
    }
  };

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
  const mainLoading = profileLoading;
  const mainError = profileError || (!profile && !profileLoading ? 'Profil introuvable' : null);

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

  // Fonction pour rediriger vers la conversation directe 
  const handleDirectMessage = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour envoyer des messages privés.",
        variant: "destructive"
      });
      return;
    }

    if (!profile || !sellerId) {
      toast({
        title: "Erreur",
        description: "Informations du vendeur non disponibles",
        variant: "destructive"
      });
      return;
    }

    const messageUrl = `/messages?` + new URLSearchParams({
      sellerId: sellerId,
      sellerName: profile.full_name,
      sellerAvatar: profile.avatar_url || '',
      direct: 'true'
    }).toString();

    navigate(messageUrl);
    
    toast({
      title: "Ouverture de la conversation",
      description: `Redirection vers votre conversation avec ${profile.full_name}...`,
    });
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

  // États de chargement et d'erreur
  if (mainLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="pb-4">
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
              </div>
            </div>
          </div>
          
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

  if (mainError || !profile) {
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
                <Button onClick={handleSmartBack} variant="outline" className="w-full">
                  {returnTo === 'messages' ? 'Retour aux messages' : 'Retour'}
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
          {/* Navigation mobile - NOUVEAU: Bouton de retour intelligent */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSmartBack}
              className="p-2 flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              {returnTo === 'messages' && (
                <span className="text-sm hidden sm:inline">Messages</span>
              )}
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
       {/* Avatar cliquable pour affichage en grand */}
  <button
    onClick={() => profile.avatar_url && setShowAvatarModal(true)}
    className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-transform active:scale-95 ${
      profile.avatar_url ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
    }`}
    disabled={!profile.avatar_url}
    aria-label="Voir la photo de profil en grand"
  >
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
  </button>
  
  {/* Indicateur de présence en ligne */}
  {new Date().getTime() - new Date(profile.created_at).getTime() < 3600000 && (
    <div className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 rounded-full border-3 border-white pointer-events-none"></div>
  )}
  
  {/* Indicateur visuel que l'avatar est cliquable */}
  {profile.avatar_url && (
    <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )}
</div>
              
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 truncate">
                    {profile.full_name}
                  </h1>
                  
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(profile.average_rating, "h-4 w-4")}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {profile.average_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({profile.total_reviews} avis)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {profile.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Depuis {new Date(profile.created_at).getFullYear()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
                <div className="text-sm text-slate-700 leading-relaxed">
                  <p className={showFullBio ? "" : "line-clamp-3"}>
                    {profile.bio}
                  </p>
                  {profile.bio.length > 150 && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="text-blue-600 text-xs mt-2 flex items-center gap-1 hover:text-blue-700 transition-colors font-medium"
                    >
                      {showFullBio ? (
                        <>Voir moins <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Lire la suite <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques en grille mobile - DONNÉES CORRIGÉES */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {listings?.length || 0}
                </div>
                <p className="text-xs text-blue-700">Annonces</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {profile.average_rating ? profile.average_rating.toFixed(1) : '0.0'}
                </div>
                <p className="text-xs text-yellow-700">Note</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {reviews?.length || 0}
                </div>
                <p className="text-xs text-green-700">Avis</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 py-4">
        {profile.total_reviews === 0 && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-sm">
              Vendeur nouveau sur FasoMarket. Privilégiez les rencontres en lieu public 
              et vérifiez les produits avant paiement.
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation par onglets */}
        <div className="sticky top-16 z-10 bg-slate-50 pb-2 mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="listings" className="text-sm">
                Annonces ({listings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-sm">
                Avis ({reviews?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Contenu des annonces avec SmartImage intégré */}
            <TabsContent value="listings" className="mt-4 space-y-3">
              {loading ? (
                <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg overflow-hidden border animate-pulse">
                      {/* Mobile skeleton */}
                      <div className="md:hidden flex">
                        <div className="w-32 aspect-square bg-slate-200"></div>
                        <div className="flex-1 p-3 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      {/* Desktop skeleton */}
                      <div className="hidden md:block">
                        <div className="aspect-square bg-slate-200"></div>
                        <div className="p-3 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 text-sm">
                    Impossible de charger les annonces: {error}
                  </AlertDescription>
                </Alert>
              ) : isEmpty ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Aucune annonce active</h3>
                      <p className="text-muted-foreground text-sm">
                        Ce vendeur n'a pas d'annonces actives pour le moment.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* AFFICHAGE MOBILE : Liste horizontale avec SmartImage */}
                  <div className="block md:hidden space-y-3">
                    {listings.map((listing) => {
                      const isFavorite = favorites.some(fav => fav.listing_id === listing.id);
                      
                      return (
                        <Link
                          key={listing.id}
                          to={`/listing/${listing.id}`}
                          className="group block bg-white border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                        >
                          <div className="flex">
                            {/* Image à gauche avec SmartImage - 35% de la largeur */}
                            <div className="relative w-32 flex-shrink-0">
                              <div className="relative aspect-square overflow-hidden">
                                <SmartImage
                                  src={listing.images && listing.images.length > 0 ? listing.images[0] : '/placeholder.svg'}
                                  alt={listing.title}
                                  context="thumbnail"
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  fallbackSrc="/placeholder.svg"
                                  showLoadingState={true}
                                />
                                
                                {/* Badge "Nouveau" */}
                                {isListingNew(listing.created_at) && (
                                  <div className="absolute top-1 left-1">
                                    <Badge className="bg-white/90 text-slate-700 text-xs" variant="secondary">
                                      Nouveau
                                    </Badge>
                                  </div>
                                )}
                                
                                {/* Bouton favori */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleFavoriteToggle(listing.id);
                                  }}
                                  disabled={favLoading}
                                  className="absolute top-1 right-1 w-7 h-7 bg-white/80 hover:bg-white text-muted-foreground hover:text-primary backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                                >
                                  {isFavorite ? (
                                    <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                                  ) : (
                                    <HeartOff className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Contenu à droite - 65% de la largeur SANS nom du vendeur */}
                            <div className="flex-1 p-3 flex flex-col justify-between min-h-32">
                              <div className="flex-1">
                                {/* Titre - 2 lignes max */}
                                <h3 className="font-semibold text-sm leading-tight text-slate-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                                  {listing.title}
                                </h3>
                                
                                {/* Prix - plus visible */}
                                <div className="text-lg font-bold text-primary mb-2">
                                  {formatPrice(listing.price, listing.currency || 'XOF')}
                                </div>

                                {/* Catégorie */}
                                {listing.category && (
                                  <Badge variant="secondary" className="text-xs mb-2">
                                    {listing.category}
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-1">
                                {/* Localisation et date */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    {listing.location && (
                                      <>
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{listing.location}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatRelativeTime(listing.created_at)}</span>
                                  </div>
                                </div>
                                
                                {/* Stats populaires */}
                                {listing.views_count > 0 && (
                                  <div className="flex items-center gap-3 pt-1">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Eye className="w-3 h-3" />
                                      <span>{formatViewsCount(listing.views_count)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* AFFICHAGE DESKTOP : Grid classique avec SmartImage */}
                  <div className="hidden md:grid md:grid-cols-2 gap-3">
                    {listings.map((listing) => {
                      const isFavorite = favorites.some(fav => fav.listing_id === listing.id);
                      
                      return (
                        <Link
                          key={listing.id}
                          to={`/listing/${listing.id}`}
                          className="group block bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="relative">
                            <div className="aspect-[4/3] overflow-hidden">
                              <SmartImage
                                src={listing.images && listing.images.length > 0 ? listing.images[0] : '/placeholder.svg'}
                                alt={listing.title}
                                context="card"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                fallbackSrc="/placeholder.svg"
                                showLoadingState={true}
                                lazy={true}
                              />
                            </div>
                            
                            {isListingNew(listing.created_at) && (
                              <Badge 
                                className="absolute top-3 left-3 text-xs bg-white/90 text-slate-700 backdrop-blur-sm"
                                variant="secondary"
                              >
                                Nouveau
                              </Badge>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleFavoriteToggle(listing.id);
                              }}
                              disabled={favLoading}
                              className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white text-muted-foreground hover:text-primary backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                            >
                              {isFavorite ? (
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              ) : (
                                <HeartOff className="w-4 h-4" />
                              )}
                            </button>
                            
                            {/* Stats de vues */}
                            {listing.views_count > 0 && (
                              <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-sm">
                                <Eye className="h-3 w-3" />
                                <span>{formatViewsCount(listing.views_count)}</span>
                              </div>
                            )}
                          </div>

                          {/* Contenu de la carte desktop */}
                          <div className="p-4">
                            <h3 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {listing.title}
                            </h3>
                            
                            {/* Prix et catégorie */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatPrice(listing.price, listing.currency || 'XOF')}
                              </div>
                              {listing.category && (
                                <Badge variant="secondary">{listing.category}</Badge>
                              )}
                            </div>

                            {/* Localisation et temps */}
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {listing.location && (
                                  <>
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{listing.location}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatRelativeTime(listing.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  
                  {hasResults && pagination.hasNextPage && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={nextPage}
                        variant="outline"
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Chargement...' : `Voir plus d'annonces (${pagination.total - listings.length} restantes)`}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Contenu des avis - VERSION MOBILE-FIRST avec avatars SmartImage */}
            <TabsContent value="reviews" className="mt-4 space-y-4">
              {reviewsLoading ? (
                <div className="space-y-3 md:space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white p-3 md:p-4 rounded-xl border animate-pulse">
                      <div className="flex items-center gap-2 md:gap-3 mb-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 bg-slate-200 rounded-full"></div>
                        <div className="flex-1 space-y-1 md:space-y-2">
                          <div className="h-3 md:h-4 bg-slate-200 rounded w-1/4"></div>
                          <div className="h-2 md:h-3 bg-slate-200 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <div className="h-2 md:h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-2 md:h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviewsError ? (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 text-sm">
                    Impossible de charger les avis: {reviewsError}
                  </AlertDescription>
                </Alert>
              ) : reviewsIsEmpty ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-6 pb-6 md:pt-8 md:pb-8 text-center space-y-3 md:space-y-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Aucun avis pour le moment</h3>
                      <p className="text-muted-foreground text-sm">
                        Ce vendeur n'a pas encore reçu d'avis de la part d'acheteurs.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Statistiques des avis */}
                  {reviewsStats && reviewsStats.totalReviews > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 md:p-4 rounded-xl border border-blue-100 mb-4">
                      <div className="text-center mb-3 md:mb-4">
                        <div className="text-xl md:text-2xl font-bold text-blue-600">
                          {reviewsStats.averageRating.toFixed(1)}
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {renderStars(reviewsStats.averageRating, "h-3 w-3 md:h-4 md:w-4")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {reviewsStats.totalReviews} avis
                        </p>
                      </div>
                      
                      {/* Distribution des notes */}
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviewsStats.ratingDistribution[rating as keyof typeof reviewsStats.ratingDistribution];
                          const percentage = reviewsStats.totalReviews > 0 ? (count / reviewsStats.totalReviews) * 100 : 0;
                          
                          return (
                            <div key={rating} className="flex items-center gap-2 text-xs">
                              <span className="w-6 md:w-8 text-xs">{rating} ★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5 md:h-2">
                                <div 
                                  className="bg-yellow-400 h-1.5 md:h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="w-6 md:w-8 text-right text-muted-foreground text-xs">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Liste des avis avec avatars SmartImage */}
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <Card key={review.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
                          {/* En-tête de l'avis */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                                <AvatarImage 
                                  src={review.reviewer_avatar} 
                                  alt={review.reviewer_name}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs md:text-sm">
                                  {review.reviewer_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm truncate">
                                    {review.reviewer_name}
                                  </h4>
                                  {review.is_verified_purchase && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                      <CheckCircle className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                                      Vérifié
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1 md:gap-2 mt-1">
                                  <div className="flex items-center gap-0.5 md:gap-1">
                                    {renderStars(review.rating, "h-2.5 w-2.5 md:h-3 md:w-3")}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(review.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Produit concerné */}
                          <div className="bg-slate-50 p-2 md:p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Produit :</p>
                            <p className="text-xs md:text-sm font-medium line-clamp-1">
                              {review.listing_title}
                            </p>
                          </div>

                          {/* Commentaire */}
                          {review.comment && review.comment.trim() !== '' && (
                            <div className="pt-1">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                "{review.comment}"
                              </p>
                            </div>
                          )}

                          {/* Réponse du vendeur avec avatar SmartImage */}
                          {review.response && (
                            <div className="bg-blue-50 border-l-4 border-blue-200 p-2 md:p-3 rounded-r-lg mt-2">
                              <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                                <Avatar className="h-4 w-4 md:h-6 md:w-6">
                                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                                    {profile.full_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-blue-700">
                                  Réponse du vendeur
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(review.response.created_at)}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-blue-800">
                                {review.response.message}
                              </p>
                            </div>
                          )}

                          {/* Actions sur l'avis */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              {review.helpful_votes > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span>👍</span>
                                  <span className="hidden md:inline">
                                    {review.helpful_votes} personnes trouvent cet avis utile
                                  </span>
                                  <span className="md:hidden">
                                    {review.helpful_votes} utile
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <button className="text-xs text-muted-foreground hover:text-slate-600 transition-colors">
                              Signaler
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Bouton "Voir plus d'avis" */}
                  {reviewsStats && reviews.length < reviewsStats.totalReviews && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate(`/seller/${sellerId}/reviews`);
                        }}
                        className="w-full"
                      >
                        Voir tous les avis ({reviewsStats.totalReviews})
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* STICKY BAR OPTIMISÉE */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 lg:hidden z-20 shadow-lg">
        <div className="flex gap-2">
          <Button 
            onClick={handleContact} 
            variant="outline"
            className="flex-1 h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Phone className="h-5 w-5 mr-2" />
            Contacter
          </Button>
          
          <Button 
            onClick={handleDirectMessage}
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Message
          </Button>
        </div>
      </div>

      {/* Padding pour la sticky bar */}
      <div className="h-20 lg:hidden"></div>

      {/* Modals */}
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
                  handleDirectMessage();
                }}
              >
                <Mail className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Message privé</div>
                  <div className="text-xs text-muted-foreground">Chat direct</div>
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
      {/* Modal de visualisation de l'avatar en grand */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="max-w-4xl w-[95vw] h-[95vh] sm:h-auto p-0 bg-black/95 border-0">
          <div className="relative w-full h-full flex flex-col">
            {/* Header avec nom et bouton de fermeture */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-white font-semibold text-lg">
                  {profile.full_name}
                </h3>
                {profile.is_verified && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAvatarModal(false)}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Image en grand format */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
              <div className="relative max-w-full max-h-full">
                {profile.avatar_url ? (
                  <SmartImage
                    src={profile.avatar_url}
                    alt={`Photo de profil de ${profile.full_name}`}
                    context="detail"
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                    fallbackSrc="/placeholder.svg"
                    showLoadingState={true}
                  />
                ) : (
                  <div className="w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-white text-8xl sm:text-9xl font-bold">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer avec informations supplémentaires (optionnel) */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
              <div className="flex items-center justify-center gap-4 text-white/80 text-sm">
                {profile.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis {new Date(profile.created_at).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};
      

export default SellerProfile;