// components/AvatarUploadModal.tsx - Modal complète avec système de crop
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useAuthContext } from "@/contexts/AuthContext";
import { Camera, Upload, Trash2, AlertTriangle } from "lucide-react";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, profile } = useAuthContext();
  const { uploadAvatar, deleteAvatar, validateImageFile, uploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour gérer le workflow de crop
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  
  // État pour la confirmation de suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Création du preview pour le crop
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setImageToCrop(imageDataUrl);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    const success = await uploadAvatar(croppedImage);
    
    if (success) {
      // Réinitialisation
      setImageToCrop(null);
      setShowCropModal(false);
      
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Fermer la modal principale
      onClose();
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteAvatar();
    if (success) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleCloseCropModal = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    
    // Reset input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Modal principale de sélection */}
      <Dialog open={isOpen && !showCropModal && !showDeleteConfirm} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo de profil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Aperçu de l'avatar actuel */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-muted">
                <AvatarImage 
                  src={profile?.avatar_url} 
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 
                   user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {profile?.avatar_url 
                    ? 'Photo de profil actuelle'
                    : 'Aucune photo de profil'}
                </p>
              </div>
            </div>

            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {profile?.avatar_url ? 'Changer la photo' : 'Ajouter une photo'}
              </Button>

              {profile?.avatar_url && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteClick}
                  className="w-full"
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer la photo
                </Button>
              )}
            </div>

            {/* Conseils */}
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
              <p className="font-medium">À savoir :</p>
              <p>• Formats acceptés: JPG, PNG, WebP</p>
              <p>• Taille maximale: 5MB</p>
              <p>• Vous pourrez ajuster votre photo avant l'upload</p>
              <p>• Format final: carré 400x400px</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Supprimer la photo de profil
            </DialogTitle>
            <DialogDescription className="pt-2">
              Êtes-vous sûr de vouloir supprimer votre photo de profil ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de crop */}
      {imageToCrop && (
        <AvatarCropModal
          isOpen={showCropModal}
          onClose={handleCloseCropModal}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          uploading={uploading}
        />
      )}
    </>
  );
};