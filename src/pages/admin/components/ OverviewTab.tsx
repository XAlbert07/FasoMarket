// pages/admin/components/OverviewTab.tsx
// Version complète adaptative mobile-responsive
// CONSERVE: Toutes les données et fonctionnalités existantes
// AJOUTE: Adaptation mobile intelligente avec composants spécialisés

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { 
  AlertTriangle, Package, Users, TrendingUp, TrendingDown,
  Activity, Clock, CheckCircle, Eye, MessageSquare, Shield,
  Search, Zap, BarChart3, AlertCircle, ThermometerSun,
  ChevronRight, Menu, Maximize2
} from "lucide-react";
import { DashboardStats, WeeklyData, CategoryData } from '@/hooks/useAdminDashboard';

// =================== HOOKS ET UTILITAIRES ===================

/**
 * Hook personnalisé pour une détection responsive intelligente
 * Contrairement aux media queries CSS, ce hook nous donne un contrôle précis
 * sur les transitions entre différents modes d'affichage
 */
const useResponsiveBreakpoint = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    // Vérification initiale et écouteur pour les changements de taille
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return { 
    isMobile, 
    isTablet, 
    isDesktop: !isMobile && !isTablet,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
};

// =================== INTERFACES (CONSERVÉES) ===================

interface OverviewTabProps {
  // Propriétés existantes préservées intégralement
  weeklyData: WeeklyData[];
  categoryData: CategoryData[];
  dashboardStats: DashboardStats | null;
  pendingReportsCount: number;
  needsReviewCount: number;
  onTabChange: (tab: string) => void;
  
  // Nouvelles propriétés du hook centralisé (conservées)
  crossStats: {
    totalElements: number;
    healthScore: number;
    urgentActions: number;
    moderationWorkload: number;
    platformGrowth: number;
    engagementHealth: number;
  };
  platformHealth: string;
  globalSearch: (term: string) => {
    users: any[];
    listings: any[];
    reports: any[];
    sanctions: any[];
  };
}

// =================== COMPOSANTS MOBILES SPÉCIALISÉS ===================

/**
 * Composant mobile pour affichage critique des alertes
 * Transforme les indicateurs complexes en signal visuel immédiat
 */
const MobileAlertSummary: React.FC<{
  urgentActions: number;
  healthScore: number;
  moderationWorkload: number;
  onActionClick: (tab: string) => void;
}> = ({ urgentActions, healthScore, moderationWorkload, onActionClick }) => {
  
  // Logique de calcul de santé identique à l'original
  const getAlertStatus = () => {
    if (urgentActions > 5 || healthScore < 30) {
      return { 
        level: 'critical', 
        color: 'bg-red-500', 
        borderColor: 'border-l-red-500',
        bgColor: 'bg-red-50',
        text: 'CRITIQUE',
        message: `${urgentActions} actions critiques`
      };
    } else if (urgentActions > 2 || moderationWorkload > 20 || healthScore < 60) {
      return { 
        level: 'warning', 
        color: 'bg-orange-500', 
        borderColor: 'border-l-orange-500',
        bgColor: 'bg-orange-50',
        text: 'ATTENTION',
        message: `${moderationWorkload} tâches en cours`
      };
    } else if (healthScore > 80 && urgentActions === 0) {
      return { 
        level: 'excellent', 
        color: 'bg-green-500', 
        borderColor: 'border-l-green-500',
        bgColor: 'bg-green-50',
        text: 'EXCELLENT',
        message: 'Performance optimale'
      };
    } else {
      return { 
        level: 'good', 
        color: 'bg-blue-500', 
        borderColor: 'border-l-blue-500',
        bgColor: 'bg-blue-50',
        text: 'NORMAL',
        message: 'Fonctionnement normal'
      };
    }
  };

  const alert = getAlertStatus();

  return (
    <Card className={`border-l-4 ${alert.borderColor} ${alert.bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${alert.color} ${alert.level === 'critical' ? 'animate-pulse' : ''}`}></div>
            <div>
              <h3 className="font-bold text-sm">{alert.text}</h3>
              <p className="text-xs text-gray-600">{alert.message}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{healthScore}</div>
            <div className="text-xs text-gray-500">Score/100</div>
          </div>
        </div>
        
        {/* Barre de progression de santé mobile */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                healthScore >= 80 ? 'bg-green-500' :
                healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthScore}%` }}
            ></div>
          </div>
        </div>
        
        {urgentActions > 0 && (
          <Button 
            onClick={() => onActionClick('reports')}
            className="w-full mt-3 h-8 text-xs"
            variant={urgentActions > 5 ? "destructive" : "default"}
          >
            Traiter maintenant <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Composant mobile pour les métriques essentielles
 * Sélectionne les 4 métriques les plus critiques dans un format tactile optimisé
 */
const MobileEssentialMetrics: React.FC<{
  crossStats: any;
  dashboardStats: DashboardStats | null;
  onTabChange: (tab: string) => void;
}> = ({ crossStats, dashboardStats, onTabChange }) => {
  
  // Métriques prioritaires avec logique de couleur préservée
  const metrics = [
    {
      label: "Croissance",
      value: `+${crossStats.platformGrowth}`,
      subtitle: "cette semaine",
      color: "text-green-600",
      bgColor: crossStats.platformGrowth > 10 ? "bg-green-50" : "bg-gray-50",
      icon: TrendingUp,
      action: () => onTabChange("users"),
      clickable: crossStats.platformGrowth > 0
    },
    {
      label: "Engagement",
      value: `${crossStats.engagementHealth}%`,
      subtitle: "moyen pondéré",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      icon: Activity,
      action: null,
      clickable: false
    },
    {
      label: "Modération",
      value: crossStats.moderationWorkload.toString(),
      subtitle: "tâches",
      color: crossStats.moderationWorkload > 20 ? "text-orange-600" : "text-gray-600",
      bgColor: crossStats.moderationWorkload > 20 ? "bg-orange-50" : "bg-gray-50",
      icon: Package,
      action: () => onTabChange("listings"),
      clickable: crossStats.moderationWorkload > 0
    },
    {
      label: "Résolution",
      value: `${dashboardStats?.qualityMetrics?.reportResolutionRate?.toFixed(0) || 0}%`,
      subtitle: "signalements",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      icon: CheckCircle,
      action: null,
      clickable: false
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const CardComponent = metric.clickable && metric.action ? Button : 'div';
        const cardProps = metric.clickable && metric.action ? {
          variant: "ghost" as const,
          onClick: metric.action,
          className: `h-auto p-3 ${metric.bgColor} border hover:shadow-md transition-all duration-200`
        } : {
          className: `p-3 ${metric.bgColor} border rounded-lg`
        };

        return (
          <CardComponent key={index} {...cardProps}>
            <div className="flex items-center space-x-2 text-left w-full">
              <Icon className={`h-4 w-4 ${metric.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className={`text-lg font-bold ${metric.color} truncate`}>
                  {metric.value}
                </div>
                <div className="text-xs text-gray-600">{metric.label}</div>
                <div className="text-xs text-gray-400">{metric.subtitle}</div>
              </div>
              {metric.clickable && <ChevronRight className="h-3 w-3 text-gray-400" />}
            </div>
          </CardComponent>
        );
      })}
    </div>
  );
};

/**
 * Composant de tendances simplifiées pour mobile
 * Remplace les graphiques complexes par une représentation synthétique
 */
const MobileTrendChart: React.FC<{ 
  weeklyData: WeeklyData[];
  dashboardStats: DashboardStats | null;
}> = ({ weeklyData, dashboardStats }) => {
  
  if (!weeklyData || weeklyData.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Activity className="h-8 w-8 mx-auto mb-3 opacity-50 animate-pulse" />
          <p className="text-sm text-gray-500">Chargement des tendances...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculs de tendances préservés de la logique originale
  const latestData = weeklyData[weeklyData.length - 1];
  const previousData = weeklyData[weeklyData.length - 2];
  
  const userTrend = previousData ? ((latestData.users - previousData.users) / previousData.users) * 100 : 0;
  const listingTrend = previousData ? ((latestData.listings - previousData.listings) / previousData.listings) * 100 : 0;
  const reportTrend = previousData && latestData.reports && previousData.reports ? 
    ((latestData.reports - previousData.reports) / previousData.reports) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Tendances 7 jours
          <Badge variant="outline" className="text-xs">
            Temps réel
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Utilisateurs</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{latestData.users}</span>
              <div className={`flex items-center text-xs ${userTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {userTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(userTrend).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Annonces</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{latestData.listings}</span>
              <div className={`flex items-center text-xs ${listingTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {listingTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(listingTrend).toFixed(1)}%
              </div>
            </div>
          </div>

          {latestData.reports !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Signalements</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{latestData.reports}</span>
                <div className={`flex items-center text-xs ${reportTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportTrend <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {Math.abs(reportTrend).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Mini graphique en barres pour visualisation rapide */}
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">Activité hebdomadaire</div>
            <div className="flex items-end space-x-1 h-16">
              {weeklyData.slice(-7).map((day, index) => {
                const maxValue = Math.max(...weeklyData.map(d => d.users + d.listings));
                const height = maxValue > 0 ? ((day.users + day.listings) / maxValue) * 100 : 2;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.name}: ${day.users + day.listings} total`}
                    ></div>
                    <span className="text-xs text-gray-400 mt-1">
                      {day.name.slice(0, 1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Métriques qualité additionnelles si disponibles */}
          {dashboardStats?.qualityMetrics && (
            <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
              Temps de réponse: {dashboardStats.qualityMetrics.averageResponseTime?.toFixed(1) || 0}h
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Composant de recherche mobile optimisé
 * Version condensée de la recherche globale originale
 */
const MobileSearchBar: React.FC<{
  globalSearch: (term: string) => any;
  onNavigate: (tab: string) => void;
}> = ({ globalSearch, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      setIsSearching(true);
      try {
        const searchResults = globalSearch(term);
        setResults(searchResults);
      } catch (error) {
        console.error('Erreur de recherche:', error);
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    } else {
      setResults(null);
      setIsSearching(false);
    }
  };

  const totalResults = results ? 
    results.users.length + results.listings.length + results.reports.length + results.sanctions.length : 0;

  const clearSearch = () => {
    setSearchTerm('');
    setResults(null);
    setIsSearching(false);
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Recherche globale rapide..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="text-sm"
          />
          {(searchTerm || results) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="p-1 h-8 w-8"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {isSearching && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
              <Activity className="h-3 w-3 animate-spin" />
              <span>Recherche en cours...</span>
            </div>
          </div>
        )}
        
        {results && totalResults > 0 && !isSearching && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-600 flex items-center justify-between">
              <span>{totalResults} résultats trouvés</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="text-xs text-gray-500 p-0 h-auto"
              >
                Effacer
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {results.users.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('users')}
                  className="h-auto p-2 flex flex-col items-center text-xs bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <Users className="h-3 w-3 mb-1 text-blue-600" />
                  <span className="font-medium">{results.users.length}</span>
                  <span className="text-gray-600">utilisateurs</span>
                </Button>
              )}
              {results.listings.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('listings')}
                  className="h-auto p-2 flex flex-col items-center text-xs bg-green-50 border-green-200 hover:bg-green-100"
                >
                  <Package className="h-3 w-3 mb-1 text-green-600" />
                  <span className="font-medium">{results.listings.length}</span>
                  <span className="text-gray-600">annonces</span>
                </Button>
              )}
              {results.reports.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('reports')}
                  className="h-auto p-2 flex flex-col items-center text-xs bg-orange-50 border-orange-200 hover:bg-orange-100"
                >
                  <AlertTriangle className="h-3 w-3 mb-1 text-orange-600" />
                  <span className="font-medium">{results.reports.length}</span>
                  <span className="text-gray-600">signalements</span>
                </Button>
              )}
              {results.sanctions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto p-2 flex flex-col items-center text-xs bg-red-50 border-red-200 hover:bg-red-100"
                >
                  <Shield className="h-3 w-3 mb-1 text-red-600" />
                  <span className="font-medium">{results.sanctions.length}</span>
                  <span className="text-gray-600">sanctions</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {results && totalResults === 0 && !isSearching && (
          <div className="mt-3 text-center text-xs text-gray-500">
            Aucun résultat trouvé pour "{searchTerm}"
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// =================== COMPOSANT PRINCIPAL ===================

const OverviewTab: React.FC<OverviewTabProps> = ({
  weeklyData,
  categoryData,
  dashboardStats,
  pendingReportsCount,
  needsReviewCount,
  onTabChange,
  crossStats,
  platformHealth,
  globalSearch
}) => {
  
  // Détection responsive et état mobile
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsiveBreakpoint();
  const [mobileView, setMobileView] = useState<'overview' | 'detailed'>('overview');
  
  // État pour la recherche globale (CONSERVÉ de l'original)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchActive, setSearchActive] = useState(false);

  // Configuration des couleurs cohérente (CONSERVÉE)
  const chartColors = {
    users: "#3B82F6",
    listings: "#10B981",
    reports: "#F59E0B",
    growth: "#8B5CF6",
    health: "#EF4444"
  };

  // Fonction de calcul de santé (CONSERVÉE intégralement)
  const getPlatformHealthStatus = () => {
    if (!dashboardStats) return { status: 'loading', color: 'gray', message: 'Chargement...', score: 0 };
    
    const score = crossStats.healthScore;
    const urgentActions = crossStats.urgentActions;
    const moderationWorkload = crossStats.moderationWorkload;
    
    if (urgentActions > 5 || score < 30) {
      return { 
        status: 'critical', 
        color: 'red', 
        message: `${urgentActions} actions critiques`, 
        score 
      };
    } else if (urgentActions > 2 || moderationWorkload > 20 || score < 60) {
      return { 
        status: 'warning', 
        color: 'orange', 
        message: `${moderationWorkload} tâches en cours`, 
        score 
      };
    } else if (score > 80 && urgentActions === 0) {
      return { 
        status: 'excellent', 
        color: 'green', 
        message: 'Performance optimale', 
        score 
      };
    } else {
      return { 
        status: 'good', 
        color: 'blue', 
        message: 'Fonctionnement normal', 
        score 
      };
    }
  };

  const healthStatus = getPlatformHealthStatus();

  // Gestionnaire de recherche globale (CONSERVÉ)
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      const results = globalSearch(term);
      setSearchResults(results);
      setSearchActive(true);
    } else {
      setSearchResults(null);
      setSearchActive(false);
    }
  };

  // Actions prioritaires (CONSERVÉES avec logique enrichie)
  const priorityActions = [
    {
      title: "Actions urgentes",
      description: "Nécessitent une intervention immédiate",
      count: crossStats.urgentActions,
      icon: AlertCircle,
      color: crossStats.urgentActions > 5 ? "destructive" : crossStats.urgentActions > 0 ? "default" : "secondary",
      bgColor: crossStats.urgentActions > 5 ? "bg-red-50 border-red-200" : 
               crossStats.urgentActions > 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200",
      action: () => {
        if (pendingReportsCount > 0) onTabChange("reports");
        else if (needsReviewCount > 0) onTabChange("listings");
      },
      show: crossStats.urgentActions > 0
    },
    {
      title: "Charge de modération",
      description: "Éléments nécessitant une révision",
      count: crossStats.moderationWorkload,
      icon: Package,
      color: crossStats.moderationWorkload > 20 ? "default" : "secondary",
      bgColor: crossStats.moderationWorkload > 20 ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200",
      action: () => onTabChange("listings"),
      show: crossStats.moderationWorkload > 0
    },
    {
      title: "Croissance plateforme",
      description: "Nouveaux utilisateurs cette semaine",
      count: crossStats.platformGrowth,
      icon: Users,
      color: "secondary",
      bgColor: crossStats.platformGrowth > 10 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200",
      action: () => onTabChange("users"),
      show: crossStats.platformGrowth > 0
    }
  ].filter(action => action.show);

  // =================== RENDU MOBILE ===================
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        
        {/* En-tête mobile avec indicateur de statut */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold">Dashboard</h2>
            <Badge 
              variant={healthStatus.status === 'critical' ? "destructive" : 
                      healthStatus.status === 'warning' ? "default" : "secondary"}
              className="text-xs"
            >
              {breakpoint.toUpperCase()}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileView(mobileView === 'overview' ? 'detailed' : 'overview')}
            className="flex items-center space-x-1"
          >
            {mobileView === 'overview' ? <Maximize2 className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="text-xs">{mobileView === 'overview' ? 'Détails' : 'Vue'}</span>
          </Button>
        </div>

        <Tabs value={mobileView} onValueChange={(value) => setMobileView(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="text-xs">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="detailed" className="text-xs">Analyse détaillée</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <MobileAlertSummary 
              urgentActions={crossStats.urgentActions}
              healthScore={crossStats.healthScore}
              moderationWorkload={crossStats.moderationWorkload}
              onActionClick={onTabChange}
            />
            
            <MobileEssentialMetrics 
              crossStats={crossStats}
              dashboardStats={dashboardStats}
              onTabChange={onTabChange}
            />
            
            <MobileTrendChart 
              weeklyData={weeklyData} 
              dashboardStats={dashboardStats}
            />
            
            <MobileSearchBar 
              globalSearch={globalSearch}
              onNavigate={onTabChange}
            />

            {/* Actions prioritaires en version mobile compacte */}
            {priorityActions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Actions prioritaires
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {priorityActions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {priorityActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className={`w-full h-auto p-3 flex items-center justify-between text-left ${action.bgColor} hover:shadow-md transition-all duration-200`}
                          onClick={action.action}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="h-4 w-4" />
                            <div>
                              <h3 className="font-medium text-sm">{action.title}</h3>
                              <p className="text-xs text-gray-600">{action.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={action.color as any} className="text-xs">
                              {action.count > 99 ? "99+" : action.count}
                            </Badge>
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4 mt-4">
            {/* Section analytiques avancées mobile */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                  Métriques avancées
                </CardTitle>
                <CardDescription className="text-xs">
                  Données du système d'analyse centralisé
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-lg font-bold text-blue-600">{crossStats.totalElements}</div>
                    <div className="text-xs text-gray-600">Éléments</div>
                    <div className="text-xs text-gray-400">Total BD</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-lg font-bold text-purple-600">{crossStats.healthScore}</div>
                    <div className="text-xs text-gray-600">Score santé</div>
                    <div className="text-xs text-gray-400">Sur 100</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-lg font-bold text-orange-600">{crossStats.moderationWorkload}</div>
                    <div className="text-xs text-gray-600">Modération</div>
                    <div className="text-xs text-gray-400">En cours</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className={`text-lg font-bold ${
                      crossStats.urgentActions > 5 ? 'text-red-600' :
                      crossStats.urgentActions > 2 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {crossStats.urgentActions}
                    </div>
                    <div className="text-xs text-gray-600">Urgentes</div>
                    <div className="text-xs text-gray-400">Actions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Graphique d'activité simplifié pour mobile */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Activité hebdomadaire</CardTitle>
                <CardDescription className="text-xs">
                  Évolution des principales métriques (version mobile)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                {weeklyData && weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyData}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '10px',
                          padding: '8px'
                        }}
                        formatter={(value, name) => [
                          `${value}`,
                          name === 'users' ? 'Utilisateurs' : name === 'listings' ? 'Annonces' : 'Signalements'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke={chartColors.users}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="users"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="listings" 
                        stroke={chartColors.listings}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="listings"
                      />
                      {weeklyData.some(day => (day as any).reports > 0) && (
                        <Line 
                          type="monotone" 
                          dataKey="reports" 
                          stroke={chartColors.reports}
                          strokeWidth={1.5}
                          dot={{ r: 2 }}
                          strokeDasharray="3 3"
                          name="reports"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-500">
                    <div className="text-center">
                      <Activity className="h-6 w-6 mx-auto mb-2 opacity-50 animate-pulse" />
                      <p className="text-xs">Chargement des données...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Catégories en liste pour mobile */}
            {categoryData && categoryData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribution des catégories</CardTitle>
                  <CardDescription className="text-xs">
                    Répartition des annonces par catégorie
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {categoryData.slice(0, 6).map((category, index) => {
                      const percentage = categoryData.reduce((acc, cat) => acc + cat.value, 0) > 0 
                        ? ((category.value / categoryData.reduce((acc, cat) => acc + cat.value, 0)) * 100)
                        : 0;
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <span className="truncate font-medium">{category.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">{category.value}</span>
                              <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full transition-all duration-300"
                              style={{ 
                                backgroundColor: category.color, 
                                width: `${percentage}%` 
                              }}
                            ></div>
                          </div>
                          {(category as any).growth && (category as any).growth > 0 && (
                            <div className="text-xs text-green-600 flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +{(category as any).growth}% cette semaine
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {categoryData.length > 6 && (
                      <div className="text-xs text-gray-500 text-center pt-2">
                        ... et {categoryData.length - 6} autres catégories
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Régions populaires mobile */}
            {dashboardStats?.topRegions && dashboardStats.topRegions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Régions actives</CardTitle>
                  <CardDescription className="text-xs">
                    Top des régions par activité
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {dashboardStats.topRegions.slice(0, 5).map((region, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{region.name}</p>
                            <p className="text-xs text-gray-500">
                              {region.userCount}u • {region.listingCount}a
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs flex items-center ${
                            (region as any).growthRate > 10 ? 'text-green-600' :
                            (region as any).growthRate > 0 ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {(region as any).growthRate > 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                            {(region as any).growthRate > 0 ? `+${(region as any).growthRate}%` : 'Stable'}
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded-full mt-1 ${
                            region.listingCount / region.userCount > 0.5 ? 'bg-green-100 text-green-700' :
                            region.listingCount / region.userCount > 0.2 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {((region.listingCount / region.userCount) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // =================== RENDU DESKTOP/TABLETTE (CODE ORIGINAL COMPLET) ===================
  
  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Barre de recherche globale ORIGINALE CONSERVÉE */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher dans toutes les données (utilisateurs, annonces, sanctions...)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1"
            />
            {searchActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults(null);
                  setSearchActive(false);
                }}
                className="text-gray-500"
              >
                Effacer
              </Button>
            )}
          </div>
          
          {/* Résultats de recherche ORIGINAUX CONSERVÉS */}
          {searchResults && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-600">
                Résultats trouvés: {searchResults.users.length + searchResults.listings.length + searchResults.reports.length + searchResults.sanctions.length} éléments
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {searchResults.users.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Utilisateurs ({searchResults.users.length})
                    </h4>
                    <div className="space-y-1">
                      {searchResults.users.slice(0, 3).map((user: any, i: number) => (
                        <div key={i} className="text-sm text-blue-700">
                          {user.full_name || user.email}
                        </div>
                      ))}
                      {searchResults.users.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTabChange("users")}
                          className="text-xs text-blue-600 p-0 h-auto"
                        >
                          +{searchResults.users.length - 3} autres
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {searchResults.listings.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      Annonces ({searchResults.listings.length})
                    </h4>
                    <div className="space-y-1">
                      {searchResults.listings.slice(0, 3).map((listing: any, i: number) => (
                        <div key={i} className="text-sm text-green-700">
                          {listing.title.slice(0, 30)}...
                        </div>
                      ))}
                      {searchResults.listings.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTabChange("listings")}
                          className="text-xs text-green-600 p-0 h-auto"
                        >
                          +{searchResults.listings.length - 3} autres
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {searchResults.reports.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-3">
                    <h4 className="font-medium text-orange-800 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Signalements ({searchResults.reports.length})
                    </h4>
                    <div className="space-y-1">
                      {searchResults.reports.slice(0, 3).map((report: any, i: number) => (
                        <div key={i} className="text-sm text-orange-700">
                          {report.reason.slice(0, 30)}...
                        </div>
                      ))}
                      {searchResults.reports.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTabChange("reports")}
                          className="text-xs text-orange-600 p-0 h-auto"
                        >
                          +{searchResults.reports.length - 3} autres
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {searchResults.sanctions.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      Sanctions ({searchResults.sanctions.length})
                    </h4>
                    <div className="space-y-1">
                      {searchResults.sanctions.slice(0, 3).map((sanction: any, i: number) => (
                        <div key={i} className="text-sm text-red-700">
                          {sanction.target_name} - {sanction.reason.slice(0, 20)}...
                        </div>
                      ))}
                      {searchResults.sanctions.length > 3 && (
                        <div className="text-xs text-red-600">
                          +{searchResults.sanctions.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicateur de santé ORIGINAL CONSERVÉ */}
      <Card className={`border-l-4 ${
        healthStatus.color === 'red' ? 'border-l-red-500 bg-red-50' :
        healthStatus.color === 'orange' ? 'border-l-orange-500 bg-orange-50' :
        healthStatus.color === 'green' ? 'border-l-green-500 bg-green-50' :
        'border-l-blue-500 bg-blue-50'
      }`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <ThermometerSun className={`h-6 w-6 ${
                  healthStatus.color === 'red' ? 'text-red-600' :
                  healthStatus.color === 'orange' ? 'text-orange-600' :
                  healthStatus.color === 'green' ? 'text-green-600' :
                  'text-blue-600'
                }`} />
                <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white ${
                  healthStatus.score >= 80 ? 'bg-green-500' :
                  healthStatus.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {Math.round(healthStatus.score / 10)}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm sm:text-base">État de la plateforme</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {healthStatus.message} • Score: {healthStatus.score}/100
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Temps réel</span>
              </div>
              {crossStats.urgentActions > 0 && (
                <div className="text-xs text-red-600 font-medium mt-1">
                  {crossStats.urgentActions} action(s) urgente(s)
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  healthStatus.score >= 80 ? 'bg-green-500' :
                  healthStatus.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthStatus.score}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions prioritaires ORIGINALES CONSERVÉES */}
      {priorityActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Tableau de bord actions
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <BarChart3 className="h-4 w-4 mr-1" />
                {crossStats.totalElements} éléments total
              </div>
            </CardTitle>
            <CardDescription>
              Actions nécessitant une attention selon l'analyse des données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {priorityActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-auto p-3 sm:p-4 flex flex-col items-start text-left ${action.bgColor} hover:shadow-md transition-all duration-200`}
                    onClick={action.action}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <Badge variant={action.color as any} className="text-xs">
                        {action.count > 99 ? "99+" : action.count}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métriques clés ORIGINALES CONSERVÉES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-green-600">
                +{crossStats.platformGrowth}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Croissance</p>
              <p className="text-xs text-gray-400">Cette semaine</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                {crossStats.engagementHealth}%
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Engagement</p>
              <p className="text-xs text-gray-400">Moyen pondéré</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-orange-600">
                {dashboardStats?.qualityMetrics?.averageResponseTime?.toFixed(1) || 0}h
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Réponse</p>
              <p className="text-xs text-gray-400">Temps moyen</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-purple-600">
                {dashboardStats?.qualityMetrics?.reportResolutionRate?.toFixed(0) || 0}%
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Résolution</p>
              <p className="text-xs text-gray-400">Signalements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux ORIGINAUX CONSERVÉS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              Activité hebdomadaire
              <Badge variant="outline" className="text-xs">
                Tendance: {crossStats.platformGrowth > 0 ? '+' : ''}{crossStats.platformGrowth}
              </Badge>
            </CardTitle>
            <CardDescription>
              Évolution des principales métriques avec indicateurs de santé
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData && weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    stroke="#666"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(value, name) => [
                      `${value} ${name.toLowerCase()}`,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke={chartColors.users}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Utilisateurs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="listings" 
                    stroke={chartColors.listings}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Annonces"
                  />
                  {weeklyData.some(day => (day as any).reports > 0) && (
                    <Line 
                      type="monotone" 
                      dataKey="reports" 
                      stroke={chartColors.reports}
                      strokeWidth={1.5}
                      dot={{ r: 3 }}
                      name="Signalements"
                      strokeDasharray="5 5"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-gray-500">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-3 opacity-50 animate-pulse" />
                  <p className="text-sm">Chargement des données temporelles...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Catégories & Performance</CardTitle>
            <CardDescription>
              Répartition des annonces avec indicateurs d'engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData && categoryData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => percentage > 8 ? `${name} ${percentage}%` : ''}
                      outerRadius={75}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} annonces`, name]}
                      contentStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2">
                  {categoryData.slice(0, 4).map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-medium">{category.value} annonces</div>
                        {(category as any).growth && (category as any).growth > 0 && (
                          <div className="text-green-600 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{(category as any).growth}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-72 text-gray-500">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Analyse des catégories en cours...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métriques transversales ORIGINALES CONSERVÉES */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Analytiques avancées
          </CardTitle>
          <CardDescription>
            Métriques calculées par le système d'analyse centralisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{crossStats.totalElements}</div>
              <div className="text-xs text-gray-600">Éléments totaux</div>
              <div className="text-xs text-gray-500">Base de données</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{crossStats.healthScore}</div>
              <div className="text-xs text-gray-600">Score santé</div>
              <div className="text-xs text-gray-500">Sur 100</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{crossStats.moderationWorkload}</div>
              <div className="text-xs text-gray-600">Charge modération</div>
              <div className="text-xs text-gray-500">Tâches en cours</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className={`text-2xl font-bold ${
                crossStats.urgentActions > 5 ? 'text-red-600' :
                crossStats.urgentActions > 2 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {crossStats.urgentActions}
              </div>
              <div className="text-xs text-gray-600">Actions urgentes</div>
              <div className="text-xs text-gray-500">Nécessitent intervention</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé régional ORIGINAL CONSERVÉ */}
      {dashboardStats?.topRegions && dashboardStats.topRegions.length > 0 && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Analyse géographique</CardTitle>
            <CardDescription>
              Régions les plus actives avec métriques de croissance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardStats.topRegions.map((region, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{region.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {region.userCount} utilisateurs • {region.listingCount} annonces
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center text-xs sm:text-sm mb-1 ${
                      (region as any).growthRate > 10 ? 'text-green-600' :
                      (region as any).growthRate > 0 ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {(region as any).growthRate > 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                      {(region as any).growthRate > 0 ? `+${(region as any).growthRate}%` : 'Stable'}
                    </div>
                    <p className="text-xs text-gray-400">Cette semaine</p>
                    
                    <div className="mt-1">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        region.listingCount / region.userCount > 0.5 ? 'bg-green-100 text-green-700' :
                        region.listingCount / region.userCount > 0.2 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {((region.listingCount / region.userCount) * 100).toFixed(0)}% engagement
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default OverviewTab;