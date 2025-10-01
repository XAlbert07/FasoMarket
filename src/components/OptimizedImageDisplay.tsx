// components/OptimizedImageDisplay.tsx - CORRECTION pour variants

import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ZoomIn } from 'lucide-react';

interface OptimizedImageDisplayProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  quality?: 'thumbnail' | 'medium' | 'large' | 'original';
  enableZoom?: boolean;
  onZoomClick?: () => void;
  priority?: boolean;
}

export const OptimizedImageDisplay = ({
  src,
  alt,
  className = '',
  aspectRatio = 'auto',
  quality = 'large',
  enableZoom = false,
  onZoomClick,
  priority = false
}: OptimizedImageDisplayProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isInView, setIsInView] = useState(priority);
  const [fallbackAttempts, setFallbackAttempts] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Fonction améliorée pour détecter et construire les URLs de variants
  const getImageUrl = (url: string, requestedQuality: string): string => {
    if (!url) return '';

    // Vérifier si l'URL contient déjà un variant (-thumbnail, -medium, -large, -original)
    const hasVariant = /-(?:thumbnail|medium|large|original)\.webp$/i.test(url);

    if (!hasVariant) {
      // Image ancienne sans variants - retourner l'URL telle quelle
      return url;
    }

    // Image avec variants - remplacer le variant
    const qualityMap: Record<string, string> = {
      thumbnail: 'thumbnail',
      medium: 'medium',
      large: 'large',
      original: 'original'
    };

    const targetQuality = qualityMap[requestedQuality] || 'large';

    // Remplacer le variant existant par celui demandé
    return url.replace(
      /-(?:thumbnail|medium|large|original)\.webp$/i,
      `-${targetQuality}.webp`
    );
  };

  // Déterminer l'URL selon la qualité demandée
  useEffect(() => {
    if (!isInView) return;

    const url = getImageUrl(src, quality);
    setImageSrc(url);
    setFallbackAttempts(0);
  }, [src, quality, isInView]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    // Système de fallback intelligent
    if (fallbackAttempts >= 3) {
      // Après 3 tentatives, abandonner
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setFallbackAttempts(prev => prev + 1);

    // Essayer différentes qualités dans l'ordre décroissant
    const fallbackOrder = ['original', 'large', 'medium', 'thumbnail'];
    const currentIndex = fallbackOrder.indexOf(quality);
    
    if (currentIndex < fallbackOrder.length - 1) {
      // Essayer la qualité suivante
      const nextQuality = fallbackOrder[currentIndex + 1];
      const fallbackUrl = getImageUrl(src, nextQuality);
      setImageSrc(fallbackUrl);
    } else {
      // Dernière tentative : URL originale sans modification
      setImageSrc(src);
    }
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'aspect-auto'
  }[aspectRatio];

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${aspectRatioClass} ${className}`}
    >
      {isLoading && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-sm">Image indisponible</p>
        </div>
      )}

      {isInView && imageSrc && !hasError && (
        <>
          <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            } ${enableZoom ? 'cursor-zoom-in hover:scale-105' : ''}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              imageRendering: '-webkit-optimize-contrast',
            }}
          />

          {enableZoom && !isLoading && (
            <div 
              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onZoomClick?.();
              }}
            >
              <ZoomIn className="w-4 h-4" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const useProgressiveImage = (lowQualitySrc: string, highQualitySrc: string) => {
  const [src, setSrc] = useState(lowQualitySrc);

  useEffect(() => {
    const img = new Image();
    img.src = highQualitySrc;
    img.onload = () => {
      setSrc(highQualitySrc);
    };
  }, [highQualitySrc]);

  return src;
};