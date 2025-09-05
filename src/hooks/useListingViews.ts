// ===============================================
// HOOK USELISTINGVIEWS - GESTION CENTRALISÉE DES VUES
// ===============================================
// Ce hook centralise toute la logique de comptage et d'affichage des vues
// Il peut être utilisé dans n'importe quel composant qui a besoin de gérer les vues

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Interface pour typer les données de vues que nous retournons
 * Cela aide TypeScript à comprendre la structure de nos données
 */
interface ViewsData {
  count: number;           // Nombre total de vues
  isLoading: boolean;      // Indicateur de chargement
  error: string | null;    // Erreur éventuelle
}

/**
 * Interface pour les statistiques avancées (pour le dashboard)
 */
interface ViewsStats {
  totalViews: number;
  uniqueVisitors: number;
  registeredUserViews: number;
  anonymousViews: number;
  todayViews: number;
}

/**
 * Hook principal pour la gestion des vues
 * Ce hook est conçu pour être réutilisé partout où vous avez besoin de gérer les vues
 */
export const useListingViews = () => {
  // État pour stocker les données de vues en cache
  // Cela évite de refaire des requêtes inutiles
  const [viewsCache, setViewsCache] = useState<Map<string, ViewsData>>(new Map());
  
  // Référence pour éviter les appels multiples simultanés
  const recordingViews = useRef<Set<string>>(new Set());
  
  // Contexte d'authentification pour identifier l'utilisateur
  const { user } = useAuthContext();

  /**
   * FONCTION PRINCIPALE : ENREGISTRER UNE VUE
   * Cette fonction remplace l'ancienne recordView et peut être appelée depuis n'importe où
   */
  const recordView = useCallback(async (listingId: string): Promise<boolean> => {
    // Éviter les appels multiples simultanés pour la même annonce
    if (recordingViews.current.has(listingId)) {
      console.log(`⏳ Enregistrement de vue déjà en cours pour l'annonce ${listingId}`);
      return false;
    }

    recordingViews.current.add(listingId);

    try {
      // Génération de l'identifiant de visiteur
      // Cette logique unifie le traitement des utilisateurs connectés et anonymes
      const generateVisitorId = (): string => {
        if (user?.id) {
          return user.id; // Utilisateur connecté = UUID direct
        }
        
        // Visiteurs anonymes : création d'une empreinte digitale stable
        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          screen.width + 'x' + screen.height,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          // Empreinte canvas pour plus d'unicité
          (() => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillText('FasoMarket-BF-2024', 2, 2);
                return canvas.toDataURL().slice(-25);
              }
              return 'no-canvas';
            } catch {
              return 'canvas-blocked-' + Math.random().toString(36).substr(2, 8);
            }
          })()
        ].join('|');
        
        // Création d'un hash reproductible
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        
        return `visitor_${Math.abs(hash)}`;
      };

      const visitorId = generateVisitorId();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Vérification des vues récentes
      const { data: existingView, error: checkError } = await supabase
        .from('listing_views')
        .select('id')
        .eq('listing_id', listingId)
        .eq('visitor_id', visitorId)
        .gte('viewed_at', twentyFourHoursAgo.toISOString())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Enregistrement d'une nouvelle vue si nécessaire
      if (!existingView) {
        const { error: insertError } = await supabase
          .from('listing_views')
          .insert({
            listing_id: listingId,
            user_id: user?.id || null,
            visitor_id: visitorId,
            ip_address: null,
            user_agent: navigator.userAgent
          });

        if (insertError) throw insertError;

        // Incrémentation du compteur dans la table listings
        const { error: incrementError } = await supabase
          .rpc('increment_listing_views', { listing_id: listingId });

        if (incrementError) {
          console.warn('Impossible d\'incrémenter le compteur:', incrementError);
        }

        // Mise à jour du cache local pour un affichage immédiat
        setViewsCache(prev => {
          const newCache = new Map(prev);
          const existing = newCache.get(listingId);
          if (existing) {
            newCache.set(listingId, {
              ...existing,
              count: existing.count + 1
            });
          }
          return newCache;
        });

        console.log(`✅ Nouvelle vue enregistrée pour ${listingId} par ${user?.id ? 'utilisateur' : 'anonyme'}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la vue:', error);
      return false;
    } finally {
      recordingViews.current.delete(listingId);
    }
  }, [user?.id]);

  /**
   * FONCTION POUR RÉCUPÉRER LE NOMBRE DE VUES D'UNE ANNONCE
   * Cette fonction peut être utilisée dans les listes, cartes, etc.
   */
  const getViewsCount = useCallback(async (listingId: string): Promise<ViewsData> => {
    // Vérifier d'abord le cache
    const cached = viewsCache.get(listingId);
    if (cached && !cached.isLoading) {
      return cached;
    }

    // Mettre à jour le cache avec un état de chargement
    setViewsCache(prev => new Map(prev).set(listingId, {
      count: cached?.count || 0,
      isLoading: true,
      error: null
    }));

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('views_count')
        .eq('id', listingId)
        .single();

      if (error) throw error;

      const result: ViewsData = {
        count: data?.views_count || 0,
        isLoading: false,
        error: null
      };

      setViewsCache(prev => new Map(prev).set(listingId, result));
      return result;
    } catch (error) {
      const result: ViewsData = {
        count: cached?.count || 0,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };

      setViewsCache(prev => new Map(prev).set(listingId, result));
      return result;
    }
  }, [viewsCache]);

  /**
   * FONCTION POUR RÉCUPÉRER LES STATISTIQUES AVANCÉES
   * Utile pour les dashboards et les analyses
   */
  const getViewsStats = useCallback(async (listingId: string): Promise<ViewsStats> => {
    try {
      const { data: totalViewsData } = await supabase
        .from('listings')
        .select('views_count')
        .eq('id', listingId)
        .single();

      const { data: detailedStats } = await supabase
        .from('listing_views')
        .select('user_id, visitor_id, viewed_at')
        .eq('listing_id', listingId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueVisitors = new Set(detailedStats?.map(v => v.visitor_id) || []).size;
      const registeredUserViews = detailedStats?.filter(v => v.user_id !== null).length || 0;
      const todayViews = detailedStats?.filter(v => 
        new Date(v.viewed_at) >= today
      ).length || 0;

      return {
        totalViews: totalViewsData?.views_count || 0,
        uniqueVisitors,
        registeredUserViews,
        anonymousViews: (detailedStats?.length || 0) - registeredUserViews,
        todayViews
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        registeredUserViews: 0,
        anonymousViews: 0,
        todayViews: 0
      };
    }
  }, []);

  /**
   * FONCTION UTILITAIRE POUR FORMATER L'AFFICHAGE DES VUES
   * Cette fonction peut être utilisée partout pour un affichage cohérent
   */
  const formatViewsDisplay = useCallback((count: number): string => {
    if (count === 0) return 'Aucune vue';
    if (count === 1) return '1 vue';
    if (count < 1000) return `${count} vues`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k vues`;
    return `${(count / 1000000).toFixed(1)}M vues`;
  }, []);

  /**
   * FONCTION POUR NETTOYER LE CACHE
   * Utile pour forcer le rechargement des données
   */
  const clearViewsCache = useCallback((listingId?: string) => {
    if (listingId) {
      setViewsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(listingId);
        return newCache;
      });
    } else {
      setViewsCache(new Map());
    }
  }, []);

  // Interface publique du hook
  return {
    // Fonctions principales
    recordView,
    getViewsCount,
    getViewsStats,
    
    // Utilitaires
    formatViewsDisplay,
    clearViewsCache,
    
    // Données
    viewsCache: Object.fromEntries(viewsCache)
  };
};