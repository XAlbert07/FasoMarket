import { useState, useEffect, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// ========================================
// INTERFACES ET TYPES (avec ajouts pour suspension)
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
  // Nouveaux champs pour la gestion des suspensions
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

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

// ========================================
// SYSTÈME DE LOGGING AMÉLIORÉ (inchangé)
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
// HOOK PRINCIPAL AVEC VÉRIFICATION DE SUSPENSION
// ========================================

export const useAuth = (): AuthContextType => {
  const logger = createLogger('AUTH_HOOK')
  
  // États de base (inchangés)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Système anti-collision pour la récupération de profil (inchangé)
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
  // NOUVELLE FONCTION : VÉRIFICATION DE SUSPENSION
  // ========================================
  
  const checkUserSuspension = async (userId: string): Promise<SuspensionCheckResult> => {
    const suspensionLogger = createLogger('SUSPENSION_CHECK')
    
    try {
      suspensionLogger.info('Vérification du statut de suspension', { userId })
      
      // Récupération des informations de suspension depuis la base de données
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('suspended_until, suspension_reason, is_banned, ban_reason')
        .eq('id', userId)
        .single()
      
      if (error) {
        suspensionLogger.error('Erreur lors de la vérification de suspension', error)
        // En cas d'erreur, on autorise l'accès par défaut (principe de moindre frustration)
        return { canAccess: true }
      }
      
      const now = new Date()
      
      // Vérification du bannissement permanent (priorité la plus haute)
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
        
        suspensionLogger.debug('Suspension temporaire trouvée', {
          userId,
          suspensionEnd: suspensionEnd.toISOString(),
          currentTime: now.toISOString(),
          isStillSuspended: now < suspensionEnd
        })
        
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
      // En cas d'exception, on autorise l'accès par défaut
      return { canAccess: true }
    }
  }

  // Surveillance des changements d'état avec diagnostic intelligent (inchangé)
  useEffect(() => {
    const stateSnapshot = {
      hasUser: !!user,
      userEmail: user?.email || 'N/A',
      hasProfile: !!profile,
      profileRole: profile?.role || 'N/A',
      hasSession: !!session,
      loading,
      timestamp: new Date().toISOString()
    }
    
    logger.debug('État de l\'authentification mis à jour', stateSnapshot)
    
    // Diagnostics intelligents pour détecter les états problématiques
    if (loading && user && !profile && !profileFetchRef.current.isActive) {
      logger.warning('Utilisateur connecté sans profil et sans récupération en cours - possible problème')
    }
    
    if (!loading && user && !profile) {
      logger.error('État final incohérent: utilisateur sans profil après chargement')
    }
    
  }, [user, profile, session, loading])

  // ========================================
  // FONCTION DE RÉCUPÉRATION DE PROFIL ANTI-COLLISION (mise à jour)
  // ========================================
  
  const fetchProfile = async (userId: string, source: string = 'unknown') => {
    const profileLogger = createLogger('FETCH_PROFILE')
    
    // Vérification anti-collision : si une récupération est déjà en cours pour le même utilisateur
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
      
      // Configuration du timeout avec signal d'annulation
      const timeoutId = setTimeout(() => {
        profileLogger.warning('Timeout de 12 secondes atteint - annulation de la requête')
        abortController.abort()
      }, 12000)

      // Requête avec possibilité d'annulation - MISE À JOUR : ajout des champs de suspension
      const { data, error } = await supabase
        .from('profiles')
        .select('*, suspended_until, suspension_reason, is_banned, ban_reason')
        .eq('id', userId)
        .abortSignal(abortController.signal)
        .single()

      // Nettoyage du timeout si la requête aboutit avant
      clearTimeout(timeoutId)

      // Vérification que la requête n'a pas été annulée
      if (abortController.signal.aborted) {
        profileLogger.info('Récupération annulée (timeout ou nouvelle requête)')
        return
      }

      // Traitement intelligent des résultats
      if (error) {
        profileLogger.error('Erreur Supabase lors de la récupération', {
          code: error.code,
          message: error.message
        })
        
        // Gestion spécialisée selon le type d'erreur
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
          profileLogger.success('Profil par défaut appliqué')
          
          // Tentative de sauvegarde asynchrone (non-bloquante)
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
        // Succès : validation et application des données
        profileLogger.success('Données de profil reçues avec succès')
        profileLogger.debug('Contenu du profil', {
          id: data.id,
          email: data.email,
          role: data.role,
          hasName: !!data.full_name,
          // Ajout du debug pour les champs de suspension
          isBanned: data.is_banned,
          suspendedUntil: data.suspended_until
        })
        
        // Validation des données critiques
        if (!data.id || !data.email) {
          profileLogger.warning('Profil incomplet reçu - application malgré tout')
        }
        
        setProfile(data)
        profileLogger.success('Profil mis à jour dans l\'état React')
      }
      
    } catch (exception) {
      // Gestion intelligente des exceptions (inchangée)
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
      // Libération du verrou uniquement si cette requête est toujours active
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
  // INITIALISATION COORDONNÉE SANS COLLISION (inchangée)
  // ========================================
  
  useEffect(() => {
    const initLogger = createLogger('INITIALIZATION')
    
    initLogger.info('🚀 Démarrage de l\'initialisation coordonnée de l\'authentification')
    
    // Variable de contrôle pour éviter les états de course
    let initializationCompleted = false
    
    // Étape 1: Vérification de session existante
    initLogger.info('Étape 1: Vérification de session persistante')
    
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
        
        // Mise à jour immédiate des états
        setSession(session)
        setUser(session.user)
        
        // Calcul du temps de validité restant
        const timeUntilExpiry = (session.expires_at * 1000) - Date.now()
        const minutesLeft = Math.floor(timeUntilExpiry / (1000 * 60))
        
        if (minutesLeft <= 0) {
          initLogger.warning('Session trouvée mais expirée')
          setLoading(false)
        } else {
          initLogger.info(`Session valide pendant encore ${minutesLeft} minutes`)
          
          // Déclenchement unique de la récupération de profil
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
    
    // Étape 2: Configuration de l'écouteur d'événements (sans collision)
    initLogger.info('Étape 2: Configuration de l\'écouteur d\'événements')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const eventLogger = createLogger(`AUTH_EVENT_${event}`)
      
      eventLogger.info(`Événement d'authentification: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id || 'N/A'
      })
      
      // Mise à jour systématique des états de base
      setSession(session)
      setUser(session?.user ?? null)
      
      // Traitement intelligent selon l'événement
      switch (event) {
        case 'SIGNED_IN':
          eventLogger.success('Nouvelle connexion détectée')
          if (session?.user) {
            // Léger délai pour laisser l'initialisation se terminer
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
          
          // Annulation de toute récupération en cours
          if (profileFetchRef.current.isActive) {
            profileFetchRef.current.abortController?.abort()
          }
          break
          
        case 'TOKEN_REFRESHED':
          eventLogger.info('Token rafraîchi automatiquement')
          
          // Récupération de profil uniquement s'il est manquant
          if (session?.user && !profile && !profileFetchRef.current.isActive) {
            eventLogger.info('Profil manquant après rafraîchissement - récupération')
            fetchProfile(session.user.id, 'TOKEN_REFRESH')
          }
          break
          
        case 'INITIAL_SESSION':
          // Cet événement est maintenant géré uniquement si l'initialisation principale a échoué
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

    initLogger.success('Écouteur d\'événements configuré')
    
    // Fonction de nettoyage
    return () => {
      initLogger.info('Nettoyage: arrêt de l\'écouteur et annulation des requêtes')
      subscription.unsubscribe()
      
      // Annulation de toute récupération de profil en cours
      if (profileFetchRef.current.isActive) {
        profileFetchRef.current.abortController?.abort()
      }
    }
  }, []) // Dépendances vides = exécution unique au montage

  // ========================================
  // MÉTHODES D'AUTHENTIFICATION AVEC VÉRIFICATION DE SUSPENSION
  // ========================================

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const signupLogger = createLogger('SIGNUP')
    
    try {
      setLoading(true)
      signupLogger.info('Création de compte marchand', { email, fullName })
      
      // Validations côté client
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

      // Création du profil (non-bloquante) - MISE À JOUR : ajout des champs de suspension
      if (data.user) {
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          phone: phone || null,
          role: 'merchant' as const,
          // Nouveaux champs initialisés à des valeurs sûres
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

  // ========================================
  // FONCTION SIGNIN MODIFIÉE AVEC VÉRIFICATION DE SUSPENSION
  // ========================================
  
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

      // Deuxième étape : vérification immédiate du statut de suspension
      if (data.user) {
        signinLogger.info('Vérification du statut de suspension avant finalisation de la connexion')
        
        const suspensionCheck = await checkUserSuspension(data.user.id)
        
        if (!suspensionCheck.canAccess) {
          signinLogger.warning('Accès refusé pour cause de suspension/bannissement', {
            userId: data.user.id,
            reason: suspensionCheck.reason,
            message: suspensionCheck.message
          })
          
          // Déconnexion immédiate et forcée de l'utilisateur suspendu/banni
          await supabase.auth.signOut()
          signinLogger.info('Déconnexion forcée effectuée')
          
          // Remise à zéro des états pour éviter tout état inconsistant
          setUser(null)
          setProfile(null)
          setSession(null)
          setLoading(false)
          
          // Affichage d'un message d'erreur personnalisé selon le type de sanction
          toast({
            title: suspensionCheck.reason === 'banned' ? "Compte banni" : "Compte suspendu",
            description: suspensionCheck.message,
            variant: "destructive"
          })
          
          // Lancement d'une erreur avec le message personnalisé pour interrompre le processus
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
      
      // Gestion spécialisée des messages d'erreur
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = "Email ou mot de passe incorrect."
      } else if (authError.message.includes('suspendu') || authError.message.includes('banni')) {
        // Pour les erreurs de suspension/bannissement, on garde le message original
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
  // RETOUR DE L'INTERFACE (inchangé)
  // ========================================

  const returnLogger = createLogger('AUTH_HOOK_RETURN')
  returnLogger.debug('Retour des valeurs du hook', {
    hasUser: !!user,
    hasProfile: !!profile,
    hasSession: !!session,
    loading,
    profileFetchActive: profileFetchRef.current.isActive
  })

  return {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }
}