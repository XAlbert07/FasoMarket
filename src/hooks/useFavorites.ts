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
  
  // ✅ Utilisation d'une ref pour éviter les requêtes concurrentes
  const loadingRef = useRef(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      // ✅ Reset des favoris quand l'utilisateur se déconnecte
      setFavorites([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user || loadingRef.current) return; // ✅ Évite les appels concurrents

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
      // ✅ Optionnel: afficher un toast d'erreur pour informer l'utilisateur
      toast({
        title: "Erreur",
        description: "Impossible de charger vos favoris",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      loadingRef.current = false; // ✅ Libère le verrou
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

        // ✅ Mise à jour optimiste de l'état local
        setFavorites(prev => prev.filter(fav => fav.id !== existingFavorite.id));
        
        toast({
          title: "Retiré des favoris",
          description: "L'annonce a été retirée de vos favoris"
        });
        
        return false;
      } else {
        // Ajouter aux favoris - nous avons besoin des données complètes
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

        // ✅ Mise à jour optimiste avec les données complètes
        setFavorites(prev => [...prev, newFavorite]);
        
        toast({
          title: "Ajouté aux favoris",
          description: "L'annonce a été ajoutée à vos favoris"
        });
        
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
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