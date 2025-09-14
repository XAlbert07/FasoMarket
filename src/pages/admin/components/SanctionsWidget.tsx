// components/admin/SanctionsWidget.tsx
// Widget compact pour affichage rapide des sanctions dans le dashboard principal

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, User, Package, Timer, Ban, AlertTriangle, 
  TrendingDown, Calendar, Activity, ArrowRight 
} from "lucide-react";

interface SanctionsWidgetProps {
  stats: {
    totalActive: number;
    userSanctions: number;
    listingSanctions: number;
    temporaryCount: number;
    permanentCount: number;
    expiringSoon: number;
  };
  recentSanctions?: Array<{
    id: string;
    type: 'user' | 'listing';
    target_name: string;
    sanction_type: string;
    days_remaining: number | null;
    created_at: string;
  }>;
  onOpenSanctionsModal: () => void;
  loading?: boolean;
}

const SanctionsWidget: React.FC<SanctionsWidgetProps> = ({
  stats,
  recentSanctions = [],
  onOpenSanctionsModal,
  loading = false
}) => {
  // Calcul du pourcentage de sanctions temporaires
  const temporaryPercentage = stats.totalActive > 0 
    ? Math.round((stats.temporaryCount / stats.totalActive) * 100) 
    : 0;

  // Déterminer le niveau de criticité
  const getCriticalityLevel = () => {
    if (stats.expiringSoon > 5) return 'critical';
    if (stats.totalActive > 20) return 'high';
    if (stats.totalActive > 10) return 'medium';
    return 'low';
  };

  const criticalityLevel = getCriticalityLevel();
  
  const criticalityColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-green-500 bg-green-50'
  };

  const criticalityTextColors = {
    critical: 'text-red-700',
    high: 'text-orange-700',
    medium: 'text-yellow-700',
    low: 'text-green-700'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Sanctions actives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${criticalityColors[criticalityLevel]} border-2`}>
      <CardHeader className="pb-4">
        <CardTitle className={`text-lg ${criticalityTextColors[criticalityLevel]} flex items-center justify-between`}>
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Sanctions actives
          </div>
          {stats.totalActive > 0 && (
            <Badge className={`${
              criticalityLevel === 'critical' ? 'bg-red-600' :
              criticalityLevel === 'high' ? 'bg-orange-600' :
              criticalityLevel === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
            } text-white`}>
              {stats.totalActive}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {stats.totalActive === 0 ? (
          // État "aucune sanction"
          <div className="text-center py-4">
            <Activity className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-green-800 mb-1">Système sain</h3>
            <p className="text-xs text-green-600">Aucune sanction active</p>
          </div>
        ) : (
          <>
            {/* Vue d'ensemble rapide */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <User className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm font-medium text-gray-700">Utilisateurs</span>
                </div>
                <p className="text-xl font-bold text-purple-600">{stats.userSanctions}</p>
              </div>
              
              <div className="text-center p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Package className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm font-medium text-gray-700">Annonces</span>
                </div>
                <p className="text-xl font-bold text-green-600">{stats.listingSanctions}</p>
              </div>
            </div>

            {/* Répartition temporaire/permanent */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Sanctions temporaires</span>
                <span className="font-medium">{stats.temporaryCount}/{stats.totalActive}</span>
              </div>
              
              <Progress value={temporaryPercentage} className="h-2" />
              
              <div className="flex justify-between text-xs text-gray-600">
                <span>Temporaires: {temporaryPercentage}%</span>
                <span>Permanentes: {stats.permanentCount}</span>
              </div>
            </div>

            {/* Alertes critiques */}
            {stats.expiringSoon > 0 && (
              <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                  <span className="text-sm font-medium text-orange-800">
                    {stats.expiringSoon} sanction(s) expire(nt) bientôt
                  </span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Action requise dans les 24h
                </p>
              </div>
            )}

            {/* Sanctions récentes */}
            {recentSanctions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Récentes
                </h4>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentSanctions.slice(0, 3).map((sanction) => (
                    <div key={sanction.id} className="flex items-center justify-between p-2 bg-white/50 rounded text-xs">
                      <div className="flex items-center space-x-2">
                        {sanction.type === 'user' ? (
                          <User className="h-3 w-3 text-purple-500" />
                        ) : (
                          <Package className="h-3 w-3 text-green-500" />
                        )}
                        <span className="font-medium truncate max-w-24" title={sanction.target_name}>
                          {sanction.target_name}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {sanction.sanction_type}
                        </Badge>
                        {sanction.days_remaining !== null && (
                          <span className={`text-xs ${
                            sanction.days_remaining <= 1 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {sanction.days_remaining}j
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions rapides */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-600">
            {stats.totalActive > 0 ? (
              <>
                <TrendingDown className="h-3 w-3 mr-1" />
                <span>Nécessite attention</span>
              </>
            ) : (
              <>
                <Activity className="h-3 w-3 mr-1" />
                <span>Situation normale</span>
              </>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onOpenSanctionsModal}
            className="flex items-center"
          >
            <span className="text-xs">Gérer</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SanctionsWidget;