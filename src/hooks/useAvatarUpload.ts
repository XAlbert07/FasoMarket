// hooks/useAvatarUpload.ts - Hook spécialisé pour les avatars
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

interface AvatarUploadResult {
  url: string;
  path: string;
}

export const useAvatarUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user, updateProfile } = useAuthContext();

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour modifier votre avatar",
        variant: "destructive"
      });
      return null;
    }

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image (JPG, PNG, WebP)",
        variant: "destructive"
      });
      return null;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast({
        title: "Fichier trop volumineux",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);

    try {
      // Compression et redimensionnement de l'avatar
      const processedFile = await processAvatarImage(file);
      
      // Nom de fichier unique pour éviter les conflits
      const fileExt = processedFile.type.split('/')[1];
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // Suppression de l'ancien avatar si existant
      await deleteOldAvatar(user.id);

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processedFile, {
          contentType: processedFile.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erreur upload:', uploadError);
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      // Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      // Mise à jour du profil utilisateur
      await updateProfile({ avatar_url: publicUrl });

      toast({
        title: "Avatar mis à jour",
        description: "Votre photo de profil a été mise à jour avec succès"
      });

      return publicUrl;

    } catch (error) {
      console.error('Erreur complète upload avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'avatar';
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async (): Promise<boolean> => {
    if (!user) return false;

    setUploading(true);

    try {
      // Suppression du fichier dans le storage
      await deleteOldAvatar(user.id);

      // Mise à jour du profil pour supprimer l'URL
      await updateProfile({ avatar_url: null });

      toast({
        title: "Avatar supprimé",
        description: "Votre photo de profil a été supprimée"
      });

      return true;
    } catch (error) {
      console.error('Erreur suppression avatar:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'avatar",
        variant: "destructive"
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    uploading
  };
};

// Fonction utilitaire pour traiter l'image d'avatar
const processAvatarImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas non supporté'));
      return;
    }

    img.onload = () => {
      // Dimensions optimales pour avatar (carré)
      const size = 400;
      canvas.width = size;
      canvas.height = size;

      // Calcul pour crop carré centré
      const { width: imgWidth, height: imgHeight } = img;
      const minDimension = Math.min(imgWidth, imgHeight);
      const cropX = (imgWidth - minDimension) / 2;
      const cropY = (imgHeight - minDimension) / 2;

      // Configuration optimisée pour avatars
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Dessin avec crop carré centré
      ctx.drawImage(
        img,
        cropX, cropY, minDimension, minDimension, // Source (crop carré)
        0, 0, size, size // Destination (redimensionnement)
      );

      // Conversion en blob avec qualité élevée pour les avatars
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`Avatar traité: ${imgWidth}x${imgHeight} → ${size}x${size} (${Math.round(blob.size/1024)}KB)`);
            resolve(blob);
          } else {
            reject(new Error('Échec traitement image'));
          }
        },
        'image/jpeg',
        0.9 // Qualité élevée pour les avatars
      );

      // Nettoyage
      img.remove();
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = URL.createObjectURL(file);
  });
};

// Fonction utilitaire pour supprimer l'ancien avatar
const deleteOldAvatar = async (userId: string) => {
  try {
    // Liste des fichiers existants pour cet utilisateur
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list('', {
        search: userId
      });

    if (listError || !files) return;

    // Suppression de tous les anciens avatars de l'utilisateur
    const oldFiles = files
      .filter(file => file.name.startsWith(userId))
      .map(file => file.name);

    if (oldFiles.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(oldFiles);

      if (deleteError) {
        console.warn('Erreur suppression ancien avatar:', deleteError);
      } else {
        console.log(`Supprimé ${oldFiles.length} ancien(s) avatar(s)`);
      }
    }
  } catch (error) {
    console.warn('Erreur lors de la suppression de l\'ancien avatar:', error);
    // Non critique, on continue
  }
};