import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Favorite, Listing } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook useFavorites amélioré avec enrichissement des données
 * Cette version récupère automatiquement les informations des vendeurs et catégories
 * pour correspondre exactement aux données affichées dans la page Listings
 */
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

  /**
   * Fonction d'enrichissement des données d'une annonce
   * Reproduit exactement la logique de enrichListing() du hook useListings
   */
  const enrichListing = useCallback(async (listing: any): Promise<Listing> => {
    let enrichedListing: Listing = {
      ...listing,
      profiles: undefined,
      categories: undefined,
      category: undefined
    };

    try {
      // Récupération des informations du profil utilisateur (vendeur)
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

      // Récupération des informations de la catégorie
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

      // Valeur par défaut pour la catégorie si non trouvée
      if (!enrichedListing.category) {
        enrichedListing.category = 'Non spécifiée';
      }

    } catch (enrichmentError) {
      console.warn('Impossible d\'enrichir les données de l\'annonce:', enrichmentError);
      enrichedListing.category = 'Non spécifiée';
    }

    return enrichedListing;
  }, []);

  /**
   * Fonction principale de récupération des favoris avec enrichissement
   * Cette version reproduit la richesse des données de la page Listings
   */
  const fetchFavorites = async () => {
    if (!user || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      console.log('Début de fetchFavorites avec enrichissement pour user:', user.id);

      // Étape 1 : Récupérer les favoris avec les données de base des listings
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listing:listings(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des favoris:', error);
        throw error;
      }

      console.log(`Récupération réussie: ${data?.length || 0} favoris trouvés`);

      // Étape 2 : Enrichir chaque listing avec les données liées
      const enrichedFavorites: Favorite[] = [];
      if (data) {
        for (const favorite of data) {
          if (favorite.listing) {
            // Enrichir le listing avec les données du profil et de la catégorie
            const enrichedListing = await enrichListing(favorite.listing);
            
            // Créer l'objet favori enrichi
            const enrichedFavorite: Favorite = {
              ...favorite,
              listing: enrichedListing
            };
            
            enrichedFavorites.push(enrichedFavorite);
          } else {
            // Favoris sans listing (annonce supprimée) - on les garde quand même
            enrichedFavorites.push(favorite);
          }
        }
      }

      console.log(`Enrichissement terminé: ${enrichedFavorites.length} favoris enrichis`);
      setFavorites(enrichedFavorites);

    } catch (error) {
      console.error('Erreur complète lors du chargement des favoris:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des favoris';
      
      toast({
        title: "Erreur",
        description: "Impossible de charger vos favoris. Vérifiez votre connexion internet.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  /**
   * Fonction d'ajout aux favoris avec enrichissement immédiat
   * Garantit que le nouvel élément ajouté a les mêmes données enrichies
   */
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
      // Étape 1 : Ajouter le favori en base
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

      // Étape 2 : Enrichir le listing du nouveau favori
      if (newFavorite.listing) {
        const enrichedListing = await enrichListing(newFavorite.listing);
        const enrichedFavorite: Favorite = {
          ...newFavorite,
          listing: enrichedListing
        };

        setFavorites(prev => [enrichedFavorite, ...prev]);
        toast({
          title: "Ajouté aux favoris",
          description: "L'annonce a été ajoutée à vos favoris"
        });
      }
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