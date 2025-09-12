// pages/admin/components/AlertsSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Shield, Clock, Users, Activity, TrendingDown } from "lucide-react";

interface AlertsSectionProps {
  pendingReportsCount: number;
  needsReviewCount: number;
  suspendedUsersCount: number;
}

const AlertsSection: React.FC<AlertsSectionProps> = ({
  pendingReportsCount,
  needsReviewCount,
  suspendedUsersCount
}) => {
  // Configuration des alertes avec leurs niveaux de priorité
  const alerts = [
    {
      id: 'pending-reports',
      title: 'Signalements en attente',
      description: 'Signalements non traités nécessitant une attention immédiate',
      count: pendingReportsCount,
      icon: AlertTriangle,
      priority: 'high',
      color: 'border-red-200 bg-red-50',
      iconColor: 'text-red-600',
      badgeVariant: 'destructive' as const,
      show: pendingReportsCount > 0,
      threshold: { warning: 3, critical: 10 },
      action: 'Traiter les signalements'
    },
    {
      id: 'needs-review',
      title: 'Annonces à réviser',
      description: 'Nouvelles annonces en attente de modération',
      count: needsReviewCount,
      icon: Package,
      priority: 'medium',
      color: 'border-orange-200 bg-orange-50',
      iconColor: 'text-orange-600',
      badgeVariant: 'secondary' as const,
      show: needsReviewCount > 0,
      threshold: { warning: 5, critical: 20 },
      action: 'Réviser les annonces'
    },
    {
      id: 'suspended-users',
      title: 'Utilisateurs suspendus',
      description: 'Comptes actuellement suspendus nécessitant un suivi',
      count: suspendedUsersCount,
      icon: Shield,
      priority: 'medium',
      color: 'border-yellow-200 bg-yellow-50',
      iconColor: 'text-yellow-600',
      badgeVariant: 'secondary' as const,
      show: suspendedUsersCount > 0,
      threshold: { warning: 2, critical: 8 },
      action: 'Gérer les suspensions'
    }
  ];

  // Alertes système simulées (vous pourriez les récupérer depuis une API)
  const systemAlerts = [
    {
      id: 'performance',
      title: 'Performance dégradée détectée',
      description: 'Temps de réponse API supérieur à la normale',
      severity: 'warning',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      resolved: false,
      icon: TrendingDown
    },
    {
      id: 'high-traffic',
      title: 'Pic de trafic inhabituel',
      description: '300% d\'augmentation des connexions simultanées',
      severity: 'info',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      resolved: true,
      icon: TrendingDown
    }
  ];

  const getAlertUrgency = (alert: typeof alerts[0]) => {
    if (alert.count >= alert.threshold.critical) return 'Critique';
    if (alert.count >= alert.threshold.warning) return 'Attention';
    return 'Normal';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critique': return 'text-red-600';
      case 'Attention': return 'text-orange-600';
      default: return 'text-green-600';
    }
  };

  const visibleAlerts = alerts.filter(alert => alert.show);

  // Si aucune alerte n'est visible, ne pas afficher la section
  if (visibleAlerts.length === 0 && systemAlerts.filter(a => !a.resolved).length === 0) {
    return null;
  }

  return (
    <Card className="mt-6 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 animate-pulse" />
          Centre d'alertes - Actions requises
          <Badge variant="destructive" className="ml-2">
            {visibleAlerts.reduce((sum, alert) => sum + alert.count, 0)}
          </Badge>
        </CardTitle>
        <p className="text-sm text-orange-700">
          Éléments nécessitant une attention administrative immédiate
        </p>
      </CardHeader>
      <CardContent>
        {/* Alertes de contenu */}
        {visibleAlerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {visibleAlerts.map((alert) => {
              const Icon = alert.icon;
              const urgency = getAlertUrgency(alert);
              const urgencyColor = getUrgencyColor(urgency);
              
              return (
                <div key={alert.id} className={`relative p-4 bg-white rounded-lg border-2 ${alert.color} hover:shadow-md transition-shadow`}>
                  {/* Indicateur d'urgence critique */}
                  {urgency === 'Critique' && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      <div className="absolute top-0 w-3 h-3 bg-red-600 rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${alert.color}`}>
                        <Icon className={`h-5 w-5 ${alert.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{alert.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        
                        {/* Niveau d'urgence */}
                        <div className="flex items-center justify-between mt-3">
                          <span className={`text-xs font-medium ${urgencyColor}`}>
                            {urgency}
                          </span>
                          <Badge variant={alert.badgeVariant}>
                            {alert.count} {alert.count > 1 ? 'éléments' : 'élément'}
                          </Badge>
                        </div>
                        
                        {/* Barre de progression basée sur les seuils */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full transition-all duration-300 ${
                                urgency === 'Critique' ? 'bg-red-500' :
                                urgency === 'Attention' ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((alert.count / alert.threshold.critical) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Bouton d'action */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-3 w-full text-xs"
                        >
                          {alert.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Alertes système */}
        {systemAlerts.filter(a => !a.resolved).length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Alertes système
            </h4>
            <div className="space-y-2">
              {systemAlerts
                .filter(alert => !alert.resolved)
                .map((alert) => {
                  const Icon = alert.icon;
                  const timeAgo = Math.floor((Date.now() - alert.timestamp.getTime()) / (1000 * 60));
                  
                  return (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-4 w-4 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'warning' ? 'text-orange-600' : 'text-blue-600'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-500">{alert.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'warning' ? 'secondary' : 'default'
                        }>
                          {alert.severity}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Il y a {timeAgo}min
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Statistiques d'alertes */}
        <div className="mt-4 p-3 bg-white/50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-red-600">{pendingReportsCount}</div>
              <div className="text-xs text-gray-600">Signalements</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{needsReviewCount}</div>
              <div className="text-xs text-gray-600">Révisions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">{suspendedUsersCount}</div>
              <div className="text-xs text-gray-600">Suspensions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {systemAlerts.filter(a => a.resolved).length}
              </div>
              <div className="text-xs text-gray-600">Résolues</div>
            </div>
          </div>
        </div>

        {/* Actions globales */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Button size="sm" variant="outline">
            Traiter toutes les alertes
          </Button>
          <Button size="sm" variant="outline">
            Exporter le rapport d'alertes
          </Button>
          <Button size="sm" variant="outline">
            Configuration des seuils
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsSection;