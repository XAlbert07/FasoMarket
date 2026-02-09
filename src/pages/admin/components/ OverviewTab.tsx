// pages/admin/components/OverviewTab.tsx

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
  Search, Zap, BarChart3, AlertCircle,
  ChevronRight, Menu, Maximize2, X
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

// =================== INTERFACES ===================

interface OverviewTabProps {
  weeklyData: WeeklyData[];
  categoryData: CategoryData[];
  dashboardStats: DashboardStats | null;
  pendingReportsCount: number;
  needsReviewCount: number;
  onTabChange: (tab: string) => void;
  
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
  moderationWorkload: number;
  onActionClick: (tab: string) => void;
}> = ({ urgentActions, moderationWorkload, onActionClick }) => {
  
  // Logique de calcul de santé 
  const getAlertStatus = () => {
    if (urgentActions > 5) {
      return { 
        level: 'critical', 
        color: 'bg-red-600', 
        borderColor: 'border-red-500/20',
        bgColor: 'bg-card',
        text: 'CRITIQUE',
        message: `${urgentActions} actions prioritaires`
      };
    } else if (urgentActions > 0 || moderationWorkload > 20) {
      return { 
        level: 'warning', 
        color: 'bg-amber-600', 
        borderColor: 'border-amber-500/20',
        bgColor: 'bg-card',
        text: 'ATTENTION',
        message: `${moderationWorkload} tâches en cours`
      };
    } else if (urgentActions === 0 && moderationWorkload === 0) {
      return { 
        level: 'excellent', 
        color: 'bg-emerald-600', 
        borderColor: 'border-emerald-500/20',
        bgColor: 'bg-card',
        text: 'EXCELLENT',
        message: 'Performance optimale'
      };
    } else {
      return { 
        level: 'good', 
        color: 'bg-slate-600', 
        borderColor: 'border-border',
        bgColor: 'bg-card',
        text: 'NORMAL',
        message: 'Fonctionnement normal'
      };
    }
  };

  const alert = getAlertStatus();

  return (
    <Card className={`border ${alert.borderColor} ${alert.bgColor} shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${alert.color} ${alert.level === 'critical' ? 'animate-pulse' : ''}`}></div>
            <div>
              <h3 className="font-bold text-sm">{alert.text}</h3>
              <p className="text-xs text-muted-foreground">{alert.message}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{moderationWorkload}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
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
  
  // Métriques prioritaires avec logique de couleur
  const metrics = [
    {
      label: "Croissance",
      value: `+${crossStats.platformGrowth}`,
      subtitle: "cette semaine",
      color: "text-foreground",
      bgColor: "bg-background",
      icon: TrendingUp,
      action: () => onTabChange("users"),
      clickable: crossStats.platformGrowth > 0
    },
    {
      label: "Engagement",
      value: `${crossStats.engagementHealth}%`,
      subtitle: "moyen pondéré",
      color: "text-foreground",
      bgColor: "bg-background",
      icon: Activity,
      action: null,
      clickable: false
    },
    {
      label: "Modération",
      value: crossStats.moderationWorkload.toString(),
      subtitle: "tâches",
      color: "text-foreground",
      bgColor: "bg-background",
      icon: Package,
      action: () => onTabChange("listings"),
      clickable: crossStats.moderationWorkload > 0
    },
    {
      label: "Résolution",
      value: `${dashboardStats?.qualityMetrics?.reportResolutionRate?.toFixed(0) || 0}%`,
      subtitle: "signalements",
      color: "text-foreground",
      bgColor: "bg-background",
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
          className: `h-auto p-3 ${metric.bgColor} border border-border hover:bg-muted/40 transition-colors duration-200`
        } : {
          className: `p-3 ${metric.bgColor} border border-border rounded-lg`
        };

        return (
          <CardComponent key={index} {...cardProps}>
            <div className="flex items-center space-x-2 text-left w-full">
              <Icon className={`h-4 w-4 ${metric.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className={`text-lg font-bold ${metric.color} truncate`}>
                  {metric.value}
                </div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.subtitle}</div>
              </div>
              {metric.clickable && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          </CardComponent>
        );
      })}
    </div>
  );
};

/**
 * Composant de tendances simplifiées pour mobile
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
          <p className="text-sm text-muted-foreground">Chargement des tendances...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculs de tendances 
  const latestData = weeklyData[weeklyData.length - 1];
  const previousData = weeklyData[weeklyData.length - 2];
  
  const userTrend = (previousData && previousData.users > 0) 
  ? ((latestData.users - previousData.users) / previousData.users) * 100 
  : 0;

const listingTrend = (previousData && previousData.listings > 0) 
  ? ((latestData.listings - previousData.listings) / previousData.listings) * 100 
  : 0;

const reportTrend = (previousData && latestData.reports && previousData.reports && previousData.reports > 0) 
  ? ((latestData.reports - previousData.reports) / previousData.reports) * 100 
  : 0;
  
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
            <span className="text-sm text-muted-foreground">Utilisateurs</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{latestData.users}</span>
              <div className={`flex items-center text-xs ${userTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {userTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(userTrend).toFixed(1)}%
                
              </div>
            </div>
          </div>
          
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Annonces</span>
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
              <span className="text-sm text-muted-foreground">Signalements</span>
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
            <div className="text-xs text-muted-foreground mb-2">Activité hebdomadaire</div>
            <div className="flex items-end space-x-1 h-16">
              {weeklyData.slice(-7).map((day, index) => {
                const maxValue = Math.max(...weeklyData.map(d => d.users + d.listings));
                const height = maxValue > 0 ? ((day.users + day.listings) / maxValue) * 100 : 2;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-foreground/70 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.name}: ${day.users + day.listings} total`}
                    ></div>
                    <span className="text-xs text-muted-foreground mt-1">
                     {typeof day.name === 'string' ? day.name.slice(0, 1) : String(day.name).slice(0, 1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Métriques qualité additionnelles */}
          {dashboardStats?.qualityMetrics && (
            <div className="pt-2 border-t border-border text-xs text-muted-foreground">
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
          <Search className="h-4 w-4 text-muted-foreground" />
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
            <div className="inline-flex items-center space-x-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3 animate-spin" />
              <span>Recherche en cours...</span>
            </div>
          </div>
        )}
        
        {results && totalResults > 0 && !isSearching && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>{totalResults} résultats trouvés</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="text-xs text-muted-foreground p-0 h-auto"
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
                  className="h-auto p-2 flex flex-col items-center text-xs bg-background border-border hover:bg-muted/40"
                >
                  <Users className="h-3 w-3 mb-1 text-foreground" />
                  <span className="font-medium">{results.users.length}</span>
                  <span className="text-muted-foreground">utilisateurs</span>
                </Button>
              )}
              {results.listings.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('listings')}
                  className="h-auto p-2 flex flex-col items-center text-xs bg-background border-border hover:bg-muted/40"
                >
                  <Package className="h-3 w-3 mb-1 text-foreground" />
                  <span className="font-medium">{results.listings.length}</span>
                  <span className="text-muted-foreground">annonces</span>
                </Button>
              )}
              {results.reports.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('reports')}
                  className="h-auto p-2 flex flex-col items-center text-xs bg-background border-border hover:bg-muted/40"
                >
                  <AlertTriangle className="h-3 w-3 mb-1 text-foreground" />
                  <span className="font-medium">{results.reports.length}</span>
                  <span className="text-muted-foreground">signalements</span>
                </Button>
              )}
              {results.sanctions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto p-2 flex flex-col items-center text-xs bg-background border-border hover:bg-muted/40"
                >
                  <Shield className="h-3 w-3 mb-1 text-foreground" />
                  <span className="font-medium">{results.sanctions.length}</span>
                  <span className="text-muted-foreground">sanctions</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {results && totalResults === 0 && !isSearching && (
          <div className="mt-3 text-center text-xs text-muted-foreground">
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
  
  // État pour la recherche globale 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchActive, setSearchActive] = useState(false);

  // Configuration des couleurs cohérente 
  const chartColors = {
    users: "#3B82F6",
    listings: "#10B981",
    reports: "#F59E0B",
    growth: "#8B5CF6"
  };

  const operationalStatus =
    crossStats.urgentActions > 5
      ? 'critical'
      : crossStats.urgentActions > 0 || crossStats.moderationWorkload > 20
      ? 'warning'
      : 'normal';

  // Gestionnaire de recherche globale 
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

  // Actions prioritaires 
  const priorityActions = [
    {
      title: "Actions prioritaires",
      description: "Nécessitent une intervention immédiate",
      count: crossStats.urgentActions,
      icon: AlertCircle,
      color: crossStats.urgentActions > 5 ? "destructive" : crossStats.urgentActions > 0 ? "default" : "secondary",
      bgColor: crossStats.urgentActions > 5 ? "bg-red-500/5 border-red-500/20" : 
               crossStats.urgentActions > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-background border-border",
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
      bgColor: crossStats.moderationWorkload > 20 ? "bg-blue-500/5 border-blue-500/20" : "bg-background border-border",
      action: () => onTabChange("listings"),
      show: crossStats.moderationWorkload > 0
    },
    {
      title: "Croissance plateforme",
      description: "Nouveaux utilisateurs cette semaine",
      count: crossStats.platformGrowth,
      icon: Users,
      color: "secondary",
      bgColor: crossStats.platformGrowth > 10 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-background border-border",
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
            <h2 className="text-lg font-bold">Vue d'ensemble</h2>
            <Badge 
              variant={operationalStatus === 'critical' ? "destructive" : 
                      operationalStatus === 'warning' ? "default" : "secondary"}
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
                          className={`w-full h-auto p-3 flex items-center justify-between text-left border ${action.bgColor} hover:bg-muted/40 transition-colors duration-200`}
                          onClick={action.action}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="h-4 w-4" />
                            <div>
                              <h3 className="font-medium text-sm">{action.title}</h3>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={action.color as any} className="text-xs">
                              {action.count > 99 ? "99+" : action.count}
                            </Badge>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
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
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-foreground" />
                  Métriques avancées
                </CardTitle>
                <CardDescription className="text-xs">
                  Données du système d'analyse centralisé
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-background rounded border border-border">
                    <div className="text-lg font-bold text-foreground">{crossStats.totalElements}</div>
                    <div className="text-xs text-muted-foreground">Éléments</div>
                    <div className="text-xs text-muted-foreground">Total BD</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded border border-border">
                    <div className="text-lg font-bold text-foreground">{pendingReportsCount}</div>
                    <div className="text-xs text-muted-foreground">Signalements</div>
                    <div className="text-xs text-muted-foreground">En attente</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded border border-border">
                    <div className="text-lg font-bold text-foreground">{crossStats.moderationWorkload}</div>
                    <div className="text-xs text-muted-foreground">Modération</div>
                    <div className="text-xs text-muted-foreground">En cours</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded border border-border">
                    <div className={`text-lg font-bold ${
                      crossStats.urgentActions > 5 ? 'text-red-600' :
                      crossStats.urgentActions > 2 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {crossStats.urgentActions}
                    </div>
                    <div className="text-xs text-muted-foreground">Urgentes</div>
                    <div className="text-xs text-muted-foreground">Actions</div>
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

  // =================== RENDU DESKTOP/TABLETTE ===================
  
  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Barre de recherche globale */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Search className="h-5 w-5 text-muted-foreground" />
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
                className="text-muted-foreground"
              >
                Effacer
              </Button>
            )}
          </div>
          
          {/* Résultats de recherche */}
          {searchResults && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-muted-foreground">
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

      {/* État opérationnel */}
      <Card className="border shadow-sm border-border bg-card">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-foreground" />
              <div>
                <h3 className="font-medium text-sm sm:text-base">État opérationnel</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {crossStats.urgentActions > 0
                    ? `${crossStats.urgentActions} action(s) urgente(s) à traiter`
                    : 'Aucune action urgente'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Temps réel</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {crossStats.moderationWorkload} élément(s) en file
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions prioritaires */}
      {priorityActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Actions opérationnelles
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
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
                    className={`h-auto p-3 sm:p-4 flex flex-col items-start text-left border ${action.bgColor} hover:bg-muted/40 transition-colors duration-200`}
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
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métriques clés */}
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
              <p className="text-xs sm:text-sm text-muted-foreground">Croissance</p>
              <p className="text-xs text-muted-foreground">Cette semaine</p>
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
              <p className="text-xs sm:text-sm text-muted-foreground">Engagement</p>
              <p className="text-xs text-muted-foreground">Moyen pondéré</p>
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
              <p className="text-xs sm:text-sm text-muted-foreground">Réponse</p>
              <p className="text-xs text-muted-foreground">Temps moyen</p>
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
              <p className="text-xs sm:text-sm text-muted-foreground">Résolution</p>
              <p className="text-xs text-muted-foreground">Signalements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
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
                      `${value} ${String(name).toLowerCase()}`,
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

      {/* Métriques transversales */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-foreground" />
            Analytiques avancées
          </CardTitle>
          <CardDescription>
            Métriques calculées par le système d'analyse centralisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-lg border border-border">
              <div className="text-2xl font-bold text-foreground">{crossStats.totalElements}</div>
              <div className="text-xs text-muted-foreground">Éléments totaux</div>
              <div className="text-xs text-muted-foreground">Base de données</div>
            </div>
            
            <div className="text-center p-3 bg-background rounded-lg border border-border">
              <div className="text-2xl font-bold text-foreground">{pendingReportsCount}</div>
              <div className="text-xs text-muted-foreground">Signalements</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
            
            <div className="text-center p-3 bg-background rounded-lg border border-border">
              <div className="text-2xl font-bold text-foreground">{crossStats.moderationWorkload}</div>
              <div className="text-xs text-muted-foreground">Charge modération</div>
              <div className="text-xs text-muted-foreground">Tâches en cours</div>
            </div>
            
            <div className="text-center p-3 bg-background rounded-lg border border-border">
              <div className={`text-2xl font-bold ${
                crossStats.urgentActions > 5 ? 'text-red-600' :
                crossStats.urgentActions > 2 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {crossStats.urgentActions}
              </div>
              <div className="text-xs text-muted-foreground">Actions prioritaires</div>
              <div className="text-xs text-muted-foreground">Nécessitent intervention</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé régional */}
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
                <div key={index} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-background text-foreground border border-border rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{region.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
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
                    <p className="text-xs text-muted-foreground">Cette semaine</p>
                    
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
