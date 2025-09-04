// useAuth.ts - Version corrigée pour FasoMarket
// Cette version assigne automatiquement le rôle "merchant" à tous les nouveaux utilisateurs

import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  // Correction importante : le rôle ne peut être que 'merchant' ou 'admin'
  // Plus de rôle 'user' pour éviter les conflits avec la base de données
  role: 'merchant' | 'admin'
  created_at: string
  updated_at: string
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

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Récupération de la session initiale
    // Cette fonction s'exécute au chargement de l'application pour vérifier
    // si l'utilisateur est déjà connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // Si une session existe, nous récupérons le profil de l'utilisateur
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Écoute des changements d'état d'authentification
    // Cette fonction se déclenche chaque fois que l'utilisateur se connecte ou se déconnecte
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

  const fetchProfile = async (userId: string) => {
    try {
      // Récupération du profil utilisateur depuis la table profiles
      // Cette fonction est cruciale car elle synchronise les données d'authentification
      // avec les informations de profil stockées dans notre base de données
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        // En cas d'erreur, nous continuons sans profil plutôt que de bloquer l'application
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
      
      // Première étape : Création du compte d'authentification avec Supabase Auth
      // Les données dans 'options.data' sont stockées dans les métadonnées du profil auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            role: 'merchant' // Nous stockons aussi le rôle dans les métadonnées pour cohérence
          }
        }
      })

      if (error) {
        console.error('❌ Erreur lors de la création du compte d\'authentification:', error)
        throw error
      }

      console.log('✅ Compte d\'authentification créé avec succès')

      // Deuxième étape : Création du profil dans notre table personnalisée
      // Cette étape est critique car c'est ici que nous définissons le rôle métier de l'utilisateur
      if (data.user) {
        console.log('👤 Création du profil marchand dans la base de données...')
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id, // Utilisation du même ID que le compte auth pour la liaison
            email: data.user.email!,
            full_name: fullName,
            phone: phone || null,
            // CORRECTION PRINCIPALE : Tous les nouveaux utilisateurs deviennent des marchands
            // Cela élimine l'erreur 500 causée par le rôle 'user' inexistant
            role: 'merchant'
          })

        if (profileError) {
          console.error('❌ Erreur lors de la création du profil marchand:', profileError)
          // Important : Nous ne lançons pas d'erreur ici car le compte auth existe déjà
          // L'utilisateur peut se connecter et un admin peut corriger le profil manuellement
          // Cette approche évite de laisser l'utilisateur dans un état incohérent
        } else {
          console.log('✅ Profil marchand créé avec succès')
        }
      }

      // Message de succès adapté au nouveau modèle métier
      toast({
        title: "Compte marchand créé !",
        description: "Veuillez vérifier votre email pour confirmer votre compte. Vous pourrez ensuite acheter et vendre sur FasoMarket.",
      })
    } catch (error) {
      const authError = error as AuthError
      console.error('💥 Erreur complète lors de la création du compte:', error)
      
      // Gestion d'erreur améliorée avec des messages plus spécifiques
      let errorMessage = authError.message
      if (authError.message.includes('already registered')) {
        errorMessage = "Cette adresse email est déjà utilisée. Essayez de vous connecter ou utilisez une autre adresse."
      } else if (authError.message.includes('password')) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères."
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
      console.log('🔐 Tentative de connexion pour:', email)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log('✅ Connexion réussie')
      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur FasoMarket.",
      })
    } catch (error) {
      const authError = error as AuthError
      console.error('❌ Erreur de connexion:', error)
      
      // Messages d'erreur localisés et plus clairs
      let errorMessage = authError.message
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = "Email ou mot de passe incorrect. Veuillez vérifier vos informations."
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
      console.log('👋 Déconnexion en cours...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      console.log('✅ Déconnexion réussie')
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès. À bientôt sur FasoMarket !",
      })
    } catch (error) {
      const authError = error as AuthError
      console.error('❌ Erreur lors de la déconnexion:', error)
      toast({
        title: "Erreur",
        description: authError.message,
        variant: "destructive"
      })
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      console.warn('⚠️ Tentative de mise à jour de profil sans utilisateur connecté')
      return
    }

    try {
      console.log('📝 Mise à jour du profil pour l\'utilisateur:', user.id)
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(), // Horodatage de la mise à jour
        })
        .eq('id', user.id)

      if (error) throw error

      // Mise à jour locale du state pour une meilleure réactivité de l'interface
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      console.log('✅ Profil mis à jour avec succès')
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      })
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

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