// pages/AdminDashboard.tsx
// VERSION INTÉGRÉE COMPLÈTE - Tous les composants dans un seul fichier
// Cette approche évite les problèmes d'importation et vous permet de tester immédiatement

import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  RefreshCw, 
  AlertTriangle,
  ArrowUp,
  Wifi,
  WifiOff,
  BarChart3, 
  Users, 
  FileText, 
  Home,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
  Activity,
  Clock,
  CheckCircle,
  Settings
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Hook existant (inchangé)
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

// Composants modulaires existants (préservés intégralement)
import DashboardHeader from '@/pages/admin/components/DashboardHeader';
import StatsCards from '@/pages/admin/components/StatsCards';
import OverviewTab from '@/pages/admin/components/ OverviewTab';
import ReportsTab from '@/pages/admin/components/ReportsTab';
import UsersTab from '@/pages/admin/components/UsersTab';
import ListingsTab from '@/pages/admin/components/ListingsTab';
import AnalyticsTab from '@/pages/admin/components/AnalyticsTab';
import AlertsSection from '@/pages/admin/components/AlertsSection';
import HealthIndicators from '@/pages/admin/components/HealthIndicators';

// =============================================================================
// HOOK USESCREENSIZE - COMPOSANT INTÉGRÉ
// =============================================================================

interface ScreenSize {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenType: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
}

/**
 * Hook pour détecter la taille d'écran et adapter l'interface
 * Intégré directement dans le Dashboard pour éviter les dépendances externes
 */
const useScreenSize = (): ScreenSize => {
  const [screenData, setScreenData] = useState<ScreenSize>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenType: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const calculateScreenProperties = (): ScreenSize => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (width < 768) {
        return {
          isMobile: true,
          isTablet: false,
          isDesktop: false,
          screenType: 'mobile',
          width,
          height,
        };
      } else if (width < 1024) {
        return {
          isMobile: false,
          isTablet: true,
          isDesktop: false,
          screenType: 'tablet',
          width,
          height,
        };
      } else {
        return {
          isMobile: false,
          isTablet: false,
          isDesktop: true,
          screenType: 'desktop',
          width,
          height,
        };
      }
    };

    const handleResize = () => {
      setScreenData(calculateScreenProperties());
    };

    // Initialisation
    setScreenData(calculateScreenProperties());

    // Écoute avec debouncing pour les performances
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedHandleResize);
    
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return screenData;
};

// =============================================================================
// COMPOSANT MOBILETABNAVIGATION - INTÉGRÉ
// =============================================================================

interface TabData {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
  urgencyLevel?: 'normal' | 'warning' | 'critical';
  isLoading?: boolean;
}

interface MobileTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
  needsReviewCount: number;
  activeUsersCount: number;
  urgentActionsCount?: number;
  isLoading?: boolean;
}

/**
 * Composant de navigation mobile intégré
 * Transforme les onglets horizontaux en cartes verticales tactiles
 */
const MobileTabNavigation: React.FC<MobileTabNavigationProps> = ({
  activeTab,
  onTabChange,
  pendingCount,
  needsReviewCount,
  activeUsersCount,
  urgentActionsCount = 0,
  isLoading = false
}) => {
  
  const tabsData: TabData[] = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: Home,
      description: 'Tableau de bord principal et statistiques globales',
      urgencyLevel: 'normal'
    },
    {
      id: 'reports',
      label: 'Signalements',
      icon: AlertTriangle,
      badge: pendingCount,
      description: `${pendingCount} signalement${pendingCount !== 1 ? 's' : ''} en attente de traitement`,
      urgencyLevel: pendingCount > 5 ? 'critical' : pendingCount > 0 ? 'warning' : 'normal',
      isLoading
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: Users,
      badge: activeUsersCount,
      description: `${activeUsersCount} utilisateur${activeUsersCount !== 1 ? 's' : ''} actif${activeUsersCount !== 1 ? 's' : ''}`,
      urgencyLevel: 'normal'
    },
    {
      id: 'listings',
      label: 'Annonces',
      icon: FileText,
      badge: needsReviewCount,
      description: `${needsReviewCount} annonce${needsReviewCount !== 1 ? 's' : ''} à réviser`,
      urgencyLevel: needsReviewCount > 10 ? 'warning' : 'normal',
      isLoading
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Analyses détaillées et métriques avancées',
      urgencyLevel: 'normal'
    }
  ];

  const getUrgencyStyles = (urgencyLevel: TabData['urgencyLevel'], isActive: boolean) => {
    const baseStyles = "transition-all duration-200 ";
    
    if (isActive) {
      switch (urgencyLevel) {
        case 'critical':
          return baseStyles + "border-red-500 bg-red-50 shadow-lg ring-2 ring-red-200";
        case 'warning':
          return baseStyles + "border-orange-500 bg-orange-50 shadow-lg ring-2 ring-orange-200";
        default:
          return baseStyles + "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200";
      }
    }
    
    switch (urgencyLevel) {
      case 'critical':
        return baseStyles + "border-red-200 bg-white hover:border-red-300 hover:bg-red-25 shadow-sm";
      case 'warning':
        return baseStyles + "border-orange-200 bg-white hover:border-orange-300 hover:bg-orange-25 shadow-sm";
      default:
        return baseStyles + "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md";
    }
  };

  const getBadgeStyles = (urgencyLevel: TabData['urgencyLevel']) => {
    switch (urgencyLevel) {
      case 'critical':
        return "bg-red-500 text-white animate-pulse";
      case 'warning':
        return "bg-orange-500 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Sections administratives
        </h2>
        
        {urgentActionsCount > 0 && (
          <Badge className="bg-red-600 text-white animate-pulse">
            {urgentActionsCount} action{urgentActionsCount !== 1 ? 's' : ''} urgente{urgentActionsCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {tabsData.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`p-4 rounded-lg border text-left ${getUrgencyStyles(tab.urgencyLevel, isActive)}`}
              disabled={isLoading}
              style={{
                minHeight: '64px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="relative">
                    <IconComponent 
                      className={`h-6 w-6 mt-0.5 ${
                        isActive ? 'text-blue-600' : 'text-gray-600'
                      } ${tab.isLoading ? 'animate-pulse' : ''}`} 
                    />
                    
                    {tab.isLoading && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium ${
                        isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {tab.label}
                      </h3>
                      
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <Badge className={`text-xs ${getBadgeStyles(tab.urgencyLevel)}`}>
                          {tab.badge}
                        </Badge>
                      )}
                    </div>
                    
                    {tab.description && (
                      <p className={`text-sm mt-1 ${
                        isActive ? 'text-blue-700' : 'text-gray-500'
                      }`}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {tab.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="ml-3">
                  <ChevronRight 
                    className={`h-5 w-5 transition-transform ${
                      isActive 
                        ? 'text-blue-600 rotate-90' 
                        : 'text-gray-400'
                    }`} 
                  />
                </div>
              </div>
              
              {isActive && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Section active
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Navigation optimisée pour mobile • Balayez vers le haut pour actualiser
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// COMPOSANT ADAPTIVEHEADER - INTÉGRÉ
// =============================================================================

interface AdaptiveHeaderProps {
  dashboardStats: any;
  activeSanctionsCount: number;
  expiringSoonCount: number;
  pendingCount: number;
  urgentActionsCount: number;
  lastGlobalRefresh: string | null;
  refreshing: boolean;
  isLoading: boolean;
  isHealthy: boolean;
  onRefreshAllData: () => void;
  onNavigateToSanctions: () => void;
  onOpenSettings?: () => void;
  isMobile: boolean;
  screenType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Composant d'en-tête adaptatif intégré
 * S'adapte automatiquement selon la taille d'écran
 */
const AdaptiveHeader: React.FC<AdaptiveHeaderProps> = ({
  dashboardStats,
  activeSanctionsCount,
  expiringSoonCount,
  pendingCount,
  urgentActionsCount,
  lastGlobalRefresh,
  refreshing,
  isLoading,
  isHealthy,
  onRefreshAllData,
  onNavigateToSanctions,
  onOpenSettings,
  isMobile,
  screenType
}) => {
  const [showMobileActions, setShowMobileActions] = useState(false);

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return null;
    
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return updateTime.toLocaleDateString('fr-FR');
  };

  // Version mobile
  if (isMobile) {
    return (
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              FasoMarket - Supervision
            </p>
            
            <div className="flex items-center mt-2">
              {isHealthy ? (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  <span className="font-medium">Opérationnel</span>
                </div>
              ) : (
                <div className="flex items-center text-sm text-orange-600">
                  <Activity className="h-4 w-4 mr-1.5 animate-pulse" />
                  <span className="font-medium">Chargement...</span>
                </div>
              )}
              
              {lastGlobalRefresh && (
                <div className="flex items-center text-xs text-gray-500 ml-3">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatLastUpdate(lastGlobalRefresh)}
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileActions(!showMobileActions)}
            className="p-2"
          >
            {showMobileActions ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Button
            onClick={onRefreshAllData}
            disabled={refreshing || isLoading}
            size="sm"
            className="flex-1 min-w-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>

          <Button
            onClick={onNavigateToSanctions}
            variant="outline"
            size="sm"
            className={`relative ${activeSanctionsCount > 0 ? 'border-orange-300 text-orange-700' : ''}`}
          >
            <Shield className="h-4 w-4 mr-1.5" />
            <span className="hidden xs:inline">Sanctions</span>
            {activeSanctionsCount > 0 && (
              <Badge className="ml-1.5 bg-orange-500 text-white text-xs">
                {activeSanctionsCount}
              </Badge>
            )}
          </Button>
        </div>

        {showMobileActions && (
          <div className="border-t pt-3 mt-3 space-y-2">
            {urgentActionsCount > 0 && (
              <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">Actions urgentes</span>
                </div>
                <Badge className="bg-red-600 text-white animate-pulse">
                  {urgentActionsCount}
                </Badge>
              </div>
            )}
            
            {pendingCount > 0 && (
              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Signalements en attente</span>
                <Badge className="bg-blue-600 text-white">
                  {pendingCount}
                </Badge>
              </div>
            )}
            
            {expiringSoonCount > 0 && (
              <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-sm font-medium text-yellow-800">Sanctions expirant</span>
                <Badge className="bg-yellow-600 text-white">
                  {expiringSoonCount}
                </Badge>
              </div>
            )}
            
            {onOpenSettings && (
              <Button
                onClick={onOpenSettings}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Version tablet
  if (screenType === 'tablet') {
    return (
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
            <p className="text-gray-600 mt-1">Gestion et supervision de FasoMarket</p>
            
            <div className="flex items-center mt-2">
              {isHealthy ? (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Système opérationnel</span>
                  {lastGlobalRefresh && (
                    <span className="text-gray-500 ml-2">
                      • {formatLastUpdate(lastGlobalRefresh)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-sm text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                  <span>Chargement des données...</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onRefreshAllData}
              disabled={refreshing || isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
            
            <Button
              onClick={onNavigateToSanctions}
              variant="outline"
              size="sm"
              className={`relative ${activeSanctionsCount > 0 ? 'border-orange-300 text-orange-700' : ''}`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Sanctions
              {activeSanctionsCount > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white text-xs">
                  {activeSanctionsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {urgentActionsCount > 0 && (
            <Badge className="bg-red-600 text-white animate-pulse">
              {urgentActionsCount} action(s) urgente(s)
            </Badge>
          )}
          
          {pendingCount > 0 && (
            <Badge className="bg-blue-600 text-white">
              {pendingCount} signalement(s) en attente
            </Badge>
          )}
          
          {expiringSoonCount > 0 && (
            <Badge className="bg-yellow-600 text-white">
              {expiringSoonCount} sanction(s) expire(nt) bientôt
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Version desktop (original préservé)
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
        <p className="text-gray-600 mt-1">
          Gestion et supervision de la marketplace FasoMarket
        </p>
        
        {isHealthy ? (
          <div className="flex items-center mt-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Système opérationnel
            {lastGlobalRefresh && (
              <span className="text-gray-500 ml-2">
                • Dernière mise à jour: {new Date(lastGlobalRefresh).toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center mt-2 text-sm text-orange-600">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            Chargement des données...
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <Button 
          onClick={onRefreshAllData} 
          disabled={refreshing || isLoading}
          variant="outline"
          size="sm"
          className="relative"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>

        <Button
          onClick={onNavigateToSanctions}
          variant="outline"
          size="sm"
          className={`relative cursor-pointer transition-all duration-200 ${
            activeSanctionsCount > 0 
              ? 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 shadow-sm' 
              : 'hover:bg-gray-50'
          }`}
        >
          <Shield className="h-4 w-4 mr-2" />
          Sanctions actives
          {activeSanctionsCount > 0 && (
            <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white text-xs transition-colors">
              {activeSanctionsCount}
            </Badge>
          )}
        </Button>

        {expiringSoonCount > 0 && (
          <Badge className="bg-red-500 text-white animate-pulse">
            {expiringSoonCount} sanction(s) expire(nt) bientôt !
          </Badge>
        )}

        {pendingCount > 0 && (
          <Badge className="bg-blue-600 text-white">
            {pendingCount} signalement(s) en attente
          </Badge>
        )}

        {urgentActionsCount > 0 && (
          <Badge className="bg-red-600 text-white animate-pulse">
            {urgentActionsCount} action(s) urgente(s)
          </Badge>
        )}
        
        {onOpenSettings && (
          <Button
            onClick={onOpenSettings}
            variant="ghost"
            size="sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// COMPOSANT PRINCIPAL ADMINDASHBOARD - VERSION INTÉGRÉE COMPLÈTE
// =============================================================================

/**
 * AdminDashboard avec approche hybride adaptative
 * 
 * TOUS LES COMPOSANTS SONT INTÉGRÉS dans ce fichier pour éviter les problèmes d'importation.
 * Cette version est prête à être utilisée immédiatement sans créer de fichiers séparés.
 * 
 * ARCHITECTURE HYBRIDE :
 * - Desktop : Interface complète originale préservée
 * - Tablet : Adaptations mineures d'espacement et de layout
 * - Mobile : Navigation par cartes, contenu en pleine largeur, interactions tactiles
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop, screenType } = useScreenSize();

  // États locaux (inchangés)
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Hook centralisé (inchangé)
  const dashboard = useAdminDashboard();

  // Gestion du scroll pour mobile
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    if (isMobile) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile]);

  // Fonctions (inchangées)
  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      await dashboard.refreshAllData();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [dashboard]);

  const handleNavigateToSanctions = useCallback(() => {
    navigate('/sanctions');
  }, [navigate]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const exportUsers = useCallback((format: string) => {
    try {
      const usersData = dashboard.users.map(user => ({
        id: user.id,
        nom: user.full_name || '',
        email: user.email,
        telephone: user.phone || '',
        localisation: user.location || '',
        statut: user.status,
        role: user.role,
        score_confiance: user.trust_score,
        annonces_total: user.listings_count,
        annonces_actives: user.active_listings_count,
        signalements_recus: user.reports_received,
        signalements_faits: user.reports_made,
        niveau_risque: user.risk_level,
        date_inscription: user.created_at,
        derniere_activite: user.last_activity,
        age_compte_jours: user.account_age_days,
        statut_verification: user.verification_status
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const csvHeaders = Object.keys(usersData[0] || {}).join(',');
        const csvRows = usersData.map(user => 
          Object.values(user).map(value => 
            typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value
          ).join(',')
        );
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `utilisateurs_fasomarket_${timestamp}.csv`;
        link.click();
        
        console.log(`Export CSV de ${usersData.length} utilisateurs terminé`);
      } else if (format === 'json') {
        const jsonContent = JSON.stringify(usersData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `utilisateurs_fasomarket_${timestamp}.json`;
        link.click();
        
        console.log(`Export JSON de ${usersData.length} utilisateurs terminé`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export des utilisateurs:', error);
    }
  }, [dashboard.users]);

  // États de chargement (inchangés)
  const isInitialLoading = dashboard.globalLoading && !dashboard.dashboardStats;
  const hasCriticalErrors = [
    dashboard.errors.profiles,
    dashboard.errors.listings
  ].filter(Boolean).length > 0 && !dashboard.dashboardStats;

  // =============================================================================
  // ÉCRANS DE CHARGEMENT ET D'ERREUR ADAPTIFS
  // =============================================================================

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4 ${
            isMobile ? 'h-8 w-8' : 'h-12 w-12'
          }`}></div>
          
          <h2 className={`font-semibold text-gray-900 mb-2 ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            Chargement du tableau de bord
          </h2>
          
          <p className={`text-gray-600 mb-4 ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            Préparation de votre espace d'administration FasoMarket
          </p>

          <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="text-gray-500">
              {dashboard.loading.profiles && (
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Chargement des utilisateurs...
                </div>
              )}
              {dashboard.loading.listings && (
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Chargement des annonces...
                </div>
              )}
              {dashboard.loading.reports && (
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                  Chargement des signalements...
                </div>
              )}
              {dashboard.loading.sanctions && (
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  Chargement des sanctions...
                </div>
              )}
            </div>
          </div>

          {isMobile && (
            <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
              {navigator.onLine ? (
                <>
                  <Wifi className="h-3 w-3 mr-1 text-green-500" />
                  <span>Connexion active</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1 text-red-500" />
                  <span>Connexion limitée</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (hasCriticalErrors) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className={`text-center mx-auto p-6 ${isMobile ? 'max-w-sm px-4' : 'max-w-md'}`}>
          <AlertTriangle className={`text-red-500 mx-auto mb-4 ${
            isMobile ? 'h-8 w-8' : 'h-12 w-12'
          }`} />
          
          <h2 className={`font-semibold text-gray-900 mb-2 ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            Erreur de chargement
          </h2>
          
          <p className={`text-gray-600 mb-4 ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            Impossible de charger certaines données essentielles du dashboard.
          </p>
          
          <div className={`space-y-1 text-red-600 mb-4 ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            {dashboard.errors.profiles && (
              <p>• Erreur utilisateurs: {dashboard.errors.profiles}</p>
            )}
            {dashboard.errors.listings && (
              <p>• Erreur annonces: {dashboard.errors.listings}</p>
            )}
          </div>
          
          <Button 
            onClick={refreshAllData} 
            disabled={refreshing} 
            className={`w-full ${isMobile ? 'text-sm py-2' : ''}`}
          >
            <RefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''} ${
              isMobile ? 'h-3 w-3' : 'h-4 w-4'
            }`} />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // INTERFACE PRINCIPALE ADAPTATIVE
  // =============================================================================

  return (
    <div className={`min-h-screen bg-gray-50 ${
      isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-4'
    }`}>
      
      {/* EN-TÊTE ADAPTATIF */}
      <AdaptiveHeader
        dashboardStats={dashboard.dashboardStats}
        activeSanctionsCount={dashboard.stats.totalActive}
        expiringSoonCount={dashboard.stats.expiringSoon}
        pendingCount={dashboard.pendingCount}
        urgentActionsCount={dashboard.crossStats.urgentActions}
        lastGlobalRefresh={dashboard.lastGlobalRefresh}
        refreshing={refreshing}
        isLoading={dashboard.globalLoading}
        isHealthy={dashboard.isHealthy}
        onRefreshAllData={refreshAllData}
        onNavigateToSanctions={handleNavigateToSanctions}
        isMobile={isMobile}
        screenType={screenType}
      />

      {/* CARTES DE STATISTIQUES */}
      <div className={`mb-6 ${isMobile ? 'mb-4' : ''}`}>
        <StatsCards 
          dashboardStats={dashboard.dashboardStats}
          sanctionsStats={dashboard.stats}
          formatCurrency={dashboard.formatCurrency}
        />
      </div>

      {/* INTERFACE PRINCIPALE ADAPTATIVE */}
      {isMobile ? (
        // ========================================
        // VERSION MOBILE : Navigation par cartes
        // ========================================
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <MobileTabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                pendingCount={dashboard.pendingCount}
                needsReviewCount={dashboard.needsReviewCount}
                activeUsersCount={dashboard.activeUsersCount}
                urgentActionsCount={dashboard.crossStats.urgentActions}
                isLoading={dashboard.globalLoading}
              />
            </CardContent>
          </Card>

          {/* Contenu de l'onglet actif */}
          <div className="space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <OverviewTab 
                  weeklyData={dashboard.weeklyData}
                  categoryData={dashboard.categoryData}
                  dashboardStats={dashboard.dashboardStats}
                  pendingReportsCount={dashboard.pendingCount}
                  needsReviewCount={dashboard.needsReviewCount}
                  onTabChange={setActiveTab}
                  crossStats={dashboard.crossStats}
                  platformHealth={dashboard.platformHealth}
                  globalSearch={dashboard.globalSearch}
                />
                
                {/* Widget sanctions mobile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-sm">
                      <Shield className="h-4 w-4 mr-2 text-orange-600" />
                      État des sanctions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">
                          {dashboard.stats.totalActive}
                        </div>
                        <div className="text-xs text-gray-600">Actives</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {dashboard.stats.expiringSoon}
                        </div>
                        <div className="text-xs text-gray-600">Expirent</div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleNavigateToSanctions}
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                    >
                      Gérer les sanctions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'reports' && (
              <ReportsTab 
                reports={dashboard.reports}
                loading={dashboard.loading.reports}
                error={dashboard.errors.reports}
                handleReportAction={dashboard.handleReportAction}
                refreshReports={dashboard.refreshReports}
                getPriorityColor={dashboard.getPriorityColor}
                getStatusColor={dashboard.getStatusColor}
                formatResponseTime={dashboard.formatResponseTime}
                pendingCount={dashboard.pendingCount}
                totalReports={dashboard.reports.length}
                averageResponseTime={dashboard.reports.length > 0 
                  ? dashboard.reports.reduce((sum, r) => sum + (r.response_time_hours || 0), 0) / dashboard.reports.length 
                  : 0}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab 
                users={dashboard.users}
                loading={dashboard.loading.profiles}
                error={dashboard.errors.profiles}
                handleUserAction={dashboard.handleUserAction}
                getTrustScoreColor={dashboard.getTrustScoreColor}
                getStatusColor={dashboard.getStatusColor}
                formatDate={dashboard.formatDate}
                activeUsersCount={dashboard.activeUsersCount}
                suspendedUsersCount={dashboard.suspendedUsersCount}
                pendingVerificationCount={dashboard.pendingVerificationCount}
                totalUsers={dashboard.users.length}
                averageTrustScore={dashboard.users.length > 0 
                  ? Math.round(dashboard.users.reduce((sum, u) => sum + u.trust_score, 0) / dashboard.users.length)
                  : 0}
                refreshUsers={dashboard.refreshUsers}
                exportUsers={exportUsers}
              />
            )}

            {activeTab === 'listings' && (
              <ListingsTab 
                listings={dashboard.listings}
                loading={dashboard.loading.listings}
                error={dashboard.errors.listings}
                handleListingAction={dashboard.handleListingAction}
                refreshListings={dashboard.refreshListings}
                getQualityScoreColor={dashboard.getQualityScoreColor}
                getRiskLevelColor={dashboard.getRiskLevelColor}
                formatCurrency={dashboard.formatCurrency}
                formatDate={dashboard.formatDate}
                needsReviewCount={dashboard.needsReviewCount}
                averageQualityScore={dashboard.listings.length > 0 
                  ? Math.round(dashboard.listings.reduce((sum, l) => sum + (l.quality_score || 50), 0) / dashboard.listings.length)
                  : 0}
                totalViews={dashboard.listings.reduce((sum, l) => sum + l.views_count, 0)}
                totalEngagement={dashboard.listings.reduce((sum, l) => sum + l.favorites_count + l.messages_count, 0)}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab 
                dashboardStats={dashboard.dashboardStats}
                weeklyData={dashboard.weeklyData}
                crossStats={dashboard.crossStats}
                cacheInfo={dashboard.cacheInfo}
                diagnostics={dashboard.getDiagnostics()}
                users={dashboard.users}
                listings={dashboard.listings}
                reports={dashboard.reports}
              />
            )}
          </div>
        </div>
      ) : (
        // ========================================
        // VERSION DESKTOP/TABLET : Interface originale préservée
        // ========================================
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-5 ${
            isTablet ? 'text-sm' : ''
          }`}>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="reports">
              Signalements ({dashboard.pendingCount})
            </TabsTrigger>
            <TabsTrigger value="users">
              Utilisateurs ({dashboard.activeUsersCount})
            </TabsTrigger>
            <TabsTrigger value="listings">
              Annonces ({dashboard.needsReviewCount} à réviser)
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className={`grid gap-6 ${
              isTablet ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'
            }`}>
              <div className={isTablet ? 'space-y-6' : 'lg:col-span-3 space-y-6'}>
                <OverviewTab 
                  weeklyData={dashboard.weeklyData}
                  categoryData={dashboard.categoryData}
                  dashboardStats={dashboard.dashboardStats}
                  pendingReportsCount={dashboard.pendingCount}
                  needsReviewCount={dashboard.needsReviewCount}
                  onTabChange={setActiveTab}
                  crossStats={dashboard.crossStats}
                  platformHealth={dashboard.platformHealth}
                  globalSearch={dashboard.globalSearch}
                />
              </div>
              
              {isDesktop && (
                <div className="lg:col-span-1 space-y-6">
                  {/* Widget des sanctions */}
                  <div className="bg-white rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-orange-600" />
                        Sanctions
                      </h3>
                      <Button
                        onClick={handleNavigateToSanctions}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Voir tout
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-bold text-orange-600">
                          {dashboard.stats.totalActive}
                        </div>
                        <div className="text-xs text-gray-600">Actives</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-bold text-red-600">
                          {dashboard.stats.expiringSoon}
                        </div>
                        <div className="text-xs text-gray-600">Expirent</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 border-t pt-2">
                      <div className="flex justify-between">
                        <span>Temporaires:</span>
                        <span>{dashboard.stats.temporaryCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Permanentes:</span>
                        <span>{dashboard.stats.permanentCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Widget de santé globale */}
                  <div className="bg-white rounded-lg border p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Santé de la plateforme
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Score global</span>
                        <span className={`text-sm font-bold ${
                          dashboard.crossStats.healthScore >= 80 ? 'text-green-600' :
                          dashboard.crossStats.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {dashboard.crossStats.healthScore}/100
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            dashboard.crossStats.healthScore >= 80 ? 'bg-green-500' :
                            dashboard.crossStats.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${dashboard.crossStats.healthScore}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Modération:</span>
                          <div className="font-medium">{dashboard.crossStats.moderationWorkload} tâches</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Engagement:</span>
                          <div className="font-medium">{dashboard.crossStats.engagementHealth}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab 
              reports={dashboard.reports}
              loading={dashboard.loading.reports}
              error={dashboard.errors.reports}
              handleReportAction={dashboard.handleReportAction}
              refreshReports={dashboard.refreshReports}
              getPriorityColor={dashboard.getPriorityColor}
              getStatusColor={dashboard.getStatusColor}
              formatResponseTime={dashboard.formatResponseTime}
              pendingCount={dashboard.pendingCount}
              totalReports={dashboard.reports.length}
              averageResponseTime={dashboard.reports.length > 0 
                ? dashboard.reports.reduce((sum, r) => sum + (r.response_time_hours || 0), 0) / dashboard.reports.length 
                : 0}
            />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab 
              users={dashboard.users}
              loading={dashboard.loading.profiles}
              error={dashboard.errors.profiles}
              handleUserAction={dashboard.handleUserAction}
              getTrustScoreColor={dashboard.getTrustScoreColor}
              getStatusColor={dashboard.getStatusColor}
              formatDate={dashboard.formatDate}
              activeUsersCount={dashboard.activeUsersCount}
              suspendedUsersCount={dashboard.suspendedUsersCount}
              pendingVerificationCount={dashboard.pendingVerificationCount}
              totalUsers={dashboard.users.length}
              averageTrustScore={dashboard.users.length > 0 
                ? Math.round(dashboard.users.reduce((sum, u) => sum + u.trust_score, 0) / dashboard.users.length)
                : 0}
              refreshUsers={dashboard.refreshUsers}
              exportUsers={exportUsers}
            />
          </TabsContent>

          <TabsContent value="listings">
            <ListingsTab 
              listings={dashboard.listings}
              loading={dashboard.loading.listings}
              error={dashboard.errors.listings}
              handleListingAction={dashboard.handleListingAction}
              refreshListings={dashboard.refreshListings}
              getQualityScoreColor={dashboard.getQualityScoreColor}
              getRiskLevelColor={dashboard.getRiskLevelColor}
              formatCurrency={dashboard.formatCurrency}
              formatDate={dashboard.formatDate}
              needsReviewCount={dashboard.needsReviewCount}
              averageQualityScore={dashboard.listings.length > 0 
                ? Math.round(dashboard.listings.reduce((sum, l) => sum + (l.quality_score || 50), 0) / dashboard.listings.length)
                : 0}
              totalViews={dashboard.listings.reduce((sum, l) => sum + l.views_count, 0)}
              totalEngagement={dashboard.listings.reduce((sum, l) => sum + l.favorites_count + l.messages_count, 0)}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab 
              dashboardStats={dashboard.dashboardStats}
              weeklyData={dashboard.weeklyData}
              crossStats={dashboard.crossStats}
              cacheInfo={dashboard.cacheInfo}
              diagnostics={dashboard.getDiagnostics()}
              users={dashboard.users}
              listings={dashboard.listings}
              reports={dashboard.reports}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* SECTION DES ALERTES */}
      <div className={`mt-6 ${isMobile ? 'mt-4' : ''}`}>
        <AlertsSection 
          pendingReportsCount={dashboard.pendingCount}
          needsReviewCount={dashboard.needsReviewCount}
          suspendedUsersCount={dashboard.suspendedUsersCount}
          sanctionsExpiringSoon={dashboard.stats.expiringSoon}
          activeSanctionsCount={dashboard.stats.totalActive}
          urgentActionsCount={dashboard.crossStats.urgentActions}
          isLoading={dashboard.globalLoading}
          onNavigateToReports={() => setActiveTab('reports')}
          onNavigateToListings={() => setActiveTab('listings')}
          onNavigateToUsers={() => setActiveTab('users')}
          onNavigateToSanctions={handleNavigateToSanctions}
          onRefreshData={refreshAllData}
        />
      </div>

      {/* INDICATEURS DE SANTÉ */}
      <div className={`mt-6 ${isMobile ? 'mt-4' : ''}`}>
        <HealthIndicators 
          dashboardStats={dashboard.dashboardStats}
          isDataFresh={dashboard.isDataFresh}
          totalElements={dashboard.crossStats.totalElements}
          isLoading={dashboard.globalLoading}
          diagnostics={dashboard.getDiagnostics()}
          cacheEfficiency={dashboard.getDiagnostics().performance.cacheEfficiency}
          lastGlobalRefresh={dashboard.lastGlobalRefresh}
          errors={Object.values(dashboard.errors).filter(Boolean)}
        />
      </div>

      {/* BOUTON SCROLL TO TOP (Mobile) */}
      {isMobile && showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg"
          size="sm"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      {/* INDICATEUR DE CONNECTIVITÉ MOBILE */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 z-40">
          {!navigator.onLine && (
            <div className="bg-red-500 text-white px-3 py-2 rounded-full text-xs flex items-center">
              <WifiOff className="h-3 w-3 mr-2" />
              Hors ligne
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;