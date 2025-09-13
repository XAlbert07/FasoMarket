// pages/admin/components/ListingsTab.tsx - Version corrigée avec gestion des suspensions

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
  Timer, Ban, Play, Pause, Trash2, Calendar, Activity
} from "lucide-react";

interface ListingsTabProps {
  listings: any[];
  stats: any;
  loading: boolean;
  handleListingAction: (id: string, action: any) => Promise<boolean>;
  refreshListings: () => Promise<void>;
  getQualityScoreColor: (score: number) => string;
  getRiskLevelColor: (risk: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  formatSuspensionStatus: (listing: any) => string;
}

const ListingsTab: React.FC<ListingsTabProps> = ({
  listings,
  stats,
  loading,
  handleListingAction,
  refreshListings,
  getQualityScoreColor,
  getRiskLevelColor,
  formatCurrency,
  formatDate,
  formatSuspensionStatus
}) => {
  // États pour les filtres et actions
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterSuspension, setFilterSuspension] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // États pour les modales
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionDuration, setActionDuration] = useState('7');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtrage et tri des annonces
  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings.filter(listing => {
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

    // Tri
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
          aValue = a.views_count;
          bValue = b.views_count;
          break;
        case 'quality':
          aValue = a.quality_score;
          bValue = b.quality_score;
          break;
        case 'risk':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          aValue = riskOrder[a.risk_level as keyof typeof riskOrder];
          bValue = riskOrder[b.risk_level as keyof typeof riskOrder];
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

  // Récupération des catégories uniques pour le filtre
  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(listings.map(l => l.category_name).filter(Boolean))];
    return categories.sort();
  }, [listings]);

  // Gestionnaire de rafraîchissement
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshListings();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Gestionnaire d'action rapide
  const handleQuickAction = async (listing: any, action: string) => {
    const actionData = {
      type: action,
      reason: getDefaultReason(action),
      notes: `Action rapide depuis le dashboard admin`,
      duration: action.includes('suspend') ? 7 : undefined
    };

    await handleListingAction(listing.id, actionData);
  };

  // Raisons par défaut pour les actions rapides
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

  // Ouverture du modal d'action avancée
  const openActionModal = (listing: any, action: string) => {
    setSelectedListing(listing);
    setActionType(action);
    setActionReason('');
    setActionNotes('');
    setActionDuration('7');
    setShowActionModal(true);
  };

  // Gestionnaire d'action avancée
  const handleAdvancedAction = async () => {
    if (!selectedListing || !actionType || !actionReason) return;

    const actionData = {
      type: actionType,
      reason: actionReason,
      notes: actionNotes || undefined,
      duration: ['suspend', 'suspend_listing'].includes(actionType) ? parseInt(actionDuration) : undefined
    };

    const success = await handleListingAction(selectedListing.id, actionData);
    if (success) {
      setShowActionModal(false);
    }
  };

  // Réinitialisation des filtres
  const resetFilters = () => {
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterRisk("all");
    setFilterSuspension("all");
    setSearchTerm("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">Chargement des annonces</p>
            <p className="text-sm text-gray-600">Récupération et analyse des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des annonces</h2>
          <p className="text-sm text-gray-600 mt-1">
            Modération et administration des annonces de la marketplace
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
          
          <Button onClick={resetFilters} variant="ghost" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalListings}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Actives</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeListings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Suspendues</p>
                  <p className="text-2xl font-bold text-red-600">{stats.suspendedListings}</p>
                </div>
                <Pause className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Temp. susp.</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.temporarilySuspended}</p>
                </div>
                <Timer className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">En vedette</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.featuredListings}</p>
                </div>
                <Star className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">À réviser</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.needsReviewCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher par titre, marchand, localisation, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="sold">Vendues</SelectItem>
                  <SelectItem value="expired">Expirées</SelectItem>
                  <SelectItem value="suspended">Suspendues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Catégorie</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
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
              <Label className="text-sm font-medium mb-2 block">Niveau de risque</Label>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger>
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
              <Label className="text-sm font-medium mb-2 block">Suspension</Label>
              <Select value={filterSuspension} onValueChange={setFilterSuspension}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="temporary">Suspension temp.</SelectItem>
                  <SelectItem value="permanent">Suspension perm.</SelectItem>
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
                  <SelectItem value="created_at">Date création</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="views">Vues</SelectItem>
                  <SelectItem value="quality">Qualité</SelectItem>
                  <SelectItem value="risk">Niveau risque</SelectItem>
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
                {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
              </Button>
            </div>
          </div>

          {/* Résumé des filtres actifs */}
          {(filterStatus !== "all" || filterCategory !== "all" || filterRisk !== "all" || filterSuspension !== "all" || searchTerm) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filtres actifs:</span>
              {filterStatus !== "all" && <Badge variant="secondary">Statut: {filterStatus}</Badge>}
              {filterCategory !== "all" && <Badge variant="secondary">Catégorie: {filterCategory}</Badge>}
              {filterRisk !== "all" && <Badge variant="secondary">Risque: {filterRisk}</Badge>}
              {filterSuspension !== "all" && <Badge variant="secondary">Suspension: {filterSuspension}</Badge>}
              {searchTerm && <Badge variant="secondary">Recherche: "{searchTerm}"</Badge>}
              <span className="text-gray-600">→ {filteredAndSortedListings.length} résultat(s)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau des annonces */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Annonces ({filteredAndSortedListings.length})</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {filteredAndSortedListings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune annonce trouvée</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all" || filterCategory !== "all" || filterRisk !== "all" || filterSuspension !== "all"
                  ? "Aucune annonce ne correspond aux critères de filtrage actuels."
                  : "Il n'y a actuellement aucune annonce dans le système."
                }
              </p>
              {(searchTerm || filterStatus !== "all" || filterCategory !== "all" || filterRisk !== "all" || filterSuspension !== "all") && (
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
                    <TableHead className="w-[200px]">Annonce</TableHead>
                    <TableHead className="w-[150px]">Marchand</TableHead>
                    <TableHead className="w-[100px]">Prix</TableHead>
                    <TableHead className="w-[120px]">Statut</TableHead>
                    <TableHead className="w-[100px]">Qualité</TableHead>
                    <TableHead className="w-[100px]">Risque</TableHead>
                    <TableHead className="w-[120px]">Suspension</TableHead>
                    <TableHead className="w-[80px]">Vues</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedListings.map((listing) => (
                    <TableRow 
                      key={listing.id} 
                      className={`${listing.needs_review ? 'bg-yellow-50' : ''} hover:bg-gray-50 transition-colors`}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm truncate max-w-[180px]" title={listing.title}>
                            {listing.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs">
                              {listing.category_name}
                            </Badge>
                            {listing.featured && (
                              <Badge className="text-xs bg-purple-100 text-purple-600">
                                <Star className="h-3 w-3 mr-1" />
                                Vedette
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">ID: {listing.id.slice(-8)}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
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
                        <p className="font-medium text-sm">{formatCurrency(listing.price)}</p>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`text-xs ${
                          listing.status === 'active' ? 'bg-green-100 text-green-600' :
                          listing.status === 'sold' ? 'bg-blue-100 text-blue-600' :
                          listing.status === 'expired' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {listing.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityScoreColor(listing.quality_score)}`}>
                            {listing.quality_score}%
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(listing.risk_level)}`}>
                          {listing.risk_level === 'low' ? 'Faible' :
                           listing.risk_level === 'medium' ? 'Moyen' : 'Élevé'}
                        </span>
                      </TableCell>
                      
                      <TableCell>
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
                      
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-medium">{listing.views_count}</p>
                          <p className="text-gray-500">{listing.favorites_count} ♥</p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-xs text-gray-500">
                        {formatDate(listing.created_at)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {/* Bouton de détail */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowDetailModal(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Actions contextuelles selon le statut */}
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
                              
                              {!listing.featured ? (
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
                          
                          {/* Actions avancées */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openActionModal(listing, 'advanced')}
                            className="h-8 w-8 p-0"
                            title="Actions avancées"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <AlertDialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Détails de l'annonce #{selectedListing?.id?.slice(-8)}</span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          {selectedListing && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p>{selectedListing.category_name}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Métriques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Score qualité:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getQualityScoreColor(selectedListing.quality_score)}`}>
                        {selectedListing.quality_score}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Niveau de risque:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getRiskLevelColor(selectedListing.risk_level)}`}>
                        {selectedListing.risk_level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Vues:</span>
                      <span>{selectedListing.views_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Favoris:</span>
                      <span>{selectedListing.favorites_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Messages:</span>
                      <span>{selectedListing.messages_count}</span>
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

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDetailModal(false)}>
              Fermer
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal d'action avancée */}
      <AlertDialog open={showActionModal} onOpenChange={setShowActionModal}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Action sur l'annonce</AlertDialogTitle>
            <AlertDialogDescription>
              Effectuer une action administrative sur cette annonce
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {actionType === 'advanced' && (
              <div>
                <Label>Type d'action</Label>
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
                <Label>Durée (en jours)</Label>
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
              <Label>Raison *</Label>
              <Input
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Raison de l'action"
              />
            </div>

            <div>
              <Label>Notes administratives</Label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Notes internes..."
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowActionModal(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAdvancedAction}
              disabled={!actionReason}
            >
              Appliquer l'action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListingsTab;