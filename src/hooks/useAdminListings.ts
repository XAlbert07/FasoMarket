// hooks/useAdminListings.ts
// Hook spécialisé pour la gestion administrative des annonces

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Listing } from '@/types/database'

// ========================================
// INTERFACES POUR LA GESTION DES ANNONCES
// ========================================

export interface AdminListing extends Listing {
  // Données enrichies pour l'administration
  merchant_name: string
  merchant_email: string
  merchant_phone?: string
  category_name: string
  quality_score: number
  
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
  moderation_notes?: string
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
}

export interface ListingAction {
  type: 'approve' | 'suspend' | 'feature' | 'unfeature' | 'delete' | 'extend_expiry'
  reason: string
  notes?: string
  duration?: number
}

export interface ListingStats {
  totalListings: number
  activeListings: number
  pendingListings: number
  suspendedListings: number
  featuredListings: number
  averagePrice: number
  averageViews: number
  topCategories: Array<{ name: string; count: number; percentage: number }>
  topLocations: Array<{ name: string; count: number }>
}

// ========================================
// HOOK PRINCIPAL
// ========================================

export const useAdminListings = () => {
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ListingFilters>({})
  const [stats, setStats] = useState<ListingStats | null>(null)
  const { toast } = useToast()

  // ========================================
  // RÉCUPÉRATION DES ANNONCES ENRICHIES
  // ========================================
  
  const fetchListings = async (currentFilters: ListingFilters = {}) => {
    console.log('Récupération des annonces avec filtres:', currentFilters)
    
    try {
      setLoading(true)
      setError(null)

      // Requête de base avec jointures
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
        .order('created_at', { ascending: false })

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

      const { data: listingsData, error: listingsError } = await query

      if (listingsError) throw listingsError

      // Récupération des données complémentaires
      const listingIds = listingsData?.map(l => l.id) || []
      
      const [favoritesData, messagesData, reportsData] = await Promise.all([
        // Favoris par annonce
        supabase
          .from('favorites')
          .select('listing_id')
          .in('listing_id', listingIds),
          
        // Messages par annonce
        supabase
          .from('messages')
          .select('listing_id')
          .in('listing_id', listingIds),
          
        // Signalements par annonce
        supabase
          .from('reports')
          .select('listing_id')
          .in('listing_id', listingIds)
          .not('listing_id', 'is', null)
      ])

      if (favoritesData.error) throw favoritesData.error
      if (messagesData.error) throw messagesData.error
      if (reportsData.error) throw reportsData.error

      // Enrichissement des données
      const enrichedListings: AdminListing[] = (listingsData || []).map(listing => {
        const profile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles
        const category = Array.isArray(listing.categories) ? listing.categories[0] : listing.categories

        // Calcul des métriques d'engagement
        const favoritesCount = favoritesData.data?.filter(f => f.listing_id === listing.id).length || 0
        const messagesCount = messagesData.data?.filter(m => m.listing_id === listing.id).length || 0
        const reportsCount = reportsData.data?.filter(r => r.listing_id === listing.id).length || 0

        // Calcul des dates
        const createdAt = new Date(listing.created_at)
        const now = new Date()
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        
        const expiresAt = listing.expires_at ? new Date(listing.expires_at) : null
        const daysUntilExpiry = expiresAt 
          ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 999

        // Calcul du score de qualité
        let qualityScore = 50 // Score de base
        
        // Bonus pour les images
        qualityScore += Math.min((listing.images?.length || 0) * 10, 30)
        
        // Bonus pour la description complète
        if (listing.description && listing.description.length > 100) qualityScore += 15
        
        // Bonus pour les informations de contact
        if (listing.contact_phone) qualityScore += 10
        if (listing.contact_whatsapp) qualityScore += 5
        
        // Malus pour les signalements
        qualityScore -= reportsCount * 15
        
        // Bonus pour l'engagement
        qualityScore += Math.min(favoritesCount * 2, 10)
        qualityScore += Math.min(listing.views_count * 0.1, 10)
        
        // Maintenir entre 0 et 100
        qualityScore = Math.max(0, Math.min(100, qualityScore))

        // Calcul du taux d'engagement
        const engagementRate = listing.views_count > 0 
          ? ((favoritesCount + messagesCount) / listing.views_count) * 100 
          : 0

        // Détermination du niveau de risque
        let riskLevel: 'low' | 'medium' | 'high' = 'low'
        if (reportsCount > 2 || qualityScore < 30) {
          riskLevel = 'high'
        } else if (reportsCount > 0 || qualityScore < 60) {
          riskLevel = 'medium'
        }

        // Indicateur de besoin de révision
        const needsReview = riskLevel === 'high' || 
                           (listing.price < 1000 && listing.title.includes('iPhone')) || // Prix suspect
                           (listing.images?.length || 0) === 0 || // Pas d'image
                           reportsCount > 0

        return {
          ...listing,
          merchant_name: profile?.full_name || 'Marchand inconnu',
          merchant_email: profile?.email || '',
          merchant_phone: profile?.phone,
          category_name: category?.name || 'Catégorie inconnue',
          quality_score: Math.round(qualityScore),
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
          moderation_notes: undefined
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

      // Tri
      if (currentFilters.sortBy) {
        filteredListings.sort((a, b) => {
          switch (currentFilters.sortBy) {
            case 'price':
              return b.price - a.price
            case 'views':
              return b.views_count - a.views_count
            case 'reports':
              return b.reports_count - a.reports_count
            case 'quality':
              return b.quality_score - a.quality_score
            case 'date':
            default:
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
        })
      }

      console.log(`Annonces récupérées et enrichies: ${filteredListings.length}`)
      setListings(filteredListings)

    } catch (error) {
      console.error('Erreur lors de la récupération des annonces:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les annonces.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // CALCUL DES STATISTIQUES
  // ========================================
  
  const calculateStats = async () => {
    console.log('Calcul des statistiques des annonces')
    
    try {
      const [listingsResult, categoriesResult] = await Promise.all([
        supabase
          .from('listings')
          .select('id, status, price, views_count, featured, category_id, location, created_at'),
          
        supabase
          .from('categories')
          .select('id, name')
      ])

      if (listingsResult.error) throw listingsResult.error
      if (categoriesResult.error) throw categoriesResult.error

      const allListings = listingsResult.data || []
      const categories = categoriesResult.data || []

      const totalListings = allListings.length
      const activeListings = allListings.filter(l => l.status === 'active').length
      const pendingListings = allListings.filter(l => l.status === 'active').length // Considérant 'active' comme pending
      const suspendedListings = allListings.filter(l => l.status === 'suspended').length
      const featuredListings = allListings.filter(l => l.featured).length

      // Prix moyen
      const averagePrice = totalListings > 0 
        ? allListings.reduce((sum, l) => sum + l.price, 0) / totalListings
        : 0

      // Vues moyennes
      const averageViews = totalListings > 0 
        ? allListings.reduce((sum, l) => sum + l.views_count, 0) / totalListings
        : 0

      // Top catégories
      const categoryCounts = allListings.reduce((acc, listing) => {
        acc[listing.category_id] = (acc[listing.category_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([categoryId, count]) => {
          const category = categories.find(c => c.id === categoryId)
          return {
            name: category?.name || 'Catégorie inconnue',
            count,
            percentage: (count / totalListings) * 100
          }
        })

      // Top locations
      const locationCounts = allListings.reduce((acc, listing) => {
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
        pendingListings,
        suspendedListings,
        featuredListings,
        averagePrice: Math.round(averagePrice),
        averageViews: Math.round(averageViews),
        topCategories,
        topLocations
      }

      console.log('Statistiques des annonces calculées:', calculatedStats)
      setStats(calculatedStats)

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error)
    }
  }

  // ========================================
  // ACTIONS ADMINISTRATIVES
  // ========================================
  
  const handleListingAction = async (listingId: string, action: ListingAction) => {
    console.log(`Application de l'action ${action.type} sur l'annonce ${listingId}`)
    
    try {
      let updateData: any = {
        updated_at: new Date().toISOString()
      }

      switch (action.type) {
        case 'approve':
          updateData.status = 'active'
          break

        case 'suspend':
          updateData.status = 'suspended'
          break

        case 'feature':
          updateData.featured = true
          break

        case 'unfeature':
          updateData.featured = false
          break

        case 'extend_expiry':
          if (action.duration) {
            const newExpiry = new Date()
            newExpiry.setDate(newExpiry.getDate() + action.duration)
            updateData.expires_at = newExpiry.toISOString()
          }
          break

        case 'delete':
          // Suppression logique ou physique selon votre politique
          updateData.status = 'deleted' // Ou suppression physique avec .delete()
          break
      }

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId)

      if (error) throw error

      // Mise à jour de l'état local
      setListings(prev => prev.map(l => {
        if (l.id === listingId) {
          return {
            ...l,
            ...updateData,
            updated_at: new Date().toISOString()
          }
        }
        return l
      }))

      toast({
        title: "Action appliquée",
        description: `L'action ${action.type} a été appliquée avec succès.`,
      })

      return true

    } catch (error) {
      console.error(`Erreur lors de l'action ${action.type}:`, error)
      
      toast({
        title: "Erreur d'action",
        description: "Impossible d'appliquer l'action sur cette annonce.",
        variant: "destructive"
      })
      
      return false
    }
  }

  // ========================================
  // GESTION DES FILTRES ET RECHERCHE
  // ========================================
  
  const applyFilters = (newFilters: Partial<ListingFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    fetchListings(updatedFilters)
  }

  const clearFilters = () => {
    setFilters({})
    fetchListings({})
  }

  const searchListings = (searchTerm: string) => {
    if (!searchTerm.trim()) return listings

    const term = searchTerm.toLowerCase()
    return listings.filter(listing => 
      listing.title.toLowerCase().includes(term) ||
      listing.description.toLowerCase().includes(term) ||
      listing.merchant_name.toLowerCase().includes(term) ||
      listing.location.toLowerCase().includes(term) ||
      listing.category_name.toLowerCase().includes(term)
    )
  }

  // ========================================
  // EFFET D'INITIALISATION
  // ========================================
  
  useEffect(() => {
    console.log('Initialisation du hook des annonces admin')
    fetchListings()
    calculateStats()

    // Rafraîchissement automatique toutes les 4 minutes
    const interval = setInterval(() => {
      console.log('Rafraîchissement automatique des annonces')
      fetchListings(filters)
      calculateStats()
    }, 4 * 60 * 1000)

    return () => {
      console.log('Nettoyage du hook des annonces')
      clearInterval(interval)
    }
  }, [])

  // ========================================
  // UTILITAIRES
  // ========================================
  
  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getRiskLevelColor = (risk: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-red-600 bg-red-50'
    }
    return colors[risk]
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // ========================================
  // RETOUR DU HOOK
  // ========================================
  
  return {
    // Données
    listings,
    stats,
    filters,
    
    // États
    loading,
    error,
    
    // Actions
    handleListingAction,
    
    // Gestion des filtres
    applyFilters,
    clearFilters,
    searchListings,
    
    // Rafraîchissement
    refreshListings: () => fetchListings(filters),
    refreshStats: calculateStats,
    
    // Utilitaires
    getQualityScoreColor,
    getRiskLevelColor,
    formatCurrency,
    formatDate,
    
    // Compteurs pour l'interface
    needsReviewCount: listings.filter(l => l.needs_review).length,
    highRiskCount: listings.filter(l => l.risk_level === 'high').length,
    lowQualityCount: listings.filter(l => l.quality_score < 50).length,
    expiringSoonCount: listings.filter(l => l.days_until_expiry <= 7 && l.days_until_expiry > 0).length,
    
    // Métriques calculées
    averageQualityScore: listings.length > 0 
      ? Math.round(listings.reduce((sum, l) => sum + l.quality_score, 0) / listings.length)
      : 0,
    totalViews: listings.reduce((sum, l) => sum + l.views_count, 0),
    totalFavorites: listings.reduce((sum, l) => sum + l.favorites_count, 0),
    
    // Indicateur de santé
    isHealthy: !loading && !error && listings.length >= 0,
    lastRefresh: new Date().toISOString()
  }
}