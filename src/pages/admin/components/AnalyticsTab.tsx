// pages/admin/components/AnalyticsTab.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Package, Activity, Target, Calendar } from "lucide-react";
import { DashboardStats, WeeklyData } from '@/hooks/useAdminStats';

interface AnalyticsTabProps {
  dashboardStats: DashboardStats | null;
  weeklyData: WeeklyData[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  dashboardStats,
  weeklyData
}) => {
  const [timeRange, setTimeRange] = useState("7d");
  const [metricType, setMetricType] = useState("overview");

  // Données simulées pour différentes métriques
  const revenueData = [
    { name: 'Jan', revenue: 35000, target: 40000, users: 1200, conversion: 8.2 },
    { name: 'Fév', revenue: 42000, target: 40000, users: 1350, conversion: 9.1 },
    { name: 'Mar', revenue: 38000, target: 45000, users: 1180, conversion: 7.8 },
    { name: 'Avr', revenue: 51000, target: 45000, users: 1520, conversion: 10.3 },
    { name: 'Mai', revenue: 48000, target: 50000, users: 1430, conversion: 9.7 },
    { name: 'Jun', revenue: 56000, target: 50000, users: 1680, conversion: 11.2 }
  ];

  const userEngagementData = [
    { name: 'Lun', sessions: 342, pageViews: 2156, duration: 8.5 },
    { name: 'Mar', sessions: 398, pageViews: 2434, duration: 9.2 },
    { name: 'Mer', sessions: 376, pageViews: 2298, duration: 8.8 },
    { name: 'Jeu', sessions: 425, pageViews: 2687, duration: 10.1 },
    { name: 'Ven', sessions: 468, pageViews: 2945, duration: 10.8 },
    { name: 'Sam', sessions: 521, pageViews: 3234, duration: 11.2 },
    { name: 'Dim', sessions: 387, pageViews: 2456, duration: 9.3 }
  ];

  const categoryPerformance = [
    { name: 'Électronique', listings: 245, revenue: 18500, avgPrice: 75000, growth: 12.5 },
    { name: 'Véhicules', listings: 189, revenue: 42000, avgPrice: 2100000, growth: 8.3 },
    { name: 'Immobilier', listings: 156, revenue: 31200, avgPrice: 15000000, growth: 15.2 },
    { name: 'Mode', listings: 298, revenue: 8900, avgPrice: 25000, growth: -2.1 },
    { name: 'Maison', listings: 134, revenue: 6700, avgPrice: 45000, growth: 5.8 }
  ];

  const conversionFunnelData = [
    { step: 'Visiteurs', count: 12500, rate: 100 },
    { step: 'Vues annonces', count: 8750, rate: 70 },
    { step: 'Contacts', count: 2625, rate: 21 },
    { step: 'Négociations', count: 1312, rate: 10.5 },
    { step: 'Ventes', count: 525, rate: 4.2 }
  ];

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA';
  };

  const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <div className="flex items-center space-x-1 mt-1">
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500">vs période précédente</span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${color.includes('green') ? 'bg-green-50' : 
            color.includes('blue') ? 'bg-blue-50' : 
            color.includes('purple') ? 'bg-purple-50' : 'bg-orange-50'}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header et contrôles */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Analytics & Métriques Avancées</h2>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Vue d'ensemble</SelectItem>
              <SelectItem value="revenue">Revenus</SelectItem>
              <SelectItem value="users">Utilisateurs</SelectItem>
              <SelectItem value="listings">Annonces</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter rapport
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Taux de conversion"
          value={`${dashboardStats?.conversionRate?.toFixed(1) || 0}%`}
          change={2.3}
          icon={Target}
          color="text-green-600"
        />
        <MetricCard
          title="Revenus mensuels"
          value={formatCurrency(dashboardStats?.monthlyRevenue || 0)}
          change={8.5}
          icon={DollarSign}
          color="text-blue-600"
        />
        <MetricCard
          title="Utilisateurs actifs"
          value={dashboardStats?.dailyActiveUsers || 0}
          change={-1.2}
          icon={Users}
          color="text-purple-600"
        />
        <MetricCard
          title="Satisfaction"
          value={`${dashboardStats?.averageRating || 0}/5`}
          change={4.1}
          icon={Activity}
          color="text-orange-600"
        />
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des revenus */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des revenus</CardTitle>
            <CardDescription>Revenus vs objectifs sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                <Legend />
                <Area type="monotone" dataKey="target" stackId="1" stroke="#e5e7eb" fill="#f3f4f6" name="Objectif" />
                <Area type="monotone" dataKey="revenue" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Revenus réels" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement utilisateurs</CardTitle>
            <CardDescription>Sessions et temps de visite hebdomadaire</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userEngagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sessions" fill="#8884d8" name="Sessions" />
                <Line yAxisId="right" type="monotone" dataKey="duration" stroke="#ff7300" strokeWidth={2} name="Durée (min)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Entonnoir de conversion */}
      <Card>
        <CardHeader>
          <CardTitle>Entonnoir de conversion</CardTitle>
          <CardDescription>Parcours utilisateur de la visite à l'achat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionFunnelData.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{step.step}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold">{step.count.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">{step.rate}%</span>
                  </div>
                </div>
                
                <div className="mt-2 ml-11">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' :
                        index === 3 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${step.rate}%` }}
                    />
                  </div>
                </div>

                {index < conversionFunnelData.length - 1 && (
                  <div className="mt-2 ml-4">
                    <div className="w-0.5 h-4 bg-gray-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par catégorie</CardTitle>
          <CardDescription>Analyse détaillée des secteurs d'activité</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead>Annonces</TableHead>
                <TableHead>Revenus</TableHead>
                <TableHead>Prix moyen</TableHead>
                <TableHead>Croissance</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryPerformance.map((category) => (
                <TableRow key={category.name}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.listings}</TableCell>
                  <TableCell>{formatCurrency(category.revenue)}</TableCell>
                  <TableCell>{formatCurrency(category.avgPrice)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {category.growth > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${category.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {category.growth > 0 ? '+' : ''}{category.growth}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(category.revenue / 500, 100)}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tableau de bord régional */}
      <Card>
        <CardHeader>
          <CardTitle>Performance régionale</CardTitle>
          <CardDescription>Données d'activité par région (temps réel)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Région</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Annonces</TableHead>
                <TableHead>Taux engagement</TableHead>
                <TableHead>Revenus</TableHead>
                <TableHead>Croissance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardStats?.topRegions?.map((region, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell>{region.userCount.toLocaleString()}</TableCell>
                  <TableCell>{region.listingCount.toLocaleString()}</TableCell>
                  <TableCell>
                    {region.listingCount > 0 
                      ? ((region.listingCount / region.userCount) * 100).toFixed(1)
                      : 0
                    }%
                  </TableCell>
                  <TableCell>{formatCurrency(region.userCount * 1500)}</TableCell>
                  <TableCell className={region.growthRate > 0 ? 'text-green-600' : 'text-red-600'}>
                    <div className="flex items-center space-x-1">
                      {region.growthRate > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{region.growthRate > 0 ? '+' : ''}{region.growthRate.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              )) || (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Chargement des données régionales...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Métriques de qualité détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Indicateurs de qualité</CardTitle>
            <CardDescription>Santé de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux d'approbation annonces</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${dashboardStats?.qualityMetrics?.approvedListingsRate || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {dashboardStats?.qualityMetrics?.approvedListingsRate?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Résolution signalements</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${dashboardStats?.qualityMetrics?.reportResolutionRate || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {dashboardStats?.qualityMetrics?.reportResolutionRate?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Utilisateurs vérifiés</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${dashboardStats?.qualityMetrics?.userVerificationRate || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {dashboardStats?.qualityMetrics?.userVerificationRate?.toFixed(1) || 0}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Temps réponse moyen</span>
              <span className="text-sm font-medium text-green-600">
                {dashboardStats?.qualityMetrics?.averageResponseTime?.toFixed(1) || 0}h
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prédictions</CardTitle>
            <CardDescription>Projections basées sur les tendances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Utilisateurs fin du mois</span>
              <span className="text-sm font-bold text-blue-600">
                {dashboardStats ? Math.round(dashboardStats.totalUsers * 1.08) : 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Revenus prévus</span>
              <span className="text-sm font-bold text-green-600">
                {dashboardStats ? formatCurrency(dashboardStats.monthlyRevenue * 1.12) : '0 CFA'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Objectif atteint</span>
              <span className="text-sm font-bold text-purple-600">
                {dashboardStats ? Math.round((dashboardStats.monthlyRevenue / 60000) * 100) : 0}%
              </span>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">Mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;