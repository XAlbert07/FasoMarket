// src/hooks/useSmartPreload.ts
// Système de preloading intelligent adapté aux patterns d'usage de FasoMarket

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PreloadConfig {
  delay?: number;
  priority?: 'high' | 'medium' | 'low';
  condition?: () => boolean; // Condition personnalisée pour déclencher le preload
  maxConcurrent?: number; // Limite de preloads simultanés
}

interface RoutePreloadStrategy {
  route: string;
  importFn: () => Promise<any>;
  config: PreloadConfig;
}

// Mapping intelligent des routes basé sur les parcours utilisateur de FasoMarket
const routeStrategies: Record<string, RoutePreloadStrategy[]> = {
  // Depuis la page d'accueil - Priorité sur les actions principales
  '/': [
    {
      route: '/listings',
      importFn: () => import('../pages/Listings'),
      config: { delay: 3000, priority: 'high' } // Action principale après l'accueil
    },
    {
      route: '/login',
      importFn: () => import('../pages/Login'),
      config: { 
        delay: 8000, 
        priority: 'medium',
        condition: () => !localStorage.getItem('supabase.auth.token') // Seulement si non connecté
      }
    },
    {
      route: '/publish',
      importFn: () => import('../pages/PublishListing'),
      config: { delay: 15000, priority: 'low' } // Pour les utilisateurs qui explorent longtemps
    }
  ],

  // Depuis la page des annonces - Focus sur l'engagement et la conversion
  '/listings': [
    {
      route: '/listing',
      importFn: () => import('../components/SmartListingDetail'),
      config: { delay: 2000, priority: 'high' } // Très probable qu'ils cliquent sur une annonce
    },
    {
      route: '/publish',
      importFn: () => import('../pages/PublishListing'),
      config: { 
        delay: 10000, 
        priority: 'medium',
        condition: () => {
          // Preload si l'utilisateur a visité plusieurs annonces (stocké en sessionStorage)
          const visitedListings = JSON.parse(sessionStorage.getItem('visitedListings') || '[]');
          return visitedListings.length >= 2;
        }
      }
    },
    {
      route: '/favorites',
      importFn: () => import('../pages/Favorites'),
      config: { 
        delay: 20000, 
        priority: 'low',
        condition: () => !!localStorage.getItem('supabase.auth.token') // Seulement si connecté
      }
    }
  ],

  // Depuis une annonce spécifique - Optimisation du parcours de découverte
  '/listing': [
    {
      route: '/listings',
      importFn: () => import('../pages/Listings'),
      config: { delay: 5000, priority: 'high' } // Retour vers les annonces
    },
    {
      route: '/seller-profile',
      importFn: () => import('../pages/SellerProfile'),
      config: { delay: 8000, priority: 'medium' } // Consultation du profil vendeur
    },
    {
      route: '/publish',
      importFn: () => import('../pages/PublishListing'),
      config: { delay: 15000, priority: 'low' } // Inspiration pour publier
    }
  ],

  // Pages utilisateur connecté - Optimisation de l'écosystème personnel
  '/my-listings': [
    {
      route: '/publish',
      importFn: () => import('../pages/PublishListing'),
      config: { delay: 3000, priority: 'high' } // Action naturelle après voir ses annonces
    },
    {
      route: '/my-profile',
      importFn: () => import('../pages/MyProfile'),
      config: { delay: 8000, priority: 'medium' }
    }
  ],

  '/my-profile': [
    {
      route: '/my-listings',
      importFn: () => import('../pages/MyListings'),
      config: { delay: 5000, priority: 'high' }
    },
    {
      route: '/messages',
      importFn: () => import('../pages/Messages'),
      config: { delay: 10000, priority: 'medium' }
    }
  ]
};

// Hook principal avec gestion intelligente du preloading
export const useSmartPreload = () => {
  const location = useLocation();
  const preloadedRoutes = useRef(new Set<string>());
  const activePreloads = useRef(0);
  const maxConcurrentPreloads = 2; // Limite pour éviter la surcharge réseau

  // Fonction pour tracker les annonces visitées
  const trackListingVisit = useCallback((listingId: string) => {
    const visited = JSON.parse(sessionStorage.getItem('visitedListings') || '[]');
    if (!visited.includes(listingId)) {
      visited.push(listingId);
      // Garder seulement les 10 dernières pour éviter le bloat
      const recent = visited.slice(-10);
      sessionStorage.setItem('visitedListings', JSON.stringify(recent));
    }
  }, []);

  // Fonction de preload avec gestion des priorités
  const preloadRoute = useCallback(async (strategy: RoutePreloadStrategy) => {
    const { route, importFn, config } = strategy;
    
    // Éviter les doublons
    if (preloadedRoutes.current.has(route)) {
      return;
    }

    // Respecter la limite de preloads simultanés
    if (activePreloads.current >= maxConcurrentPreloads) {
      return;
    }

    // Vérifier la condition personnalisée si elle existe
    if (config.condition && !config.condition()) {
      return;
    }

    // Marquer comme en cours de preload
    preloadedRoutes.current.add(route);
    activePreloads.current++;

    try {
      // Utiliser la priorité pour déterminer la méthode de preload
      if (config.priority === 'high') {
        // Preload immédiat pour les priorités élevées
        await importFn();
      } else {
        // Utiliser requestIdleCallback pour les priorités moyennes et basses
        const timeoutDuration = config.priority === 'medium' ? 2000 : 5000;
        
        if ('requestIdleCallback' in window) {
          requestIdleCallback(
            async () => {
              try {
                await importFn();
              } catch (error) {
                // Silent fail pour éviter les erreurs en console
                console.debug(`Preload failed for ${route}:`, error);
              }
            },
            { timeout: timeoutDuration }
          );
        } else {
          // Fallback pour les navigateurs sans support
          setTimeout(async () => {
            try {
              await importFn();
            } catch (error) {
              console.debug(`Preload failed for ${route}:`, error);
            }
          }, config.priority === 'medium' ? 500 : 1500);
        }
      }
    } catch (error) {
      console.debug(`Preload failed for ${route}:`, error);
    } finally {
      activePreloads.current--;
    }
  }, []);

  // Détection d'activité utilisateur pour optimiser le timing
  const setupActivityTracking = useCallback(() => {
    let lastActivity = Date.now();
    let inactivityTimer: NodeJS.Timeout;

    const updateActivity = () => {
      lastActivity = Date.now();
      clearTimeout(inactivityTimer);
      
      // Démarrer le timer d'inactivité
      inactivityTimer = setTimeout(() => {
        // Utilisateur inactif - bon moment pour précharger
        const currentPath = location.pathname;
        const strategies = routeStrategies[currentPath] || [];
        
        strategies.forEach((strategy) => {
          setTimeout(() => {
            preloadRoute(strategy);
          }, strategy.config.delay || 2000);
        });
      }, 1500); // 1.5 secondes d'inactivité
    };

    // Event listeners pour détecter l'activité
    const events = ['mousemove', 'keypress', 'scroll', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Nettoyage initial
    updateActivity();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [location.pathname, preloadRoute]);

  // Hook pour preload au hover (micro-interaction)
  const preloadOnHover = useCallback((targetRoute: string) => {
    return {
      onMouseEnter: () => {
        // Trouver la stratégie correspondante
        const allStrategies = Object.values(routeStrategies).flat();
        const strategy = allStrategies.find(s => s.route === targetRoute);
        
        if (strategy && !preloadedRoutes.current.has(targetRoute)) {
          // Preload immédiat au hover pour une navigation instantanée
          preloadRoute({
            ...strategy,
            config: { ...strategy.config, priority: 'high', delay: 0 }
          });
        }
      }
    };
  }, [preloadRoute]);

  // Effet principal
  useEffect(() => {
    const cleanup = setupActivityTracking();
    return cleanup;
  }, [setupActivityTracking]);

  return {
    trackListingVisit, // Fonction exposée pour tracker les visites d'annonces
    preloadOnHover,    // Fonction pour preload au hover
    preloadedCount: preloadedRoutes.current.size // Debug info
  };
};

// Hook spécialisé pour les liens avec preload
export const useLinkPreload = (targetRoute: string) => {
  const { preloadOnHover } = useSmartPreload();
  
  return {
    ...preloadOnHover(targetRoute),
    // Props additionnelles pour optimiser les liens
    onFocus: preloadOnHover(targetRoute).onMouseEnter, // Support clavier
    onTouchStart: preloadOnHover(targetRoute).onMouseEnter // Support mobile
  };
};