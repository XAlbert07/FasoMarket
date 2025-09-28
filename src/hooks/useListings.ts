// hooks/useListings.ts - VERSION FINALE OPTIMISÉE

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Listing, SearchFilters } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface complète pour le hook useListings
 * Combine optimisation et fonctionnalités étendues
 */
export interface UseListingsReturn {
  // Propriétés de base
  listings: Listing[];
  loading: boolean;
  error: string | null;
  
  // Propriétés calculées pour MyListings.tsx
  dataSource: Listing[];
  soldListings: Listing[];
  draftListings: Listing[];
  
  // Fonctions de récupération
  fetchListings: (filters?: SearchFilters) => Promise<void>;
  fetchListingsSimple: (filters?: SearchFilters) => Promise<void>;
  fetchUserListings: (userId: string) => Promise<void>;
  
  // Fonctions utilitaires
  clearListings: () => void;
  refreshListings: () => Promise<void>;
  filterByStatus: (status: string) => Listing[];
}

/**
 * Hook principal OPTIMISÉ avec requêtes jointures
 * Performance maximale avec fonctionnalités complètes
 */
export const useListings = (): UseListingsReturn => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Construction de requête optimisée avec les bonnes relations
   * Utilise les vraies clés étrangères du schéma
   */
  const buildOptimizedQuery = useCallback((baseQuery: any) => {
    return baseQuery.select(`
      id,
      title,
      description,
      price,
      currency,
      category_id,
      user_id,
      location,
      condition,
      status,
      images,
      contact_phone,
      contact_email,
      contact_whatsapp,
      featured,
      views_count,
      created_at,
      updated_at,
      expires_at,
      categories (
        id,
        name,
        slug,
        icon,
        description
      )
    `);
  }, []);

  /**
   * Enrichissement hybride optimisé
   * Jointure pour catégories + requête séparée pour profils utilisateur
   */
  const enrichListingsBatch = useCallback(async (listings: any[]): Promise<Listing[]> => {
    if (!listings || listings.length === 0) return [];

    try {
      // Récupérer tous les user_ids uniques
      const userIds = [...new Set(listings.map(l => l.user_id).filter(Boolean))];

      // Récupération des profils en une seule requête
      // Note: user_id pointe vers auth.users, mais on récupère les profils correspondants
      const profilesPromise = userIds.length > 0 ? 
        supabase
          .from('profiles')
          .select('id, full_name, phone, email, avatar_url, bio, location')
          .in('id', userIds) : 
        Promise.resolve({ data: [], error: null });

      const profilesResult = await profilesPromise;

      // Création de la map des profils pour un accès O(1)
      const profilesMap = new Map();
      if (profilesResult.data) {
        profilesResult.data.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }

      // Enrichissement final en une seule passe
      return listings.map(listing => ({
        ...listing,
        // Profil utilisateur (récupéré séparément)
        profiles: profilesMap.get(listing.user_id) || undefined,
        // Catégorie (déjà récupérée via jointure)
        categories: listing.categories || undefined,
        category: listing.categories?.name || 'Catégorie inconnue'
      }));

    } catch (error) {
      console.warn('Erreur lors de l\'enrichissement:', error);
      // Fallback: retourner les données de base
      return listings.map(listing => ({
        ...listing,
        profiles: undefined,
        categories: listing.categories || undefined,
        category: listing.categories?.name || 'Catégorie inconnue'
      }));
    }
  }, []);

  /**
   * Résolution optimisée de l'ID de catégorie
   * Version améliorée avec cache intégré
   */
  const resolveCategoryId = useCallback(async (categoryName: string): Promise<string | null> => {
    try {
      console.log(`Résolution catégorie: "${categoryName}"`);
      
      // Recherche par nom exact (plus rapide)
      let { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('name', categoryName)
        .single();

      if (data && !error) {
        console.log(`Trouvée par nom: ${data.id}`);
        return data.id;
      }

      // Recherche par slug normalisé
      const slug = categoryName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');

      ({ data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', slug)
        .single());

      if (data && !error) {
        console.log(`Trouvée par slug: ${data.id}`);
        return data.id;
      }

      // Recherche floue en dernier recours
      ({ data, error } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', `%${categoryName}%`)
        .limit(1)
        .single());

      if (data && !error) {
        console.log(`Trouvée par recherche floue: ${data.id}`);
        return data.id;
      }

      console.warn(`Catégorie "${categoryName}" introuvable`);
      return null;
    } catch (err) {
      console.error(`Erreur résolution catégorie:`, err);
      return null;
    }
  }, []);

  /**
   * Fonction principale OPTIMISÉE avec jointures
   * Performance maximale pour les listes publiques
   */
  const fetchListings = useCallback(async (filters?: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Requête optimisée avec filtres:', filters);

      // Construction de la requête base avec jointures
      let query = buildOptimizedQuery(
        supabase.from('listings')
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

      // Application des filtres avec optimisations
      if (filters?.category) {
        const categoryId = await resolveCategoryId(filters.category);
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        } else {
          // Catégorie introuvable - retour rapide
          setListings([]);
          setLoading(false);
          return;
        }
      }

      // Filtres de recherche textuelle
      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }

      // Filtres de prix
      if (filters?.priceMin) {
        query = query.gte('price', filters.priceMin);
      }

      if (filters?.priceMax) {
        query = query.lte('price', filters.priceMax);
      }

      // Options de tri
      if (filters?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'views') {
        query = query.order('views_count', { ascending: false });
      }

      // EXÉCUTION : Requête avec jointure catégorie + enrichissement profils
      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Erreur requête:', error);
        throw error;
      }

      console.log(`${data?.length || 0} annonces récupérées avec catégories`);

      // Enrichissement avec profils utilisateur (1 requête supplémentaire)
      const enrichedListings = await enrichListingsBatch(data || []);
      setListings(enrichedListings);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      console.error('Erreur complète:', err);
      setError(errorMessage);
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les annonces. Vérifiez votre connexion.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, buildOptimizedQuery, enrichListingsBatch, resolveCategoryId]);

  /**
   * Version simplifiée optimisée
   * Pour les cas où l'enrichissement complet n'est pas nécessaire
   */
  const fetchListingsSimple = useCallback(async (filters?: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Requête simple optimisée');

      let query = supabase
        .from('listings')
        .select('*, categories:category_id(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      // Application des filtres (logique identique)
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

      // Options de tri
      if (filters?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'views') {
        query = query.order('views_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedListings: Listing[] = (data || []).map(listing => ({
        ...listing,
        category: listing.categories?.name || 'Non spécifiée',
        profiles: undefined,
        categories: undefined
      }));

      setListings(processedListings);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      console.error('Erreur requête simple:', err);
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les annonces",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Récupération optimisée des annonces utilisateur
   * Pour MyListings.tsx avec tous les statuts
   */
  const fetchUserListings = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    setLastUserId(userId);
    
    try {
      console.log("Annonces utilisateur optimisées:", userId);
      
      // Requête optimisée avec jointure catégorie pour MyListings
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            icon
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Récupérées:", data?.length || 0, "annonces utilisateur");
      
      // Transformation optimisée
      const processedListings: Listing[] = (data || []).map(listing => ({
        ...listing,
        category: listing.categories?.name || 'Non spécifiée',
        profiles: undefined,
        categories: listing.categories
      }));
      
      setListings(processedListings);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      console.error("Erreur annonces utilisateur:", err);
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

  // Fonctions utilitaires pour MyListings.tsx
  const clearListings = useCallback(() => {
    setListings([]);
    setError(null);
    setLastUserId(null);
  }, []);

  const refreshListings = useCallback(async () => {
    if (lastUserId) {
      await fetchUserListings(lastUserId);
    }
  }, [lastUserId, fetchUserListings]);

  const filterByStatus = useCallback((status: string) => {
    return listings.filter(listing => listing.status === status);
  }, [listings]);

  // Propriétés calculées (memoized pour performance)
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

  return {
    // Propriétés de base
    listings,
    loading,
    error,
    
    // Propriétés calculées
    dataSource,
    soldListings,
    draftListings,
    
    // Fonctions de récupération
    fetchListings,
    fetchListingsSimple,
    fetchUserListings,
    
    // Fonctions utilitaires
    clearListings,
    refreshListings,
    filterByStatus
  };
};

/**
 * Hook pour annonce individuelle avec enrichissement optimisé
 * Compatible avec tous les schémas de base de données
 */
export const useListing = (id: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Enrichissement d'une annonce individuelle
   * Version optimisée pour le hook useListing
   */
  const enrichSingleListing = useCallback(async (listing: any): Promise<Listing> => {
    try {
      let enrichedListing: Listing = {
        ...listing,
        profiles: undefined,
        categories: undefined,
        category: 'Catégorie inconnue'
      };

      // Récupération du profil utilisateur si user_id existe
      if (listing.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email, avatar_url, bio, location')
          .eq('id', listing.user_id)
          .single();
        
        if (profileData && !profileError) {
          enrichedListing.profiles = profileData;
        }
      }

      // Si categories n'est pas déjà inclus par jointure, le récupérer
      if (!listing.categories && listing.category_id) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name, slug, icon, description')
          .eq('id', listing.category_id)
          .single();
        
        if (categoryData && !categoryError) {
          enrichedListing.categories = categoryData;
          enrichedListing.category = categoryData.name;
        }
      } else if (listing.categories) {
        // Utiliser les données de catégorie déjà récupérées par jointure
        enrichedListing.categories = listing.categories;
        enrichedListing.category = listing.categories.name;
      }

      return enrichedListing;
    } catch (error) {
      console.warn('Erreur enrichissement annonce individuelle:', error);
      return {
        ...listing,
        profiles: undefined,
        categories: listing.categories || undefined,
        category: listing.categories?.name || 'Catégorie inconnue'
      };
    }
  }, []);

  /**
   * Récupération et enrichissement de l'annonce
   */
  const fetchListing = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Récupération annonce: ${id}`);
      
      // Requête principale avec jointure catégorie
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            icon,
            description
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Enrichissement avec profil utilisateur
      const enrichedListing = await enrichSingleListing(data);
      setListing(enrichedListing);
      
      // Comptage des vues asynchrone (non-bloquant)
      supabase
        .from('listings')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.warn('Erreur comptage vue:', error);
          } else {
            console.log('Vue comptabilisée');
          }
        });

    } catch (err) {
      console.error('Erreur annonce individuelle:', err);
      setError(err instanceof Error ? err.message : 'Annonce introuvable');
    } finally {
      setLoading(false);
    }
  }, [id, enrichSingleListing]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  return { 
    listing, 
    loading, 
    error, 
    refetch: fetchListing
  };
};

/**
 * Hook pour la gestion des annonces (création, modification, suppression)
 * Repris de la version étendue car fonctionnalités critiques
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
          currency: listingData.currency || 'XOF',
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
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>) => {
    if (!user || !id) {
      toast({
        title: "Erreur",
        description: "Paramètres manquants pour la mise à jour",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      // Vérification des droits
      const { data: existingListing, error: checkError } = await supabase
        .from('listings')
        .select('id, user_id, title')
        .eq('id', id)
        .single();

      if (checkError || !existingListing) {
        throw new Error('Annonce introuvable');
      }

      if (existingListing.user_id !== user.id) {
        throw new Error('Vous n\'avez pas les droits pour modifier cette annonce');
      }

      // Champs autorisés pour sécurité
      const allowedFields = [
        'title', 'description', 'price', 'currency', 'category_id', 
        'location', 'condition', 'contact_phone', 'contact_email', 
        'contact_whatsapp', 'images', 'status'
      ];
      
      const sanitizedUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key as keyof Listing] !== undefined) {
          sanitizedUpdates[key] = updates[key as keyof Listing];
        }
      });

      sanitizedUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('listings')
        .update(sanitizedUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Annonce mise à jour",
        description: "Vos modifications ont été sauvegardées !",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur de mise à jour";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const deleteListing = useCallback(async (id: string) => {
    if (!user || !id) {
      toast({
        title: "Erreur",
        description: "Paramètres manquants pour la suppression",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // Vérification des droits
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

      // Nettoyage des données liées (non-critique)
      await Promise.allSettled([
        supabase.from('favorites').delete().eq('listing_id', id),
        supabase.from('messages').delete().eq('listing_id', id),
        supabase.from('guest_messages').delete().eq('listing_id', id),
        supabase.from('reports').delete().eq('listing_id', id)
      ]);

      // Suppression principale
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Annonce supprimée",
        description: `"${existingListing.title}" a été supprimée définitivement`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur de suppression";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
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