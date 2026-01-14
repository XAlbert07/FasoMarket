// hooks/useSellerProfile.ts 
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SellerProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  created_at: string;
  is_verified: boolean;
  total_listings: number;
  active_listings: number;
  total_sales?: number;
  response_rate: number;
  average_rating: number;
  total_reviews: number;
  phone?: string;
  email?: string;
}

export interface SellerStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  averageResponseTime: number;
  joinDate: string;
  lastActive: string;
}

export const useSellerProfile = (sellerId: string) => {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!sellerId) {
        setError('ID de vendeur requis');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Étape 1: Récupération du profil de base
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            bio,
            city,
            created_at,
            is_verified,
            response_rate,
            phone
          `)
          .eq('id', sellerId)
          .single();

        if (profileError) {
          throw new Error(`Erreur lors de la récupération du profil: ${profileError.message}`);
        }

        if (!profileData) {
          throw new Error('Profil vendeur introuvable');
        }

        // Récupération et calcul des notes depuis la table reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('seller_id', sellerId); 

        let averageRating = 0;
        let totalReviews = 0;

        if (!reviewsError && reviewsData && reviewsData.length > 0) {
          totalReviews = reviewsData.length;
          const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
          averageRating = Math.round((totalRating / totalReviews) * 10) / 10;
        }

        // Étape 2: Calcul des statistiques d'annonces
        const [activeListingsCount, totalListingsCount, soldListingsCount] = await Promise.all([
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', sellerId)
            .eq('status', 'active'),

          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', sellerId),

          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', sellerId)
            .eq('status', 'sold')
        ]);

        if (activeListingsCount.error || totalListingsCount.error || soldListingsCount.error) {
          console.warn('Erreur lors du calcul des statistiques:', {
            activeError: activeListingsCount.error,
            totalError: totalListingsCount.error,
            soldError: soldListingsCount.error
          });
        }

        // Étape 3: Construction du profil complet avec les notes calculées
        const completeProfile: SellerProfile = {
          ...profileData,
          total_listings: totalListingsCount.count || 0,
          active_listings: activeListingsCount.count || 0,
          total_sales: soldListingsCount.count || 0,
          average_rating: averageRating, 
          total_reviews: totalReviews,   
        };

        const calculatedStats: SellerStats = {
          totalListings: totalListingsCount.count || 0,
          activeListings: activeListingsCount.count || 0,
          soldListings: soldListingsCount.count || 0,
          averageResponseTime: calculateAverageResponseTime(profileData.response_rate || 0),
          joinDate: profileData.created_at,
          lastActive: await getLastActiveDate(sellerId)
        };

        setProfile(completeProfile);
        setStats(calculatedStats);

      } catch (err) {
        console.error('Erreur dans useSellerProfile:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setProfile(null);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, [sellerId]);

  const calculateAverageResponseTime = (responseRate: number): number => {
    if (responseRate >= 95) return 2;
    if (responseRate >= 90) return 4;
    if (responseRate >= 80) return 8;
    return 24;
  };

  const getLastActiveDate = async (sellerId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('created_at')
        .eq('user_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return new Date().toISOString();
      }

      return data.created_at;
    } catch {
      return new Date().toISOString();
    }
  };

  const refreshProfile = async () => {
    setLoading(true);
    const event = new CustomEvent('refreshSellerProfile');
    window.dispatchEvent(event);
  };

  return {
    profile,
    stats,
    loading,
    error,
    refreshProfile,
    isVerified: profile?.is_verified || false,
    hasGoodRating: (profile?.average_rating || 0) >= 4.0,
    isResponsive: (profile?.response_rate || 0) >= 90
  };
};

export const useSellerBasicInfo = (sellerId: string) => {
  const [basicInfo, setBasicInfo] = useState<{
    id: string;
    full_name: string;
    avatar_url?: string;
    is_verified: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBasicInfo = async () => {
      if (!sellerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, is_verified')
          .eq('id', sellerId)
          .single();

        if (error) throw error;
        setBasicInfo(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        setBasicInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBasicInfo();
  }, [sellerId]);

  return { basicInfo, loading, error };
};