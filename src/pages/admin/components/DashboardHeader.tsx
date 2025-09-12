// pages/admin/components/DashboardHeader.tsx
// Header principal du dashboard avec titre, indicateurs et actions globales

import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell } from "lucide-react";

interface DashboardHeaderProps {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  isDataFresh: boolean;
  pendingNotifications: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  refreshing,
  onRefresh,
  isDataFresh,
  pendingNotifications
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administration FasoMarket
            {isDataFresh && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                Données en temps réel
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            Centre de contrôle et modération de la marketplace burkinabé
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Dernière synchronisation : {new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex space-x-2">
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
    </div>
  );
};

export default DashboardHeader;