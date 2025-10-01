// hooks/useOptimizedImageUpload.ts - VERSION AMÉLIORÉE QUALITÉ

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Types pour les différentes tailles d'images
interface ImageVariants {
  thumbnail: string;    // 200x200 pour les listes (amélioré)
  medium: string;       // 800x600 pour les aperçus (amélioré)
  large: string;        // 1600x1200 pour les détails (nouveau)
  original?: string;    // Image originale HD pour zoom
}

interface OptimizedUploadOptions {
  generateThumbnail?: boolean;
  generateMedium?: boolean;
  generateLarge?: boolean;
  keepOriginal?: boolean;
  quality?: number; // 0.1 à 1.0
  maxOriginalSize?: number; // Taille max en pixels pour l'original
}

export const useOptimizedImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const { toast } = useToast();

  // Fonction pour détecter si l'image contient beaucoup de détails
  const detectImageComplexity = async (file: File): Promise<'simple' | 'complex'> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      img.onload = () => {
        // Échantillonner une petite zone pour analyser
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        // Calculer la variance des couleurs (complexité)
        let variance = 0;
        const pixels = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          variance += Math.abs(data[i] - avg) + Math.abs(data[i + 1] - avg) + Math.abs(data[i + 2] - avg);
        }
        
        variance = variance / pixels;
        
        // Si variance > 30, l'image est complexe (beaucoup de détails)
        resolve(variance > 30 ? 'complex' : 'simple');
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Fonction utilitaire pour redimensionner et compresser une image AVEC QUALITÉ AMÉLIORÉE
  const compressImage = async (
    file: File, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number = 0.92, // QUALITÉ PAR DÉFAUT AUGMENTÉE
    format: 'webp' | 'jpeg' = 'webp'
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions en conservant le ratio
        let { width, height } = img;
        
        // Ne redimensionner que si l'image est plus grande que le max
        if (width <= maxWidth && height <= maxHeight) {
          // Image déjà assez petite, juste la recompresser légèrement
          canvas.width = width;
          canvas.height = height;
        } else {
          // Calculer les nouvelles dimensions
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
          canvas.width = width;
          canvas.height = height;
        }

        // AMÉLIORATION QUALITÉ : Utiliser les meilleurs paramètres de rendu
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Appliquer un léger anti-aliasing pour améliorer la netteté
        ctx.filter = 'contrast(1.02) brightness(1.01)';

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en blob avec compression optimisée
        const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Échec de la conversion en blob'));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => reject(new Error('Échec du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Générer plusieurs variants d'une image AVEC QUALITÉ OPTIMISÉE
  const generateImageVariants = async (
    file: File,
    options: OptimizedUploadOptions = {}
  ): Promise<{ [key: string]: Blob }> => {
    const variants: { [key: string]: Blob } = {};
    
    const {
      generateThumbnail = true,
      generateMedium = true,
      generateLarge = true,
      keepOriginal = true, // CHANGÉ : Garder l'original par défaut
      quality = 0.92, // QUALITÉ AUGMENTÉE
      maxOriginalSize = 2400 // Taille max pour l'original (2400px)
    } = options;

    try {
      // Détecter la complexité de l'image pour ajuster la qualité
      const complexity = await detectImageComplexity(file);
      const adjustedQuality = complexity === 'complex' ? Math.min(quality + 0.03, 0.95) : quality;

      // Générer les différentes tailles avec qualités adaptées
      if (generateThumbnail) {
        // Thumbnail : 200x200, qualité légèrement réduite pour économiser
        const thumbnail = await compressImage(file, 200, 200, 0.85, 'webp');
        if (thumbnail) variants.thumbnail = thumbnail;
      }

      if (generateMedium) {
        // Medium : 800x600, qualité élevée pour l'affichage principal
        const medium = await compressImage(file, 800, 600, adjustedQuality, 'webp');
        if (medium) variants.medium = medium;
      }

      if (generateLarge) {
        // Large : 1600x1200, très haute qualité pour les détails
        const large = await compressImage(file, 1600, 1200, Math.min(adjustedQuality + 0.02, 0.96), 'webp');
        if (large) variants.large = large;
      }

      // Conserver une version originale optimisée (limitée à 2400px pour éviter des fichiers trop lourds)
      if (keepOriginal) {
        const original = await compressImage(file, maxOriginalSize, maxOriginalSize, 0.94, 'webp');
        if (original) variants.original = original;
      }

    } catch (error) {
      console.error('Erreur lors de la génération des variants:', error);
      // En cas d'erreur, créer au moins une version medium de qualité
      const fallback = await compressImage(file, 800, 600, 0.88, 'webp');
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
        
        const baseProgress = (i / files.length) * 100;
        setCompressionProgress(baseProgress);

        if (!file.type.startsWith('image/')) {
          toast({
            title: "Format non supporté",
            description: `${file.name} n'est pas une image valide`,
            variant: "destructive"
          });
          continue;
        }

        if (file.size > 15 * 1024 * 1024) { // Limite augmentée à 15MB
          toast({
            title: "Image trop lourde",
            description: `${file.name} dépasse 15MB`,
            variant: "destructive"
          });
          continue;
        }

        setCompressionProgress(baseProgress + 20);
        const variants = await generateImageVariants(file, options);
        
        const imageSet: ImageVariants = {} as ImageVariants;
        const baseFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
        
        let variantIndex = 0;
        const variantKeys = Object.keys(variants);
        
        for (const [variantName, blob] of Object.entries(variants)) {
          const fileName = `${baseFileName}-${variantName}.webp`;
          
          const variantProgress = baseProgress + 20 + ((variantIndex / variantKeys.length) * 60);
          setCompressionProgress(variantProgress);
          
          const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(fileName, blob, {
              cacheControl: '31536000',
              upsert: false,
              contentType: 'image/webp'
            });

          if (error) {
            console.error(`Erreur upload ${variantName}:`, error);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(data.path);

          imageSet[variantName as keyof ImageVariants] = publicUrl;
          variantIndex++;
        }
        
        if (!imageSet.medium && imageSet.large) {
          imageSet.medium = imageSet.large;
        }
        if (!imageSet.thumbnail && imageSet.medium) {
          imageSet.thumbnail = imageSet.medium;
        }
        
        uploadedImageSets.push(imageSet);
        setCompressionProgress((i + 1) / files.length * 100);
      }

      const originalSize = files.reduce((sum, file) => sum + file.size, 0);
      const estimatedOptimizedSize = originalSize * 0.25; // Estimation avec meilleure qualité
      
      toast({
        title: "Images optimisées avec succès",
        description: `${uploadedImageSets.length} image(s) haute qualité uploadée(s). Économie: ${Math.round((originalSize - estimatedOptimizedSize) / 1024 / 1024)}MB`,
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
      generateLarge: true, // ACTIVÉ pour haute qualité
      keepOriginal: true, // ACTIVÉ pour zoom HD
      quality: 0.92 // QUALITÉ ÉLEVÉE
    });
    
    // Retourner les URLs large (haute qualité) pour l'affichage principal
    return imageSets.map(set => set.large || set.medium || set.thumbnail || '');
  };

  const deleteImageVariants = async (imageVariants: ImageVariants): Promise<boolean> => {
    try {
      const pathsToDelete: string[] = [];
      
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
    uploadImages,
    uploadOptimizedImages,
    deleteImageVariants,
    uploading,
    compressionProgress
  };
};