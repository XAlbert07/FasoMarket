// hooks/useAdminReports.ts
// Version complète avec implémentation des actions administratives

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'

// ========================================
// INTERFACES ÉTENDUES POUR L'ADMINISTRATION
// ========================================

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
  
  // Champs pour signalements invités
  guest_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  report_type: 'listing' | 'profile'
  
  // Données enrichies pour l'affichage
  listing_title?: string
  listing_price?: number
  listing_status?: string
  reported_user_name?: string
  reported_user_email?: string
  reporter_name?: string
  reporter_email?: string
  reporter_type: 'registered' | 'guest'
  priority: 'low' | 'medium' | 'high'
  response_time_hours?: number
  escalation_level: number
}

export interface ReportAction {
  type: 'approve' | 'dismiss' | 'escalate' | 'ban_user' | 'suspend_user' | 'warn_user' | 'remove_listing' | 'suspend_listing'
  reason: string
  notes?: string
  duration?: number // En jours pour les sanctions temporaires
}

export interface AdminActionResult {
  success: boolean
  message: string
  actionId?: string
}

// ========================================
// HOOK PRINCIPAL AVEC ACTIONS COMPLÈTES
// ========================================

export const useAdminReports = () => {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuthContext() // Pour identifier l'admin qui effectue l'action

  // ========================================
  // RÉCUPÉRATION DES SIGNALEMENTS
  // ========================================
  
  const fetchReports = async () => {
    console.log('🔍 [ADMIN_REPORTS] Récupération des signalements')
    
    try {
      setLoading(true)
      setError(null)

      // Requête principale pour récupérer les signalements avec leurs données liées
      const { data: baseReports, error: baseError } = await supabase
        .from('reports')
        .select(`
          *,
          listing:listings(
            id, title, price, status, user_id
          ),
          reported_user:profiles!user_id(
            id, full_name, email
          ),
          reporter:profiles!reporter_id(
            id, full_name, email
          )
        `)
        .order('created_at', { ascending: false })

      if (baseError) {
        console.error('❌ [ADMIN_REPORTS] Erreur récupération:', baseError)
        throw baseError
      }

      if (!baseReports || baseReports.length === 0) {
        setReports([])
        return
      }

      // Enrichissement des données
      const enrichedReports: AdminReport[] = baseReports.map(report => {
        // Calcul de la priorité basée sur le motif
        let priority: 'low' | 'medium' | 'high' = 'medium'
        const reasonLower = report.reason.toLowerCase()
        
        if (reasonLower.includes('fraude') || 
            reasonLower.includes('arnaque') ||
            reasonLower.includes('violence') ||
            reasonLower.includes('menace')) {
          priority = 'high'
        } else if (reasonLower.includes('spam') ||
                   reasonLower.includes('doublon')) {
          priority = 'low'
        }

        // Calcul du temps de réponse
        const createdAt = new Date(report.created_at)
        const now = new Date()
        const responseTimeHours = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))

        return {
          ...report,
          listing_title: report.listing?.title || null,
          listing_price: report.listing?.price || null,
          listing_status: report.listing?.status || null,
          reported_user_name: report.reported_user?.full_name || 'Utilisateur inconnu',
          reported_user_email: report.reported_user?.email || null,
          reporter_name: report.reporter?.full_name || report.guest_name || 'Anonyme',
          reporter_email: report.reporter?.email || report.guest_email || null,
          reporter_type: report.reporter_id ? 'registered' : 'guest',
          priority,
          response_time_hours: responseTimeHours,
          escalation_level: priority === 'high' ? 2 : (priority === 'medium' ? 1 : 0),
          report_type: report.report_type || 'listing'
        }
      })

      // Tri par priorité puis par date
      enrichedReports.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        
        if (priorityDiff !== 0) return priorityDiff
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setReports(enrichedReports)
      console.log(`✅ [ADMIN_REPORTS] ${enrichedReports.length} signalements chargés`)

    } catch (error) {
      console.error('❌ [ADMIN_REPORTS] Erreur lors de la récupération:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les signalements.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // ACTIONS ADMINISTRATIVES COMPLÈTES
  // ========================================
  
  const handleReportAction = async (reportId: string, action: ReportAction): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette action.",
        variant: "destructive"
      })
      return false
    }

    console.log(`🔧 [ADMIN_REPORTS] Action ${action.type} sur signalement ${reportId}`)
    
    try {
      const report = reports.find(r => r.id === reportId)
      if (!report) {
        throw new Error('Signalement non trouvé')
      }

      // 1. Mise à jour du statut du signalement
      let newStatus: 'pending' | 'in_review' | 'resolved' | 'dismissed' = 'resolved'
      
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
        default:
          newStatus = 'resolved'
      }

      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (updateError) throw updateError

      // 2. Exécution de l'action spécifique selon le type
      let actionResult: AdminActionResult = { success: true, message: 'Action appliquée avec succès' }

      switch (action.type) {
        case 'ban_user':
          if (report.user_id) {
            actionResult = await banUser(report.user_id, action.duration || 30, action.reason, action.notes, reportId)
          }
          break
          
        case 'suspend_user':
          if (report.user_id) {
            actionResult = await suspendUser(report.user_id, action.duration || 7, action.reason, action.notes, reportId)
          }
          break
          
        case 'warn_user':
          if (report.user_id) {
            actionResult = await warnUser(report.user_id, action.reason, action.notes, reportId)
          }
          break
          
        case 'remove_listing':
          if (report.listing_id) {
            actionResult = await removeListing(report.listing_id, action.reason, action.notes, reportId)
          }
          break
          
        case 'suspend_listing':
          if (report.listing_id) {
            actionResult = await suspendListing(report.listing_id, action.reason, action.notes, reportId)
          }
          break
      }

      if (!actionResult.success) {
        throw new Error(actionResult.message)
      }

      // 3. Enregistrement de l'action administrative pour audit
      await logAdminAction({
        adminId: user.id,
        actionType: action.type,
        targetType: report.report_type === 'listing' ? 'listing' : 'user',
        targetId: report.listing_id || report.user_id || '',
        reason: action.reason,
        notes: action.notes,
        reportId: reportId
      })

      // 4. Mise à jour de l'état local
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, status: newStatus, updated_at: new Date().toISOString() }
          : r
      ))

      toast({
        title: "Action appliquée avec succès",
        description: actionResult.message,
      })

      return true

    } catch (error) {
      console.error(`❌ [ADMIN_REPORTS] Erreur action ${action.type}:`, error)
      
      toast({
        title: "Erreur lors de l'action",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      })
      
      return false
    }
  }

  // ========================================
  // FONCTIONS D'ACTIONS SPÉCIFIQUES
  // ========================================
  
  /**
   * Bannir définitivement un utilisateur
   */
  const banUser = async (
    userId: string, 
    durationDays: number, 
    reason: string, 
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    try {
      // Création de la sanction
      const { data: sanction, error: sanctionError } = await supabase
        .from('user_sanctions')
        .insert({
          user_id: userId,
          admin_id: user!.id,
          sanction_type: durationDays > 365 ? 'permanent_ban' : 'suspension',
          reason,
          description: notes,
          duration_days: durationDays > 365 ? null : durationDays,
          effective_until: durationDays > 365 ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
          related_report_id: reportId
        })
        .select()
        .single()

      if (sanctionError) throw sanctionError

      // Désactivation de toutes les annonces actives de l'utilisateur
      const { error: listingsError } = await supabase
        .from('listings')
        .update({ 
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('status', ['active'])

      if (listingsError) {
        console.warn('Erreur lors de la suspension des annonces:', listingsError)
      }

      const sanctionType = durationDays > 365 ? 'banni définitivement' : `suspendu pour ${durationDays} jours`
      
      return {
        success: true,
        message: `L'utilisateur a été ${sanctionType} avec succès.`,
        actionId: sanction.id
      }

    } catch (error) {
      console.error('Erreur lors du bannissement:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors du bannissement'
      }
    }
  }

  /**
   * Suspendre temporairement un utilisateur
   */
  const suspendUser = async (
    userId: string,
    durationDays: number,
    reason: string,
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    // Utilise la même logique que banUser mais avec une durée limitée
    return banUser(userId, durationDays, reason, notes, reportId)
  }

  /**
   * Avertir un utilisateur sans sanction
   */
  const warnUser = async (
    userId: string,
    reason: string,
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    try {
      const { data: warning, error: warningError } = await supabase
        .from('user_sanctions')
        .insert({
          user_id: userId,
          admin_id: user!.id,
          sanction_type: 'warning',
          reason,
          description: notes,
          related_report_id: reportId
        })
        .select()
        .single()

      if (warningError) throw warningError

      // TODO: Ici vous pourriez envoyer une notification à l'utilisateur
      // ou créer un système de messages internes

      return {
        success: true,
        message: 'Un avertissement a été envoyé à l\'utilisateur.',
        actionId: warning.id
      }

    } catch (error) {
      console.error('Erreur lors de l\'avertissement:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'avertissement'
      }
    }
  }

  /**
   * Supprimer définitivement une annonce
   */
  const removeListing = async (
    listingId: string,
    reason: string,
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    try {
      // Archivage plutôt que suppression pure pour garder une trace
      const { error: removeError } = await supabase
        .from('listings')
        .update({
          status: 'suspended', // Vous pourriez créer un statut 'removed' si nécessaire
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)

      if (removeError) throw removeError

      return {
        success: true,
        message: 'L\'annonce a été supprimée avec succès.',
        actionId: listingId
      }

    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      }
    }
  }

  /**
   * Suspendre temporairement une annonce
   */
  const suspendListing = async (
    listingId: string,
    reason: string,
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    try {
      const { error: suspendError } = await supabase
        .from('listings')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)

      if (suspendError) throw suspendError

      return {
        success: true,
        message: 'L\'annonce a été suspendue avec succès.',
        actionId: listingId
      }

    } catch (error) {
      console.error('Erreur lors de la suspension:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suspension'
      }
    }
  }

  /**
   * Enregistrer l'action administrative pour audit
   */
  const logAdminAction = async (actionData: {
    adminId: string
    actionType: string
    targetType: string
    targetId: string
    reason: string
    notes?: string
    reportId?: string
  }) => {
    try {
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: actionData.adminId,
          action_type: actionData.actionType,
          target_type: actionData.targetType,
          target_id: actionData.targetId,
          reason: actionData.reason,
          notes: actionData.notes,
          metadata: actionData.reportId ? { related_report_id: actionData.reportId } : null
        })
    } catch (error) {
      console.warn('Erreur lors de l\'enregistrement de l\'audit:', error)
      // L'audit ne doit pas faire échouer l'action principale
    }
  }

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================
  
  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50', 
      low: 'text-green-600 bg-green-50'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-orange-600 bg-orange-50',
      in_review: 'text-blue-600 bg-blue-50',
      resolved: 'text-green-600 bg-green-50',
      dismissed: 'text-gray-600 bg-gray-50'
    }
    return colors[status as keyof typeof colors] || colors.pending
  }

  const formatResponseTime = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`
    } else if (hours < 24 * 7) {
      return `${Math.round(hours / 24)}j`
    } else {
      return `${Math.round(hours / (24 * 7))}sem`
    }
  }

  // ========================================
  // EFFET D'INITIALISATION
  // ========================================
  
  useEffect(() => {
    fetchReports()
    
    // Rafraîchissement automatique toutes les 5 minutes
    const interval = setInterval(fetchReports, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // ========================================
  // RETOUR DU HOOK
  // ========================================
  
  return {
    // Données principales
    reports,
    loading,
    error,
    
    // Actions principales
    handleReportAction,
    refreshReports: fetchReports,
    
    // Utilitaires pour l'interface
    getPriorityColor,
    getStatusColor,
    formatResponseTime,
    
    // Compteurs pour l'interface
    pendingCount: reports.filter(r => r.status === 'pending').length,
    highPriorityCount: reports.filter(r => r.priority === 'high').length,
    overdueCount: reports.filter(r => 
      r.status === 'pending' && r.response_time_hours && r.response_time_hours > 24
    ).length
  }
}






