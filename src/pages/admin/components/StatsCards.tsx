// pages/admin/components/StatsCards.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, Package, AlertTriangle, TrendingUp, TrendingDown, 
  Activity, Clock, CheckCircle, Shield, BarChart3
} from "lucide-react";
import { DashboardStats } from '@/hooks/useAdminDashboard';

// Interface 
interface StatsCardsProps {
  dashboardStats: DashboardStats | null;
  sanctionsStats: {
    totalActive: number;
    userSanctions: number;
    listingSanctions: number;
    temporaryCount: number;
    permanentCount: number;
    expiringSoon: number;
    expiredToday: number;
    createdToday: number;
  };
  formatCurrency: (amount: number) => string;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  dashboardStats,
  sanctionsStats,
  formatCurrency
}) => {

  // Hook pour détecter la taille d'écran (mobile-first)
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Configuration des cartes principales 
  const mainStatsConfig = [
    {
      title: "Utilisateurs Totaux",
      value: dashboardStats?.totalUsers?.toLocaleString() || "0",
      change: dashboardStats?.weeklyGrowth?.users || 0,
      changeText: "nouveaux cette semaine",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      changePositive: true,
      description: "Marchands actifs sur la plateforme"
    },
    {
      title: "Annonces Actives", 
      value: dashboardStats?.pendingListings?.toLocaleString() || "0",
      change: dashboardStats?.weeklyGrowth?.listings || 0,
      changeText: "publiées cette semaine",
      icon: Package,
      iconColor: "text-green-600", 
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      changePositive: true,
      description: "Annonces visibles par les clients"
    },
    {
      title: "Signalements",
      value: dashboardStats?.activeReports?.toString() || "0",
      change: dashboardStats?.weeklyGrowth?.reports || 0,
      changeText: "en attente de traitement",
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      changePositive: false,
      description: "Signalements nécessitant intervention"
    },
    {
      title: "Sanctions Actives",
      value: sanctionsStats.totalActive.toString(),
      change: sanctionsStats.expiringSoon,
      changeText: "expirent bientôt",
      icon: Shield,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      changePositive: false,
      description: "Sanctions en cours d'application"
    }
  ];

  // Métriques de performance 
  const performanceMetrics = [
    {
      label: "Taux d'Engagement",
      value: `${dashboardStats?.conversionRate?.toFixed(1) || 0}%`,
      target: 15,
      description: "Utilisateurs qui publient des annonces",
      icon: TrendingUp,
      color: (dashboardStats?.conversionRate || 0) >= 15 ? "text-green-600" : "text-orange-600"
    },
    {
      label: "Note Moyenne",
      value: `${dashboardStats?.averageRating?.toFixed(1) || "N/A"}/5`,
      target: 4,
      description: "Satisfaction générale des utilisateurs",
      icon: CheckCircle,
      color: (dashboardStats?.averageRating || 0) >= 4 ? "text-green-600" : "text-yellow-600"
    },
    {
      label: "Résolution Signalements",
      value: `${dashboardStats?.qualityMetrics?.reportResolutionRate?.toFixed(0) || 0}%`,
      target: 90,
      description: "Efficacité de la modération",
      icon: Activity,
      color: (dashboardStats?.qualityMetrics?.reportResolutionRate || 0) >= 90 ? "text-green-600" : "text-orange-600"
    },
    {
      label: "Temps de Réponse",
      value: `${dashboardStats?.qualityMetrics?.averageResponseTime?.toFixed(1) || "N/A"}h`,
      target: 24,
      description: "Délai moyen de traitement",
      icon: Clock,
      color: (dashboardStats?.qualityMetrics?.averageResponseTime || 0) <= 24 ? "text-green-600" : "text-red-600"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Grille principale des statistiques - Mobile first */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {mainStatsConfig.map((stat, index) => {
          const Icon = stat.icon;
          const isPositiveChange = stat.changePositive ? stat.change > 0 : stat.change < 0;
          const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown;
          const trendColor = isPositiveChange ? "text-green-600" : "text-red-600";

          return (
            <Card key={index} className="border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isMobile ? 'px-3 pt-3' : 'px-4 pt-4'}`}>
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className={`font-medium text-muted-foreground leading-tight ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {stat.title}
                  </CardTitle>
                  {!isMobile && (
                    <p className="text-xs text-muted-foreground/80 truncate">
                      {stat.description}
                    </p>
                  )}
                </div>
                <div className={`rounded-lg bg-muted shrink-0 ${isMobile ? 'p-1.5' : 'p-2'}`}>
                  <Icon className={`text-foreground ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </div>
              </CardHeader>
              
              <CardContent className={isMobile ? 'px-3 pb-3' : 'px-4 pb-4'}>
                <div className="space-y-2">
                  <div className={`font-bold text-foreground ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {stat.value}
                  </div>
                  
                  {/* Informations contextuelles et changements */}
                  <div className="flex items-center justify-between">
                    {stat.change !== 0 ? (
                      <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} ${trendColor}`}>
                        <TrendIcon className={`mr-1 ${isMobile ? 'h-2 w-2' : 'h-3 w-3'}`} />
                        <span>{stat.changePositive ? '+' : ''}{stat.change}</span>
                      </div>
                    ) : (
                      <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                        <Activity className={`mr-1 ${isMobile ? 'h-2 w-2' : 'h-3 w-3'}`} />
                        <span>Temps réel</span>
                      </div>
                    )}
                    
                    <p className={`text-muted-foreground text-right ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {stat.changeText}
                    </p>
                  </div>

                  {/* Barres de progression */}
                  {stat.title === "Utilisateurs Totaux" && dashboardStats && dashboardStats.dailyActiveUsers > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className={`flex justify-between text-muted-foreground mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <span>Actifs quotidiens</span>
                        <span>{dashboardStats.dailyActiveUsers}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-foreground/70 h-1.5 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min((dashboardStats.dailyActiveUsers / dashboardStats.totalUsers) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {stat.title === "Sanctions Actives" && sanctionsStats.totalActive > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-foreground">{sanctionsStats.userSanctions}</div>
                          <div className="text-muted-foreground">Utilisateurs</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-foreground">{sanctionsStats.listingSanctions}</div>
                          <div className="text-muted-foreground">Annonces</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section des métriques de performance - Design adaptatif */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className={`pb-3 ${isMobile ? 'px-3 pt-3' : 'px-4 pt-4'}`}>
          <CardTitle className={`font-semibold text-foreground flex items-center ${isMobile ? 'text-sm' : 'text-base'}`}>
            <BarChart3 className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            Métriques de Performance
          </CardTitle>
          <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Indicateurs calculés en temps réel 
          </p>
        </CardHeader>
        <CardContent className={isMobile ? 'px-3 pb-3' : 'px-4 pb-4'}>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {performanceMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="text-center p-3 rounded-lg bg-background border border-border hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className={`${metric.color} ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  </div>
                  <div className={`font-bold mb-1 ${metric.color} ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {metric.value}
                  </div>
                  <p className={`text-foreground font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {metric.label}
                  </p>
                  {!isMobile && (
                    <p className="text-xs text-muted-foreground mt-1 truncate" title={metric.description}>
                      {metric.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Indicateurs opérationnels */}
          <div className={`mt-4 pt-4 border-t border-border ${isMobile ? 'space-y-2' : ''}`}>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-2`}>
              <div className="rounded border border-border p-2">
                <p className="text-xs text-muted-foreground">Signalements en attente</p>
                <p className="text-sm font-medium">{dashboardStats?.activeReports || 0}</p>
              </div>
              <div className="rounded border border-border p-2">
                <p className="text-xs text-muted-foreground">Croissance utilisateurs</p>
                <p className="text-sm font-medium">+{dashboardStats?.weeklyGrowth?.users || 0}</p>
              </div>
              <div className="rounded border border-border p-2">
                <p className="text-xs text-muted-foreground">Taux conversion</p>
                <p className="text-sm font-medium">{dashboardStats?.conversionRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="rounded border border-border p-2">
                <p className="text-xs text-muted-foreground">Sanctions expirent bientôt</p>
                <p className="text-sm font-medium">{sanctionsStats.expiringSoon}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Focus mobile */}
      {isMobile && (dashboardStats?.activeReports || 0) > 0 && (
        <Card className="border border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Modération en attente</p>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats?.activeReports} signalements en attente de traitement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatsCards;
