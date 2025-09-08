// hooks/useSellerReviews.ts
// Version adaptée à votre structure de base de données existante

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Interface simplifiée correspondant à votre structure réelle
export interface SellerReview {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  listing_id: string;
  listing_title: string;
  created_at: string;
  is_verified_purchase: boolean;
  helpful_votes: number;
  response?: SellerResponse; // Optionnel car peut ne pas exister
}

// Interface pour les réponses de vendeur (si votre table seller_responses existe)
export interface SellerResponse {
  id: string;
  message: string;
  created_at: string;
}

// Interface pour les statistiques - adaptée à vos données
export interface ReviewsStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verifiedPurchasesCount: number;
  responseRate: number;
  recentTrend: 'improving' | 'declining' | 'stable';
}

// Interface pour les filtres - simplifiée
export interface ReviewsFilters {
  rating?: number;
  verified_only?: boolean;
  with_comments?: boolean;
  sort_by?: 'created_at' | 'rating' | 'helpful_votes';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Hook principal adapté à votre structure de base de données
export const useSellerReviews = (sellerId: string, initialFilters?: ReviewsFilters) => {
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [stats, setStats] = useState<ReviewsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewsFilters>({
    sort_by: 'created_at',
    sort_order: 'desc',
    limit: 10,
    offset: 0,
    ...initialFilters
  });

  // Fonction pour calculer les statistiques avec vos données réelles
  const calculateReviewsStats = useCallback((reviewsData: any[]): ReviewsStats => {
    if (reviewsData.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verifiedPurchasesCount: 0,
        responseRate: 0,
        recentTrend: 'stable'
      };
    }

    // Calcul de la note moyenne
    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviewsData.length) * 10) / 10;

    // Distribution des notes
    const ratingDistribution = reviewsData.reduce((dist, review) => {
      dist[review.rating as keyof typeof dist]++;
      return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    // Achats vérifiés
    const verifiedPurchasesCount = reviewsData.filter(r => r.is_verified_purchase).length;

    // Calcul simplifié du taux de réponse (basé sur seller_responses si disponible)
    const reviewsWithResponses = reviewsData.filter(r => r.seller_responses && r.seller_responses.length > 0).length;
    const responseRate = reviewsData.length > 0 ? Math.round((reviewsWithResponses / reviewsData.length) * 100) : 0;

    return {
      totalReviews: reviewsData.length,
      averageRating,
      ratingDistribution,
      verifiedPurchasesCount,
      responseRate,
      recentTrend: 'stable' // Calcul simplifié pour l'instant
    };
  }, []);

  // Fonction principale pour récupérer les avis - adaptée à votre structure
  const fetchReviews = useCallback(async (currentFilters: ReviewsFilters) => {
    if (!sellerId) {
      setError('ID de vendeur requis');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Récupération des avis pour le vendeur:', sellerId);

      // Requête adaptée à votre structure de base de données réelle
      let query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          reviewer_id,
          listing_id,
          created_at,
          is_verified_purchase,
          helpful_votes,
          profiles!reviewer_id(
            full_name,
            avatar_url
          ),
          listings!listing_id(
            title
          ),
          seller_responses(
            id,
            message,
            created_at
          )
        `)
        .eq('seller_id', sellerId);

      // Application des filtres
      if (currentFilters.rating) {
        query = query.eq('rating', currentFilters.rating);
      }

      if (currentFilters.verified_only) {
        query = query.eq('is_verified_purchase', true);
      }

      if (currentFilters.with_comments) {
        query = query.not('comment', 'is', null);
        query = query.neq('comment', '');
      }

      // Tri
      const sortField = currentFilters.sort_by || 'created_at';
      const sortOrder = currentFilters.sort_order || 'desc';
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Pagination
      const limit = currentFilters.limit || 10;
      const offset = currentFilters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      console.log('Exécution de la requête...');
      const { data: reviewsData, error: reviewsError } = await query;

      if (reviewsError) {
        console.error('Erreur Supabase:', reviewsError);
        throw new Error(`Erreur lors de la récupération des avis: ${reviewsError.message}`);
      }

      console.log('Données reçues:', reviewsData);

      // Transformation des données selon votre structure
      const transformedReviews: SellerReview[] = (reviewsData || []).map(item => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment || '',
        reviewer_id: item.reviewer_id,
        reviewer_name: item.profiles?.full_name || 'Acheteur anonyme',
        reviewer_avatar: item.profiles?.avatar_url,
        listing_id: item.listing_id,
        listing_title: item.listings?.title || 'Article supprimé',
        created_at: item.created_at,
        is_verified_purchase: item.is_verified_purchase || false,
        helpful_votes: item.helpful_votes || 0,
        response: item.seller_responses?.[0] ? {
          id: item.seller_responses[0].id,
          message: item.seller_responses[0].message,
          created_at: item.seller_responses[0].created_at
        } : undefined
      }));

      setReviews(transformedReviews);

      // Calcul des statistiques avec les données transformées
      const calculatedStats = calculateReviewsStats(reviewsData || []);
      setStats(calculatedStats);

      console.log('Avis traités:', transformedReviews.length);
      console.log('Statistiques:', calculatedStats);

    } catch (err) {
      console.error('Erreur dans useSellerReviews:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue lors du chargement des avis');
      setReviews([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [sellerId, calculateReviewsStats]);

  // Effet pour charger les avis quand les filtres changent
  useEffect(() => {
    fetchReviews(filters);
  }, [fetchReviews, filters]);

  // Fonction pour mettre à jour les filtres
  const updateFilters = useCallback((newFilters: Partial<ReviewsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset à la première page
    }));
  }, []);

  // Fonction pour rafraîchir les avis
  const refreshReviews = useCallback(() => {
    setFilters(prev => ({ ...prev, offset: 0 }));
    fetchReviews({ ...filters, offset: 0 });
  }, [fetchReviews, filters]);

  // Fonction pour charger plus d'avis
  const loadMoreReviews = useCallback(async () => {
    if (loading) return;

    const currentOffset = filters.offset || 0;
    const limit = filters.limit || 10;
    
    setFilters(prev => ({
      ...prev,
      offset: currentOffset + limit
    }));
  }, [filters, loading]);

  return {
    // Données principales
    reviews,
    stats,
    loading,
    error,

    // Filtres actuels
    currentFilters: filters,

    // Fonctions de manipulation
    updateFilters,
    refreshReviews,
    loadMoreReviews,

    // Fonctions utilitaires
    isEmpty: reviews.length === 0 && !loading,
    hasResults: reviews.length > 0,
    canLoadMore: reviews.length < (stats?.totalReviews || 0)
  };
};

// Hook léger pour obtenir uniquement les statistiques
export const useSellerReviewsStats = (sellerId: string) => {
  const [stats, setStats] = useState<ReviewsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!sellerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log('Récupération des statistiques pour:', sellerId);

        // Requête simplifiée pour les statistiques seulement
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            rating,
            is_verified_purchase,
            created_at,
            seller_responses(id)
          `)
          .eq('seller_id', sellerId);

        if (error) {
          console.error('Erreur lors du chargement des stats:', error);
          throw error;
        }

        console.log('Données statistiques reçues:', data);

        if (!data || data.length === 0) {
          setStats({
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            verifiedPurchasesCount: 0,
            responseRate: 0,
            recentTrend: 'stable'
          });
          return;
        }

        // Calcul des statistiques
        const totalReviews = data.length;
        const averageRating = Math.round((data.reduce((sum, item) => sum + item.rating, 0) / totalReviews) * 10) / 10;
        
        const ratingDistribution = data.reduce((dist, item) => {
          dist[item.rating as keyof typeof dist]++;
          return dist;
        }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

        const verifiedPurchasesCount = data.filter(item => item.is_verified_purchase).length;
        const responseRate = Math.round((data.filter(item => item.seller_responses && item.seller_responses.length > 0).length / totalReviews) * 100);

        const calculatedStats = {
          totalReviews,
          averageRating,
          ratingDistribution,
          verifiedPurchasesCount,
          responseRate,
          recentTrend: 'stable' as const
        };

        console.log('Statistiques calculées:', calculatedStats);
        setStats(calculatedStats);
        setError(null);
      } catch (err) {
        console.error('Erreur dans useSellerReviewsStats:', err);
        setError(err instanceof Error ? err.message : 'Erreur de chargement des statistiques');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [sellerId]);

  return { stats, loading, error };
};