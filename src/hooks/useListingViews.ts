// hooks/useListingViews.ts - SYSTÈME DE VUES PROFESSIONNEL
// Inspiré des meilleures pratiques de YouTube, Leboncoin, etc.

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * GESTION DE L'IDENTITÉ VISITEUR
 * Stratégie à 3 niveaux pour identifier les visiteurs de manière stable
 */
class VisitorIdentityManager {
  private static STORAGE_KEY = 'fasomarket_visitor_id';
  private static CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 an

  /**
   * Génère une empreinte digitale stable du navigateur
   * Cette méthode est plus fiable que canvas fingerprinting
   */
  private static generateBrowserFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.languages?.join(',') || '',
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0, // TypeScript fix: propriété non-standard
      navigator.platform
    ];

    // Création d'un hash simple mais efficace
    const fingerprint = components.join('|');
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `fp_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Récupère ou crée l'identifiant visiteur
   * Priorité : localStorage > fingerprint
   */
  static getVisitorId(userId?: string): string {
    // Si utilisateur connecté, utiliser son ID
    if (userId) {
      return `user_${userId}`;
    }

    try {
      // Vérifier si un ID existe déjà en localStorage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const age = Date.now() - parsed.timestamp;
          
          // Si l'ID est valide et pas trop ancien, le réutiliser
          if (parsed.id && age < this.CACHE_DURATION) {
            return parsed.id;
          }
        } catch {
          // Si parsing échoue, continuer avec la génération
        }
      }

      // Générer un nouvel ID basé sur le fingerprint
      const newId = this.generateBrowserFingerprint();
      
      // Sauvegarder en localStorage pour persistance
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          id: newId,
          timestamp: Date.now()
        })
      );

      return newId;
    } catch (error) {
      // Fallback si localStorage n'est pas disponible
      console.warn('localStorage non disponible, utilisation du fingerprint seul');
      return this.generateBrowserFingerprint();
    }
  }

  /**
   * Nettoie l'identifiant stocké (utile pour les tests)
   */
  static clearVisitorId(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Impossible de nettoyer le visitor ID');
    }
  }
}

/**
 * Interface pour les données de vues
 */
interface ViewsData {
  count: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Interface pour les statistiques avancées
 */
interface ViewsStats {
  totalViews: number;
  uniqueVisitors: number;
  registeredUserViews: number;
  anonymousViews: number;
  todayViews: number;
  last7DaysViews: number;
  viewsGrowth: number; // Pourcentage de croissance
}

/**
 * HOOK PRINCIPAL POUR LA GESTION DES VUES
 */
export const useListingViews = () => {
  const [viewsCache, setViewsCache] = useState<Map<string, ViewsData>>(new Map());
  const recordingViews = useRef<Set<string>>(new Set());
  const { user } = useAuthContext();

  /**
   * FONCTION PRINCIPALE : ENREGISTRER UNE VUE
   * Logique professionnelle avec déduplication sur 24h
   */
  const recordView = useCallback(async (listingId: string, listingOwnerId?: string): Promise<boolean> => {
    // Éviter les appels multiples simultanés
    if (recordingViews.current.has(listingId)) {
      console.log(`⏳ Enregistrement déjà en cours pour ${listingId}`);
      return false;
    }
    
    //AJOUT : Vérifier si c'est le propriétaire
    if (user?.id && listingOwnerId && user.id === listingOwnerId) {
      console.log('👤 Propriétaire - pas d\'enregistrement de vue');
      return false;
    }

    recordingViews.current.add(listingId);

    try {
      // Obtenir l'identifiant visiteur stable
      const visitorId = VisitorIdentityManager.getVisitorId(user?.id);
      
      // Période de déduplication : 24 heures
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      console.log(`🔍 Vérification vue récente pour visiteur ${visitorId}`);

      // Vérifier si ce visiteur a déjà vu cette annonce récemment
      const { data: existingView, error: checkError } = await supabase
        .from('listing_views')
        .select('id, viewed_at')
        .eq('listing_id', listingId)
        .eq('visitor_id', visitorId)
        .gte('viewed_at', twentyFourHoursAgo.toISOString())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Si une vue récente existe, ne pas comptabiliser
      if (existingView) {
        console.log(`✓ Vue déjà enregistrée récemment (${new Date(existingView.viewed_at).toLocaleString()})`);
        return false;
      }

      // Préparer les données de la vue
      const viewData = {
        listing_id: listingId,
        user_id: user?.id || null,
        visitor_id: visitorId,
        ip_address: null, // À gérer côté backend si nécessaire
        user_agent: navigator.userAgent,
        viewed_at: new Date().toISOString()
      };

      // Insérer la nouvelle vue
      const { error: insertError } = await supabase
        .from('listing_views')
        .insert(viewData);

      if (insertError) {
        console.error('❌ Erreur insertion vue:', insertError);
        throw insertError;
      }

      console.log(`✅ Vue enregistrée avec succès pour ${listingId}`);

      // Incrémenter le compteur dans la table listings de manière atomique
      // Note : Cette méthode utilise une fonction RPC pour éviter les race conditions
      try {
        const { error: rpcError } = await supabase
          .rpc('increment_listing_views', { listing_id: listingId });

        if (rpcError) {
          console.warn('⚠️ RPC non disponible, fallback sur update simple');
          
          // Fallback : récupérer le compteur actuel et incrémenter
          const { data: listing } = await supabase
            .from('listings')
            .select('views_count')
            .eq('id', listingId)
            .single();

          if (listing) {
            await supabase
              .from('listings')
              .update({ views_count: (listing.views_count || 0) + 1 })
              .eq('id', listingId);
          }
        }
      } catch (rpcError) {
        console.warn('⚠️ Erreur incrémentation compteur:', rpcError);
      }

      // Mise à jour du cache local pour affichage immédiat
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

      return true;

    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la vue:', error);
      return false;
    } finally {
      recordingViews.current.delete(listingId);
    }
  }, [user?.id]);

  /**
   * RÉCUPÉRER LE NOMBRE DE VUES (avec cache intelligent)
   */
  const getViewsCount = useCallback(async (listingId: string): Promise<ViewsData> => {
    // Vérifier le cache d'abord
    const cached = viewsCache.get(listingId);
    if (cached && !cached.isLoading && !cached.error) {
      return cached;
    }

    // Mettre l'état en chargement
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
   * STATISTIQUES AVANCÉES POUR LE DASHBOARD
   */
  const getViewsStats = useCallback(async (listingId: string): Promise<ViewsStats> => {
    try {
      // Récupérer le compteur total
      const { data: totalData } = await supabase
        .from('listings')
        .select('views_count')
        .eq('id', listingId)
        .single();

      // Récupérer les détails des vues
      const { data: detailedViews } = await supabase
        .from('listing_views')
        .select('user_id, visitor_id, viewed_at')
        .eq('listing_id', listingId)
        .order('viewed_at', { ascending: false });

      if (!detailedViews) {
        return {
          totalViews: totalData?.views_count || 0,
          uniqueVisitors: 0,
          registeredUserViews: 0,
          anonymousViews: 0,
          todayViews: 0,
          last7DaysViews: 0,
          viewsGrowth: 0
        };
      }

      // Calculs des statistiques
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const uniqueVisitors = new Set(detailedViews.map(v => v.visitor_id)).size;
      const registeredUserViews = detailedViews.filter(v => v.user_id !== null).length;
      const todayViews = detailedViews.filter(v => new Date(v.viewed_at) >= todayStart).length;
      const last7DaysViews = detailedViews.filter(v => new Date(v.viewed_at) >= sevenDaysAgo).length;
      const previous7DaysViews = detailedViews.filter(v => {
        const viewDate = new Date(v.viewed_at);
        return viewDate >= fourteenDaysAgo && viewDate < sevenDaysAgo;
      }).length;

      // Calcul de la croissance
      const viewsGrowth = previous7DaysViews > 0
        ? ((last7DaysViews - previous7DaysViews) / previous7DaysViews) * 100
        : last7DaysViews > 0 ? 100 : 0;

      return {
        totalViews: totalData?.views_count || 0,
        uniqueVisitors,
        registeredUserViews,
        anonymousViews: detailedViews.length - registeredUserViews,
        todayViews,
        last7DaysViews,
        viewsGrowth: Math.round(viewsGrowth * 10) / 10
      };

    } catch (error) {
      console.error('Erreur statistiques:', error);
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        registeredUserViews: 0,
        anonymousViews: 0,
        todayViews: 0,
        last7DaysViews: 0,
        viewsGrowth: 0
      };
    }
  }, []);

  /**
   * FORMATER L'AFFICHAGE DES VUES
   */
  const formatViewsDisplay = useCallback((count: number): string => {
  if (count < 2) return `${count} vue`;  // 0 vue, 1 vue
  if (count < 1000) return `${count} vues`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k vues`;
  return `${(count / 1000000).toFixed(1)}M vues`;
}, []);

  /**
   * NETTOYER LE CACHE
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

  /**
   * VÉRIFIER SI UNE VUE A DÉJÀ ÉTÉ ENREGISTRÉE
   * Utile pour l'interface utilisateur
   */
  const hasViewedRecently = useCallback(async (listingId: string): Promise<boolean> => {
    try {
      const visitorId = VisitorIdentityManager.getVisitorId(user?.id);
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('listing_views')
        .select('id')
        .eq('listing_id', listingId)
        .eq('visitor_id', visitorId)
        .gte('viewed_at', twentyFourHoursAgo.toISOString())
        .maybeSingle();

      return !error && data !== null;
    } catch {
      return false;
    }
  }, [user?.id]);

  // Interface publique du hook
  return {
    // Fonctions principales
    recordView,
    getViewsCount,
    getViewsStats,
    hasViewedRecently,
    
    // Utilitaires
    formatViewsDisplay,
    clearViewsCache,
    
    // Données
    viewsCache: Object.fromEntries(viewsCache)
  };
};

/**
 * HOOK SIMPLIFIÉ POUR L'AUTO-TRACKING
 * À utiliser dans les pages de détail d'annonce
 */
export const useAutoRecordView = (listingId: string | undefined) => {
  const { recordView } = useListingViews();
  const hasRecorded = useRef(false);

  useEffect(() => {
    if (!listingId || hasRecorded.current) return;

    const recordViewWithDelay = async () => {
      // Attendre 2 secondes avant d'enregistrer la vue
      // Cela évite de compter les "bounces" (visiteurs qui quittent immédiatement)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = await recordView(listingId);
      if (success) {
        hasRecorded.current = true;
        console.log(`📊 Vue auto-enregistrée pour ${listingId}`);
      }
    };

    recordViewWithDelay();
  }, [listingId, recordView]);
};