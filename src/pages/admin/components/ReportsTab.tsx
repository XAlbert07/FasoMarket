// pages/admin/components/ReportsTab.tsx
// Version complète avec actions administratives avancées

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, CheckCircle, XCircle, AlertTriangle, Clock, User, Package, Shield, 
  Ban, FileX, AlertCircle, Settings, Filter, RefreshCw, Download,
  ChevronDown, ChevronUp, Search, Calendar, TrendingUp, Activity
} from "lucide-react";

// Import du modal d'actions (composant séparé que vous avez déjà)
import ReportActionModal from './ReportActionModal';

interface ReportsTabProps {
  reports: any[];
  loading: boolean;
  handleReportAction: (id: string, action: any) => Promise<boolean>;
  pendingCount: number;
  highPriorityCount: number;
  overdueCount: number;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  formatResponseTime: (hours: number) => string;
  refreshReports: () => Promise<void>;
}

const ReportsTab: React.FC<ReportsTabProps> = ({
  reports,
  loading,
  handleReportAction,
  pendingCount,
  highPriorityCount, 
  overdueCount,
  getPriorityColor,
  getStatusColor,
  formatResponseTime,
  refreshReports
}) => {
  // États pour les filtres et la recherche
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // États pour les modales et actions
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // État pour l'affichage (liste ou grille)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Fonction utilitaire pour déterminer le niveau d'urgence
  const getUrgencyLevel = (report: any) => {
    const hours = report.response_time_hours || 0;
    
    if (report.priority === 'high' && hours > 24) return 'critical';
    if (report.priority === 'high' && hours > 12) return 'urgent';
    if (report.priority === 'medium' && hours > 48) return 'delayed';
    if (hours > 72) return 'overdue';
    return 'normal';
  };

  // Fonction utilitaire pour obtenir la couleur de l'urgence
  const getUrgencyColor = (urgency: string) => {
    const colors = {
      critical: 'text-red-600 bg-red-100 border-red-200',
      urgent: 'text-orange-600 bg-orange-100 border-orange-200',
      delayed: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      overdue: 'text-purple-600 bg-purple-100 border-purple-200',
      normal: 'text-gray-600 bg-gray-100 border-gray-200'
    };
    return colors[urgency as keyof typeof colors] || colors.normal;
  };

  // Calcul des rapports filtrés avec mémoisation pour les performances
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports.filter(report => {
      // Filtre par statut
      const matchesStatus = filterStatus === "all" || report.status === filterStatus;
      
      // Filtre par type
      const matchesType = filterType === "all" || report.report_type === filterType;
      
      // Filtre par priorité
      const matchesPriority = filterPriority === "all" || report.priority === filterPriority;
      
      // Filtre par urgence
      const urgency = getUrgencyLevel(report);
      const matchesUrgency = filterUrgency === "all" || urgency === filterUrgency;
      
      // Filtre par recherche textuelle
      const matchesSearch = !searchTerm || 
        report.listing_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reported_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesType && matchesPriority && matchesUrgency && matchesSearch;
    });

    // Tri des résultats
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'response_time':
          aValue = a.response_time_hours || 0;
          bValue = b.response_time_hours || 0;
          break;
        case 'urgency':
          const urgencyOrder = { critical: 5, urgent: 4, delayed: 3, overdue: 2, normal: 1 };
          aValue = urgencyOrder[getUrgencyLevel(a) as keyof typeof urgencyOrder];
          bValue = urgencyOrder[getUrgencyLevel(b) as keyof typeof urgencyOrder];
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [reports, filterStatus, filterType, filterPriority, filterUrgency, searchTerm, sortBy, sortOrder]);

  // Calcul des statistiques étendues
  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const inReview = reports.filter(r => r.status === 'in_review').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const dismissed = reports.filter(r => r.status === 'dismissed').length;
    
    const critical = reports.filter(r => getUrgencyLevel(r) === 'critical').length;
    const urgent = reports.filter(r => getUrgencyLevel(r) === 'urgent').length;
    
    const avgResponseTime = total > 0 
      ? reports.reduce((sum, r) => sum + (r.response_time_hours || 0), 0) / total 
      : 0;
    
    const resolutionRate = total > 0 
      ? ((resolved + dismissed) / total) * 100 
      : 0;

    return {
      total,
      pending,
      inReview,
      resolved,
      dismissed,
      critical,
      urgent,
      avgResponseTime,
      resolutionRate
    };
  }, [reports]);

  // Gestion du rafraîchissement
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshReports();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Gestionnaires d'actions rapides
  const handleQuickAction = async (reportId: string, actionType: string, reason: string) => {
    await handleReportAction(reportId, {
      type: actionType,
      reason,
      notes: actionNotes
    });
    setActionNotes("");
  };

  // Gestionnaire pour ouvrir le modal d'action avancée
  const openActionModal = (report: any) => {
    setSelectedReport(report);
    setShowActionModal(true);
  };

  // Gestionnaire pour ouvrir le modal de détail
  const openDetailModal = (report: any) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setFilterStatus("all");
    setFilterType("all");
    setFilterPriority("all");
    setFilterUrgency("all");
    setSearchTerm("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  // Affichage de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">Chargement des signalements</p>
            <p className="text-sm text-gray-600">Récupération et analyse des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions principales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des signalements</h2>
          <p className="text-sm text-gray-600 mt-1">
            Système de modération et d'actions administratives avancées
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          
          <Button 
            onClick={resetFilters} 
            variant="ghost" 
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Réinitialiser filtres
          </Button>
        </div>
      </div>

      {/* Tableau de bord statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">En attente</p>
                <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Critique</p>
                <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-700" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Urgent</p>
                <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Résolus</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Taux résolution</p>
                <p className="text-2xl font-bold text-blue-600">{stats.resolutionRate.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Temps moy.</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgResponseTime.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de filtres et recherche avancée */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtres et recherche</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Tout effacer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche textuelle */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher par ID, titre, motif, utilisateur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtres en grille */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({stats.total})</SelectItem>
                  <SelectItem value="pending">En attente ({stats.pending})</SelectItem>
                  <SelectItem value="in_review">En révision ({stats.inReview})</SelectItem>
                  <SelectItem value="resolved">Résolus ({stats.resolved})</SelectItem>
                  <SelectItem value="dismissed">Rejetés ({stats.dismissed})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="listing">Annonces</SelectItem>
                  <SelectItem value="profile">Profils</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Priorité</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Urgence</Label>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes urgences</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="delayed">En retard</SelectItem>
                  <SelectItem value="overdue">Très en retard</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Tri par</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date de création</SelectItem>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="urgency">Urgence</SelectItem>
                  <SelectItem value="response_time">Temps de réponse</SelectItem>
                  <SelectItem value="status">Statut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Ordre</Label>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full justify-center"
              >
                {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
              </Button>
            </div>
          </div>

          {/* Résumé des filtres actifs */}
          {(filterStatus !== "all" || filterType !== "all" || filterPriority !== "all" || filterUrgency !== "all" || searchTerm) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filtres actifs:</span>
              {filterStatus !== "all" && <Badge variant="secondary">Statut: {filterStatus}</Badge>}
              {filterType !== "all" && <Badge variant="secondary">Type: {filterType}</Badge>}
              {filterPriority !== "all" && <Badge variant="secondary">Priorité: {filterPriority}</Badge>}
              {filterUrgency !== "all" && <Badge variant="secondary">Urgence: {filterUrgency}</Badge>}
              {searchTerm && <Badge variant="secondary">Recherche: "{searchTerm}"</Badge>}
              <span className="text-gray-600">→ {filteredAndSortedReports.length} résultat(s)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau principal des signalements */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Signalements ({filteredAndSortedReports.length})</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Affichage:</span>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Tableau
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grille
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredAndSortedReports.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun signalement trouvé</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all" || filterType !== "all" || filterPriority !== "all" || filterUrgency !== "all"
                  ? "Aucun signalement ne correspond aux critères de filtrage actuels."
                  : "Il n'y a actuellement aucun signalement dans le système."
                }
              </p>
              {(searchTerm || filterStatus !== "all" || filterType !== "all" || filterPriority !== "all" || filterUrgency !== "all") && (
                <Button onClick={resetFilters} variant="outline">
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[200px]">Cible</TableHead>
                    <TableHead className="min-w-[150px]">Motif</TableHead>
                    <TableHead className="w-[150px]">Signalé par</TableHead>
                    <TableHead className="w-[100px]">Priorité</TableHead>
                    <TableHead className="w-[100px]">Statut</TableHead>
                    <TableHead className="w-[120px]">Urgence</TableHead>
                    <TableHead className="w-[100px]">Temps</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedReports.map((report) => {
                    const urgency = getUrgencyLevel(report);
                    const urgencyColor = getUrgencyColor(urgency);
                    
                    return (
                      <TableRow 
                        key={report.id} 
                        className={`${report.priority === 'high' ? 'bg-red-50' : ''} hover:bg-gray-50 transition-colors`}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {report.report_type === 'listing' ? <Package className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            <Badge variant={report.report_type === 'listing' ? 'default' : 'secondary'} className="text-xs">
                              {report.report_type === 'listing' ? 'Annonce' : 'Profil'}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm truncate max-w-[180px]" title={report.listing_title || report.reported_user_name}>
                              {report.listing_title || report.reported_user_name || 'Cible inconnue'}
                            </p>
                            {report.listing_price && (
                              <p className="text-xs text-gray-500">{report.listing_price.toLocaleString()} FCFA</p>
                            )}
                            <p className="text-xs text-gray-400">ID: {report.id.slice(-8)}</p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <p className="text-sm truncate max-w-[140px]" title={report.reason}>
                            {report.reason}
                          </p>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm truncate max-w-[120px]" title={report.reporter_name}>
                              {report.reporter_name}
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${urgencyColor}`}>
                            {urgency === 'critical' ? 'Critique' :
                             urgency === 'urgent' ? 'Urgent' :
                             urgency === 'delayed' ? 'Retard' :
                             urgency === 'overdue' ? 'Très retard' : 'Normal'}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-xs">
                            <p className="font-medium">{formatResponseTime(report.response_time_hours || 0)}</p>
                            <p className="text-gray-500">{report.response_time_hours || 0}h</p>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {/* Bouton de détail */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openDetailModal(report)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* Actions rapides pour les signalements en attente */}
                            {report.status === 'pending' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleQuickAction(report.id, 'approve', 'Signalement vérifié et approuvé')}
                                  className="h-8 w-8 p-0"
                                  title="Approuver"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleQuickAction(report.id, 'dismiss', 'Signalement non fondé')}
                                  className="h-8 w-8 p-0"
                                  title="Rejeter"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            
                            {/* Bouton d'actions avancées */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openActionModal(report)}
                              className="h-8 w-8 p-0"
                              title="Actions avancées"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de détail du signalement */}
      <AlertDialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Détail du signalement #{selectedReport?.id?.slice(-8)}</span>
              <Badge variant={selectedReport?.report_type === 'listing' ? 'default' : 'secondary'}>
                {selectedReport?.report_type === 'listing' ? 'Annonce' : 'Profil'}
              </Badge>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Informations complètes et historique du signalement
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Informations du signalement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Priorité:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedReport.priority)}`}>
                        {selectedReport.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Statut:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Urgence:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(getUrgencyLevel(selectedReport))}`}>
                        {getUrgencyLevel(selectedReport)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Temps de réponse:</span>
                      <span className="text-sm">{formatResponseTime(selectedReport.response_time_hours || 0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Date de création:</span>
                      <span className="text-sm">{new Date(selectedReport.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Cible du signalement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Nom/Titre:</span>
                      <p className="text-sm mt-1 font-semibold">
                        {selectedReport.listing_title || selectedReport.reported_user_name || 'Cible inconnue'}
                      </p>
                    </div>
                    
                    {selectedReport.listing_price && (
                      <div>
                        <span className="text-sm font-medium">Prix:</span>
                        <p className="text-sm mt-1">{selectedReport.listing_price.toLocaleString()} FCFA</p>
                      </div>
                    )}
                    
                    {selectedReport.reported_user_email && (
                      <div>
                        <span className="text-sm font-medium">Email:</span>
                        <p className="text-sm mt-1">{selectedReport.reported_user_email}</p>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-sm font-medium">ID:</span>
                      <p className="text-sm mt-1 font-mono">{selectedReport.user_id || selectedReport.listing_id}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Motif et description */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Détails du signalement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Motif principal</Label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800 font-medium">{selectedReport.reason}</p>
                    </div>
                  </div>
                  
                  {selectedReport.description && (
                    <div>
                      <Label className="text-sm font-medium">Description détaillée</Label>
                      <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedReport.description}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations du reporter */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Signalé par
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Nom:</span>
                      <p className="text-sm mt-1">{selectedReport.reporter_name || 'Anonyme'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium">Type:</span>
                      <Badge variant="outline" className="ml-2">
                        {selectedReport.reporter_type === 'guest' ? 'Invité' : 'Utilisateur inscrit'}
                      </Badge>
                    </div>
                    
                    {selectedReport.reporter_email && (
                      <div>
                        <span className="text-sm font-medium">Email:</span>
                        <p className="text-sm mt-1">{selectedReport.reporter_email}</p>
                      </div>
                    )}
                    
                    {selectedReport.guest_phone && (
                      <div>
                        <span className="text-sm font-medium">Téléphone:</span>
                        <p className="text-sm mt-1">{selectedReport.guest_phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides dans le modal */}
              {selectedReport.status === 'pending' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-800 uppercase tracking-wide">
                      Actions rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={() => {
                          handleQuickAction(selectedReport.id, 'approve', 'Signalement approuvé après examen détaillé');
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
                          handleQuickAction(selectedReport.id, 'dismiss', 'Signalement rejeté après examen détaillé');
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
                  </CardContent>
                </Card>
              )}

              {/* Notes d'action pour les actions rapides */}
              {selectedReport.status === 'pending' && (
                <div>
                  <Label className="text-sm font-medium">Notes administratives (optionnel)</Label>
                  <Textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Ajouter des notes sur l'action entreprise..."
                    className="mt-1"
                    rows={3}
                  />
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

      {/* Modal d'actions avancées */}
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