import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Favorite } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listing:listings(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (listingId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris",
        variant: "destructive"
      });
      return false;
    }

    try {
      const existingFavorite = favorites.find(fav => fav.listing_id === listingId);

      if (existingFavorite) {
        // Supprimer des favoris
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existingFavorite.id);

        if (error) throw error;

        setFavorites(prev => prev.filter(fav => fav.id !== existingFavorite.id));
        
        toast({
          title: "Retiré des favoris",
          description: "L'annonce a été retirée de vos favoris"
        });
        
        return false;
      } else {
        // Ajouter aux favoris
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            listing_id: listingId
          })
          .select()
          .single();

        if (error) throw error;

        setFavorites(prev => [...prev, data]);
        
        toast({
          title: "Ajouté aux favoris",
          description: "L'annonce a été ajoutée à vos favoris"
        });
        
        return true;
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la gestion des favoris",
        variant: "destructive"
      });
      return false;
    }
  };

  const isFavorite = (listingId: string): boolean => {
    return favorites.some(fav => fav.listing_id === listingId);
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
};