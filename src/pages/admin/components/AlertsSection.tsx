// pages/admin/components/AlertsSection.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Package, 
  Shield, 
  Timer, 
  Activity, 
  ChevronRight,
  Users,
  Ban,
  Clock
} from "lucide-react";

// Interface 
interface AlertsSectionProps {
  // Données principales 
  pendingReportsCount: number;
  needsReviewCount: number;
  suspendedUsersCount: number;
  sanctionsExpiringSoon?: number;
  activeSanctionsCount?: number;
  urgentActionsCount?: number;
  
  // Actions fonctionnelles
  onNavigateToReports?: () => void;
  onNavigateToListings?: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToSanctions?: () => void;
  onRefreshData?: () => void;
  
  // État de chargement pour synchronisation
  isLoading?: boolean;
}

const AlertsSection: React.FC<AlertsSectionProps> = ({
  pendingReportsCount,
  needsReviewCount,
  suspendedUsersCount,
  sanctionsExpiringSoon = 0,
  activeSanctionsCount = 0,
  urgentActionsCount = 0,
  onNavigateToReports,
  onNavigateToListings,
  onNavigateToUsers,
  onNavigateToSanctions,
  onRefreshData,
  isLoading = false
}) => {
  
  // Configuration des alertes 
  const alertsConfig = [
    {
      id: 'pending-reports',
      title: 'Signalements',
      count: pendingReportsCount,
      icon: AlertTriangle,
      variant: 'critical' as const,
      action: onNavigateToReports,
      actionLabel: 'Traiter',
      show: pendingReportsCount > 0,
      description: `${pendingReportsCount} signalement${pendingReportsCount > 1 ? 's' : ''} en attente`
    },
    {
      id: 'needs-review',
      title: 'À réviser',
      count: needsReviewCount,
      icon: Package,
      variant: 'warning' as const,
      action: onNavigateToListings,
      actionLabel: 'Réviser',
      show: needsReviewCount > 0,
      description: `${needsReviewCount} annonce${needsReviewCount > 1 ? 's' : ''} à modérer`
    },
    {
      id: 'suspended-users',
      title: 'Suspensions',
      count: suspendedUsersCount,
      icon: Users,
      variant: 'warning' as const,
      action: onNavigateToUsers,
      actionLabel: 'Gérer',
      show: suspendedUsersCount > 0,
      description: `${suspendedUsersCount} utilisateur${suspendedUsersCount > 1 ? 's' : ''} suspendu${suspendedUsersCount > 1 ? 's' : ''}`
    },
    {
      id: 'sanctions-expiring',
      title: 'Sanctions expirent',
      count: sanctionsExpiringSoon,
      icon: Timer,
      variant: 'critical' as const,
      action: onNavigateToSanctions,
      actionLabel: 'Urgent',
      show: sanctionsExpiringSoon > 0,
      description: `${sanctionsExpiringSoon} sanction${sanctionsExpiringSoon > 1 ? 's' : ''} expire${sanctionsExpiringSoon > 1 ? 'nt' : ''} bientôt`
    }
  ];

  // Filtrer les alertes visibles
  const visibleAlerts = alertsConfig.filter(alert => alert.show);
  const totalAlerts = visibleAlerts.reduce((sum, alert) => sum + alert.count, 0);
  
  // Calculer le niveau de criticité global
  const criticalAlertsCount = visibleAlerts.filter(alert => alert.variant === 'critical').length;
  const systemCriticality = criticalAlertsCount > 0 ? 'critical' : 
                           visibleAlerts.length > 2 ? 'warning' : 'normal';

  // Fonction utilitaire pour obtenir les styles selon la variante
  const getAlertStyles = (variant: 'critical' | 'warning') => {
    if (variant === 'critical') {
      return {
        container: 'border-red-200 bg-red-50 hover:bg-red-100',
        icon: 'text-red-600',
        badge: 'bg-red-500 text-white',
        button: 'bg-red-500 hover:bg-red-600 text-white'
      };
    }
    return {
      container: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
      icon: 'text-orange-600',
      badge: 'bg-orange-500 text-white',
      button: 'bg-orange-500 hover:bg-orange-600 text-white'
    };
  };

  // État de système sain - Version mobile-first simplifiée
  if (visibleAlerts.length === 0 && !isLoading) {
    return (
      <div className="w-full mt-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Système opérationnel</h3>
                  <p className="text-sm text-green-600">Aucune action requise</p>
                </div>
              </div>
              
              {/* Info sanctions actives même quand système sain */}
              {activeSanctionsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToSanctions}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {activeSanctionsCount} active{activeSanctionsCount > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interface principale des alertes 
  return (
    <div className="w-full mt-4">
      <Card className={`border-2 ${
        systemCriticality === 'critical' ? 'border-red-300 bg-gradient-to-br from-red-50 to-orange-50' :
        systemCriticality === 'warning' ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50' :
        'border-gray-300 bg-gray-50'
      }`}>
        
        {/* Header avec indicateur de criticité */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                systemCriticality === 'critical' ? 'bg-red-500 animate-pulse' :
                systemCriticality === 'warning' ? 'bg-orange-500' : 'bg-gray-500'
              }`}>
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              
              <div>
                <CardTitle className={`text-lg ${
                  systemCriticality === 'critical' ? 'text-red-800' :
                  systemCriticality === 'warning' ? 'text-orange-800' : 'text-gray-800'
                }`}>
                  Centre d'alertes
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {totalAlerts} élément{totalAlerts > 1 ? 's' : ''} nécessitent une attention
                </p>
              </div>
            </div>

            {/* Badge de criticité */}
            <Badge className={`${
              systemCriticality === 'critical' ? 'bg-red-500 animate-bounce' :
              systemCriticality === 'warning' ? 'bg-orange-500' : 'bg-gray-500'
            } text-white`}>
              {totalAlerts}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            // État de chargement mobile-friendly
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Liste des alertes - Stack vertical mobile-first */}
              <div className="space-y-3 mb-4">
                {visibleAlerts.map((alert) => {
                  const Icon = alert.icon;
                  const styles = getAlertStyles(alert.variant);
                  
                  return (
                    <div
                      key={alert.id}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${styles.container}`}
                    >
                      {/* Indicateur de criticité pour alertes critiques */}
                      {alert.variant === 'critical' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping">
                          <div className="absolute inset-0 w-3 h-3 bg-red-600 rounded-full"></div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {/* Contenu principal */}
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${styles.container}`}>
                            <Icon className={`h-5 w-5 ${styles.icon}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900">{alert.title}</h3>
                              <Badge className={styles.badge}>
                                {alert.count}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{alert.description}</p>
                          </div>
                        </div>

                        {/* Bouton d'action - Fonctionnel et responsive */}
                        <div className="ml-3">
                          <Button
                            size="sm"
                            onClick={alert.action}
                            disabled={!alert.action}
                            className={`${styles.button} min-w-[80px] justify-center`}
                          >
                            <span className="hidden sm:inline mr-2">{alert.actionLabel}</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions globales - Horizontal sur desktop, vertical sur mobile */}
              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {/* Action de rafraîchissement - Toujours disponible */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefreshData}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none"
                  >
                    <Activity className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="sm:inline">Actualiser</span>
                  </Button>

                  {/* Actions contextuelles selon les alertes présentes */}
                  {pendingReportsCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onNavigateToReports}
                      className="flex-1 sm:flex-none text-red-700 border-red-300 hover:bg-red-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalements ({pendingReportsCount})
                    </Button>
                  )}

                  {sanctionsExpiringSoon > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onNavigateToSanctions}
                      className="flex-1 sm:flex-none text-orange-700 border-orange-300 hover:bg-orange-50 animate-pulse"
                    >
                      <Timer className="h-4 w-4 mr-2" />
                      Sanctions urgentes
                    </Button>
                  )}
                </div>

                {/* Résumé statistique compact - Mobile optimisé */}
                {totalAlerts > 0 && (
                  <div className="mt-3 p-3 bg-white/70 rounded-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
                      <div>
                        <div className={`text-lg font-bold ${
                          pendingReportsCount > 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {pendingReportsCount}
                        </div>
                        <div className="text-xs text-gray-600">Signalements</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${
                          needsReviewCount > 0 ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                          {needsReviewCount}
                        </div>
                        <div className="text-xs text-gray-600">À réviser</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${
                          suspendedUsersCount > 0 ? 'text-yellow-600' : 'text-gray-400'
                        }`}>
                          {suspendedUsersCount}
                        </div>
                        <div className="text-xs text-gray-600">Suspensions</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${
                          activeSanctionsCount > 0 ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                          {activeSanctionsCount}
                        </div>
                        <div className="text-xs text-gray-600">Sanctions</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsSection;