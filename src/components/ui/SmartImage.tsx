// components/ui/SmartImage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Types pour les variants d'images
interface ImageVariants {
  thumbnail?: string;
  medium?: string;
  large?: string;
  original?: string;
}

interface SmartImageProps {
  // Peut accepter soit une string (ancien format) soit des variants (nouveau format)
  src: string | ImageVariants;
  alt: string;
  className?: string;
  
  // Contexte d'utilisation pour choisir automatiquement la bonne taille
  context?: 'thumbnail' | 'card' | 'detail' | 'hero';
  
  // Options d'optimisation
  lazy?: boolean;
  quality?: 'low' | 'medium' | 'high';
  
  // Props HTML standards
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  
  // Style et comportement
  objectFit?: 'cover' | 'contain' | 'fill';
  showLoadingState?: boolean;
  fallbackSrc?: string;
  
  // Pour les images responsives
  sizes?: string;
}

// Configuration des tailles selon le contexte
const CONTEXT_CONFIG = {
  thumbnail: {
    preferredVariant: 'thumbnail',
    fallbackVariant: 'medium',
    loadingHeight: 'h-12 md:h-16',
    defaultObjectFit: 'cover'
  },
  card: {
    preferredVariant: 'medium', 
    fallbackVariant: 'thumbnail',
    loadingHeight: 'h-32 md:h-40',
    defaultObjectFit: 'cover'
  },
  detail: {
    preferredVariant: 'large',
    fallbackVariant: 'medium',
    loadingHeight: 'h-64 md:h-80',
    defaultObjectFit: 'cover'
  },
  hero: {
    preferredVariant: 'large',
    fallbackVariant: 'medium', 
    loadingHeight: 'h-48 md:h-64',
    defaultObjectFit: 'cover'
  }
};

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className,
  context = 'card',
  lazy = true,
  quality = 'medium',
  onClick,
  onLoad,
  onError,
  objectFit,
  showLoadingState = true,
  fallbackSrc = '/placeholder.svg',
  sizes
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Fonction pour déterminer l'URL optimale selon le contexte
  const getOptimalImageUrl = (): string => {
    // Si c'est une string simple (ancien format), la retourner directement
    if (typeof src === 'string') {
      return src;
    }
    
    // Si c'est un objet variants, choisir la meilleure taille
    const config = CONTEXT_CONFIG[context];
    const variants = src as ImageVariants;
    
    // Essayer d'abord la variante préférée
    if (variants[config.preferredVariant as keyof ImageVariants]) {
      return variants[config.preferredVariant as keyof ImageVariants]!;
    }
    
    // Puis la variante de fallback
    if (variants[config.fallbackVariant as keyof ImageVariants]) {
      return variants[config.fallbackVariant as keyof ImageVariants]!;
    }
    
    // En dernier recours, prendre n'importe quelle variante disponible
    const availableUrl = Object.values(variants).find(url => url);
    return availableUrl || fallbackSrc;
  };

  // Configuration de l'Intersection Observer pour le lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const currentRef = imgRef.current;
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        // Charger l'image quand elle est à 100px de devenir visible
        rootMargin: '100px 0px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(currentRef);

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [lazy, isInView]);

  // Gestionnaire de chargement avec optimisation
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Gestionnaire d'erreur avec fallback intelligent
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      onError?.();
      
      // Si c'est un objet variants et qu'on a une erreur, essayer une autre variante
      if (typeof src === 'object' && imgRef.current) {
        const variants = src as ImageVariants;
        const config = CONTEXT_CONFIG[context];
        
        // Si l'image préférée a échoué, essayer le fallback
        if (imgRef.current.src.includes(config.preferredVariant)) {
          const fallbackUrl = variants[config.fallbackVariant as keyof ImageVariants];
          if (fallbackUrl && fallbackUrl !== imgRef.current.src) {
            imgRef.current.src = fallbackUrl;
            return;
          }
        }
        
        // En dernier recours, utiliser le placeholder
        imgRef.current.src = fallbackSrc;
      }
    }
  };

  const config = CONTEXT_CONFIG[context];
  const imageUrl = getOptimalImageUrl();
  const shouldLoad = isInView && !hasError;

  // Classes CSS pour le loading state
  const loadingClasses = cn(
    config.loadingHeight,
    'bg-muted animate-pulse flex items-center justify-center',
    className
  );

  // Classes CSS pour l'image finale
  const imageClasses = cn(
    'transition-opacity duration-300',
    isLoaded ? 'opacity-100' : 'opacity-0',
    objectFit === 'cover' || (!objectFit && config.defaultObjectFit === 'cover') 
      ? 'object-cover' 
      : objectFit === 'contain' 
      ? 'object-contain'
      : objectFit === 'fill'
      ? 'object-fill'
      : 'object-cover',
    onClick ? 'cursor-pointer' : '',
    className
  );

  // Interface de surveillance de réseau pour ajuster la qualité
  const getAdaptiveImageUrl = (baseUrl: string): string => {
    // Vérifier la qualité de connexion si disponible
    const connection = (navigator as any).connection;
    if (connection && context !== 'thumbnail') {
      // Sur connexion 2G/slow-2g, privilégier les thumbnails même pour les cards
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        if (typeof src === 'object') {
          const variants = src as ImageVariants;
          return variants.thumbnail || variants.medium || baseUrl;
        }
      }
    }
    return baseUrl;
  };

  const finalImageUrl = getAdaptiveImageUrl(imageUrl);

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      onClick={onClick}
    >
      {/* État de chargement */}
      {showLoadingState && !isLoaded && shouldLoad && (
        <div className={loadingClasses}>
          <div className="text-muted-foreground text-sm">
            Chargement...
          </div>
        </div>
      )}
      
      {/* Placeholder avant lazy loading */}
      {!isInView && lazy && (
        <div className={loadingClasses}>
          <div className="text-muted-foreground text-xs opacity-50">
            📸
          </div>
        </div>
      )}

      {/* Image principale */}
      {shouldLoad && (
        <img
          src={finalImageUrl}
          alt={alt}
          className={imageClasses}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          sizes={sizes}
          // Attributs pour l'accessibilité et l'optimisation
          decoding="async"
        />
      )}
      
      {/* Overlay de chargement optionnel */}
      {shouldLoad && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Hook utilitaire pour convertir les anciennes URLs vers le nouveau format
export const useImageVariants = () => {
  const convertLegacyUrl = (url: string): ImageVariants => {
    // Si c'est déjà un format optimisé, essayer de déduire les variants
    if (url.includes('-thumbnail.webp') || url.includes('-medium.webp') || url.includes('-large.webp')) {
      const base = url.replace(/-(thumbnail|medium|large)\.webp$/, '');
      return {
        thumbnail: `${base}-thumbnail.webp`,
        medium: `${base}-medium.webp`,
        large: `${base}-large.webp`
      };
    }
    
    // Pour les anciennes URLs, utiliser comme medium
    return {
      medium: url
    };
  };

  const ensureImageVariants = (src: string | ImageVariants): ImageVariants => {
    if (typeof src === 'string') {
      return convertLegacyUrl(src);
    }
    return src;
  };

  return {
    convertLegacyUrl,
    ensureImageVariants
  };
};

export default SmartImage;