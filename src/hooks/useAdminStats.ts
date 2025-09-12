// hooks/useAdminStats.ts
// Hook spécialisé pour récupérer les statistiques en temps réel du tableau de bord admin

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// ========================================
// INTERFACES POUR LES STATISTIQUES
// ========================================

export interface DashboardStats {
  totalUsers: number
  totalListings: number
  pendingListings: number
  activeReports: number
  monthlyRevenue: number
  dailyActiveUsers: number
  conversionRate: number
  averageRating: number
  
  // Statistiques supplémentaires pour les graphiques
  weeklyGrowth: {
    users: number
    listings: number
    reports: number
  }
  
  // Données par région
  topRegions: Array<{
    name: string
    userCount: number
    listingCount: number
    growthRate: number
  }>
  
  // Métriques de qualité
  qualityMetrics: {
    approvedListingsRate: number
    reportResolutionRate: number
    userVerificationRate: number
    averageResponseTime: number
  }
}

export interface WeeklyData {
  name: string
  users: number
  listings: number
  reports: number
  revenue?: number
  date: string
}

export interface CategoryData {
  name: string
  value: number
  percentage: number
  color: string
  growth: number
}

// ========================================
// HOOK PRINCIPAL
// ========================================

export const useAdminStats = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // ========================================
  // FONCTION POUR RÉCUPÉRER LES STATISTIQUES PRINCIPALES
  // ========================================
  
  const fetchDashboardStats = async (): Promise<DashboardStats> => {
    console.log('🔍 [ADMIN_STATS] Récupération des statistiques principales...')
    
    try {
      // Exécution de toutes les requêtes en parallèle pour optimiser les performances
      const [
        usersResult,
        listingsResult,
        reportsResult,
        weeklyUsersResult,
        regionsResult
      ] = await Promise.all([
        // Statistiques des utilisateurs
        supabase
          .from('profiles')
          .select('id, created_at, role')
          .order('created_at', { ascending: false }),
          
        // Statistiques des annonces
        supabase
          .from('listings')
          .select('id, status, created_at, price, location, user_id')
          .order('created_at', { ascending: false }),
          
        // Statistiques des signalements
        supabase
          .from('reports')
          .select('id, status, created_at, listing_id, user_id')
          .order('created_at', { ascending: false }),
          
        // Utilisateurs actifs de la semaine (approximation via les annonces récentes)
        supabase
          .from('listings')
          .select('user_id, created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false }),
          
        // Données par région
        supabase
          .from('profiles')
          .select('location')
          .not('location', 'is', null)
      ])

      // Vérification des erreurs
      if (usersResult.error) throw usersResult.error
      if (listingsResult.error) throw listingsResult.error
      if (reportsResult.error) throw reportsResult.error
      if (weeklyUsersResult.error) throw weeklyUsersResult.error
      if (regionsResult.error) throw regionsResult.error

      console.log('✅ [ADMIN_STATS] Données brutes récupérées avec succès')

      // ========================================
      // CALCUL DES MÉTRIQUES
      // ========================================

      const users = usersResult.data || []
      const listings = listingsResult.data || []
      const reports = reportsResult.data || []
      const weeklyUsers = weeklyUsersResult.data || []
      const regions = regionsResult.data || []

      // Calculs de base
      const totalUsers = users.length
      const totalListings = listings.length
      const pendingListings = listings.filter(l => l.status === 'active').length
      const activeReports = reports.filter(r => r.status === 'pending').length

      // Utilisateurs actifs quotidiens (moyenne sur 7 jours)
      const uniqueActiveUsers = new Set(weeklyUsers.map(u => u.user_id))
      const dailyActiveUsers = Math.round(uniqueActiveUsers.size / 7)

      // Calcul du taux de conversion (annonces actives / total utilisateurs)
      const conversionRate = totalUsers > 0 ? (pendingListings / totalUsers) * 100 : 0

      // Note moyenne (simulée pour l'instant - à implémenter avec la table reviews)
      const averageRating = 4.2

      // Revenus mensuels (basé sur les annonces premium - à implémenter selon votre modèle)
      const monthlyRevenue = pendingListings * 1000 // 1000 CFA par annonce active (exemple)

      // Croissance hebdomadaire
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const usersThisWeek = users.filter(u => new Date(u.created_at) > oneWeekAgo).length
      const listingsThisWeek = listings.filter(l => new Date(l.created_at) > oneWeekAgo).length
      const reportsThisWeek = reports.filter(r => new Date(r.created_at) > oneWeekAgo).length

      const weeklyGrowth = {
        users: usersThisWeek,
        listings: listingsThisWeek,
        reports: reportsThisWeek
      }

      // Top régions
      const regionCounts = regions.reduce((acc, profile) => {
        const location = profile.location || 'Non spécifié'
        acc[location] = (acc[location] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topRegions = Object.entries(regionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, userCount]) => {
          const listingCount = listings.filter(l => 
            users.find(u => u.id === l.user_id)?.location === name
          ).length
          
          return {
            name,
            userCount,
            listingCount,
            growthRate: Math.random() * 20 - 5 // Placeholder - à calculer réellement
          }
        })

      // Métriques de qualité
      const totalReports = reports.length
      const resolvedReports = reports.filter(r => r.status === 'resolved').length
      const reportResolutionRate = totalReports > 0 ? (resolvedReports / totalReports) * 100 : 100

      const qualityMetrics = {
        approvedListingsRate: totalListings > 0 ? (pendingListings / totalListings) * 100 : 0,
        reportResolutionRate,
        userVerificationRate: 67, // Placeholder - à calculer avec les données de vérification
        averageResponseTime: 2.3 // Placeholder - à calculer avec les vraies données
      }

      const stats: DashboardStats = {
        totalUsers,
        totalListings,
        pendingListings,
        activeReports,
        monthlyRevenue,
        dailyActiveUsers,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        averageRating,
        weeklyGrowth,
        topRegions,
        qualityMetrics
      }

      console.log('📊 [ADMIN_STATS] Statistiques calculées:', {
        totalUsers,
        totalListings,
        activeReports,
        conversionRate: stats.conversionRate
      })

      return stats

    } catch (error) {
      console.error('❌ [ADMIN_STATS] Erreur lors du calcul des statistiques:', error)
      throw error
    }
  }

  // ========================================
  // FONCTION POUR LES DONNÉES HEBDOMADAIRES
  // ========================================
  
  const fetchWeeklyData = async (): Promise<WeeklyData[]> => {
    console.log('🔍 [ADMIN_STATS] Récupération des données hebdomadaires...')
    
    try {
      const weekData: WeeklyData[] = []
      const today = new Date()
      
      // Génération des 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString()
        const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString()
        
        // Requêtes pour chaque jour
        const [usersDay, listingsDay, reportsDay] = await Promise.all([
          supabase
            .from('profiles')
            .select('id')
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay),
            
          supabase
            .from('listings')
            .select('id')
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay),
            
          supabase
            .from('reports')
            .select('id')
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay)
        ])
        
        if (usersDay.error || listingsDay.error || reportsDay.error) {
          throw usersDay.error || listingsDay.error || reportsDay.error
        }
        
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        
        weekData.push({
          name: dayNames[date.getDay()],
          users: usersDay.data?.length || 0,
          listings: listingsDay.data?.length || 0,
          reports: reportsDay.data?.length || 0,
          date: date.toISOString().split('T')[0]
        })
      }
      
      console.log('📈 [ADMIN_STATS] Données hebdomadaires calculées:', weekData)
      return weekData
      
    } catch (error) {
      console.error('❌ [ADMIN_STATS] Erreur lors du calcul des données hebdomadaires:', error)
      throw error
    }
  }

  // ========================================
  // FONCTION POUR LES DONNÉES DE CATÉGORIES
  // ========================================
  
  const fetchCategoryData = async (): Promise<CategoryData[]> => {
    console.log('🔍 [ADMIN_STATS] Récupération des données de catégories...')
    
    try {
      // Récupération des annonces avec leurs catégories
      const { data: listingsWithCategories, error } = await supabase
        .from('listings')
        .select(`
          id,
          status,
          categories:category_id (
            id,
            name,
            slug
          )
        `)
        .eq('status', 'active')

      if (error) throw error

      // Calcul de la distribution par catégorie
      const categoryMap = new Map<string, number>()
      const totalListings = listingsWithCategories?.length || 0

      listingsWithCategories?.forEach(listing => {
        const categoryName = listing.categories?.name || 'Autres'
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1)
      })

      // Conversion en format pour le graphique
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
      const categories = Array.from(categoryMap.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5) // Top 5 catégories
        .map(([name, count], index) => ({
          name,
          value: count,
          percentage: totalListings > 0 ? (count / totalListings) * 100 : 0,
          color: colors[index] || '#8884D8',
          growth: Math.random() * 20 - 5 // Placeholder pour la croissance
        }))

      console.log('🏷️ [ADMIN_STATS] Données de catégories calculées:', categories)
      return categories
      
    } catch (error) {
      console.error('❌ [ADMIN_STATS] Erreur lors du calcul des catégories:', error)
      throw error
    }
  }

  // ========================================
  // FONCTION DE RAFRAÎCHISSEMENT
  // ========================================
  
  const refreshStats = async () => {
    console.log('🔄 [ADMIN_STATS] Début du rafraîchissement des statistiques')
    setLoading(true)
    setError(null)

    try {
      // Exécution de toutes les récupérations en parallèle
      const [stats, weekly, categories] = await Promise.all([
        fetchDashboardStats(),
        fetchWeeklyData(),
        fetchCategoryData()
      ])

      setDashboardStats(stats)
      setWeeklyData(weekly)
      setCategoryData(categories)
      
      console.log('✅ [ADMIN_STATS] Toutes les statistiques ont été rafraîchies avec succès')
      
      toast({
        title: "Statistiques mises à jour",
        description: "Les données du tableau de bord ont été actualisées.",
      })

    } catch (error) {
      console.error('❌ [ADMIN_STATS] Erreur lors du rafraîchissement:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
      
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de récupérer les statistiques. Vérifiez votre connexion.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // EFFET D'INITIALISATION
  // ========================================
  
  useEffect(() => {
    console.log('🚀 [ADMIN_STATS] Initialisation du hook des statistiques admin')
    refreshStats()

    // Rafraîchissement automatique toutes les 5 minutes
    const interval = setInterval(() => {
      console.log('⏰ [ADMIN_STATS] Rafraîchissement automatique des statistiques')
      refreshStats()
    }, 5 * 60 * 1000)

    return () => {
      console.log('🧹 [ADMIN_STATS] Nettoyage - arrêt du rafraîchissement automatique')
      clearInterval(interval)
    }
  }, [])

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA'
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('fr-FR').format(value)
  }

  // ========================================
  // RETOUR DU HOOK
  // ========================================
  
  return {
    // Données
    dashboardStats,
    weeklyData,
    categoryData,
    
    // États
    loading,
    error,
    
    // Actions
    refreshStats,
    
    // Utilitaires
    formatCurrency,
    formatPercentage,
    formatNumber,
    
    // Indicateurs de santé
    isDataFresh: dashboardStats !== null && !loading && !error,
    lastUpdated: new Date().toISOString()
  }
}