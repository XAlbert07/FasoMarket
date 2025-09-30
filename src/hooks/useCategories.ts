// src/hooks/useCategories.ts - VERSION FINALE OPTIMISÉE
// Remplacez complètement votre fichier existant par ce code

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { categoriesCache } from '@/lib/categoriesCache';

// Interface pour les données formatées pour l'affichage
interface FormattedCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: string; 
  listing_count: number; 
  color: string;
  href: string;
}

// Interface pour les données brutes de la RPC
interface RawCategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  created_at: string;
  listing_count: number;
}

const CACHE_KEY = 'categories-with-counts';

export const useCategories = () => {
  const [categories, setCategories] = useState<FormattedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mapping des icônes pour chaque catégorie
  const getIconForCategory = useCallback((categoryName: string, slug: string): string => {
    const iconMap: Record<string, string> = {
      'vehicules': 'Car',
      'immobilier': 'Home', 
      'telephones': 'Smartphone',
      'telephone': 'Smartphone',
      'mode': 'Shirt',
      'maison': 'Sofa',
      'emploi': 'Briefcase',
      'job': 'Briefcase',
      'loisirs': 'Heart',
      'loisir': 'Heart',
      'autres': 'MoreHorizontal',
      'autre': 'MoreHorizontal'
    };
    
    return iconMap[slug.toLowerCase()] || 
           iconMap[categoryName.toLowerCase()] || 
           'MoreHorizontal';
  }, []);

  // Mapping des couleurs
  const getColorForCategory = useCallback((index: number): string => {
    const colors = [
      'bg-primary',
      'bg-secondary', 
      'bg-accent',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-muted-foreground'
    ];
    return colors[index % colors.length];
  }, []);

  // Fonction pour formater les données brutes
  const formatCategories = useCallback((rawData: RawCategoryData[]): FormattedCategory[] => {
    return rawData.map((category, index) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: getIconForCategory(category.name, category.slug),
      count: category.listing_count.toLocaleString('fr-FR'),
      listing_count: category.listing_count,
      color: getColorForCategory(index),
      href: `/listings?category=${encodeURIComponent(category.name)}`
    }));
  }, [getIconForCategory, getColorForCategory]);

  // Catégories par défaut
  const getDefaultCategories = useCallback((): FormattedCategory[] => [
    {
      id: 'default-vehicules',
      name: 'Véhicules',
      slug: 'vehicules',
      icon: 'Car',
      count: '0',
      listing_count: 0,
      color: 'bg-primary',
      href: '/listings?category=Véhicules'
    },
    {
      id: 'default-immobilier',
      name: 'Immobilier', 
      slug: 'immobilier',
      icon: 'Home',
      count: '0',
      listing_count: 0,
      color: 'bg-secondary',
      href: '/listings?category=Immobilier'
    },
    {
      id: 'default-telephones',
      name: 'Téléphones',
      slug: 'telephones', 
      icon: 'Smartphone',
      count: '0',
      listing_count: 0,
      color: 'bg-accent',
      href: '/listings?category=Téléphones'
    },
    {
      id: 'default-mode',
      name: 'Mode',
      slug: 'mode',
      icon: 'Shirt', 
      count: '0',
      listing_count: 0,
      color: 'bg-blue-500',
      href: '/listings?category=Mode'
    }
  ], []);

  // Fonction principale pour récupérer les catégories
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache d'abord (sauf si forceRefresh)
      if (!forceRefresh) {
        const cached = categoriesCache.get<FormattedCategory[]>(CACHE_KEY);
        if (cached) {
          setCategories(cached);
          setLoading(false);
          return;
        }
      }

      console.time('categories-fetch'); // Pour mesurer les performances

      // Utiliser la fonction PostgreSQL optimisée
      const { data: rawCategories, error: rpcError } = await supabase
        .rpc('get_categories_with_listing_counts');

      console.timeEnd('categories-fetch');

      if (rpcError) {
        throw new Error(`Erreur lors de la récupération des catégories: ${rpcError.message}`);
      }

      if (!rawCategories || rawCategories.length === 0) {
        console.warn('Aucune catégorie trouvée en base. Utilisation des catégories par défaut.');
        const defaultCats = getDefaultCategories();
        setCategories(defaultCats);
        categoriesCache.set(CACHE_KEY, defaultCats);
        return;
      }

      // Formater les données
      const formattedCategories = formatCategories(rawCategories);

      // Mettre en cache et définir l'état
      categoriesCache.set(CACHE_KEY, formattedCategories);
      setCategories(formattedCategories);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur dans useCategories:', err);
      
      // En cas d'erreur, utiliser les catégories par défaut
      const defaultCats = getDefaultCategories();
      setCategories(defaultCats);
      categoriesCache.set(CACHE_KEY, defaultCats);
    } finally {
      setLoading(false);
    }
  }, [formatCategories, getDefaultCategories]);

  // Fonction pour rafraîchir les données
  const refreshCategories = useCallback(() => {
    fetchCategories(true); // Force le rafraîchissement
  }, [fetchCategories]);

  // Charger les données au montage
  useEffect(() => {
    fetchCategories();
  }, []);;

  return {
    categories,
    loading,
    error,
    refreshCategories
  };
};