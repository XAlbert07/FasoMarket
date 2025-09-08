// components/SmartListingDetail.tsx
// Version mise à jour avec système de messagerie intégré et hook spécialisé pour les invités

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useListing } from "@/hooks/useListings";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useSellerActiveListings } from "@/hooks/useSellerListings";
import { useSellerReviewsStats } from "@/hooks/useSellerReviews";
// Import du nouveau hook pour les messages d'invités
import { useGuestMessages } from '@/hooks/useGuestMessages';
import ListingDetail from "@/pages/ListingDetail";
import OwnerListingDetail from "@/components/OwnerListingDetail";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EnhancedReviewForm, EnhancedReviewsDisplay } from "@/components/EnhancedReviewSystem";
import { ChatModal } from "@/components/ChatModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Star, Shield, MessageSquare, Phone, MapPin, Clock, Send } from "lucide-react";

const SmartListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const { listing, loading, error } = useListing(id!);
  const [viewMode, setViewMode] = useState<'buyer' | 'owner' | 'loading'>('loading');

  // Détermination du mode d'affichage selon l'utilisateur connecté
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

  // Affichage du loading
  if (loading || viewMode === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion des erreurs
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Annonce introuvable</h1>
              <p className="text-muted-foreground">
                Cette annonce n'existe pas ou n'est plus disponible.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Rendu conditionnel selon le mode
  if (viewMode === 'owner') {
    return <OwnerListingDetail />;
  }

  return <BuyerListingDetailWithEnhancedReviewsAndChat listing={listing} />;
};

// Composant spécialisé pour la vue acheteur avec le nouveau système d'avis et de chat
interface BuyerListingDetailWithEnhancedReviewsAndChatProps {
  listing: any;
}

const BuyerListingDetailWithEnhancedReviewsAndChat = ({ listing }: BuyerListingDetailWithEnhancedReviewsAndChatProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);
  
  // États pour le système de messagerie
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isGuestMessageModalOpen, setIsGuestMessageModalOpen] = useState(false);
  const [guestMessageData, setGuestMessageData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  // Hook spécialisé pour les messages d'invités - remplace l'état sendingGuestMessage
  const { sendGuestMessage, loading: guestMessageLoading } = useGuestMessages();
  
  // Récupération des données du vendeur
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
  } = useSellerReviewsStats(listing.user_id);
  
  // États pour la gestion de l'affichage du numéro
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

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

  // Fonction pour gérer l'affichage du numéro de téléphone
  const handleShowPhoneNumber = async () => {
    setPhoneLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        description: "Vous pouvez maintenant contacter le vendeur.",
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

  // Gestion du clic sur "Envoyer un message"
  const handleSendMessageClick = () => {
    if (user) {
      // Utilisateur connecté : ouvrir le chat modal
      setIsChatModalOpen(true);
    } else {
      // Utilisateur non connecté : ouvrir le modal pour invités
      setIsGuestMessageModalOpen(true);
    }
  };

  // Fonction améliorée pour envoyer un message d'invité avec le nouveau hook
  const handleSendGuestMessage = async () => {
    // Validation des champs obligatoires
    if (!guestMessageData.name || !guestMessageData.email || !guestMessageData.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Utilisation du hook spécialisé pour les messages d'invités
      // Ce hook gère automatiquement l'insertion dans une table dédiée avec une structure optimisée
      await sendGuestMessage(listing.id, listing.user_id, {
        name: guestMessageData.name,
        email: guestMessageData.email,
        phone: guestMessageData.phone || undefined, // Conversion de chaîne vide en undefined
        message: guestMessageData.message
      });

      // Réinitialiser le formulaire et fermer le modal en cas de succès
      setGuestMessageData({ name: '', email: '', phone: '', message: '' });
      setIsGuestMessageModalOpen(false);

    } catch (error) {
      // Le hook useGuestMessages gère déjà l'affichage des erreurs via toast
      // On log l'erreur pour le debugging
      console.error('Error in handleSendGuestMessage:', error);
    }
  };

  // Fonction utilitaire pour formater le numéro de téléphone
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

  // Fonction pour calculer la note moyenne avec fallback
  const getDisplayRating = () => {
    if (reviewsStatsLoading) return "...";
    if (!reviewsStats || reviewsStats.totalReviews === 0) return "Nouveau";
    return `${reviewsStats.averageRating.toFixed(1)} ⭐`;
  };

  // Fonction pour obtenir le nombre d'annonces avec fallback
  const getDisplayListingsCount = () => {
    if (profileLoading || listingsLoading) return "...";
    if (sellerProfile) return sellerProfile.total_listings.toString();
    return activeListingsCount.toString();
  };

  // Fonction pour obtenir le badge de confiance du vendeur
  const getTrustBadge = () => {
    if (!reviewsStats || reviewsStats.totalReviews === 0) {
      return <Badge variant="secondary">Nouveau vendeur</Badge>;
    }

    if (reviewsStats.averageRating >= 4.5 && reviewsStats.totalReviews >= 10) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <Shield className="h-3 w-3 mr-1" />
          Vendeur de confiance
        </Badge>
      );
    }

    if (reviewsStats.averageRating >= 4.0) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
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
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal de l'annonce */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images de l'annonce */}
            <Card>
              <CardContent className="p-0">
                {listing.images && listing.images.length > 0 ? (
                  <div className="relative aspect-video">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {listing.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-2 py-1 rounded">
                        +{listing.images.length - 1} photos
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                    <p className="text-muted-foreground">Aucune image disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations de l'annonce */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h1 className="text-2xl lg:text-3xl font-bold">{listing.title}</h1>
                
                <div className="text-3xl font-bold text-primary">
                  {listing.price?.toLocaleString()} {listing.currency || 'XOF'}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {listing.categories?.name || 'Non catégorisé'}
                  </Badge>
                  <Badge variant="outline">
                    {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {listing.location}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Avis existants sur le vendeur - Version améliorée */}
            <EnhancedReviewsDisplay 
              sellerId={listing.user_id} 
              compact={true} 
              key={reviewsRefreshKey}
            />

            {/* Formulaire d'avis amélioré */}
            <EnhancedReviewForm
              sellerId={listing.user_id}
              listingId={listing.id}
              listingTitle={listing.title}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>

          {/* Sidebar - Contact et informations vendeur */}
          <div className="space-y-6">
            {/* Section contact avec messagerie intégrée */}
            <Card data-contact-section>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contacter le vendeur
                </h3>
                
                <div className="space-y-3">
                  {!showPhoneNumber ? (
                    <button 
                      onClick={handleShowPhoneNumber}
                      disabled={phoneLoading}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      {phoneLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4" />
                          Afficher le numéro
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full p-3 bg-muted rounded border-2 border-primary/20">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Numéro de téléphone</p>
                        <p className="text-lg font-semibold text-primary">
                          {formatPhoneNumber(listing.contact_phone || listing.profiles?.phone)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {(listing.contact_whatsapp || listing.contact_phone) && (
                    <button 
                      onClick={() => {
                        const whatsappNumber = (listing.contact_whatsapp || listing.contact_phone).replace(/\D/g, '');
                        const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur FasoMarket.`);
                        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                      }}
                      className="w-full bg-green-600 text-white hover:bg-green-700 py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Contacter sur WhatsApp
                    </button>
                  )}
                  
                  {/* Bouton de messagerie intelligent */}
                  <button 
                    onClick={handleSendMessageClick}
                    className="w-full border border-input hover:bg-accent py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {user ? 'Envoyer un message' : 'Envoyer un message (invité)'}
                  </button>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span><strong>Temps de réponse :</strong> {
                      profileLoading ? "..." : 
                      sellerProfile?.response_rate >= 90 ? "Quelques heures" : 
                      sellerProfile?.response_rate >= 70 ? "Quelques heures à 1 jour" : 
                      "1-2 jours"
                    }</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span><strong>Disponibilité :</strong> 8h - 18h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations sur le vendeur avec données réelles et badges de confiance */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">À propos du vendeur</h3>
                
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
                      <span>Membre depuis {new Date(sellerProfile?.created_at || listing.created_at).getFullYear()}</span>
                      {sellerProfile?.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badge de confiance basé sur les avis */}
                <div className="mb-4">
                  {getTrustBadge()}
                </div>
                
                {/* Statistiques du vendeur */}
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
                
                {/* Statistiques détaillées des avis si disponibles */}
                {reviewsStats && reviewsStats.totalReviews > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total des avis :</span>
                      <span className="font-medium">{reviewsStats.totalReviews}</span>
                    </div>
                    {reviewsStats.verifiedPurchasesCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Achats vérifiés :</span>
                        <span className="font-medium text-green-600">{reviewsStats.verifiedPurchasesCount}</span>
                      </div>
                    )}
                    {reviewsStats.responseRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taux de réponse :</span>
                        <span className="font-medium">{reviewsStats.responseRate}%</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Bio du vendeur si disponible */}
                {sellerProfile?.bio && (
                  <div className="mt-4 p-3 bg-muted/30 rounded text-sm">
                    <p className="italic text-muted-foreground">"{sellerProfile.bio}"</p>
                  </div>
                )}
                
                {/* Bouton pour voir le profil complet */}
                <button 
                  onClick={handleViewFullProfile}
                  className="w-full mt-4 border border-input hover:bg-accent py-2 px-4 rounded text-sm transition-colors"
                >
                  Voir le profil complet
                </button>
              </CardContent>
            </Card>

            {/* Conseils de sécurité améliorés */}
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-amber-800">
                  <Shield className="h-5 w-5" />
                  Conseils de sécurité
                </h3>
                <ul className="text-sm space-y-2 text-amber-700">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Rencontrez toujours en lieu public et fréquenté</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Examinez minutieusement avant de payer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Ne payez jamais à l'avance sans voir l'article</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Laissez un avis honnête après votre achat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Signalez tout comportement suspect</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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

      {/* Modal de message pour invités avec intégration du nouveau hook */}
      <Dialog open={isGuestMessageModalOpen} onOpenChange={setIsGuestMessageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer un message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Vous n'êtes pas connecté. Laissez vos coordonnées pour que le vendeur puisse vous recontacter.
            </div>
            
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
                <Label htmlFor="guest-email">Adresse email *</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestMessageData.email}
                  onChange={(e) => setGuestMessageData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre@email.com"
                />
              </div>
              
              <div>
                <Label htmlFor="guest-phone">Téléphone (optionnel)</Label>
                <Input
                  id="guest-phone"
                  value={guestMessageData.phone}
                  onChange={(e) => setGuestMessageData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+226 XX XX XX XX"
                />
              </div>
              
              <div>
                <Label htmlFor="guest-message">Votre message *</Label>
                <Textarea
                  id="guest-message"
                  value={guestMessageData.message}
                  onChange={(e) => setGuestMessageData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder={`Bonjour, je suis intéressé(e) par votre annonce "${listing.title}". Pourriez-vous me donner plus d'informations ?`}
                  rows={4}
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
                    Envoyer le message
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