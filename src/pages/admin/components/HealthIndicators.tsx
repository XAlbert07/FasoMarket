import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertCircle, Clock, Shield, Users, Wifi } from "lucide-react";

interface HealthIndicatorsProps {
  dashboardStats: any;
  isDataFresh: boolean;
  totalElements: number;
  isLoading: boolean;
  diagnostics?: {
    dataFreshness: Record<string, number | null>;
    systemHealth: {
      hasErrors: boolean;
      errorCount: number;
      loadingCount: number;
      totalSections: number;
    };
    performance: {
      lastGlobalRefresh: string | null;
      refreshAge: number | null;
      cacheEfficiency: number;
    };
  };
  cacheEfficiency?: number;
  lastGlobalRefresh?: string | null;
  errors?: string[];
}

const HealthIndicators: React.FC<HealthIndicatorsProps> = ({
  dashboardStats,
  isDataFresh,
  totalElements,
  isLoading,
  diagnostics,
  cacheEfficiency = 0,
  lastGlobalRefresh,
  errors = []
}) => {
  const pendingReports = dashboardStats?.activeReports || 0;
  const resolutionRate = dashboardStats?.qualityMetrics?.reportResolutionRate || 0;
  const approvalRate = dashboardStats?.qualityMetrics?.approvedListingsRate || 0;
  const averageRating = dashboardStats?.averageRating || 0;
  const responseTime = dashboardStats?.qualityMetrics?.averageResponseTime || 0;

  return (
    <div className="space-y-4 mt-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            État opérationnel
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Signalements en attente</p>
            <p className="text-xl font-semibold">{pendingReports}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Éléments suivis</p>
            <p className="text-xl font-semibold">{totalElements.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Synchronisation</p>
            <p className="text-xl font-semibold">{isDataFresh ? 'OK' : 'En retard'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Erreurs techniques</p>
            <p className="text-xl font-semibold">{errors.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Qualité service
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Résolution signalements</p>
            <p className="text-xl font-semibold">{resolutionRate.toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Approbation annonces</p>
            <p className="text-xl font-semibold">{approvalRate.toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Note moyenne</p>
            <p className="text-xl font-semibold">{averageRating.toFixed(1)}/5</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Temps de réponse</p>
            <p className="text-xl font-semibold">{responseTime.toFixed(1)}h</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Diagnostic système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cache efficacité</span>
            <span className="font-medium">{cacheEfficiency.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Sections en erreur</span>
            <span className="font-medium">{diagnostics?.systemHealth?.errorCount ?? 0}/{diagnostics?.systemHealth?.totalSections ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Chargements actifs</span>
            <span className="font-medium">{isLoading ? (diagnostics?.systemHealth?.loadingCount ?? 1) : 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><Wifi className="h-3 w-3" /> Dernière sync</span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastGlobalRefresh
                ? new Date(lastGlobalRefresh).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : 'Jamais'}
            </span>
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Erreurs détectées</p>
                <ul className="mt-1 text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthIndicators;
