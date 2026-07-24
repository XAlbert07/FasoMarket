// components/SmartListingDetail.tsx - VERSION MOBILE-FIRST REFACTORISÉE

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useListing } from "@/hooks/useListings";
import { useListings as useSimilarListings } from "@/hooks/useListings";
import { useListingDetailController } from "@/hooks/useListingDetailController";
import {
  DetailDesktopSidebar,
  DetailDesktopTopActions,
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
        <main className="container mx-auto max-w-lg px-4 py-12">
          <div className="border border-border bg-surface px-6 py-10 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="mt-4 text-lg font-heading font-semibold">ID d&apos;annonce manquant</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Impossible d&apos;identifier l&apos;annonce à afficher.
            </p>
            <Button onClick={() => navigate('/listings')} className="mt-6">
              Voir les annonces
            </Button>
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

  if (loading || viewMode === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="animate-pulse space-y-4">
            <div className="hidden h-12 border border-border bg-muted/40 md:block" />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-4 xl:col-span-8">
                <div className="aspect-square rounded-md bg-muted md:aspect-[16/10]" />
                <div className="h-7 w-3/4 rounded bg-muted" />
                <div className="h-9 w-1/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-28 rounded bg-muted" />
              </div>
              <div className="hidden xl:col-span-4 xl:block">
                <div className="h-72 rounded-md border border-border bg-muted/40" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-lg px-4 py-12">
          <div className="border border-border bg-surface px-6 py-10 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="mt-4 text-lg font-heading font-semibold">Annonce introuvable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette annonce n&apos;existe pas, a été supprimée ou n&apos;est plus disponible.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={() => window.history.back()} variant="outline">
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

  const isOwner = Boolean(user && listing.user_id === user.id);
  const canViewAsPublic = listing.status === 'active';

  // Sécurité visibilité: une annonce suspendue/expirée/vendue ne doit pas rester visible publiquement.
  if (!isOwner && !canViewAsPublic) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-lg px-4 py-12">
          <div className="border border-border bg-surface px-6 py-10 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="mt-4 text-lg font-heading font-semibold">Annonce indisponible</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette annonce n&apos;est plus visible sur la plateforme.
            </p>
            <Button onClick={() => navigate('/listings')} className="mt-6">
              Voir les annonces
            </Button>
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

  const similarListings = similarSource.filter((item) => item.id !== listing.id).slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto max-w-7xl px-4 py-4 md:py-6">
        
        <DetailMobileTopActions
          viewsCount={listing.views_count}
          isFavorite={isFavorite}
          favLoading={favLoading}
          listingId={listing.id}
          listingTitle={listing.title}
          onBack={() => navigate(-1)}
          onToggleFavorite={handleFavoriteToggle}
          onShare={handleShare}
        />

        <DetailDesktopTopActions
          viewsCount={listing.views_count}
          isFavorite={isFavorite}
          favLoading={favLoading}
          listingId={listing.id}
          listingTitle={listing.title}
          onBack={() => navigate(-1)}
          onToggleFavorite={handleFavoriteToggle}
          onShare={handleShare}
        />

        <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-12">
          
          <div className="space-y-4 md:space-y-6 xl:col-span-8">
            
            <ListingHeroSection
              listing={listing}
              currentImageIndex={currentImageIndex}
              onOpenImageViewer={() => setIsImageViewerOpen(true)}
              onImageNavigation={handleImageNavigation}
              onSelectImage={setCurrentImageIndex}
              sellerProfile={sellerProfile}
              displayListingsCount={displayListingsCount}
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

        <div className="mt-6">
          <DetailMobileSellerCard
            listing={listing}
            sellerProfile={sellerProfile}
            displayListingsCount={displayListingsCount}
          />
        </div>

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
