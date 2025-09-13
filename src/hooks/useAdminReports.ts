// hooks/useAdminReports.ts - CORRECTION FINALE avec logique réparée et debuggage complet

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'

export interface AdminActionResult {
  success: boolean
  message: string
  actionId?: string
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
  duration?: number
}

export const useAdminReports = () => {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuthContext()

  const fetchReports = async () => {
    console.log('🔍 [ADMIN_REPORTS] Début de la récupération des signalements')
    
    try {
      setLoading(true)
      setError(null)

      const { data: baseReports, error: baseError } = await supabase
        .from('reports')
        .select(`
          *,
          listing:listings(
            id, title, price, status, user_id
          ),
          reported_user:profiles!reports_user_id_fkey(
            id, full_name, email
          ),
          reporter:profiles!reports_reporter_id_fkey(
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

      const enrichedReports: AdminReport[] = baseReports.map(report => {
        let priority: 'low' | 'medium' | 'high' = 'medium'
        const reasonLower = (report.reason || '').toLowerCase()
        
        if (reasonLower.includes('fraude') || 
            reasonLower.includes('arnaque') ||
            reasonLower.includes('violence') ||
            reasonLower.includes('menace') ||
            reasonLower.includes('contenu inapproprié')) {
          priority = 'high'
        } else if (reasonLower.includes('spam') ||
                   reasonLower.includes('doublon') ||
                   reasonLower.includes('prix incorrect')) {
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
          listing_status: listing?.status || null,
          reported_user_name: reportedUser?.full_name || 'Utilisateur inconnu',
          reported_user_email: reportedUser?.email || null,
          reporter_name: reporter?.full_name || report.guest_name || 'Anonyme',
          reporter_email: reporter?.email || report.guest_email || null,
          reporter_type: report.reporter_id ? 'registered' : 'guest',
          priority,
          response_time_hours: responseTimeHours,
          escalation_level: priority === 'high' ? 2 : (priority === 'medium' ? 1 : 0),
          report_type: report.report_type || 'listing'
        } as AdminReport
      })

      enrichedReports.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        
        if (priorityDiff !== 0) return priorityDiff
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setReports(enrichedReports)
      console.log(`✅ [ADMIN_REPORTS] ${enrichedReports.length} signalements enrichis et triés`)

    } catch (error) {
      console.error('❌ [ADMIN_REPORTS] Erreur lors de la récupération:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les signalements. Vérifiez votre connexion.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // FONCTION CORRIGÉE AVEC DEBUG COMPLET
  const handleReportAction = async (reportId: string, action: ReportAction): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette action.",
        variant: "destructive"
      })
      return false
    }

    console.log(`🔧 [ADMIN_REPORTS] ==> DÉBUT ACTION ${action.type.toUpperCase()} sur signalement ${reportId}`)
    console.log(`📋 [DEBUG] Données de l'action:`, { action, reportId, adminId: user.id })
    
    try {
      const report = reports.find(r => r.id === reportId)
      if (!report) {
        throw new Error('Signalement non trouvé dans la liste locale')
      }

      console.log(`📊 [DEBUG] Signalement trouvé:`, {
        id: report.id,
        report_type: report.report_type,
        listing_id: report.listing_id,
        user_id: report.user_id,
        listing_title: report.listing_title,
        reported_user_name: report.reported_user_name
      })

      // ÉTAPE 1: Détermination correcte du target_type et target_id
      let targetType: 'user' | 'listing' | 'report'
      let targetId: string
      let targetUserId: string | null = null // ID de l'utilisateur à sanctionner

      console.log(`🎯 [DEBUG] Analyse du type d'action: ${action.type}`)

      switch (action.type) {
        case 'ban_user':
        case 'suspend_user': 
        case 'warn_user':
          targetType = 'user'
          console.log(`👤 [DEBUG] Action utilisateur détectée`)
          
          if (report.report_type === 'listing') {
            console.log(`📦 [DEBUG] Signalement d'annonce - recherche du propriétaire`)
            
            if (!report.listing_id) {
              throw new Error('ID de l\'annonce manquant dans le signalement')
            }

            // Récupérer l'ID du propriétaire de l'annonce
            const { data: listingData, error: listingError } = await supabase
              .from('listings')
              .select('user_id, title')
              .eq('id', report.listing_id)
              .single()
              
            console.log(`🔍 [DEBUG] Résultat recherche propriétaire:`, { listingData, listingError })
              
            if (listingError || !listingData) {
              console.error('❌ [DEBUG] Impossible de trouver l\'annonce:', listingError)
              throw new Error('Impossible de trouver le propriétaire de l\'annonce')
            }
            
            targetId = listingData.user_id
            targetUserId = listingData.user_id
            console.log(`✅ [DEBUG] Propriétaire de l'annonce trouvé: ${targetUserId}`)
          } else {
            // Pour un signalement de profil, on cible l'utilisateur signalé
            console.log(`👤 [DEBUG] Signalement de profil`)
            
            if (!report.user_id) {
              throw new Error('ID de l\'utilisateur signalé manquant')
            }
            
            targetId = report.user_id
            targetUserId = report.user_id
            console.log(`✅ [DEBUG] Utilisateur signalé: ${targetUserId}`)
          }
          break

        case 'remove_listing':
        case 'suspend_listing':
          targetType = 'listing'
          console.log(`📦 [DEBUG] Action sur annonce détectée`)
          
          if (!report.listing_id) {
            throw new Error('ID de l\'annonce manquant pour cette action')
          }
          
          targetId = report.listing_id
          console.log(`✅ [DEBUG] Annonce ciblée: ${targetId}`)
          break

        case 'approve':
        case 'dismiss':
        case 'escalate':
        default:
          targetType = 'report'
          targetId = reportId
          console.log(`📋 [DEBUG] Action sur signalement: ${targetId}`)
          break
      }

      console.log(`🎯 [DEBUG] Cible finale: ${targetType}:${targetId}`, { targetUserId })

      // ÉTAPE 2: Mise à jour du statut du signalement
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

      console.log(`📝 [DEBUG] Mise à jour du statut du signalement vers: ${newStatus}`)

      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (updateError) {
        console.error('❌ [DEBUG] Erreur mise à jour signalement:', updateError)
        throw updateError
      }

      console.log(`✅ [DEBUG] Statut du signalement mis à jour`)

      // ÉTAPE 3: Exécution de l'action spécifique
      let actionResult: AdminActionResult = { success: true, message: 'Action appliquée avec succès' }

      console.log(`⚡ [DEBUG] Exécution de l'action spécifique: ${action.type}`)

      switch (action.type) {
        case 'ban_user':
          if (!targetUserId) {
            throw new Error('ID utilisateur manquant pour le bannissement')
          }
          console.log(`🚫 [DEBUG] Bannissement de l'utilisateur: ${targetUserId}`)
          actionResult = await banUser(targetUserId, action.duration || 365, action.reason, action.notes, reportId)
          break
          
        case 'suspend_user':
          if (!targetUserId) {
            throw new Error('ID utilisateur manquant pour la suspension')
          }
          console.log(`⏸️ [DEBUG] Suspension de l'utilisateur: ${targetUserId}`)
          actionResult = await suspendUser(targetUserId, action.duration || 7, action.reason, action.notes, reportId)
          break
          
        case 'warn_user':
          if (!targetUserId) {
            throw new Error('ID utilisateur manquant pour l\'avertissement')
          }
          console.log(`⚠️ [DEBUG] Avertissement pour l'utilisateur: ${targetUserId}`)
          actionResult = await warnUser(targetUserId, action.reason, action.notes, reportId)
          break
          
        case 'remove_listing':
          console.log(`🗑️ [DEBUG] Suppression de l'annonce: ${targetId}`)
          actionResult = await removeListing(targetId, action.reason, action.notes, reportId)
          break
          
        case 'suspend_listing':
          console.log(`⏸️ [DEBUG] Suspension de l'annonce: ${targetId}`)
          actionResult = await suspendListing(targetId, action.duration || 7, action.reason, action.notes, reportId)
          break
      }

      console.log(`🎯 [DEBUG] Résultat de l'action:`, actionResult)

      if (!actionResult.success) {
        throw new Error(actionResult.message)
      }

      // ÉTAPE 4: Enregistrement de l'action pour audit
      console.log(`📝 [DEBUG] Enregistrement de l'audit`)
      await logAdminAction({
        adminId: user.id,
        actionType: action.type,
        targetType: targetType,
        targetId: targetId,
        reason: action.reason,
        notes: action.notes,
        reportId: reportId
      })

      // ÉTAPE 5: Mise à jour de l'état local
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, status: newStatus, updated_at: new Date().toISOString() }
          : r
      ))

      toast({
        title: "Action appliquée avec succès",
        description: actionResult.message,
      })

      console.log(`✅ [ADMIN_REPORTS] ==> FIN ACTION ${action.type.toUpperCase()} - SUCCÈS`)
      
      // ÉTAPE 6: Rafraîchissement pour vérifier les changements
      setTimeout(async () => {
        console.log(`🔄 [DEBUG] Rafraîchissement des données dans 2 secondes`)
        await fetchReports()
      }, 2000)

      return true

    } catch (error) {
      console.error(`❌ [ADMIN_REPORTS] ==> ÉCHEC ACTION ${action.type.toUpperCase()}:`, error)
      console.error(`💥 [DEBUG] Détails de l'erreur:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        reportId,
        action,
        user: user?.id
      })
      
      toast({
        title: "Erreur lors de l'action",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      })
      
      return false
    }
  }

  // FONCTIONS D'ACTION CORRIGÉES AVEC DEBUG
  const banUser = async (
    userId: string, 
    durationDays: number, 
    reason: string, 
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    try {
      console.log(`🔒 [BAN_USER] ==> DÉBUT - Utilisateur: ${userId}, Durée: ${durationDays} jours`)

      if (!userId) {
        throw new Error('ID utilisateur requis pour le bannissement')
      }

      // Vérification que l'utilisateur existe
      const { data: userCheck, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', userId)
        .single()

      console.log(`👤 [BAN_USER] Vérification utilisateur:`, { userCheck, userCheckError })

      if (userCheckError || !userCheck) {
        throw new Error(`Utilisateur introuvable: ${userId}`)
      }

      console.log(`✅ [BAN_USER] Utilisateur trouvé: ${userCheck.full_name}`)

      const effectiveUntil = durationDays >= 365 
        ? null 
        : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

      console.log(`📅 [BAN_USER] Date d'expiration calculée:`, effectiveUntil)

      // 1. Création de la sanction
      console.log(`📝 [BAN_USER] Création de la sanction`)
      const { data: sanction, error: sanctionError } = await supabase
        .from('user_sanctions')
        .insert({
          user_id: userId,
          admin_id: user!.id,
          sanction_type: durationDays >= 365 ? 'permanent_ban' : 'suspension',
          reason,
          description: notes,
          duration_days: durationDays >= 365 ? null : durationDays,
          effective_until: effectiveUntil,
          related_report_id: reportId
        })
        .select()
        .single()

      console.log(`📝 [BAN_USER] Résultat création sanction:`, { sanction, sanctionError })

      if (sanctionError) {
        console.error('❌ [BAN_USER] Erreur création sanction:', sanctionError)
        throw sanctionError
      }

      // 2. MISE À JOUR DU PROFIL UTILISATEUR - CRITIQUE
      console.log(`👤 [BAN_USER] Mise à jour du profil utilisateur`)
      const { data: profileUpdate, error: profileError } = await supabase
        .from('profiles')
        .update({
          suspended_until: effectiveUntil,
          suspension_reason: reason,
          is_banned: durationDays >= 365,
          ban_reason: durationDays >= 365 ? reason : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, suspended_until, is_banned')

      console.log(`👤 [BAN_USER] Résultat mise à jour profil:`, { profileUpdate, profileError })

      if (profileError) {
        console.error('❌ [BAN_USER] Erreur critique - mise à jour profil:', profileError)
        throw new Error(`Impossible de mettre à jour le profil: ${profileError.message}`)
      }

      if (!profileUpdate || profileUpdate.length === 0) {
        console.error('❌ [BAN_USER] Aucune ligne affectée lors de la mise à jour du profil')
        throw new Error('La mise à jour du profil utilisateur a échoué')
      }

      console.log(`✅ [BAN_USER] Profil mis à jour avec succès:`, profileUpdate[0])

      // 3. SUSPENSION DES ANNONCES DE L'UTILISATEUR
      console.log(`📦 [BAN_USER] Suspension des annonces de l'utilisateur`)
      const { data: listingsUpdate, error: listingsError } = await supabase
        .from('listings')
        .update({ 
          status: 'suspended',
          suspended_until: effectiveUntil,
          suspension_reason: `Utilisateur sanctionné: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active') // Ne suspendre que les annonces actives
        .select('id, title, status')

      console.log(`📦 [BAN_USER] Résultat suspension annonces:`, { 
        listingsUpdate, 
        listingsError,
        nombreAnnencesSuspendues: listingsUpdate?.length || 0
      })

      if (listingsError) {
        console.warn('⚠️ [BAN_USER] Erreur suspension des annonces (non critique):', listingsError)
      }

      // 4. VÉRIFICATION FINALE
      console.log(`🔍 [BAN_USER] Vérification finale de l'état de l'utilisateur`)
      const { data: finalCheck, error: finalCheckError } = await supabase
        .from('profiles')
        .select('id, full_name, suspended_until, suspension_reason, is_banned')
        .eq('id', userId)
        .single()

      console.log(`🔍 [BAN_USER] État final de l'utilisateur:`, { finalCheck, finalCheckError })

      const sanctionType = durationDays >= 365 ? 'banni définitivement' : `suspendu pour ${durationDays} jours`
      const successMessage = `L'utilisateur ${userCheck.full_name} a été ${sanctionType} avec succès.`
      
      console.log(`✅ [BAN_USER] ==> SUCCÈS - ${successMessage}`)
      
      return {
        success: true,
        message: successMessage,
        actionId: sanction.id
      }

    } catch (error) {
      console.error('❌ [BAN_USER] ==> ÉCHEC - Erreur complète:', {
        error: error instanceof Error ? error.message : error,
        userId,
        durationDays,
        reason
      })
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors du bannissement'
      }
    }
  }

  const suspendUser = async (
    userId: string,
    durationDays: number,
    reason: string,
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    console.log(`⏸️ [SUSPEND_USER] Redirection vers banUser avec durée limitée`)
    return banUser(userId, Math.min(durationDays, 90), reason, notes, reportId)
  }

  const warnUser = async (
    userId: string,
    reason: string,
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    try {
      console.log(`⚠️ [WARN_USER] ==> DÉBUT - Utilisateur: ${userId}`)

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

      console.log(`⚠️ [WARN_USER] Résultat:`, { warning, warningError })

      if (warningError) {
        console.error('❌ [WARN_USER] Erreur:', warningError)
        throw warningError
      }

      console.log(`✅ [WARN_USER] ==> SUCCÈS`)
      return {
        success: true,
        message: 'Un avertissement a été envoyé à l\'utilisateur.',
        actionId: warning.id
      }

    } catch (error) {
      console.error('❌ [WARN_USER] ==> ÉCHEC:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'avertissement'
      }
    }
  }

const suspendListing = async (
  listingId: string,
  durationDays: number,
  reason: string,
  notes?: string,
  reportId?: string
): Promise<AdminActionResult> => {
  try {
    console.log(`⏸️ [SUSPEND_LISTING] ==> DÉBUT - Annonce: ${listingId}, Durée: ${durationDays} jours`)

    const suspendedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    console.log(`📅 [SUSPEND_LISTING] Date d'expiration:`, suspendedUntil)
    console.log(`👤 [SUSPEND_LISTING] Utilisateur admin:`, user?.id)

    const { data: updateResult, error: suspendError } = await supabase
      .from('listings')
      .update({
        status: 'suspended',
        suspended_until: suspendedUntil,
        suspension_reason: reason,
        suspension_type: 'admin',        // NOUVEAU : Marquer comme suspension admin
        suspended_by: user!.id,          // NOUVEAU : ID de l'admin qui suspend
        moderation_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .select('id, title, status, suspended_until, suspension_type')

    console.log(`⏸️ [SUSPEND_LISTING] Résultat:`, { updateResult, suspendError })

    if (suspendError) {
      console.error('❌ [SUSPEND_LISTING] Erreur:', suspendError)
      throw suspendError
    }

    if (!updateResult || updateResult.length === 0) {
      throw new Error('Aucune annonce n\'a été modifiée - vérifiez l\'ID')
    }

    console.log(`✅ [SUSPEND_LISTING] ==> SUCCÈS - Suspension administrative appliquée`)
    return {
      success: true,
      message: `L'annonce a été suspendue par l'administration pour ${durationDays} jour(s).`,
      actionId: listingId
    }

  } catch (error) {
    console.error('❌ [SUSPEND_LISTING] ==> ÉCHEC:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la suspension'
    }
  }
}

  const removeListing = async (
    listingId: string,
    reason: string,
    notes?: string,
    reportId?: string
  ): Promise<AdminActionResult> => {
    try {
      console.log(`🗑️ [REMOVE_LISTING] ==> DÉBUT - Annonce: ${listingId}`)

      const { data: updateResult, error: removeError } = await supabase
        .from('listings')
        .update({
          status: 'suspended', // Suppression logique
          suspension_reason: reason,
          moderation_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .select('id, title, status')

      console.log(`🗑️ [REMOVE_LISTING] Résultat:`, { updateResult, removeError })

      if (removeError) {
        console.error('❌ [REMOVE_LISTING] Erreur:', removeError)
        throw removeError
      }

      if (!updateResult || updateResult.length === 0) {
        throw new Error('Aucune annonce n\'a été modifiée')
      }

      console.log(`✅ [REMOVE_LISTING] ==> SUCCÈS`)
      return {
        success: true,
        message: 'L\'annonce a été supprimée avec succès.',
        actionId: listingId
      }

    } catch (error) {
      console.error('❌ [REMOVE_LISTING] ==> ÉCHEC:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      }
    }
  }

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
      console.log(`📝 [LOG_ACTION] Enregistrement:`, actionData)

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

      console.log(`✅ [LOG_ACTION] Action enregistrée`)
    } catch (error) {
      console.warn('⚠️ [LOG_ACTION] Erreur (non bloquante):', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-600 bg-red-50 border-red-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
      low: 'text-green-600 bg-green-50 border-green-200'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-orange-600 bg-orange-50 border-orange-200',
      in_review: 'text-blue-600 bg-blue-50 border-blue-200',
      resolved: 'text-green-600 bg-green-50 border-green-200',
      dismissed: 'text-gray-600 bg-gray-50 border-gray-200'
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

  useEffect(() => {
    console.log('🚀 [ADMIN_REPORTS] Initialisation du hook')
    fetchReports()
    
    const interval = setInterval(() => {
      console.log('🔄 [ADMIN_REPORTS] Rafraîchissement automatique')
      fetchReports()
    }, 5 * 60 * 1000)
    
    return () => {
      console.log('🧹 [ADMIN_REPORTS] Nettoyage du hook')
      clearInterval(interval)
    }
  }, [])

  return {
    reports,
    loading,
    error,
    
    handleReportAction,
    refreshReports: fetchReports,
    
    getPriorityColor,
    getStatusColor,
    formatResponseTime,
    
    pendingCount: reports.filter(r => r.status === 'pending').length,
    highPriorityCount: reports.filter(r => r.priority === 'high').length,
    overdueCount: reports.filter(r => 
      r.status === 'pending' && r.response_time_hours && r.response_time_hours > 24
    ).length,
    
    totalReports: reports.length,
    resolvedCount: reports.filter(r => r.status === 'resolved').length,
    dismissedCount: reports.filter(r => r.status === 'dismissed').length,
    inReviewCount: reports.filter(r => r.status === 'in_review').length,
    
    averageResponseTime: reports.length > 0 
      ? reports.reduce((sum, r) => sum + (r.response_time_hours || 0), 0) / reports.length 
      : 0,
    resolutionRate: reports.length > 0 
      ? ((reports.filter(r => ['resolved', 'dismissed'].includes(r.status)).length) / reports.length) * 100 
      : 0,
    
    isHealthy: !loading && !error && reports.length >= 0,
    lastRefresh: new Date().toISOString()
  }
}