import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImages = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement des images",
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const path = url.split('/').pop();
      if (!path) return false;

      const { error } = await supabase.storage
        .from('listing-images')
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image:', error);
      return false;
    }
  };

  return {
    uploadImages,
    deleteImage,
    uploading
  };
};