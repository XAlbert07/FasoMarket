// lib/searchAnalytics.ts
// Utilitaires et fonctions avancées pour le système d'analytics de recherche FasoMarket

import { supabase } from '@/lib/supabase';
import type { SearchStats, PopularSearch, SearchAnalytics } from '@/types/database';
import { useState } from 'react';
import { useCallback } from 'react';

/**
 * Service SearchAnalyticsService - Fonctions avancées pour l'analytics de recherche
 * 
 * Cette classe fournit des fonctions utilitaires pour l'analyse avancée des données
 * de recherche, particulièrement utile pour les administrateurs et les analyses business.
 */
export class SearchAnalyticsService {
  
  /**
   * Récupère des statistiques complètes sur les recherches
   * Utilisé principalement dans le dashboard administrateur
   */
  static async getSearchStats(timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<SearchStats> {
    const daysBack = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    }[timeRange];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    try {
      // Requête principale pour les statistiques de base
      const { data: basicStats, error: basicError } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('created_at', cutoffDate.toISOString());

      if (basicError) throw basicError;

      const analytics = basicStats || [];
      
      // Calculs des métriques principales
      const totalSearches = analytics.length;
      const uniqueUsers = new Set(analytics.filter(a => a.user_id).map(a => a.user_id)).size;
      const searchesWithResults = analytics.filter(a => a.has_results && a.results_count > 0).length;
      const searchesWithClicks = analytics.filter(a => a.clicked_result).length;
      const avgResultsPerSearch = analytics.reduce((sum, a) => sum + a.results_count, 0) / totalSearches || 0;
      const conversionRate = totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0;

      // Top recherches avec analyse des tendances
      const searchCounts = new Map<string, { count: number, recent: number }>();
      const recentCutoff = new Date();
      recentCutoff.setDate(recentCutoff.getDate() - Math.floor(daysBack / 2));

      analytics.forEach(search => {
        const query = search.normalized_query;
        const current = searchCounts.get(query) || { count: 0, recent: 0 };
        current.count += 1;
        if (new Date(search.created_at) > recentCutoff) {
          current.recent += 1;
        }
        searchCounts.set(query, current);
      });

      const topSearches = Array.from(searchCounts.entries())
        .map(([query, stats]) => ({
          query,
          count: stats.count,
          trend: stats.recent > stats.count / 2 ? 'up' as const : 
                 stats.recent < stats.count / 4 ? 'down' as const : 'stable' as const
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Recherches sans résultats
      const noResultsQueries = Array.from(
        analytics
          .filter(a => !a.has_results || a.results_count === 0)
          .reduce((map, search) => {
            const count = map.get(search.normalized_query) || 0;
            map.set(search.normalized_query, count + 1);
            return map;
          }, new Map<string, number>())
      )
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

      return {
        totalSearches,
        uniqueUsers,
        topSearches,
        searchesWithResults,
        searchesWithClicks,
        avgResultsPerSearch: Math.round(avgResultsPerSearch * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        noResultsQueries
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de recherche:', error);
      throw error;
    }
  }

  /**
   * Identifie les opportunités d'amélioration basées sur les données de recherche
   * Retourne des insights actionnables pour améliorer l'expérience utilisateur
   */
  static async getSearchInsights(): Promise<{
    missingContent: string[];
    popularCategories: Array<{ category: string; searches: number }>;
    userBehaviorInsights: string[];
    recommendations: string[];
  }> {
    try {
      const stats = await this.getSearchStats('month');
      
      // Contenu manquant (recherches sans résultats fréquentes)
      const missingContent = stats.noResultsQueries
        .filter(q => q.count >= 5)
        .map(q => q.query);

      // Analyse des catégories populaires (basé sur les mots-clés)
      const categoryKeywords = {
        'Électronique': ['telephone', 'iphone', 'samsung', 'ordinateur', 'laptop', 'tablet'],
        'Véhicules': ['voiture', 'moto', 'vehicule', 'auto', 'scooter'],
        'Immobilier': ['maison', 'appartement', 'terrain', 'louer', 'vendre'],
        'Mode': ['vetement', 'chaussure', 'sac', 'montre'],
        'Maison': ['meuble', 'cuisine', 'frigo', 'climatiseur']
      };

      const popularCategories = Object.entries(categoryKeywords)
        .map(([category, keywords]) => {
          const searches = stats.topSearches
            .filter(search => keywords.some(keyword => search.query.includes(keyword)))
            .reduce((sum, search) => sum + search.count, 0);
          return { category, searches };
        })
        .filter(cat => cat.searches > 0)
        .sort((a, b) => b.searches - a.searches);

      // Insights sur le comportement utilisateur
      const userBehaviorInsights = [];
      if (stats.conversionRate < 30) {
        userBehaviorInsights.push(`Taux de conversion faible (${stats.conversionRate}%) - améliorer la pertinence des résultats`);
      }
      if (stats.avgResultsPerSearch < 5) {
        userBehaviorInsights.push(`Peu de résultats par recherche (${stats.avgResultsPerSearch}) - enrichir le catalogue`);
      }
      if (missingContent.length > 3) {
        userBehaviorInsights.push(`${missingContent.length} recherches fréquentes sans résultats détectées`);
      }

      // Recommandations actionnables
      const recommendations = [];
      if (missingContent.length > 0) {
        recommendations.push(`Créer du contenu pour: ${missingContent.slice(0, 3).join(', ')}`);
      }
      if (popularCategories.length > 0) {
        const topCategory = popularCategories[0];
        recommendations.push(`Promouvoir la catégorie ${topCategory.category} (${topCategory.searches} recherches)`);
      }
      if (stats.conversionRate < 25) {
        recommendations.push('Améliorer l\'algorithme de recherche pour augmenter la pertinence');
      }

      return {
        missingContent,
        popularCategories,
        userBehaviorInsights,
        recommendations
      };

    } catch (error) {
      console.error('Erreur lors de la génération des insights:', error);
      return {
        missingContent: [],
        popularCategories: [],
        userBehaviorInsights: [],
        recommendations: []
      };
    }
  }

  /**
   * Exporte les données de recherche pour analyse externe
   * Utile pour les rapports business ou l'analyse avec des outils externes
   */
  static async exportSearchData(
    startDate: string,
    endDate: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      }

      // Format CSV
      const headers = [
        'Date', 'Recherche', 'Lieu', 'Utilisateur', 'Source', 'Résultats', 
        'A cliqué', 'Temps sur résultats'
      ];
      
      const csvRows = [
        headers.join(','),
        ...(data || []).map(row => [
          new Date(row.created_at).toLocaleDateString('fr-FR'),
          `"${row.search_query}"`,
          `"${row.location_query || ''}"`,
          row.user_id ? 'Connecté' : 'Anonyme',
          row.source_page,
          row.results_count,
          row.clicked_result ? 'Oui' : 'Non',
          row.time_on_results || 0
        ].join(','))
      ];

      return csvRows.join('\n');

    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      throw error;
    }
  }

  /**
   * Nettoie et optimise les données de recherche
   * Fonction de maintenance à exécuter périodiquement
   */
  static async cleanupSearchData(olderThanDays: number = 180): Promise<{
    deletedRows: number;
    message: string;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { count, error } = await supabase
        .from('search_analytics')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      return {
        deletedRows: count || 0,
        message: `Suppression de ${count || 0} enregistrements antérieurs au ${cutoffDate.toLocaleDateString('fr-FR')}`
      };

    } catch (error) {
      console.error('Erreur lors du nettoyage des données:', error);
      throw error;
    }
  }
}

/**
 * Fonctions utilitaires pour la validation et la normalisation
 */
export const SearchUtils = {
  
  /**
   * Normalise une requête de recherche pour la cohérence des données
   */
  normalizeQuery: (query: string): string => {
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
      .substring(0, 100); // Limite de longueur
  },

  /**
   * Valide qu'une requête de recherche est acceptable
   */
  isValidQuery: (query: string): boolean => {
    const normalized = SearchUtils.normalizeQuery(query);
    return (
      normalized.length >= 2 &&
      normalized.length <= 100 &&
      !/^[0-9\s]+$/.test(normalized) && // Pas que des chiffres
      !/^[^a-zA-Z0-9\s]+$/.test(normalized) // Pas que de la ponctuation
    );
  },

  /**
   * Détecte la langue probable d'une requête (français/autres)
   */
  detectLanguage: (query: string): 'fr' | 'other' => {
    const frenchWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'pour', 'avec'];
    const words = query.toLowerCase().split(' ');
    const frenchWordCount = words.filter(word => frenchWords.includes(word)).length;
    return frenchWordCount > 0 ? 'fr' : 'other';
  },

  /**
   * Suggère des corrections pour les requêtes mal orthographiées
   * Version basique - peut être étendue avec une bibliothèque de correction
   */
  suggestCorrections: (query: string): string[] => {
    const commonMistakes = {
      'telefone': 'téléphone',
      'voiture': 'voiture',
      'maison': 'maison',
      'apartement': 'appartement',
      'ordinateur': 'ordinateur',
      'teléphone': 'téléphone'
    };

    const normalized = SearchUtils.normalizeQuery(query);
    const corrections: string[] = [];

    Object.entries(commonMistakes).forEach(([mistake, correct]) => {
      if (normalized.includes(mistake)) {
        corrections.push(normalized.replace(mistake, correct));
      }
    });

    return corrections;
  },

  /**
   * Extrait les catégories potentielles d'une requête
   */
  extractCategories: (query: string): string[] => {
    const categoryMappings = {
      'electronique': ['telephone', 'iphone', 'samsung', 'ordinateur', 'laptop', 'tv', 'radio'],
      'vehicules': ['voiture', 'moto', 'vehicule', 'auto', 'scooter', 'camion'],
      'immobilier': ['maison', 'appartement', 'terrain', 'louer', 'vendre', 'location'],
      'mode': ['vetement', 'chaussure', 'sac', 'montre', 'bijoux'],
      'maison': ['meuble', 'cuisine', 'frigo', 'climatiseur', 'television']
    };

    const normalized = SearchUtils.normalizeQuery(query);
    const matchedCategories: string[] = [];

    Object.entries(categoryMappings).forEach(([category, keywords]) => {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        matchedCategories.push(category);
      }
    });

    return matchedCategories;
  }
};

/**
 * Hook personnalisé pour les analyses avancées de recherche
 * Principalement utilisé dans l'interface d'administration
 */
export const useSearchAnalytics = () => {
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsData, insightsData] = await Promise.all([
        SearchAnalyticsService.getSearchStats(timeRange),
        SearchAnalyticsService.getSearchInsights()
      ]);
      
      setStats(statsData);
      setInsights(insightsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des analytics';
      setError(errorMessage);
      console.error('Erreur analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportData = useCallback(async (startDate: string, endDate: string, format: 'csv' | 'json' = 'csv') => {
    try {
      const data = await SearchAnalyticsService.exportSearchData(startDate, endDate, format);
      
      // Créer et télécharger le fichier
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recherches_fasomarket_${startDate}_${endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      return false;
    }
  }, []);

  return {
    stats,
    insights,
    loading,
    error,
    loadAnalytics,
    exportData
  };
};

export default SearchAnalyticsService;