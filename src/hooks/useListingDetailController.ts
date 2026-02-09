import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useGuestMessages } from "@/hooks/useGuestMessages";
import { useSellerActiveListings } from "@/hooks/useSellerListings";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useToast } from "@/hooks/use-toast";
import { useAutoRecordView } from "@/hooks/useListingViews";

interface GuestMessageData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const getInitialGuestMessage = (title: string): GuestMessageData => ({
  name: "",
  email: "",
  phone: "",
  message: `Bonjour, je suis intéressé(e) par votre annonce "${title}" sur FasoMarket. Pourriez-vous me donner plus d'informations ?`,
});

export const useListingDetailController = (listing: any) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();

  useAutoRecordView(listing.id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isGuestMessageModalOpen, setIsGuestMessageModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [guestMessageData, setGuestMessageData] = useState<GuestMessageData>(getInitialGuestMessage(listing.title));

  const { sendGuestMessage, loading: guestMessageLoading } = useGuestMessages();
  const { favorites, addToFavorites, removeFromFavorites, loading: favLoading } = useFavorites();

  const { profile: sellerProfile, loading: profileLoading } = useSellerProfile(listing.user_id);
  const { loading: listingsLoading, count: activeListingsCount } = useSellerActiveListings(listing.user_id, 6);

  const isFavorite = favorites.some((fav) => fav.listing_id === listing.id);

  const handleViewFullProfile = () => {
    if (!listing.user_id) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au profil du vendeur.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/seller-profile/${listing.user_id}`);
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour ajouter cette annonce à vos favoris.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(listing.id);
        toast({
          title: "Retiré des favoris",
          description: "L'annonce a été retirée de vos favoris.",
        });
      } else {
        await addToFavorites(listing.id);
        toast({
          title: "Ajouté aux favoris",
          description: "L'annonce a été ajoutée à vos favoris.",
        });
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris pour le moment.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: listing.title,
      text: `Découvrez cette annonce sur FasoMarket : ${listing.title}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        setIsShareModalOpen(true);
      }
      return;
    }

    setIsShareModalOpen(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien de l'annonce a été copié dans le presse-papiers.",
      });
      setIsShareModalOpen(false);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const handleShowPhoneNumber = async () => {
    setPhoneLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const phoneToShow = listing.contact_phone || listing.profiles?.phone;

      if (!phoneToShow) {
        toast({
          title: "Numéro non disponible",
          description: "Le vendeur n'a pas renseigné de numéro de téléphone.",
          variant: "destructive",
        });
        return;
      }

      setShowPhoneNumber(true);
      toast({
        title: "Numéro affiché",
        description: "Vous pouvez maintenant contacter le vendeur directement.",
        duration: 4000,
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'afficher le numéro pour le moment.",
        variant: "destructive",
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSendMessageClick = () => {
    if (user) {
      setIsChatModalOpen(true);
      return;
    }

    setIsGuestMessageModalOpen(true);
  };

  const handleSendGuestMessage = async () => {
    if (!guestMessageData.name || !guestMessageData.email || !guestMessageData.message) {
      toast({
        title: "Champs obligatoires manquants",
        description: "Veuillez remplir au minimum votre nom, email et message.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestMessageData.email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendGuestMessage(listing.id, listing.user_id, {
        name: guestMessageData.name,
        email: guestMessageData.email,
        phone: guestMessageData.phone || undefined,
        message: guestMessageData.message,
      });
      setGuestMessageData(getInitialGuestMessage(listing.title));
      setIsGuestMessageModalOpen(false);
    } catch (error) {
      console.error("Error in handleSendGuestMessage:", error);
    }
  };

  const handleImageNavigation = (direction: "prev" | "next") => {
    if (!listing.images || listing.images.length <= 1) return;

    setCurrentImageIndex((prev) => {
      if (direction === "next") {
        return prev === listing.images.length - 1 ? 0 : prev + 1;
      }
      return prev === 0 ? listing.images.length - 1 : prev - 1;
    });
  };

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("226") && cleanPhone.length === 11) {
      const number = cleanPhone.substring(3);
      return `+226 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)}`;
    }
    if (cleanPhone.length === 8) {
      return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 4)} ${cleanPhone.substring(4, 6)} ${cleanPhone.substring(6, 8)}`;
    }
    return phone;
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(listing.contact_phone || listing.profiles?.phone);
    toast({ title: "Numéro copié", description: "Le numéro a été copié" });
  };

  const handleCallPhone = () => {
    window.location.href = `tel:${listing.contact_phone || listing.profiles?.phone}`;
  };

  const handleOpenWhatsApp = () => {
    const whatsappNumber = (listing.contact_whatsapp || listing.contact_phone || listing.profiles?.phone).replace(/\D/g, "");
    const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur FasoMarket.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const displayListingsCount = (() => {
    if (profileLoading || listingsLoading) return "...";
    return (sellerProfile?.total_listings || activeListingsCount).toString();
  })();

  return {
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
  };
};
