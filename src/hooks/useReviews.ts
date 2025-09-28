// hooks/useReviews.ts 

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  reviewer_id: string;
  seller_id: string; 
  listing_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  is_verified_purchase?: boolean;
  helpful_votes?: number;
  reviewer?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  listing?: {
    id: string;
    title: string;
  };
}

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const { user } = useAuthContext();
  const { toast } = useToast();

  // Fonction pour récupérer les avis d'un utilisateur en tant que vendeur
  const fetchUserReviews = async (userId: string) => {
    setLoading(true);
    try {
      // Utiliser seller_id pour récupérer les avis reçus
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(
            id, 
            full_name,
            avatar_url
          ),
          listing:listings!listing_id(
            id, 
            title
          )
        `)
        .eq('seller_id', userId) 
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des avis:', error);
        throw error;
      }

      const reviewsData = data || [];
      setReviews(reviewsData);
      setTotalReviews(reviewsData.length);
      
      // Calculer la note moyenne
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((acc, review) => acc + (review.rating || 0), 0);
        const avgRating = Math.round((totalRating / reviewsData.length) * 10) / 10;
        setUserRating(avgRating);
      } else {
        setUserRating(0);
      }

      console.log('📊 Avis chargés pour l\'utilisateur:', {
        userId,
        totalReviews: reviewsData.length,
        averageRating: userRating
      });

    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
      setReviews([]);
      setUserRating(0);
      setTotalReviews(0);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour créer un nouvel avis
  const createReview = async (
    sellerId: string, 
    rating: number, 
    comment?: string, 
    listingId?: string
  ) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour laisser un avis",
        variant: "destructive"
      });
      return false;
    }

    if (user.id === sellerId) {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez pas vous évaluer vous-même",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // Vérifier si l'utilisateur a déjà laissé un avis pour cette annonce
      if (listingId) {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('reviewer_id', user.id)
          .eq('seller_id', sellerId)
          .eq('listing_id', listingId)
          .single();

        if (existingReview) {
          toast({
            title: "Avis déjà donné",
            description: "Vous avez déjà donné votre avis pour cette transaction",
            variant: "destructive"
          });
          return false;
        }
      }

      // Créer le nouvel avis
      const { error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: user.id,
          seller_id: sellerId, 
          listing_id: listingId,
          rating,
          comment: comment?.trim(),
          is_verified_purchase: false, 
          helpful_votes: 0
        });

      if (error) throw error;

      toast({
        title: "Avis ajouté",
        description: "Votre avis a été ajouté avec succès"
      });

      // Recharger les avis
      await fetchUserReviews(sellerId);
      return true;
      
    } catch (error) {
      console.error('Erreur lors de la création de l\'avis:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'avis",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les avis de l'utilisateur connecté automatiquement
  useEffect(() => {
    if (user?.id) {
      fetchUserReviews(user.id);
    }
  }, [user?.id]);

  return {
    reviews,
    userRating,
    totalReviews,
    loading,
    fetchUserReviews,
    createReview
  };
};