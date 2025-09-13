// hooks/useAdminListings.ts - Version corrigée avec gestion des suspensions temporaires

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'

// Interfaces pour la gestion administrative des annonces
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
  
  // Nouvelles colonnes pour la modération
  suspended_until: string | null
  suspension_reason: string | null
  moderation_notes: string | null
  quality_score: number
  
  // Données enrichies pour l'administration
  merchant_name: string
  merchant_email: string
  merchant_phone?: string
  category_name: string
  
  // Métriques d'engagement
  favorites_count: number
  messages_count: number
  reports_count: number
  
  // Indicateurs de performance
  engagement_rate: number
  days_since_creation: number
  days_until_expiry: number
  last_activity?: string
  
  // Flags administratifs
  needs_review: boolean
  is_featured: boolean
  risk_level: 'low' | 'medium' | 'high'
  is_temporarily_suspended: boolean
  suspension_expires_in_days?: number
}

export interface ListingFilters {
  status?: 'all' | 'active' | 'sold' | 'expired' | 'suspended'
  category?: string
  location?: string
  priceRange?: { min: number; max: number }
  featured?: 'all' | 'featured' | 'regular'
  needsReview?: boolean
  riskLevel?: 'all' | 'low' | 'medium' | 'high'
  dateRange?: 'all' | '24h' | '7d' | '30d'
  sortBy?: 'date' | 'price' | 'views' | 'reports' | 'quality'
  isSuspended?: 'all' | 'suspended' | 'active'
}

export interface ListingAction {
  type: 'approve' | 'suspend' | 'unsuspend' | 'feature' | 'unfeature' | 'delete' | 'extend_expiry'
  reason: string
  notes?: string
  duration?: number // En jours pour les suspensions temporaires
}

export interface ListingStats {
  totalListings: number
  activeListings: number
  suspendedListings: number
  temporarilySuspended: number
  permanentlySuspended: number
  featuredListings: number
  needsReviewCount: number
  averagePrice: number
  averageViews: number
  averageQualityScore: number
  topCategories: Array<{ name: string; count: number; percentage: number }>
  topLocations: Array<{ name: string; count: number }>
}

export const useAdminListings = () => {
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ListingFilters>({})
  const [stats, setStats] = useState<ListingStats | null>(null)
  const { toast } = useToast()
  const { user } = useAuthContext()

  // Fonction principale pour récupérer les annonces avec toutes leurs données
  const fetchListings = async (currentFilters: ListingFilters = {}) => {
    console.log('🔍 [ADMIN_LISTINGS] Récupération des annonces avec filtres:', currentFilters)
    
    try {
      setLoading(true)
      setError(null)

      // Requête de base avec toutes les jointures nécessaires
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_user_id_fkey (
            full_name,
            email,
            phone
          ),
          categories!listings_category_id_fkey (
            name,
            slug
          )
        `)

      // Application des filtres de base
      if (currentFilters.status && currentFilters.status !== 'all') {
        query = query.eq('status', currentFilters.status)
      }
      
      if (currentFilters.category) {
        query = query.eq('category_id', currentFilters.category)
      }
      
      if (currentFilters.location) {
        query = query.ilike('location', `%${currentFilters.location}%`)
      }

      if (currentFilters.featured && currentFilters.featured !== 'all') {
        query = query.eq('featured', currentFilters.featured === 'featured')
      }

      if (currentFilters.priceRange) {
        query = query
          .gte('price', currentFilters.priceRange.min)
          .lte('price', currentFilters.priceRange.max)
      }

      // Filtre par date
      if (currentFilters.dateRange && currentFilters.dateRange !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (currentFilters.dateRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            break
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }

      // Tri selon le critère sélectionné
      switch (currentFilters.sortBy) {
        case 'price':
          query = query.order('price', { ascending: false })
          break
        case 'views':
          query = query.order('views_count', { ascending: false })
          break
        case 'quality':
          query = query.order('quality_score', { ascending: false })
          break
        case 'date':
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data: listingsData, error: listingsError } = await query

      if (listingsError) {
        console.error('❌ [ADMIN_LISTINGS] Erreur requête principale:', listingsError)
        throw listingsError
      }

      console.log(`📊 [ADMIN_LISTINGS] ${listingsData?.length || 0} annonces récupérées`)

      if (!listingsData || listingsData.length === 0) {
        setListings([])
        calculateStats([])
        return
      }

      // Récupération des données complémentaires (favoris, messages, signalements)
      const listingIds = listingsData.map(l => l.id)
      
      const [favoritesData, messagesData, reportsData] = await Promise.all([
        supabase
          .from('favorites')
          .select('listing_id')
          .in('listing_id', listingIds),
          
        supabase
          .from('messages')
          .select('listing_id')
          .in('listing_id', listingIds),
          
        supabase
          .from('reports')
          .select('listing_id')
          .in('listing_id', listingIds)
          .not('listing_id', 'is', null)
      ])

      if (favoritesData.error) {
        console.warn('⚠️ [ADMIN_LISTINGS] Erreur favoris (non bloquant):', favoritesData.error)
      }
      if (messagesData.error) {
        console.warn('⚠️ [ADMIN_LISTINGS] Erreur messages (non bloquant):', messagesData.error)
      }
      if (reportsData.error) {
        console.warn('⚠️ [ADMIN_LISTINGS] Erreur signalements (non bloquant):', reportsData.error)
      }

      // Enrichissement des données avec calculs et métriques
      const enrichedListings: AdminListing[] = listingsData.map(listing => {
        const profile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles
        const category = Array.isArray(listing.categories) ? listing.categories[0] : listing.categories

        // Calcul des métriques d'engagement
        const favoritesCount = favoritesData.data?.filter(f => f.listing_id === listing.id).length || 0
        const messagesCount = messagesData.data?.filter(m => m.listing_id === listing.id).length || 0
        const reportsCount = reportsData.data?.filter(r => r.listing_id === listing.id).length || 0

        // Calcul des dates et durées
        const createdAt = new Date(listing.created_at)
        const now = new Date()
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        
        const expiresAt = listing.expires_at ? new Date(listing.expires_at) : null
        const daysUntilExpiry = expiresAt 
          ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 999

        // Vérification de la suspension temporaire
        const suspendedUntil = listing.suspended_until ? new Date(listing.suspended_until) : null
        const isTemporarilySuspended = suspendedUntil && suspendedUntil > now
        const suspensionExpiresInDays = isTemporarilySuspended 
          ? Math.ceil((suspendedUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        // Calcul du score de qualité (amélioré)
        let qualityScore = listing.quality_score || 50
        
        // Recalcul si pas encore défini
        if (!listing.quality_score) {
          qualityScore = 50 // Score de base
          
          // Bonus pour les images (max 30 points)
          qualityScore += Math.min((listing.images?.length || 0) * 8, 30)
          
          // Bonus pour la description complète (15 points)
          if (listing.description && listing.description.length > 100) qualityScore += 15
          
          // Bonus pour les informations de contact (15 points)
          if (listing.contact_phone) qualityScore += 8
          if (listing.contact_whatsapp) qualityScore += 4
          if (listing.contact_email) qualityScore += 3
          
          // Malus pour les signalements (-15 points par signalement)
          qualityScore -= reportsCount * 15
          
          // Bonus pour l'engagement (max 15 points)
          qualityScore += Math.min(favoritesCount * 2, 10)
          qualityScore += Math.min(listing.views_count * 0.05, 5)
          
          // Malus pour l'ancienneté excessive sans activité
          if (daysSinceCreation > 60 && listing.views_count < 10) qualityScore -= 10
          
          // Maintenir entre 0 et 100
          qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)))
        }

        // Calcul du taux d'engagement
        const engagementRate = listing.views_count > 0 
          ? ((favoritesCount + messagesCount) / listing.views_count) * 100 
          : 0

        // Détermination du niveau de risque
        let riskLevel: 'low' | 'medium' | 'high' = 'low'
        if (reportsCount >= 3 || qualityScore < 30) {
          riskLevel = 'high'
        } else if (reportsCount >= 1 || qualityScore < 60 || listing.price < 5000) {
          riskLevel = 'medium'
        }

        // Indicateur de besoin de révision
        const needsReview = 
          riskLevel === 'high' || 
          (listing.images?.length || 0) === 0 || 
          reportsCount > 0 ||
          (listing.price < 10000 && listing.title.toLowerCase().includes('iphone')) ||
          qualityScore < 40

        return {
          ...listing,
          merchant_name: profile?.full_name || 'Marchand inconnu',
          merchant_email: profile?.email || '',
          merchant_phone: profile?.phone,
          category_name: category?.name || 'Catégorie inconnue',
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
          suspension_expires_in_days: suspensionExpiresInDays
        } as AdminListing
      })

      // Application des filtres calculés
      let filteredListings = enrichedListings

      if (currentFilters.needsReview) {
        filteredListings = filteredListings.filter(l => l.needs_review)
      }

      if (currentFilters.riskLevel && currentFilters.riskLevel !== 'all') {
        filteredListings = filteredListings.filter(l => l.risk_level === currentFilters.riskLevel)
      }

      if (currentFilters.isSuspended && currentFilters.isSuspended !== 'all') {
        if (currentFilters.isSuspended === 'suspended') {
          filteredListings = filteredListings.filter(l => l.status === 'suspended')
        } else {
          filteredListings = filteredListings.filter(l => l.status !== 'suspended')
        }
      }

      console.log(`✅ [ADMIN_LISTINGS] ${filteredListings.length} annonces enrichies et filtrées`)
      
      setListings(filteredListings)
      calculateStats(filteredListings)

    } catch (error) {
      console.error('❌ [ADMIN_LISTINGS] Erreur lors de la récupération:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les annonces. Vérifiez votre connexion.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Calcul des statistiques détaillées
  const calculateStats = (listingsToAnalyze: AdminListing[]) => {
    console.log('📊 [ADMIN_LISTINGS] Calcul des statistiques')

    const totalListings = listingsToAnalyze.length
    if (totalListings === 0) {
      setStats({
        totalListings: 0,
        activeListings: 0,
        suspendedListings: 0,
        temporarilySuspended: 0,
        permanentlySuspended: 0,
        featuredListings: 0,
        needsReviewCount: 0,
        averagePrice: 0,
        averageViews: 0,
        averageQualityScore: 0,
        topCategories: [],
        topLocations: []
      })
      return
    }

    const activeListings = listingsToAnalyze.filter(l => l.status === 'active').length
    const suspendedListings = listingsToAnalyze.filter(l => l.status === 'suspended').length
    const temporarilySuspended = listingsToAnalyze.filter(l => l.is_temporarily_suspended).length
    const permanentlySuspended = suspendedListings - temporarilySuspended
    const featuredListings = listingsToAnalyze.filter(l => l.featured).length
    const needsReviewCount = listingsToAnalyze.filter(l => l.needs_review).length

    // Moyennes
    const averagePrice = Math.round(listingsToAnalyze.reduce((sum, l) => sum + l.price, 0) / totalListings)
    const averageViews = Math.round(listingsToAnalyze.reduce((sum, l) => sum + l.views_count, 0) / totalListings)
    const averageQualityScore = Math.round(listingsToAnalyze.reduce((sum, l) => sum + l.quality_score, 0) / totalListings)

    // Top catégories
    const categoryCounts = listingsToAnalyze.reduce((acc, listing) => {
      const category = listing.category_name
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalListings) * 100)
      }))

    // Top locations
    const locationCounts = listingsToAnalyze.reduce((acc, listing) => {
      const location = listing.location || 'Non spécifié'
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    const calculatedStats: ListingStats = {
      totalListings,
      activeListings,
      suspendedListings,
      temporarilySuspended,
      permanentlySuspended,
      featuredListings,
      needsReviewCount,
      averagePrice,
      averageViews,
      averageQualityScore,
      topCategories,
      topLocations
    }

    console.log('✅ [ADMIN_LISTINGS] Statistiques calculées:', calculatedStats)
    setStats(calculatedStats)
  }

  // Fonction pour gérer les actions administratives sur les annonces
  const handleListingAction = async (listingId: string, action: ListingAction): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette action.",
        variant: "destructive"
      })
      return false
    }

    console.log(`🔧 [ADMIN_LISTINGS] Action ${action.type} sur annonce ${listingId}`)
    
    try {
      const listing = listings.find(l => l.id === listingId)
      if (!listing) {
        throw new Error('Annonce non trouvée')
      }

      let updateData: any = {
        updated_at: new Date().toISOString()
      }

      switch (action.type) {
        case 'approve':
          updateData.status = 'active'
          updateData.suspended_until = null
          updateData.suspension_reason = null
          break

        case 'suspend':
          updateData.status = 'suspended'
          updateData.suspension_reason = action.reason
          updateData.moderation_notes = action.notes
          
          if (action.duration && action.duration > 0) {
            // Suspension temporaire
            const suspendedUntil = new Date(Date.now() + action.duration * 24 * 60 * 60 * 1000)
            updateData.suspended_until = suspendedUntil.toISOString()
          } else {
            // Suspension permanente
            updateData.suspended_until = null
          }
          break

        case 'unsuspend':
          updateData.status = 'active'
          updateData.suspended_until = null
          updateData.suspension_reason = null
          updateData.moderation_notes = action.notes
          break

        case 'feature':
          updateData.featured = true
          break

        case 'unfeature':
          updateData.featured = false
          break

        case 'extend_expiry':
          if (action.duration) {
            const currentExpiry = listing.expires_at ? new Date(listing.expires_at) : new Date()
            const newExpiry = new Date(currentExpiry.getTime() + action.duration * 24 * 60 * 60 * 1000)
            updateData.expires_at = newExpiry.toISOString()
          }
          break

        case 'delete':
          updateData.status = 'suspended' // Suppression logique
          updateData.suspension_reason = action.reason
          updateData.moderation_notes = `SUPPRIMÉ: ${action.notes || ''}`
          break
      }

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId)

      if (error) {
        console.error('❌ [ADMIN_LISTINGS] Erreur mise à jour annonce:', error)
        throw error
      }

      // Enregistrement de l'action pour audit
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: action.type,
          target_type: 'listing',
          target_id: listingId,
          reason: action.reason,
          notes: action.notes,
          metadata: { duration: action.duration }
        })

      // Mise à jour de l'état local
      setListings(prev => prev.map(l => {
        if (l.id === listingId) {
          const updatedListing = { ...l, ...updateData }
          
          // Recalcul des flags après mise à jour
          const now = new Date()
          if (updateData.suspended_until) {
            const suspendedUntil = new Date(updateData.suspended_until)
            updatedListing.is_temporarily_suspended = suspendedUntil > now
            updatedListing.suspension_expires_in_days = Math.ceil((suspendedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          } else {
            updatedListing.is_temporarily_suspended = false
            updatedListing.suspension_expires_in_days = 0
          }
          
          return updatedListing
        }
        return l
      }))

      // Messages de succès contextuels
      const actionMessages = {
        approve: 'Annonce approuvée avec succès',
        suspend: action.duration 
          ? `Annonce suspendue pour ${action.duration} jour(s)`
          : 'Annonce suspendue définitivement',
        unsuspend: 'Suspension levée avec succès',
        feature: 'Annonce mise en avant',
        unfeature: 'Mise en avant supprimée',
        extend_expiry: `Expiration prolongée de ${action.duration} jour(s)`,
        delete: 'Annonce supprimée'
      }

      toast({
        title: "Action appliquée",
        description: actionMessages[action.type] || "Action appliquée avec succès",
      })

      console.log(`✅ [ADMIN_LISTINGS] Action ${action.type} terminée avec succès`)
      return true

    } catch (error) {
      console.error(`❌ [ADMIN_LISTINGS] Erreur action ${action.type}:`, error)
      
      toast({
        title: "Erreur d'action",
        description: error instanceof Error ? error.message : "Impossible d'appliquer l'action",
        variant: "destructive"
      })
      
      return false
    }
  }

  // Gestion des filtres
  const applyFilters = (newFilters: Partial<ListingFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    fetchListings(updatedFilters)
  }

  const clearFilters = () => {
    setFilters({})
    fetchListings({})
  }

  // Fonction de recherche textuelle
  const searchListings = (searchTerm: string) => {
    if (!searchTerm.trim()) return listings

    const term = searchTerm.toLowerCase()
    return listings.filter(listing => 
      listing.title.toLowerCase().includes(term) ||
      listing.description.toLowerCase().includes(term) ||
      listing.merchant_name.toLowerCase().includes(term) ||
      listing.location.toLowerCase().includes(term) ||
      listing.category_name.toLowerCase().includes(term) ||
      listing.id.toLowerCase().includes(term)
    )
  }

  // Fonctions utilitaires pour l'affichage
  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getRiskLevelColor = (risk: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-red-600 bg-red-50 border-red-200'
    }
    return colors[risk]
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatSuspensionStatus = (listing: AdminListing): string => {
    if (!listing.is_temporarily_suspended) return ''
    
    if (listing.suspension_expires_in_days === 0) return 'Expire aujourd\'hui'
    if (listing.suspension_expires_in_days === 1) return 'Expire demain'
    return `Expire dans ${listing.suspension_expires_in_days} jours`
  }

  // Initialisation
  useEffect(() => {
    console.log('🚀 [ADMIN_LISTINGS] Initialisation du hook')
    fetchListings()

    // Rafraîchissement automatique toutes les 4 minutes
    const interval = setInterval(() => {
      console.log('🔄 [ADMIN_LISTINGS] Rafraîchissement automatique')
      fetchListings(filters)
    }, 4 * 60 * 1000)

    return () => {
      console.log('🧹 [ADMIN_LISTINGS] Nettoyage du hook')
      clearInterval(interval)
    }
  }, [])

  // Retour du hook avec toutes les fonctionnalités
  return {
    // Données principales
    listings,
    stats,
    filters,
    
    // États
    loading,
    error,
    
    // Actions principales
    handleListingAction,
    
    // Gestion des filtres et recherche
    applyFilters,
    clearFilters,
    searchListings,
    
    // Rafraîchissement
    refreshListings: () => fetchListings(filters),
    refreshStats: () => calculateStats(listings),
    
    // Utilitaires pour l'affichage
    getQualityScoreColor,
    getRiskLevelColor,
    formatCurrency,
    formatDate,
    formatSuspensionStatus,
    
    // Compteurs pour l'interface
    needsReviewCount: listings.filter(l => l.needs_review).length,
    highRiskCount: listings.filter(l => l.risk_level === 'high').length,
    lowQualityCount: listings.filter(l => l.quality_score < 50).length,
    expiringSoonCount: listings.filter(l => l.days_until_expiry <= 7 && l.days_until_expiry > 0).length,
    temporarilySuspendedCount: listings.filter(l => l.is_temporarily_suspended).length,
    permanentlySuspendedCount: listings.filter(l => l.status === 'suspended' && !l.is_temporarily_suspended).length,
    
    // Métriques calculées
    averageQualityScore: listings.length > 0 
      ? Math.round(listings.reduce((sum, l) => sum + l.quality_score, 0) / listings.length)
      : 0,
    totalViews: listings.reduce((sum, l) => sum + l.views_count, 0),
    totalFavorites: listings.reduce((sum, l) => sum + l.favorites_count, 0),
    totalEngagement: listings.reduce((sum, l) => sum + l.favorites_count + l.messages_count, 0),
    
    // Indicateur de santé du système
    isHealthy: !loading && !error && listings.length >= 0,
    lastRefresh: new Date().toISOString()
  }
}