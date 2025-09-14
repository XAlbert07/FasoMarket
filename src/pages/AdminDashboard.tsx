// pages/AdminDashboard.tsx
// Composant principal qui orchestre tous les sous-composants du dashboard admin
// VERSION CORRIGÉE avec navigation vers page dédiée des sanctions

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { useNavigate } from 'react-router-dom'; // Import pour la navigation

// Import des hooks personnalisés
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAdminReports } from '@/hooks/useAdminReports';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminListings } from '@/hooks/useAdminListings';
import { useAdminSanctions } from '@/hooks/useAdminSanctions';

// Import des composants modulaires
import DashboardHeader from '@/pages/admin/components/DashboardHeader';
import StatsCards from '@/pages/admin/components/StatsCards';
import OverviewTab from '@/pages/admin/components/ OverviewTab';
import ReportsTab from '@/pages/admin/components/ReportsTab';
import UsersTab from '@/pages/admin/components/UsersTab';
import ListingsTab from '@/pages/admin/components/ListingsTab';
import AnalyticsTab from '@/pages/admin/components/AnalyticsTab';
import AlertsSection from '@/pages/admin/components/AlertsSection';
import HealthIndicators from '@/pages/admin/components/HealthIndicators';

// SUPPRIMÉ : Import de SanctionsManagementModal (plus nécessaire)
// SUPPRIMÉ : Import de SanctionsWidget (n'existe pas encore)

const AdminDashboard = () => {
  // Hook de navigation pour React Router
  const navigate = useNavigate();

  // État local pour l'interface
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  
  // SUPPRIMÉ : État pour le modal des sanctions (plus nécessaire)
  // const [showSanctionsModal, setShowSanctionsModal] = useState(false);

  // Hooks pour récupérer les données en temps réel
  const statsHook = useAdminStats();
  const reportsHook = useAdminReports();
  const usersHook = useAdminUsers();
  const listingsHook = useAdminListings();
  const sanctionsHook = useAdminSanctions();

  // Fonction de rafraîchissement global
  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        statsHook.refreshStats(),
        reportsHook.refreshReports(),
        usersHook.refreshUsers(),
        listingsHook.refreshListings(),
        sanctionsHook.refreshSanctions()
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  // SUPPRIMÉ : Gestionnaire pour ouvrir le modal (remplacé par navigation)
  // const handleOpenSanctionsModal = () => setShowSanctionsModal(true);

  // Gestionnaire pour naviguer vers la page des sanctions
  const handleNavigateToSanctions = () => {
    navigate('/sanctions');
  };

  // Vérification du chargement initial
  if (statsHook.loading && !statsHook.dashboardStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord FasoMarket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header avec titre et actions globales */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
          <p className="text-gray-600 mt-1">
            Gestion et supervision de la marketplace FasoMarket
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Bouton de rafraîchissement */}
          <Button 
            onClick={refreshAllData} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>

          {/* CORRIGÉ : Bouton pour naviguer vers la page de gestion des sanctions */}
          <Button
            onClick={handleNavigateToSanctions}
            variant="outline"
            size="sm"
            className={`relative cursor-pointer transition-all duration-200 ${
              sanctionsHook.stats.totalActive > 0 
                ? 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 shadow-sm' 
                : 'hover:bg-gray-50'
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            Sanctions actives
            {sanctionsHook.stats.totalActive > 0 && (
              <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white text-xs transition-colors">
                {sanctionsHook.stats.totalActive}
              </Badge>
            )}
          </Button>

          {/* Badge d'alertes critiques pour sanctions expirant bientôt */}
          {sanctionsHook.stats.expiringSoon > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              {sanctionsHook.stats.expiringSoon} sanction(s) expire(nt) bientôt !
            </Badge>
          )}

          {/* Indicateur de notifications pour signalements */}
          {reportsHook.pendingCount > 0 && (
            <Badge className="bg-blue-600 text-white">
              {reportsHook.pendingCount} signalement(s) en attente
            </Badge>
          )}
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <StatsCards 
        dashboardStats={statsHook.dashboardStats}
        sanctionsStats={sanctionsHook.stats}
        formatCurrency={statsHook.formatCurrency}
      />

      {/* Interface principale avec onglets modulaires */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="reports">
            Signalements ({reportsHook.pendingCount})
          </TabsTrigger>
          <TabsTrigger value="users">
            Utilisateurs ({usersHook.activeUsersCount})
          </TabsTrigger>
          <TabsTrigger value="listings">
            Annonces ({listingsHook.needsReviewCount} à réviser)
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'ensemble */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Colonne principale - 3/4 de la largeur */}
            <div className="lg:col-span-3 space-y-6">
              <OverviewTab 
                weeklyData={statsHook.weeklyData}
                categoryData={statsHook.categoryData}
                dashboardStats={statsHook.dashboardStats}
                pendingReportsCount={reportsHook.pendingCount}
                needsReviewCount={listingsHook.needsReviewCount}
                onTabChange={setActiveTab}
              />
            </div>
            
            {/* Sidebar - 1/4 de la largeur */}
            <div className="lg:col-span-1 space-y-6">
              {/* TEMPORAIRE : Widget simple des sanctions en attendant SanctionsWidget */}
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
                      {sanctionsHook.stats.totalActive}
                    </div>
                    <div className="text-xs text-gray-600">Actives</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-bold text-red-600">
                      {sanctionsHook.stats.expiringSoon}
                    </div>
                    <div className="text-xs text-gray-600">Expirent</div>
                  </div>
                </div>
                
                {sanctionsHook.loading && (
                  <div className="text-center text-xs text-gray-500">
                    Chargement...
                  </div>
                )}
              </div>
              
              {/* Autres widgets peuvent être ajoutés ici */}
            </div>
          </div>
        </TabsContent>

        {/* Autres onglets inchangés */}
        <TabsContent value="reports">
          <ReportsTab {...reportsHook} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab {...usersHook} />
        </TabsContent>

        <TabsContent value="listings">
          <ListingsTab {...listingsHook} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab 
            dashboardStats={statsHook.dashboardStats}
            weeklyData={statsHook.weeklyData}
          />
        </TabsContent>
      </Tabs>

      {/* Section des alertes importantes */}
      <AlertsSection 
        pendingReportsCount={reportsHook.pendingCount}
        needsReviewCount={listingsHook.needsReviewCount}
        suspendedUsersCount={usersHook.suspendedUsersCount}
        sanctionsExpiringSoon={sanctionsHook.expiringSoonCount}
        activeSanctionsCount={sanctionsHook.activeSanctionsCount}
        onNavigateToSanctions={handleNavigateToSanctions} // CORRIGÉ : Fonction de navigation
      />

      {/* Indicateurs de santé de la plateforme */}
      <HealthIndicators 
        dashboardStats={statsHook.dashboardStats}
        isDataFresh={statsHook.isDataFresh}
        totalElements={
          usersHook.users.length + 
          listingsHook.listings.length + 
          reportsHook.reports.length +
          sanctionsHook.sanctions.length
        }
        isLoading={
          statsHook.loading || 
          reportsHook.loading || 
          usersHook.loading || 
          listingsHook.loading ||
          sanctionsHook.loading
        }
      />

      {/* SUPPRIMÉ : Modal de gestion des sanctions */}
      {/* Plus de SanctionsManagementModal ici car on navigue vers une page dédiée */}
    </div>
  );
};

export default AdminDashboard;