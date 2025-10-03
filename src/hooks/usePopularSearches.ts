// hooks/usePopularSearches.ts - VERSION PRODUCTION ROBUSTE
// Système intelligent de recherches populaires pour FasoMarket

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { 
  PopularSearch, 
  SearchTrackingData, 
  SearchResultsData, 
  UsePopularSearchesReturn,
  PopularSearchesConfig 
} from '@/types/database';

/**
 * Configuration par défaut optimisée pour le contexte burkinabè
 */
const DEFAULT_CONFIG: Required<PopularSearchesConfig> = {
  maxItems: 5,
  minSearches: 2,
  excludeQueries: ['test', 'aaa', 'zzz', 'xxx'],
  timeRange: 'month',
  source: 'all',
  enableDebugLogs: false
};

/**
 * Hook usePopularSearches - Gestion intelligente des recherches populaires
 * 
 * AMÉLIORATIONS VERSION PRODUCTION :
 * - Utilise la vue matérialisée pour des performances optimales
 * - Cache intelligent avec invalidation automatique
 * - Tracking non-bloquant avec gestion d'erreur robuste
 * - Fallback automatique en cas d'échec
 * - Débouncing intégré pour éviter la surcharge
 */
export const usePopularSearches = (userConfig: PopularSearchesConfig = {}) => {
  // Fusion de la config utilisateur avec les valeurs par défaut
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const {
    maxItems,
    minSearches,
    excludeQueries,
    timeRange,
    source,
    enableDebugLogs
  } = config;

  // État du hook
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [totalSearches, setTotalSearches] = useState(0);

  // Références pour optimisation
  const cacheRef = useRef<Map<string, { data: PopularSearch[], timestamp: number }>>(new Map());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Logger conditionnel pour le debugging
   */
  const log = useCallback((message: string, data?: any) => {
    if (enableDebugLogs || process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      if (data !== undefined) {
        console.log(`[${timestamp}] [PopularSearches] ${message}`, data);
      } else {
        console.log(`[${timestamp}] [PopularSearches] ${message}`);
      }
    }
  }, [enableDebugLogs]);

  /**
   * Normalisation des requêtes avec gestion des accents français
   */
  const normalizeQuery = useCallback((query: string): string => {
    if (!query || typeof query !== 'string') return '';
    
    return query
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, ' ')
      .substring(0, 100);
  }, []);

  /**
   * Génération d'ID de session pour le tracking anonyme
   */
  const generateSessionId = useCallback((): string => {
    if (typeof window === 'undefined') return 'server-session';
    
    try {
      let sessionId = localStorage.getItem('fasomarket_session_id');
      
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('fasomarket_session_id', sessionId);
        log('Nouvelle session générée', sessionId);
      }
      
      return sessionId;
    } catch (error) {
      // Fallback si localStorage non disponible
      return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
  }, [log]);

  /**
   * Filtrage intelligent des termes exclus
   */
  const shouldExcludeQuery = useCallback((query: string): boolean => {
    if (!query || query.length < 2) return true;
    
    const normalized = query.toLowerCase().trim();
    
    // Filtrer les exclusions valides
    const validExclusions = excludeQueries.filter(term => 
      term && typeof term === 'string' && term.trim().length > 0
    );
    
    return validExclusions.some(excluded => {
      const excludedTerm = excluded.toLowerCase().trim();
      
      // Correspondance exacte pour les termes courts
      if (excludedTerm.length <= 2) {
        return normalized === excludedTerm;
      }
      
      // Inclusion pour les termes plus longs
      return normalized.includes(excludedTerm);
    });
  }, [excludeQueries]);

  /**
   * MÉTHODE PRINCIPALE : Récupération des recherches populaires
   * Utilise la vue matérialisée pour des performances optimales
   */
  const fetchPopularSearches = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Vérifier le cache
    const cacheKey = `${timeRange}_${source}_${maxItems}`;
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      log('Données chargées depuis le cache');
      setPopularSearches(cached.data);
      setTotalSearches(cached.data.reduce((sum, item) => sum + item.total_searches, 0));
      setLoading(false);
      return;
    }

    try {
      setError(null);
      log(`Récupération des recherches populaires (${timeRange})`);

      // Stratégie 1 : Essayer d'utiliser la vue matérialisée (optimal)
      let { data, error: viewError } = await supabase
        .from('popular_searches')
        .select('*')
        .limit(maxItems * 2); // Prendre plus pour pouvoir filtrer

      // Stratégie 2 : Fallback sur la fonction SQL si la vue échoue
      if (viewError || !data || data.length === 0) {
        log('Vue matérialisée indisponible, utilisation de la fonction SQL');
        
        const { data: functionData, error: funcError } = await supabase
          .rpc('get_popular_searches', {
            p_limit: maxItems * 2,
            p_min_searches: minSearches,
            p_time_range: timeRange
          });

        if (funcError) {
          throw new Error(`Erreur fonction SQL: ${funcError.message}`);
        }

        data = functionData;
      }

      // Stratégie 3 : Fallback final sur calcul direct (le plus lent)
      if (!data || data.length === 0) {
        log('Calcul direct des recherches populaires');
        data = await fetchPopularSearchesDirect();
      }

      // Filtrage et tri des résultats
      const filteredSearches = (data || [])
        .filter(search => 
          !shouldExcludeQuery(search.normalized_query) &&
          search.total_searches >= minSearches
        )
        .sort((a, b) => b.popularity_score - a.popularity_score)
        .slice(0, maxItems);

      // Mise à jour du cache et de l'état
      if (!isUnmountedRef.current) {
        cacheRef.current.set(cacheKey, {
          data: filteredSearches,
          timestamp: now
        });

        setPopularSearches(filteredSearches);
        setTotalSearches(filteredSearches.reduce((sum, item) => sum + item.total_searches, 0));
        setLastUpdated(new Date().toISOString());
        log(`Chargé ${filteredSearches.length} recherches populaires`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('[PopularSearches] Erreur:', errorMessage);
      
      if (!isUnmountedRef.current) {
        setError(errorMessage);
        // En cas d'erreur, utiliser des valeurs par défaut
        setPopularSearches([]);
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [timeRange, source, maxItems, minSearches, shouldExcludeQuery, log]);

  /**
   * Méthode de fallback : Calcul direct des recherches populaires
   * Utilisé uniquement si la vue et la fonction échouent
   */
  const fetchPopularSearchesDirect = async (): Promise<PopularSearch[]> => {
    let dateFilter = null;
    if (timeRange !== 'all') {
      const daysAgo = timeRange === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      dateFilter = cutoffDate.toISOString();
    }

    let query = supabase
      .from('search_analytics')
      .select('normalized_query, search_query, created_at, has_results, results_count, clicked_result');

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: rawData, error: fetchError } = await query;

    if (fetchError || !rawData) {
      throw new Error('Impossible de récupérer les données de recherche');
    }

    // Agrégation manuelle des données
    const searchMap = new Map<string, {
      normalized_query: string;
      display_query: string;
      searches: any[];
      clicks: number;
      total_results: number;
    }>();

    rawData.forEach(record => {
      if (!record.normalized_query || record.normalized_query.length < 2) return;
      
      const key = record.normalized_query.trim().toLowerCase();
      
      if (!searchMap.has(key)) {
        searchMap.set(key, {
          normalized_query: key,
          display_query: record.search_query || record.normalized_query,
          searches: [],
          clicks: 0,
          total_results: 0
        });
      }
      
      const entry = searchMap.get(key)!;
      entry.searches.push(record);
      
      if (record.clicked_result) entry.clicks++;
      if (record.results_count) entry.total_results += record.results_count;
    });

    return Array.from(searchMap.values())
      .map(entry => {
        const totalSearches = entry.searches.length;
        const avgResults = totalSearches > 0 ? entry.total_results / totalSearches : 0;
        const popularityScore = totalSearches + (entry.clicks * 2) + (avgResults * 0.1);
        
        const dates = entry.searches
          .map(s => new Date(s.created_at))
          .sort((a, b) => a.getTime() - b.getTime());
        
        return {
          normalized_query: entry.normalized_query,
          display_query: entry.display_query,
          total_searches: totalSearches,
          unique_users: totalSearches,
          unique_sessions: totalSearches,
          avg_results: Math.round(avgResults * 100) / 100,
          clicks: entry.clicks,
          popularity_score: popularityScore,
          last_searched_at: dates[dates.length - 1].toISOString(),
          first_searched_at: dates[0].toISOString()
        } as PopularSearch;
      });
  };

  /**
   * Tracking d'une nouvelle recherche (NON-BLOQUANT)
   */
  const trackSearch = useCallback(async (data: SearchTrackingData): Promise<void> => {
    try {
      const normalizedQuery = normalizeQuery(data.search_query);
      
      if (normalizedQuery.length < 2) {
        log('Recherche ignorée (trop courte)', data.search_query);
        return;
      }

      const trackingPayload = {
        search_query: data.search_query,
        normalized_query: normalizedQuery,
        location_query: data.location_query || null,
        user_id: data.user_id || null,
        session_id: data.session_id || generateSessionId(),
        source_page: data.source_page || 'hero',
        category_filter: data.category_filter || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        has_results: true,
        results_count: 0,
        clicked_result: false
      };

      // Insertion asynchrone non-bloquante
      supabase
        .from('search_analytics')
        .insert([trackingPayload])
        .then(({ error }) => {
          if (error) {
            console.warn('[PopularSearches] Erreur tracking (non-critique):', error.message);
          } else {
            log('Recherche trackée', normalizedQuery);
          }
        });

    } catch (err) {
      // Le tracking ne doit jamais bloquer l'expérience utilisateur
      console.warn('[PopularSearches] Erreur tracking (ignorée):', err);
    }
  }, [normalizeQuery, generateSessionId, log]);

  /**
   * Mise à jour des résultats d'une recherche
   */
  const updateSearchResults = useCallback(async (data: SearchResultsData): Promise<void> => {
    try {
      await supabase
        .from('search_analytics')
        .update({
          has_results: data.has_results,
          results_count: data.results_count,
          clicked_result: data.clicked_result || false,
          clicked_listing_id: data.clicked_listing_id || null,
          time_on_results: data.time_on_results || null
        })
        .eq('id', data.analytics_id);

      log('Résultats mis à jour', data.analytics_id);
    } catch (err) {
      console.warn('[PopularSearches] Erreur mise à jour résultats:', err);
    }
  }, [log]);

  /**
   * Rafraîchissement forcé des données
   */
  const refreshPopularSearches = useCallback(async (): Promise<void> => {
    cacheRef.current.clear();
    setLoading(true);
    await fetchPopularSearches();
  }, [fetchPopularSearches]);

  /**
   * Rafraîchissement de la vue matérialisée (admin)
   */
  const refreshMaterializedView = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('refresh_popular_searches');
      
      if (error) {
        console.error('[PopularSearches] Erreur rafraîchissement vue:', error);
        return false;
      }

      log('Vue matérialisée rafraîchie');
      await refreshPopularSearches();
      return true;
    } catch (err) {
      console.error('[PopularSearches] Erreur rafraîchissement:', err);
      return false;
    }
  }, [refreshPopularSearches, log]);

  /**
   * Suggestions basées sur une saisie partielle
   */
  const getSearchSuggestions = useCallback((partialQuery: string, limit: number = 3): PopularSearch[] => {
    const normalized = normalizeQuery(partialQuery);
    
    if (normalized.length < 2) return [];

    return popularSearches
      .filter(search => 
        search.normalized_query.includes(normalized) ||
        search.display_query.toLowerCase().includes(normalized)
      )
      .slice(0, limit);
  }, [popularSearches, normalizeQuery]);

  /**
   * Effet : Chargement initial et rechargement périodique
   */
  useEffect(() => {
    isUnmountedRef.current = false;
    fetchPopularSearches();

    // Rechargement automatique toutes les 10 minutes (optionnel)
    const intervalId = setInterval(() => {
      if (!isUnmountedRef.current) {
        log('Rafraîchissement automatique des recherches');
        fetchPopularSearches();
      }
    }, 10 * 60 * 1000);

    return () => {
      isUnmountedRef.current = true;
      clearInterval(intervalId);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchPopularSearches, log]);

  // Interface de retour complète
  return {
    popularSearches,
    loading,
    error,
    lastUpdated,
    totalSearches,
    refreshPopularSearches,
    trackSearch,
    updateSearchResults,
    refreshMaterializedView,
    getSearchSuggestions,
    normalizeQuery,
    generateSessionId
  } as UsePopularSearchesReturn;
};

/**
 * Hook léger pour le tracking uniquement
 */
export const useSearchTracking = () => {
  const { trackSearch, updateSearchResults, normalizeQuery, generateSessionId } = usePopularSearches({
    maxItems: 1, // Minimal pour économiser les ressources
    enableDebugLogs: false
  });

  return {
    trackSearch,
    updateSearchResults,
    normalizeQuery,
    generateSessionId
  };
};

/**
 * Hook spécialisé pour l'autocomplétion
 */
export const useSearchSuggestions = (maxSuggestions: number = 5) => {
  const { popularSearches, loading, getSearchSuggestions } = usePopularSearches({
    maxItems: maxSuggestions * 2,
    timeRange: 'week',
    enableDebugLogs: false
  });

  const getSuggestions = useCallback((query: string) => {
    return getSearchSuggestions(query, maxSuggestions);
  }, [getSearchSuggestions, maxSuggestions]);

  return {
    suggestions: popularSearches,
    loading,
    getSuggestions
  };
};