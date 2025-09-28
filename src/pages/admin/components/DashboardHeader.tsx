// pages/admin/components/DashboardHeader.tsx

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Bell, Menu, X, Smartphone, Monitor, Settings } from "lucide-react";

// Hook de détection responsive réutilisé (cohérent avec OverviewTab)
const useResponsiveBreakpoint = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

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

// Interface 
interface DashboardHeaderProps {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  isDataFresh: boolean;
  pendingNotifications: number;
}

/**
 * Composant mobile compact pour le header
 * Priorité aux actions critiques : refresh et notifications
 */
const MobileHeader: React.FC<{
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  isDataFresh: boolean;
  pendingNotifications: number;
  onMenuToggle?: () => void;
}> = ({ 
  refreshing, 
  onRefresh, 
  isDataFresh, 
  pendingNotifications,
  onMenuToggle 
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        {/* Ligne principale mobile : titre compact + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {onMenuToggle && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onMenuToggle}
                className="p-1 h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                FasoMarket Admin
              </h1>
              <div className="flex items-center space-x-2">
                {isDataFresh && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    Live
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions mobiles optimisées */}
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 h-8 w-8"
              title={refreshing ? 'Actualisation en cours...' : 'Actualiser les données'}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button 
              variant="ghost"
              size="sm" 
              className="relative p-2 h-8 w-8"
              title={`${pendingNotifications} notifications en attente`}
            >
              <Bell className="h-4 w-4" />
              {pendingNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {pendingNotifications > 9 ? '9+' : pendingNotifications}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Indicateur d'état mobile (conditionnel) */}
        {(refreshing || !isDataFresh) && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className={refreshing ? "text-blue-600" : "text-orange-600"}>
                {refreshing ? "Synchronisation en cours..." : "Données à actualiser"}
              </span>
              {!refreshing && !isDataFresh && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onRefresh}
                  className="text-xs h-6 px-2"
                >
                  Actualiser
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Composant tablette - Version intermédiaire entre mobile et desktop
 * Conserve plus d'informations que mobile, moins que desktop
 */
const TabletHeader: React.FC<{
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  isDataFresh: boolean;
  pendingNotifications: number;
}> = ({ refreshing, onRefresh, isDataFresh, pendingNotifications }) => {
  return (
    <div className="mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Administration FasoMarket
                </h1>
                {isDataFresh && (
                  <Badge variant="secondary" className="px-3 py-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Données en temps réel
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Centre de contrôle marketplace</span>
                <span>•</span>
                <span>Sync: {new Date().toLocaleTimeString('fr-FR')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={onRefresh}
                disabled={refreshing}
                className="relative"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>
              
              <Button className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Notifications 
                {pendingNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {pendingNotifications > 99 ? '99+' : pendingNotifications}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Composant principal adaptatif DashboardHeader
 * Détecte automatiquement le contexte et affiche la version appropriée
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  refreshing,
  onRefresh,
  isDataFresh,
  pendingNotifications
}) => {
  
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsiveBreakpoint();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  /**
   * Fonction d'actualisation enrichie avec feedback utilisateur
   * Conserve la logique originale tout en ajoutant des améliorations UX
   */
  const handleRefresh = async () => {
    try {
      await onRefresh();
      
      // Feedback tactile léger sur mobile (si supporté)
      if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      
    }
  };

  // Rendu mobile : Interface compacte et tactile
  if (isMobile) {
    return (
      <>
        <MobileHeader
          refreshing={refreshing}
          onRefresh={handleRefresh}
          isDataFresh={isDataFresh}
          pendingNotifications={pendingNotifications}
          onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
        />

        {/* Menu mobile développé (optionnel) */}
        {showMobileMenu && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Informations détaillées</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Plateforme:</span>
                  <Badge variant="outline" className="text-xs">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Mobile ({breakpoint})
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Marketplace:</span>
                  <span className="font-medium">Burkina Faso</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dernière sync:</span>
                  <span className="font-mono text-xs">
                    {new Date().toLocaleString('fr-FR')}
                  </span>
                </div>
                {!isDataFresh && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center text-orange-600 text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      <span>Les données nécessitent une actualisation</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  // Rendu tablette : Interface intermédiaire équilibrée
  if (isTablet) {
    return (
      <TabletHeader
        refreshing={refreshing}
        onRefresh={handleRefresh}
        isDataFresh={isDataFresh}
        pendingNotifications={pendingNotifications}
      />
    );
  }

  // Rendu desktop : Interface originale complète avec améliorations subtiles
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Administration FasoMarket
            </h1>
            {isDataFresh && (
              <Badge variant="secondary" className="px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Données en temps réel
              </Badge>
            )}
            {/* Indicateur de mode desktop pour cohérence */}
            <Badge variant="outline" className="text-xs">
              <Monitor className="h-3 w-3 mr-1" />
              Desktop
            </Badge>
          </div>
          
          <p className="text-gray-600 mb-1">
            Centre de contrôle et modération de la marketplace burkinabé
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              Dernière synchronisation : {new Date().toLocaleTimeString('fr-FR')}
            </span>
            {!isDataFresh && (
              <>
                <span>•</span>
                <span className="text-orange-600 font-medium">
                  Actualisation recommandée
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="relative hover:shadow-md transition-shadow"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
            {/* Indicateur de statut subtil */}
            {!isDataFresh && !refreshing && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
            )}
          </Button>
          
          <Button className="relative hover:shadow-md transition-shadow">
            <Bell className="h-4 w-4 mr-2" />
            Notifications 
            {pendingNotifications > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                {pendingNotifications > 99 ? '99+' : pendingNotifications}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Barre de statut desktop enrichie (si données non fraîches) */}
      {!isDataFresh && !refreshing && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-orange-800">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Les données du dashboard nécessitent une actualisation
                </span>
              </div>
              <Button 
                size="sm"
                onClick={handleRefresh}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Actualiser maintenant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardHeader;