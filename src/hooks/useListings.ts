// ===============================================
// HOOK USELISTING CORRIGÉ - VERSION STABLE SANS CYCLES INFINIS
// ===============================================

import { useState, useEffect, useCallback } from 'react'; // Ajout de useCallback
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Listing, SearchFilters } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useListingViews } from '@/hooks/useListingViews';

/**
 * Hook principal pour la gestion des collections d'annonces
 * Version corrigée avec useCallback pour éviter les cycles infinis
 */
export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Utilisation de useCallback pour mémoriser fetchListings
  // Cette fonction ne sera recréée que si toast change (ce qui est rare)
  const fetchListings = useCallback(async (filters?: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Requête simple et sûre - comme dans votre version qui fonctionnait
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Application des filtres (inchangé)
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

      // CORRECTION : utilisation de views_count au lieu de views
      if (filters?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'views') {
        query = query.order('views_count', { ascending: false });
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
  }, [toast]); // Seule dépendance : toast

  // SOLUTION CRITIQUE : Utilisation de useCallback pour fetchUserListings
  // Cette fonction sera stable et ne causera plus de cycles infinis
  const fetchUserListings = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null); // Reset de l'erreur à chaque nouvelle tentative
    
    try {
      console.log("Début de fetchUserListings pour userId:", userId);
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Données récupérées:", data?.length || 0, "annonces");
      setListings(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      console.error("Erreur dans fetchUserListings:", err);
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: "Impossible de charger vos annonces",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // Seule dépendance : toast

  return {
    listings,
    loading,
    error,
    fetchListings,
    fetchUserListings
  };
};

/**
 * Hook pour une annonce individuelle - VERSION CORRIGÉE
 * Utilisation de useCallback pour éviter les problèmes de dépendances
 */
export const useListing = (id: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  
  // Intégration du nouveau système de vues
  const { recordView, getViewsCount, getViewsStats } = useListingViews();

  // Mémorisation de fetchListing pour éviter les re-créations inutiles
  const fetchListing = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // CORRECTION CRITIQUE : Retour à la requête simple qui fonctionnait
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Enrichissement optionnel des données
      let enrichedListing = data;

      try {
        // Récupération optionnelle des données du profil
        if (data.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, phone, email')
            .eq('id', data.user_id)
            .single();
          
          if (profileData) {
            enrichedListing.profiles = profileData;
          }
        }

        // Récupération optionnelle des données de catégorie
        if (data.category_id) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('name, icon, slug')
            .eq('id', data.category_id)
            .single();
          
          if (categoryData) {
            enrichedListing.categories = categoryData;
          }
        }
      } catch (enrichmentError) {
        console.warn('Impossible d\'enrichir les données de l\'annonce:', enrichmentError);
      }

      setListing(enrichedListing);

      // Enregistrement de la vue avec le nouveau système
      if (enrichedListing) {
        recordView(enrichedListing.id);
      }
    } catch (err) {
      console.error('Erreur détaillée lors de la récupération de l\'annonce:', err);
      setError(err instanceof Error ? err.message : 'Annonce introuvable');
    } finally {
      setLoading(false);
    }
  }, [id, recordView]); // Dépendances stables

  useEffect(() => {
    fetchListing();
  }, [fetchListing]); // Maintenant fetchListing est stable grâce à useCallback

  // Fonctions utilitaires mémorisées
  const refreshViewsCount = useCallback(async () => {
    if (listing?.id) {
      return await getViewsCount(listing.id);
    }
    return { count: 0, isLoading: false, error: null };
  }, [listing?.id, getViewsCount]);

  const getDetailedStats = useCallback(async () => {
    if (listing?.id) {
      return await getViewsStats(listing.id);
    }
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      registeredUserViews: 0,
      anonymousViews: 0,
      todayViews: 0
    };
  }, [listing?.id, getViewsStats]);

  return { 
    listing, 
    loading, 
    error, 
    refetch: fetchListing,
    refreshViewsCount,
    getDetailedStats,
    recordView: useCallback((listingId: string) => recordView(listingId), [recordView])
  };
};

/**
 * Hook de création/modification/suppression
 * Utilisation de useCallback pour les fonctions exposées
 */
export const useCreateListing = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const createListing = useCallback(async (listingData: any) => {
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
          title: listingData.title,
          description: listingData.description,
          price: listingData.price,
          category_id: listingData.category_id,
          location: listingData.location,
          condition: listingData.condition,
          contact_phone: listingData.phone,
          images: listingData.images,
          latitude: listingData.latitude,
          longitude: listingData.longitude,
          currency: listingData.currency,
          user_id: user.id,
          status: 'active',
          views_count: 0
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
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création de l'annonce";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      
      console.error('Erreur Supabase détaillée:', {
        error: err,
        userData: user,
        listingData: listingData
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]); // Dépendances stables

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>) => {
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
  }, [user?.id, toast]);

  const deleteListing = useCallback(async (id: string) => {
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
  }, [user?.id, toast]);

  return {
    createListing,
    updateListing,
    deleteListing,
    loading
  };
};