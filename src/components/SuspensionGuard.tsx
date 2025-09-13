// components/SuspensionGuard.tsx
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Ban, Clock } from 'lucide-react'

interface SuspensionInfo {
  canAccess: boolean
  reason?: string
  message?: string
  suspendedUntil?: Date
  isBanned?: boolean
}

export const SuspensionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuthContext()
  const [suspensionInfo, setSuspensionInfo] = useState<SuspensionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const checkSuspension = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('suspended_until, suspension_reason, is_banned, ban_reason')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Erreur vérification suspension:', error)
          setLoading(false)
          return
        }

        const now = new Date()
        
        // Vérifier le bannissement permanent
        if (profile.is_banned) {
          setSuspensionInfo({
            canAccess: false,
            reason: 'banned',
            message: profile.ban_reason || 'Votre compte a été banni définitivement.',
            isBanned: true
          })
          setLoading(false)
          return
        }

        // Vérifier la suspension temporaire
        if (profile.suspended_until) {
          const suspensionEnd = new Date(profile.suspended_until)
          if (now < suspensionEnd) {
            setSuspensionInfo({
              canAccess: false,
              reason: 'suspended',
              message: profile.suspension_reason || 'Votre compte est temporairement suspendu.',
              suspendedUntil: suspensionEnd
            })
            setLoading(false)
            return
          } else {
            // La suspension a expiré, nettoyer les données
            await supabase
              .from('profiles')
              .update({
                suspended_until: null,
                suspension_reason: null
              })
              .eq('id', user.id)
          }
        }

        setSuspensionInfo({ canAccess: true })
      } catch (error) {
        console.error('Erreur lors de la vérification:', error)
        setSuspensionInfo({ canAccess: true }) // En cas d'erreur, laisser passer
      }
      
      setLoading(false)
    }

    checkSuspension()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du statut du compte...</p>
        </div>
      </div>
    )
  }

  if (suspensionInfo && !suspensionInfo.canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            {suspensionInfo.isBanned ? (
              <>
                <Ban className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  Compte banni
                </h2>
                <p className="text-gray-700 mb-6">
                  {suspensionInfo.message}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Ce bannissement est définitif. Pour contester cette décision, 
                  contactez notre support client.
                </p>
              </>
            ) : (
              <>
                <Clock className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-orange-600 mb-4">
                  Compte suspendu
                </h2>
                <p className="text-gray-700 mb-4">
                  {suspensionInfo.message}
                </p>
                {suspensionInfo.suspendedUntil && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-orange-800">
                      Fin de la suspension:
                    </p>
                    <p className="text-lg font-bold text-orange-900">
                      {suspensionInfo.suspendedUntil.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={signOut}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                Se déconnecter
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/support'}
              >
                Contacter le support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}