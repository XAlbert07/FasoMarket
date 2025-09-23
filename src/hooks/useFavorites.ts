import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Favorite } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const loadingRef = useRef(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user || loadingRef.current) return;
    loadingRef.current = true;
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
      toast({
        title: "Erreur",
        description: "Impossible de charger vos favoris",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const addToFavorites = async (listingId: string): Promise<void> => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si déjà en favoris
    const existingFavorite = favorites.find(fav => fav.listing_id === listingId);
    if (existingFavorite) {
      toast({
        title: "Déjà en favoris",
        description: "Cette annonce est déjà dans vos favoris"
      });
      return;
    }

    try {
      const { data: newFavorite, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          listing_id: listingId
        })
        .select(`
          *,
          listing:listings(*)
        `)
        .single();

      if (error) throw error;

      setFavorites(prev => [...prev, newFavorite]);
      toast({
        title: "Ajouté aux favoris",
        description: "L'annonce a été ajoutée à vos favoris"
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter aux favoris",
        variant: "destructive"
      });
    }
  };

  const removeFromFavorites = async (listingId: string): Promise<void> => {
    if (!user) return;

    const existingFavorite = favorites.find(fav => fav.listing_id === listingId);
    if (!existingFavorite) {
      toast({
        title: "Non trouvé",
        description: "Cette annonce n'est pas dans vos favoris"
      });
      return;
    }

    try {
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
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer des favoris",
        variant: "destructive"
      });
    }
  };

  const toggleFavorite = async (listingId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour gérer les favoris",
        variant: "destructive"
      });
      return false;
    }

    const existingFavorite = favorites.find(fav => fav.listing_id === listingId);
    
    if (existingFavorite) {
      await removeFromFavorites(listingId);
      return false;
    } else {
      await addToFavorites(listingId);
      return true;
    }
  };

  const isFavorite = (listingId: string): boolean => {
    return favorites.some(fav => fav.listing_id === listingId);
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refetch: fetchFavorites
  };
};