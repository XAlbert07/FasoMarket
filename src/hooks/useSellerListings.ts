// hooks/useSellerListings.ts - VERSION CORRIGÉE
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Interface pour une annonce dans le contexte du profil vendeur
export interface SellerListing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  condition: 'new' | 'used' | 'refurbished';
  status: 'active' | 'sold' | 'paused' | 'expired';
  images: string[];
  created_at: string;
  updated_at: string;
  views_count: number;
  category_id: string;
  category_name: string;
  favorites_count: number;
  category?: string;
}

// Interface pour les options de filtrage et tri
export interface ListingsFilters {
  status?: 'active' | 'sold' | 'paused' | 'all';
  category?: string;
  condition?: 'new' | 'used' | 'refurbished' | 'all';
  sortBy?: 'created_at' | 'price' | 'views_count' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Interface pour les métadonnées de pagination
export interface PaginationMeta {
  total: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Hook principal pour les annonces d'un vendeur avec pagination et filtrage
export const useSellerListings = (sellerId: string, initialFilters?: ListingsFilters) => {
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingsFilters>({
    status: 'active',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 12,
    offset: 0,
    ...initialFilters
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Fonction principale pour récupérer les annonces - CORRIGÉE
  const fetchListings = useCallback(async (currentFilters: ListingsFilters) => {
    if (!sellerId) {
      setError('ID de vendeur requis');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // CORRECTION : Requête simplifiée sans jointure problématique
      // Nous récupérons d'abord les annonces, puis nous enrichirons avec les catégories
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          price,
          currency,
          location,
          condition,
          status,
          images,
          created_at,
          updated_at,
          views_count,
          category_id
        `, { count: 'exact' }) // count: 'exact' pour obtenir le nombre total
        .eq('user_id', sellerId); // Filtre principal : annonces du vendeur spécifique

      // Application des filtres de statut
      if (currentFilters.status && currentFilters.status !== 'all') {
        query = query.eq('status', currentFilters.status);
      }

      // Application des filtres de catégorie
      if (currentFilters.category && currentFilters.category !== 'all') {
        query = query.eq('category_id', currentFilters.category);
      }

      // Application des filtres de condition
      if (currentFilters.condition && currentFilters.condition !== 'all') {
        query = query.eq('condition', currentFilters.condition);
      }

      // Application du tri
      const sortField = currentFilters.sortBy || 'created_at';
      const sortOrder = currentFilters.sortOrder || 'desc';
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Application de la pagination
      const limit = currentFilters.limit || 12;
      const offset = currentFilters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Exécution de la première requête pour récupérer les annonces
      const { data: listingsData, error: listingsError, count } = await query;

      if (listingsError) {
        throw new Error(`Erreur lors de la récupération des annonces: ${listingsError.message}`);
      }

      // CORRECTION : Récupération séparée des noms de catégories
      // Cette approche évite les problèmes de jointure complexe
      let categoriesMap: Record<string, string> = {};
      
      if (listingsData && listingsData.length > 0) {
        // Extraction des IDs de catégories uniques
        const uniqueCategoryIds = [...new Set(
          listingsData
            .filter(item => item.category_id) // Filtrer les éléments avec category_id non null
            .map(item => item.category_id)
        )];

        // Si nous avons des catégories à récupérer
        if (uniqueCategoryIds.length > 0) {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', uniqueCategoryIds);

          if (!categoriesError && categoriesData) {
            // Création d'un map pour un accès rapide aux noms de catégories
            categoriesMap = categoriesData.reduce((acc, category) => {
              acc[category.id] = category.name;
              return acc;
            }, {} as Record<string, string>);
          }
        }
      }

      // Transformation des données pour correspondre à notre interface
      const transformedListings: SellerListing[] = (listingsData || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '', // Gestion des valeurs nulles
        price: item.price,
        currency: item.currency || 'XOF', // Valeur par défaut
        location: item.location,
        condition: item.condition,
        status: item.status,
        images: item.images || [], // Gestion des arrays vides
        created_at: item.created_at,
        updated_at: item.updated_at,
        views_count: item.views_count || 0,
        category_id: item.category_id || '',
        // Utilisation de notre map pour récupérer le nom de la catégorie
        category_name: item.category_id ? (categoriesMap[item.category_id] || 'Non catégorisé') : 'Non catégorisé',
        favorites_count: 0 // À implémenter si vous avez un système de favoris
      }));

      // Calcul des métadonnées de pagination (inchangé)
      const total = count || 0;
      const currentPage = Math.floor((offset / limit)) + 1;
      const totalPages = Math.ceil(total / limit);

      const paginationMeta: PaginationMeta = {
        total,
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      };

      // Mise à jour des états
      setListings(transformedListings);
      setPagination(paginationMeta);

    } catch (err) {
      console.error('Erreur dans useSellerListings:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setListings([]);
      setPagination({
        total: 0,
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  // Le reste du code reste identique à votre version originale
  useEffect(() => {
    fetchListings(filters);
  }, [fetchListings, filters]);

  const updateFilters = useCallback((newFilters: Partial<ListingsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    const limit = filters.limit || 12;
    const newOffset = (page - 1) * limit;
    
    setFilters(prev => ({
      ...prev,
      offset: newOffset
    }));
  }, [filters.limit]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  }, [pagination.hasNextPage, pagination.currentPage, goToPage]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      goToPage(pagination.currentPage - 1);
    }
  }, [pagination.hasPreviousPage, pagination.currentPage, goToPage]);

  const refreshListings = useCallback(() => {
    fetchListings(filters);
  }, [fetchListings, filters]);

  const getListingsStats = useCallback(() => {
    return {
      activeCount: listings.filter(l => l.status === 'active').length,
      soldCount: listings.filter(l => l.status === 'sold').length,
      totalViews: listings.reduce((sum, l) => sum + l.views_count, 0),
      averagePrice: listings.length > 0 
        ? listings.reduce((sum, l) => sum + l.price, 0) / listings.length 
        : 0,
      mostPopularCategory: getMostPopularCategory(listings)
    };
  }, [listings]);

  const getMostPopularCategory = (listingsArray: SellerListing[]): string => {
    if (listingsArray.length === 0) return 'Aucune';
    
    const categoryCount: Record<string, number> = {};
    listingsArray.forEach(listing => {
      categoryCount[listing.category_name] = (categoryCount[listing.category_name] || 0) + 1;
    });
    
    return Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b
    );
  };

  return {
    listings,
    loading,
    error,
    pagination,
    currentFilters: filters,
    updateFilters,
    refreshListings,
    goToPage,
    nextPage,
    previousPage,
    stats: getListingsStats(),
    isEmpty: listings.length === 0 && !loading,
    hasResults: listings.length > 0
  };
};

// Hook spécialisé pour obtenir seulement les annonces actives - ÉGALEMENT CORRIGÉ
export const useSellerActiveListings = (sellerId: string, limit: number = 6) => {
  const [activeListings, setActiveListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveListings = async () => {
      if (!sellerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // CORRECTION : Requête simplifiée sans jointure problématique
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            price,
            currency,
            location,
            condition,
            images,
            created_at,
            views_count,
            category_id
          `)
          .eq('user_id', sellerId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (listingsError) throw listingsError;

        // Récupération des catégories pour les annonces trouvées
        let categoriesMap: Record<string, string> = {};
        
        if (listingsData && listingsData.length > 0) {
          const uniqueCategoryIds = [...new Set(
            listingsData
              .filter(item => item.category_id)
              .map(item => item.category_id)
          )];

          if (uniqueCategoryIds.length > 0) {
            const { data: categoriesData } = await supabase
              .from('categories')
              .select('id, name')
              .in('id', uniqueCategoryIds);

            if (categoriesData) {
              categoriesMap = categoriesData.reduce((acc, category) => {
                acc[category.id] = category.name;
                return acc;
              }, {} as Record<string, string>);
            }
          }
        }

        const transformedData: SellerListing[] = (listingsData || []).map(item => ({
          id: item.id,
          title: item.title,
          description: '',
          price: item.price,
          currency: item.currency || 'XOF',
          location: item.location,
          condition: item.condition,
          status: 'active' as const,
          images: item.images || [],
          created_at: item.created_at,
          updated_at: item.created_at,
          views_count: item.views_count || 0,
          category_id: item.category_id || '',
          category_name: item.category_id ? (categoriesMap[item.category_id] || 'Non catégorisé') : 'Non catégorisé',
          favorites_count: 0
        }));

        setActiveListings(transformedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        setActiveListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveListings();
  }, [sellerId, limit]);

  return {
    activeListings,
    loading,
    error,
    count: activeListings.length
  };
};