// pages/admin/components/HealthIndicators.tsx
// Version mobile-first épurée synchronisée avec useAdminDashboard

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Shield,
  Users,
  Package,
  Zap,
  Wifi
} from "lucide-react";

// Interface simplifiée focalisée sur les données essentielles
interface HealthIndicatorsProps {
  // Données principales du dashboard
  dashboardStats: any;
  isDataFresh: boolean;
  totalElements: number;
  isLoading: boolean;
  
  // Nouvelles propriétés du hook centralisé
  diagnostics?: {
    dataFreshness: Record<string, number | null>;
    systemHealth: {
      hasErrors: boolean;
      errorCount: number;
      loadingCount: number;
      totalSections: number;
    };
    performance: {
      lastGlobalRefresh: string | null;
      refreshAge: number | null;
      cacheEfficiency: number;
    };
  };
  cacheEfficiency?: number;
  lastGlobalRefresh?: string | null;
  errors?: string[];
}

const HealthIndicators: React.FC<HealthIndicatorsProps> = ({
  dashboardStats,
  isDataFresh,
  totalElements,
  isLoading,
  diagnostics,
  cacheEfficiency = 0,
  lastGlobalRefresh,
  errors = []
}) => {
  
  // Calcul intelligent de la santé système basé sur les vraies données
  const calculateSystemHealth = () => {
    if (!dashboardStats) return { status: 'loading', score: 0, level: 'unknown' };
    
    let healthScore = 100;
    let criticalIssues = 0;
    let warnings = 0;
    
    // Facteurs de santé basés sur les vraies métriques
    const activeReports = dashboardStats.activeReports || 0;
    const averageRating = dashboardStats.averageRating || 0;
    const resolutionRate = dashboardStats.qualityMetrics?.reportResolutionRate || 100;
    const approvalRate = dashboardStats.qualityMetrics?.approvedListingsRate || 100;
    
    // Pénalités basées sur les problèmes réels
    if (activeReports > 10) {
      healthScore -= 20;
      criticalIssues++;
    } else if (activeReports > 5) {
      healthScore -= 10;
      warnings++;
    }
    
    if (averageRating < 3.0) {
      healthScore -= 25;
      criticalIssues++;
    } else if (averageRating < 4.0) {
      healthScore -= 10;
      warnings++;
    }
    
    if (resolutionRate < 70) {
      healthScore -= 15;
      warnings++;
    }
    
    if (approvalRate < 50) {
      healthScore -= 15;
      warnings++;
    }
    
    // Pénalités techniques
    if (errors.length > 0) {
      healthScore -= errors.length * 10;
      criticalIssues += errors.length;
    }
    
    if (cacheEfficiency < 50) {
      healthScore -= 10;
      warnings++;
    }
    
    if (!isDataFresh) {
      healthScore -= 5;
      warnings++;
    }
    
    // Détermination du niveau de santé
    let level: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    let status = 'Système opérationnel';
    
    if (criticalIssues > 0 || healthScore < 60) {
      level = 'critical';
      status = 'Intervention requise';
    } else if (warnings > 1 || healthScore < 80) {
      level = 'warning';
      status = 'Surveillance nécessaire';
    } else if (healthScore < 95) {
      level = 'good';
      status = 'Fonctionnement normal';
    }
    
    return {
      score: Math.max(0, Math.round(healthScore)),
      level,
      status,
      criticalIssues,
      warnings,
      recommendations: generateRecommendations(activeReports, averageRating, resolutionRate, errors.length)
    };
  };
  
  // Génération de recommandations contextuelles
  const generateRecommendations = (reports: number, rating: number, resolution: number, errorCount: number) => {
    const recommendations = [];
    
    if (reports > 10) {
      recommendations.push('Traiter les signalements en attente en priorité');
    }
    if (rating < 4.0) {
      recommendations.push('Améliorer la qualité des annonces et des services');
    }
    if (resolution < 80) {
      recommendations.push('Accélérer le processus de modération');
    }
    if (errorCount > 0) {
      recommendations.push('Résoudre les erreurs système détectées');
    }
    
    return recommendations;
  };
  
  const systemHealth = calculateSystemHealth();
  
  // Configuration des styles selon le niveau de santé
  const getHealthStyles = (level: string) => {
    switch (level) {
      case 'excellent':
        return {
          bg: 'from-green-50 to-emerald-50',
          border: 'border-green-300',
          text: 'text-green-800',
          badge: 'bg-green-500',
          icon: 'text-green-600'
        };
      case 'good':
        return {
          bg: 'from-blue-50 to-cyan-50',
          border: 'border-blue-300',
          text: 'text-blue-800',
          badge: 'bg-blue-500',
          icon: 'text-blue-600'
        };
      case 'warning':
        return {
          bg: 'from-yellow-50 to-orange-50',
          border: 'border-yellow-300',
          text: 'text-yellow-800',
          badge: 'bg-yellow-500',
          icon: 'text-yellow-600'
        };
      case 'critical':
        return {
          bg: 'from-red-50 to-pink-50',
          border: 'border-red-300',
          text: 'text-red-800',
          badge: 'bg-red-500',
          icon: 'text-red-600'
        };
      default:
        return {
          bg: 'from-gray-50 to-slate-50',
          border: 'border-gray-300',
          text: 'text-gray-800',
          badge: 'bg-gray-500',
          icon: 'text-gray-600'
        };
    }
  };
  
  const healthStyles = getHealthStyles(systemHealth.level);
  
  // Métriques principales pour affichage mobile
  const keyMetrics = [
    {
      label: 'Santé globale',
      value: `${systemHealth.score}%`,
      icon: systemHealth.level === 'excellent' ? CheckCircle : 
            systemHealth.level === 'critical' ? AlertCircle : Activity,
      color: healthStyles.icon,
      description: systemHealth.status
    },
    {
      label: 'Satisfaction',
      value: `${(dashboardStats?.averageRating || 0).toFixed(1)}/5`,
      icon: TrendingUp,
      color: (dashboardStats?.averageRating || 0) >= 4.5 ? 'text-green-600' :
             (dashboardStats?.averageRating || 0) >= 4.0 ? 'text-blue-600' : 'text-orange-600',
      description: (dashboardStats?.averageRating || 0) >= 4.5 ? 'Excellent' : 
                  (dashboardStats?.averageRating || 0) >= 4.0 ? 'Très bon' : 'À améliorer'
    },
    {
      label: 'Modération',
      value: `${(dashboardStats?.qualityMetrics?.reportResolutionRate || 0).toFixed(0)}%`,
      icon: Shield,
      color: (dashboardStats?.qualityMetrics?.reportResolutionRate || 0) >= 85 ? 'text-green-600' : 
             (dashboardStats?.qualityMetrics?.reportResolutionRate || 0) >= 70 ? 'text-orange-600' : 'text-red-600',
      description: 'Taux de résolution'
    },
    {
      label: 'Activité',
      value: `${dashboardStats?.dailyActiveUsers || 0}`,
      icon: Users,
      color: 'text-purple-600',
      description: 'Utilisateurs actifs/jour'
    }
  ];
  
  return (
    <div className="space-y-4 mt-6">
      {/* Carte principale de santé - Mobile-first */}
      <Card className={`bg-gradient-to-r ${healthStyles.bg} border-2 ${healthStyles.border}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full bg-white/80 flex items-center justify-center ${
                systemHealth.level === 'critical' ? 'animate-pulse' : ''
              }`}>
                {systemHealth.level === 'excellent' ? (
                  <CheckCircle className={`h-6 w-6 ${healthStyles.icon}`} />
                ) : systemHealth.level === 'critical' ? (
                  <AlertCircle className={`h-6 w-6 ${healthStyles.icon}`} />
                ) : (
                  <Activity className={`h-6 w-6 ${healthStyles.icon}`} />
                )}
              </div>
              
              <div>
                <CardTitle className={`text-lg ${healthStyles.text}`}>
                  Santé de la plateforme
                </CardTitle>
                <CardDescription className={`${healthStyles.text} opacity-80`}>
                  {systemHealth.status}
                </CardDescription>
              </div>
            </div>
            
            {/* Score de santé proéminent */}
            <div className="text-right">
              <div className={`text-2xl font-bold ${healthStyles.text}`}>
                {systemHealth.score}%
              </div>
              <Badge className={`${healthStyles.badge} text-white text-xs`}>
                {systemHealth.level}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Recommandations si nécessaire - Mobile optimisé */}
          {systemHealth.recommendations.length > 0 && (
            <div className="mb-4 p-3 bg-white/60 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Recommandations</h4>
              <ul className="space-y-1">
                {systemHealth.recommendations.map((rec, index) => (
                  <li key={index} className="text-xs text-gray-700 flex items-start space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Métriques clés - Grille mobile-first */}
          <div className="grid grid-cols-2 gap-3">
            {keyMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="bg-white/60 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                    <span className={`text-lg font-bold ${metric.color}`}>
                      {metric.value}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{metric.label}</p>
                    <p className="text-xs text-gray-600">{metric.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Statistiques système détaillées - Version compacte mobile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Métriques système
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Performance et disponibilité */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-800">Performance</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Cache</span>
                    <span className={`text-xs font-medium ${
                      cacheEfficiency >= 80 ? 'text-green-600' : 
                      cacheEfficiency >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {cacheEfficiency.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Synchronisation</span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        isDataFresh ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <span className="text-xs">{isDataFresh ? 'OK' : 'En cours'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-800">Données</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Éléments</span>
                    <span className="text-xs font-medium text-blue-600">
                      {totalElements.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Erreurs</span>
                    <span className={`text-xs font-medium ${
                      errors.length === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {errors.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Métriques d'engagement */}
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Engagement</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {dashboardStats?.qualityMetrics?.approvedListingsRate?.toFixed(0) || 0}%
                  </div>
                  <p className="text-xs text-gray-600">Approbation</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {dashboardStats?.conversionRate?.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-gray-600">Conversion</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    +{dashboardStats?.weeklyGrowth?.users || 0}
                  </div>
                  <p className="text-xs text-gray-600">Croissance/sem</p>
                </div>
              </div>
            </div>
            
            {/* Barre de statut consolidée - Mobile friendly */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Wifi className={`h-3 w-3 ${isDataFresh ? 'text-green-500' : 'text-gray-400'}`} />
                    <span>{isDataFresh ? 'Connecté' : 'Sync...'}</span>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3 animate-spin text-blue-500" />
                      <span>Chargement...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>
                    {lastGlobalRefresh ? 
                      new Date(lastGlobalRefresh).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) 
                      : 'Jamais'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Alertes système si erreurs détectées */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 mb-1">Problèmes détectés</h4>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthIndicators;