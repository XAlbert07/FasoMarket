// hooks/useOptimizedImageUpload.ts

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Types pour les différentes tailles d'images
interface ImageVariants {
  thumbnail: string;    // 150x150 pour les listes
  medium: string;       // 400x300 pour les aperçus
  large: string;        // 800x600 pour les détails
  original?: string;    // Image originale (optionnelle, pour zoom)
}

interface OptimizedUploadOptions {
  generateThumbnail?: boolean;
  generateMedium?: boolean;
  generateLarge?: boolean;
  keepOriginal?: boolean;
  quality?: number; // 0.1 à 1.0
}

export const useOptimizedImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const { toast } = useToast();

  // Fonction utilitaire pour redimensionner et compresser une image
  const compressImage = async (
    file: File, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number = 0.8
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions en conservant le ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Configurer le canvas
        canvas.width = width;
        canvas.height = height;

        // Améliorer la qualité du redimensionnement
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en blob avec compression
        canvas.toBlob(resolve, 'image/webp', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Générer plusieurs variants d'une image
  const generateImageVariants = async (
    file: File,
    options: OptimizedUploadOptions = {}
  ): Promise<{ [key: string]: Blob }> => {
    const variants: { [key: string]: Blob } = {};
    
    const {
      generateThumbnail = true,
      generateMedium = true,
      generateLarge = true,
      keepOriginal = false,
      quality = 0.8
    } = options;

    try {
      // Générer les différentes tailles selon les besoins
      if (generateThumbnail) {
        const thumbnail = await compressImage(file, 150, 150, 0.7);
        if (thumbnail) variants.thumbnail = thumbnail;
      }

      if (generateMedium) {
        const medium = await compressImage(file, 400, 300, quality);
        if (medium) variants.medium = medium;
      }

      if (generateLarge) {
        const large = await compressImage(file, 800, 600, quality);
        if (large) variants.large = large;
      }

      // Conserver l'original seulement si demandé (pour articles de luxe par exemple)
      if (keepOriginal) {
        variants.original = file;
      }

    } catch (error) {
      console.error('Erreur lors de la génération des variants:', error);
      // En cas d'erreur, au moins créer une version medium
      const fallback = await compressImage(file, 400, 300, 0.6);
      if (fallback) variants.medium = fallback;
    }

    return variants;
  };

  // Upload optimisé avec variants multiples
  const uploadOptimizedImages = async (
    files: File[],
    options?: OptimizedUploadOptions
  ): Promise<ImageVariants[]> => {
    setUploading(true);
    setCompressionProgress(0);
    
    const uploadedImageSets: ImageVariants[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Mise à jour du progrès
        const baseProgress = (i / files.length) * 100;
        setCompressionProgress(baseProgress);

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Format non supporté",
            description: `${file.name} n'est pas une image valide`,
            variant: "destructive"
          });
          continue;
        }

        // Vérifier la taille (limite à 10MB pour l'original)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Image trop lourde",
            description: `${file.name} dépasse 10MB`,
            variant: "destructive"
          });
          continue;
        }

        // Générer les variants optimisés
        setCompressionProgress(baseProgress + 20);
        const variants = await generateImageVariants(file, options);
        
        // Upload de chaque variant
        const imageSet: ImageVariants = {} as ImageVariants;
        const baseFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
        
        let variantIndex = 0;
        const variantKeys = Object.keys(variants);
        
        for (const [variantName, blob] of Object.entries(variants)) {
          const fileName = `${baseFileName}-${variantName}.webp`;
          
          // Mise à jour du progrès pour chaque variant
          const variantProgress = baseProgress + 20 + ((variantIndex / variantKeys.length) * 60);
          setCompressionProgress(variantProgress);
          
          const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(fileName, blob, {
              cacheControl: '31536000', // Cache 1 an pour les images optimisées
              upsert: false,
              contentType: variantName === 'original' ? file.type : 'image/webp'
            });

          if (error) {
            console.error(`Erreur upload ${variantName}:`, error);
            continue;
          }

          // Obtenir l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(data.path);

          imageSet[variantName as keyof ImageVariants] = publicUrl;
          variantIndex++;
        }
        
        // S'assurer qu'on a au moins une image medium
        if (!imageSet.medium && imageSet.large) {
          imageSet.medium = imageSet.large;
        }
        if (!imageSet.thumbnail && imageSet.medium) {
          imageSet.thumbnail = imageSet.medium;
        }
        
        uploadedImageSets.push(imageSet);
        setCompressionProgress((i + 1) / files.length * 100);
      }

      // Toast de succès avec stats d'optimisation
      const originalSize = files.reduce((sum, file) => sum + file.size, 0);
      const estimatedOptimizedSize = originalSize * 0.15; // Estimation 85% de réduction
      
      toast({
        title: "Images optimisées avec succès",
        description: `${uploadedImageSets.length} image(s) uploadée(s). Économie estimée: ${Math.round((originalSize - estimatedOptimizedSize) / 1024 / 1024)}MB`,
        variant: "default"
      });

      return uploadedImageSets;

    } catch (error) {
      console.error('Erreur lors de l\'upload optimisé:', error);
      toast({
        title: "Erreur d'optimisation",
        description: "Erreur lors de l'optimisation des images",
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploading(false);
      setCompressionProgress(0);
    }
  };

  // Upload simple avec optimisation automatique (compatible avec l'ancien système)
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const imageSets = await uploadOptimizedImages(files, {
      generateThumbnail: true,
      generateMedium: true,
      generateLarge: false, // Pour économiser l'espace de stockage
      keepOriginal: false,
      quality: 0.75
    });
    
    // Retourner les URLs medium pour compatibilité
    return imageSets.map(set => set.medium || set.thumbnail || '');
  };

  // Fonction de nettoyage pour supprimer tous les variants
  const deleteImageVariants = async (imageVariants: ImageVariants): Promise<boolean> => {
    try {
      const pathsToDelete: string[] = [];
      
      // Extraire tous les chemins des variants
      Object.values(imageVariants).forEach(url => {
        if (url) {
          const path = url.split('/').pop();
          if (path) pathsToDelete.push(path);
        }
      });

      if (pathsToDelete.length === 0) return true;

      const { error } = await supabase.storage
        .from('listing-images')
        .remove(pathsToDelete);

      return !error;
    } catch (error) {
      console.error('Erreur lors de la suppression des variants:', error);
      return false;
    }
  };

  return {
    uploadImages, // Interface compatible
    uploadOptimizedImages, // Interface avancée
    deleteImageVariants,
    uploading,
    compressionProgress
  };
};