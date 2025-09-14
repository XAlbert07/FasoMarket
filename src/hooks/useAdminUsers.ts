// hooks/useAdminUsers.ts
// Hook spécialisé pour la gestion administrative des utilisateurs

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// ========================================
// INTERFACES POUR LA GESTION DES UTILISATEURS
// ========================================

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
  
  // Métriques calculées
  status: 'active' | 'suspended' | 'banned' | 'pending_verification'
  trust_score: number
  listings_count: number
  active_listings_count: number
  reports_received: number
  reports_made: number
  last_activity: string | null
  verification_status: 'verified' | 'pending' | 'rejected'
  
  // Données d'activité
  total_views_received: number
  total_messages_sent: number
  total_messages_received: number
  account_age_days: number
  
  // Indicateurs de santé du compte
  risk_level: 'low' | 'medium' | 'high'
  suspension_end?: string
  suspension_reason?: string
  warning_count: number
}

export interface UserFilters {
  status?: 'all' | 'active' | 'suspended' | 'banned' | 'pending_verification'
  role?: 'all' | 'merchant' | 'admin'
  location?: string
  verification?: 'all' | 'verified' | 'pending' | 'rejected'
  riskLevel?: 'all' | 'low' | 'medium' | 'high'
  dateRange?: 'all' | '24h' | '7d' | '30d' | '90d'
  sortBy?: 'date' | 'name' | 'trust_score' | 'listings' | 'reports'
}

export interface UserAction {
  type: 'verify' | 'suspend' | 'ban' | 'warn' | 'promote' | 'demote' | 'delete'
  reason: string
  duration?: number // Pour les suspensions temporaires
  notes?: string
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  averageTrustScore: number
  verificationRate: number
  topLocations: Array<{ location: string; count: number }>
}

// ========================================
// HOOK PRINCIPAL
// ========================================

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UserFilters>({})
  const [stats, setStats] = useState<UserStats | null>(null)
  const { toast } = useToast()

  // ========================================
  // RÉCUPÉRATION DES UTILISATEURS ENRICHIS
  // ========================================
  
  const fetchUsers = async (currentFilters: UserFilters = {}) => {
    console.log('Récupération des utilisateurs avec filtres:', currentFilters)
    
    try {
      setLoading(true)
      setError(null)

      // Requête de base pour récupérer les profils
      let usersQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // Application des filtres de base
      if (currentFilters.role && currentFilters.role !== 'all') {
        usersQuery = usersQuery.eq('role', currentFilters.role)
      }
      
      if (currentFilters.location) {
        usersQuery = usersQuery.ilike('location', `%${currentFilters.location}%`)
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
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }
        
        usersQuery = usersQuery.gte('created_at', startDate.toISOString())
      }

      const { data: usersData, error: usersError } = await usersQuery

      if (usersError) throw usersError

      // Récupération des données complémentaires en parallèle
      const userIds = usersData?.map(u => u.id) || []
      
      const [listingsData, reportsData, reportsReceivedData] = await Promise.all([
        // Annonces par utilisateur
        supabase
          .from('listings')
          .select('user_id, status, views_count')
          .in('user_id', userIds),
          
        // Signalements faits par l'utilisateur
        supabase
          .from('reports')
          .select('reporter_id')
          .in('reporter_id', userIds)
          .not('reporter_id', 'is', null),
          
        // Signalements reçus par l'utilisateur
        supabase
          .from('reports')
          .select('user_id, listing_id, listings!inner(user_id)')
          .in('user_id', userIds)
      ])

      if (listingsData.error) throw listingsData.error
      if (reportsData.error) throw reportsData.error
      if (reportsReceivedData.error) throw reportsReceivedData.error

      // Enrichissement des données utilisateur
      const enrichedUsers: AdminUser[] = (usersData || []).map(user => {
        // Calcul des métriques des annonces
        const userListings = listingsData.data?.filter(l => l.user_id === user.id) || []
        const listingsCount = userListings.length
        const activeListingsCount = userListings.filter(l => l.status === 'active').length
        const totalViewsReceived = userListings.reduce((sum, l) => sum + (l.views_count || 0), 0)

        // Calcul des signalements
        const reportsMade = reportsData.data?.filter(r => r.reporter_id === user.id).length || 0
        const reportsReceived = reportsReceivedData.data?.filter(r => 
          r.user_id === user.id || 
          (r.listings && r.listings.user_id === user.id)
        ).length || 0

        // Calcul de l'âge du compte
        const accountCreated = new Date(user.created_at)
        const now = new Date()
        const accountAgeDays = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24))

        // Calcul du score de confiance
        let trustScore = 50 // Score de base
        
        // Bonus pour l'ancienneté
        trustScore += Math.min(accountAgeDays * 0.1, 20)
        
        // Bonus pour les annonces actives
        trustScore += Math.min(activeListingsCount * 2, 15)
        
        // Malus pour les signalements reçus
        trustScore -= reportsReceived * 10
        
        // Bonus pour la vérification (simulé)
        if (user.phone && user.full_name) trustScore += 10
        
        // Maintenir entre 0 et 100
        trustScore = Math.max(0, Math.min(100, trustScore))

        // Détermination du niveau de risque
        let riskLevel: 'low' | 'medium' | 'high' = 'low'
        if (reportsReceived > 2 || trustScore < 30) {
          riskLevel = 'high'
        } else if (reportsReceived > 0 || trustScore < 60) {
          riskLevel = 'medium'
        }

        // Détermination du statut (simulé pour l'exemple)
        let status: AdminUser['status'] = 'active'
        if (riskLevel === 'high' && reportsReceived > 3) {
          status = 'suspended'
        } else if (!user.full_name || !user.phone) {
          status = 'pending_verification'
        }

        // Statut de vérification
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
          total_messages_sent: 0, // À implémenter avec la table messages
          total_messages_received: 0, // À implémenter avec la table messages
          account_age_days: accountAgeDays,
          risk_level: riskLevel,
          warning_count: 0 // À implémenter avec un système d'avertissements
        } as AdminUser
      })

      // Application des filtres calculés
      let filteredUsers = enrichedUsers

      if (currentFilters.status && currentFilters.status !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.status === currentFilters.status)
      }

      if (currentFilters.verification && currentFilters.verification !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.verification_status === currentFilters.verification)
      }

      if (currentFilters.riskLevel && currentFilters.riskLevel !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.risk_level === currentFilters.riskLevel)
      }

      // Tri
      if (currentFilters.sortBy) {
        filteredUsers.sort((a, b) => {
          switch (currentFilters.sortBy) {
            case 'name':
              return (a.full_name || a.email).localeCompare(b.full_name || b.email)
            case 'trust_score':
              return b.trust_score - a.trust_score
            case 'listings':
              return b.listings_count - a.listings_count
            case 'reports':
              return b.reports_received - a.reports_received
            case 'date':
            default:
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
        })
      }

      console.log(`Utilisateurs récupérés et enrichis: ${filteredUsers.length}`)
      setUsers(filteredUsers)

    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les utilisateurs.",
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
    console.log('Calcul des statistiques des utilisateurs')
    
    try {
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('id, location, created_at, phone, full_name')
        .order('created_at', { ascending: false })

      if (error) throw error

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      const totalUsers = allUsers?.length || 0
      const newUsersToday = allUsers?.filter(u => 
        new Date(u.created_at) >= today
      ).length || 0
      const newUsersThisWeek = allUsers?.filter(u => 
        new Date(u.created_at) >= weekAgo
      ).length || 0

      // Calculer le taux de vérification
      const verifiedUsers = allUsers?.filter(u => u.phone && u.full_name).length || 0
      const verificationRate = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0

      // Top des locations
      const locationCounts = (allUsers || []).reduce((acc, user) => {
        const location = user.location || 'Non spécifié'
        acc[location] = (acc[location] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topLocations = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }))

      const calculatedStats: UserStats = {
        totalUsers,
        activeUsers: totalUsers, // Simplifié pour l'exemple
        suspendedUsers: 0, // À calculer avec les vraies données de suspension
        newUsersToday,
        newUsersThisWeek,
        averageTrustScore: 75, // À calculer avec les vrais scores
        verificationRate,
        topLocations
      }

      console.log('Statistiques des utilisateurs calculées:', calculatedStats)
      setStats(calculatedStats)

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error)
    }
  }

  // ========================================
  // ACTIONS ADMINISTRATIVES
  // ========================================
  
  // Extrait du hook useAdminUsers.ts - FONCTION CORRIGÉE
// Remplace la fonction handleUserAction existante par cette version

const handleUserAction = async (userId: string, action: UserAction) => {
  console.log(`Application de l'action ${action.type} sur l'utilisateur ${userId}`);
  
  try {
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action.type) {
      case 'verify':
        // Réactiver un utilisateur suspendu
        updateData = {
          ...updateData,
          suspended_until: null,
          suspension_reason: null,
          is_banned: false,
          ban_reason: null
        };
        break;

      case 'suspend':
        // Suspendre temporairement
        if (action.duration) {
          const suspensionEnd = new Date();
          suspensionEnd.setDate(suspensionEnd.getDate() + action.duration);
          updateData = {
            ...updateData,
            suspended_until: suspensionEnd.toISOString(),
            suspension_reason: action.reason,
            is_banned: false
          };
        }
        break;

      case 'ban':
        // Bannissement permanent
        updateData = {
          ...updateData,
          is_banned: true,
          ban_reason: action.reason,
          suspended_until: null, // Le bannissement remplace la suspension
          suspension_reason: null
        };
        break;

      case 'warn':
        // Pour les avertissements, on ne modifie pas le profil principal
        // mais on enregistrera dans les sanctions
        break;

      case 'promote':
        updateData.role = 'admin';
        break;

      case 'demote':
        updateData.role = 'merchant';
        break;
    }

    // Mise à jour du profil utilisateur (sauf pour les avertissements)
    if (action.type !== 'warn') {
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
    }

    // Enregistrement dans les sanctions (pour tous les types)
    if (['suspend', 'ban', 'warn'].includes(action.type)) {
      try {
        let sanctionType = action.type === 'suspend' ? 'suspension' : 
                          action.type === 'ban' ? 'permanent_ban' : 'warning';
        
        await supabase.from('user_sanctions').insert({
          user_id: userId,
          admin_id: user!.id, // ID de l'admin connecté
          sanction_type: sanctionType,
          reason: action.reason,
          description: action.notes,
          duration_days: action.duration || null,
          effective_until: action.type === 'suspend' && action.duration ? 
            new Date(Date.now() + action.duration * 24 * 60 * 60 * 1000).toISOString() : null
        });
      } catch (sanctionError) {
        console.warn('Impossible d\'enregistrer la sanction:', sanctionError);
      }
    }

    // Enregistrement dans les logs de sécurité
    try {
      await supabase.from('admin_actions').insert({
        admin_id: user!.id,
        action_type: action.type.toUpperCase(),
        target_type: 'user',
        target_id: userId,
        reason: action.reason,
        notes: action.notes,
        metadata: { duration: action.duration }
      });
    } catch (logError) {
      console.warn('Impossible d\'enregistrer dans les logs:', logError);
    }

    // Mise à jour de l'état local
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        let newStatus = u.status;
        if (action.type === 'suspend') newStatus = 'suspended';
        if (action.type === 'ban') newStatus = 'banned';
        if (action.type === 'verify') newStatus = 'active';
        
        return {
          ...u,
          status: newStatus,
          role: updateData.role || u.role,
          updated_at: new Date().toISOString(),
          // Mise à jour des champs de suspension
          suspended_until: updateData.suspended_until || null,
          suspension_reason: updateData.suspension_reason || null,
          is_banned: updateData.is_banned || false,
          ban_reason: updateData.ban_reason || null
        };
      }
      return u;
    }));

    toast({
      title: "Action appliquée",
      description: `L'action ${action.type} a été appliquée avec succès.`,
    });

    return true;

  } catch (error) {
    console.error(`Erreur lors de l'action ${action.type}:`, error);
    
    toast({
      title: "Erreur d'action",
      description: "Impossible d'appliquer l'action sur cet utilisateur.",
      variant: "destructive"
    });
    
    return false;
  }
};

  // ========================================
  // GESTION DES FILTRES
  // ========================================
  
  const applyFilters = (newFilters: Partial<UserFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    fetchUsers(updatedFilters)
  }

  const clearFilters = () => {
    setFilters({})
    fetchUsers({})
  }

  // ========================================
  // RECHERCHE
  // ========================================
  
  const searchUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) return users

    const term = searchTerm.toLowerCase()
    return users.filter(user => 
      user.full_name?.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.phone?.toLowerCase().includes(term) ||
      user.location?.toLowerCase().includes(term)
    )
  }

  // ========================================
  // EFFET D'INITIALISATION
  // ========================================
  
  useEffect(() => {
    console.log('Initialisation du hook des utilisateurs admin')
    fetchUsers()
    calculateStats()

    // Rafraîchissement automatique toutes les 3 minutes
    const interval = setInterval(() => {
      console.log('Rafraîchissement automatique des utilisateurs')
      fetchUsers(filters)
      calculateStats()
    }, 3 * 60 * 1000)

    return () => {
      console.log('Nettoyage du hook des utilisateurs')
      clearInterval(interval)
    }
  }, [])

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================
  
  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getStatusColor = (status: AdminUser['status']) => {
    const colors = {
      active: 'text-green-600 bg-green-50',
      suspended: 'text-orange-600 bg-orange-50',
      banned: 'text-red-600 bg-red-50',
      pending_verification: 'text-blue-600 bg-blue-50'
    }
    return colors[status] || colors.active
  }

  const getRiskLevelColor = (risk: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-red-600 bg-red-50'
    }
    return colors[risk]
  }

  const formatAccountAge = (days: number) => {
    if (days < 30) return `${days} jours`
    if (days < 365) return `${Math.round(days / 30)} mois`
    return `${Math.round(days / 365)} ans`
  }

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Aujourd\'hui'
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
    return `Il y a ${Math.floor(diffDays / 30)} mois`
  }

  // ========================================
  // EXPORT ET ACTIONS EN MASSE
  // ========================================
  
  const exportUsers = (format: 'csv' | 'json' = 'csv') => {
    try {
      if (format === 'csv') {
        const headers = [
          'ID', 'Email', 'Nom complet', 'Téléphone', 'Localisation', 
          'Rôle', 'Statut', 'Score de confiance', 'Annonces', 
          'Signalements reçus', 'Date d\'inscription'
        ]
        
        const csvData = users.map(user => [
          user.id,
          user.email,
          user.full_name || '',
          user.phone || '',
          user.location || '',
          user.role,
          user.status,
          user.trust_score,
          user.listings_count,
          user.reports_received,
          new Date(user.created_at).toLocaleDateString('fr-FR')
        ])
        
        const csvContent = [headers, ...csvData]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `utilisateurs_fasomarket_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        
        toast({
          title: "Export terminé",
          description: `${users.length} utilisateurs exportés en CSV.`,
        })
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive"
      })
    }
  }

  const handleBulkAction = async (userIds: string[], action: UserAction) => {
    console.log(`Action en masse ${action.type} sur ${userIds.length} utilisateurs`)
    
    try {
      const results = await Promise.all(
        userIds.map(id => handleUserAction(id, action))
      )
      
      const successCount = results.filter(Boolean).length
      const failureCount = results.length - successCount
      
      toast({
        title: "Actions en masse terminées",
        description: `${successCount} actions réussies, ${failureCount} échecs`,
        variant: failureCount > 0 ? "destructive" : "default"
      })

      return { successCount, failureCount }

    } catch (error) {
      console.error('Erreur lors des actions en masse:', error)
      return { successCount: 0, failureCount: userIds.length }
    }
  }

  // ========================================
  // NOTIFICATIONS ET COMMUNICATIONS
  // ========================================
  
  const sendNotificationToUser = async (userId: string, title: string, message: string) => {
    try {
      // Ici vous pourriez implémenter l'envoi de notification
      // via votre système de notifications (email, push, in-app)
      
      console.log(`Notification envoyée à ${userId}: ${title}`)
      
      toast({
        title: "Notification envoyée",
        description: "L'utilisateur a été notifié avec succès.",
      })
      
      return true
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error)
      
      toast({
        title: "Erreur de notification",
        description: "Impossible d'envoyer la notification.",
        variant: "destructive"
      })
      
      return false
    }
  }

  const sendBulkNotification = async (userIds: string[], title: string, message: string) => {
    try {
      const results = await Promise.all(
        userIds.map(id => sendNotificationToUser(id, title, message))
      )
      
      const successCount = results.filter(Boolean).length
      
      toast({
        title: "Notifications envoyées",
        description: `${successCount}/${userIds.length} notifications envoyées avec succès.`,
      })

      return successCount

    } catch (error) {
      console.error('Erreur lors de l\'envoi en masse:', error)
      return 0
    }
  }

  // ========================================
  // RETOUR DU HOOK
  // ========================================
  
  return {
    // Données principales
    users,
    stats,
    filters,
    
    // États
    loading,
    error,
    
    // Actions principales
    handleUserAction,
    handleBulkAction,
    
    // Gestion des filtres et recherche
    applyFilters,
    clearFilters,
    searchUsers,
    
    // Actions de rafraîchissement
    refreshUsers: () => fetchUsers(filters),
    refreshStats: calculateStats,
    
    // Export et communication
    exportUsers,
    sendNotificationToUser,
    sendBulkNotification,
    
    // Utilitaires de formatage
    getTrustScoreColor,
    getStatusColor,
    getRiskLevelColor,
    formatAccountAge,
    formatLastActivity,
    
    // Compteurs pour l'interface
    activeUsersCount: users.filter(u => u.status === 'active').length,
    suspendedUsersCount: users.filter(u => u.status === 'suspended').length,
    pendingVerificationCount: users.filter(u => u.status === 'pending_verification').length,
    highRiskUsersCount: users.filter(u => u.risk_level === 'high').length,
    lowTrustScoreCount: users.filter(u => u.trust_score < 30).length,
    
    // Métriques calculées
    averageTrustScore: users.length > 0 
      ? Math.round(users.reduce((sum, u) => sum + u.trust_score, 0) / users.length)
      : 0,
    totalListings: users.reduce((sum, u) => sum + u.listings_count, 0),
    totalReports: users.reduce((sum, u) => sum + u.reports_received, 0),
    
    // Indicateur de santé
    isHealthy: !loading && !error && users.length >= 0,
    lastRefresh: new Date().toISOString()
  }
}





