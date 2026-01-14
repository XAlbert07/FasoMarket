// useAuth.ts 

import { useState, useEffect, useRef, useMemo } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { cache } from '@/lib/cache'
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
  suspended_until: string | null
  suspension_reason: string | null
  is_banned: boolean | null
  ban_reason: string | null
}

// Interface pour le résultat de vérification de suspension 
export interface SuspensionCheckResult {
  canAccess: boolean
  reason?: 'banned' | 'suspended'
  message?: string
  suspendedUntil?: Date
}

// Interface pour les sessions actives 
export interface ActiveSession {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  created_at: string
  updated_at: string
  is_current?: boolean
}

// Interface pour les facteurs MFA 
export interface MFAFactor {
  id: string
  type: 'totp'
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
}

// Interface pour les codes de récupération 
export interface BackupCode {
  code: string
  used: boolean
}

// Interface du contexte d'authentification
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
  
  // Méthodes de sécurité avancée
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setupMFA: () => Promise<{ qr_code: string; secret: string; backup_codes: string[] }>
  verifyMFA: (code: string) => Promise<BackupCode[]>
  disableMFA: () => Promise<void>
  getMFAStatus: () => Promise<{ enabled: boolean; factors: MFAFactor[] }>
  debugMFAState: () => Promise<void>
  cleanupAllMFA: () => Promise<void> 
  getActiveSessions: () => Promise<ActiveSession[]>
  revokeSession: (sessionId: string) => Promise<void>
  revokeAllOtherSessions: () => Promise<void>
}

// ========================================
// SYSTÈME DE LOGGING AMÉLIORÉ 
// ========================================

const createLogger = (context: string) => {
  return {
    info: (message: string, data?: any) => {
    },
    success: (message: string, data?: any) => {
    },
    warning: (message: string, data?: any) => {
      console.warn(`⚠️ [${context}] ${message}`, data ? data : '')
    },
    error: (message: string, error?: any) => {
      console.error(`❌ [${context}] ${message}`, error ? error : '')
    },
    debug: (message: string, data?: any) => {
    }
  }
}

// ========================================
// HOOK PRINCIPAL 
// ========================================

export const useAuth = (): AuthContextType => {
  const logger = createLogger('AUTH_HOOK')
  
  // États de base
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Mémorisation du profil pour éviter les re-renders inutiles
  const memoizedProfile = useMemo(() => {
    if (!profile) return null
    return {
      ...profile,
      // Stabiliser l'URL de l'avatar pour éviter le rechargement
      avatar_url: profile.avatar_url || null
    }
  }, [profile?.id, profile?.avatar_url, profile?.updated_at])

  // Système anti-collision pour la récupération de profil 
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
  // FONCTION DE VÉRIFICATION DE SUSPENSION 
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
  // FONCTION DE RÉCUPÉRATION DE PROFIL ANTI-COLLISION 
  // ========================================
  
  const fetchProfile = async (userId: string, source: string = 'unknown') => {
    const profileLogger = createLogger('FETCH_PROFILE')

    // Vérifier le cache d'abord
    const cachedProfile = cache.get<UserProfile>(cache.profileKey(userId))
    if (cachedProfile) {
      profileLogger.info('Profil récupéré depuis le cache')
      setProfile(cachedProfile)
      setLoading(false)
      return
    }
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

      // Requête avec les champs de suspension
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
        cache.set(cache.profileKey(userId), data)
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
  // GESTION DES SESSIONS - VERSION PRODUCTION RÉELLE
  // ========================================

  /**
   * Enregistrer la session courante pour le tracking
   */
  const trackCurrentSession = async (): Promise<void> => {
    if (!user || !session) return

    try {
      const sessionData = {
        id: session.access_token.substring(0, 16),
        user_id: user.id,
        ip_address: 'client_tracking', // Limitation : pas d'accès IP côté client
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        expires_at: new Date(session.expires_at * 1000).toISOString(),
        device_info: {
          platform: navigator.platform,
          language: navigator.language,
          screen_resolution: `${screen.width}x${screen.height}`
        }
      }

      await supabase
        .from('user_sessions')
        .upsert(sessionData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

    } catch (error) {
      console.warn('Erreur lors du tracking de session (non critique):', error)
    }
  }

  /**
   * Initialisation du tracking de session
   */
  const initializeSessionTracking = async () => {
    if (!user || !session) return

    try {
      // 1. Tracker la session courante
      await trackCurrentSession()

      // 2. Nettoyer les sessions expirées
      const now = new Date().toISOString()
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .lt('expires_at', now)

    } catch (error) {
      console.warn('Erreur lors de l\'initialisation du tracking:', error)
    }
  }

  /**
   * Récupération des sessions actives RÉELLES
   */
  const getActiveSessions = async (): Promise<ActiveSession[]> => {
    if (!user || !session) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {

      // APPROCHE HYBRIDE : Combiner session courante + historique de tracking
      const sessions: ActiveSession[] = []

      // 1. Ajouter TOUJOURS la session courante (garantie d'être réelle)
      const currentSession: ActiveSession = {
        id: session.access_token.substring(0, 16),
        user_id: user.id,
        ip_address: 'Session courante',
        user_agent: navigator.userAgent,
        created_at: new Date(session.user?.created_at || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
        is_current: true
      }
      sessions.push(currentSession)

      // 2. Essayer de récupérer l'historique depuis la table de tracking (optionnel)
      try {
        const { data: trackedSessions } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .neq('id', currentSession.id) // Exclure la session courante
          .order('updated_at', { ascending: false })
          .limit(10) // Limiter à 10 sessions historiques

        // Ajouter les sessions trackées (avec avertissement qu'elles peuvent être expirées)
        if (trackedSessions && trackedSessions.length > 0) {
          const historicalSessions: ActiveSession[] = trackedSessions.map(tracked => ({
            id: tracked.id,
            user_id: tracked.user_id,
            ip_address: tracked.ip_address || 'IP inconnue',
            user_agent: tracked.user_agent || 'Navigateur inconnu',
            created_at: tracked.created_at,
            updated_at: tracked.updated_at,
            is_current: false
          }))
          sessions.push(...historicalSessions)
        }
      } catch (trackingError) {
        console.warn('Impossible de récupérer l\'historique des sessions (non critique):', trackingError)
      }

      // 3. Nettoyer automatiquement les anciennes entrées (sessions > 30 jours)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .lt('updated_at', thirtyDaysAgo)
        .then(
          () => console.log('Nettoyage automatique des anciennes sessions effectué'),
          (err) => console.warn('Nettoyage automatique échoué:', err)
             )


      return sessions

    } catch (error) {
      console.error('Erreur lors de la récupération des sessions:', error)
      
      // Fallback : retourner au minimum la session courante
      return [{
        id: session?.access_token.substring(0, 16) || 'current',
        user_id: user.id,
        ip_address: 'Session courante',
        user_agent: navigator.userAgent,
        created_at: user.created_at,
        updated_at: new Date().toISOString(),
        is_current: true
      }]
    }
  }

  /**
   * Révocation d'une session spécifique 
   */
  const revokeSession = async (sessionId: string): Promise<void> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    // Vérifier si c'est la session courante
    const currentSessionId = session?.access_token.substring(0, 16)
    if (sessionId === currentSessionId) {
      throw new Error("Vous ne pouvez pas révoquer votre session actuelle depuis cette interface. Utilisez la déconnexion normale.")
    }

    try {

      // 1. Marquer la session comme inactive dans notre table de tracking
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (updateError && updateError.code !== 'PGRST116') { // Ignorer si pas trouvé
        throw updateError
      }

      // 2. AVERTISSEMENT UTILISATEUR : Limitation technique
      console.warn('⚠️ NOTE TECHNIQUE: La révocation complète des sessions JWT Supabase n\'est pas possible côté client')
      
      toast({
        title: "Session marquée comme inactive",
        description: "La session a été marquée comme inactive. Le token JWT restera valide jusqu'à son expiration naturelle.",
        duration: 6000
      })

    } catch (error) {
      console.error('Erreur lors de la révocation de session:', error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la révocation"
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  /**
   * Révocation de toutes les autres sessions 
   */
  const revokeAllOtherSessions = async (): Promise<void> => {
    if (!user || !session) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {

      const currentSessionId = session.access_token.substring(0, 16)

      // Marquer toutes les autres sessions comme inactives
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .neq('id', currentSessionId)

      if (updateError && updateError.code !== 'PGRST116') {
        throw updateError
      }

      // Log pour audit de sécurité
      supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          action_type: 'revoke_all_sessions',
          details: { 
            current_session_id: currentSessionId,
            revoked_at: new Date().toISOString(),
            user_agent: navigator.userAgent
          },
          ip_address: 'client_side',
          success: true
        })
        .then(
           () => console.log('Audit de sécurité enregistré'),
           (err) => console.warn('Erreur audit:', err)
            )

      toast({
        title: "Sessions marquées comme inactives",
        description: "Toutes vos autres sessions ont été marquées comme inactives. Pour une sécurité maximale, changez également votre mot de passe.",
        duration: 8000
      })

    } catch (error) {
      console.error('Erreur lors de la révocation des sessions:', error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la révocation des sessions"
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    }
  }

  // ========================================
  // INITIALISATION COORDONNÉE 
  // ========================================
  
  useEffect(() => {
    const initLogger = createLogger('INITIALIZATION')
    
    initLogger.info('Démarrage de l\'initialisation coordonnée de l\'authentification')
    
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
  // MÉTHODES D'AUTHENTIFICATION AVEC VÉRIFICATION DE SUSPENSION 
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
        },
        // IMPORTANT : Redirection après vérification email
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    signupLogger.success('Compte créé avec succès', { userId: data.user?.id })


    // Vérifier si l'email doit être confirmé
    if (data.user && !data.session) {
      // Email confirmation requise
      signupLogger.info('Confirmation email requise')
      
      toast({
        title: "Vérifiez votre email",
        description: "Un email de confirmation a été envoyé à " + email + ". Cliquez sur le lien pour activer votre compte.",
        duration: 10000 // 10 secondes
      })
    } else if (data.session) {
      // Connexion automatique (confirmation email désactivée)
      signupLogger.info('Inscription avec connexion automatique')
      
      toast({
        title: "Compte créé !",
        description: "Bienvenue sur FasoMarket.",
      })
    }

    // IMPORTANT : Stocker l'état pour afficher le message dans Login.tsx
    sessionStorage.setItem('signup_pending_verification', JSON.stringify({
      email,
      timestamp: Date.now()
    }))

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
    
    throw error
  } finally {
    setLoading(false)
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
        
        // Troisième étape : Initialiser le tracking de session
        setTimeout(() => {
          initializeSessionTracking()
        }, 1000)
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
      // Invalider le cache après mise à jour
      cache.invalidate(cache.profileKey(user.id))
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
  // MÉTHODES DE SÉCURITÉ AVANCÉES 
  // ========================================

  /**
   * Changement de mot de passe avec vérification de l'ancien mot de passe
   */
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {

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

      
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été changé avec succès.",
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du changement de mot de passe"
      console.error('Erreur changement mot de passe:', error)
      
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
 * Configuration initiale de l'authentification multi-facteurs (MFA) - VERSION CORRIGÉE
 */
const setupMFA = async (): Promise<{ qr_code: string; secret: string; backup_codes: string[]; factorId: string }> => {
  if (!user) {
    throw new Error("Aucun utilisateur connecté")
  }

  try {

    // ÉTAPE 1: Debug initial
    await debugMFAState()

    // ÉTAPE 2: Nettoyer les facteurs existants
    
    const { data: existingFactors, error: listError } = await supabase.auth.mfa.listFactors()
    
    if (listError) {
      console.warn('Erreur lors de la vérification des facteurs existants:', listError)
    } else if (existingFactors?.totp && existingFactors.totp.length > 0) {
      
      for (const factor of existingFactors.totp) {
        
        try {
          const { error: unenrollError } = await supabase.auth.mfa.unenroll({
            factorId: factor.id
          })
          
          if (unenrollError) {
            console.warn(`Erreur lors de la suppression du facteur ${factor.id}:`, unenrollError)
          } else {
          }
        } catch (factorError) {
          console.warn(`Exception lors de la suppression du facteur ${factor.id}:`, factorError)
        }
      }
      
      // Délai pour s'assurer que les suppressions sont prises en compte
      await new Promise(resolve => setTimeout(resolve, 1000))
    } else {
    }

    // ÉTAPE 3: Nettoyer les anciens codes de sauvegarde
    try {
      const { error: deleteBackupError } = await supabase
        .from('user_backup_codes')
        .delete()
        .eq('user_id', user.id)

      if (deleteBackupError && deleteBackupError.code !== 'PGRST116') {
        console.warn('Erreur lors de la suppression des anciens codes de sauvegarde:', deleteBackupError)
      } else {
      }
    } catch (backupCleanError) {
      console.warn('Exception lors du nettoyage des codes de sauvegarde:', backupCleanError)
    }

    // ÉTAPE 4: Créer un nouveau facteur TOTP
    
    const { data: factor, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Authenticator-${Date.now()}`
    })

    if (enrollError) {
      console.error('Erreur lors de l\'enrôlement du nouveau facteur:', enrollError)
      throw enrollError
    }

    if (!factor) {
      throw new Error("Aucune donnée de facteur retournée lors de l'enrôlement")
    }


    // ÉTAPE 5: Vérifier immédiatement que le facteur existe
    await debugMFAState()

    // ÉTAPE 6: Générer de nouveaux codes de sauvegarde
    const backupCodes = Array.from({ length: 8 }, () => {
      const part1 = Math.random().toString(36).substring(2, 6).toUpperCase()
      const part2 = Math.random().toString(36).substring(2, 6).toUpperCase()
      return `${part1}-${part2}`
    })

    // ÉTAPE 7: Stocker les nouveaux codes de sauvegarde
    try {
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
        console.error('Erreur lors de la sauvegarde des codes de récupération:', backupError)
      } else {
      }
    } catch (backupSaveError) {
      console.error('Exception lors de la sauvegarde des codes:', backupSaveError)
    }


    return {
      qr_code: factor.totp.qr_code,
      secret: factor.totp.secret,
      backup_codes: backupCodes,
      factorId: factor.id // NOUVEAU: Retourner l'ID du facteur
    }

  } catch (error) {
    console.error('Erreur lors de la configuration MFA:', error)
    
    let errorMessage = "Erreur lors de la configuration 2FA"
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        errorMessage = "Un facteur d'authentification existe déjà. Veuillez réessayer dans quelques instants."
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Trop de tentatives. Veuillez patienter avant de réessayer."
      } else if (error.message.includes('network')) {
        errorMessage = "Problème de connexion. Vérifiez votre connexion internet."
      } else {
        errorMessage = error.message
      }
    }
    
    toast({
      title: "Erreur 2FA",
      description: errorMessage,
      variant: "destructive"
    })
    throw error
  }
}

 /**
 * Fonction de diagnostic pour débugger les problèmes MFA
 */
const debugMFAState = async (): Promise<void> => {
  if (!user) {
    return
  }

  try {
    
    const { data: factors, error } = await supabase.auth.mfa.listFactors()
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des facteurs:', error)
      return
    }
    
    
    // Analyser factors.all
    if (factors?.all) {
      factors.all.forEach((factor, index) => {
      })
    } else {
    }
    
    // Analyser factors.totp
    if (factors?.totp) {
      factors.totp.forEach((factor, index) => {
      })
    } else {
    }
    
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}




/**
 * Vérification du code TOTP pour finaliser l'activation MFA - VERSION CORRIGÉE
 */
const verifyMFA = async (code: string): Promise<BackupCode[]> => {
  if (!user) {
    throw new Error("Aucun utilisateur connecté")
  }

  try {

    // Récupérer les facteurs en attente de vérification
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    
    if (factorsError || !factors) {
      throw factorsError || new Error("Erreur lors de la récupération des facteurs MFA")
    }


    // Chercher dans tous les facteurs, pas seulement TOTP
    let totpFactor = null

    // Option 1: Chercher dans factors.totp d'abord
    if (factors.totp && factors.totp.length > 0) {
      totpFactor = factors.totp.find(factor => factor.status === 'unverified') || factors.totp[0]
    }

    // Option 2: Si pas trouvé, chercher dans factors.all pour les facteurs TOTP
    if (!totpFactor && factors.all && factors.all.length > 0) {
      
      // Filtrer les facteurs de type TOTP dans factors.all
      const allTotpFactors = factors.all.filter(factor => 
        factor.factor_type === 'totp' || 
        factor.factor_type === 'totp' ||
        factor.friendly_name?.includes('Authenticator')
      )
      
      
      if (allTotpFactors.length > 0) {
        // Prendre le facteur non vérifié ou le plus récent
        totpFactor = allTotpFactors.find(factor => factor.status === 'unverified') || 
                     allTotpFactors.sort((a, b) => 
                       new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                     )[0]
      }
    }
    
    if (!totpFactor) {
      console.error('Aucun facteur TOTP trouvé nulle part')
      throw new Error("Aucun facteur TOTP trouvé. Veuillez recommencer la configuration.")
    }


    // Créer un challenge pour ce facteur
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: totpFactor.id
    })

    if (challengeError || !challenge) {
      console.error('Erreur lors de la création du challenge:', challengeError)
      throw challengeError || new Error("Erreur lors de la création du challenge MFA")
    }


    // Vérifier le code TOTP
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.id,
      code: code
    })

    if (verifyError) {
      console.error('Erreur lors de la vérification:', verifyError)
      
      // Messages d'erreur plus spécifiques
      if (verifyError.message.includes('invalid_code') || verifyError.message.includes('expired')) {
        throw new Error("Code invalide ou expiré. Veuillez saisir le code actuel de votre application.")
      } else if (verifyError.message.includes('too_many_requests')) {
        throw new Error("Trop de tentatives. Veuillez patienter quelques minutes.")
      } else {
        throw verifyError
      }
    }


    // Récupérer les codes de sauvegarde
    const { data: backupCodesData, error: backupCodesError } = await supabase
      .from('user_backup_codes')
      .select('code, used')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const backupCodes: BackupCode[] = backupCodesData || []

    
    toast({
      title: "2FA activé",
      description: "L'authentification à deux facteurs a été activée avec succès.",
    })

    return backupCodes

  } catch (error) {
    console.error('Erreur lors de la vérification MFA:', error)
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

      
      toast({
        title: "2FA désactivé",
        description: "L'authentification à deux facteurs a été désactivée.",
      })

    } catch (error) {
      console.error('Erreur lors de la désactivation MFA:', error)
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
      console.error('Erreur lors de la récupération du statut MFA:', error)
      return { enabled: false, factors: [] }
    }
  }

  /**
   * Fonction utilitaire pour nettoyer complètement la configuration MFA
   * Utile pour résoudre les états incohérents
   */
  const cleanupAllMFA = async (): Promise<void> => {
    if (!user) {
      throw new Error("Aucun utilisateur connecté")
    }

    try {
      
      // 1. Supprimer tous les facteurs MFA
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
      
      if (!listError && factors?.totp) {
        for (const factor of factors.totp) {
          try {
            await supabase.auth.mfa.unenroll({ factorId: factor.id })
          } catch (error) {
            console.warn(`Erreur suppression facteur ${factor.id}:`, error)
          }
        }
      }
      
      // 2. Supprimer tous les codes de sauvegarde
      await supabase
        .from('user_backup_codes')
        .delete()
        .eq('user_id', user.id)
      
      
      toast({
        title: "Nettoyage effectué",
        description: "La configuration 2FA a été nettoyée. Vous pouvez maintenant reconfigurer.",
      })
      
    } catch (error) {
      console.error('Erreur lors du nettoyage MFA:', error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du nettoyage"
      
      toast({
        title: "Erreur de nettoyage",
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
    profile: memoizedProfile,
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
    debugMFAState,
    cleanupAllMFA,
    getActiveSessions,
    revokeSession,
    revokeAllOtherSessions,
  };
}