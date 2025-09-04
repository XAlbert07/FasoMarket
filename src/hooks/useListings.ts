import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Listing, SearchFilters, ListingView } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook principal pour la gestion des collections d'annonces
 * Ce hook s'occupe de récupérer et filtrer les listes d'annonces
 * Il maintient l'état local des annonces, du chargement et des erreurs
 */
export const useListings = () => {
  // États locaux pour gérer les données des annonces et l'interface utilisateur
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fonction pour récupérer les annonces avec filtres optionnels
   * Cette fonction construit dynamiquement une requête Supabase basée sur les filtres
   * Elle illustre comment construire des requêtes complexes de manière programmatique
   */
  const fetchListings = async (filters?: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Construction de la requête de base - nous récupérons toutes les colonnes
      // et filtrons par statut 'active' pour ne montrer que les annonces publiées
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Application conditionnelle des filtres - cette approche permet une recherche flexible
      // Le pattern 'or' de Supabase permet de chercher dans plusieurs colonnes simultanément
      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      // Filtrage par catégorie - nous utilisons l'ID de catégorie pour une recherche précise
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      // Filtrage géographique - important pour une marketplace locale comme FasoMarket
      if (filters?.location) {
        query = query.eq('location', filters.location);
      }

      // Filtrage par condition de l'article - neuf, occasion, etc.
      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }

      // Filtres de prix - utilisation des opérateurs de comparaison Supabase
      if (filters?.priceMin) {
        query = query.gte('price', filters.priceMin);
      }

      if (filters?.priceMax) {
        query = query.lte('price', filters.priceMax);
      }

      // Tri dynamique des résultats - permet différentes stratégies d'affichage
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
      // Gestion d'erreur robuste avec feedback utilisateur
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

  /**
   * Fonction spécialisée pour récupérer les annonces d'un utilisateur spécifique
   * Utilisée principalement dans le dashboard marchand pour voir ses propres annonces
   */
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

/**
 * Hook pour la gestion d'une annonce individuelle
 * Ce hook s'occupe de récupérer les détails d'une annonce spécifique
 * Il inclut aussi la logique de comptage des vues pour les statistiques
 */
export const useListing = (id: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  // Effect automatique qui se déclenche quand l'ID change
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

      // Enregistrement automatique d'une vue - important pour les analytics
      if (data) {
        await recordView(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Annonce introuvable');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction pour enregistrer les vues de manière intelligente
   * Elle évite de compter plusieurs vues du même utilisateur dans les 24h
   * C'est une logique métier importante pour éviter le spam de vues
   */
  const recordView = async (listingId: string) => {
    try {
      // Vérification si l'utilisateur a déjà vu cette annonce récemment
      const { data: existingView } = await supabase
        .from('listing_views')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', user?.id || null)
        .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      // Si pas de vue récente, on enregistre une nouvelle vue
      if (!existingView) {
        await supabase.from('listing_views').insert({
          listing_id: listingId,
          user_id: user?.id || null,
          ip_address: 'unknown'
        });

        // Incrémentation du compteur global de vues
        await supabase.rpc('increment_listing_views', { listing_id: listingId });
      }
    } catch (err) {
      // Les erreurs de vue ne doivent pas affecter l'expérience utilisateur
      console.error('Erreur lors de l\'enregistrement de la vue:', err);
    }
  };

  return { listing, loading, error, refetch: fetchListing };
};

/**
 * Hook principal pour les opérations de création, modification et suppression d'annonces
 * C'est le cœur de la fonctionnalité marchande de votre application
 * Ce hook contient toutes les corrections nécessaires pour résoudre vos problèmes RLS
 */
export const useCreateListing = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  /**
   * FONCTION DE CRÉATION D'ANNONCE - CORRIGÉE
   * Cette fonction contient les corrections principales pour résoudre l'erreur RLS
   * Les commentaires expliquent chaque correction appliquée
   */
  const createListing = async (listingData: any) => {
    // Vérification de sécurité - l'utilisateur doit être authentifié
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
      // CORRECTION CRITIQUE: Changement du status de 'pending' à 'active'
      // Votre contrainte de base de données n'accepte pas 'pending' comme valeur
      // Cette modification résout l'erreur RLS 42501 que vous rencontriez
      const { data, error } = await supabase
        .from('listings')
        .insert({
          title: listingData.title,
          description: listingData.description,
          price: listingData.price,
          category_id: listingData.category_id, // Utilisation du vrai ID de catégorie
          location: listingData.location,
          condition: listingData.condition,
          contact_phone: listingData.phone,
          images: listingData.images,
          latitude: listingData.latitude,
          longitude: listingData.longitude,
          currency: listingData.currency,
          user_id: user.id, // Utilisation de l'ID utilisateur authentifié
          status: 'active', // CORRECTION: Changé de 'pending' à 'active'
          views_count: 0    // Initialisation du compteur de vues
        })
        .select() // Important: récupère les données insérées pour confirmer la création
        .single();

      if (error) throw error;

      // Feedback positif à l'utilisateur en cas de succès
      toast({
        title: "Succès",
        description: "Votre annonce a été créée avec succès !",
      });

      return data;
    } catch (err) {
      // Gestion d'erreur améliorée avec logging détaillé
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création de l'annonce";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Log détaillé pour le debugging - crucial pour identifier les problèmes
      console.error('Erreur Supabase détaillée:', {
        error: err,
        userData: user,
        listingData: listingData
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction de mise à jour d'annonce
   * Inclut la sécurité au niveau des lignes - un utilisateur ne peut modifier que ses propres annonces
   */
  const updateListing = async (id: string, updates: Partial<Listing>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id) // Sécurité: seul le propriétaire peut modifier
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

  /**
   * Fonction de suppression d'annonce
   * Inclut les mêmes protections de sécurité que la mise à jour
   */
  const deleteListing = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id); // Sécurité: seul le propriétaire peut supprimer

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

  // Interface publique du hook - toutes les fonctions et états nécessaires
  return {
    createListing,
    updateListing,
    deleteListing,
    loading
  };
};