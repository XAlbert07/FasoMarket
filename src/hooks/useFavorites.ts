import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Favorite } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const enrichFavoritesBatch = async (favoritesData: any[]): Promise<Favorite[]> => {
  const listings = favoritesData.map(f => f.listing).filter(Boolean);
  if (listings.length === 0) return favoritesData;

  const userIds = [...new Set(listings.map((l: any) => l.user_id).filter(Boolean))];
  const categoryIds = [...new Set(listings.map((l: any) => l.category_id).filter(Boolean))];

  const [profilesRes, categoriesRes] = await Promise.all([
    userIds.length > 0
      ? supabase.from('profiles').select('id, full_name, phone, email, avatar_url, bio, location').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    categoryIds.length > 0
      ? supabase.from('categories').select('id, name, slug, icon, description').in('id', categoryIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  const profilesMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
  const categoriesMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c]));

  return favoritesData.map((fav: any) => {
    if (!fav.listing) return fav;
    const profile = profilesMap.get(fav.listing.user_id);
    const cat = categoriesMap.get(fav.listing.category_id);
    return {
      ...fav,
      listing: {
        ...fav.listing,
        profiles: profile || undefined,
        categories: cat || undefined,
        category: cat?.name || 'Non spécifiée'
      }
    };
  });
};

export const useFavorites = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading: loading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select(`*, listing:listings(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ? await enrichFavoritesBatch(data) : [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: user!.id, listing_id: listingId })
        .select(`*, listing:listings(*)`)
        .single();
      if (error) throw error;
      const enriched = await enrichFavoritesBatch([data]);
      return enriched[0];
    },
    onSuccess: (enriched) => {
      queryClient.setQueryData(['favorites', user?.id], (old: Favorite[] = []) => {
        if (old.some(f => f.listing_id === enriched.listing_id)) return old;
        return [enriched, ...old];
      });
      toast({ title: "Ajouté aux favoris", description: "L'annonce a été ajoutée à vos favoris" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter aux favoris", variant: "destructive" });
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const existing = favorites.find(f => f.listing_id === listingId);
      if (!existing) throw new Error('Not found');
      const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
      if (error) throw error;
      return listingId;
    },
    onSuccess: (listingId) => {
      queryClient.setQueryData(['favorites', user?.id], (old: Favorite[] = []) => {
        return old.filter(f => f.listing_id !== listingId);
      });
      toast({ title: "Retiré des favoris", description: "L'annonce a été retirée de vos favoris" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de retirer des favoris", variant: "destructive" });
    }
  });

  const toggleFavorite = async (listingId: string): Promise<boolean> => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour gérer les favoris", variant: "destructive" });
      return false;
    }
    const isFav = favorites.some(f => f.listing_id === listingId);
    if (isFav) {
      await removeMutation.mutateAsync(listingId);
      return false;
    } else {
      await addMutation.mutateAsync(listingId);
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
    addToFavorites: addMutation.mutateAsync,
    removeFromFavorites: removeMutation.mutateAsync,
    isFavorite,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] })
  };
};
