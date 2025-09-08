// hooks/useSellerReviews.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Interface pour un avis complet sur un vendeur
// Cette structure capture toutes les informations nécessaires pour afficher un avis utile
export interface SellerReview {
  id: string;
  rating: number; // Note de 1 à 5 étoiles
  comment: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  listing_id: string;
  listing_title: string;
  created_at: string;
  updated_at?: string;
  is_verified_purchase: boolean; // True si l'achat a été confirmé
  helpful_votes: number; // Nombre de personnes qui ont trouvé l'avis utile
  response?: SellerResponse; // Réponse optionnelle du vendeur
}

// Interface pour la réponse d'un vendeur à un avis
export interface SellerResponse {
  id: string;
  message: string;
  created_at: string;
  updated_at?: string;
}

// Interface pour les statistiques détaillées des avis
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
  responseRate: number; // Pourcentage d'avis auxquels le vendeur a répondu
  recentTrend: 'improving' | 'declining' | 'stable'; // Tendance récente des notes
}

// Interface pour les filtres d'avis
export interface ReviewsFilters {
  rating?: number; // Filtrer par nombre d'étoiles spécifique
  verified_only?: boolean; // Ne montrer que les achats vérifiés
  with_comments?: boolean; // Ne montrer que les avis avec commentaires
  sort_by?: 'created_at' | 'rating' | 'helpful_votes';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Hook principal pour gérer les avis d'un vendeur
export const useSellerReviews = (sellerId: string, initialFilters?: ReviewsFilters) => {
  // États pour gérer les données et l'interface utilisateur
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

  // Fonction pour calculer les statistiques des avis
  const calculateReviewsStats = useCallback((reviewsData: SellerReview[]): ReviewsStats => {
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

    // Calcul de la distribution des notes
    const ratingDistribution = reviewsData.reduce((dist, review) => {
      dist[review.rating as keyof typeof dist]++;
      return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    // Calcul des achats vérifiés
    const verifiedPurchasesCount = reviewsData.filter(r => r.is_verified_purchase).length;

    // Calcul du taux de réponse du vendeur
    const reviewsWithResponses = reviewsData.filter(r => r.response).length;
    const responseRate = Math.round((reviewsWithResponses / reviewsData.length) * 100);

    // Calcul de la tendance récente (sur les 10 derniers avis)
    const recentReviews = reviewsData.slice(0, 10);
    const olderReviews = reviewsData.slice(10, 20);
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';

    if (recentReviews.length >= 5 && olderReviews.length >= 5) {
      const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
      const olderAvg = olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length;
      
      if (recentAvg > olderAvg + 0.3) recentTrend = 'improving';
      else if (recentAvg < olderAvg - 0.3) recentTrend = 'declining';
    }

    return {
      totalReviews: reviewsData.length,
      averageRating,
      ratingDistribution,
      verifiedPurchasesCount,
      responseRate,
      recentTrend
    };
  }, []);

  // Fonction principale pour récupérer les avis avec filtres
  const fetchReviews = useCallback(async (currentFilters: ReviewsFilters) => {
    if (!sellerId) {
      setError('ID de vendeur requis');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Première requête : récupérer tous les avis pour calculer les statistiques
      const { data: allReviewsData, error: statsError } = await supabase
        .from('reviews')
        .select(`
          rating,
          is_verified_purchase,
          seller_responses(id)
        `)
        .eq('seller_id', sellerId);

      if (statsError) {
        throw new Error(`Erreur lors du calcul des statistiques: ${statsError.message}`);
      }

      // Calcul des statistiques avec toutes les données
      const calculatedStats = calculateReviewsStats(allReviewsData?.map(item => ({
        id: '',
        rating: item.rating,
        comment: '',
        reviewer_id: '',
        reviewer_name: '',
        listing_id: '',
        listing_title: '',
        created_at: '',
        is_verified_purchase: item.is_verified_purchase,
        helpful_votes: 0,
        response: item.seller_responses?.[0] ? {
          id: item.seller_responses[0].id,
          message: '',
          created_at: ''
        } : undefined
      })) || []);

      setStats(calculatedStats);

      // Deuxième requête : récupérer les avis détaillés avec filtres et pagination
      let detailQuery = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          reviewer_id,
          listing_id,
          created_at,
          updated_at,
          is_verified_purchase,
          helpful_votes,
          reviewer:profiles!reviewer_id(
            full_name,
            avatar_url
          ),
          listing:listings!listing_id(
            title
          ),
          seller_responses(
            id,
            message,
            created_at,
            updated_at
          )
        `)
        .eq('seller_id', sellerId);

      // Application des filtres
      if (currentFilters.rating) {
        detailQuery = detailQuery.eq('rating', currentFilters.rating);
      }

      if (currentFilters.verified_only) {
        detailQuery = detailQuery.eq('is_verified_purchase', true);
      }

      if (currentFilters.with_comments) {
        detailQuery = detailQuery.neq('comment', '');
      }

      // Application du tri
      const sortField = currentFilters.sort_by || 'created_at';
      const sortOrder = currentFilters.sort_order || 'desc';
      detailQuery = detailQuery.order(sortField, { ascending: sortOrder === 'asc' });

      // Application de la pagination
      const limit = currentFilters.limit || 10;
      const offset = currentFilters.offset || 0;
      detailQuery = detailQuery.range(offset, offset + limit - 1);

      const { data: reviewsData, error: reviewsError } = await detailQuery;

      if (reviewsError) {
        throw new Error(`Erreur lors de la récupération des avis: ${reviewsError.message}`);
      }

      // Transformation des données pour correspondre à notre interface
      const transformedReviews: SellerReview[] = (reviewsData || []).map(item => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment || '',
        reviewer_id: item.reviewer_id,
        reviewer_name: item.reviewer?.full_name || 'Acheteur anonyme',
        reviewer_avatar: item.reviewer?.avatar_url,
        listing_id: item.listing_id,
        listing_title: item.listing?.title || 'Article supprimé',
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_verified_purchase: item.is_verified_purchase,
        helpful_votes: item.helpful_votes || 0,
        response: item.seller_responses?.[0] ? {
          id: item.seller_responses[0].id,
          message: item.seller_responses[0].message,
          created_at: item.seller_responses[0].created_at,
          updated_at: item.seller_responses[0].updated_at
        } : undefined
      }));

      setReviews(transformedReviews);

    } catch (err) {
      console.error('Erreur dans useSellerReviews:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
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
      offset: 0 // Reset à la première page lors d'un changement de filtre
    }));
  }, []);

  // Fonction pour charger plus d'avis (pagination infinie)
  const loadMoreReviews = useCallback(async () => {
    if (loading) return;

    const currentOffset = filters.offset || 0;
    const limit = filters.limit || 10;
    
    try {
      setLoading(true);

      let query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          reviewer_id,
          listing_id,
          created_at,
          updated_at,
          is_verified_purchase,
          helpful_votes,
          reviewer:profiles!reviewer_id(
            full_name,
            avatar_url
          ),
          listing:listings!listing_id(
            title
          ),
          seller_responses(
            id,
            message,
            created_at,
            updated_at
          )
        `)
        .eq('seller_id', sellerId);

      // Application des mêmes filtres
      if (filters.rating) {
        query = query.eq('rating', filters.rating);
      }

      if (filters.verified_only) {
        query = query.eq('is_verified_purchase', true);
      }

      if (filters.with_comments) {
        query = query.neq('comment', '');
      }

      query = query
        .order(filters.sort_by || 'created_at', { ascending: filters.sort_order === 'asc' })
        .range(currentOffset + limit, currentOffset + limit * 2 - 1);

      const { data, error } = await query;

      if (error) throw error;

      const newReviews: SellerReview[] = (data || []).map(item => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment || '',
        reviewer_id: item.reviewer_id,
        reviewer_name: item.reviewer?.full_name || 'Acheteur anonyme',
        reviewer_avatar: item.reviewer?.avatar_url,
        listing_id: item.listing_id,
        listing_title: item.listing?.title || 'Article supprimé',
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_verified_purchase: item.is_verified_purchase,
        helpful_votes: item.helpful_votes || 0,
        response: item.seller_responses?.[0] ? {
          id: item.seller_responses[0].id,
          message: item.seller_responses[0].message,
          created_at: item.seller_responses[0].created_at,
          updated_at: item.seller_responses[0].updated_at
        } : undefined
      }));

      // Ajouter les nouveaux avis à la liste existante
      setReviews(prev => [...prev, ...newReviews]);
      
      // Mettre à jour l'offset pour le prochain chargement
      setFilters(prev => ({
        ...prev,
        offset: currentOffset + limit
      }));

    } catch (err) {
      console.error('Erreur lors du chargement de plus d\'avis:', err);
    } finally {
      setLoading(false);
    }
  }, [sellerId, filters, loading]);

  // Fonction pour marquer un avis comme utile
  const markReviewAsHelpful = useCallback(async (reviewId: string) => {
    try {
      const { error } = await supabase.rpc('increment_helpful_votes', {
        review_id: reviewId
      });

      if (error) throw error;

      // Mettre à jour localement le compteur
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful_votes: review.helpful_votes + 1 }
          : review
      ));

    } catch (err) {
      console.error('Erreur lors du marquage comme utile:', err);
    }
  }, []);

  // Fonction pour rafraîchir tous les avis
  const refreshReviews = useCallback(() => {
    setFilters(prev => ({ ...prev, offset: 0 }));
    fetchReviews({ ...filters, offset: 0 });
  }, [fetchReviews, filters]);

  // Fonction pour obtenir les avis récents (utile pour les notifications)
  const getRecentReviews = useCallback((days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return reviews.filter(review => 
      new Date(review.created_at) > cutoffDate
    );
  }, [reviews]);

  // Interface publique du hook
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
    markReviewAsHelpful,

    // Fonctions utilitaires
    getRecentReviews,
    isEmpty: reviews.length === 0 && !loading,
    hasResults: reviews.length > 0,
    canLoadMore: reviews.length < (stats?.totalReviews || 0)
  };
};

// Hook spécialisé pour obtenir uniquement les statistiques (version légère)
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
        
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            rating,
            is_verified_purchase,
            created_at,
            seller_responses(id)
          `)
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Calcul des statistiques simplifiées
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

        const totalReviews = data.length;
        const averageRating = Math.round((data.reduce((sum, item) => sum + item.rating, 0) / totalReviews) * 10) / 10;
        
        const ratingDistribution = data.reduce((dist, item) => {
          dist[item.rating as keyof typeof dist]++;
          return dist;
        }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

        const verifiedPurchasesCount = data.filter(item => item.is_verified_purchase).length;
        const responseRate = Math.round((data.filter(item => item.seller_responses.length > 0).length / totalReviews) * 100);

        setStats({
          totalReviews,
          averageRating,
          ratingDistribution,
          verifiedPurchasesCount,
          responseRate,
          recentTrend: 'stable' // Calcul simplifié
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [sellerId]);

  return { stats, loading, error };
};