// components/SmartListingDetail.tsx - VERSION MOBILE-FIRST REFACTORISÉE

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useListing } from "@/hooks/useListings";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useSellerActiveListings } from "@/hooks/useSellerListings";
import { useSellerReviews } from "@/hooks/useSellerReviews";

import { useGuestMessages } from '@/hooks/useGuestMessages';
import { useFavorites } from '@/hooks/useFavorites';

import OwnerListingDetail from "@/components/OwnerListingDetail";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EnhancedReportDialog } from "@/components/EnhancedReportDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EnhancedReviewForm, EnhancedReviewsDisplay } from "@/components/EnhancedReviewSystem";
import { ChatModal } from "@/components/ChatModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { formatPrice, formatRelativeTime, isListingNew, formatViewsCount } from "@/lib/utils"
import {
  Star, Shield, MessageSquare, Phone, MapPin, Clock, Send, Flag, Heart, HeartOff, Eye, Share2,
  MoreVertical, AlertTriangle, CheckCircle, Info, Package, Crown, User, ChevronLeft, ChevronRight,
  Copy, X, ExternalLink, Wifi, WifiOff
} from "lucide-react";
import { OptimizedImageDisplay } from "@/components/OptimizedImageDisplay";

const SmartListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // Vérification critique : si pas d'ID, retour immédiat avec interface mobile-optimisée
  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl font-bold">ID d'annonce manquant</h1>
                  <p className="text-muted-foreground text-sm">
                    Impossible d'identifier l'annonce à afficher.
                  </p>
                </div>
                <Button onClick={() => navigate('/listings')} className="w-full">
                  Voir toutes les annonces
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { listing, loading, error } = useListing(id);
  const [viewMode, setViewMode] = useState<'buyer' | 'owner' | 'loading'>('loading');

  // Détermination intelligente du mode d'affichage selon l'utilisateur connecté
  useEffect(() => {
    if (loading || !id) return;
    if (!user) {
      setViewMode('buyer');
      return;
    }
    if (!listing) {
      setViewMode('buyer');
      return;
    }
    if (listing.user_id === user.id) {
      setViewMode('owner');
    } else {
      setViewMode('buyer');
    }
  }, [user, listing, loading, id]);

  // Gestion de l'état de chargement avec interface mobile moderne
  if (loading || viewMode === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-6xl mx-auto">
            {/* MOBILE: Skeleton optimisé pour mobile */}
            <div className="animate-pulse space-y-4 md:space-y-8">
              {/* Skeleton navigation mobile */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg md:hidden">
                <div className="w-16 h-8 bg-muted-foreground/20 rounded"></div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                  {/* Image skeleton - format mobile first */}
                  <div className="aspect-square md:aspect-video bg-muted rounded-lg" />
                  
                  {/* Content skeleton */}
                  <div className="space-y-4">
                    <div className="h-6 md:h-8 bg-muted rounded w-3/4" />
                    <div className="h-8 md:h-10 bg-muted rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-20" />
                      <div className="h-6 bg-muted rounded w-16" />
                    </div>
                    <div className="h-20 md:h-32 bg-muted rounded" />
                  </div>
                </div>
                
                {/* Sidebar skeleton - caché sur mobile */}
                <div className="hidden lg:block space-y-6">
                  <div className="h-48 bg-muted rounded-lg" />
                  <div className="h-64 bg-muted rounded-lg" />
                </div>
              </div>
            </div>

            {/* MOBILE: Actions flottantes skeleton */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-4 lg:hidden">
              <div className="container mx-auto max-w-md">
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 bg-muted rounded-lg animate-pulse" />
                  <div className="h-12 bg-muted rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion d'erreur avec recommandations pour l'utilisateur - Mobile optimisée
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl font-bold">Annonce introuvable</h1>
                  <p className="text-muted-foreground text-sm">
                    Cette annonce n'existe pas, a été supprimée ou n'est plus disponible.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => window.history.back()} variant="outline" className="w-full">
                    Retour
                  </Button>
                  <Button onClick={() => navigate('/listings')} className="w-full">
                    Voir toutes les annonces
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Affichage conditionnel : vue propriétaire vs vue acheteur
  if (viewMode === 'owner') {
    return <OwnerListingDetail />;
  }

  return <BuyerListingDetailWithEnhancedFeatures listing={listing} />;
};

// Composant principal pour la vue acheteur avec toutes les fonctionnalités intégrées - MOBILE FIRST
interface BuyerListingDetailWithEnhancedFeaturesProps {
  listing: any;
}

const BuyerListingDetailWithEnhancedFeatures = ({ listing }: BuyerListingDetailWithEnhancedFeaturesProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // États pour le système de messagerie et interactions mobile-first
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isGuestMessageModalOpen, setIsGuestMessageModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [guestMessageData, setGuestMessageData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur FasoMarket. Pourriez-vous me donner plus d'informations ?`
  });

  // Hook pour les messages d'invités et favoris
  const { sendGuestMessage, loading: guestMessageLoading } = useGuestMessages();
  const { favorites, addToFavorites, removeFromFavorites, loading: favLoading } = useFavorites();

  // Récupération des données du vendeur avec gestion d'erreur
  const {
    profile: sellerProfile,
    loading: profileLoading,
    error: profileError
  } = useSellerProfile(listing.user_id);

  const {
    activeListings,
    loading: listingsLoading,
    count: activeListingsCount
  } = useSellerActiveListings(listing.user_id, 6);

  const {
    stats: reviewsStats,
    loading: reviewsStatsLoading
  } = useSellerReviews(listing.user_id);

  // Vérifier si l'annonce est dans les favoris
  const isFavorite = favorites.some(fav => fav.listing_id === listing.id);

  const handleReviewSubmitted = () => {
    setReviewsRefreshKey(prev => prev + 1);
  };

  // Navigation vers le profil complet du vendeur
  const handleViewFullProfile = () => {
    if (!listing.user_id) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au profil du vendeur.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/seller-profile/${listing.user_id}`);
  };

  // Gestion des favoris avec retour utilisateur optimisé mobile
  const handleFavoriteToggle = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour ajouter cette annonce à vos favoris.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(listing.id);
        toast({
          title: "Retiré des favoris",
          description: "L'annonce a été retirée de vos favoris."
        });
      } else {
        await addToFavorites(listing.id);
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

  // Fonction pour partager l'annonce avec API native mobile
  const handleShare = async () => {
    const shareData = {
      title: listing.title,
      text: `Découvrez cette annonce sur FasoMarket : ${listing.title}`,
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

  // Fonction pour copier le lien
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien de l'annonce a été copié dans le presse-papiers."
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

  // Fonction pour afficher le numéro de téléphone avec animation mobile
  const handleShowPhoneNumber = async () => {
    setPhoneLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const phoneToShow = listing.contact_phone || listing.profiles?.phone;
      
      if (!phoneToShow) {
        toast({
          title: "Numéro non disponible",
          description: "Le vendeur n'a pas renseigné de numéro de téléphone.",
          variant: "destructive"
        });
        return;
      }
      
      setShowPhoneNumber(true);
      toast({
        title: "Numéro affiché",
        description: "Vous pouvez maintenant contacter le vendeur directement.",
        duration: 4000
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'afficher le numéro pour le moment.",
        variant: "destructive"
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  // Gestion intelligente du clic sur "Envoyer un message"
  const handleSendMessageClick = () => {
    if (user) {
      setIsChatModalOpen(true);
    } else {
      setIsGuestMessageModalOpen(true);
    }
  };

  // Fonction améliorée pour envoyer un message d'invité
  const handleSendGuestMessage = async () => {
    if (!guestMessageData.name || !guestMessageData.email || !guestMessageData.message) {
      toast({
        title: "Champs obligatoires manquants",
        description: "Veuillez remplir au minimum votre nom, email et message.",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestMessageData.email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendGuestMessage(listing.id, listing.user_id, {
        name: guestMessageData.name,
        email: guestMessageData.email,
        phone: guestMessageData.phone || undefined,
        message: guestMessageData.message
      });
      setGuestMessageData({ 
        name: '', 
        email: '', 
        phone: '', 
        message: `Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur FasoMarket. Pourriez-vous me donner plus d'informations ?`
      });
      setIsGuestMessageModalOpen(false);
    } catch (error) {
      console.error('Error in handleSendGuestMessage:', error);
    }
  };

  // Navigation dans les images avec gestes tactiles
  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!listing.images || listing.images.length <= 1) return;
    
    setCurrentImageIndex(prev => {
      if (direction === 'next') {
        return prev === listing.images.length - 1 ? 0 : prev + 1;
      } else {
        return prev === 0 ? listing.images.length - 1 : prev - 1;
      }
    });
  };

  // Formatage intelligent du numéro de téléphone pour mobile
  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('226') && cleanPhone.length === 11) {
      const number = cleanPhone.substring(3);
      return `+226 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)}`;
    }
    if (cleanPhone.length === 8) {
      return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 4)} ${cleanPhone.substring(4, 6)} ${cleanPhone.substring(6, 8)}`;
    }
    return phone;
  };

  // Calculs de l'affichage avec fallbacks intelligents
  const getDisplayRating = () => {
    if (reviewsStatsLoading) return "...";
    if (!reviewsStats || reviewsStats.totalReviews === 0) return "Nouveau vendeur";
    return `${reviewsStats.averageRating.toFixed(1)} ⭐ (${reviewsStats.totalReviews})`;
  };

  const getDisplayListingsCount = () => {
    if (profileLoading || listingsLoading) return "...";
    return (sellerProfile?.total_listings || activeListingsCount).toString();
  };

  // Badge de confiance basé sur les performances du vendeur
  const getTrustBadge = () => {
    if (!reviewsStats || reviewsStats.totalReviews === 0) {
      return <Badge variant="secondary">Nouveau vendeur</Badge>;
    }
    
    if (reviewsStats.averageRating >= 4.5 && reviewsStats.totalReviews >= 10) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100">
          <Shield className="h-3 w-3 mr-1" />
          Vendeur de confiance
        </Badge>
      );
    }
    
    if (reviewsStats.averageRating >= 4.0 && reviewsStats.totalReviews >= 5) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100">
          <Star className="h-3 w-3 mr-1" />
          Bien noté
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-6 max-w-7xl">
        
        {/* MOBILE: Barre de navigation sticky */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3 mb-4 md:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </Button>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>{listing.views_count || 0}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavoriteToggle}
                disabled={favLoading}
                className={isFavorite ? "text-red-500" : ""}
              >
                {isFavorite ? (
                  <Heart className="w-4 h-4 fill-current" />
                ) : (
                  <HeartOff className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              
              <EnhancedReportDialog
                listingId={listing.id}
                listingTitle={listing.title}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Flag className="w-4 h-4" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        {/* DESKTOP: Barre d'actions rapides */}
        <div className="hidden md:flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              ← Retour
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{listing.views_count || 0} vues</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFavoriteToggle}
              disabled={favLoading}
              className={isFavorite ? "text-red-600 border-red-200" : ""}
            >
              {isFavorite ? (
                <Heart className="h-4 w-4 mr-1 fill-current" />
              ) : (
                <HeartOff className="h-4 w-4 mr-1" />
              )}
              {favLoading ? "..." : (isFavorite ? "Favoris" : "Ajouter")}
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
            
            <EnhancedReportDialog
              listingId={listing.id}
              listingTitle={listing.title}
              trigger={
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Flag className="h-4 w-4 mr-1" />
                  Signaler
                </Button>
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Contenu principal de l'annonce */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            
            {/* Galerie d'images mobile-first */}
            <Card>
              <CardContent className="p-0">
                {listing.images && listing.images.length > 0 ? (
                  <div className="relative">
                    <div 
                      className="relative aspect-square md:aspect-video overflow-hidden rounded-lg bg-muted cursor-pointer"
                      onClick={() => setIsImageViewerOpen(true)}
                    >
                      <OptimizedImageDisplay
                         src={listing.images[currentImageIndex]?.url || listing.images[currentImageIndex]}
                         alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                         className="transition-transform duration-300 hover:scale-105"
                         aspectRatio="auto"
                         quality="large"
                         enableZoom={true}
                         onZoomClick={() => setIsImageViewerOpen(true)}
                         priority={currentImageIndex === 0}
                         />
                      
                      {/* Navigation d'images pour mobile */}
                      {listing.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageNavigation('prev');
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageNavigation('next');
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          
                          {/* Indicateurs d'images */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                            {listing.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex(index);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                          
                          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            {currentImageIndex + 1} / {listing.images.length}
                          </div>
                        </>
                      )}
                      
                      <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        Appuyer pour agrandir
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square md:aspect-video bg-muted flex items-center justify-center rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Aucune image disponible</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations principales de l'annonce - Mobile first */}
            <Card>
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                    {listing.title}
                  </h1>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl md:text-3xl font-bold text-primary">
                      {formatPrice(listing.price, listing.currency)}
                    </div>
                    {listing.featured && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Crown className="h-3 w-3 mr-1" />
                        En vedette
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {listing.categories?.name || 'Non catégorisé'}
                    </Badge>
                    
                    <Badge
                      variant="outline"
                      className={`${
                        listing.condition === 'new'
                          ? 'border-green-300 text-green-700 bg-green-50'
                          : 'border-blue-300 text-blue-700 bg-blue-50'
                      }`}
                    >
                      {listing.condition === 'new' ? 'Neuf' :
                       listing.condition === 'refurbished' ? 'Reconditionné' : 'Occasion'}
                    </Badge>
                    
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.location}
                    </Badge>
                    
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(listing.created_at)}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3 md:space-y-4">
                  <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
                    <Info className="h-4 md:h-5 w-4 md:w-5" />
                    Description
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                      {listing.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Système d'avis - Desktop uniquement pour éviter l'encombrement mobile */}
            <div className="hidden lg:block space-y-6">
              <EnhancedReviewsDisplay
                sellerId={listing.user_id}
                compact={true}
                key={reviewsRefreshKey}
              />
              <EnhancedReviewForm
                sellerId={listing.user_id}
                listingId={listing.id}
                listingTitle={listing.title}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          </div>

          {/* Sidebar - Contact et informations vendeur */}
          <div className="hidden lg:block space-y-6">
            
            {/* Section contact principale */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contacter le vendeur
                </h3>
                
                <div className="space-y-4">
                  {!showPhoneNumber ? (
                    <Button
                      onClick={handleShowPhoneNumber}
                      disabled={phoneLoading}
                      className="w-full"
                      size="lg"
                    >
                      {phoneLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4 mr-2" />
                          Afficher le numéro
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-green-700 mb-2 font-medium">Numéro de téléphone</p>
                        <p className="text-xl font-bold text-green-800">
                          {formatPhoneNumber(listing.contact_phone || listing.profiles?.phone)}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
                            onClick={() => {
                              navigator.clipboard.writeText(listing.contact_phone || listing.profiles?.phone);
                              toast({ title: "Numéro copié", description: "Le numéro a été copié" });
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copier
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => window.location.href = `tel:${listing.contact_phone || listing.profiles?.phone}`}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Appeler
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(listing.contact_whatsapp || listing.contact_phone) && (
                    <Button
                      onClick={() => {
                        const whatsappNumber = (listing.contact_whatsapp || listing.contact_phone).replace(/\D/g, '');
                        const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur FasoMarket.`);
                        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                      }}
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                      size="lg"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}

                  <Button
                    onClick={handleSendMessageClick}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {user ? 'Message privé' : 'Envoyer un message'}
                  </Button>
                </div>

                <div className="mt-6 pt-4 border-t space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      <strong>Temps de réponse :</strong>{" "}
                      {profileLoading ? "..." :
                       sellerProfile?.response_rate >= 90 ? "Quelques heures" :
                       sellerProfile?.response_rate >= 70 ? "Moins de 24h" :
                       "1-2 jours"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span><strong>Généralement en ligne :</strong> 9h - 18h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profil du vendeur avec signalement intégré */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">À propos du vendeur</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Options du profil</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleViewFullProfile}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Voir le profil complet
                        </Button>
                        <EnhancedReportDialog
                          profileId={listing.user_id}
                          profileName={sellerProfile?.full_name || listing.profiles?.full_name}
                          trigger={
                            <Button
                              variant="outline"
                              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Signaler ce profil
                            </Button>
                          }
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {sellerProfile?.avatar_url || listing.profiles?.avatar_url ? (
                      <img
                        src={sellerProfile?.avatar_url || listing.profiles.avatar_url}
                        alt={sellerProfile?.full_name || listing.profiles.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">
                        {(sellerProfile?.full_name || listing.profiles?.full_name)?.charAt(0) || 'V'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {sellerProfile?.full_name || listing.profiles?.full_name || 'Vendeur'}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Membre depuis {new Date(sellerProfile?.created_at || listing.created_at).getFullYear()}
                      </span>
                      {sellerProfile?.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {getTrustBadge() && (
                  <div className="mb-4">
                    {getTrustBadge()}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <p className="text-muted-foreground">Annonces</p>
                    <p className="font-semibold text-lg">{getDisplayListingsCount()}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <p className="text-muted-foreground">Évaluation</p>
                    <p className="font-semibold text-lg">{getDisplayRating()}</p>
                  </div>
                </div>

                {sellerProfile?.bio && (
                  <div className="mb-4 p-3 bg-muted/30 rounded text-sm">
                    <p className="italic text-muted-foreground">"{sellerProfile.bio}"</p>
                  </div>
                )}

                <Button
                  onClick={handleViewFullProfile}
                  variant="outline"
                  className="w-full"
                >
                  Voir le profil complet
                </Button>
              </CardContent>
            </Card>

            {/* Conseils de sécurité */}
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-amber-800">
                  <Shield className="h-5 w-5" />
                  Conseils de sécurité
                </h3>
                <ul className="text-sm space-y-2 text-amber-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Rencontrez dans un lieu public</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Vérifiez l'article avant de payer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Ne payez jamais à l'avance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Faites confiance à votre instinct</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Flag className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Signalez tout comportement suspect</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* MOBILE: Section vendeur compacte */}
          <div className="lg:hidden">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">Vendeur</h3>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/seller-profile/${listing.user_id}`}>
                      Voir profil
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {sellerProfile?.avatar_url || listing.profiles?.avatar_url ? (
                      <img
                        src={sellerProfile?.avatar_url || listing.profiles.avatar_url}
                        alt={sellerProfile?.full_name || listing.profiles.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">
                        {(sellerProfile?.full_name || listing.profiles?.full_name)?.charAt(0) || 'V'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {sellerProfile?.full_name || listing.profiles?.full_name || 'Vendeur'}
                      </h4>
                      {sellerProfile?.is_verified && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{getDisplayListingsCount()} annonces</span>
                      {reviewsStats && reviewsStats.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{reviewsStats.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {getTrustBadge() && (
                  <div className="mt-3">
                    {getTrustBadge()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* MOBILE: Avis système en bas de page */}
        <div className="lg:hidden mt-6 space-y-6">
          <EnhancedReviewsDisplay
            sellerId={listing.user_id}
            compact={true}
            key={reviewsRefreshKey}
          />
          <EnhancedReviewForm
            sellerId={listing.user_id}
            listingId={listing.id}
            listingTitle={listing.title}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>

        {/* Espace pour la barre flottante mobile */}
        <div className="h-20 lg:hidden" />
      </main>

      {/* MOBILE: Barre d'actions flottante - VERSION CORRIGÉE AVEC BOUTON RETOUR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 lg:hidden">
        <div className="container mx-auto max-w-md">
          {!showPhoneNumber ? (
            // État initial : Affichage des deux boutons principaux
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleShowPhoneNumber}
                disabled={phoneLoading || (!listing.contact_phone && !listing.profiles?.phone)}
                className="flex-1"
                size="lg"
              >
                {phoneLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Voir numéro
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSendMessageClick}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          ) : (
            // État après révélation du numéro : Avec option de retour
            <div className="space-y-3">
              {/* Bouton de fermeture/retour ajouté en haut */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPhoneNumber(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Retour aux options
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSendMessageClick}
                  className="text-primary hover:text-primary/80"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Envoyer un message
                </Button>
              </div>
              
              {/* Affichage du numéro */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground mb-1">Numéro de téléphone</p>
                <p className="text-lg font-bold font-mono">
                  {formatPhoneNumber(listing.contact_phone || listing.profiles?.phone)}
                </p>
              </div>
              
              {/* Actions sur le numéro */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => window.location.href = `tel:${listing.contact_phone || listing.profiles?.phone}`}
                  className="flex-1"
                  size="lg"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler
                </Button>
                
                <Button
                  onClick={() => {
                    const whatsappNumber = (listing.contact_whatsapp || listing.contact_phone || listing.profiles?.phone).replace(/\D/g, '');
                    const message = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${listing.title}" sur FasoMarket.`);
                    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                  }}
                  variant="outline"
                  className="flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAUX ET OVERLAYS */}
      
      {/* Visionneuse d'images plein écran */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Visionneuse d'images</DialogTitle>
          </DialogHeader>
          
          {listing.images && listing.images.length > 0 && (
            <div className="relative w-full h-full flex items-center justify-center bg-black/5 rounded-lg">
              <OptimizedImageDisplay
                 src={listing.images[currentImageIndex]?.url || listing.images[currentImageIndex]}
                 alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                 className="max-w-full max-h-full object-contain"
                 aspectRatio="auto"
                 quality="original"
                 priority={true}
                  />
              
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/80"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={() => handleImageNavigation('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/80"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                </>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/80"
                onClick={() => setIsImageViewerOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Modal pour utilisateurs connectés */}
      {user && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          listingId={listing.id}
          receiverId={listing.user_id}
          receiverName={sellerProfile?.full_name || listing.profiles?.full_name || 'Vendeur'}
          receiverAvatar={sellerProfile?.avatar_url || listing.profiles?.avatar_url}
          isVerified={sellerProfile?.is_verified || false}
        />
      )}

      {/* Modal de partage */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partager cette annonce</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={window.location.href}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyToClipboard} size="sm">
                <Copy className="w-4 h-4 mr-1" />
                Copier
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const text = encodeURIComponent(`Découvrez cette annonce sur FasoMarket : ${listing.title}`);
                  const url = encodeURIComponent(window.location.href);
                  window.open(`https://wa.me/?text=${text} ${url}`, '_blank');
                  setIsShareModalOpen(false);
                }}
              >
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const text = encodeURIComponent(`Découvrez cette annonce : ${listing.title}`);
                  const url = encodeURIComponent(window.location.href);
                  window.open(`sms:?body=${text} ${url}`, '_blank');
                  setIsShareModalOpen(false);
                }}
              >
                SMS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de message pour invités */}
      <Dialog open={isGuestMessageModalOpen} onOpenChange={setIsGuestMessageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contacter le vendeur</DialogTitle>
          </DialogHeader>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Laissez vos coordonnées pour que le vendeur puisse vous recontacter.
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="guest-name">Nom complet *</Label>
                <Input
                  id="guest-name"
                  value={guestMessageData.name}
                  onChange={(e) => setGuestMessageData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Votre nom complet"
                />
              </div>
              <div>
                <Label htmlFor="guest-email">Email *</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestMessageData.email}
                  onChange={(e) => setGuestMessageData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <Label htmlFor="guest-phone">Téléphone</Label>
                <Input
                  id="guest-phone"
                  value={guestMessageData.phone}
                  onChange={(e) => setGuestMessageData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+226 XX XX XX XX"
                />
              </div>
              <div>
                <Label htmlFor="guest-message">Message *</Label>
                <Textarea
                  id="guest-message"
                  value={guestMessageData.message}
                  onChange={(e) => setGuestMessageData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsGuestMessageModalOpen(false)}
                disabled={guestMessageLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSendGuestMessage}
                disabled={guestMessageLoading || !guestMessageData.name || !guestMessageData.email || !guestMessageData.message}
              >
                {guestMessageLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SmartListingDetail;