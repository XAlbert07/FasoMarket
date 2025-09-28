// hooks/useSellerReviews.ts 

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
  response?: SellerResponse;
}

export interface SellerResponse {
  id: string;
  message: string;
  created_at: string;
}

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

export interface ReviewsFilters {
  rating?: number;
  verified_only?: boolean;
  with_comments?: boolean;
  sort_by?: 'created_at' | 'rating' | 'helpful_votes';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

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

    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviewsData.length) * 10) / 10;

    const ratingDistribution = reviewsData.reduce((dist, review) => {
      dist[review.rating as keyof typeof dist]++;
      return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    const verifiedPurchasesCount = reviewsData.filter(r => r.is_verified_purchase).length;
    const reviewsWithResponses = reviewsData.filter(r => r.seller_responses && r.seller_responses.length > 0).length;
    const responseRate = reviewsData.length > 0 ? Math.round((reviewsWithResponses / reviewsData.length) * 100) : 0;

    return {
      totalReviews: reviewsData.length,
      averageRating,
      ratingDistribution,
      verifiedPurchasesCount,
      responseRate,
      recentTrend: 'stable'
    };
  }, []);

  const fetchReviews = useCallback(async (currentFilters: ReviewsFilters) => {
    if (!sellerId) {
      setError('ID de vendeur requis');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Récupération des avis pour le vendeur:', sellerId);

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

      console.log('🚀 Exécution de la requête...');
      const { data: reviewsData, error: reviewsError } = await query;

      if (reviewsError) {
        console.error('❌ Erreur Supabase:', reviewsError);
        throw new Error(`Erreur lors de la récupération des avis: ${reviewsError.message}`);
      }

      console.log('✅ Données reçues:', reviewsData?.length, 'avis');
      console.log('📋 Premier avis exemple:', reviewsData?.[0]);

      const transformedReviews: SellerReview[] = (reviewsData || []).map(item => {
        // Gestion des données relationnelles avec vérification des types
        const reviewerData = Array.isArray(item.reviewer) ? item.reviewer[0] : item.reviewer;
        const listingData = Array.isArray(item.listing) ? item.listing[0] : item.listing;
        
        return {
          id: item.id,
          rating: item.rating,
          comment: item.comment || '',
          reviewer_id: item.reviewer_id,
          reviewer_name: reviewerData?.full_name || 'Acheteur anonyme',
          reviewer_avatar: reviewerData?.avatar_url,
          listing_id: item.listing_id,
          listing_title: listingData?.title || 'Article supprimé',
          created_at: item.created_at,
          is_verified_purchase: item.is_verified_purchase || false,
          helpful_votes: item.helpful_votes || 0,
          response: item.seller_responses && item.seller_responses.length > 0 ? {
            id: item.seller_responses[0].id,
            message: item.seller_responses[0].message,
            created_at: item.seller_responses[0].created_at
          } : undefined
        };
      });

      setReviews(transformedReviews);

      const calculatedStats = calculateReviewsStats(reviewsData || []);
      setStats(calculatedStats);

      console.log('✨ Avis traités:', transformedReviews.length);
      console.log('📊 Statistiques:', calculatedStats);

    } catch (err) {
      console.error('💥 Erreur dans useSellerReviews:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue lors du chargement des avis');
      setReviews([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [sellerId, calculateReviewsStats]);

  useEffect(() => {
    fetchReviews(filters);
  }, [fetchReviews, filters]);

  const updateFilters = useCallback((newFilters: Partial<ReviewsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0
    }));
  }, []);

  const refreshReviews = useCallback(() => {
    setFilters(prev => ({ ...prev, offset: 0 }));
    fetchReviews({ ...filters, offset: 0 });
  }, [fetchReviews, filters]);

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
    reviews,
    stats,
    loading,
    error,
    currentFilters: filters,
    updateFilters,
    refreshReviews,
    loadMoreReviews,
    isEmpty: reviews.length === 0 && !loading,
    hasResults: reviews.length > 0,
    canLoadMore: reviews.length < (stats?.totalReviews || 0)
  };
};

export const useSellerReviewsSimple = (sellerId: string) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimple = async () => {
      if (!sellerId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Test simple pour sellerId:', sellerId);
        
        // Requête ultra-simple pour tester
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('seller_id', sellerId);

        console.log('📊 Résultats bruts:', data);
        console.log('❌ Erreur éventuelle:', error);

        if (error) throw error;
        
        setReviews(data || []);
        setError(null);
      } catch (err) {
        console.error('💥 Erreur simple:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimple();
  }, [sellerId]);

  return { reviews, loading, error };
};