// components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant ScrollToTop - Gère le défilement automatique vers le haut
 * 
 * Ce composant résout le problème classique des applications React Router
 * où la position de scroll n'est pas réinitialisée lors des changements de route.
 * 
 * Fonctionnalités :
 * - Défilement automatique vers le haut à chaque changement de route
 * - Défilement fluide et immédiat selon les préférences utilisateur
 * - Compatible avec toutes les routes de votre application
 */

interface ScrollToTopProps {
  /**
   * Défilement fluide ou instantané
   * @default 'instant' - Plus rapide et moins distrayant pour la navigation
   */
  behavior?: 'instant' | 'smooth';
  
  /**
   * Délai avant le défilement (en millisecondes)
   * Utile si vous avez des animations de transition entre pages
   * @default 0
   */
  delay?: number;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  behavior = 'instant',
  delay = 0 
}) => {
  // Hook pour détecter les changements de route
  const location = useLocation();

  useEffect(() => {
    // Fonction de défilement
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: behavior
      });
    };

    // Si un délai est spécifié, on attend avant de défiler
    if (delay > 0) {
      const timeoutId = setTimeout(scrollToTop, delay);
      // Nettoyage du timeout si le composant est démonté ou si la route change à nouveau
      return () => clearTimeout(timeoutId);
    } else {
      // Défilement immédiat
      scrollToTop();
    }
  }, [location.pathname, location.search, behavior, delay]);

  // Ce composant ne rend rien - il a seulement un effet de bord
  return null;
};

/**
 * Version avancée avec options de personnalisation
 * Utilise cette version si vous avez besoin de plus de contrôle
 */
interface ScrollToTopAdvancedProps extends ScrollToTopProps {
  /**
   * Routes où le défilement ne doit pas se déclencher
   * Utile pour des pages modales ou des sous-sections
   */
  excludeRoutes?: string[];
  
  /**
   * Fonction personnalisée pour déterminer si on doit défiler
   * Reçoit le pathname actuel et retourne true/false
   */
  shouldScroll?: (pathname: string) => boolean;
}

export const ScrollToTopAdvanced: React.FC<ScrollToTopAdvancedProps> = ({
  behavior = 'instant',
  delay = 0,
  excludeRoutes = [],
  shouldScroll
}) => {
  const location = useLocation();

  useEffect(() => {
    // Vérifications personnalisées
    if (excludeRoutes.includes(location.pathname)) {
      return; // Ne pas défiler pour cette route
    }

    if (shouldScroll && !shouldScroll(location.pathname)) {
      return; // La fonction personnalisée dit de ne pas défiler
    }

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: behavior
      });
    };

    if (delay > 0) {
      const timeoutId = setTimeout(scrollToTop, delay);
      return () => clearTimeout(timeoutId);
    } else {
      scrollToTop();
    }
  }, [location.pathname, location.search, behavior, delay, excludeRoutes, shouldScroll]);

  return null;
};

export default ScrollToTop;