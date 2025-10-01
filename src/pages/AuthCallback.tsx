// AuthCallback.tsx - VERSION CORRIGÉE
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const AuthCallback = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Vérifier si on vient bien d'une vérification email
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    const accessToken = params.get('access_token')
    
    console.log('AuthCallback - Type:', type)
    console.log('AuthCallback - Has access token:', !!accessToken)
    
    // Ne traiter que si c'est une vraie vérification email (avec token dans l'URL)
    if (!accessToken || type !== 'signup') {
      console.log('Pas une vérification email, redirection immédiate')
      navigate('/', { replace: true })
      return
    }

    if (isProcessing) {
      console.log('Traitement déjà en cours, ignorer')
      return
    }

    setIsProcessing(true)
    
    const handleEmailVerification = async () => {
      try {
        // Échanger le token contre une session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur récupération session:', error)
          toast({
            title: "Erreur de vérification",
            description: "Impossible de vérifier votre email. Veuillez réessayer.",
            variant: "destructive"
          })
          navigate('/login', { replace: true })
          return
        }

        if (data.session) {
          console.log('Email vérifié avec succès')
          
          toast({
            title: "Email vérifié !",
            description: "Votre compte est maintenant actif. Bienvenue sur FasoMarket !",
          })
          
          // Nettoyer le sessionStorage
          sessionStorage.removeItem('signup_pending_verification')
          
          // Rediriger vers l'accueil après un court délai
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 1500)
        }
      } catch (error) {
        console.error('Exception lors de la vérification:', error)
        navigate('/login', { replace: true })
      }
    }

    handleEmailVerification()
  }, [navigate, toast, isProcessing])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Vérification de votre email...</p>
      </div>
    </div>
  )
}

export default AuthCallback