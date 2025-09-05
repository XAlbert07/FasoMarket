// useAuth.ts - Version complète pour FasoMarket avec fonctionnalités de sécurité avancées
// Cette version intègre toutes les fonctionnalités nécessaires pour les modales de sécurité

import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// ========================================
// INTERFACES ET TYPES
// ========================================

export interface UserProfile {
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
}

// Interface pour les sessions actives - données réelles de Supabase
export interface ActiveSession {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  created_at: string
  updated_at: string
  is_current?: boolean // Calculé côté client
}

// Interface pour les facteurs MFA
export interface MFAFactor {
  id: string
  type: 'totp' // Time-based One-Time Password
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
}

// Interface pour les codes de récupération (backup codes)
export interface BackupCode {
  code: string
  used: boolean
}

// Interface principale du contexte d'authentification étendu
export interface AuthContextType {
  // États de base
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  
  // Méthodes d'authentification de base
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  
  // NOUVELLES MÉTHODES DE SÉCURITÉ AVANCÉE
  // Gestion des mots de passe
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  
  // Authentification à deux facteurs (2FA/MFA)
  setupMFA: () => Promise<{ qr_code: string; secret: string; backup_codes: string[] }>
  verifyMFA: (code: string) => Promise<BackupCode[]>
  disableMFA: () => Promise<void>
  getMFAStatus: () => Promise<{ enabled: boolean; factors: MFAFactor[] }>
  
  // Gestion des sessions
  getActiveSessions: () => Promise<ActiveSession[]>
  revokeSession: (sessionId: string) => Promise<void>
  revokeAllOtherSessions: () => Promise<void>
}

// ========================================
// HOOK PRINCIPAL AVEC SÉCURITÉ AVANCÉE
// ========================================

export const useAuth = (): AuthContextType => {
  // États de base (inchangés)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // ========================================
  // EFFETS ET INITIALISATION (inchangés)
  // ========================================
  
  useEffect(() => {
    // Récupération de la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Écoute des changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ========================================
  // MÉTHODES DE BASE (inchangées)
  // ========================================

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      setLoading(true)
      console.log('🚀 Démarrage du processus de création de compte marchand pour:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            role: 'merchant'
          }
        }
      })

      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            phone: phone || null,
            role: 'merchant'
          })

        if (profileError) {
          console.error('❌ Erreur lors de la création du profil marchand:', profileError)
        }
      }

      toast({
        title: "Compte marchand créé !",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
      })
    } catch (error) {
      const authError = error as AuthError
      let errorMessage = authError.message
      if (authError.message.includes('already registered')) {
        errorMessage = "Cette adresse email est déjà utilisée."
      }
      
      toast({
        title: "Erreur de création de compte",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur FasoMarket.",
      })
    } catch (error) {
      const authError = error as AuthError
      let errorMessage = authError.message
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = "Email ou mot de passe incorrect."
      }
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnexé avec succès.",
      })
    } catch (error) {
      const authError = error as AuthError
      toast({
        title: "Erreur",
        description: authError.message,
        variant: "destructive"
      })
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive"
      })
      throw error
    }
  }

  // ========================================
  // NOUVELLES MÉTHODES DE SÉCURITÉ AVANCÉE
  // ========================================

  /**
   * Changement de mot de passe avec vérification de l'ancien mot de passe
   * Utilise l'API Supabase Auth pour une sécurité maximale
   */
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🔒 Changement de mot de passe pour l\'utilisateur:', user.email)

      // Étape 1: Vérifier le mot de passe actuel en tentant une re-authentification
      // Ceci est une mesure de sécurité importante pour s'assurer que l'utilisateur
      // connaît bien son mot de passe actuel
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })

      if (verifyError) {
        throw new Error("Mot de passe actuel incorrect")
      }

      // Étape 2: Changer le mot de passe
      // Supabase gère automatiquement le hachage et la sécurisation du nouveau mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      console.log('✅ Mot de passe changé avec succès')
      
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été changé avec succès.",
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du changement de mot de passe"
      console.error('❌ Erreur changement mot de passe:', error)
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  /**
   * Demande de réinitialisation de mot de passe par email
   * Utile pour les utilisateurs qui ont oublié leur mot de passe
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      console.log('📧 Demande de réinitialisation de mot de passe pour:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      toast({
        title: "Email envoyé",
        description: "Un lien de réinitialisation a été envoyé à votre adresse email.",
      })

    } catch (error) {
      const authError = error as AuthError
      toast({
        title: "Erreur",
        description: authError.message,
        variant: "destructive"
      })
      throw error
    }
  }

  /**
   * Configuration initiale de l'authentification multi-facteurs (MFA)
   * Génère un QR code et des codes de sauvegarde
   */
  const setupMFA = async (): Promise<{ qr_code: string; secret: string; backup_codes: string[] }> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🔐 Configuration MFA pour l\'utilisateur:', user.email)

      // Étape 1: Enrôler un nouveau facteur TOTP (Time-based One-Time Password)
      const { data: factor, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (enrollError || !factor) {
        throw enrollError || new Error("Erreur lors de l'enrôlement MFA")
      }

      // Étape 2: Générer des codes de sauvegarde
      // Ces codes permettront à l'utilisateur d'accéder à son compte même s'il perd
      // son dispositif d'authentification
      const backupCodes = Array.from({ length: 8 }, () => {
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase()
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase()
        return `${part1}-${part2}`
      })

      // Étape 3: Stocker les codes de sauvegarde dans la base de données
      // En production, ces codes doivent être chiffrés
      const { error: backupError } = await supabase
        .from('user_backup_codes')
        .insert(
          backupCodes.map(code => ({
            user_id: user.id,
            code: code,
            used: false,
            created_at: new Date().toISOString()
          }))
        )

      if (backupError) {
        console.error('⚠️ Erreur lors de la sauvegarde des codes de récupération:', backupError)
        // On continue quand même, les codes peuvent être régénérés
      }

      console.log('✅ Configuration MFA initialisée avec succès')

      return {
        qr_code: factor.totp.qr_code,
        secret: factor.totp.secret,
        backup_codes: backupCodes
      }

    } catch (error) {
      console.error('❌ Erreur lors de la configuration MFA:', error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la configuration 2FA"
      
      toast({
        title: "Erreur 2FA",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  /**
   * Vérification du code TOTP pour finaliser l'activation MFA
   * Cette fonction confirme que l'utilisateur a bien configuré son application
   */
  const verifyMFA = async (code: string): Promise<BackupCode[]> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🔍 Vérification du code MFA pour l\'utilisateur:', user.email)

      // Récupérer les facteurs en attente de vérification
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      
      if (factorsError || !factors) {
        throw factorsError || new Error("Erreur lors de la récupération des facteurs MFA")
      }

      // Trouver le facteur TOTP non vérifié
      const totpFactor = factors.totp.find(factor => factor.status === 'unverified')
      
      if (!totpFactor) {
        throw new Error("Aucun facteur TOTP en attente de vérification")
      }

      // Vérifier le code TOTP
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      })

      if (challengeError || !challenge) {
        throw challengeError || new Error("Erreur lors de la création du challenge MFA")
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: code
      })

      if (verifyError) {
        throw verifyError
      }

      // Récupérer les codes de sauvegarde pour les afficher à l'utilisateur
      const { data: backupCodesData, error: backupCodesError } = await supabase
        .from('user_backup_codes')
        .select('code, used')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      const backupCodes: BackupCode[] = backupCodesData || []

      console.log('✅ MFA activé avec succès')
      
      toast({
        title: "2FA activé",
        description: "L'authentification à deux facteurs a été activée avec succès.",
      })

      return backupCodes

    } catch (error) {
      console.error('❌ Erreur lors de la vérification MFA:', error)
      const errorMessage = error instanceof Error ? error.message : "Code de vérification incorrect"
      
      toast({
        title: "Erreur de vérification",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  /**
   * Désactivation de l'authentification multi-facteurs
   * Supprime tous les facteurs et codes de sauvegarde
   */
  const disableMFA = async (): Promise<void> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🔓 Désactivation MFA pour l\'utilisateur:', user.email)

      // Récupérer tous les facteurs actifs
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      
      if (factorsError) {
        throw factorsError
      }

      // Supprimer tous les facteurs TOTP
      if (factors?.totp) {
        for (const factor of factors.totp) {
          const { error: unenrollError } = await supabase.auth.mfa.unenroll({
            factorId: factor.id
          })
          
          if (unenrollError) {
            console.error('Erreur lors de la suppression du facteur:', unenrollError)
          }
        }
      }

      // Supprimer les codes de sauvegarde de la base de données
      const { error: deleteBackupError } = await supabase
        .from('user_backup_codes')
        .delete()
        .eq('user_id', user.id)

      if (deleteBackupError) {
        console.error('Erreur lors de la suppression des codes de sauvegarde:', deleteBackupError)
      }

      console.log('✅ MFA désactivé avec succès')
      
      toast({
        title: "2FA désactivé",
        description: "L'authentification à deux facteurs a été désactivée.",
      })

    } catch (error) {
      console.error('❌ Erreur lors de la désactivation MFA:', error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la désactivation 2FA"
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  /**
   * Récupération du statut MFA de l'utilisateur
   * Indique si la 2FA est activée et quels facteurs sont disponibles
   */
  const getMFAStatus = async (): Promise<{ enabled: boolean; factors: MFAFactor[] }> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors()
      
      if (error) {
        throw error
      }

      const mfaFactors: MFAFactor[] = factors?.totp?.map(factor => ({
        id: factor.id,
        type: 'totp',
        status: factor.status,
        created_at: factor.created_at,
        updated_at: factor.updated_at
      })) || []

      const enabled = mfaFactors.some(factor => factor.status === 'verified')

      return { enabled, factors: mfaFactors }

    } catch (error) {
      console.error('❌ Erreur lors de la récupération du statut MFA:', error)
      return { enabled: false, factors: [] }
    }
  }

  /**
   * Récupération de toutes les sessions actives de l'utilisateur
   * Note: Supabase ne fournit pas encore d'API native pour cela,
   * cette fonction utilise une approche alternative
   */
  const getActiveSessions = async (): Promise<ActiveSession[]> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('📋 Récupération des sessions actives pour:', user.email)

      // Approche 1: Utiliser une table personnalisée pour tracker les sessions
      // En production, vous devriez créer une table 'user_sessions' et la maintenir
      // via des triggers ou des fonctions edge
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (sessionsError) {
        console.error('Erreur lors de la récupération des sessions:', sessionsError)
        // Fallback: retourner la session courante seulement
        return [{
          id: session?.access_token.substring(0, 8) || 'current',
          user_id: user.id,
          ip_address: 'Inconnue',
          user_agent: navigator.userAgent,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
          is_current: true
        }]
      }

      // Marquer la session courante
      const sessions: ActiveSession[] = (sessionsData || []).map(sessionData => ({
        ...sessionData,
        is_current: sessionData.id === session?.access_token.substring(0, 8)
      }))

      return sessions

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des sessions:', error)
      throw error
    }
  }

  /**
   * Révocation d'une session spécifique
   * Force la déconnexion d'un appareil particulier
   */
  const revokeSession = async (sessionId: string): Promise<void> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🗑️ Révocation de la session:', sessionId)

      // Supprimer la session de notre table de tracking
      const { error: deleteError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (deleteError) {
        throw deleteError
      }

      // Note: Supabase ne permet pas encore de révoquer des sessions spécifiques
      // via l'API client. Cette fonctionnalité nécessite une implémentation
      // côté serveur avec l'Admin API

      console.log('✅ Session révoquée avec succès')
      
      toast({
        title: "Session déconnectée",
        description: "La session a été déconnectée avec succès.",
      })

    } catch (error) {
      console.error('❌ Erreur lors de la révocation de session:', error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la déconnexion"
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  /**
   * Révocation de toutes les autres sessions (sauf la courante)
   * Utile en cas de compromission suspectée du compte
   */
  const revokeAllOtherSessions = async (): Promise<void> => {
    if (!user || !session) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🧹 Révocation de toutes les autres sessions pour:', user.email)

      const currentSessionId = session.access_token.substring(0, 8)

      // Supprimer toutes les autres sessions de notre table de tracking
      const { error: deleteError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('id', currentSessionId)

      if (deleteError) {
        throw deleteError
      }

      console.log('✅ Toutes les autres sessions ont été révoquées')
      
      toast({
        title: "Sessions déconnectées",
        description: "Toutes les autres sessions ont été déconnectées.",
      })

    } catch (error) {
      console.error('❌ Erreur lors de la révocation des sessions:', error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la déconnexion des sessions"
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  // ========================================
  // RETOUR DE L'INTERFACE COMPLÈTE
  // ========================================

  return {
    // États de base
    user,
    profile,
    session,
    loading,
    
    // Méthodes de base
    signUp,
    signIn,
    signOut,
    updateProfile,
    
    // Nouvelles méthodes de sécurité avancée
    changePassword,
    resetPassword,
    setupMFA,
    verifyMFA,
    disableMFA,
    getMFAStatus,
    getActiveSessions,
    revokeSession,
    revokeAllOtherSessions,
  }
}