import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OptimizedImageDisplay } from "@/components/OptimizedImageDisplay";
import { Copy, Info, Send } from "lucide-react";

interface ListingImageViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: any;
  currentImageIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

export const ListingImageViewerModal = ({
  open,
  onOpenChange,
  listing,
  currentImageIndex,
  onPrev,
  onNext,
}: ListingImageViewerModalProps) => {
  const [isImageFading, setIsImageFading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsImageFading(true);
    const timeout = setTimeout(() => setIsImageFading(false), 180);
    return () => clearTimeout(timeout);
  }, [currentImageIndex, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-full max-w-4xl p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>Visionneuse d'images</DialogTitle>
        </DialogHeader>

        {listing.images && listing.images.length > 0 && (
          <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-black/5">
            <OptimizedImageDisplay
              key={currentImageIndex}
              src={listing.images[currentImageIndex]?.url || listing.images[currentImageIndex]}
              alt={`${listing.title} - Image ${currentImageIndex + 1}`}
              className={`max-h-full max-w-full object-contain transition-all duration-300 ${isImageFading ? "scale-[1.01] opacity-80" : "opacity-100"}`}
              aspectRatio="auto"
              quality="original"
              priority={true}
            />

            {listing.images.length > 1 && (
              <>
                <button
                  onClick={onPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white hover:bg-black/80"
                >
                  ‹
                </button>

                <button
                  onClick={onNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white hover:bg-black/80"
                >
                  ›
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
                  {currentImageIndex + 1} / {listing.images.length}
                </div>
              </>
            )}

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface ListingShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  url: string;
  onCopy: () => void;
}

export const ListingShareModal = ({
  open,
  onOpenChange,
  listingTitle,
  url,
  onCopy,
}: ListingShareModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager cette annonce</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input value={url} readOnly className="flex-1" />
            <Button onClick={onCopy} size="sm">
              <Copy className="mr-1 h-4 w-4" />
              Copier
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const text = encodeURIComponent(`Découvrez cette annonce sur FasoMarket : ${listingTitle}`);
                const encodedUrl = encodeURIComponent(url);
                window.open(`https://wa.me/?text=${text} ${encodedUrl}`, "_blank");
                onOpenChange(false);
              }}
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const text = encodeURIComponent(`Découvrez cette annonce : ${listingTitle}`);
                const encodedUrl = encodeURIComponent(url);
                window.open(`sms:?body=${text} ${encodedUrl}`, "_blank");
                onOpenChange(false);
              }}
            >
              SMS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface GuestMessageData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ListingGuestMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: GuestMessageData;
  loading: boolean;
  onChange: (field: keyof GuestMessageData, value: string) => void;
  onSubmit: () => void;
}

export const ListingGuestMessageModal = ({
  open,
  onOpenChange,
  data,
  loading,
  onChange,
  onSubmit,
}: ListingGuestMessageModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                value={data.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Votre nom complet"
              />
            </div>
            <div>
              <Label htmlFor="guest-email">Email *</Label>
              <Input
                id="guest-email"
                type="email"
                value={data.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <Label htmlFor="guest-phone">Téléphone</Label>
              <Input
                id="guest-phone"
                value={data.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="+226 XX XX XX XX"
              />
            </div>
            <div>
              <Label htmlFor="guest-message">Message *</Label>
              <Textarea
                id="guest-message"
                value={data.message}
                onChange={(e) => onChange("message", e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={onSubmit} disabled={loading || !data.name || !data.email || !data.message}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
