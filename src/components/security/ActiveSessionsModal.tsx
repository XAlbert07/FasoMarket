// ActiveSessionsModal.tsx - VERSION RÉELLE avec intégration Supabase
// Cette version utilise les vraies méthodes de gestion des sessions du hook useAuth étendu

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertCircle, Shield, Smartphone, Monitor, MapPin, 
  LogOut, Trash2, AlertTriangle, RefreshCw, Wifi 
} from "lucide-react";

// Import du hook d'authentification étendu
import { useAuthContext } from "@/contexts/AuthContext";

interface ActiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Interface étendue pour les sessions avec informations dérivées
interface ExtendedActiveSession {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
  is_current: boolean;
  // Informations dérivées du user_agent
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  location_estimate?: string;
}

export const ActiveSessionsModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  onError 
}: ActiveSessionsModalProps) => {
  
  // Utilisation du hook d'authentification étendu
  const { getActiveSessions, revokeSession, revokeAllOtherSessions } = useAuthContext();
  
  const [sessions, setSessions] = useState<ExtendedActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  // Charger les sessions lors de l'ouverture de la modal
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  // Fonction pour parser le User-Agent et extraire des informations
  const parseUserAgent = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    
    // Détection du type d'appareil
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (ua.includes('mobile')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    }
    
    // Détection du navigateur
    let browser = 'Inconnu';
    if (ua.includes('chrome') && !ua.includes('edg')) {
      browser = 'Chrome';
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
    } else if (ua.includes('edg')) {
      browser = 'Edge';
    } else if (ua.includes('opera')) {
      browser = 'Opera';
    }
    
    // Détection du système d'exploitation
    let os = 'Inconnu';
    if (ua.includes('windows nt')) {
      os = 'Windows';
    } else if (ua.includes('mac os x')) {
      os = 'macOS';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
    }
    
    return { deviceType, browser, os };
  };

  // Fonction pour estimer la localisation basée sur l'IP (simulation)
  const estimateLocation = (ipAddress: string): string => {
    // En production, vous pourriez utiliser un service de géolocalisation IP
    // Ici nous simulons avec des données locales pour le Burkina Faso
    if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      return 'Réseau local (Ouagadougou, BF)';
    }
    
    // Simulation basée sur les plages d'IP burkinabè connues
    if (ipAddress.startsWith('41.78.')) {
      return 'Bobo-Dioulasso, Hauts-Bassins, BF';
    } else if (ipAddress.startsWith('196.28.')) {
      return 'Koudougou, Centre-Ouest, BF';
    } else if (ipAddress.startsWith('154.72.')) {
      return 'Ouahigouya, Nord, BF';
    }
    
    return 'Burkina Faso';
  };

  // FONCTION PRINCIPALE - Chargement des sessions réelles
  const loadSessions = async () => {
    setIsLoading(true);
    setLocalError("");

    try {
      console.log('📋 Chargement des sessions actives...');
      
      // Appel à la vraie méthode du hook
      const rawSessions = await getActiveSessions();
      
      // Enrichissement des données de session
      const enrichedSessions: ExtendedActiveSession[] = rawSessions.map(session => {
        const { deviceType, browser, os } = parseUserAgent(session.user_agent);
        const location_estimate = estimateLocation(session.ip_address);
        
        return {
          ...session,
          device_type: deviceType,
          browser,
          os,
          location_estimate,
          is_current: session.is_current || false
        };
      });
      
      setSessions(enrichedSessions);
      console.log(`✅ ${enrichedSessions.length} sessions chargées`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des sessions";
      console.error('❌ Erreur lors du chargement des sessions:', error);
      setLocalError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour actualiser les sessions
  const handleRefreshSessions = async () => {
    setIsRefreshing(true);
    await loadSessions();
    setIsRefreshing(false);
  };

  // FONCTION RÉELLE - Terminer une session spécifique
  const handleTerminateSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    
    if (session?.is_current) {
      setLocalError("Vous ne pouvez pas terminer votre session actuelle");
      return;
    }

    setLoadingSessionId(sessionId);
    setLocalError("");

    try {
      console.log('🗑️ Terminaison de la session:', sessionId);
      
      // Appel à la vraie méthode du hook
      await revokeSession(sessionId);
      
      // Mettre à jour la liste locale
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (onSuccess) {
        onSuccess();
      }
      
      console.log('✅ Session terminée avec succès');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la déconnexion";
      setLocalError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoadingSessionId(null);
    }
  };

  // FONCTION RÉELLE - Terminer toutes les autres sessions
  const handleTerminateAllOthers = async () => {
    const otherSessionsCount = sessions.filter(s => !s.is_current).length;
    
    if (otherSessionsCount === 0) {
      setLocalError("Aucune autre session à déconnecter");
      return;
    }

    setIsLoading(true);
    setLocalError("");

    try {
      console.log('🧹 Terminaison de toutes les autres sessions...');
      
      // Appel à la vraie méthode du hook
      await revokeAllOtherSessions();
      
      // Mettre à jour la liste locale pour ne garder que la session courante
      setSessions(prev => prev.filter(s => s.is_current));
      
      if (onSuccess) {
        onSuccess();
      }
      
      console.log('✅ Toutes les autres sessions terminées');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la déconnexion des sessions";
      setLocalError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques
  const otherSessionsCount = sessions.filter(s => !s.is_current).length;
  const insecureSessionsCount = sessions.filter(s => 
    !s.ip_address.startsWith('https') && // Simulation de détection HTTPS
    !s.is_current
  ).length;

  // Fonction pour obtenir l'icône appropriée selon le type d'appareil
  const getDeviceIcon = (deviceType: 'mobile' | 'tablet' | 'desktop') => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Smartphone className="h-4 w-4" />; // Vous pouvez ajouter une icône spécifique pour tablette
      case 'desktop':
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  // Fonction pour obtenir le badge de statut d'une session
  const getSessionBadge = (session: ExtendedActiveSession) => {
    if (session.is_current) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Wifi className="h-3 w-3 mr-1" />
          Session actuelle
        </Badge>
      );
    }
    
    // Simulation de détection de connexion non sécurisée
    const isOldSession = new Date(session.updated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (isOldSession) {
      return (
        <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Ancienne
        </Badge>
      );
    }
    
    return null;
  };

  // Fonction pour formater la date de dernière activité
  const formatLastActivity = (updatedAt: string): string => {
    const now = new Date();
    const sessionDate = new Date(updatedAt);
    const diffInMinutes = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Maintenant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    return sessionDate.toLocaleDateString('fr-FR');
  };

  // Composant pour afficher une session individuelle
  const renderSessionItem = (session: ExtendedActiveSession) => (
    <div 
      key={session.id} 
      className={`flex items-center justify-between p-4 border rounded-lg ${
        session.is_current ? 'border-primary/20 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-full ${
          session.is_current ? 'bg-primary/10' : 'bg-muted'
        }`}>
          {getDeviceIcon(session.device_type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">
              {session.browser} sur {session.os}
            </h4>
            {getSessionBadge(session)}
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{session.location_estimate}</span>
            </div>
            
            <div>
              IP: {session.ip_address} • {formatLastActivity(session.updated_at)}
            </div>
          </div>
        </div>
      </div>

      {!session.is_current && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleTerminateSession(session.id)}
          disabled={isLoading || loadingSessionId === session.id}
          className="ml-4 flex-shrink-0"
        >
          {loadingSessionId === session.id ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
              <span className="sr-only">Déconnexion...</span>
            </div>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnecter
            </>
          )}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Sessions actives
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshSessions}
              disabled={isRefreshing}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Gérez les appareils et navigateurs connectés à votre compte. 
            Déconnectez les sessions suspectes pour sécuriser votre compte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {localError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}

          {/* Statistiques rapides */}
          <div className="flex gap-4 p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>{sessions.length} session{sessions.length > 1 ? 's' : ''} active{sessions.length > 1 ? 's' : ''}</span>
            </div>
            {otherSessionsCount > 0 && (
              <div className="flex items-center gap-2 text-blue-600">
                <Shield className="h-4 w-4" />
                <span>{otherSessionsCount} autre{otherSessionsCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* État de chargement */}
          {isLoading && sessions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Chargement des sessions...</span>
              </div>
            </div>
          ) : (
            // Liste des sessions
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.length > 0 ? (
                sessions.map(renderSessionItem)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune session active trouvée</p>
                </div>
              )}
            </div>
          )}

          {/* Conseils de sécurité */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Conseil de sécurité :</strong> Vérifiez régulièrement vos sessions actives. 
              Si vous voyez une session que vous ne reconnaissez pas, déconnectez-la immédiatement 
              et changez votre mot de passe.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Fermer
          </Button>
          
          <div className="flex gap-2">
            {otherSessionsCount > 0 && (
              <Button
                variant="destructive"
                onClick={handleTerminateAllOthers}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Déconnexion...
                  </div>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Déconnecter toutes les autres ({otherSessionsCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};