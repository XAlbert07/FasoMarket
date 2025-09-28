// pages/admin/components/ListingsTab.tsx

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
  Eye, CheckCircle, XCircle, AlertTriangle, Clock, Package, Settings, 
  Filter, RefreshCw, Download, Search, TrendingUp, Star, 
  Timer, Ban, Play, Pause, Trash2, Calendar, Activity, ChevronDown,
  Menu, X, MoreVertical
} from "lucide-react";
import ReportActionModal from './ReportActionModal';
// Interface 
interface ListingsTabProps {
  listings: any[];
  loading: boolean;
  error: string | null;
  handleListingAction: (id: string, action: any) => Promise<boolean>;
  refreshListings: () => Promise<void>;
  getQualityScoreColor: (score: number) => string;
  getRiskLevelColor: (risk: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  needsReviewCount: number;
  averageQualityScore?: number;
  totalViews?: number;
  totalEngagement?: number;
}

const ListingsTab: React.FC<ListingsTabProps> = ({
  listings,
  loading,
  error,
  handleListingAction,
  refreshListings,
  getQualityScoreColor,
  getRiskLevelColor,
  formatCurrency,
  formatDate,
  needsReviewCount,
  averageQualityScore = 0,
  totalViews = 0,
  totalEngagement = 0
}) => {
  // États 
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterSuspension, setFilterSuspension] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionDuration, setActionDuration] = useState('7');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // États pour le modal d'action sur signalement
const [showReportActionModal, setShowReportActionModal] = useState(false);
const [selectedListingForReport, setSelectedListingForReport] = useState<any>(null);

  // Nouveaux états pour l'interface mobile
  const [showFilters, setShowFilters] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');

  // Toutes les fonctions métier 
  const formatSuspensionStatus = (listing: any): string => {
    if (!listing.is_temporarily_suspended || !listing.suspended_until) {
      return 'Suspension permanente';
    }
    
    const suspendedUntil = new Date(listing.suspended_until);
    const now = new Date();
    const daysRemaining = Math.ceil((suspendedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      return 'Suspension expirée';
    }
    
    return `Expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`;
  };

  // Statistiques 
  const stats = useMemo(() => {
    const safeListings = Array.isArray(listings) ? listings : [];
    
    return {
      totalListings: safeListings.length,
      activeListings: safeListings.filter(l => l.status === 'active').length,
      suspendedListings: safeListings.filter(l => l.status === 'suspended').length,
      temporarilySuspended: safeListings.filter(l => l.is_temporarily_suspended).length,
      featuredListings: safeListings.filter(l => l.featured || l.is_featured).length,
      soldListings: safeListings.filter(l => l.status === 'sold').length,
      expiredListings: safeListings.filter(l => l.status === 'expired').length,
      needsReviewCount: needsReviewCount,
      averageQualityScore: averageQualityScore,
      totalViews: totalViews,
      totalEngagement: totalEngagement
    };
  }, [listings, needsReviewCount, averageQualityScore, totalViews, totalEngagement]);

  // Filtrage et tri 
  const filteredAndSortedListings = useMemo(() => {
    const safeListings = Array.isArray(listings) ? listings : [];
    
    let filtered = safeListings.filter(listing => {
      const matchesStatus = filterStatus === "all" || listing.status === filterStatus;
      const matchesCategory = filterCategory === "all" || listing.category_name === filterCategory;
      const matchesRisk = filterRisk === "all" || listing.risk_level === filterRisk;
      
      const matchesSuspension = filterSuspension === "all" || 
        (filterSuspension === "temporary" && listing.is_temporarily_suspended) ||
        (filterSuspension === "permanent" && listing.status === 'suspended' && !listing.is_temporarily_suspended) ||
        (filterSuspension === "active" && listing.status !== 'suspended');
      
      const matchesSearch = !searchTerm || 
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesCategory && matchesRisk && matchesSuspension && matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'views':
          aValue = a.views_count || 0;
          bValue = b.views_count || 0;
          break;
        case 'quality':
          aValue = a.quality_score || 0;
          bValue = b.quality_score || 0;
          break;
        case 'risk':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          aValue = riskOrder[a.risk_level as keyof typeof riskOrder] || 1;
          bValue = riskOrder[b.risk_level as keyof typeof riskOrder] || 1;
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
  }, [listings, filterStatus, filterCategory, filterRisk, filterSuspension, searchTerm, sortBy, sortOrder]);

  // Catégories uniques 
  const uniqueCategories = useMemo(() => {
    const safeListings = Array.isArray(listings) ? listings : [];
    const categories = [...new Set(safeListings.map(l => l.category_name).filter(Boolean))];
    return categories.sort();
  }, [listings]);

  // Toutes les fonctions de gestion 
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshListings();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des annonces:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickAction = async (listing: any, action: string) => {
    const actionData = {
      type: action,
      reason: getDefaultReason(action),
      notes: `Action rapide depuis le dashboard admin`,
      duration: action.includes('suspend') ? 7 : undefined
    };

    try {
      await handleListingAction(listing.id, actionData);
    } catch (error) {
      console.error('Erreur lors de l\'action rapide:', error);
    }
  };

  const getDefaultReason = (action: string): string => {
    const reasons: Record<string, string> = {
      'approve': 'Annonce vérifiée et approuvée',
      'suspend': 'Suspension temporaire pour vérification',
      'unsuspend': 'Suspension levée après vérification',
      'feature': 'Annonce de qualité mise en avant',
      'unfeature': 'Mise en avant retirée'
    };
    return reasons[action] || 'Action administrative';
  };

  const openActionModal = (listing: any, action: string) => {
    setSelectedListing(listing);
    setActionType(action);
    setActionReason('');
    setActionNotes('');
    setActionDuration('7');
    setShowActionModal(true);
  };

 const handleAdvancedAction = async () => {
  if (!selectedListing || !actionType || !actionReason) return;

  // Mapping des actions vers les types reconnus par le hook
  let mappedActionType = actionType;
  if (actionType === 'suspend') {
    mappedActionType = 'suspend_listing'; 
  } else if (actionType === 'delete') {
    mappedActionType = 'remove_listing'; 
  }

  const actionData = {
    type: mappedActionType,
    reason: actionReason,
    notes: actionNotes || undefined,
    duration: ['suspend_listing', 'suspend', 'extend_expiry'].includes(mappedActionType) ? 
      parseInt(actionDuration) : undefined
  };

  try {
    const success = await handleListingAction(selectedListing.id, actionData);
    if (success) {
      setShowActionModal(false);
    }
  } catch (error) {
    console.error('Erreur lors de l\'action avancée:', error);
  }
};



// Nouvelle fonction pour gérer les actions depuis le ReportActionModal
const handleReportBasedAction = async (reportId: string, actionData: any): Promise<boolean> => {
  if (!selectedListingForReport) return false;

  try {
    const success = await handleListingAction(selectedListingForReport.id, {
      type: actionData.type,
      reason: actionData.reason,
      notes: actionData.notes,
      duration: actionData.duration
    });

    if (success) {
      setShowReportActionModal(false);
      setSelectedListingForReport(null);
    }

    return success;
  } catch (error) {
    console.error('Erreur lors de l\'action basée sur signalement:', error);
    return false;
  }
};

  const resetFilters = () => {
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterRisk("all");
    setFilterSuspension("all");
    setSearchTerm("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  // Gestion des erreurs préservée
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Erreur de chargement</h3>
            <p className="text-sm text-gray-600">Impossible de charger les annonces</p>
            <p className="text-xs text-red-600 break-words">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (loading && stats.totalListings === 0) {
    return (
      <div className="flex items-center justify-center min-h-64 p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Chargement des annonces</h3>
            <p className="text-sm text-gray-600">Récupération et analyse des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* En-tête mobile-first */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                Gestion des annonces
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Modération et administration
              </p>
              {loading && (
                <div className="flex items-center mt-2">
                  <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  <p className="text-xs text-blue-600">Actualisation en cours...</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="px-3"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:ml-2 sm:inline">
                  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                </span>
              </Button>
              
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="md:hidden px-3"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions secondaires pour mobile */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Exporter
            </Button>
            <Button onClick={resetFilters} variant="ghost" size="sm" className="text-xs">
              <X className="h-3 w-3 mr-1" />
              Reset filtres
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques mobile-first - 2 colonnes sur mobile, plus sur desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 uppercase truncate">Total</p>
              <p className="text-lg md:text-xl font-bold text-gray-900">{stats.totalListings}</p>
            </div>
            <Package className="h-6 w-6 text-blue-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 uppercase truncate">Actives</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{stats.activeListings}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 uppercase truncate">Suspendues</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{stats.suspendedListings}</p>
            </div>
            <Pause className="h-6 w-6 text-red-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 uppercase truncate">Temp</p>
              <p className="text-lg md:text-xl font-bold text-orange-600">{stats.temporarilySuspended}</p>
            </div>
            <Timer className="h-6 w-6 text-orange-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 uppercase truncate">Vedette</p>
              <p className="text-lg md:text-xl font-bold text-purple-600">{stats.featuredListings}</p>
            </div>
            <Star className="h-6 w-6 text-purple-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 uppercase truncate">À réviser</p>
              <p className="text-lg md:text-xl font-bold text-yellow-600">{stats.needsReviewCount}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
          </div>
        </Card>
      </div>

      {/* Métriques supplémentaires */}
      {(stats.averageQualityScore > 0 || stats.totalViews > 0 || stats.totalEngagement > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase">Qualité moyenne</p>
                <p className="text-lg font-bold text-blue-600">{stats.averageQualityScore}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase">Vues totales</p>
                <p className="text-lg font-bold text-green-600">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-5 w-5 text-green-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase">Engagement</p>
                <p className="text-lg font-bold text-purple-600">{stats.totalEngagement.toLocaleString()}</p>
              </div>
              <Activity className="h-5 w-5 text-purple-500 flex-shrink-0" />
            </div>
          </Card>
        </div>
      )}

      {/* Filtres collapsibles sur mobile */}
      <Card className={`transition-all duration-200 ${showFilters ? 'block' : 'hidden md:block'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filtres et recherche</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtres en grille responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1 block">Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({stats.totalListings})</SelectItem>
                  <SelectItem value="active">Actives ({stats.activeListings})</SelectItem>
                  <SelectItem value="sold">Vendues ({stats.soldListings})</SelectItem>
                  <SelectItem value="expired">Expirées ({stats.expiredListings})</SelectItem>
                  <SelectItem value="suspended">Suspendues ({stats.suspendedListings})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Catégorie</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Risque</Label>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Suspension</Label>
              <Select value={filterSuspension} onValueChange={setFilterSuspension}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="temporary">Temp.</SelectItem>
                  <SelectItem value="permanent">Perm.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Tri par</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date création</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="views">Vues</SelectItem>
                  <SelectItem value="quality">Qualité</SelectItem>
                  <SelectItem value="risk">Risque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Ordre</Label>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full justify-center h-9"
              >
                {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
              </Button>
            </div>
          </div>

          {/* Tags des filtres actifs */}
          {(filterStatus !== "all" || filterCategory !== "all" || filterRisk !== "all" || filterSuspension !== "all" || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 text-sm pt-2 border-t">
              <span className="text-gray-600 text-xs">Filtres:</span>
              {filterStatus !== "all" && <Badge variant="secondary" className="text-xs">{filterStatus}</Badge>}
              {filterCategory !== "all" && <Badge variant="secondary" className="text-xs">{filterCategory}</Badge>}
              {filterRisk !== "all" && <Badge variant="secondary" className="text-xs">{filterRisk}</Badge>}
              {filterSuspension !== "all" && <Badge variant="secondary" className="text-xs">{filterSuspension}</Badge>}
              {searchTerm && <Badge variant="secondary" className="text-xs">"{searchTerm}"</Badge>}
              <Badge variant="outline" className="text-xs">
                {filteredAndSortedListings.length} résultat(s)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sélecteur de vue mobile */}
      <div className="flex justify-between items-center md:hidden">
        <h3 className="text-lg font-semibold">Annonces ({filteredAndSortedListings.length})</h3>
        <div className="flex rounded-lg border p-1">
          <Button
            variant={mobileViewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMobileViewMode('cards')}
            className="px-3 py-1 text-xs"
          >
            Cartes
          </Button>
          <Button
            variant={mobileViewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMobileViewMode('table')}
            className="px-3 py-1 text-xs"
          >
            Tableau
          </Button>
        </div>
      </div>

      {/* Contenu principal - Vue adaptative */}
      {filteredAndSortedListings.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Package className="h-16 w-16 text-gray-300 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Aucune annonce trouvée</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all" || filterCategory !== "all" || filterRisk !== "all" || filterSuspension !== "all"
                  ? "Aucune annonce ne correspond aux critères de filtrage actuels."
                  : "Il n'y a actuellement aucune annonce dans le système."
                }
              </p>
            </div>
            {(searchTerm || filterStatus !== "all" || filterCategory !== "all" || filterRisk !== "all" || filterSuspension !== "all") && (
              <Button onClick={resetFilters} variant="outline" className="mt-4">
                Effacer les filtres
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Vue cartes pour mobile */}
          <div className={`md:hidden ${mobileViewMode === 'cards' ? 'block' : 'hidden'}`}>
            <div className="space-y-3">
              {filteredAndSortedListings.map((listing) => (
                <Card key={listing.id} className={`p-4 ${listing.needs_review ? 'border-l-4 border-l-yellow-400 bg-yellow-50/30' : ''}`}>
                  <div className="space-y-3">
                    {/* En-tête de la carte */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate" title={listing.title}>
                          {listing.title}
                        </h4>
                        <p className="text-xs text-gray-500">ID: {listing.id.slice(-8)}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedListing(listing);
                            setShowDetailModal(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openActionModal(listing, 'advanced')}
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Informations principales */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Marchand:</span>
                        <p className="font-medium truncate" title={listing.merchant_name}>
                          {listing.merchant_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Prix:</span>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(listing.price)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Localisation:</span>
                        <p className="truncate" title={listing.location}>
                          {listing.location}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p>{formatDate(listing.created_at)}</p>
                      </div>
                    </div>

                    {/* Badges et statuts */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`text-xs ${
                        listing.status === 'active' ? 'bg-green-100 text-green-600' :
                        listing.status === 'sold' ? 'bg-blue-100 text-blue-600' :
                        listing.status === 'expired' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {listing.status}
                      </Badge>

                      <Badge variant="outline" className="text-xs">
                        {listing.category_name || 'Sans catégorie'}
                      </Badge>

                      <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityScoreColor(listing.quality_score || 0)}`}>
                        Qualité: {listing.quality_score || 0}%
                      </span>

                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(listing.risk_level || 'low')}`}>
                        {listing.risk_level === 'low' ? 'Faible' :
                         listing.risk_level === 'medium' ? 'Moyen' : 'Élevé'} risque
                      </span>

                      {(listing.featured || listing.is_featured) && (
                        <Badge className="text-xs bg-purple-100 text-purple-600">
                          <Star className="h-3 w-3 mr-1" />
                          Vedette
                        </Badge>
                      )}

                      {listing.status === 'suspended' && (
                        <Badge className="text-xs bg-red-100 text-red-600">
                          {listing.is_temporarily_suspended ? 'Susp. temp.' : 'Susp. perm.'}
                        </Badge>
                      )}
                    </div>

                    {/* Actions rapides mobile */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex space-x-2 text-xs text-gray-500">
                        <span>{listing.views_count || 0} vues</span>
                        <span>•</span>
                        <span>{listing.favorites_count || 0} favoris</span>
                      </div>
                      
                      <div className="flex space-x-1">
                        {listing.status === 'active' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openActionModal(listing, 'suspend')}
                              className="h-7 px-2 text-xs"
                            >
                              Suspendre
                            </Button>
                            
                            {!(listing.featured || listing.is_featured) ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQuickAction(listing, 'feature')}
                                className="h-7 px-2 text-xs"
                              >
                                <Star className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQuickAction(listing, 'unfeature')}
                                className="h-7 px-2 text-xs"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                        
                        {listing.status === 'suspended' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleQuickAction(listing, 'unsuspend')}
                            className="h-7 px-2 text-xs"
                          >
                            Réactiver
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Vue tableau pour mobile et desktop */}
          <Card className={`${mobileViewMode === 'table' ? 'block' : 'hidden'} md:block`}>
            <CardHeader className="pb-3 hidden md:block">
              <CardTitle>Annonces ({filteredAndSortedListings.length})</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Annonce</TableHead>
                        <TableHead className="min-w-[150px] hidden lg:table-cell">Marchand</TableHead>
                        <TableHead className="min-w-[100px]">Prix</TableHead>
                        <TableHead className="min-w-[100px] hidden sm:table-cell">Statut</TableHead>
                        <TableHead className="min-w-[80px] hidden md:table-cell">Qualité</TableHead>
                        <TableHead className="min-w-[80px] hidden md:table-cell">Risque</TableHead>
                        <TableHead className="min-w-[100px] hidden lg:table-cell">Suspension</TableHead>
                        <TableHead className="min-w-[60px] hidden lg:table-cell">Vues</TableHead>
                        <TableHead className="min-w-[80px] hidden xl:table-cell">Date</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedListings.map((listing) => (
                        <TableRow 
                          key={listing.id} 
                          className={`${listing.needs_review ? 'bg-yellow-50' : ''} hover:bg-gray-50 transition-colors`}
                        >
                          <TableCell className="min-w-0">
                            <div className="space-y-1">
                              <p className="font-medium text-sm truncate max-w-[180px]" title={listing.title}>
                                {listing.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {listing.category_name || 'Sans catégorie'}
                                </Badge>
                                {(listing.featured || listing.is_featured) && (
                                  <Badge className="text-xs bg-purple-100 text-purple-600">
                                    <Star className="h-3 w-3 mr-1" />
                                    Vedette
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">ID: {listing.id.slice(-8)}</p>
                              {/* Informations mobiles dans le tableau */}
                              <div className="lg:hidden space-y-1">
                                <p className="text-xs text-gray-600 truncate">
                                  {listing.merchant_name} • {listing.location}
                                </p>
                                <div className="flex items-center space-x-2 text-xs">
                                  <Badge className={`${
                                    listing.status === 'active' ? 'bg-green-100 text-green-600' :
                                    listing.status === 'sold' ? 'bg-blue-100 text-blue-600' :
                                    listing.status === 'expired' ? 'bg-gray-100 text-gray-600' :
                                    'bg-red-100 text-red-600'
                                  }`}>
                                    {listing.status}
                                  </Badge>
                                  <span className={`px-2 py-1 rounded text-xs ${getQualityScoreColor(listing.quality_score || 0)}`}>
                                    {listing.quality_score || 0}%
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(listing.risk_level || 'low')}`}>
                                    {listing.risk_level === 'low' ? 'F' :
                                     listing.risk_level === 'medium' ? 'M' : 'É'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden lg:table-cell">
                            <div className="space-y-1">
                              <p className="font-medium text-sm truncate max-w-[120px]" title={listing.merchant_name}>
                                {listing.merchant_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[120px]">
                                {listing.location}
                              </p>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <p className="font-semibold text-sm">{formatCurrency(listing.price)}</p>
                          </TableCell>
                          
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={`text-xs ${
                              listing.status === 'active' ? 'bg-green-100 text-green-600' :
                              listing.status === 'sold' ? 'bg-blue-100 text-blue-600' :
                              listing.status === 'expired' ? 'bg-gray-100 text-gray-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {listing.status}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="hidden md:table-cell">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityScoreColor(listing.quality_score || 0)}`}>
                              {listing.quality_score || 0}%
                            </span>
                          </TableCell>
                          
                          <TableCell className="hidden md:table-cell">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(listing.risk_level || 'low')}`}>
                              {listing.risk_level === 'low' ? 'Faible' :
                               listing.risk_level === 'medium' ? 'Moyen' : 'Élevé'}
                            </span>
                          </TableCell>
                          
                          <TableCell className="hidden lg:table-cell">
                            {listing.status === 'suspended' ? (
                              <div className="space-y-1">
                                <Badge className="text-xs bg-red-100 text-red-600">
                                  {listing.is_temporarily_suspended ? 'Temporaire' : 'Permanente'}
                                </Badge>
                                {listing.is_temporarily_suspended && (
                                  <p className="text-xs text-gray-500">
                                    {formatSuspensionStatus(listing)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Badge className="text-xs bg-green-100 text-green-600">Active</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-xs">
                              <p className="font-medium">{listing.views_count || 0}</p>
                              <p className="text-gray-500">{listing.favorites_count || 0} ♥</p>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-xs text-gray-500 hidden xl:table-cell">
                            {formatDate(listing.created_at)}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {/* Bouton de détail toujours visible */}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedListing(listing);
                                  setShowDetailModal(true);
                                }}
                                className="h-8 w-8 p-0 flex-shrink-0"
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {/* Actions contextuelles cachées sur très petit écran */}
                              <div className="hidden sm:flex items-center space-x-1">
                                {listing.status === 'active' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => openActionModal(listing, 'suspend')}
                                      className="h-8 w-8 p-0"
                                      title="Suspendre"
                                    >
                                      <Pause className="h-4 w-4 text-orange-600" />
                                    </Button>
                                    
                                    {!(listing.featured || listing.is_featured) ? (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleQuickAction(listing, 'feature')}
                                        className="h-8 w-8 p-0"
                                        title="Mettre en vedette"
                                      >
                                        <Star className="h-4 w-4 text-purple-600" />
                                      </Button>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleQuickAction(listing, 'unfeature')}
                                        className="h-8 w-8 p-0"
                                        title="Retirer de la vedette"
                                      >
                                        <XCircle className="h-4 w-4 text-gray-600" />
                                      </Button>
                                    )}
                                  </>
                                )}
                                
                                {listing.status === 'suspended' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleQuickAction(listing, 'unsuspend')}
                                    className="h-8 w-8 p-0"
                                    title="Réactiver"
                                  >
                                    <Play className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </div>
                              
                              {/* Menu actions pour mobile et desktop */}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openActionModal(listing, 'advanced')}
                                className="h-8 w-8 p-0 flex-shrink-0"
                                title="Actions avancées"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              {/* Nouveau bouton pour actions administratives avancées */}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                setSelectedListingForReport(listing);
                                setShowReportActionModal(true);
                                  }}
                               className="h-8 w-8 p-0 flex-shrink-0"
                                title="Actions administratives"
                                 >
                            <Settings className="h-4 w-4 text-blue-600" />
                             </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de détails - Version mobile-first */}
      <AlertDialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <AlertDialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto m-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-base">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Annonce #{selectedListing?.id?.slice(-8)}</span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          {selectedListing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informations principales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Titre</p>
                      <p className="font-semibold">{selectedListing.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Prix</p>
                      <p className="font-semibold text-lg">{formatCurrency(selectedListing.price)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Localisation</p>
                      <p>{selectedListing.location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Catégorie</p>
                      <p>{selectedListing.category_name || 'Sans catégorie'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Métriques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Score qualité:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getQualityScoreColor(selectedListing.quality_score || 0)}`}>
                        {selectedListing.quality_score || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Niveau de risque:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getRiskLevelColor(selectedListing.risk_level || 'low')}`}>
                        {selectedListing.risk_level || 'low'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Vues:</span>
                      <span>{selectedListing.views_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Favoris:</span>
                      <span>{selectedListing.favorites_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Messages:</span>
                      <span>{selectedListing.messages_count || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedListing.description && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedListing.description}</p>
                  </CardContent>
                </Card>
              )}

              {selectedListing.status === 'suspended' && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-red-800">Informations de suspension</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Type:</span> {selectedListing.is_temporarily_suspended ? 'Temporaire' : 'Permanente'}
                    </p>
                    {selectedListing.suspension_reason && (
                      <p className="text-sm">
                        <span className="font-medium">Raison:</span> {selectedListing.suspension_reason}
                      </p>
                    )}
                    {selectedListing.is_temporarily_suspended && (
                      <p className="text-sm">
                        <span className="font-medium">Statut:</span> {formatSuspensionStatus(selectedListing)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" onClick={() => setShowDetailModal(false)}>
              Fermer
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal d'action avancée - Version mobile-first */}
      <AlertDialog open={showActionModal} onOpenChange={setShowActionModal}>
        <AlertDialogContent className="w-[95vw] max-w-2xl m-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Action sur l'annonce</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Effectuer une action administrative sur cette annonce
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {actionType === 'advanced' && (
              <div>
                <Label className="text-sm">Type d'action</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suspend">Suspendre temporairement</SelectItem>
                    <SelectItem value="delete">Supprimer définitivement</SelectItem>
                    <SelectItem value="feature">Mettre en vedette</SelectItem>
                    <SelectItem value="extend_expiry">Prolonger l'expiration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(actionType === 'suspend' || actionType === 'extend_expiry') && (
              <div>
                <Label className="text-sm">Durée (en jours)</Label>
                <Select value={actionDuration} onValueChange={setActionDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 jour</SelectItem>
                    <SelectItem value="3">3 jours</SelectItem>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="14">14 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm">Raison *</Label>
              <Input
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Raison de l'action"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">Notes administratives</Label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Notes internes..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" onClick={() => setShowActionModal(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAdvancedAction}
              disabled={!actionReason}
              className="w-full sm:w-auto"
            >
              {/* Modal d'action basé sur signalement */}
         <ReportActionModal
           report={{
              id: `listing-action-${selectedListingForReport?.id}`,
              report_type: 'listing',
              listing_title: selectedListingForReport?.title,
              listing_price: selectedListingForReport?.price,
              reason: 'Action administrative directe',
              created_at: new Date().toISOString(),
              status: 'pending',
              priority: 'medium',
              reported_user_name: selectedListingForReport?.merchant_name,
              reporter_name: 'Administrateur',
              reporter_type: 'registered'
              }}
         isOpen={showReportActionModal}
         onClose={() => {
         setShowReportActionModal(false);
         setSelectedListingForReport(null);
       }}
       onAction={handleReportBasedAction}
     />
              Appliquer l'action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListingsTab;