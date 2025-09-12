// pages/admin/components/StatsCards.tsx
// Composant pour afficher les cartes de statistiques principales du dashboard

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, AlertTriangle, DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { DashboardStats } from '@/hooks/useAdminStats';

interface StatsCardsProps {
  dashboardStats: DashboardStats | null;
  formatCurrency: (amount: number) => string;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  dashboardStats,
  formatCurrency
}) => {
  // Configuration des cartes avec leurs icônes et couleurs
  const statsConfig = [
    {
      title: "Utilisateurs Actifs",
      value: dashboardStats?.totalUsers?.toLocaleString() || "0",
      change: dashboardStats?.weeklyGrowth?.users || 0,
      changeText: "cette semaine",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      changePositive: true
    },
    {
      title: "Annonces Totales", 
      value: dashboardStats?.totalListings?.toLocaleString() || "0",
      change: dashboardStats?.pendingListings || 0,
      changeText: "en attente de révision",
      icon: Package,
      iconColor: "text-green-600", 
      bgColor: "bg-green-50",
      changePositive: true
    },
    {
      title: "Signalements Actifs",
      value: dashboardStats?.activeReports || 0,
      change: dashboardStats?.weeklyGrowth?.reports || 0,
      changeText: "nouveaux cette semaine",
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      changePositive: false
    },
    {
      title: "Revenus Mensuels",
      value: dashboardStats ? formatCurrency(dashboardStats.monthlyRevenue) : "0 CFA",
      change: 8.5, // Pourcentage de croissance simulé
      changeText: "vs mois dernier",
      icon: DollarSign,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50", 
      changePositive: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        const isPositiveChange = stat.changePositive ? stat.change > 0 : stat.change < 0;
        const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown;
        const trendColor = isPositiveChange ? "text-green-600" : "text-red-600";

        return (
          <Card 
            key={index}
            className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            {/* Indicateur coloré en haut de carte pour les urgences */}
            {stat.title === "Signalements Actifs" && dashboardStats && dashboardStats.activeReports > 5 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
            )}
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                
                <div className="flex items-center space-x-2">
                  {stat.change !== 0 && (
                    <div className={`flex items-center text-xs ${trendColor}`}>
                      <TrendIcon className="h-3 w-3 mr-1" />
                      {stat.changePositive ? '+' : ''}{stat.change}
                      {stat.title === "Revenus Mensuels" ? '%' : ''}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    {stat.changeText}
                  </p>
                </div>

                {/* Barre de progression pour les métriques de performance */}
                {stat.title === "Utilisateurs Actifs" && dashboardStats && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Activité quotidienne</span>
                      <span>{dashboardStats.dailyActiveUsers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min((dashboardStats.dailyActiveUsers / dashboardStats.totalUsers) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Indicateur de qualité pour les annonces */}
                {stat.title === "Annonces Totales" && dashboardStats && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Taux d'approbation</span>
                      <span>{dashboardStats.qualityMetrics?.approvedListingsRate?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${dashboardStats.qualityMetrics?.approvedListingsRate || 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Indicateur d'urgence pour les signalements */}
                {stat.title === "Signalements Actifs" && dashboardStats && dashboardStats.activeReports > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-600 font-medium">
                        {dashboardStats.activeReports > 10 ? 'Attention élevée requise' : 
                         dashboardStats.activeReports > 5 ? 'Révision nécessaire' : 
                         'Niveau normal'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Projection de revenus */}
                {stat.title === "Revenus Mensuels" && dashboardStats && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Objectif mensuel</span>
                      <span>{formatCurrency(60000)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-purple-500 h-1 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min((dashboardStats.monthlyRevenue / 60000) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Carte bonus pour les métriques de conversion */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Métriques de performance rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {dashboardStats?.conversionRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-gray-500">Taux de conversion</p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {dashboardStats?.averageRating || 0}/5
              </div>
              <p className="text-xs text-gray-500">Note moyenne</p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {dashboardStats?.qualityMetrics?.averageResponseTime?.toFixed(1) || 0}h
              </div>
              <p className="text-xs text-gray-500">Temps de réponse</p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {dashboardStats?.qualityMetrics?.reportResolutionRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-gray-500">Résolution signalements</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;