// hooks/useCategories.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';

// Interface pour une catégorie avec son compteur d'annonces
interface CategoryWithCount extends Category {
  listing_count: number;
}

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

export const useCategories = () => {
  const [categories, setCategories] = useState<FormattedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mapping des icônes pour chaque catégorie
  const getIconForCategory = (categoryName: string, slug: string): string => {
    const iconMap: Record<string, string> = {
      'vehicules': 'Car',
      'immobilier': 'Home', 
      'telephones': 'Smartphone',
      'telephone': 'Smartphone', // Variante possible
      'mode': 'Shirt',
      'maison': 'Sofa',
      'emploi': 'Briefcase',
      'job': 'Briefcase', // Variante possible
      'loisirs': 'Heart',
      'loisir': 'Heart', // Variante possible
      'autres': 'MoreHorizontal',
      'autre': 'MoreHorizontal' // Variante possible
    };
    
    // Essayer d'abord avec le slug, puis avec le nom en minuscules
    return iconMap[slug.toLowerCase()] || 
           iconMap[categoryName.toLowerCase()] || 
           'MoreHorizontal'; // Icône par défaut
  };

  // Mapping des couleurs pour une meilleure répartition visuelle
  const getColorForCategory = (index: number): string => {
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
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Étape 1: Récupérer toutes les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        throw new Error(`Erreur lors de la récupération des catégories: ${categoriesError.message}`);
      }

      if (!categoriesData || categoriesData.length === 0) {
        // Si aucune catégorie n'existe, créer des catégories par défaut
        console.warn('Aucune catégorie trouvée en base. Utilisation des catégories par défaut.');
        setCategories(getDefaultCategories());
        return;
      }

      // Étape 2: Compter les annonces pour chaque catégorie
      const categoriesWithCounts: FormattedCategory[] = [];

      for (let i = 0; i < categoriesData.length; i++) {
        const category = categoriesData[i];
        
        // Compter les annonces actives pour cette catégorie
        const { count, error: countError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('status', 'active');

        if (countError) {
          console.error(`Erreur lors du comptage pour ${category.name}:`, countError);
        }

        const listingCount = count || 0;
        
        categoriesWithCounts.push({
          id: category.id,
          name: category.name,
          slug: category.slug,
          icon: getIconForCategory(category.name, category.slug),
          count: listingCount.toLocaleString(), // Format avec séparateurs de milliers
          listing_count: listingCount,
          color: getColorForCategory(i),
          href: `/listings?category=${encodeURIComponent(category.name)}`
        });
      }

      // Trier par nombre d'annonces décroissant
      categoriesWithCounts.sort((a, b) => b.listing_count - a.listing_count);

      setCategories(categoriesWithCounts);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur dans useCategories:', err);
      
      // En cas d'erreur, utiliser les catégories par défaut
      setCategories(getDefaultCategories());
    } finally {
      setLoading(false);
    }
  };

  // Catégories par défaut en cas de problème avec la base de données
  const getDefaultCategories = (): FormattedCategory[] => [
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
  ];

  // Fonction pour rafraîchir les données
  const refreshCategories = () => {
    fetchCategories();
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refreshCategories
  };
};