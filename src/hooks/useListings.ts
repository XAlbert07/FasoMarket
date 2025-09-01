import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Listing, SearchFilters, ListingView } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchListings = async (filters?: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.location) {
        query = query.eq('location', filters.location);
      }

      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }

      if (filters?.priceMin) {
        query = query.gte('price', filters.priceMin);
      }

      if (filters?.priceMax) {
        query = query.lte('price', filters.priceMax);
      }

      // Sort by price or views if specified
      if (filters?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'views') {
        query = query.order('views', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setListings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des annonces');
      toast({
        title: "Erreur",
        description: "Impossible de charger les annonces",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserListings = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  return {
    listings,
    loading,
    error,
    fetchListings,
    fetchUserListings
  };
};

export const useListing = (id: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setListing(data);

      // Enregistrer la vue
      if (data) {
        await recordView(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Annonce introuvable');
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (listingId: string) => {
    try {
      // Vérifier si l'utilisateur a déjà vu cette annonce récemment
      const { data: existingView } = await supabase
        .from('listing_views')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', user?.id || null)
        .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!existingView) {
        // Enregistrer la nouvelle vue
        await supabase.from('listing_views').insert({
          listing_id: listingId,
          user_id: user?.id || null,
          ip_address: 'unknown' // Vous pouvez obtenir l'IP réelle côté serveur
        });

        // Mettre à jour le compteur de vues
        await supabase.rpc('increment_listing_views', { listing_id: listingId });
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la vue:', err);
    }
  };

  return { listing, loading, error, refetch: fetchListing };
};

export const useCreateListing = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const createListing = async (listingData: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'views' | 'status'>) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une annonce",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          ...listingData,
          user_id: user.id,
          status: 'pending',
          views: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre annonce a été créée avec succès !",
      });

      return data;
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la création de l'annonce",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateListing = async (id: string, updates: Partial<Listing>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Annonce mise à jour avec succès !",
      });

      return data;
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la mise à jour",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteListing = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Annonce supprimée avec succès !",
      });

      return true;
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la suppression",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createListing,
    updateListing,
    deleteListing,
    loading
  };
};