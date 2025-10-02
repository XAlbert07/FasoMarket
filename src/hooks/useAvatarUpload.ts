// hooks/useAvatarUpload.ts - Hook avec système de crop amélioré
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

export const useAvatarUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user, updateProfile } = useAuthContext();

  /**
   * Upload d'un avatar rogné (reçoit déjà un Blob traité)
   */
  const uploadAvatar = async (croppedBlob: Blob): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour modifier votre avatar",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);

    try {
      console.log('Upload de l\'avatar rogné en cours...');
      
      // Nom de fichier unique
      const fileName = `${user.id}_${Date.now()}.jpg`;

      // Suppression de l'ancien avatar
      await deleteOldAvatar(user.id);

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
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

      console.log('Avatar mis à jour avec succès:', publicUrl);

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

  /**
   * Suppression de l'avatar
   */
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

  /**
   * Validation d'un fichier image avant crop
   */
  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Validation du type
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'Veuillez sélectionner une image (JPG, PNG, WebP)'
      };
    }

    // Validation de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        error: "L'image ne doit pas dépasser 5MB"
      };
    }

    return { valid: true };
  };

  return {
    uploadAvatar,
    deleteAvatar,
    validateImageFile,
    uploading
  };
};

/**
 * Fonction utilitaire pour supprimer l'ancien avatar
 */
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