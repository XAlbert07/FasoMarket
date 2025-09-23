// pages/admin/components/ReportsTab.tsx
// Version migrée pour useAdminDashboard - Props adaptées au hook centralisé

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, CheckCircle, XCircle, AlertTriangle, Clock, User, Package, 
  RefreshCw, Search, Filter, ChevronDown, Settings, Activity
} from "lucide-react";

import ReportActionModal from './ReportActionModal';

// Interface mise à jour pour correspondre aux props du hook centralisé
interface ReportsTabProps {
  // Données principales du hook centralisé
  reports: any[];
  loading: boolean;
  error: string | null;
  
  // Actions du hook centralisé
  handleReportAction: (id: string, action: any) => Promise<boolean>;
  refreshReports: () => Promise<void>;
  
  // Statistiques calculées par le hook centralisé
  pendingCount: number;
  
  // Fonctions utilitaires du hook centralisé
  getPriorityColor: (priority: string) => string;
  formatResponseTime: (hours: number) => string;
  formatDate: (date: string) => string;
  
  // Nouvelles propriétés disponibles dans le hook centralisé
  totalReports?: number;
  averageResponseTime?: number;
}

const ReportsTab: React.FC<ReportsTabProps> = ({
  reports,
  loading,
  error,
  handleReportAction,
  refreshReports,
  pendingCount,
  getPriorityColor,
  formatResponseTime,
  formatDate,
  totalReports = 0,
  averageResponseTime = 0
}) => {
  // États de l'interface utilisateur - logique préservée
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fonction pour déterminer l'urgence - logique métier préservée
  const getUrgencyLevel = (report: any) => {
    const hoursElapsed = report.response_time_hours || 0;
    const priority = report.priority;
    
    if (priority === 'high' && hoursElapsed > 24) return 'critical';
    if (priority === 'high' && hoursElapsed > 12) return 'urgent';  
    if (priority === 'medium' && hoursElapsed > 48) return 'delayed';
    if (hoursElapsed > 72) return 'overdue';
    return 'normal';
  };

  // Fonction pour colorer l'urgence - logique préservée
  const getUrgencyColor = (urgency: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-300',
      urgent: 'bg-orange-100 text-orange-700 border-orange-300',
      delayed: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      overdue: 'bg-purple-100 text-purple-700 border-purple-300',
      normal: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[urgency as keyof typeof colors] || colors.normal;
  };

  // Filtrage optimisé avec mémoisation - logique préservée mais adaptée aux données du hook
  const filteredReports = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    
    return reports.filter(report => {
      const matchesSearch = !searchTerm || 
        report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.listing_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reported_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || report.status === filterStatus;
      const matchesPriority = filterPriority === "all" || report.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      // Tri par priorité puis par date (plus récents d'abord) - logique préservée
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reports, searchTerm, filterStatus, filterPriority]);

  // Statistiques calculées - adaptées aux données du hook centralisé
  const stats = useMemo(() => {
    const safeReports = Array.isArray(reports) ? reports : [];
    const total = safeReports.length;
    const pending = safeReports.filter(r => r.status === 'pending').length;
    const resolved = safeReports.filter(r => r.status === 'resolved').length;
    const dismissed = safeReports.filter(r => r.status === 'dismissed').length;
    const inReview = safeReports.filter(r => r.status === 'in_review').length;
    const critical = safeReports.filter(r => getUrgencyLevel(r) === 'critical').length;
    
    // Utilise la moyenne du hook centralisé si disponible, sinon calcule localement
    const avgResponseTime = averageResponseTime > 0 
      ? averageResponseTime
      : total > 0 
        ? safeReports.reduce((sum, r) => sum + (r.response_time_hours || 0), 0) / total 
        : 0;
    
    const resolutionRate = total > 0 
      ? ((resolved + dismissed) / total) * 100 
      : 0;

    return {
      total,
      pending,
      resolved,
      dismissed,
      inReview,
      critical,
      avgResponseTime,
      resolutionRate
    };
  }, [reports, averageResponseTime]);

  // Gestionnaire de rafraîchissement - utilise la fonction du hook centralisé
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshReports();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des signalements:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Action rapide - utilise la fonction du hook centralisé
  const handleQuickAction = async (reportId: string, actionType: string, reason: string) => {
    try {
      await handleReportAction(reportId, {
        type: actionType,
        reason
      });
    } catch (error) {
      console.error('Erreur lors de l\'action rapide:', error);
    }
  };

  // Gestionnaires de modales - logique préservée
  const openDetailModal = (report: any) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const openActionModal = (report: any) => {
    setSelectedReport(report);
    setShowActionModal(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterPriority("all");
  };

  // Gestion des erreurs - nouvelle fonctionnalité du hook centralisé
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <div>
            <p className="text-lg font-medium text-gray-900">Erreur de chargement</p>
            <p className="text-sm text-gray-600">Impossible de charger les signalements</p>
            <p className="text-xs text-red-600 mt-2">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (loading && stats.total === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* En-tête avec informations d'état du hook centralisé */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Signalements</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestion et modération des signalements utilisateurs
          </p>
          {loading && (
            <p className="text-xs text-blue-600 mt-1">
              Actualisation en cours...
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </span>
          </Button>
          
          <Button 
            onClick={resetFilters} 
            variant="ghost" 
            size="sm"
            className="text-xs sm:text-sm"
          >
            <Filter className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Indicateurs de performance - Données du hook centralisé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-xs sm:text-sm text-gray-600">En attente</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs sm:text-sm text-gray-600">Critiques</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-xs sm:text-sm text-gray-600">Résolus</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.resolutionRate.toFixed(0)}%</div>
              <div className="text-xs sm:text-sm text-gray-600">Taux résolution</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-purple-600">{stats.avgResponseTime.toFixed(1)}h</div>
              <div className="text-xs sm:text-sm text-gray-600">Temps moy.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres - Interface préservée */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Rechercher par motif, ID, utilisateur..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous ({stats.total})</SelectItem>
                    <SelectItem value="pending">En attente ({stats.pending})</SelectItem>
                    <SelectItem value="in_review">En cours ({stats.inReview})</SelectItem>
                    <SelectItem value="resolved">Résolus ({stats.resolved})</SelectItem>
                    <SelectItem value="dismissed">Rejetés ({stats.dismissed})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Toutes priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Résumé des filtres actifs */}
            {(searchTerm || filterStatus !== "all" || filterPriority !== "all") && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span>Filtres:</span>
                {searchTerm && <Badge variant="secondary">"{searchTerm}"</Badge>}
                {filterStatus !== "all" && <Badge variant="secondary">Statut: {filterStatus}</Badge>}
                {filterPriority !== "all" && <Badge variant="secondary">Priorité: {filterPriority}</Badge>}
                <span>→ {filteredReports.length} résultat(s)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des signalements */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">
              Signalements ({filteredReports.length})
            </CardTitle>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Temps réel</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 px-4">
              <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-2">Aucun signalement trouvé</h3>
              <p className="text-sm text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all" || filterPriority !== "all"
                  ? "Aucun signalement ne correspond aux critères actuels."
                  : "Aucun signalement n'est disponible pour le moment."
                }
              </p>
              {(searchTerm || filterStatus !== "all" || filterPriority !== "all") && (
                <Button onClick={resetFilters} variant="outline" size="sm">
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Vue mobile - Cards */}
              <div className="sm:hidden space-y-3 p-4">
                {filteredReports.map((report) => {
                  const urgency = getUrgencyLevel(report);
                  const urgencyColor = getUrgencyColor(urgency);
                  
                  return (
                    <Card key={report.id} className={`${report.priority === 'high' ? 'border-red-200 bg-red-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* En-tête mobile */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              {report.report_type === 'listing' ? 
                                <Package className="h-4 w-4 text-blue-500" /> : 
                                <User className="h-4 w-4 text-gray-500" />
                              }
                              <Badge variant="outline" className="text-xs">
                                {report.report_type === 'listing' ? 'Annonce' : 'Profil'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatResponseTime(report.response_time_hours || 0)}
                            </div>
                          </div>

                          {/* Informations principales */}
                          <div>
                            <p className="font-medium text-sm truncate">
                              {report.listing_title || report.reported_user_name || 'Cible inconnue'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Motif: {report.reason}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Par {report.reporter_name || 'Anonyme'}
                            </p>
                          </div>

                          {/* Badges de statut */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                              {report.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                              report.status === 'resolved' ? 'bg-green-100 text-green-600' :
                              report.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {report.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${urgencyColor}`}>
                              {urgency === 'critical' ? 'Critique' : 
                               urgency === 'urgent' ? 'Urgent' :
                               urgency === 'normal' ? 'Normal' : urgency}
                            </span>
                          </div>

                          {/* Actions mobiles */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDetailModal(report)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Détails
                            </Button>
                            
                            {report.status === 'pending' && (
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleQuickAction(report.id, 'approve', 'Signalement approuvé')}
                                  className="text-xs text-green-600"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleQuickAction(report.id, 'dismiss', 'Signalement rejeté')}
                                  className="text-xs text-red-600"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openActionModal(report)}
                                  className="text-xs"
                                >
                                  <Settings className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Vue desktop - Tableau */}
              <div className="hidden sm:block">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Type</TableHead>
                        <TableHead className="min-w-[180px]">Cible</TableHead>
                        <TableHead className="min-w-[120px]">Motif</TableHead>
                        <TableHead className="w-[120px]">Signalé par</TableHead>
                        <TableHead className="w-[90px]">Priorité</TableHead>
                        <TableHead className="w-[90px]">Statut</TableHead>
                        <TableHead className="w-[80px]">Urgence</TableHead>
                        <TableHead className="w-[80px]">Temps</TableHead>
                        <TableHead className="w-[160px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => {
                        const urgency = getUrgencyLevel(report);
                        const urgencyColor = getUrgencyColor(urgency);
                        
                        return (
                          <TableRow 
                            key={report.id} 
                            className={`${report.priority === 'high' ? 'bg-red-50' : ''} hover:bg-gray-50`}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                {report.report_type === 'listing' ? 
                                  <Package className="h-4 w-4 text-blue-500" /> : 
                                  <User className="h-4 w-4 text-gray-500" />
                                }
                                <Badge variant="outline" className="text-xs">
                                  {report.report_type === 'listing' ? 'Annonce' : 'Profil'}
                                </Badge>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm truncate max-w-[160px]">
                                  {report.listing_title || report.reported_user_name || 'Cible inconnue'}
                                </p>
                                <p className="text-xs text-gray-500">ID: {report.id.slice(-8)}</p>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <p className="text-sm truncate max-w-[100px]" title={report.reason}>
                                {report.reason}
                              </p>
                            </TableCell>
                            
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm truncate max-w-[100px]">
                                  {report.reporter_name || 'Anonyme'}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {report.reporter_type === 'guest' ? 'Invité' : 'Inscrit'}
                                </Badge>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                                {report.priority}
                              </span>
                            </TableCell>
                            
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                report.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                report.status === 'resolved' ? 'bg-green-100 text-green-600' :
                                report.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                {report.status}
                              </span>
                            </TableCell>
                            
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${urgencyColor}`}>
                                {urgency === 'critical' ? 'Critique' : 
                                 urgency === 'urgent' ? 'Urgent' :
                                 urgency === 'normal' ? 'Normal' : urgency}
                              </span>
                            </TableCell>
                            
                            <TableCell className="text-xs">
                              {formatResponseTime(report.response_time_hours || 0)}
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openDetailModal(report)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                
                                {report.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleQuickAction(report.id, 'approve', 'Signalement approuvé')}
                                      className="h-7 w-7 p-0"
                                      title="Approuver"
                                    >
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                    </Button>
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleQuickAction(report.id, 'dismiss', 'Signalement rejeté')}
                                      className="h-7 w-7 p-0"
                                      title="Rejeter"
                                    >
                                      <XCircle className="h-3 w-3 text-red-600" />
                                    </Button>
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => openActionModal(report)}
                                      className="h-7 w-7 p-0"
                                      title="Actions avancées"
                                    >
                                      <Settings className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de détail - Interface préservée mais adaptée */}
      <AlertDialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <span>Signalement #{selectedReport?.id?.slice(-8)}</span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              {/* Informations principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Cible</Label>
                  <p className="text-sm mt-1 font-semibold">
                    {selectedReport.listing_title || selectedReport.reported_user_name || 'Cible inconnue'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedReport.report_type === 'listing' ? 'Annonce' : 'Profil'}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Priorité</Label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getPriorityColor(selectedReport.priority)}`}>
                    {selectedReport.priority}
                  </span>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    selectedReport.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                    selectedReport.status === 'resolved' ? 'bg-green-100 text-green-600' :
                    selectedReport.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              {/* Motif */}
              <div>
                <Label className="text-sm font-medium">Motif du signalement</Label>
                <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">{selectedReport.reason}</p>
                </div>
              </div>

              {/* Description si présente */}
              {selectedReport.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Informations du signaleur */}
              <div>
                <Label className="text-sm font-medium">Signalé par</Label>
                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{selectedReport.reporter_name || 'Anonyme'}</p>
                    <Badge variant="outline">
                      {selectedReport.reporter_type === 'guest' ? 'Invité' : 'Utilisateur inscrit'}
                    </Badge>
                  </div>
                  {selectedReport.reporter_email && (
                    <p className="text-xs text-gray-600 mt-1">{selectedReport.reporter_email}</p>
                  )}
                </div>
              </div>

              {/* Informations temporelles - utilise formatDate du hook */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date de signalement</Label>
                  <p className="text-sm mt-1">
                    {formatDate(selectedReport.created_at)}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Temps écoulé</Label>
                  <p className="text-sm mt-1">
                    {formatResponseTime(selectedReport.response_time_hours || 0)}
                  </p>
                </div>
              </div>

              {/* Actions rapides dans le modal */}
              {selectedReport.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={() => {
                      handleQuickAction(selectedReport.id, 'approve', 'Signalement approuvé après examen');
                      setShowDetailModal(false);
                    }}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      handleQuickAction(selectedReport.id, 'dismiss', 'Signalement rejeté après examen');
                      setShowDetailModal(false);
                    }}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setShowDetailModal(false);
                      openActionModal(selectedReport);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Actions avancées
                  </Button>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDetailModal(false)}>
              Fermer
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal d'actions avancées - utilise les actions du hook centralisé */}
      {selectedReport && (
        <ReportActionModal
          report={selectedReport}
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setSelectedReport(null);
          }}
          onAction={handleReportAction}
        />
      )}
    </div>
  );
};

export default ReportsTab;