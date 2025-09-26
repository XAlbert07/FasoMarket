// hooks/useListings.ts - VERSION ÉTENDUE POUR MyListings.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Listing, SearchFilters } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useListingViews } from '@/hooks/useListingViews';

/**
 * Interface étendue pour le hook useListings
 * Inclut toutes les propriétés requises par MyListings.tsx
 */
export interface UseListingsReturn {
  // Propriétés de base existantes
  listings: Listing[];
  loading: boolean;
  error: string | null;
  
  // Propriétés manquantes requises par MyListings.tsx
  dataSource: Listing[];        // Alias ou vue filtrée des listings
  soldListings: Listing[];      // Annonces vendues
  draftListings: Listing[];     // Annonces en brouillon
  
  // Fonctions existantes
  fetchListings: (filters?: SearchFilters) => Promise<void>;
  fetchListingsSimple: (filters?: SearchFilters) => Promise<void>;
  fetchUserListings: (userId: string) => Promise<void>;
  
  // Fonction manquante
  clearListings: () => void;    // Fonction pour vider les listings
  
  // Fonctions additionnelles utiles
  refreshListings: () => Promise<void>;
  filterByStatus: (status: string) => Listing[];
}

/**
 * Hook principal pour la gestion des collections d'annonces
 * VERSION ÉTENDUE - Compatible avec MyListings.tsx
 */
export const useListings = (): UseListingsReturn => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fonction pour vider la liste des annonces
   * NOUVELLE PROPRIÉTÉ REQUISE
   */
  const clearListings = useCallback(() => {
    setListings([]);
    setError(null);
    setLastUserId(null);
  }, []);

  /**
   * Calculs en temps réel des listes catégorisées
   * NOUVELLES PROPRIÉTÉS CALCULÉES
   */
  const dataSource = useMemo(() => listings, [listings]);
  
  const soldListings = useMemo(() => 
    listings.filter(listing => listing.status === 'sold'),
    [listings]
  );
  
  const draftListings = useMemo(() => 
    listings.filter(listing => 
      !listing.status || 
      listing.status === 'expired' ||
      listing.status === 'suspended'
    ),
    [listings]
  );

  /**
   * Fonction utilitaire pour filtrer par statut
   */
  const filterByStatus = useCallback((status: string) => {
    return listings.filter(listing => listing.status === status);
  }, [listings]);

  /**
   * Fonction pour actualiser les données
   */
  const refreshListings = useCallback(async () => {
    if (lastUserId) {
      await fetchUserListings(lastUserId);
    }
  }, [lastUserId]);

  /**
   * Fonction pour résoudre l'ID d'une catégorie à partir de son nom
   * CODE EXISTANT MAINTENU
   */
  const resolveCategoryId = useCallback(async (categoryName: string): Promise<string | null> => {
    try {
      console.log(`Recherche de l'ID pour la catégorie: "${categoryName}"`);
      
      let { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('name', categoryName)
        .single();

      if (data && !error && data.name) {
        console.log(`Catégorie trouvée par nom exact: ${data.id} (${data.name})`);
        return data.id;
      }

      const slug = categoryName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');

      ({ data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', slug)
        .single());

      if (data && !error && data.name) {
        console.log(`Catégorie trouvée par slug: ${data.id} (${data.name})`);
        return data.id;
      }

      ({ data, error } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', `%${categoryName}%`)
        .limit(1)
        .single());

      if (data && !error && data.name) {
        console.log(`Catégorie trouvée par recherche floue: ${data.id} (${data.name})`);
        return data.id;
      }

      console.warn(`Aucune catégorie trouvée pour: "${categoryName}"`);
      return null;
    } catch (err) {
      console.error(`Erreur lors de la résolution de la catégorie "${categoryName}":`, err);
      return null;
    }
  }, []);

  /**
   * Fonction pour enrichir une annonce avec les données des tables liées
   * CODE EXISTANT MAINTENU
   */
  const enrichListing = useCallback(async (listing: any): Promise<Listing> => {
    let enrichedListing: Listing = {
      ...listing,
      profiles: undefined,
      categories: undefined,
      category: undefined
    };

    try {
      if (listing.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email, avatar_url, bio, location')
          .eq('id', listing.user_id)
          .single();
        
        if (profileData && !profileError) {
          enrichedListing.profiles = {
            id: profileData.id,
            full_name: profileData.full_name,
            phone: profileData.phone,
            email: profileData.email,
            avatar_url: profileData.avatar_url,
            bio: profileData.bio,
            location: profileData.location
          };
        }
      }

      if (listing.category_id) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name, slug, icon, description')
          .eq('id', listing.category_id)
          .single();
        
        if (categoryData && !categoryError) {
          enrichedListing.categories = {
            id: categoryData.id,
            name: categoryData.name,
            slug: categoryData.slug,
            icon: categoryData.icon,
            description: categoryData.description
          };
          enrichedListing.category = categoryData.name;
        }
      }

      if (!enrichedListing.category) {
        enrichedListing.category = 'Catégorie inconnue';
      }

    } catch (enrichmentError) {
      console.warn('Impossible d\'enrichir les données de l\'annonce:', enrichmentError);
      enrichedListing.category = 'Catégorie inconnue';
    }

    return enrichedListing;
  }, []);

  /**
   * Fonction principale de récupération des annonces
   * CODE EXISTANT MAINTENU
   */
  const fetchListings = useCallback(async (filters?: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Début de fetchListings avec filtres:', filters);

      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        console.log(`Filtrage par catégorie: "${filters.category}"`);
        
        const categoryId = await resolveCategoryId(filters.category);
        
        if (categoryId) {
          console.log(`ID de catégorie résolu: ${categoryId}`);
          query = query.eq('category_id', categoryId);
        } else {
          console.warn(`Catégorie "${filters.category}" introuvable.`);
          setListings([]);
          setLoading(false);
          return;
        }
      }

      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
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

      if (filters?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'views') {
        query = query.order('views_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log(`Requête réussie: ${data?.length || 0} annonces trouvées`);

      const enrichedListings: Listing[] = [];
      if (data) {
        for (const listing of data) {
          const enrichedListing = await enrichListing(listing);
          enrichedListings.push(enrichedListing);
        }
      }

      setListings(enrichedListings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des annonces';
      console.error('Erreur complète dans fetchListings:', err);
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les annonces. Vérifiez votre connexion internet.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, resolveCategoryId, enrichListing]);

  /**
   * Version simple sans enrichissement
   * CODE EXISTANT MAINTENU
   */
  const fetchListingsSimple = useCallback(async (filters?: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Début de fetchListingsSimple avec filtres:', filters);

      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
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

      if (filters?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'views') {
        query = query.order('views_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log(`Requête simple réussie: ${data?.length || 0} annonces trouvées`);

      const processedListings: Listing[] = (data || []).map(listing => ({
        ...listing,
        category: 'Non spécifiée',
        profiles: undefined,
        categories: undefined
      }));

      setListings(processedListings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des annonces';
      console.error('Erreur complète dans fetchListingsSimple:', err);
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les annonces. Vérifiez votre connexion internet.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Fonction pour récupérer les annonces d'un utilisateur spécifique
   * CODE EXISTANT AVEC AJOUT DU TRACKING DE L'UTILISATEUR
   */
  const fetchUserListings = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    setLastUserId(userId); // NOUVEAU: Sauvegarder l'userId pour refreshListings
    
    try {
      console.log("Début de fetchUserListings pour userId:", userId);
      
      // MODIFICATION: Récupérer TOUS les statuts pour MyListings, pas seulement 'active'
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Données récupérées:", data?.length || 0, "annonces");
      
      const processedListings: Listing[] = (data || []).map(listing => ({
        ...listing,
        category: 'Non spécifiée',
        profiles: undefined,
        categories: undefined
      }));
      
      setListings(processedListings);
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
  }, [toast]);

  // RETOUR ÉTENDU AVEC TOUTES LES PROPRIÉTÉS REQUISES
  return {
    // Propriétés de base
    listings,
    loading,
    error,
    
    // Propriétés calculées requises par MyListings.tsx
    dataSource,
    soldListings,
    draftListings,
    
    // Fonctions existantes
    fetchListings,
    fetchListingsSimple,
    fetchUserListings,
    
    // Nouvelles fonctions
    clearListings,
    refreshListings,
    filterByStatus
  };
};

/**
 * Hook pour une annonce individuelle - VERSION MAINTENUE
 */
export const useListing = (id: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  
  const { recordView, getViewsCount, getViewsStats } = useListingViews();

  const fetchListing = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Récupération de l'annonce: ${id}`);
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération:', error);
        throw error;
      }

      let enrichedListing: Listing = {
        ...data,
        profiles: undefined,
        categories: undefined,
        category: 'Catégorie inconnue'
      };

      try {
        if (data.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, phone, email, avatar_url, bio, location')
            .eq('id', data.user_id)
            .single();
          
          if (profileData) {
            enrichedListing.profiles = {
              id: profileData.id,
              full_name: profileData.full_name,
              phone: profileData.phone,
              email: profileData.email,
              avatar_url: profileData.avatar_url,
              bio: profileData.bio,
              location: profileData.location
            };
          }
        }

        if (data.category_id) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id, name, icon, slug, description')
            .eq('id', data.category_id)
            .single();
          
          if (categoryData) {
            enrichedListing.categories = {
              id: categoryData.id,
              name: categoryData.name,
              slug: categoryData.slug,
              icon: categoryData.icon,
              description: categoryData.description
            };
            enrichedListing.category = categoryData.name;
          }
        }

      } catch (enrichmentError) {
        console.warn('Impossible d\'enrichir les données de l\'annonce:', enrichmentError);
      }

      console.log('Annonce récupérée avec succès');
      setListing(enrichedListing);

      if (enrichedListing) {
        recordView(enrichedListing.id);
      }
    } catch (err) {
      console.error('Erreur détaillée lors de la récupération de l\'annonce:', err);
      setError(err instanceof Error ? err.message : 'Annonce introuvable');
    } finally {
      setLoading(false);
    }
  }, [id, recordView]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

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
 * Hook pour la création et gestion des annonces - EXPORT MANQUANT AJOUTÉ
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
          currency: listingData.currency || 'FCFA',
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
  }, [user, toast]);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>) => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour modifier une annonce",
        variant: "destructive"
      });
      return null;
    }

    if (!id) {
      toast({
        title: "Erreur",
        description: "ID de l'annonce manquant",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      console.log('Début de la mise à jour de l\'annonce:', { id, updates, userId: user.id });

      const { data: existingListing, error: checkError } = await supabase
        .from('listings')
        .select('id, user_id, title')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('Erreur lors de la vérification de l\'annonce:', checkError);
        throw new Error('Annonce introuvable');
      }

      if (!existingListing) {
        throw new Error('Cette annonce n\'existe pas');
      }

      if (existingListing.user_id !== user.id) {
        throw new Error('Vous n\'avez pas les droits pour modifier cette annonce');
      }

      const allowedFields = [
        'title', 'description', 'price', 'currency', 'category_id', 
        'location', 'condition', 'contact_phone', 'contact_email', 
        'contact_whatsapp', 'images', 'updated_at', 'status'
      ];
      
      const sanitizedUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key as keyof Listing] !== undefined) {
          sanitizedUpdates[key] = updates[key as keyof Listing];
        }
      });

      sanitizedUpdates.updated_at = new Date().toISOString();

      console.log('Données à mettre à jour:', sanitizedUpdates);

      const { data, error } = await supabase
        .from('listings')
        .update(sanitizedUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase lors de la mise à jour:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('Aucune modification n\'a été effectuée');
        } else if (error.code === '23503') {
          throw new Error('Catégorie sélectionnée invalide');
        } else if (error.message.includes('permission denied')) {
          throw new Error('Vous n\'avez pas les droits pour modifier cette annonce');
        } else {
          throw new Error(`Erreur de base de données: ${error.message}`);
        }
      }

      if (!data) {
        console.warn('Mise à jour réussie mais aucune donnée retournée');
        throw new Error('La mise à jour semble avoir échoué');
      }

      console.log('Mise à jour réussie:', data);

      toast({
        title: "Annonce mise à jour",
        description: "Vos modifications ont été sauvegardées avec succès !",
        duration: 4000
      });

      return data;
    } catch (err) {
      console.error('Erreur complète dans updateListing:', {
        error: err,
        id,
        updates,
        userId: user.id
      });

      const errorMessage = err instanceof Error ? 
        err.message : 
        "Erreur inconnue lors de la mise à jour de l'annonce";

      toast({
        title: "Erreur de mise à jour",
        description: errorMessage,
        variant: "destructive",
        duration: 6000
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const deleteListing = useCallback(async (id: string) => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour supprimer une annonce",
        variant: "destructive"
      });
      return false;
    }

    if (!id) {
      toast({
        title: "Erreur",
        description: "ID de l'annonce manquant",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('Début de la suppression de l\'annonce:', { id, userId: user.id });

      const { data: existingListing, error: checkError } = await supabase
        .from('listings')
        .select('id, user_id, title')
        .eq('id', id)
        .single();

      if (checkError || !existingListing) {
        throw new Error('Annonce introuvable');
      }

      if (existingListing.user_id !== user.id) {
        throw new Error('Vous n\'avez pas les droits pour supprimer cette annonce');
      }

      const { error: favoritesError } = await supabase
        .from('favorites')
        .delete()
        .eq('listing_id', id);

      if (favoritesError) {
        console.warn('Erreur suppression favoris (non critique):', favoritesError);
      }

      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('listing_id', id);

      if (messagesError) {
        console.warn('Erreur suppression messages (non critique):', messagesError);
      }

      const { error: guestMessagesError } = await supabase
        .from('guest_messages')
        .delete()
        .eq('listing_id', id);

      if (guestMessagesError && guestMessagesError.code !== 'PGRST116') {
        console.warn('Erreur suppression guest_messages (non critique):', guestMessagesError);
      }

      const { error: reportsError } = await supabase
        .from('reports')
        .delete()
        .eq('listing_id', id);

      if (reportsError) {
        console.warn('Erreur suppression reports (non critique):', reportsError);
      }

      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Erreur lors de la suppression de l\'annonce:', deleteError);
        throw new Error(`Impossible de supprimer l'annonce: ${deleteError.message}`);
      }

      console.log('Suppression réussie');

      toast({
        title: "Annonce supprimée",
        description: `L'annonce "${existingListing.title}" a été supprimée définitivement`,
        duration: 5000
      });

      return true;
    } catch (err) {
      console.error('Erreur complète dans deleteListing:', {
        error: err,
        id,
        userId: user.id
      });

      const errorMessage = err instanceof Error ? 
        err.message : 
        "Erreur inconnue lors de la suppression de l'annonce";

      toast({
        title: "Erreur de suppression",
        description: errorMessage,
        variant: "destructive",
        duration: 6000
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    createListing,
    updateListing,
    deleteListing,
    loading
  };
};