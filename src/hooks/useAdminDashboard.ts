// hooks/useAdminDashboard.ts

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'

// ========================================
// INTERFACES CONSOLIDÉES
// ========================================

// Interface principale du state centralisé
interface CentralState {
  profiles: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
  listings: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
  categories: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
  reports: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
  userSanctions: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
  suspendedListings: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
  favorites: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
  messages: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
  reviews: {
    data: any[]
    loading: boolean
    error: string | null
    lastFetch: string | null
  }
}

// Interfaces 
export interface DashboardStats {
  totalUsers: number
  totalListings: number
  pendingListings: number
  activeReports: number
  dailyActiveUsers: number
  conversionRate: number
  averageRating: number
  weeklyGrowth: {
    users: number
    listings: number
    reports: number
  }
  topRegions: Array<{
    name: string
    userCount: number
    listingCount: number
    growthRate: number
  }>
  qualityMetrics: {
    approvedListingsRate: number
    reportResolutionRate: number
    averageResponseTime: number
    userVerificationRate: number
  }
}

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  bio: string | null
  location: string | null
  avatar_url: string | null
  role: 'merchant' | 'admin'
  created_at: string
  updated_at: string | null
  status: 'active' | 'suspended' | 'banned' | 'pending_verification'
  trust_score: number
  listings_count: number
  active_listings_count: number
  reports_received: number
  reports_made: number
  last_activity: string | null
  verification_status: 'verified' | 'pending' | 'rejected'
  total_views_received: number
  total_messages_sent: number
  total_messages_received: number
  account_age_days: number
  risk_level: 'low' | 'medium' | 'high'
  suspension_end?: string
  suspension_reason?: string
  warning_count: number
}

export interface AdminListing {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category_id: string
  user_id: string
  location: string
  condition: 'new' | 'used' | 'refurbished'
  status: 'active' | 'sold' | 'expired' | 'suspended'
  images: string[]
  contact_phone: string | null
  contact_email: string | null
  contact_whatsapp: string | null
  featured: boolean
  views_count: number
  created_at: string
  updated_at: string
  expires_at: string | null
  suspended_until?: string | null
  suspension_reason?: string | null
  
  quality_score?: number
  merchant_name: string
  merchant_email: string
  merchant_phone?: string
  category_name: string
  favorites_count: number
  messages_count: number
  reports_count: number
  engagement_rate: number
  days_since_creation: number
  days_until_expiry: number
  last_activity?: string
  needs_review: boolean
  is_featured: boolean
  risk_level: 'low' | 'medium' | 'high'
  is_temporarily_suspended: boolean
  suspension_expires_in_days?: number
  suspension_type?: 'user' | 'admin' | 'system' | null
  suspended_by?: string | null
  moderation_notes?: string | null
  
  // PROPRIÉTÉS POUR LA DÉTECTION D'INCOHÉRENCES
  owner_suspended: boolean
  has_inconsistency: boolean
  inconsistency_type: 'user_suspended_listing_active' | null
}

export interface AdminReport {
  id: string
  listing_id?: string | null
  user_id?: string | null
  reporter_id?: string | null
  reason: string
  description?: string | null
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
  guest_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  report_type: 'listing' | 'profile'
  listing_title?: string
  listing_price?: number
  reported_user_name?: string
  reported_user_email?: string
  reporter_name?: string
  reporter_email?: string
  reporter_type: 'registered' | 'guest'
  priority: 'low' | 'medium' | 'high'
  response_time_hours?: number
  listing?: {
    user_id: string
    title?: string
    price?: number
  } | null
  reported_user?: {
    full_name?: string
    email?: string
  } | null
  reporter?: {
    full_name?: string
    email?: string
  } | null
}

export interface ActiveSanction {
  id: string
  type: 'user' | 'listing'
  target_id: string
  target_name: string
  target_email?: string
  sanction_type: string
  reason: string
  admin_name: string
  admin_id: string
  created_at: string
  expires_at?: string
  is_permanent: boolean
  status: 'active' | 'expired' | 'revoked'
  days_remaining?: number
  notes?: string
  description?: string
  duration_days?: number
  effective_from?: string
  revoked_at?: string
  revoked_by?: string
  revoked_reason?: string
}

// Interfaces pour les actions
export interface UserAction {
  type: 'verify' | 'suspend' | 'ban' | 'warn' | 'promote' | 'demote' | 'delete'
  reason: string
  duration?: number
  notes?: string
}

export interface ListingAction {
  type: 'approve' | 'suspend' | 'suspend_listing' | 'unsuspend' | 'feature' | 'unfeature' | 'delete' | 'remove_listing' | 'extend_expiry'
  reason: string
  notes?: string
  duration?: number
}

export interface ReportAction {
  type: 'approve' | 'dismiss' | 'escalate' | 'ban_user' | 'suspend_user' | 'warn_user' | 'remove_listing' | 'suspend_listing'
  reason: string
  notes?: string
  duration?: number
  notifyUser?: boolean
}

export interface WeeklyData {
  name: string;
  date: string;
  users: number;
  listings: number;
  reports: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

// ========================================
// HOOK PRINCIPAL 
// ========================================

export const useAdminDashboard = () => {
  const { user } = useAuthContext()
  const { toast } = useToast()

  // State centralisé pour toutes les données
  const [centralState, setCentralState] = useState<CentralState>({
    profiles: { data: [], loading: false, error: null, lastFetch: null },
    listings: { data: [], loading: false, error: null, lastFetch: null },
    categories: { data: [], loading: false, error: null, lastFetch: null },
    reports: { data: [], loading: false, error: null, lastFetch: null },
    userSanctions: { data: [], loading: false, error: null, lastFetch: null },
    suspendedListings: { data: [], loading: false, error: null, lastFetch: null },
    favorites: { data: [], loading: false, error: null, lastFetch: null },
    messages: { data: [], loading: false, error: null, lastFetch: null },
    reviews: { data: [], loading: false, error: null, lastFetch: null }
  })

  // État pour le contrôle global
  const [globalLoading, setGlobalLoading] = useState(true)
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState<string | null>(null)

  // Référence pour stocker les états précédents et éviter les boucles infinies
  const stateRef = useRef(centralState)
  stateRef.current = centralState

  // ========================================
  // COUCHE 1: RÉCUPÉRATION CENTRALISÉE DES DONNÉES
  // ========================================

  // Fonction utilitaire pour mettre à jour une section du state
  const updateSection = useCallback((section: keyof CentralState, updates: Partial<CentralState[keyof CentralState]>) => {
    setCentralState(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
        lastFetch: updates.loading === false ? new Date().toISOString() : prev[section].lastFetch
      }
    }))
  }, [])

  // Récupération des profils utilisateurs
  const fetchProfiles = useCallback(async (force = false) => {
    const section = stateRef.current.profiles
    const shouldSkip = !force && section.data.length > 0 && section.lastFetch && 
      (Date.now() - new Date(section.lastFetch).getTime() < 2 * 60 * 1000)

    if (shouldSkip && !section.loading) return section.data

    updateSection('profiles', { loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      updateSection('profiles', { data: data || [], loading: false })
      return data || []

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      updateSection('profiles', { loading: false, error: errorMessage })
      console.error('❌ [CENTRAL] Erreur profils:', error)
      return []
    }
  }, [updateSection])

  // Récupération des annonces
  const fetchListings = useCallback(async (force = false) => {
    const section = stateRef.current.listings
    const shouldSkip = !force && section.data.length > 0 && section.lastFetch && 
      (Date.now() - new Date(section.lastFetch).getTime() < 2 * 60 * 1000)

    if (shouldSkip && !section.loading) return section.data

    updateSection('listings', { loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          suspended_by:profiles!listings_suspended_by_fkey(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const safeListingsData = Array.isArray(data) ? data : [];
      updateSection('listings', { data: safeListingsData, loading: false })
      return safeListingsData
      

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      updateSection('listings', { loading: false, error: errorMessage })
      console.error('❌ [CENTRAL] Erreur annonces:', error)
      return []
    }
  }, [updateSection])

  // Récupération des catégories
  const fetchCategories = useCallback(async (force = false) => {
    const section = stateRef.current.categories
    const shouldSkip = !force && section.data.length > 0 && section.lastFetch && 
      (Date.now() - new Date(section.lastFetch).getTime() < 5 * 60 * 1000)

    if (shouldSkip && !section.loading) return section.data

    updateSection('categories', { loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      const safeData = Array.isArray(data) ? data : [];
      updateSection('categories', { data: safeData, loading: false })
      return safeData
     
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      updateSection('categories', { loading: false, error: errorMessage })
      console.error('❌ [CENTRAL] Erreur catégories:', error)
      return []
    }
  }, [updateSection])

  // Récupération des signalements
  const fetchReports = useCallback(async (force = false) => {
    const section = stateRef.current.reports
    const shouldSkip = !force && section.data.length >= 0 && section.lastFetch && 
      (Date.now() - new Date(section.lastFetch).getTime() < 1 * 60 * 1000)

    if (shouldSkip && !section.loading) return section.data

    updateSection('reports', { loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          listing:listings(title, price),
          reported_user:profiles!reports_user_id_fkey(full_name, email),
          reporter:profiles!reports_reporter_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      updateSection('reports', { data: data || [], loading: false })
      return data || []

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      updateSection('reports', { loading: false, error: errorMessage })
      console.error('❌ [CENTRAL] Erreur signalements:', error)
      return []
    }
  }, [updateSection])

  // Récupération des sanctions utilisateurs
  const fetchUserSanctions = useCallback(async (force = false) => {
    const section = stateRef.current.userSanctions
    const shouldSkip = !force && section.data.length >= 0 && section.lastFetch && 
      (Date.now() - new Date(section.lastFetch).getTime() < 1 * 60 * 1000)

    if (shouldSkip && !section.loading) return section.data

    updateSection('userSanctions', { loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('user_sanctions')
        .select('*')
        .or('status.eq.active,status.eq.expired')

      if (error) throw error

      updateSection('userSanctions', { data: data || [], loading: false })
      return data || []

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      updateSection('userSanctions', { loading: false, error: errorMessage })
      console.error('❌ [CENTRAL] Erreur sanctions:', error)
      return []
    }
  }, [updateSection])

  // Récupération des données complémentaires
  const fetchSupplementaryData = useCallback(async (force = false) => {

    // Favoris
    const favoritesSection = stateRef.current.favorites
    const shouldSkipFavorites = !force && favoritesSection.data.length >= 0 && favoritesSection.lastFetch && 
      (Date.now() - new Date(favoritesSection.lastFetch).getTime() < 3 * 60 * 1000)

    if (!shouldSkipFavorites || favoritesSection.loading) {
      updateSection('favorites', { loading: true, error: null })
      try {
        const { data, error } = await supabase.from('favorites').select('*')
        if (error) throw error
        updateSection('favorites', { data: data || [], loading: false })
      } catch (error) {
        updateSection('favorites', { loading: false, error: error instanceof Error ? error.message : 'Erreur favoris' })
      }
    }

    // Messages
    const messagesSection = stateRef.current.messages
    const shouldSkipMessages = !force && messagesSection.data.length >= 0 && messagesSection.lastFetch && 
      (Date.now() - new Date(messagesSection.lastFetch).getTime() < 3 * 60 * 1000)

    if (!shouldSkipMessages || messagesSection.loading) {
      updateSection('messages', { loading: true, error: null })
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000)
        if (error) throw error
        updateSection('messages', { data: data || [], loading: false })
      } catch (error) {
        updateSection('messages', { loading: false, error: error instanceof Error ? error.message : 'Erreur messages' })
      }
    }

    // Reviews
    const reviewsSection = stateRef.current.reviews
    const shouldSkipReviews = !force && reviewsSection.data.length >= 0 && reviewsSection.lastFetch && 
      (Date.now() - new Date(reviewsSection.lastFetch).getTime() < 5 * 60 * 1000)

    if (!shouldSkipReviews || reviewsSection.loading) {
      updateSection('reviews', { loading: true, error: null })
      try {
        const { data, error } = await supabase.from('reviews').select('*')
        if (error) throw error
        updateSection('reviews', { data: data || [], loading: false })
      } catch (error) {
        updateSection('reviews', { loading: false, error: error instanceof Error ? error.message : 'Erreur reviews' })
      }
    }
  }, [updateSection])

  // ========================================
  // NOUVELLES FONCTIONS DE SYNCHRONISATION
  // ========================================

  // Fonction utilitaire pour compter les annonces actives d'un utilisateur
  const getUserActiveListingsCount = useCallback(async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        console.error('Erreur lors du comptage des annonces:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur lors du comptage des annonces:', error);
      return 0;
    }
  }, [])

  // Synchronisation automatique des annonces lors des actions utilisateur
  const syncUserListingsWithSuspension = useCallback(async (userId: string, userAction: 'suspend' | 'ban' | 'verify') => {
    
    try {
      let listingUpdateData: any = {
        updated_at: new Date().toISOString()
      };

      switch (userAction) {
        case 'suspend':
          // Quand un utilisateur est suspendu, on suspend toutes ses annonces actives
          listingUpdateData = {
            ...listingUpdateData,
            status: 'suspended',
            suspension_type: 'user', // Indique que c'est dû à la suspension utilisateur
            suspension_reason: 'Annonce suspendue suite à la suspension du propriétaire',
            suspended_by: user?.id || null,
            suspended_until: null, // Sera levée quand l'utilisateur sera réactivé
            moderation_notes: `Suspension automatique suite à la suspension de l'utilisateur le ${new Date().toLocaleString('fr-FR')}`
          };
          break;

        case 'ban':
          // Quand un utilisateur est banni, on suspend définitivement ses annonces
          listingUpdateData = {
            ...listingUpdateData,
            status: 'suspended',
            suspension_type: 'user',
            suspension_reason: 'Annonce suspendue suite au bannissement du propriétaire',
            suspended_by: user?.id || null,
            suspended_until: null, // Suspension permanente
            moderation_notes: `Suspension automatique suite au bannissement de l'utilisateur le ${new Date().toLocaleString('fr-FR')}`
          };
          break;

        case 'verify':
          // Quand un utilisateur est réactivé, on réactive ses annonces qui étaient suspendues pour cette raison
          listingUpdateData = {
            ...listingUpdateData,
            status: 'active',
            suspension_type: null,
            suspension_reason: null,
            suspended_by: null,
            suspended_until: null,
            moderation_notes: `Réactivation automatique suite à la réactivation de l'utilisateur le ${new Date().toLocaleString('fr-FR')}`
          };
          break;
      }

      // Construire la requête selon l'action
      let query = supabase
        .from('listings')
        .update(listingUpdateData)
        .eq('user_id', userId);

      if (userAction === 'verify') {
        // Pour la réactivation, on ne met à jour que les annonces suspendues à cause de l'utilisateur
        query = query.eq('suspension_type', 'user');
      } else {
        // Pour suspension/ban, on met à jour toutes les annonces actives
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [SYNC] Erreur lors de la synchronisation des annonces:', error);
        return false;
      }

      const affectedCount = data ? (data as any[]).length : 0;
      
      return true;

    } catch (error) {
      console.error('❌ [SYNC] Erreur lors de la synchronisation:', error);
      return false;
    }
  }, [user])

  // Fonction pour vérifier et corriger les incohérences existantes
  const fixExistingInconsistencies = useCallback(async () => {
    
    try {
      // Récupérer tous les utilisateurs suspendus/bannis
      const { data: suspendedUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, suspended_until, is_banned')
        .or('suspended_until.not.is.null,is_banned.eq.true');

      if (usersError) throw usersError;

      if (!suspendedUsers || suspendedUsers.length === 0) {
        return { fixed: 0, total: 0 };
      }

      let totalFixed = 0;

      for (const user of suspendedUsers) {
        // Vérifier si l'utilisateur est encore effectivement suspendu
        const now = new Date();
        const isCurrentlySuspended = user.is_banned || 
          (user.suspended_until && new Date(user.suspended_until) > now);

        if (isCurrentlySuspended) {
          // Récupérer les annonces actives de cet utilisateur (qui ne devraient pas l'être)
          const { data: activeListings, error: listingsError } = await supabase
            .from('listings')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active');

          if (listingsError) {
            console.error(`Erreur lors de la récupération des annonces pour ${user.id}:`, listingsError);
            continue;
          }

          if (activeListings && activeListings.length > 0) {
            // Suspendre ces annonces
            const { error: updateError } = await supabase
              .from('listings')
              .update({
                status: 'suspended',
                suspension_type: 'user',
                suspension_reason: 'Correction automatique - utilisateur suspendu',
                suspended_by: user?.id || null,
                moderation_notes: `Correction automatique des incohérences le ${new Date().toLocaleString('fr-FR')}`,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('status', 'active');

            if (updateError) {
              console.error(`Erreur lors de la correction pour ${user.id}:`, updateError);
            } else {
              totalFixed += activeListings.length;
            }
          }
        }
      }

      
      toast({
        title: "Maintenance terminée",
        description: `${totalFixed} annonce(s) d'utilisateurs suspendus ont été corrigées`,
      });

      return { fixed: totalFixed, total: suspendedUsers.length };

    } catch (error) {
      console.error('❌ [MAINTENANCE] Erreur lors de la correction:', error);
      
      toast({
        title: "Erreur de maintenance",
        description: "Impossible de corriger toutes les incohérences",
        variant: "destructive"
      });
      
      return { fixed: 0, total: 0 };
    }
  }, [user, toast]);

  // ========================================
  // COUCHE 2: LOGIQUES MÉTIER 
  // ========================================

  // Calcul des statistiques dashboard
  const computedDashboardStats = useMemo((): DashboardStats | null => {
    const profiles = centralState.profiles.data
    const listings = centralState.listings.data
    const reports = centralState.reports.data
    const reviews = centralState.reviews.data

    if (profiles.length === 0 && listings.length === 0) return null


    const totalUsers = profiles.length
    const totalListings = listings.length
    const pendingListings = listings.filter((l: any) => l.status === 'active').length
    const activeReports = reports.filter((r: any) => r.status === 'pending').length

    const usersWithListings = new Set(listings.map((l: any) => l.user_id))
    const conversionRate = totalUsers > 0 ? (usersWithListings.size / totalUsers) * 100 : 0

    const averageRating = reviews.length > 0 ? 
      reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length : 0

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentActivity = new Set([
      ...listings.filter((l: any) => new Date(l.created_at) > oneWeekAgo).map((l: any) => l.user_id),
      ...centralState.messages.data.filter((m: any) => new Date(m.created_at) > oneWeekAgo).map((m: any) => m.sender_id)
    ])
    const dailyActiveUsers = Math.round(recentActivity.size / 7)

    const usersThisWeek = profiles.filter((p: any) => new Date(p.created_at) > oneWeekAgo).length
    const listingsThisWeek = listings.filter((l: any) => new Date(l.created_at) > oneWeekAgo).length
    const reportsThisWeek = reports.filter((r: any) => new Date(r.created_at) > oneWeekAgo).length

    const weeklyGrowth = {
      users: usersThisWeek,
      listings: listingsThisWeek,
      reports: reportsThisWeek
    }

    // Calcul des régions
    const regionCounts = profiles.reduce((acc: any, profile: any) => {
      const location = profile.location || 'Non spécifié'
      const cleanLocation = location.split(',')[0].trim()
      acc[cleanLocation] = (acc[cleanLocation] || 0) + 1
      return acc
    }, {})

    const topRegions = Object.entries(regionCounts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .map(([name, userCount]: any) => {
        const regionListings = listings.filter((listing: any) => {
          const userProfile = profiles.find((p: any) => p.id === listing.user_id)
          return userProfile?.location?.split(',')[0].trim() === name
        }).length

        const weeklyRegionUsers = profiles.filter((p: any) => {
          const isFromRegion = p.location?.split(',')[0].trim() === name
          const isThisWeek = new Date(p.created_at) > oneWeekAgo
          return isFromRegion && isThisWeek
        }).length
        
        const growthRate = userCount > 0 ? (weeklyRegionUsers / userCount) * 100 : 0

        return {
          name,
          userCount,
          listingCount: regionListings,
          growthRate: parseFloat(growthRate.toFixed(1))
        }
      })

    // Métriques de qualité
    const resolvedReports = reports.filter((r: any) => r.status === 'resolved').length
    const reportResolutionRate = reports.length > 0 ? (resolvedReports / reports.length) * 100 : 100

    const verifiedUsers = profiles.filter((p: any) => p.is_verified === true).length
    const userVerificationRate = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0

    const averageResponseTime = 2.5
    const approvedListingsRate = totalListings > 0 ? (pendingListings / totalListings) * 100 : 0

    const qualityMetrics = {
      approvedListingsRate: parseFloat(approvedListingsRate.toFixed(1)),
      reportResolutionRate: parseFloat(reportResolutionRate.toFixed(1)),
      averageResponseTime: parseFloat(averageResponseTime.toFixed(1)),
      userVerificationRate: parseFloat(userVerificationRate.toFixed(1))
    }

    return {
      totalUsers,
      totalListings,
      pendingListings,
      activeReports,
      dailyActiveUsers,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      averageRating: parseFloat(averageRating.toFixed(1)),
      weeklyGrowth,
      topRegions,
      qualityMetrics
    }
  }, [centralState.profiles.data, centralState.listings.data, centralState.reports.data, centralState.reviews.data, centralState.messages.data])

  // Calcul des données hebdomadaires
  const computedWeeklyData = useMemo(() => {
    const profiles = centralState.profiles.data
    const listings = centralState.listings.data
    const reports = centralState.reports.data

    if (profiles.length === 0 && listings.length === 0) return []


    const weeklyData = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const usersCount = profiles.filter((profile: any) => {
        const createdAt = new Date(profile.created_at)
        return createdAt >= dayStart && createdAt <= dayEnd
      }).length

      const listingsCount = listings.filter((listing: any) => {
        const createdAt = new Date(listing.created_at)
        return createdAt >= dayStart && createdAt <= dayEnd
      }).length

      const reportsCount = reports.filter((report: any) => {
        const createdAt = new Date(report.created_at)
        return createdAt >= dayStart && createdAt <= dayEnd
      }).length

      weeklyData.push({
        name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        users: usersCount,
        listings: listingsCount,
        reports: reportsCount
      })
    }

    return weeklyData
  }, [centralState.profiles.data, centralState.listings.data, centralState.reports.data])

  // Calcul des données de catégories
  const computedCategoryData = useMemo(() => {
    const listings = centralState.listings.data
    const categories = centralState.categories.data

    if (listings.length === 0 || categories.length === 0) return []


    const categoriesMap = new Map(categories.map((cat: any) => [cat.id, cat]))
    const categoryStats = new Map<string, { count: number; category: any }>()

    listings.forEach((listing: any) => {
      const category = categoriesMap.get(listing.category_id)
      const categoryName = category?.name || 'Non catégorisé'
      const categoryId = listing.category_id || 'uncategorized'

      const existing = categoryStats.get(categoryId)
      if (existing) {
        existing.count++
      } else {
        categoryStats.set(categoryId, {
          count: 1,
          category: category || { name: 'Non catégorisé', id: 'uncategorized' }
        })
      }
    })

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ]

    const categoryData = Array.from(categoryStats.entries())
      .map(([categoryId, data], index) => ({
        name: data.category.name,
        value: data.count,
        color: colors[index % colors.length],
        percentage: 0
      }))
      .sort((a, b) => b.value - a.value)

    const total = categoryData.reduce((sum, item) => sum + item.value, 0)
    categoryData.forEach(item => {
      item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0
    })

    return categoryData
  }, [centralState.listings.data, centralState.categories.data])

  // Calcul des utilisateurs enrichis
  const computedUsers = useMemo((): AdminUser[] => {
    const profiles = centralState.profiles.data
    const listings = centralState.listings.data
    const reports = centralState.reports.data

    if (profiles.length === 0) return []


    return profiles.map((user: any) => {
      const userListings = listings.filter((l: any) => l.user_id === user.id)
      const listingsCount = userListings.length
      const activeListingsCount = userListings.filter((l: any) => l.status === 'active').length
      const totalViewsReceived = userListings.reduce((sum: number, l: any) => sum + (l.views_count || 0), 0)

      const reportsMade = reports.filter((r: any) => r.reporter_id === user.id).length
      const reportsReceived = reports.filter((r: any) => 
        r.user_id === user.id || 
        (r.listings && r.listings.user_id === user.id)
      ).length

      const accountCreated = new Date(user.created_at)
      const now = new Date()
      const accountAgeDays = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24))

      // Calcul du score de confiance basé sur des métriques réelles
      let trustScore = 40; // Base réduite

      // Facteurs positifs
      trustScore += Math.min(accountAgeDays * 0.2, 25); // Ancienneté du compte
      trustScore += Math.min(activeListingsCount * 3, 20); // Annonces actives
      trustScore += Math.min((userListings.reduce((sum, l) => sum + (l.views_count || 0), 0) / Math.max(userListings.length, 1)) * 0.1, 10); // Moyenne des vues

      // Facteurs de vérification
      if (user.phone && user.full_name && user.location) trustScore += 15; // Profil complet
      else if (user.phone && user.full_name) trustScore += 10; // Profil partiel

      // Facteurs négatifs (plus sévères)
      trustScore -= reportsReceived * 15; // Signalements reçus
      trustScore -= Math.min((now.getTime() - new Date(user.last_activity || user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7), 10); // Inactivité

      // Bonus pour utilisateurs actifs récents
      const recentMessages = centralState.messages.data.filter(m => 
        (m.sender_id === user.id || m.recipient_id === user.id) && 
        new Date(m.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;
      trustScore += Math.min(recentMessages * 0.5, 5);

      // Normalisation finale
      trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (reportsReceived > 2 || trustScore < 30) {
        riskLevel = 'high'
      } else if (reportsReceived > 0 || trustScore < 60) {
        riskLevel = 'medium'
      }

      let status: AdminUser['status'] = 'active'
      if (riskLevel === 'high' && reportsReceived > 3) {
        status = 'suspended'
      } else if (!user.full_name || !user.phone) {
        status = 'pending_verification'
      }

      const verificationStatus: AdminUser['verification_status'] = 
        (user.phone && user.full_name) ? 'verified' : 'pending'

      return {
        ...user,
        status,
        trust_score: Math.round(trustScore),
        listings_count: listingsCount,
        active_listings_count: activeListingsCount,
        reports_received: reportsReceived,
        reports_made: reportsMade,
        last_activity: user.updated_at || user.created_at,
        verification_status: verificationStatus,
        total_views_received: totalViewsReceived,
        total_messages_sent: 0,
        total_messages_received: 0,
        account_age_days: accountAgeDays,
        risk_level: riskLevel,
        warning_count: 0
      } as AdminUser
    })
  }, [centralState.profiles.data, centralState.listings.data, centralState.reports.data])

  // Calcul des annonces enrichies AVEC DÉTECTION D'INCOHÉRENCES
  const computedListings = useMemo((): AdminListing[] => {
    const listings = centralState.listings.data
    const profiles = centralState.profiles.data
    const categories = centralState.categories.data
    const favorites = centralState.favorites.data
    const messages = centralState.messages.data
    const reports = centralState.reports.data

    if (listings.length === 0) return []


    const profilesMap = new Map(profiles.map((profile: any) => [profile.id, profile]))
    const categoriesMap = new Map(categories.map((category: any) => [category.id, category]))

    return listings.map((listing: any) => {
      const profile = profilesMap.get(listing.user_id)
      const category = categoriesMap.get(listing.category_id)

      const favoritesCount = favorites.filter((f: any) => f.listing_id === listing.id).length
      const messagesCount = messages.filter((m: any) => m.listing_id === listing.id).length
      const reportsCount = reports.filter((r: any) => r.listing_id === listing.id).length

      const createdAt = new Date(listing.created_at)
      const now = new Date()
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      
      const expiresAt = listing.expires_at ? new Date(listing.expires_at) : null
      const daysUntilExpiry = expiresAt 
        ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const suspendedUntil = listing.suspended_until ? new Date(listing.suspended_until) : null
      const isTemporarilySuspended = suspendedUntil && suspendedUntil > now
      const suspensionExpiresInDays = isTemporarilySuspended 
        ? Math.ceil((suspendedUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      let qualityScore = listing.quality_score || 50
      
      if (!listing.quality_score) {
        qualityScore = 50
        qualityScore += Math.min((listing.images?.length || 0) * 8, 30)
        if (listing.description && listing.description.length > 100) qualityScore += 15
        if (listing.contact_phone) qualityScore += 8
        if (listing.contact_whatsapp) qualityScore += 4
        if (listing.contact_email) qualityScore += 3
        qualityScore -= reportsCount * 15
        qualityScore += Math.min(favoritesCount * 2, 10)
        qualityScore += Math.min(listing.views_count * 0.05, 5)
        if (daysSinceCreation > 60 && listing.views_count < 10) qualityScore -= 10
        qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)))
      }

      const engagementRate = listing.views_count > 0 
        ? ((favoritesCount + messagesCount) / listing.views_count) * 100 
        : 0

      // DÉTECTION D'INCOHÉRENCE
      const isUserSuspended = profile && (
        profile.is_banned || 
        (profile.suspended_until && new Date(profile.suspended_until) > now)
      )
      
      const isListingActive = listing.status === 'active'
      const hasInconsistency = isUserSuspended && isListingActive
      
      if (hasInconsistency) {
        console.warn(`⚠️ [INCONSISTENCY] Annonce active ${listing.id} appartient à utilisateur suspendu ${profile.id}`)
      }

      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (reportsCount >= 3 || qualityScore < 30 || hasInconsistency) {
        riskLevel = 'high'
      } else if (reportsCount >= 1 || qualityScore < 60 || listing.price < 5000) {
        riskLevel = 'medium'
      }

      const needsReview = 
        riskLevel === 'high' || 
        (listing.images?.length || 0) === 0 || 
        reportsCount > 0 ||
        (listing.price < 10000 && listing.title.toLowerCase().includes('iphone')) ||
        qualityScore < 40 ||
        hasInconsistency

      return {
        ...listing,
        merchant_name: profile?.full_name || 'Marchand inconnu',
        merchant_email: profile?.email || '',
        merchant_phone: profile?.phone,
        category_name: category?.name || (listing.category_id ? 'Catégorie non trouvée' : 'Aucune catégorie'),
        
        quality_score: qualityScore,
        favorites_count: favoritesCount,
        messages_count: messagesCount,
        reports_count: reportsCount,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        days_since_creation: daysSinceCreation,
        days_until_expiry: daysUntilExpiry,
        last_activity: listing.updated_at || listing.created_at,
        needs_review: needsReview,
        is_featured: listing.featured || false,
        risk_level: riskLevel,
        is_temporarily_suspended: isTemporarilySuspended,
        suspension_expires_in_days: suspensionExpiresInDays,
        
        suspended_until: listing.suspended_until || null,
        suspension_reason: listing.suspension_reason || null,
        suspension_type: listing.suspension_type || null,
        suspended_by: listing.suspended_by || null,
        moderation_notes: listing.moderation_notes || null,
        
        // NOUVELLES PROPRIÉTÉS POUR LA DÉTECTION D'INCOHÉRENCES
        owner_suspended: isUserSuspended,
        has_inconsistency: hasInconsistency,
        inconsistency_type: hasInconsistency ? 'user_suspended_listing_active' : null
      } as AdminListing
    })
  }, [centralState.listings.data, centralState.profiles.data, centralState.categories.data, 
      centralState.favorites.data, centralState.messages.data, centralState.reports.data])

  // Calcul des signalements enrichis
  const computedReports = useMemo((): AdminReport[] => {
    const reports = centralState.reports.data

    if (reports.length === 0) return []


    const enrichedReports: AdminReport[] = reports.map((report: any) => {
      let priority: 'low' | 'medium' | 'high' = 'medium'
      const reasonLower = (report.reason || '').toLowerCase()
      
      if (reasonLower.includes('fraude') || 
          reasonLower.includes('arnaque') ||
          reasonLower.includes('violence') ||
          reasonLower.includes('menace') ||
          reasonLower.includes('inapproprié')) {
        priority = 'high'
      } else if (reasonLower.includes('spam') ||
                 reasonLower.includes('doublon') ||
                 reasonLower.includes('prix')) {
        priority = 'low'
      }

      const createdAt = new Date(report.created_at)
      const now = new Date()
      const responseTimeHours = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))

      const listing = Array.isArray(report.listing) ? report.listing[0] : report.listing
      const reportedUser = Array.isArray(report.reported_user) ? report.reported_user[0] : report.reported_user
      const reporter = Array.isArray(report.reporter) ? report.reporter[0] : report.reporter

      return {
        ...report,
        listing_title: listing?.title || null,
        listing_price: listing?.price || null,
        reported_user_name: reportedUser?.full_name || 'Utilisateur inconnu',
        reported_user_email: reportedUser?.email || null,
        reporter_name: reporter?.full_name || report.guest_name || 'Anonyme',
        reporter_email: reporter?.email || report.guest_email || null,
        reporter_type: report.reporter_id ? 'registered' : 'guest',
        priority,
        response_time_hours: responseTimeHours,
        report_type: report.report_type || 'listing'
      } as AdminReport
    })

    enrichedReports.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      
      if (priorityDiff !== 0) return priorityDiff
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return enrichedReports
  }, [centralState.reports.data])

  // Calcul des sanctions actives
  const computedSanctions = useMemo((): ActiveSanction[] => {
    const userSanctions = centralState.userSanctions.data
    const suspendedListings = centralState.listings.data.filter((l: any) => l.status === 'suspended')
    const profiles = centralState.profiles.data


    const normalizedSanctions: ActiveSanction[] = []
    const now = new Date()

    const profilesMap = new Map(profiles.map((profile: any) => [profile.id, profile]))

    userSanctions?.forEach((sanction: any) => {
      const userProfile = profilesMap.get(sanction.user_id)
      const adminProfile = profilesMap.get(sanction.admin_id)
      
      const expiresAt = sanction.effective_until ? new Date(sanction.effective_until) : null
      const isExpired = expiresAt && expiresAt < now
      const daysRemaining = expiresAt ? 
        Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

      normalizedSanctions.push({
        id: sanction.id,
        type: 'user',
        target_id: sanction.user_id,
        target_name: userProfile?.full_name || 'Utilisateur inconnu',
        target_email: userProfile?.email,
        sanction_type: sanction.sanction_type || 'suspend',
        reason: sanction.reason || 'Raison non spécifiée',
        admin_name: adminProfile?.full_name || 'Admin inconnu',
        admin_id: sanction.admin_id || '',
        created_at: sanction.created_at,
        expires_at: sanction.effective_until,
        is_permanent: !sanction.effective_until,
        status: isExpired ? 'expired' : sanction.status as any,
        days_remaining: daysRemaining,
        notes: sanction.description,
        description: sanction.description,
        duration_days: sanction.duration_days,
        effective_from: sanction.effective_from,
        revoked_at: sanction.revoked_at,
        revoked_by: sanction.revoked_by,
        revoked_reason: sanction.revoked_reason
      })
    })

    suspendedListings.forEach((listing: any) => {
      const userProfile = profilesMap.get(listing.user_id)
      const adminProfile = profilesMap.get(listing.suspended_by)
      
      const expiresAt = listing.suspended_until ? new Date(listing.suspended_until) : null
      const isExpired = expiresAt && expiresAt < now
      const daysRemaining = expiresAt ? 
        Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

      normalizedSanctions.push({
        id: listing.id,
        type: 'listing',
        target_id: listing.id,
        target_name: listing.title || 'Annonce sans titre',
        target_email: userProfile?.email,
        sanction_type: 'suspend',
        reason: listing.suspension_reason || 'Suspension d\'annonce',
        admin_name: adminProfile?.full_name || 'Système',
        admin_id: listing.suspended_by || '',
        created_at: listing.updated_at || listing.created_at,
        expires_at: listing.suspended_until,
        is_permanent: !listing.suspended_until,
        status: isExpired ? 'expired' : 'active',
        days_remaining: daysRemaining,
        notes: listing.moderation_notes
      })
    })

    return normalizedSanctions
  }, [centralState.userSanctions.data, centralState.listings.data, centralState.profiles.data])

  // Surveillance automatique des incohérences
  useEffect(() => {
    const checkConsistency = async () => {
      try {
        // Requête pour détecter les incohérences
        const { data: inconsistencies, error } = await supabase
          .from('listings')
          .select(`
            id, 
            title, 
            user_id, 
            status,
            profiles!inner(id, suspended_until, is_banned)
          `)
          .eq('status', 'active')
          .or('profiles.suspended_until.not.is.null,profiles.is_banned.eq.true');

        if (error) {
          console.error('Erreur lors de la vérification de cohérence:', error);
          return;
        }

        if (inconsistencies && inconsistencies.length > 0) {
          console.warn(`⚠️ [COHERENCE] ${inconsistencies.length} incohérence(s) détectée(s)`);
          
          toast({
            title: "Incohérences détectées",
            description: `${inconsistencies.length} annonce(s) d'utilisateurs suspendus sont encore actives`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de cohérence:', error);
      }
    };

    // Vérifier la cohérence au chargement et périodiquement
    const interval = setInterval(checkConsistency, 5 * 60 * 1000); // Toutes les 5 minutes

    // Vérification initiale
    checkConsistency();

    return () => clearInterval(interval);
  }, [toast])

  // Méthode publique pour la correction manuelle
  const handleManualConsistencyFix = useCallback(async () => {
    const result = await fixExistingInconsistencies();
    
    toast({
      title: "Vérification terminée",
      description: result.fixed > 0 
        ? `${result.fixed} incohérence(s) corrigée(s) sur ${result.total} utilisateur(s) vérifiés`
        : `Aucune incohérence détectée sur ${result.total} utilisateur(s) vérifiés`,
    });
    
    return result;
  }, [fixExistingInconsistencies, toast]);

  // SYNCHRONISATION AUTOMATIQUE avec les changements d'état
  useEffect(() => {
    // Mettre à jour les statuts des utilisateurs basés sur les sanctions actives
    const activeSanctions = computedSanctions.filter(s => s.status === 'active' && s.type === 'user')
    
    activeSanctions.forEach(sanction => {
      const user = centralState.profiles.data.find(u => u.id === sanction.target_id)
      if (user && user.status !== 'suspended' && user.status !== 'banned') {
      }
    })
  }, [computedSanctions, centralState.profiles.data])

  // ========================================
  // COUCHE 3: FONCTIONS D'ACTIONS AMÉLIORÉES
  // ========================================

  // ACTION UTILISATEUR AVEC SYNCHRONISATION
  const handleUserAction = useCallback(async (userId: string, action: UserAction) => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette action.",
        variant: "destructive"
      })
      return false
    }

    
    try {
      let updateData: any = {
        updated_at: new Date().toISOString()
      }

      // ÉTAPE 1: Préparer les données utilisateur selon l'action
      switch (action.type) {
        case 'verify':
          updateData = {
            ...updateData,
            suspended_until: null,
            suspension_reason: null,
            is_banned: false,
            ban_reason: null
          }
          break

        case 'suspend':
          if (action.duration) {
            const suspensionEnd = new Date()
            suspensionEnd.setDate(suspensionEnd.getDate() + action.duration)
            updateData = {
              ...updateData,
              suspended_until: suspensionEnd.toISOString(),
              suspension_reason: action.reason,
              is_banned: false
            }
          }
          break

        case 'ban':
          updateData = {
            ...updateData,
            is_banned: true,
            ban_reason: action.reason,
            suspended_until: null,
            suspension_reason: null
          }
          break

        case 'promote':
          updateData.role = 'admin'
          break

        case 'demote':
          updateData.role = 'merchant'
          break
      }

      // ÉTAPE 2: Mettre à jour l'utilisateur
      if (action.type !== 'warn') {
        const { error: userError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId)

        if (userError) throw userError
      }

      // ÉTAPE 3: SYNCHRONISATION AUTOMATIQUE DES ANNONCES
      if (['suspend', 'ban', 'verify'].includes(action.type)) {
        
        const syncSuccess = await syncUserListingsWithSuspension(userId, action.type as 'suspend' | 'ban' | 'verify');
        
        if (!syncSuccess) {
          console.warn('⚠️ [SYNC] La synchronisation des annonces a échoué mais l\'action utilisateur a réussi');
        }
      }

      // ÉTAPE 4: Enregistrer la sanction si nécessaire
      if (['suspend', 'ban', 'warn'].includes(action.type)) {
        try {
          let sanctionType = action.type === 'suspend' ? 'suspension' : 
                            action.type === 'ban' ? 'permanent_ban' : 'warning'
          
          await supabase.from('user_sanctions').insert({
            user_id: userId,
            admin_id: user.id,
            sanction_type: sanctionType,
            reason: action.reason,
            description: action.notes,
            duration_days: action.duration || null,
            effective_until: action.type === 'suspend' && action.duration ? 
              new Date(Date.now() + action.duration * 24 * 60 * 60 * 1000).toISOString() : null
          })
        } catch (sanctionError) {
          console.warn('Impossible d\'enregistrer la sanction:', sanctionError)
        }
      }

      // ÉTAPE 5: Message de confirmation amélioré
      const actionMessages = {
        suspend: action.duration 
          ? `Utilisateur et ses ${await getUserActiveListingsCount(userId)} annonces suspendus pour ${action.duration} jour(s)`
          : 'Utilisateur et ses annonces suspendus définitivement',
        ban: `Utilisateur banni et ses annonces définitivement suspendues`,
        verify: `Utilisateur et ses annonces réactivés avec succès`,
        promote: 'Utilisateur promu administrateur',
        demote: 'Privilèges administrateur retirés',
        warn: 'Avertissement envoyé à l\'utilisateur'
      };

      toast({
        title: "Action appliquée avec succès",
        description: actionMessages[action.type as keyof typeof actionMessages] || "Action appliquée avec succès"
      })

      // ÉTAPE 6: Rafraîchir les données
      fetchProfiles(true)
      fetchListings(true) // Important: rafraîchir aussi les annonces
      if (['suspend', 'ban', 'warn'].includes(action.type)) {
        fetchUserSanctions(true)
      }

      return true

    } catch (error) {
      console.error(`Erreur lors de l'action ${action.type}:`, error)
      
      toast({
        title: "Erreur d'action",
        description: "Impossible d'appliquer l'action sur cet utilisateur.",
        variant: "destructive"
      })
      
      return false
    }
  }, [user, toast, fetchProfiles, fetchListings, fetchUserSanctions, syncUserListingsWithSuspension, getUserActiveListingsCount])

  // Actions sur les annonces
  const handleListingAction = useCallback(async (listingId: string, action: ListingAction): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette action.",
        variant: "destructive"
      })
      return false
    }

    
    try {
      let updateData: any = {
        updated_at: new Date().toISOString()
      }

      switch (action.type) {
        case 'approve':
          updateData.status = 'active'
          updateData.suspended_until = null
          updateData.suspension_reason = null
          updateData.suspension_type = null
          updateData.suspended_by = null
          break

        case 'suspend_listing':
          updateData.status = 'suspended'
          updateData.suspension_reason = action.reason
          updateData.suspension_type = 'admin'
          updateData.suspended_by = user.id
          updateData.moderation_notes = action.notes
          
          if (action.duration && action.duration > 0) {
            const suspendedUntil = new Date(Date.now() + action.duration * 24 * 60 * 60 * 1000)
            updateData.suspended_until = suspendedUntil.toISOString()
          } else {
            updateData.suspended_until = null
          }
          break

        case 'suspend':
          updateData.status = 'suspended'
          updateData.suspension_reason = action.reason
          updateData.suspension_type = 'admin'
          updateData.suspended_by = user.id
          updateData.moderation_notes = action.notes
          
          if (action.duration && action.duration > 0) {
            const suspendedUntil = new Date(Date.now() + action.duration * 24 * 60 * 60 * 1000)
            updateData.suspended_until = suspendedUntil.toISOString()
          } else {
            updateData.suspended_until = null
          }
          break

        case 'unsuspend':
          updateData.status = 'active'
          updateData.suspended_until = null
          updateData.suspension_reason = null
          updateData.suspension_type = null
          updateData.suspended_by = null
          updateData.moderation_notes = action.notes || `Suspension levée par ${user.email || 'administrateur'}`
          break

        case 'remove_listing':
          updateData.status = 'suspended'
          updateData.suspension_reason = action.reason
          updateData.suspension_type = 'admin'
          updateData.suspended_by = user.id
          updateData.moderation_notes = `SUPPRIMÉ DÉFINITIVEMENT: ${action.notes || ''}`
          updateData.suspended_until = null
          break

        case 'feature':
          updateData.featured = true
          break

        case 'unfeature':
          updateData.featured = false
          break

        case 'extend_expiry':
          if (action.duration) {
            const listing = computedListings.find(l => l.id === listingId)
            const currentExpiry = listing?.expires_at ? new Date(listing.expires_at) : new Date()
            const newExpiry = new Date(currentExpiry.getTime() + action.duration * 24 * 60 * 60 * 1000)
            updateData.expires_at = newExpiry.toISOString()
          }
          break
      }

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId)

      if (error) throw error

      try {
        await supabase
          .from('admin_actions')
          .insert({
            admin_id: user.id,
            action_type: action.type,
            target_type: 'listing',
            target_id: listingId,
            reason: action.reason,
            notes: action.notes,
            metadata: { 
              duration: action.duration,
              suspension_type: updateData.suspension_type,
              is_permanent: !updateData.suspended_until
            }
          })
      } catch (auditError) {
        console.warn('Impossible d\'enregistrer l\'action d\'audit:', auditError)
      }

      const actionMessages = {
        approve: 'Annonce approuvée avec succès',
        suspend_listing: action.duration 
          ? `Annonce suspendue par l'administration pour ${action.duration} jour(s)`
          : 'Annonce suspendue définitivement par l\'administration',
        suspend: action.duration 
          ? `Annonce suspendue pour ${action.duration} jour(s)`
          : 'Annonce suspendue définitivement',
        unsuspend: 'Suspension administrative levée avec succès',
        feature: 'Annonce mise en avant',
        unfeature: 'Mise en avant supprimée',
        extend_expiry: `Expiration prolongée de ${action.duration} jour(s)`,
        remove_listing: 'Annonce supprimée définitivement par l\'administration'
      }

      toast({
        title: "Action administrative appliquée",
        description: actionMessages[action.type as keyof typeof actionMessages] || "Action appliquée avec succès"
      })

      await fetchListings(true)
      return true

    } catch (error) {
      console.error(`Erreur action ${action.type}:`, error)
      
      toast({
        title: "Erreur d'action",
        description: error instanceof Error ? error.message : "Impossible d'appliquer l'action",
        variant: "destructive"
      })
      
      return false
    }
  }, [user, toast, computedListings, fetchListings])

  // Actions sur les signalements
  const handleReportAction = useCallback(async (reportId: string, action: ReportAction): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette action.",
        variant: "destructive"
      })
      return false
    }

    
    try {
      const report = computedReports.find(r => r.id === reportId)
      if (!report) {
        throw new Error('Signalement non trouvé')
      }

      let newStatus: 'pending' | 'in_review' | 'resolved' | 'dismissed' = 'resolved'
      let shouldExecuteUserAction = false
      let shouldExecuteListingAction = false
      
      // Déterminer le nouveau statut du signalement
      switch (action.type) {
        case 'approve':
          newStatus = 'resolved'
          break
        case 'dismiss':
          newStatus = 'dismissed'
          break
        case 'escalate':
          newStatus = 'in_review'
          break
        case 'ban_user':
        case 'suspend_user':
        case 'warn_user':
          newStatus = 'resolved'
          shouldExecuteUserAction = true
          break
        case 'remove_listing':
        case 'suspend_listing':
          newStatus = 'resolved'
          shouldExecuteListingAction = true
          break
        default:
          newStatus = 'resolved'
      }

      // Mettre à jour le statut du signalement
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (updateError) throw updateError

      // Exécuter l'action sur l'utilisateur si nécessaire
      if (shouldExecuteUserAction) {
        const targetUserId = report.user_id || 
        (report.listing && typeof report.listing === 'object' ? report.listing.user_id : null)
        if (targetUserId) {
          let userActionType: 'warn' | 'suspend' | 'ban' = 'warn'
          
          switch (action.type) {
            case 'warn_user':
              userActionType = 'warn'
              break
            case 'suspend_user':
              userActionType = 'suspend'
              break
            case 'ban_user':
              userActionType = 'ban'
              break
          }

          const userActionSuccess = await handleUserAction(targetUserId, {
            type: userActionType,
            reason: action.reason,
            notes: action.notes,
            duration: action.duration
          })

          if (!userActionSuccess) {
            console.warn('Action utilisateur échouée, mais signalement marqué comme résolu')
          }
        }
      }

      // Exécuter l'action sur l'annonce si nécessaire
      if (shouldExecuteListingAction && report.listing_id) {
        let listingActionType: 'suspend_listing' | 'remove_listing' = 'suspend_listing'
        
        switch (action.type) {
          case 'suspend_listing':
            listingActionType = 'suspend_listing'
            break
          case 'remove_listing':
            listingActionType = 'remove_listing'
            break
        }

        const listingActionSuccess = await handleListingAction(report.listing_id, {
          type: listingActionType,
          reason: action.reason,
          notes: action.notes,
          duration: action.duration
        })

        if (!listingActionSuccess) {
          console.warn('Action annonce échouée, mais signalement marqué comme résolu')
        }
      }

      // Enregistrer l'action dans l'audit trail
      try {
        await supabase
          .from('admin_actions')
          .insert({
            admin_id: user.id,
            action_type: action.type,
            target_type: 'report',
            target_id: reportId,
            reason: action.reason,
            notes: action.notes,
            metadata: { 
              original_status: report.status,
              new_status: newStatus,
              duration: action.duration,
              target_user_id: report.user_id,
              target_listing_id: report.listing_id
            }
          })
      } catch (auditError) {
        console.warn('Impossible d\'enregistrer l\'action d\'audit:', auditError)
      }

      const actionMessages = {
        approve: 'Signalement approuvé avec succès',
        dismiss: 'Signalement rejeté avec succès', 
        escalate: 'Signalement escaladé avec succès',
        ban_user: 'Utilisateur banni suite au signalement',
        suspend_user: 'Utilisateur suspendu suite au signalement',
        warn_user: 'Utilisateur averti suite au signalement',
        remove_listing: 'Annonce supprimée suite au signalement',
        suspend_listing: 'Annonce suspendue suite au signalement'
      }

      toast({
        title: "Action appliquée",
        description: actionMessages[action.type as keyof typeof actionMessages] || 'Action appliquée avec succès'
      })

      // Rafraîchir les données
      await fetchReports(true)
      if (shouldExecuteUserAction) {
        await fetchProfiles(true)
        await fetchUserSanctions(true)
      }
      if (shouldExecuteListingAction) {
        await fetchListings(true)
      }
      
      return true

    } catch (error) {
      console.error(`Échec action ${action.type}:`, error)
      
      toast({
        title: "Erreur lors de l'action",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      })
      
      return false
    }
  }, [user, toast, computedReports, fetchReports, handleUserAction, handleListingAction, fetchProfiles, fetchUserSanctions, fetchListings])

  // ========================================
  // COUCHE 4: FONCTIONS DE RAFRAÎCHISSEMENT
  // ========================================

  const refreshSection = useCallback(async (section: keyof CentralState | 'all', force = false) => {

    if (section === 'all' || section === 'profiles') {
      await fetchProfiles(force)
    }
    if (section === 'all' || section === 'listings') {
      await fetchListings(force)
    }
    if (section === 'all' || section === 'categories') {
      await fetchCategories(force)
    }
    if (section === 'all' || section === 'reports') {
      await fetchReports(force)
    }
    if (section === 'all' || section === 'userSanctions') {
      await fetchUserSanctions(force)
    }
    if (section === 'all') {
      await fetchSupplementaryData(force)
    }

    setLastGlobalRefresh(new Date().toISOString())
  }, [fetchProfiles, fetchListings, fetchCategories, fetchReports, fetchUserSanctions, fetchSupplementaryData])

  const refreshAllData = useCallback(async () => {
    setGlobalLoading(true)

    try {
      await Promise.all([
        fetchProfiles(true),
        fetchListings(true),
        fetchCategories(true),
        fetchReports(true),
        fetchUserSanctions(true)
      ])

      await fetchSupplementaryData(true)

      
      toast({
        title: "Données mises à jour",
        description: "Toutes les données ont été actualisées avec succès.",
      })

    } catch (error) {
      console.error('❌ [CENTRAL] Erreur rafraîchissement global:', error)
      
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de récupérer certaines données. Vérifiez votre connexion.",
        variant: "destructive"
      })
    } finally {
      setGlobalLoading(false)
      setLastGlobalRefresh(new Date().toISOString())
    }
  }, [fetchProfiles, fetchListings, fetchCategories, fetchReports, fetchUserSanctions, fetchSupplementaryData, toast])

  // ========================================
  // COUCHE 5: FONCTIONS UTILITAIRES
  // ========================================

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('fr-BF', { 
      style: 'currency', 
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }, [])

  const formatPercentage = useCallback((value: number): string => {
    return `${value.toFixed(1)}%`
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // ========================================
  // INITIALISATION
  // ========================================

  useEffect(() => {
    refreshAllData()

    const interval = setInterval(() => {
      refreshSection('all', false)
    }, 3 * 60 * 1000)

    return () => {
      clearInterval(interval)
    }
  }, [refreshAllData, refreshSection])

  // ========================================
  // INTERFACE PUBLIQUE UNIFIÉE AVEC NOUVELLES FONCTIONS
  // ========================================

  return {
    // ===== ÉTAT GLOBAL =====
    globalLoading,
    lastGlobalRefresh,
    isHealthy: !globalLoading && Object.values(centralState).every(section => !section.error),

    // ===== DONNÉES CALCULÉES =====
    dashboardStats: computedDashboardStats,
    weeklyData: computedWeeklyData,
    categoryData: computedCategoryData,
    
    // ===== UTILISATEURS =====
    users: computedUsers,
    activeUsersCount: computedUsers.filter(u => u.status === 'active').length,
    suspendedUsersCount: computedUsers.filter(u => u.status === 'suspended').length,
    pendingVerificationCount: computedUsers.filter(u => u.status === 'pending_verification').length,
    
    // ===== ANNONCES =====
    listings: computedListings,
    needsReviewCount: computedListings.filter(l => l.needs_review).length,
    
    // ===== SIGNALEMENTS =====
    reports: computedReports,
    pendingCount: computedReports.filter(r => r.status === 'pending').length,
    
    // ===== SANCTIONS =====
    sanctions: computedSanctions,
    stats: {
      totalActive: computedSanctions.filter(s => s.status === 'active').length,
      userSanctions: computedSanctions.filter(s => s.type === 'user' && s.status === 'active').length,
      listingSanctions: computedSanctions.filter(s => s.type === 'listing' && s.status === 'active').length,
      temporaryCount: computedSanctions.filter(s => !s.is_permanent && s.status === 'active').length,
      permanentCount: computedSanctions.filter(s => s.is_permanent && s.status === 'active').length,
      expiringSoon: computedSanctions.filter(s => s.days_remaining !== null && s.days_remaining <= 1).length,
      expiredToday: computedSanctions.filter(s => s.status === 'expired' && s.expires_at && 
        new Date(s.expires_at).toDateString() === new Date().toDateString()).length,
      createdToday: computedSanctions.filter(s => 
        new Date(s.created_at).toDateString() === new Date().toDateString()).length
    },
    activeSanctionsCount: computedSanctions.filter(s => s.status === 'active').length,
    expiringSoonCount: computedSanctions.filter(s => s.days_remaining !== null && s.days_remaining <= 1).length,

    // ===== ACTIONS =====
    handleUserAction,
    handleListingAction,
    handleReportAction,
    
    // ===== NOUVELLES FONCTIONS DE SYNCHRONISATION =====
    fixExistingInconsistencies: handleManualConsistencyFix,
    syncUserListings: syncUserListingsWithSuspension,
    getUserActiveListingsCount,
    
    // ===== STATISTIQUES D'INCOHÉRENCES =====
    inconsistencyStats: {
      total: computedListings.filter(l => l.has_inconsistency).length,
      userSuspendedListingsActive: computedListings.filter(l => 
        l.inconsistency_type === 'user_suspended_listing_active'
      ).length,
    },
    
    // ===== RAFRAÎCHISSEMENT =====
    refreshAllData,
    refreshSection,
    refreshStats: () => refreshSection('all'),
    refreshUsers: () => refreshSection('profiles'),
    refreshListings: () => refreshSection('listings'),
    refreshReports: () => refreshSection('reports'),
    refreshSanctions: () => refreshSection('userSanctions'),

    // ===== FONCTIONS DE SANCTIONS =====
    revokeSanction: async (sanctionId: string, sanctionType: 'user' | 'listing', reason: string): Promise<boolean> => {
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour révoquer une sanction.",
          variant: "destructive"
        })
        return false
      }

      
      try {
        if (sanctionType === 'user') {
          const { error } = await supabase
            .from('user_sanctions')
            .update({
              status: 'revoked',
              revoked_at: new Date().toISOString(),
              revoked_by: user.id,
              revoked_reason: reason,
              updated_at: new Date().toISOString()
            })
            .eq('id', sanctionId)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('listings')
            .update({
              status: 'active',
              suspended_until: null,
              suspension_reason: null,
              suspension_type: null,
              suspended_by: null,
              moderation_notes: `Suspension levée: ${reason}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', sanctionId)

          if (error) throw error
        }

        toast({
          title: "Sanction révoquée",
          description: "La sanction a été révoquée avec succès."
        })

        if (sanctionType === 'user') {
          fetchUserSanctions(true)
        } else {
          fetchListings(true)
        }

        return true

      } catch (error) {
        console.error('Erreur révocation sanction:', error)
        
        toast({
          title: "Erreur de révocation",
          description: "Impossible de révoquer cette sanction.",
          variant: "destructive"
        })
        
        return false
      }
    },

    extendSanction: async (sanctionId: string, sanctionType: 'user' | 'listing', additionalDays: number): Promise<boolean> => {
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour prolonger une sanction.",
          variant: "destructive"
        })
        return false
      }

      
      try {
        const newExpiration = new Date()
        newExpiration.setDate(newExpiration.getDate() + additionalDays)

        if (sanctionType === 'user') {
          const { error } = await supabase
            .from('user_sanctions')
            .update({
              effective_until: newExpiration.toISOString(),
              duration_days: additionalDays,
              updated_at: new Date().toISOString()
            })
            .eq('id', sanctionId)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('listings')
            .update({
              suspended_until: newExpiration.toISOString(),
              moderation_notes: `Suspension prolongée de ${additionalDays} jours`,
              updated_at: new Date().toISOString()
            })
            .eq('id', sanctionId)

          if (error) throw error
        }

        toast({
          title: "Sanction prolongée",
          description: `La sanction a été prolongée de ${additionalDays} jour(s).`
        })

        if (sanctionType === 'user') {
          fetchUserSanctions(true)
        } else {
          fetchListings(true)
        }

        return true

      } catch (error) {
        console.error('Erreur prolongation sanction:', error)
        
        toast({
          title: "Erreur de prolongation",
          description: "Impossible de prolonger cette sanction.",
          variant: "destructive"
        })
        
        return false
      }
    },

    convertToPermanent: async (sanctionId: string, sanctionType: 'user' | 'listing', reason: string): Promise<boolean> => {
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour rendre une sanction permanente.",
          variant: "destructive"
        })
        return false
      }

      
      try {
        if (sanctionType === 'user') {
          const { error } = await supabase
            .from('user_sanctions')
            .update({
              effective_until: null,
              sanction_type: 'permanent_ban',
              description: reason,
              updated_at: new Date().toISOString()
            })
            .eq('id', sanctionId)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('listings')
            .update({
              suspended_until: null,
              suspension_reason: reason,
              moderation_notes: `Suspension rendue permanente: ${reason}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', sanctionId)

          if (error) throw error
        }

        toast({
          title: "Sanction rendue permanente",
          description: "La sanction est maintenant permanente."
        })

        if (sanctionType === 'user') {
          fetchUserSanctions(true)
        } else {
          fetchListings(true)
        }

        return true

      } catch (error) {
        console.error('Erreur conversion permanente:', error)
        
        toast({
          title: "Erreur de conversion",
          description: "Impossible de rendre cette sanction permanente.",
          variant: "destructive"
        })
        
        return false
      }
    },

    getSanctionTrends: () => {
      return {
        weeklyTrend: {
          sanctions: computedSanctions.filter(s => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return new Date(s.created_at) > weekAgo
          }).length,
          revocations: computedSanctions.filter(s => {
            if (!s.revoked_at) return false
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return new Date(s.revoked_at) > weekAgo
          }).length
        }
      }
    },

    translateStatus: (status: string): string => {
      const translations = {
        'active': 'Active',
        'expired': 'Expirée',
        'revoked': 'Révoquée',
        'pending': 'En attente',
        'toutes': 'Toutes'
      }
      return translations[status as keyof typeof translations] || status
    },

    translateSanctionType: (type: string): string => {
      const translations = {
        'warning': 'Avertissement',
        'suspension': 'Suspension',
        'temporary_ban': 'Bannissement temporaire',
        'permanent_ban': 'Bannissement permanent',
        'ban': 'Bannissement',
        'restriction': 'Restriction'
      }
      return translations[type as keyof typeof translations] || type
    },

    // ===== UTILITAIRES =====
    formatCurrency,
    formatPercentage,
    formatDate,

    // ===== ÉTAT DE CHARGEMENT PAR SECTION =====
    loading: {
      profiles: centralState.profiles.loading,
      listings: centralState.listings.loading,
      categories: centralState.categories.loading,
      reports: centralState.reports.loading,
      sanctions: centralState.userSanctions.loading,
      global: globalLoading
    },

    // ===== ERREURS PAR SECTION =====
    errors: {
      profiles: centralState.profiles.error,
      listings: centralState.listings.error,
      categories: centralState.categories.error,
      reports: centralState.reports.error,
      sanctions: centralState.userSanctions.error
    },

    // ===== LES HOOKS POUR DIFFERENT SECTION =====
    
    // Pour useAdminStats
    isDataFresh: computedDashboardStats !== null && !globalLoading,
    platformHealth: computedDashboardStats ? 
      (computedDashboardStats.activeReports > 10 ? 'critical' : 
       computedDashboardStats.activeReports > 5 ? 'warning' : 'good') : 'loading',
    lastUpdated: lastGlobalRefresh ? new Date(lastGlobalRefresh).toLocaleString('fr-BF') : null,

    // Fonctions utilitaires 
    getTrustScoreColor: (score: number) => {
      if (score >= 80) return 'text-green-600 bg-green-50'
      if (score >= 60) return 'text-yellow-600 bg-yellow-50'
      return 'text-red-600 bg-red-50'
    },
    
    getStatusColor: (status: string) => {
      const colors = {
        active: 'text-green-600 bg-green-50',
        suspended: 'text-orange-600 bg-orange-50',
        banned: 'text-red-600 bg-red-50',
        pending_verification: 'text-blue-600 bg-blue-50'
      }
      return colors[status as keyof typeof colors] || colors.active
    },

    getQualityScoreColor: (score: number) => {
      if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
      if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      return 'text-red-600 bg-red-50 border-red-200'
    },

    getRiskLevelColor: (risk: 'low' | 'medium' | 'high') => {
      const colors = {
        low: 'text-green-600 bg-green-50 border-green-200',
        medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        high: 'text-red-600 bg-red-50 border-red-200'
      }
      return colors[risk]
    },

    getPriorityColor: (priority: string) => {
      const colors = {
        high: 'text-red-600 bg-red-50 border-red-200',
        medium: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
        low: 'text-green-600 bg-green-50 border-green-200'
      }
      return colors[priority as keyof typeof colors] || colors.medium
    },

    formatResponseTime: (hours: number) => {
      if (hours < 24) return `${Math.round(hours)}h`
      if (hours < 24 * 7) return `${Math.round(hours / 24)}j`
      return `${Math.round(hours / (24 * 7))}sem`
    },

    formatDaysRemaining: (days: number | null) => {
      if (days === null) return 'Permanente'
      if (days <= 0) return 'Expirée'
      if (days === 1) return '1 jour restant'
      return `${days} jours restants`
    },

    getSanctionPriority: (sanction: ActiveSanction): 'high' | 'medium' | 'low' => {
      if (sanction.status === 'expired') return 'high'
      if (sanction.days_remaining !== null && sanction.days_remaining <= 1) return 'high'
      if (sanction.sanction_type === 'ban') return 'medium'
      return 'low'
    },

    // ===== STATISTIQUES TRANSVERSALES =====
    crossStats: {
      totalElements: computedUsers.length + computedListings.length + computedReports.length + computedSanctions.length,
      
      healthScore: computedDashboardStats ? 
        Math.round((
          (computedDashboardStats.conversionRate > 10 ? 25 : 0) +
          (computedDashboardStats.activeReports < 5 ? 25 : 0) +
          (computedUsers.filter(u => u.risk_level === 'low').length / Math.max(computedUsers.length, 1) * 25) +
          (computedListings.filter(l => l.risk_level === 'low').length / Math.max(computedListings.length, 1) * 25)
        )) : 0,
        
      urgentActions: 
        computedReports.filter(r => r.priority === 'high' && r.status === 'pending').length +
        computedSanctions.filter(s => s.days_remaining !== null && s.days_remaining <= 1 && s.status === 'active').length +
        computedUsers.filter(u => u.risk_level === 'high' && u.status === 'active').length,
        
      moderationWorkload: 
        computedListings.filter(l => l.needs_review).length +
        computedReports.filter(r => r.status === 'pending').length +
        computedUsers.filter(u => u.status === 'pending_verification').length,

      platformGrowth: computedDashboardStats?.weeklyGrowth.users || 0,
      
      engagementHealth: computedListings.length > 0 ? 
        Math.round(computedListings.reduce((sum, l) => sum + l.engagement_rate, 0) / computedListings.length) : 0
    },

    // ===== RECHERCHE GLOBALE =====
    globalSearch: (searchTerm: string) => {
      if (!searchTerm.trim()) return {
        users: computedUsers,
        listings: computedListings,
        reports: computedReports,
        sanctions: computedSanctions
      }

      const term = searchTerm.toLowerCase()

      return {
        users: computedUsers.filter(user => 
          user.full_name?.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.phone?.toLowerCase().includes(term) ||
          user.location?.toLowerCase().includes(term)
        ),
        listings: computedListings.filter(listing => 
          listing.title.toLowerCase().includes(term) ||
          listing.description.toLowerCase().includes(term) ||
          listing.merchant_name.toLowerCase().includes(term) ||
          listing.location.toLowerCase().includes(term) ||
          listing.category_name.toLowerCase().includes(term)
        ),
        reports: computedReports.filter(report => 
          report.reason.toLowerCase().includes(term) ||
          report.reported_user_name?.toLowerCase().includes(term) ||
          report.reporter_name?.toLowerCase().includes(term)
        ),
        sanctions: computedSanctions.filter(sanction => 
          sanction.target_name.toLowerCase().includes(term) ||
          sanction.reason.toLowerCase().includes(term) ||
          sanction.admin_name.toLowerCase().includes(term)
        )
      }
    },

    // ===== INFORMATIONS DE CACHE =====
    cacheInfo: {
      profiles: {
        lastFetch: centralState.profiles.lastFetch,
        itemCount: centralState.profiles.data.length,
        isStale: centralState.profiles.lastFetch ? 
          (Date.now() - new Date(centralState.profiles.lastFetch).getTime() > 5 * 60 * 1000) : true
      },
      listings: {
        lastFetch: centralState.listings.lastFetch,
        itemCount: centralState.listings.data.length,
        isStale: centralState.listings.lastFetch ? 
          (Date.now() - new Date(centralState.listings.lastFetch).getTime() > 5 * 60 * 1000) : true
      },
      reports: {
        lastFetch: centralState.reports.lastFetch,
        itemCount: centralState.reports.data.length,
        isStale: centralState.reports.lastFetch ? 
          (Date.now() - new Date(centralState.reports.lastFetch).getTime() > 2 * 60 * 1000) : true
      }
    },

    // ===== DIAGNOSTICS =====
    getDiagnostics: () => ({
      dataFreshness: {
        profiles: centralState.profiles.lastFetch ? 
          Math.round((Date.now() - new Date(centralState.profiles.lastFetch).getTime()) / 60000) : null,
        listings: centralState.listings.lastFetch ? 
          Math.round((Date.now() - new Date(centralState.listings.lastFetch).getTime()) / 60000) : null,
        reports: centralState.reports.lastFetch ? 
          Math.round((Date.now() - new Date(centralState.reports.lastFetch).getTime()) / 60000) : null
      },
      systemHealth: {
        hasErrors: Object.values(centralState).some(section => section.error !== null),
        errorCount: Object.values(centralState).filter(section => section.error !== null).length,
        loadingCount: Object.values(centralState).filter(section => section.loading).length,
        totalSections: Object.keys(centralState).length
      },
      performance: {
        lastGlobalRefresh: lastGlobalRefresh,
        refreshAge: lastGlobalRefresh ? 
          Math.round((Date.now() - new Date(lastGlobalRefresh).getTime()) / 60000) : null,
        cacheEfficiency: Object.values(centralState).filter(section => 
          section.lastFetch && (Date.now() - new Date(section.lastFetch).getTime()) < 3 * 60 * 1000
        ).length / Object.keys(centralState).length * 100
      }
    })
  }
};