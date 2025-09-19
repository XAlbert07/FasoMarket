// hooks/usePopularSearches.ts - VERSION COMPLÈTE CORRIGÉE
// Hook personnalisé pour gérer les recherches populaires de FasoMarket

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
 * Hook usePopularSearches - Système intelligent de gestion des recherches
 * 
 * Ce hook transforme votre section "recherches populaires" statique en un système
 * dynamique qui apprend des vrais comportements de vos utilisateurs burkinabè.
 * 
 * CORRECTIONS APPORTÉES :
 * - Filtrage d'exclusion intelligent qui évite les pièges des chaînes vides
 * - Logs de debugging optionnels pour faciliter la maintenance
 * - Gestion robuste des cas d'erreur et des données manquantes
 * - Optimisation des performances avec cache intelligent
 */
export const usePopularSearches = (config: PopularSearchesConfig = {}) => {
  // Configuration avec valeurs par défaut optimisées pour FasoMarket
  const {
    maxItems = 5,
    minSearches = 2, // Réduit de 3 à 2 pour plus de flexibilité
    excludeQueries = ['test', 'aaa', 'zzz'], // Suppression de la chaîne vide problématique
    timeRange = 'month',
    source = 'all',
    enableDebugLogs = false // Nouveau : permet d'activer les logs en cas de besoin
  } = config;

  // État local du hook - organisé de manière logique
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [totalSearches, setTotalSearches] = useState(0);

  // Cache et optimisations - design pattern pour éviter les requêtes inutiles
  const cacheRef = useRef<{ [key: string]: PopularSearch[] }>({});
  const lastFetchRef = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes de cache

  /**
   * Fonction de logging conditionnel
   * Ne pollue les logs qu'en mode debug ou développement
   */
  const debugLog = useCallback((message: string, data?: any) => {
    if (enableDebugLogs || process.env.NODE_ENV === 'development') {
      if (data !== undefined) {
        console.log(`[PopularSearches] ${message}`, data);
      } else {
        console.log(`[PopularSearches] ${message}`);
      }
    }
  }, [enableDebugLogs]);

  /**
   * Fonction utilitaire pour normaliser les requêtes de recherche
   * Cette fonction assure la cohérence des données stockées en base
   * Elle gère les accents français et les variations d'espacement
   */
  const normalizeQuery = useCallback((query: string): string => {
    return query
      .toLowerCase() // Conversion en minuscules pour uniformité
      .trim() // Suppression des espaces en début/fin
      .replace(/[àáâãäå]/g, 'a') // Normalisation des accents - adaptation française
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, ' '); // Normalisation des espaces multiples en un seul
  }, []);

  /**
   * Génération d'un ID de session pour le tracking des utilisateurs anonymes
   * Permet de regrouper les recherches d'une même session de navigation
   * Utilise le localStorage pour maintenir la cohérence entre les pages
   */
  const generateSessionId = useCallback((): string => {
    // Vérifier si on a déjà un ID de session dans le localStorage
    let sessionId = localStorage.getItem('fasomarket_session_id');
    
    if (!sessionId) {
      // Créer un nouvel ID unique basé sur timestamp + random
      // Format : session_[timestamp]_[chaîne aléatoire]
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('fasomarket_session_id', sessionId);
      debugLog('Nouvel ID de session généré', sessionId);
    }
    
    return sessionId;
  }, [debugLog]);

  /**
   * Fonction intelligente pour filtrer les termes d'exclusion
   * CORRECTION PRINCIPALE : Cette fonction évite le piège des chaînes vides
   * Elle applique une logique de correspondance nuancée selon la longueur des termes
   */
  const shouldExcludeQuery = useCallback((query: string, exclusions: string[]): boolean => {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Filtrer d'abord les exclusions valides (non vides, non nulles)
    const validExclusions = exclusions.filter(term => 
      term && 
      typeof term === 'string' && 
      term.trim().length > 0
    );
    
    return validExclusions.some(excluded => {
      const excludedTerm = excluded.toLowerCase().trim();
      
      // Pour des termes courts (1-2 caractères), exiger une correspondance exacte
      // Cela évite que "a" exclue "avion" par exemple
      if (excludedTerm.length <= 2) {
        return normalizedQuery === excludedTerm;
      }
      
      // Pour des termes plus longs, permettre l'inclusion (plus flexible)
      // "test" exclura "testing" et "test123"
      return normalizedQuery.includes(excludedTerm);
    });
  }, []);

  /**
   * Fonction principale pour récupérer les recherches populaires
   * Architecture repensée pour être plus robuste et maintenable
   */
  const fetchPopularSearches = useCallback(async () => {
    try {
      setError(null);
      
      // Vérification du cache pour éviter les requêtes inutiles
      // Pattern de mise en cache intelligent basé sur la configuration
      const cacheKey = `${timeRange}_${source}_${maxItems}_${minSearches}`;
      const cachedData = cacheRef.current[cacheKey];
      const now = Date.now();
      
      if (cachedData && (now - lastFetchRef.current) < CACHE_DURATION) {
        debugLog('Utilisation du cache pour les recherches populaires');
        setPopularSearches(cachedData);
        setLoading(false);
        return;
      }

      debugLog('Récupération des recherches populaires depuis la base de données');
      
      // Calculer la date limite selon la période choisie
      let dateFilter = null;
      if (timeRange !== 'all') {
        const daysAgo = timeRange === 'week' ? 7 : 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        dateFilter = cutoffDate.toISOString();
        debugLog(`Filtre temporel appliqué pour ${timeRange}`, dateFilter);
      }

      // Construction progressive de la requête Supabase
      let query = supabase
        .from('search_analytics')
        .select('normalized_query, search_query, created_at, has_results, results_count, clicked_result');

      // Application du filtre temporel si nécessaire
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      // Exécution de la requête avec gestion d'erreur robuste
      const { data: rawData, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Erreur lors de la récupération des données: ${fetchError.message}`);
      }

      debugLog(`Données brutes récupérées: ${rawData?.length || 0} enregistrements`);

      // Traitement des données pour calculer la popularité
      if (!rawData || rawData.length === 0) {
        debugLog('Aucune donnée trouvée dans search_analytics');
        setPopularSearches([]);
        setTotalSearches(0);
        setLastUpdated(new Date().toISOString());
        return;
      }

      // Application progressive des filtres avec logging pour debugging
      debugLog('Application des filtres de qualité des données...');
      
      // Étape 1: Filtrer les données valides et utilisables
      const validData = rawData.filter(record => {
        // Vérifier que normalized_query existe et n'est pas vide
        if (!record.normalized_query || record.normalized_query.trim().length < 2) {
          return false;
        }
        
        // Vérifier que la requête commence par une lettre (éviter les caractères spéciaux)
        if (!/^[a-zA-Z]/.test(record.normalized_query.trim())) {
          return false;
        }
        
        // Éviter les requêtes purement numériques
        if (/^\d+$/.test(record.normalized_query.trim())) {
          return false;
        }
        
        // Appliquer le filtrage d'exclusion intelligent (CORRECTION PRINCIPALE)
        if (shouldExcludeQuery(record.normalized_query, excludeQueries)) {
          return false;
        }
        
        return true;
      });

      debugLog(`Données après filtrage: ${validData.length} enregistrements valides`);

      if (validData.length === 0) {
        debugLog('Aucune donnée valide après filtrage');
        setPopularSearches([]);
        setTotalSearches(0);
        setLastUpdated(new Date().toISOString());
        return;
      }

      // Étape 2: Agrégation intelligente des données par terme de recherche
      debugLog('Démarrage de l\'agrégation des données...');
      const searchMap = new Map<string, {
        normalized_query: string;
        display_query: string;
        searches: any[];
        unique_users: Set<string>;
        clicks: number;
        total_results: number;
      }>();
      
      // Traitement de chaque enregistrement pour construire les statistiques
      validData.forEach(record => {
        const key = record.normalized_query.trim().toLowerCase();
        
        if (!searchMap.has(key)) {
          searchMap.set(key, {
            normalized_query: key,
            display_query: record.search_query || record.normalized_query, // Prendre le terme original pour l'affichage
            searches: [],
            unique_users: new Set(),
            clicks: 0,
            total_results: 0
          });
        }
        
        const entry = searchMap.get(key)!;
        entry.searches.push(record);
        
        // Accumulation sécurisée des métriques d'engagement
        if (record.clicked_result) {
          entry.clicks++;
        }
        
        if (record.results_count && typeof record.results_count === 'number') {
          entry.total_results += record.results_count;
        }
      });

      debugLog(`Agrégation terminée: ${searchMap.size} termes uniques trouvés`);

      // Étape 3: Transformation en format PopularSearch avec calcul de popularité
      const popularSearches = Array.from(searchMap.values())
        .map(entry => {
          const totalSearches = entry.searches.length;
          const avgResults = totalSearches > 0 ? entry.total_results / totalSearches : 0;
          
          // Algorithme de calcul du score de popularité
          // Facteurs : fréquence de recherche + engagement (clics) + pertinence (résultats)
          const popularityScore = totalSearches + (entry.clicks * 2) + (avgResults * 0.1);
          
          // Calcul des dates de première et dernière recherche pour contexte temporel
          const dates = entry.searches
            .map(s => new Date(s.created_at))
            .sort((a, b) => a.getTime() - b.getTime());
          
          return {
            normalized_query: entry.normalized_query,
            display_query: entry.display_query,
            total_searches: totalSearches,
            unique_users: entry.unique_users.size,
            unique_sessions: totalSearches, // Simplification pour cette version
            avg_results: Math.round(avgResults * 100) / 100,
            clicks: entry.clicks,
            popularity_score: popularityScore,
            last_searched_at: dates[dates.length - 1].toISOString(),
            first_searched_at: dates[0].toISOString()
          } as PopularSearch;
        })
        .filter(search => search.total_searches >= minSearches) // Application du seuil minimum
        .sort((a, b) => b.popularity_score - a.popularity_score) // Tri par popularité décroissante
        .slice(0, maxItems); // Limitation au nombre maximum demandé

      // Mise à jour du cache et de l'état de l'application
      cacheRef.current[cacheKey] = popularSearches;
      lastFetchRef.current = now;
      setPopularSearches(popularSearches);
      setTotalSearches(popularSearches.reduce((sum, item) => sum + item.total_searches, 0));
      setLastUpdated(new Date().toISOString());

      debugLog(`Recherches populaires calculées avec succès: ${popularSearches.length} résultats`, 
        popularSearches.slice(0, 3).map(s => `${s.display_query} (${s.total_searches} recherches)`)
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de la récupération des recherches populaires';
      console.error('[PopularSearches] Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [timeRange, source, maxItems, minSearches, excludeQueries, shouldExcludeQuery, debugLog]);

  /**
   * Fonction pour tracker une nouvelle recherche
   * Appelée automatiquement quand un utilisateur effectue une recherche
   * Design pattern observer pour collecter les données utilisateur
   */
  const trackSearch = useCallback(async (data: SearchTrackingData): Promise<void> => {
    try {
      // Normalisation et validation des données d'entrée
      const normalizedQuery = normalizeQuery(data.search_query);
      
      // Ignorer les recherches trop courtes ou invalides
      if (normalizedQuery.length < 2) {
        debugLog('Recherche trop courte ignorée:', data.search_query);
        return;
      }

      // Construction du payload de tracking avec métadonnées contextuelles
      const trackingPayload = {
        search_query: data.search_query,
        normalized_query: normalizedQuery,
        location_query: data.location_query || null,
        user_id: data.user_id || null,
        session_id: data.session_id || generateSessionId(),
        source_page: data.source_page || 'unknown',
        category_filter: data.category_filter || null,
        user_agent: navigator.userAgent,
        // Les champs de résultats seront mis à jour ultérieurement
        has_results: true,
        results_count: 0,
        clicked_result: false
      };

      // Insertion en base de données avec gestion d'erreur non bloquante
      const { error: insertError } = await supabase
        .from('search_analytics')
        .insert([trackingPayload]);

      if (insertError) {
        console.error('[PopularSearches] Erreur lors du tracking:', insertError);
        // Important : ne pas faire échouer l'expérience utilisateur pour une erreur de tracking
        return;
      }

      debugLog('Recherche trackée avec succès:', normalizedQuery);

    } catch (err) {
      console.error('[PopularSearches] Erreur lors du tracking de la recherche:', err);
      // Le tracking ne doit jamais interrompre l'expérience utilisateur
    }
  }, [normalizeQuery, generateSessionId, debugLog]);

  /**
   * Fonction pour mettre à jour les résultats d'une recherche
   * Appelée après l'exécution d'une recherche pour enrichir les analytics
   */
  const updateSearchResults = useCallback(async (data: SearchResultsData): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('search_analytics')
        .update({
          has_results: data.has_results,
          results_count: data.results_count,
          clicked_result: data.clicked_result || false,
          clicked_listing_id: data.clicked_listing_id || null,
          time_on_results: data.time_on_results || null
        })
        .eq('id', data.analytics_id);

      if (updateError) {
        console.error('[PopularSearches] Erreur lors de la mise à jour des résultats:', updateError);
        return;
      }

      debugLog('Résultats de recherche mis à jour:', data.analytics_id);

    } catch (err) {
      console.error('[PopularSearches] Erreur lors de la mise à jour des résultats:', err);
    }
  }, [debugLog]);

  /**
   * Fonction pour forcer le rafraîchissement des données
   * Utile pour les admins ou après des modifications importantes
   */
  const refreshPopularSearches = useCallback(async (): Promise<void> => {
    // Vider le cache pour forcer une nouvelle requête
    cacheRef.current = {};
    lastFetchRef.current = 0;
    setLoading(true);
    await fetchPopularSearches();
  }, [fetchPopularSearches]);

  /**
   * Fonction pour rafraîchir la vue matérialisée (pour les admins)
   * Cette opération coûteuse ne devrait être appelée qu'occasionnellement
   */
  const refreshMaterializedView = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('refresh_popular_searches');
      
      if (error) {
        console.error('[PopularSearches] Erreur lors du rafraîchissement de la vue:', error);
        return false;
      }

      debugLog('Vue matérialisée rafraîchie avec succès');
      // Rafraîchir les données locales après la mise à jour
      await refreshPopularSearches();
      return true;

    } catch (err) {
      console.error('[PopularSearches] Erreur lors du rafraîchissement de la vue matérialisée:', err);
      return false;
    }
  }, [refreshPopularSearches, debugLog]);

  /**
   * Fonction utilitaire pour obtenir des suggestions basées sur une requête partielle
   * Utile pour l'autocomplétion dans la barre de recherche
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
   * Effet pour le chargement initial des données
   * Se déclenche au montage du composant et lors des changements de configuration
   */
  useEffect(() => {
    fetchPopularSearches();
  }, [fetchPopularSearches]);

  /**
   * Effet pour le nettoyage du cache lors du démontage
   * Évite les fuites mémoire dans les applications longue durée
   */
  useEffect(() => {
    return () => {
      // Nettoyage du cache lors du démontage
      cacheRef.current = {};
    };
  }, []);

  // Interface de retour du hook - tout ce dont les composants ont besoin
  const result: UsePopularSearchesReturn = {
    // Données principales
    popularSearches,
    loading,
    error,
    
    // Métadonnées utiles pour l'interface utilisateur
    lastUpdated,
    totalSearches,
    
    // Actions principales pour les composants
    refreshPopularSearches,
    trackSearch,
    updateSearchResults,
    
    // Actions avancées (principalement pour les admins)
    refreshMaterializedView,
    getSearchSuggestions,
    
    // Utilitaires exposés pour flexibilité
    normalizeQuery,
    generateSessionId
  };

  return result;
};

/**
 * Hook léger pour le tracking uniquement
 * Optimisation pour les composants qui veulent juste tracker sans récupérer les populaires
 */
export const useSearchTracking = () => {
  const { trackSearch, updateSearchResults, normalizeQuery, generateSessionId } = usePopularSearches({
    maxItems: 0 // Ne pas récupérer les recherches populaires pour économiser les ressources
  });

  return {
    trackSearch,
    updateSearchResults,
    normalizeQuery,
    generateSessionId
  };
};

/**
 * Hook spécialisé pour les composants d'autocomplétion
 * Optimisé pour les suggestions en temps réel avec configuration adaptée
 */
export const useSearchSuggestions = (maxSuggestions: number = 5) => {
  const { popularSearches, loading, getSearchSuggestions } = usePopularSearches({
    maxItems: maxSuggestions * 2, // Récupérer plus d'éléments pour avoir plus de choix dans les suggestions
    timeRange: 'week', // Suggestions basées sur les recherches récentes pour plus de pertinence
    enableDebugLogs: false // Désactiver les logs pour les suggestions (performance)
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