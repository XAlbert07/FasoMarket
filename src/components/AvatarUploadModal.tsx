// components/AvatarUploadModal.tsx - Modal dédiée à l'upload d'avatar
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useAuthContext } from "@/contexts/AuthContext";
import { Camera, Upload, Trash2, X } from "lucide-react";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, profile } = useAuthContext();
  const { uploadAvatar, deleteAvatar, uploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation immédiate
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Création du preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const success = await uploadAvatar(selectedFile);
    if (success) {
      resetModal();
      onClose();
    }
  };

  const handleDelete = async () => {
    const success = await deleteAvatar();
    if (success) {
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo de profil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aperçu de l'avatar actuel/nouveau */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-muted">
                <AvatarImage 
                  src={previewUrl || profile?.avatar_url} 
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 
                   user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {(previewUrl || profile?.avatar_url) && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => {
                    if (previewUrl) {
                      resetModal();
                    } else {
                      handleDelete();
                    }
                  }}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {selectedFile 
                  ? `Nouvelle photo sélectionnée: ${selectedFile.name}`
                  : profile?.avatar_url 
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
            {!selectedFile ? (
              <>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choisir une photo
                </Button>

                {profile?.avatar_url && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="w-full"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer la photo
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetModal}
                  className="flex-1"
                  disabled={uploading}
                >
                  Annuler
                </Button>
                
                <Button
                  onClick={handleUpload}
                  className="flex-1"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Conseils */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Formats acceptés: JPG, PNG, WebP</p>
            <p>• Taille maximale: 5MB</p>
            <p>• L'image sera automatiquement recadrée au format carré</p>
            <p>• Résolution recommandée: 400x400px minimum</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};