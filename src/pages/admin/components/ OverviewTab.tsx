// pages/admin/components/OverviewTab.tsx
// Onglet vue d'ensemble avec graphiques d'activité et actions rapides

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from "recharts";
import { 
  AlertTriangle, Package, Users, BarChart3, Activity, 
  TrendingUp, Star, Shield, Clock, Target
} from "lucide-react";
import { DashboardStats, WeeklyData, CategoryData } from '@/hooks/useAdminStats';

interface OverviewTabProps {
  weeklyData: WeeklyData[];
  categoryData: CategoryData[];
  dashboardStats: DashboardStats | null;
  pendingReportsCount: number;
  needsReviewCount: number;
  onTabChange: (tab: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  weeklyData,
  categoryData,
  dashboardStats,
  pendingReportsCount,
  needsReviewCount,
  onTabChange
}) => {
  // Configuration des couleurs pour les graphiques
  const chartColors = {
    users: "#8884d8",
    listings: "#82ca9d", 
    reports: "#ffc658",
    revenue: "#ff7300"
  };

  // Données pour le graphique de progression mensuelle
  const monthlyProgressData = [
    { name: 'Sem 1', users: 245, listings: 89, objective: 300 },
    { name: 'Sem 2', users: 312, listings: 127, objective: 350 },
    { name: 'Sem 3', users: 398, listings: 156, objective: 400 },
    { name: 'Sem 4', users: 467, listings: 198, objective: 450 }
  ];

  // Calcul des métriques de croissance
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Configuration des actions rapides avec données dynamiques
  const quickActions = [
    {
      title: "Signalements urgents",
      description: "Traiter les signalements en attente",
      count: pendingReportsCount,
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600 border-red-200",
      hoverColor: "hover:bg-red-100",
      action: () => onTabChange("reports"),
      priority: "high",
      urgency: pendingReportsCount > 5 ? "Attention immédiate requise" : "Niveau normal"
    },
    {
      title: "Annonces à réviser",
      description: "Modérer les nouvelles annonces",
      count: needsReviewCount,
      icon: Package,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      hoverColor: "hover:bg-blue-100", 
      action: () => onTabChange("listings"),
      priority: "medium",
      urgency: needsReviewCount > 10 ? "Volume élevé" : "Volume normal"
    },
    {
      title: "Nouveaux utilisateurs",
      description: "Vérifier les inscriptions récentes",
      count: dashboardStats?.weeklyGrowth?.users || 0,
      icon: Users,
      color: "bg-green-50 text-green-600 border-green-200",
      hoverColor: "hover:bg-green-100",
      action: () => onTabChange("users"), 
      priority: "low",
      urgency: "Croissance positive"
    },
    {
      title: "Rapport quotidien",
      description: "Consulter les analytics détaillées",
      count: null,
      icon: BarChart3,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      hoverColor: "hover:bg-purple-100",
      action: () => onTabChange("analytics"),
      priority: "info",
      urgency: "Données actualisées"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Métriques de performance en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Croissance utilisateurs</p>
                <p className="text-2xl font-bold text-green-600">
                  +{dashboardStats?.weeklyGrowth?.users || 0}
                </p>
                <p className="text-xs text-gray-500">7 derniers jours</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux d'engagement</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardStats?.conversionRate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500">Annonces → Interactions</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Temps de réponse</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardStats?.qualityMetrics?.averageResponseTime?.toFixed(1) || 0}h
                </p>
                <p className="text-xs text-gray-500">Support & modération</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Objectif mensuel</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardStats ? Math.round((dashboardStats.totalListings / 500) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500">500 annonces cible</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique d'activité hebdomadaire */}
        <Card>
          <CardHeader>
            <CardTitle>Activité de la semaine</CardTitle>
            <CardDescription>
              Évolution des utilisateurs, annonces et signalements sur 7 jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData && weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke={chartColors.users}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Nouveaux utilisateurs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="listings" 
                    stroke={chartColors.listings}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Nouvelles annonces"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reports" 
                    stroke={chartColors.reports}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Signalements"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chargement des données d'activité...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition par catégories */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégories</CardTitle>
            <CardDescription>
              Distribution des annonces actives par secteur d'activité
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} annonces`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chargement des données de catégories...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphique de progression mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle>Progression vers les objectifs</CardTitle>
          <CardDescription>
            Suivi de la croissance hebdomadaire et des objectifs mensuels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="objective" 
                stackId="1" 
                stroke="#e5e7eb" 
                fill="#f3f4f6" 
                name="Objectif"
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stackId="2" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
                name="Utilisateurs"
              />
              <Area 
                type="monotone" 
                dataKey="listings" 
                stackId="3" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
                name="Annonces"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Actions rapides avec données dynamiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Actions rapides et priorités
          </CardTitle>
          <CardDescription>
            Tâches nécessitant attention immédiate avec indicateurs de priorité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const isUrgent = action.priority === "high" && action.count > 5;
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-start text-left relative ${action.color} ${action.hoverColor} transition-all duration-200 hover:shadow-md`}
                  onClick={action.action}
                >
                  {/* Indicateur d'urgence */}
                  {isUrgent && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between w-full mb-2">
                    <Icon className="h-6 w-6" />
                    {action.count !== null && (
                      <Badge 
                        variant={action.priority === "high" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {action.count > 99 ? "99+" : action.count}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    <p className="text-xs opacity-80">{action.description}</p>
                    <p className="text-xs font-medium">{action.urgency}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tableau de bord des KPIs en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Santé de la plateforme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Disponibilité</span>
              <span className="text-sm font-bold text-green-600">99.8%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Performance</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1">
                  <div className="w-5/6 h-1 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">Bon</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Sécurité</span>
              <span className="text-sm font-bold text-green-600">Optimal</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Sessions actives</span>
              <span className="text-sm font-bold">{dashboardStats?.dailyActiveUsers || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Durée moyenne</span>
              <span className="text-sm font-bold">8.5 min</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Taux de rebond</span>
              <span className="text-sm font-bold text-orange-600">23%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modération</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Files d'attente</span>
              <span className="text-sm font-bold">{needsReviewCount + pendingReportsCount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Temps moyen</span>
              <span className="text-sm font-bold">
                {dashboardStats?.qualityMetrics?.averageResponseTime?.toFixed(1) || 0}h
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Efficacité</span>
              <span className="text-sm font-bold text-green-600">
                {dashboardStats?.qualityMetrics?.reportResolutionRate?.toFixed(0) || 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;