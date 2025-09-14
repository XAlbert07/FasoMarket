// useAuth.ts - Version complète pour FasoMarket 
// Combine la gestion des suspensions ET toutes les fonctionnalités de sécurité avancées

import { useState, useEffect, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// ========================================
// INTERFACES ET TYPES COMPLETS
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
  // Champs pour la gestion des suspensions (CONSERVÉS de votre nouveau code)
  suspended_until: string | null
  suspension_reason: string | null
  is_banned: boolean | null
  ban_reason: string | null
}

// Interface pour le résultat de vérification de suspension (CONSERVÉE)
export interface SuspensionCheckResult {
  canAccess: boolean
  reason?: 'banned' | 'suspended'
  message?: string
  suspendedUntil?: Date
}

// Interface pour les sessions actives (RESTAURÉE de l'ancien code)
export interface ActiveSession {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  created_at: string
  updated_at: string
  is_current?: boolean
}

// Interface pour les facteurs MFA (RESTAURÉE)
export interface MFAFactor {
  id: string
  type: 'totp'
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
}

// Interface pour les codes de récupération (RESTAURÉE)
export interface BackupCode {
  code: string
  used: boolean
}

// Interface COMPLÈTE du contexte d'authentification
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
  
  // MÉTHODES DE SÉCURITÉ AVANCÉE (RESTAURÉES)
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setupMFA: () => Promise<{ qr_code: string; secret: string; backup_codes: string[] }>
  verifyMFA: (code: string) => Promise<BackupCode[]>
  disableMFA: () => Promise<void>
  getMFAStatus: () => Promise<{ enabled: boolean; factors: MFAFactor[] }>
  getActiveSessions: () => Promise<ActiveSession[]>
  revokeSession: (sessionId: string) => Promise<void>
  revokeAllOtherSessions: () => Promise<void>
}

// ========================================
// SYSTÈME DE LOGGING AMÉLIORÉ (CONSERVÉ)
// ========================================

const createLogger = (context: string) => {
  return {
    info: (message: string, data?: any) => {
      console.log(`🔵 [${context}] ${message}`, data ? data : '')
    },
    success: (message: string, data?: any) => {
      console.log(`✅ [${context}] ${message}`, data ? data : '')
    },
    warning: (message: string, data?: any) => {
      console.warn(`⚠️ [${context}] ${message}`, data ? data : '')
    },
    error: (message: string, error?: any) => {
      console.error(`❌ [${context}] ${message}`, error ? error : '')
    },
    debug: (message: string, data?: any) => {
      console.log(`🔍 [${context}] ${message}`, data ? data : '')
    }
  }
}

// ========================================
// HOOK PRINCIPAL COMPLET
// ========================================

export const useAuth = (): AuthContextType => {
  const logger = createLogger('AUTH_HOOK')
  
  // États de base
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Système anti-collision pour la récupération de profil (CONSERVÉ)
  const profileFetchRef = useRef<{
    isActive: boolean
    currentUserId: string | null
    abortController: AbortController | null
  }>({
    isActive: false,
    currentUserId: null,
    abortController: null
  })

  // ========================================
  // FONCTION DE VÉRIFICATION DE SUSPENSION (CONSERVÉE)
  // ========================================
  
  const checkUserSuspension = async (userId: string): Promise<SuspensionCheckResult> => {
    const suspensionLogger = createLogger('SUSPENSION_CHECK')
    
    try {
      suspensionLogger.info('Vérification du statut de suspension', { userId })
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('suspended_until, suspension_reason, is_banned, ban_reason')
        .eq('id', userId)
        .single()
      
      if (error) {
        suspensionLogger.error('Erreur lors de la vérification de suspension', error)
        return { canAccess: true }
      }
      
      const now = new Date()
      
      // Vérification du bannissement permanent
      if (profile.is_banned) {
        suspensionLogger.warning('Utilisateur banni détecté', { 
          userId, 
          banReason: profile.ban_reason 
        })
        
        return {
          canAccess: false,
          reason: 'banned',
          message: `Votre compte a été banni définitivement. ${profile.ban_reason ? 'Raison: ' + profile.ban_reason : ''}`
        }
      }
      
      // Vérification de la suspension temporaire
      if (profile.suspended_until) {
        const suspensionEnd = new Date(profile.suspended_until)
        
        if (now < suspensionEnd) {
          suspensionLogger.warning('Utilisateur encore suspendu', { 
            userId, 
            suspendedUntil: suspensionEnd 
          })
          
          return {
            canAccess: false,
            reason: 'suspended',
            message: `Votre compte est suspendu jusqu'au ${suspensionEnd.toLocaleDateString('fr-FR')}. ${profile.suspension_reason ? 'Raison: ' + profile.suspension_reason : ''}`,
            suspendedUntil: suspensionEnd
          }
        } else {
          suspensionLogger.info('Suspension expirée - utilisateur peut accéder', { userId })
        }
      }
      
      suspensionLogger.success('Utilisateur autorisé à accéder', { userId })
      return { canAccess: true }
      
    } catch (error) {
      suspensionLogger.error('Exception lors de la vérification de suspension', error)
      return { canAccess: true }
    }
  }

  // ========================================
  // FONCTION DE RÉCUPÉRATION DE PROFIL ANTI-COLLISION (CONSERVÉE ET MISE À JOUR)
  // ========================================
  
  const fetchProfile = async (userId: string, source: string = 'unknown') => {
    const profileLogger = createLogger('FETCH_PROFILE')
    
    // Vérification anti-collision
    if (profileFetchRef.current.isActive && profileFetchRef.current.currentUserId === userId) {
      profileLogger.warning(`Récupération déjà en cours pour l'utilisateur ${userId} (source: ${source}) - ignoré`)
      return
    }

    // Annulation de toute récupération précédente pour un utilisateur différent
    if (profileFetchRef.current.isActive && profileFetchRef.current.currentUserId !== userId) {
      profileLogger.info('Annulation de la récupération précédente (changement d\'utilisateur)')
      profileFetchRef.current.abortController?.abort()
    }

    // Activation du verrou de protection
    const abortController = new AbortController()
    profileFetchRef.current = {
      isActive: true,
      currentUserId: userId,
      abortController
    }

    try {
      profileLogger.info(`[${source}] Démarrage sécurisé de la récupération du profil pour: ${userId}`)
      
      const timeoutId = setTimeout(() => {
        profileLogger.warning('Timeout de 12 secondes atteint - annulation de la requête')
        abortController.abort()
      }, 12000)

      // Requête MISE À JOUR avec les champs de suspension
      const { data, error } = await supabase
        .from('profiles')
        .select('*, suspended_until, suspension_reason, is_banned, ban_reason')
        .eq('id', userId)
        .abortSignal(abortController.signal)
        .single()

      clearTimeout(timeoutId)

      if (abortController.signal.aborted) {
        profileLogger.info('Récupération annulée (timeout ou nouvelle requête)')
        return
      }

      if (error) {
        profileLogger.error('Erreur Supabase lors de la récupération', {
          code: error.code,
          message: error.message
        })
        
        if (error.code === 'PGRST116') {
          profileLogger.info('Profil inexistant - création d\'un profil par défaut')
          
          const defaultProfile: UserProfile = {
            id: userId,
            email: user?.email || '',
            full_name: user?.user_metadata?.full_name || null,
            phone: user?.user_metadata?.phone || null,
            bio: null,
            location: null,
            avatar_url: null,
            role: 'merchant',
            created_at: new Date().toISOString(),
            updated_at: null,
            // Nouveaux champs par défaut
            suspended_until: null,
            suspension_reason: null,
            is_banned: null,
            ban_reason: null
          }
          
          setProfile(defaultProfile)
          
          // Sauvegarde asynchrone
          supabase
            .from('profiles')
            .insert(defaultProfile)
            .then(({ error: insertError }) => {
              if (insertError) {
                profileLogger.warning('Sauvegarde du profil par défaut échouée', insertError)
              } else {
                profileLogger.success('Profil par défaut sauvegardé en base')
              }
            })
            
        } else {
          profileLogger.error('Erreur non récupérable')
          setProfile(null)
          
          if (error.message.includes('JWT')) {
            toast({
              title: "Session expirée",
              description: "Veuillez vous reconnecter.",
              variant: "destructive"
            })
          }
        }
        
      } else {
        profileLogger.success('Données de profil reçues avec succès')
        setProfile(data)
        profileLogger.success('Profil mis à jour dans l\'état React')
      }
      
    } catch (exception) {
      if (exception instanceof Error) {
        if (exception.name === 'AbortError') {
          profileLogger.info('Récupération annulée volontairement (normal)')
          return
        }
        
        profileLogger.error('Exception lors de la récupération', {
          name: exception.name,
          message: exception.message
        })
        
        if (exception.message.includes('fetch')) {
          toast({
            title: "Problème de connexion",
            description: "Vérifiez votre connexion internet.",
            variant: "destructive"
          })
        }
      } else {
        profileLogger.error('Exception non identifiée', exception)
      }
      
      setProfile(null)
      
    } finally {
      if (profileFetchRef.current.currentUserId === userId) {
        profileFetchRef.current = {
          isActive: false,
          currentUserId: null,
          abortController: null
        }
        profileLogger.debug(`[${source}] Libération du verrou de récupération`)
      }
      
      setLoading(false)
    }
  }

  // ========================================
  // INITIALISATION COORDONNÉE (CONSERVÉE)
  // ========================================
  
  useEffect(() => {
    const initLogger = createLogger('INITIALIZATION')
    
    initLogger.info('🚀 Démarrage de l\'initialisation coordonnée de l\'authentification')
    
    let initializationCompleted = false
    
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (initializationCompleted) {
        initLogger.warning('Initialisation déjà terminée - ignoré')
        return
      }
      
      if (error) {
        initLogger.error('Erreur lors de la récupération de session', error)
        setLoading(false)
        initializationCompleted = true
        return
      }
      
      if (session) {
        initLogger.success('Session persistante trouvée', {
          userId: session.user.id,
          email: session.user.email,
          expires: new Date(session.expires_at * 1000).toLocaleString()
        })
        
        setSession(session)
        setUser(session.user)
        
        const timeUntilExpiry = (session.expires_at * 1000) - Date.now()
        const minutesLeft = Math.floor(timeUntilExpiry / (1000 * 60))
        
        if (minutesLeft <= 0) {
          initLogger.warning('Session trouvée mais expirée')
          setLoading(false)
        } else {
          initLogger.info(`Session valide pendant encore ${minutesLeft} minutes`)
          fetchProfile(session.user.id, 'INITIALIZATION')
        }
        
      } else {
        initLogger.info('Aucune session persistante - utilisateur non connecté')
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
      
      initializationCompleted = true
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const eventLogger = createLogger(`AUTH_EVENT_${event}`)
      
      eventLogger.info(`Événement d'authentification: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id || 'N/A'
      })
      
      setSession(session)
      setUser(session?.user ?? null)
      
      switch (event) {
        case 'SIGNED_IN':
          eventLogger.success('Nouvelle connexion détectée')
          if (session?.user) {
            setTimeout(() => {
              if (!profileFetchRef.current.isActive) {
                fetchProfile(session.user.id, 'SIGNED_IN')
              } else {
                eventLogger.info('Récupération déjà en cours - SIGNED_IN ignoré')
              }
            }, 200)
          }
          break
          
        case 'SIGNED_OUT':
          eventLogger.success('Déconnexion détectée')
          setProfile(null)
          setLoading(false)
          
          if (profileFetchRef.current.isActive) {
            profileFetchRef.current.abortController?.abort()
          }
          break
          
        case 'TOKEN_REFRESHED':
          eventLogger.info('Token rafraîchi automatiquement')
          
          if (session?.user && !profile && !profileFetchRef.current.isActive) {
            eventLogger.info('Profil manquant après rafraîchissement - récupération')
            fetchProfile(session.user.id, 'TOKEN_REFRESH')
          }
          break
          
        case 'INITIAL_SESSION':
          if (!initializationCompleted && session?.user) {
            eventLogger.info('Session initiale via événement (fallback)')
            fetchProfile(session.user.id, 'INITIAL_SESSION_FALLBACK')
          } else {
            eventLogger.debug('INITIAL_SESSION ignoré - initialisation déjà gérée')
          }
          break
          
        default:
          eventLogger.warning(`Événement non géré: ${event}`)
      }
      
      eventLogger.debug('Traitement de l\'événement terminé')
    })

    return () => {
      initLogger.info('Nettoyage: arrêt de l\'écouteur et annulation des requêtes')
      subscription.unsubscribe()
      
      if (profileFetchRef.current.isActive) {
        profileFetchRef.current.abortController?.abort()
      }
    }
  }, [])

  // ========================================
  // MÉTHODES D'AUTHENTIFICATION AVEC VÉRIFICATION DE SUSPENSION (CONSERVÉES ET MISES À JOUR)
  // ========================================

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const signupLogger = createLogger('SIGNUP')
    
    try {
      setLoading(true)
      signupLogger.info('Création de compte marchand', { email, fullName })
      
      if (!email.includes('@')) throw new Error('Email invalide')
      if (password.length < 6) throw new Error('Mot de passe trop court')
      if (fullName.trim().length < 2) throw new Error('Nom trop court')
      
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

      signupLogger.success('Compte créé avec succès', { userId: data.user?.id })

      if (data.user) {
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          phone: phone || null,
          role: 'merchant' as const,
          // Champs de suspension initialisés
          suspended_until: null,
          suspension_reason: null,
          is_banned: false,
          ban_reason: null
        }
        
        supabase
          .from('profiles')
          .insert(profileData)
          .then(({ error: profileError }) => {
            if (profileError) {
              signupLogger.warning('Création de profil échouée', profileError)
            } else {
              signupLogger.success('Profil créé en base')
            }
          })
      }

      toast({
        title: "Compte créé !",
        description: "Vérifiez votre email pour confirmer votre compte.",
      })

    } catch (error) {
      const authError = error as AuthError
      signupLogger.error('Échec de création de compte', authError)
      
      let errorMessage = authError.message
      if (authError.message.includes('already registered')) {
        errorMessage = "Cette adresse email est déjà utilisée."
      }
      
      toast({
        title: "Erreur de création",
        description: errorMessage,
        variant: "destructive"
      })
      
      setLoading(false)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    const signinLogger = createLogger('SIGNIN')
    
    try {
      setLoading(true)
      signinLogger.info('Tentative de connexion', { email })
      
      if (!email || !password) throw new Error('Email et mot de passe requis')
      
      // Première étape : authentification avec Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      signinLogger.success('Authentification Supabase réussie', { userId: data.user?.id })

      // Deuxième étape : vérification du statut de suspension
      if (data.user) {
        signinLogger.info('Vérification du statut de suspension avant finalisation de la connexion')
        
        const suspensionCheck = await checkUserSuspension(data.user.id)
        
        if (!suspensionCheck.canAccess) {
          signinLogger.warning('Accès refusé pour cause de suspension/bannissement', {
            userId: data.user.id,
            reason: suspensionCheck.reason,
            message: suspensionCheck.message
          })
          
          // Déconnexion immédiate
          await supabase.auth.signOut()
          signinLogger.info('Déconnexion forcée effectuée')
          
          setUser(null)
          setProfile(null)
          setSession(null)
          setLoading(false)
          
          toast({
            title: suspensionCheck.reason === 'banned' ? "Compte banni" : "Compte suspendu",
            description: suspensionCheck.message,
            variant: "destructive"
          })
          
          throw new Error(suspensionCheck.message)
        }
        
        signinLogger.success('Utilisateur autorisé - finalisation de la connexion')
      }

      signinLogger.success('Connexion complètement réussie', { userId: data.user?.id })

      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur FasoMarket.",
      })

    } catch (error) {
      const authError = error as AuthError
      signinLogger.error('Échec de connexion', authError)
      
      let errorMessage = authError.message
      
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = "Email ou mot de passe incorrect."
      } else if (authError.message.includes('suspendu') || authError.message.includes('banni')) {
        errorMessage = authError.message
      }
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive"
      })
      
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    const signoutLogger = createLogger('SIGNOUT')
    
    try {
      signoutLogger.info('Déconnexion en cours')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error

      signoutLogger.success('Déconnexion réussie')
      
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès.",
      })

    } catch (error) {
      const authError = error as AuthError
      signoutLogger.error('Erreur de déconnexion', authError)
      
      toast({
        title: "Erreur",
        description: authError.message,
        variant: "destructive"
      })
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updateLogger = createLogger('UPDATE_PROFILE')
    
    if (!user) {
      updateLogger.error('Aucun utilisateur connecté')
      return
    }

    try {
      updateLogger.info('Mise à jour du profil', { userId: user.id, fields: Object.keys(updates) })
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updates } : null)
      updateLogger.success('Profil mis à jour avec succès')
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      })

    } catch (error) {
      updateLogger.error('Échec de mise à jour', error)
      
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive"
      })
      
      throw error
    }
  }

  // ========================================
  // MÉTHODES DE SÉCURITÉ AVANCÉES (RESTAURÉES DE L'ANCIEN CODE)
  // ========================================

  /**
   * Changement de mot de passe avec vérification de l'ancien mot de passe
   */
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🔒 Changement de mot de passe pour l\'utilisateur:', user.email)

      // Vérifier le mot de passe actuel
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })

      if (verifyError) {
        throw new Error("Mot de passe actuel incorrect")
      }

      // Changer le mot de passe
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
   */
  const setupMFA = async (): Promise<{ qr_code: string; secret: string; backup_codes: string[] }> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🔐 Configuration MFA pour l\'utilisateur:', user.email)

      // Enrôler un nouveau facteur TOTP
      const { data: factor, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (enrollError || !factor) {
        throw enrollError || new Error("Erreur lors de l'enrôlement MFA")
      }

      // Générer des codes de sauvegarde
      const backupCodes = Array.from({ length: 8 }, () => {
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase()
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase()
        return `${part1}-${part2}`
      })

      // Stocker les codes de sauvegarde dans la base de données
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

      // Récupérer les codes de sauvegarde
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

      // Supprimer les codes de sauvegarde
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
   */
  const getActiveSessions = async (): Promise<ActiveSession[]> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('📋 Récupération des sessions actives pour:', user.email)

      // Tentative de récupération depuis une table personnalisée
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
   */
  const revokeAllOtherSessions = async (): Promise<void> => {
    if (!user || !session) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      console.log('🧹 Révocation de toutes les autres sessions pour:', user.email)

      const currentSessionId = session.access_token.substring(0, 8)

      // Supprimer toutes les autres sessions
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
    
    // Méthodes de sécurité avancée
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