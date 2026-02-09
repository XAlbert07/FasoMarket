// components/SmartListingDetail.tsx - VERSION MOBILE-FIRST REFACTORISÉE

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useListing } from "@/hooks/useListings";
import { useListings as useSimilarListings } from "@/hooks/useListings";
import { useListingDetailController } from "@/hooks/useListingDetailController";
import {
  DetailDesktopSidebar,
  DetailMobileBottomBar,
  DetailMobileSellerCard,
  DetailMobileTopActions,
} from "@/components/listing-detail/DetailChrome";
import ListingHeroSection from "@/components/listing-detail/ListingHeroSection";
import {
  ListingGuestMessageModal,
  ListingImageViewerModal,
  ListingShareModal,
} from "@/components/listing-detail/DetailModals";
import SimilarListingsSection from "@/components/listing-detail/SimilarListingsSection";

import OwnerListingDetail from "@/components/OwnerListingDetail";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatModal } from "@/components/ChatModal";
import { AlertTriangle } from "lucide-react";

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

  const isOwner = Boolean(user && listing.user_id === user.id);
  const canViewAsPublic = listing.status === 'active';

  // Sécurité visibilité: une annonce suspendue/expirée/vendue ne doit pas rester visible publiquement.
  if (!isOwner && !canViewAsPublic) {
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
                  <h1 className="text-xl font-bold">Annonce indisponible</h1>
                  <p className="text-muted-foreground text-sm">
                    Cette annonce n'est plus visible sur la plateforme.
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
  const { listings: similarSource, loading: similarLoading, fetchListings: fetchSimilarListings } = useSimilarListings();
  const {
    user,
    sellerProfile,
    isFavorite,
    favLoading,
    guestMessageLoading,
    currentImageIndex,
    isChatModalOpen,
    isGuestMessageModalOpen,
    isShareModalOpen,
    isImageViewerOpen,
    showPhoneNumber,
    phoneLoading,
    guestMessageData,
    displayListingsCount,
    setCurrentImageIndex,
    setIsChatModalOpen,
    setIsGuestMessageModalOpen,
    setIsShareModalOpen,
    setIsImageViewerOpen,
    setShowPhoneNumber,
    setGuestMessageData,
    handleViewFullProfile,
    handleFavoriteToggle,
    handleShare,
    copyToClipboard,
    handleShowPhoneNumber,
    handleSendMessageClick,
    handleSendGuestMessage,
    handleImageNavigation,
    formatPhoneNumber,
    handleCopyPhone,
    handleCallPhone,
    handleOpenWhatsApp,
  } = useListingDetailController(listing);

  useEffect(() => {
    const loadSimilar = async () => {
      const categoryName = listing.categories?.name || listing.category;
      if (categoryName) {
        await fetchSimilarListings({ category: categoryName, sortBy: "date" });
        return;
      }
      if (listing.location) {
        await fetchSimilarListings({ location: listing.location, sortBy: "date" });
      }
    };

    loadSimilar();
  }, [listing.id, listing.categories?.name, listing.category, listing.location, fetchSimilarListings]);

  const similarListings = similarSource.filter((item) => item.id !== listing.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-6 max-w-7xl">
        
        <DetailMobileTopActions
          viewsCount={listing.views_count}
          isFavorite={isFavorite}
          favLoading={favLoading}
          onBack={() => navigate(-1)}
          onToggleFavorite={handleFavoriteToggle}
          onShare={handleShare}
        />

        <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-12">
          
          {/* Contenu principal de l'annonce */}
          <div className="space-y-4 md:space-y-6 xl:col-span-8">
            
            <ListingHeroSection
              listing={listing}
              currentImageIndex={currentImageIndex}
              onOpenImageViewer={() => setIsImageViewerOpen(true)}
              onImageNavigation={handleImageNavigation}
              onSelectImage={setCurrentImageIndex}
            />

          </div>

          <div className="xl:col-span-4">
            <DetailDesktopSidebar
              listing={listing}
              user={user}
              sellerProfile={sellerProfile}
              showPhoneNumber={showPhoneNumber}
              phoneLoading={phoneLoading}
              displayListingsCount={displayListingsCount}
              onShowPhoneNumber={handleShowPhoneNumber}
              onSendMessage={handleSendMessageClick}
              onViewProfile={handleViewFullProfile}
              onCopyPhone={handleCopyPhone}
              onCallPhone={handleCallPhone}
              onOpenWhatsApp={handleOpenWhatsApp}
              formatPhoneNumber={formatPhoneNumber}
            />
          </div>
        </div>

        <DetailMobileSellerCard
          listing={listing}
          sellerProfile={sellerProfile}
          displayListingsCount={displayListingsCount}
        />

        {/* Espace pour la barre flottante mobile */}
        <div className="h-20 lg:hidden" />

        <SimilarListingsSection listings={similarListings} loading={similarLoading} />
      </main>

      <DetailMobileBottomBar
        listing={listing}
        showPhoneNumber={showPhoneNumber}
        phoneLoading={phoneLoading}
        onShowPhoneNumber={handleShowPhoneNumber}
        onSendMessage={handleSendMessageClick}
        onHidePhoneNumber={() => setShowPhoneNumber(false)}
        onCallPhone={handleCallPhone}
        onOpenWhatsApp={handleOpenWhatsApp}
        formatPhoneNumber={formatPhoneNumber}
      />

      <ListingImageViewerModal
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
        listing={listing}
        currentImageIndex={currentImageIndex}
        onPrev={() => handleImageNavigation("prev")}
        onNext={() => handleImageNavigation("next")}
      />

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

      <ListingShareModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        listingTitle={listing.title}
        url={window.location.href}
        onCopy={copyToClipboard}
      />

      <ListingGuestMessageModal
        open={isGuestMessageModalOpen}
        onOpenChange={setIsGuestMessageModalOpen}
        data={guestMessageData}
        loading={guestMessageLoading}
        onChange={(field, value) => setGuestMessageData((prev) => ({ ...prev, [field]: value }))}
        onSubmit={handleSendGuestMessage}
      />

      <Footer />
    </div>
  );
};

export default SmartListingDetail;
