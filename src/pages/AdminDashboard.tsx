// pages/AdminDashboard.tsx
// Composant principal qui orchestre tous les sous-composants du dashboard admin

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import des hooks personnalisés
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAdminReports } from '@/hooks/useAdminReports';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminListings } from '@/hooks/useAdminListings';

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

const AdminDashboard = () => {
  // État local pour l'interface
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Hooks pour récupérer les données en temps réel
  const statsHook = useAdminStats();
  const reportsHook = useAdminReports();
  const usersHook = useAdminUsers();
  const listingsHook = useAdminListings();

  // Fonction de rafraîchissement global
  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        statsHook.refreshStats(),
        reportsHook.refreshReports(),
        usersHook.refreshUsers(),
        listingsHook.refreshListings()
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
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
      <DashboardHeader 
        refreshing={refreshing} 
        onRefresh={refreshAllData}
        isDataFresh={statsHook.isDataFresh}
        pendingNotifications={reportsHook.pendingCount}
      />

      {/* Cartes de statistiques principales */}
      <StatsCards 
        dashboardStats={statsHook.dashboardStats}
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

        {/* Chaque onglet est maintenant un composant séparé */}
        <TabsContent value="overview">
          <OverviewTab 
            weeklyData={statsHook.weeklyData}
            categoryData={statsHook.categoryData}
            dashboardStats={statsHook.dashboardStats}
            pendingReportsCount={reportsHook.pendingCount}
            needsReviewCount={listingsHook.needsReviewCount}
            onTabChange={setActiveTab}
          />
        </TabsContent>

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
      />

      {/* Indicateurs de santé de la plateforme */}
      <HealthIndicators 
        dashboardStats={statsHook.dashboardStats}
        isDataFresh={statsHook.isDataFresh}
        totalElements={
          usersHook.users.length + 
          listingsHook.listings.length + 
          reportsHook.reports.length
        }
        isLoading={
          statsHook.loading || 
          reportsHook.loading || 
          usersHook.loading || 
          listingsHook.loading
        }
      />
    </div>
  );
};

export default AdminDashboard;