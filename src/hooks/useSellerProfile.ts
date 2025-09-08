// hooks/useSellerProfile.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Interface complète pour le profil vendeur
// Cette interface définit exactement ce que nous attendons de la base de données
export interface SellerProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  created_at: string;
  is_verified: boolean;
  total_listings: number;
  active_listings: number;
  total_sales?: number;
  response_rate: number;
  average_rating: number;
  total_reviews: number;
  phone?: string;
  email?: string; // Optionnel, selon les paramètres de confidentialité
}

// Interface pour les statistiques calculées dynamiquement
export interface SellerStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  averageResponseTime: number; // en heures
  joinDate: string;
  lastActive: string;
}

// Hook principal pour récupérer le profil complet d'un vendeur
export const useSellerProfile = (sellerId: string) => {
  // États pour gérer les données, le chargement et les erreurs
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cette fonction orchestre le chargement complet du profil vendeur
    const fetchSellerProfile = async () => {
      if (!sellerId) {
        setError('ID de vendeur requis');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Étape 1: Récupération du profil de base depuis la table profiles
        // Cette requête utilise les capacités relationnelles de Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            bio,
            city,
            created_at,
            is_verified,
            response_rate,
            average_rating,
            total_reviews,
            phone
          `)
          .eq('id', sellerId)
          .single(); // single() garantit qu'on récupère un seul enregistrement

        if (profileError) {
          throw new Error(`Erreur lors de la récupération du profil: ${profileError.message}`);
        }

        if (!profileData) {
          throw new Error('Profil vendeur introuvable');
        }

        // Étape 2: Calcul des statistiques d'annonces du vendeur
        // Cette approche sépare les préoccupations et optimise les performances
        const [activeListingsCount, totalListingsCount, soldListingsCount] = await Promise.all([
          // Comptage des annonces actives (non vendues, non supprimées)
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', sellerId)
            .eq('status', 'active'), // Supposant que vous avez un champ status

          // Comptage total des annonces publiées par ce vendeur
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', sellerId),

          // Comptage des annonces vendues (pour calculer le taux de conversion)
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', sellerId)
            .eq('status', 'sold')
        ]);

        // Vérification des erreurs dans les requêtes de statistiques
        if (activeListingsCount.error || totalListingsCount.error || soldListingsCount.error) {
          console.warn('Erreur lors du calcul des statistiques:', {
            activeError: activeListingsCount.error,
            totalError: totalListingsCount.error,
            soldError: soldListingsCount.error
          });
        }

        // Étape 3: Construction des objets de données finaux
        // Cette structure sépare les données de profil des statistiques calculées
        const completeProfile: SellerProfile = {
          ...profileData,
          total_listings: totalListingsCount.count || 0,
          active_listings: activeListingsCount.count || 0,
          total_sales: soldListingsCount.count || 0,
        };

        const calculatedStats: SellerStats = {
          totalListings: totalListingsCount.count || 0,
          activeListings: activeListingsCount.count || 0,
          soldListings: soldListingsCount.count || 0,
          averageResponseTime: calculateAverageResponseTime(profileData.response_rate),
          joinDate: profileData.created_at,
          lastActive: await getLastActiveDate(sellerId)
        };

        // Mise à jour des états avec les données récupérées
        setProfile(completeProfile);
        setStats(calculatedStats);

      } catch (err) {
        // Gestion d'erreur robuste avec logging pour le débogage
        console.error('Erreur dans useSellerProfile:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setProfile(null);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, [sellerId]); // Le hook se re-déclenche quand l'ID du vendeur change

  // Fonction utilitaire pour calculer le temps de réponse moyen
  // Cette logique métier est encapsulée dans le hook pour la réutilisabilité
  const calculateAverageResponseTime = (responseRate: number): number => {
    // Formule approximative: plus le taux de réponse est élevé, plus le temps est court
    // Vous pouvez ajuster cette logique selon vos besoins métier
    if (responseRate >= 95) return 2; // 2 heures pour les très réactifs
    if (responseRate >= 90) return 4; // 4 heures pour les réactifs
    if (responseRate >= 80) return 8; // 8 heures pour les moyens
    return 24; // 24 heures pour les moins réactifs
  };

  // Fonction pour récupérer la dernière activité du vendeur
  // Cette information aide les acheteurs à savoir si le vendeur est actif récemment
  const getLastActiveDate = async (sellerId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('created_at')
        .eq('user_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return new Date().toISOString(); // Fallback à aujourd'hui si pas de données
      }

      return data.created_at;
    } catch {
      return new Date().toISOString();
    }
  };

  // Fonction pour rafraîchir les données du profil
  // Utile quand des données ont pu changer (nouvelle annonce, nouvel avis, etc.)
  const refreshProfile = async () => {
    setLoading(true);
    // Re-déclencher le useEffect en forçant un nouveau rendu
    // Cette approche maintient la cohérence avec la logique existante
    const event = new CustomEvent('refreshSellerProfile');
    window.dispatchEvent(event);
  };

  // Interface de retour du hook - API publique claire et stable
  return {
    profile,
    stats,
    loading,
    error,
    refreshProfile,
    // Fonctions utilitaires exposées pour une utilisation avancée
    isVerified: profile?.is_verified || false,
    hasGoodRating: (profile?.average_rating || 0) >= 4.0,
    isResponsive: (profile?.response_rate || 0) >= 90
  };
};

// Hook spécialisé pour une utilisation légère (quand on n'a besoin que des infos de base)
export const useSellerBasicInfo = (sellerId: string) => {
  const [basicInfo, setBasicInfo] = useState<{
    id: string;
    full_name: string;
    avatar_url?: string;
    is_verified: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBasicInfo = async () => {
      if (!sellerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, is_verified')
          .eq('id', sellerId)
          .single();

        if (error) throw error;
        setBasicInfo(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        setBasicInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBasicInfo();
  }, [sellerId]);

  return { basicInfo, loading, error };
};