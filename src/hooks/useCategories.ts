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

const CACHE_KEY = 'categories-with-counts-v3';

export const useCategories = () => {
  const [categories, setCategories] = useState<FormattedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mapping des icônes — une forme lisible par domaine métier
  const getIconForCategory = useCallback((categoryName: string, slug: string): string => {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const key = normalize(slug) || normalize(categoryName);

    const iconMap: Record<string, string> = {
      vehicules: 'Car',
      vehicule: 'Car',
      auto: 'Car',
      voiture: 'Car',
      immobilier: 'Building2',
      maison: 'Sofa',
      'maison-jardin': 'Sofa',
      jardin: 'Sofa',
      telephones: 'Smartphone',
      telephone: 'Smartphone',
      phone: 'Smartphone',
      mode: 'Shirt',
      vetements: 'Shirt',
      fashion: 'Shirt',
      emploi: 'Briefcase',
      job: 'Briefcase',
      jobs: 'Briefcase',
      travail: 'Briefcase',
      loisirs: 'Bike',
      loisir: 'Bike',
      sport: 'Bike',
      sports: 'Bike',
      services: 'Wrench',
      service: 'Wrench',
      electronique: 'Laptop',
      informatique: 'Laptop',
      'high-tech': 'Laptop',
      autres: 'Package',
      autre: 'Package',
      divers: 'Package',
    };

    if (iconMap[key]) return iconMap[key];

    // Fallback by partial name match
    if (key.includes('vehic') || key.includes('auto')) return 'Car';
    if (key.includes('immo') || key.includes('appart')) return 'Building2';
    if (key.includes('tel') || key.includes('phone')) return 'Smartphone';
    if (key.includes('mode') || key.includes('vetement')) return 'Shirt';
    if (key.includes('maison') || key.includes('meuble') || key.includes('jardin')) return 'Sofa';
    if (key.includes('emploi') || key.includes('job')) return 'Briefcase';
    if (key.includes('loisir') || key.includes('sport')) return 'Bike';
    if (key.includes('service')) return 'Wrench';
    if (key.includes('electro') || key.includes('info') || key.includes('tech')) return 'Laptop';

    return 'Package';
  }, []);

  // Couleurs legacy (cartes admin / anciens call sites) — le home utilise ToneMap côté UI
  const getColorForCategory = useCallback((index: number): string => {
    const colors = [
      'bg-sky-100',
      'bg-amber-100',
      'bg-violet-100',
      'bg-rose-100',
      'bg-teal-100',
      'bg-slate-200',
      'bg-orange-100',
      'bg-muted',
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
      href: `/category/${category.slug}`
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
      color: 'bg-sky-100',
      href: '/category/vehicules'
    },
    {
      id: 'default-immobilier',
      name: 'Immobilier', 
      slug: 'immobilier',
      icon: 'Building2',
      count: '0',
      listing_count: 0,
      color: 'bg-amber-100',
      href: '/category/immobilier'
    },
    {
      id: 'default-telephones',
      name: 'Téléphones',
      slug: 'telephones', 
      icon: 'Smartphone',
      count: '0',
      listing_count: 0,
      color: 'bg-violet-100',
      href: '/category/telephones'
    },
    {
      id: 'default-mode',
      name: 'Mode',
      slug: 'mode',
      icon: 'Shirt', 
      count: '0',
      listing_count: 0,
      color: 'bg-rose-100',
      href: '/category/mode'
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