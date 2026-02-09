import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedReportDialog } from "@/components/EnhancedReportDialog";
import {
  ChevronRight,
  CheckCircle,
  ExternalLink,
  Eye,
  Flag,
  Heart,
  HeartOff,
  MessageSquare,
  Share2,
  Shield,
  User,
} from "lucide-react";

interface DetailTopActionsProps {
  viewsCount?: number | null;
  isFavorite: boolean;
  favLoading: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}

export const DetailMobileTopActions = ({
  viewsCount,
  isFavorite,
  favLoading,
  onBack,
  onToggleFavorite,
  onShare,
}: DetailTopActionsProps) => {
  return (
    <div className="sticky top-16 z-40 mb-4 border-b border-border bg-background/95 py-3 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-1">
          Retour
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>{viewsCount || 0}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
            disabled={favLoading}
            className={isFavorite ? "text-red-500" : ""}
          >
            {isFavorite ? <Heart className="h-4 w-4 fill-current" /> : <HeartOff className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DetailDesktopTopActions = ({
  viewsCount,
  isFavorite,
  favLoading,
  onBack,
  onToggleFavorite,
  onShare,
}: DetailTopActionsProps) => {
  return (
    <div className="mb-6 hidden items-center justify-between rounded-lg border bg-card px-4 py-3 md:flex">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>{viewsCount || 0} vues</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFavorite}
          disabled={favLoading}
          className={isFavorite ? "border-red-200 text-red-600" : ""}
        >
          {isFavorite ? <Heart className="mr-1 h-4 w-4 fill-current" /> : <HeartOff className="mr-1 h-4 w-4" />}
          {favLoading ? "..." : isFavorite ? "Favoris" : "Ajouter"}
        </Button>

        <Button variant="outline" size="sm" onClick={onShare}>
          <Share2 className="mr-1 h-4 w-4" />
          Partager
        </Button>
      </div>
    </div>
  );
};

interface DetailDesktopSidebarProps {
  listing: any;
  user: any;
  sellerProfile: any;
  showPhoneNumber: boolean;
  phoneLoading: boolean;
  displayListingsCount: string;
  onShowPhoneNumber: () => void;
  onSendMessage: () => void;
  onViewProfile: () => void;
  onCopyPhone: () => void;
  onCallPhone: () => void;
  onOpenWhatsApp: () => void;
  formatPhoneNumber: (phone: string) => string;
}

export const DetailDesktopSidebar = ({
  listing,
  user,
  sellerProfile,
  showPhoneNumber,
  phoneLoading,
  displayListingsCount,
  onShowPhoneNumber,
  onSendMessage,
  onViewProfile,
  onCopyPhone,
  onCallPhone,
  onOpenWhatsApp,
  formatPhoneNumber,
}: DetailDesktopSidebarProps) => {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardContent className="space-y-5 p-6">
            <button
              type="button"
              onClick={onViewProfile}
              className="flex w-full items-center justify-between rounded-lg border border-border/70 p-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {sellerProfile?.avatar_url || listing.profiles?.avatar_url ? (
                    <img
                      src={sellerProfile?.avatar_url || listing.profiles.avatar_url}
                      alt={sellerProfile?.full_name || listing.profiles.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold leading-tight">
                    {sellerProfile?.full_name || listing.profiles?.full_name || "Vendeur"}
                  </p>
                  <p className="text-xs text-muted-foreground">{displayListingsCount} annonces actives</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {sellerProfile?.is_verified ? <Badge variant="outline">Vérifié</Badge> : null}

            <div className="space-y-2">
              <Button onClick={onSendMessage} className="h-12 w-full text-base" size="lg">
                <MessageSquare className="mr-2 h-4 w-4" />
                {user ? "Envoyer un message" : "Contacter le vendeur"}
              </Button>

              {(listing.contact_whatsapp || listing.contact_phone) && (
                <Button
                  onClick={onOpenWhatsApp}
                  variant="outline"
                  className="h-12 w-full text-base border-green-600/30 text-green-700 hover:bg-green-50"
                  size="lg"
                >
                  WhatsApp
                </Button>
              )}

              {!showPhoneNumber ? (
                <Button onClick={onShowPhoneNumber} disabled={phoneLoading} variant="outline" className="h-12 w-full text-base" size="lg">
                  {phoneLoading ? "Chargement..." : "Voir le numéro"}
                </Button>
              ) : (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="font-mono text-lg font-semibold text-foreground">
                    {formatPhoneNumber(listing.contact_phone || listing.profiles?.phone)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-9 flex-1" onClick={onCopyPhone}>
                      Copier
                    </Button>
                    <Button size="sm" className="h-9 flex-1" onClick={onCallPhone}>
                      Appeler
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/70 pt-4">
              <EnhancedReportDialog
                listingId={listing.id}
                listingTitle={listing.title}
                trigger={
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-red-600">
                    <Flag className="mr-2 h-4 w-4" />
                    Signaler cette annonce
                  </Button>
                }
              />
            </div>

            <div className="rounded-lg border border-amber-200/70 bg-amber-50/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Sécurité</p>
              <div className="space-y-1.5 text-xs text-amber-700">
                <p className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  Rencontrez-vous dans un lieu public.
                </p>
                <p className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  Vérifiez le produit avant paiement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
};

interface DetailMobileSellerCardProps {
  listing: any;
  sellerProfile: any;
  displayListingsCount: string;
}

export const DetailMobileSellerCard = ({
  listing,
  sellerProfile,
  displayListingsCount,
}: DetailMobileSellerCardProps) => {
  return (
    <div className="lg:hidden">
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Vendeur</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/seller-profile/${listing.user_id}`}>
                Voir profil
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted">
              {sellerProfile?.avatar_url || listing.profiles?.avatar_url ? (
                <img
                  src={sellerProfile?.avatar_url || listing.profiles.avatar_url}
                  alt={sellerProfile?.full_name || listing.profiles.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-medium">{sellerProfile?.full_name || listing.profiles?.full_name || "Vendeur"}</h4>
                {sellerProfile?.is_verified && <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{displayListingsCount} annonces</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface DetailMobileBottomBarProps {
  listing: any;
  showPhoneNumber: boolean;
  phoneLoading: boolean;
  onShowPhoneNumber: () => void;
  onSendMessage: () => void;
  onHidePhoneNumber: () => void;
  onCallPhone: () => void;
  onOpenWhatsApp: () => void;
  formatPhoneNumber: (phone: string) => string;
}

export const DetailMobileBottomBar = ({
  listing,
  showPhoneNumber,
  phoneLoading,
  onShowPhoneNumber,
  onSendMessage,
  onHidePhoneNumber,
  onCallPhone,
  onOpenWhatsApp,
  formatPhoneNumber,
}: DetailMobileBottomBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-4 lg:hidden">
      <div className="container mx-auto max-w-md">
        {!showPhoneNumber ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onShowPhoneNumber}
              disabled={phoneLoading || (!listing.contact_phone && !listing.profiles?.phone)}
              className="flex-1"
              size="lg"
            >
              {phoneLoading ? "Chargement..." : "Voir numéro"}
            </Button>

            <Button onClick={onSendMessage} variant="outline" className="flex-1" size="lg">
              Message
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={onHidePhoneNumber} className="text-muted-foreground hover:text-foreground">
                Retour aux options
              </Button>

              <Button variant="ghost" size="sm" onClick={onSendMessage} className="text-primary hover:text-primary/80">
                Envoyer un message
              </Button>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
              <p className="mb-1 text-sm text-muted-foreground">Numéro de téléphone</p>
              <p className="font-mono text-lg font-bold">{formatPhoneNumber(listing.contact_phone || listing.profiles?.phone)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={onCallPhone} className="flex-1" size="lg">
                Appeler
              </Button>

              <Button
                onClick={onOpenWhatsApp}
                variant="outline"
                className="flex-1 border-green-600 bg-green-600 text-white hover:bg-green-700"
                size="lg"
              >
                WhatsApp
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
