import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  listing_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer?: {
    id: string;
    full_name: string;
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
  const { user } = useAuthContext();
  const { toast } = useToast();

  const fetchUserReviews = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(id, full_name),
          listing:listings(id, title)
        `)
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Calculer la note moyenne
      if (data && data.length > 0) {
        const avgRating = data.reduce((acc, review) => acc + review.rating, 0) / data.length;
        setUserRating(Math.round(avgRating * 10) / 10);
      } else {
        setUserRating(0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (
    reviewedUserId: string, 
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

    if (user.id === reviewedUserId) {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez pas vous évaluer vous-même",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // Vérifier si l'utilisateur a déjà laissé un avis pour cette transaction
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('reviewer_id', user.id)
        .eq('reviewed_user_id', reviewedUserId)
        .eq('listing_id', listingId || '')
        .single();

      if (existingReview) {
        toast({
          title: "Avis déjà donné",
          description: "Vous avez déjà donné votre avis pour cette transaction",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: user.id,
          reviewed_user_id: reviewedUserId,
          listing_id: listingId,
          rating,
          comment: comment?.trim()
        });

      if (error) throw error;

      toast({
        title: "Avis ajouté",
        description: "Votre avis a été ajouté avec succès"
      });

      // Recharger les avis
      await fetchUserReviews(reviewedUserId);
      return true;
    } catch (error) {
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

  return {
    reviews,
    userRating,
    loading,
    fetchUserReviews,
    createReview
  };
};