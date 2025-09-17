// components/ListingDetail.tsx - VERSION MOBILE-FIRST REFACTORISÉE

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MapPin, Eye, Heart, Phone, Calendar, User, Share2, Flag, Star, MessageCircle, 
  CheckCircle, ChevronLeft, ChevronRight, Copy, Send, Shield, Info, X, MoreVertical,
  Package, Clock, AlertTriangle, Crown, ExternalLink
} from "lucide-react";

// Import des hooks existants
import { useListing } from "@/hooks/useListings";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { useSellerBasicInfo } from '@/hooks/useSellerProfile';
import { formatPrice, formatRelativeTime, formatViewsCount } from "@/lib/utils";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Hooks pour les données principales
  const { listing, loading, error } = useListing(id!);
  const { toggleFavorite, isFavorite } = useFavorites();
  const {
    basicInfo: seller,
    loading: sellerLoading,
    error: sellerError
  } = useSellerBasicInfo(listing?.user_id || '');

  // États pour l'interface mobile
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGuestMessageOpen, setIsGuestMessageOpen] = useState(false);
  
  // État pour le formulaire de message invité
  const [guestMessage, setGuestMessage] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Bonjour, je suis intéressé(e) par votre annonce. Pouvez-vous me donner plus d'informations ?`
  });

  // Gestion du chargement - Version mobile optimisée
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
          {/* Skeleton mobile-first */}
          <div className="space-y-4">
            {/* Image principale skeleton */}
            <div className="aspect-square md:aspect-video bg-muted rounded-lg animate-pulse" />
            
            {/* Informations principales skeleton */}
            <div className="space-y-3">
              <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded w-20 animate-pulse" />
                <div className="h-6 bg-muted rounded w-24 animate-pulse" />
              </div>
            </div>
            
            {/* Contact buttons skeleton */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="h-12 bg-muted rounded-lg animate-pulse" />
              <div className="h-12 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion des erreurs avec retour simplifié
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold">Annonce introuvable</h1>
            <p className="text-muted-foreground text-sm">
              Cette annonce n'existe pas ou a été supprimée.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Retour
              </Button>
              <Button onClick={() => navigate('/listings')}>
                Voir les annonces
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Fonctions utilitaires pour les interactions
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

  const handleShare = async () => {
    const shareData = {
      title: listing.title,
      text: `Découvrez cette annonce sur FasoMarket`,
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien a été copié dans le presse-papiers"
      });
      setIsShareModalOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive"
      });
    }
  };

  const handleShowPhone = () => {
    setShowPhoneNumber(true);
    toast({
      title: "Numéro affiché",
      description: "Vous pouvez maintenant contacter le vendeur",
      duration: 3000
    });
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)}`;
    }
    return phone;
  };

  const phoneNumber = listing.contact_phone || seller?.phone;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        
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
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(listing.id)}
                className={isFavorite(listing.id) ? "text-red-500" : ""}
              >
                <Heart className={`w-4 h-4 ${isFavorite(listing.id) ? "fill-current" : ""}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast({ title: "Signalement enregistré", description: "Merci pour votre vigilance" })}
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* COLONNE PRINCIPALE - Contenu de l'annonce */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            
            {/* MOBILE: Gallery d'images optimisée tactile */}
            <div className="relative">
              {listing.images && listing.images.length > 0 ? (
                <div className="relative">
                  {/* Image principale avec gestes tactiles */}
                  <div 
                    className="relative aspect-square md:aspect-video overflow-hidden rounded-lg bg-muted cursor-pointer"
                    onClick={() => setIsImageViewerOpen(true)}
                  >
                    <img
                      src={listing.images[currentImageIndex] || '/placeholder.svg'}
                      alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
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
                          aria-label="Image précédente"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageNavigation('next');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                          aria-label="Image suivante"
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
                              aria-label={`Aller à l'image ${index + 1}`}
                            />
                          ))}
                        </div>
                        
                        {/* Compteur d'images */}
                        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          {currentImageIndex + 1} / {listing.images.length}
                        </div>
                      </>
                    )}
                    
                    {/* Badge "Voir en grand" */}
                    <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      Appuyer pour agrandir
                    </div>
                  </div>
                  
                  {/* Miniatures pour desktop */}
                  {listing.images.length > 1 && (
                    <div className="hidden md:flex gap-2 mt-3 overflow-x-auto">
                      {listing.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative flex-shrink-0 w-20 h-20 overflow-hidden rounded border-2 transition-all ${
                            index === currentImageIndex ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Miniature ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square md:aspect-video bg-muted flex items-center justify-center rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Aucune image disponible</p>
                  </div>
                </div>
              )}
            </div>

            {/* MOBILE: Informations principales compactes */}
            <Card>
              <CardContent className="p-4 md:p-6">
                {/* Titre et prix - Hiérarchie mobile */}
                <div className="space-y-3 mb-4">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                    {listing.title}
                  </h1>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl md:text-3xl font-bold text-primary">
                      {formatPrice(listing.price, listing.currency)}
                    </div>
                    
                    {listing.featured && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hidden md:inline-flex">
                        <Crown className="h-3 w-3 mr-1" />
                        En vedette
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Badges et informations - Layout mobile optimisé */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {listing.categories?.name || listing.category || 'Non catégorisé'}
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
                  
                  {listing.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 md:hidden">
                      <Crown className="h-3 w-3 mr-1" />
                      En vedette
                    </Badge>
                  )}
                </div>

                {/* Métadonnées - Affichage mobile condensé */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{listing.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatRelativeTime(listing.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{formatViewsCount(listing.views_count || 0)}</span>
                  </div>
                </div>

                {/* Actions desktop uniquement */}
                <div className="hidden lg:flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(listing.id)}
                    className={isFavorite(listing.id) ? "text-red-500 border-red-200" : ""}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isFavorite(listing.id) ? "fill-current" : ""}`} />
                    {isFavorite(listing.id) ? "Retiré" : "Favoris"}
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    Partager
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Signalement enregistré" })}>
                    <Flag className="w-4 h-4 mr-1" />
                    Signaler
                  </Button>
                </div>

                {/* Description */}
                <Separator className="my-4" />
                <div>
                  <h3 className="font-semibold text-base md:text-lg mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Description
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {listing.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DESKTOP: Section vendeur intégrée */}
            <Card className="hidden lg:block">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">À propos du vendeur</h3>
                
                {sellerLoading ? (
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-muted rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
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
                        
                        {seller?.is_verified && (
                          <CheckCircle className="h-5 w-5 text-green-500" title="Vendeur vérifié" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Membre depuis</p>
                          <p className="font-medium">
                            {seller?.created_at ? (
                              new Date(seller.created_at).toLocaleDateString('fr-FR', {
                                month: 'long',
                                year: 'numeric'
                              })
                            ) : 'Récent'}
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
                            {seller?.response_rate ? `${seller.response_rate}%` : 'Nouveau'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">Note moyenne</p>
                          {seller?.average_rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{seller.average_rating}</span>
                            </div>
                          ) : (
                            <p className="font-medium text-muted-foreground">Nouveau</p>
                          )}
                        </div>
                      </div>

                      {seller?.bio && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {seller.bio}
                          </p>
                        </div>
                      )}

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

          {/* SIDEBAR DESKTOP / BOTTOM MOBILE - Contact et actions */}
          <div className="lg:space-y-6">
            
            {/* MOBILE: Barre d'actions flottante */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 lg:hidden">
              <div className="container mx-auto max-w-md">
                {!showPhoneNumber ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleShowPhone}
                      disabled={!phoneNumber}
                      className="flex-1"
                      size="lg"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Voir le numéro
                    </Button>
                    
                    <Button
                      onClick={() => setIsGuestMessageOpen(true)}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Numéro révélé */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Numéro de téléphone</p>
                      <p className="text-lg font-bold font-mono">
                        {formatPhoneDisplay(phoneNumber)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => window.location.href = `tel:${phoneNumber}`}
                        className="flex-1"
                        size="lg"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </Button>
                      
                      <Button
                        onClick={() => {
                          const message = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${listing.title}" sur FasoMarket.`);
                          window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
                        }}
                        variant="outline"
                        className="flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DESKTOP: Section contact traditionnelle */}
            <Card className="hidden lg:block">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contacter le vendeur
                </h3>
                
                <div className="space-y-4">
                  {!showPhoneNumber ? (
                    <Button
                      onClick={handleShowPhone}
                      disabled={!phoneNumber}
                      className="w-full"
                      size="lg"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {phoneNumber ? "Afficher le numéro" : "Numéro non disponible"}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                        <p className="text-sm text-green-700 mb-2 font-medium">Numéro de téléphone</p>
                        <p className="text-xl font-bold text-green-800 font-mono">
                          {formatPhoneDisplay(phoneNumber)}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
                            onClick={() => {
                              navigator.clipboard.writeText(phoneNumber);
                              toast({
                                title: "Numéro copié",
                                description: "Le numéro a été copié dans le presse-papiers"
                              });
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copier
                          </Button>
                          
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => window.location.href = `tel:${phoneNumber}`}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Appeler
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp si disponible */}
                  {(listing.contact_whatsapp || phoneNumber) && (
                    <Button
                      onClick={() => {
                        const whatsappNumber = (listing.contact_whatsapp || phoneNumber).replace(/\D/g, '');
                        const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur FasoMarket.`);
                        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                      }}
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contacter via WhatsApp
                    </Button>
                  )}

                  <Button
                    onClick={() => setIsGuestMessageOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Button>
                </div>

                {/* Informations sur la réactivité */}
                <Separator className="my-4" />
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      <strong>Temps de réponse :</strong>{" "}
                      {seller?.response_rate >= 90 
                        ? "Quelques heures" 
                        : seller?.response_rate >= 70 
                        ? "Moins de 24h" 
                        : "1-2 jours"
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span><strong>Disponibilité :</strong> 8h - 18h</span>
                  </div>
                  
                  {seller?.is_verified && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs font-medium">Vendeur vérifié</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* MOBILE: Section vendeur compacte */}
            <Card className="lg:hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Vendeur</h3>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/seller-profile/${seller?.id || listing.user_id}`}>
                      Voir profil
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={seller?.avatar_url}
                      alt={seller?.full_name || "Photo du vendeur"}
                    />
                    <AvatarFallback>
                      {seller?.full_name?.charAt(0) || listing.profiles?.full_name?.charAt(0) || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {seller?.full_name || listing.profiles?.full_name || 'Vendeur'}
                      </h4>
                      {seller?.is_verified && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{seller?.active_listings || '1'} annonces</span>
                      {seller?.average_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{seller.average_rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conseils de sécurité */}
            <Card className="border-amber-200 bg-amber-50/30 hidden lg:block">
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
                
                <Alert className="mt-4 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm text-blue-700">
                    <strong>Astuce :</strong> Consultez le profil du vendeur pour en savoir plus sur sa réputation.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Autres annonces du vendeur */}
            <Card className="hidden lg:block">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Autres annonces</h3>
                {seller?.active_listings && seller.active_listings > 1 ? (
                  <div className="text-sm text-muted-foreground mb-3">
                    Ce vendeur a {seller.active_listings - 1} autre{seller.active_listings > 2 ? 's' : ''} annonce{seller.active_listings > 2 ? 's' : ''}.
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground mb-3">
                    Première annonce de ce vendeur.
                  </div>
                )}
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/seller-profile/${seller?.id || listing.user_id}`}>
                    Voir toutes ses annonces
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Espace pour la barre flottante mobile */}
        <div className="h-20 lg:hidden" />
      </main>

      {/* MODAUX ET OVERLAYS */}
      
      {/* Visionneuse d'images plein écran */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Visionneuse d'images</DialogTitle>
          </DialogHeader>
          
          {listing.images && listing.images.length > 0 && (
            <div className="relative w-full h-full flex items-center justify-center bg-black/5 rounded-lg">
              <img
                src={listing.images[currentImageIndex]}
                alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
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
              <Button onClick={handleCopyLink} size="sm">
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

      {/* Modal de message invité */}
      <Dialog open={isGuestMessageOpen} onOpenChange={setIsGuestMessageOpen}>
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
                  value={guestMessage.name}
                  onChange={(e) => setGuestMessage(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Votre nom complet"
                />
              </div>
              
              <div>
                <Label htmlFor="guest-email">Email *</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestMessage.email}
                  onChange={(e) => setGuestMessage(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre@email.com"
                />
              </div>
              
              <div>
                <Label htmlFor="guest-phone">Téléphone</Label>
                <Input
                  id="guest-phone"
                  value={guestMessage.phone}
                  onChange={(e) => setGuestMessage(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+226 XX XX XX XX"
                />
              </div>
              
              <div>
                <Label htmlFor="guest-message">Message *</Label>
                <Textarea
                  id="guest-message"
                  value={guestMessage.message}
                  onChange={(e) => setGuestMessage(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsGuestMessageOpen(false)}
              >
                Annuler
              </Button>
              
              <Button
                onClick={() => {
                  // Ici vous intégrerez votre logique d'envoi de message
                  toast({
                    title: "Message envoyé",
                    description: "Le vendeur recevra votre message et vous contactera bientôt."
                  });
                  setIsGuestMessageOpen(false);
                  setGuestMessage({
                    name: '',
                    email: '',
                    phone: '',
                    message: `Bonjour, je suis intéressé(e) par votre annonce. Pouvez-vous me donner plus d'informations ?`
                  });
                }}
                disabled={!guestMessage.name || !guestMessage.email || !guestMessage.message}
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ListingDetail;