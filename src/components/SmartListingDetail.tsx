// components/SmartListingDetail.tsx
// Version corrigée avec navigation fonctionnelle et données réelles
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useListing } from "@/hooks/useListings";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useSellerActiveListings } from "@/hooks/useSellerListings";
import { useSellerReviewsStats } from "@/hooks/useSellerReviews";
import ListingDetail from "@/pages/ListingDetail";
import OwnerListingDetail from "@/components/OwnerListingDetail";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewForm, ReviewsDisplay, useCanUserReview } from "@/components/ReviewSystem";
import { useToast } from "@/hooks/use-toast";

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

  return <BuyerListingDetailWithReviews listing={listing} />;
};

// Composant spécialisé pour la vue acheteur avec gestion du numéro de téléphone ET DONNÉES RÉELLES
interface BuyerListingDetailWithReviewsProps {
  listing: any;
}

const BuyerListingDetailWithReviews = ({ listing }: BuyerListingDetailWithReviewsProps) => {
  const navigate = useNavigate();
  const { canReview, loading: reviewCheckLoading } = useCanUserReview(listing.user_id, listing.id);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);
  
  // CORRECTION 1 : Utilisation des hooks pour récupérer les VRAIES données du vendeur
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
  
  const { toast } = useToast();

  const handleReviewSubmitted = () => {
    setReviewsRefreshKey(prev => prev + 1);
  };

  // CORRECTION 2 : Fonction pour naviguer vers le profil complet du vendeur
  const handleViewFullProfile = () => {
    if (!listing.user_id) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au profil du vendeur.",
        variant: "destructive"
      });
      return;
    }

    // Navigation vers la page de profil vendeur - URL corrigée pour correspondre à App.tsx
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
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                    {listing.categories?.name || 'Non catégorisé'}
                  </span>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                    {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                  </span>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                    {listing.location}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Avis existants sur le vendeur */}
            <ReviewsDisplay sellerId={listing.user_id} compact={true} />

            {/* Formulaire d'avis */}
            {!reviewCheckLoading && (
              <ReviewForm
                sellerId={listing.user_id}
                listingId={listing.id}
                listingTitle={listing.title}
                onReviewSubmitted={handleReviewSubmitted}
                canReview={canReview}
              />
            )}
          </div>

          {/* Sidebar - Contact et informations vendeur */}
          <div className="space-y-6">
            {/* Section contact */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Contacter le vendeur</h3>
                
                <div className="space-y-3">
                  {!showPhoneNumber ? (
                    <button 
                      onClick={handleShowPhoneNumber}
                      disabled={phoneLoading}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 py-2 px-4 rounded transition-colors"
                    >
                      {phoneLoading ? "Chargement..." : "Afficher le numéro"}
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
                      className="w-full bg-green-600 text-white hover:bg-green-700 py-2 px-4 rounded transition-colors"
                    >
                      Contacter sur WhatsApp
                    </button>
                  )}
                  
                  <button className="w-full border border-input hover:bg-accent py-2 px-4 rounded">
                    Envoyer un message
                  </button>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <p><strong>Temps de réponse :</strong> {
                    profileLoading ? "..." : 
                    sellerProfile?.response_rate >= 90 ? "Quelques heures" : 
                    sellerProfile?.response_rate >= 70 ? "Quelques heures à 1 jour" : 
                    "1-2 jours"
                  }</p>
                  <p><strong>Disponibilité :</strong> 8h - 18h</p>
                </div>
              </CardContent>
            </Card>

            {/* CORRECTION MAJEURE : Informations sur le vendeur avec VRAIES données */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">À propos du vendeur</h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    {sellerProfile?.avatar_url || listing.profiles?.avatar_url ? (
                      <img 
                        src={sellerProfile?.avatar_url || listing.profiles.avatar_url} 
                        alt={sellerProfile?.full_name || listing.profiles.full_name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold">
                        {(sellerProfile?.full_name || listing.profiles?.full_name)?.charAt(0) || 'V'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {sellerProfile?.full_name || listing.profiles?.full_name || 'Vendeur'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Membre depuis {new Date(sellerProfile?.created_at || listing.created_at).getFullYear()}
                      </p>
                      {sellerProfile?.is_verified && (
                        <span className="text-blue-500 text-sm">✓ Vérifié</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* DONNÉES RÉELLES au lieu de valeurs codées en dur */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Annonces</p>
                    <p className="font-medium">{getDisplayListingsCount()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Note</p>
                    <p className="font-medium">{getDisplayRating()}</p>
                  </div>
                </div>
                
                {/* Affichage des statistiques supplémentaires si disponibles */}
                {reviewsStats && reviewsStats.totalReviews > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p>Basé sur {reviewsStats.totalReviews} avis</p>
                  </div>
                )}
                
                {/* Bio du vendeur si disponible */}
                {sellerProfile?.bio && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p className="italic">"{sellerProfile.bio}"</p>
                  </div>
                )}
                
                {/* CORRECTION : Bouton FONCTIONNEL pour voir le profil complet */}
                <button 
                  onClick={handleViewFullProfile}
                  className="w-full mt-4 border border-input hover:bg-accent py-2 px-4 rounded text-sm transition-colors"
                >
                  Voir le profil complet
                </button>
              </CardContent>
            </Card>

            {/* Conseils de sécurité */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Conseils de sécurité</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Rencontrez en lieu public</li>
                  <li>• Vérifiez avant de payer</li>
                  <li>• Ne payez jamais à l'avance</li>
                  <li>• Laissez un avis après achat</li>
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

export default SmartListingDetail;