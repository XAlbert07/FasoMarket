import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Importation du hook centralisé
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

// Importation des icônes
import {
  Shield, User, Package, Clock, Ban, Trash2,
  Search, RefreshCw, PlusCircle
} from "lucide-react";

const SanctionsManagementPage = () => {
  // Utilisation du hook centralisé
  const {
    sanctions,
    stats,
    loading,
    errors,
    refreshSanctions,
    formatDate,
    formatDaysRemaining,
    getSanctionPriority
  } = useAdminDashboard();

  // États et filtres
  const [activeTab, setActiveTab] = useState('toutes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('date_creation');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedSanction, setSelectedSanction] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState('revoquer');
  const [actionReason, setActionReason] = useState('');
  const [extensionDays, setExtensionDays] = useState('7');

  const filteredSanctions = useMemo(() => {
    let filtered = sanctions;

    // Filtration par onglet
    switch (activeTab) {
      case 'utilisateurs':
        filtered = filtered.filter(s => s.type === 'user');
        break;
      case 'annonces':
        filtered = filtered.filter(s => s.type === 'listing');
        break;
      case 'expirent_bientot':
        filtered = filtered.filter(s => s.days_remaining !== null && s.days_remaining <= 3 && s.status === 'active');
        break;
      case 'permanentes':
        filtered = filtered.filter(s => s.is_permanent);
        break;
      default:
        // Par défaut, l'onglet 'toutes' n'ajoute pas de filtre
        break;
    }

    // Filtration par statut
    if (filterStatus !== 'toutes') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    // Recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.target_name?.toLowerCase().includes(term) ||
        s.target_email?.toLowerCase().includes(term) ||
        s.reason?.toLowerCase().includes(term) ||
        s.admin_name?.toLowerCase().includes(term) ||
        s.sanction_type?.toLowerCase().includes(term)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'date_expiration':
          aVal = a.expires_at ? new Date(a.expires_at).getTime() : 0;
          bVal = b.expires_at ? new Date(b.expires_at).getTime() : 0;
          break;
        case 'type_sanction':
          aVal = a.sanction_type;
          bVal = b.sanction_type;
          break;
        case 'nom_cible':
          aVal = a.target_name?.toLowerCase();
          bVal = b.target_name?.toLowerCase();
          break;
        case 'date_creation':
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [sanctions, activeTab, searchTerm, filterStatus, sortBy, sortOrder]);

  const getBadgeStyle = (sanction) => {
    if (sanction.status === 'revoked') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (sanction.is_permanent) return 'bg-red-100 text-red-700 border-red-200';
    if (sanction.status === 'expired') return 'bg-gray-100 text-gray-700 border-gray-200';
    if (sanction.days_remaining !== null && sanction.days_remaining <= 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getSanctionTypeBadge = (type) => {
    switch (type) {
      case 'ban': return 'bg-red-100 text-red-800 border-red-200';
      case 'suspend': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'warning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'restriction': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const translateSanctionType = (type) => {
    switch (type) {
      case 'ban': return 'Bannissement';
      case 'suspend': return 'Suspension';
      case 'warning': return 'Avertissement';
      case 'restriction': return 'Restriction';
      default: return type;
    }
  };

  const handleActionSubmit = async () => {
    if (!selectedSanction || !actionReason.trim()) return;
    
    // À implémenter: Ces fonctions devront être ajoutées au hook useAdminDashboard
    console.log(`Action ${actionType} sur la sanction ${selectedSanction.id}`);
    
    // Pour l'instant, on affiche un message et on ferme le dialogue
    setShowActionDialog(false);
    setSelectedSanction(null);
    setActionReason('');
    setExtensionDays('7');
    
    // Après l'implémentation dans le hook, vous pourrez appeler:
    // let success = false;
    // switch (actionType) {
    //   case 'revoquer':
    //     success = await revokeSanction(selectedSanction.id, selectedSanction.type, actionReason);
    //     break;
    //   case 'etendre':
    //     success = await extendSanction(selectedSanction.id, selectedSanction.type, parseInt(extensionDays));
    //     break;
    //   case 'convertir_permanente':
    //     success = await convertToPermanent(selectedSanction.id, selectedSanction.type, actionReason);
    //     break;
    // }
  };

  const openActionDialog = (sanction, action) => {
    setSelectedSanction(sanction);
    setActionType(action);
    setActionReason('');
    setShowActionDialog(true);
  };

  // Utiliser le loading et error du hook centralisé
  const loadingSanctions = loading.sanctions || loading.global;
  const errorSanctions = errors.sanctions;

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8 lg:p-10">
      <div className="max-w-8xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des sanctions</h1>
              <p className="mt-1 text-gray-600">Surveillance et administration des mesures disciplinaires.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => refreshSanctions(true)} disabled={loadingSanctions}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingSanctions ? 'animate-spin' : ''}`} />
              {loadingSanctions ? 'Actualisation...' : 'Actualiser'}
            </Button>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvelle sanction
            </Button>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="border-l-4 border-blue-500">
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">TOTAL ACTIVES</span>
              <p className="mt-1 text-2xl font-bold text-blue-600">{stats.totalActive}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-purple-500">
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">UTILISATEURS</span>
              <p className="mt-1 text-2xl font-bold text-purple-600">{stats.userSanctions}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-green-500">
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">ANNONCES</span>
              <p className="mt-1 text-2xl font-bold text-green-600">{stats.listingSanctions}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-yellow-500">
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">TEMPORAIRES</span>
              <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.temporaryCount}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-red-500">
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">PERMANENTES</span>
              <p className="mt-1 text-2xl font-bold text-red-600">{stats.permanentCount}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-orange-500">
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">EXPIRENT BIENTÔT</span>
              <p className="mt-1 text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-gray-500">
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">EXPIREE AUJOURD'HUI</span>
              <p className="mt-1 text-2xl font-bold text-gray-600">{stats.expiredToday || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-emerald-500">
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-xs text-gray-500 font-medium">CREEES AUJOURD'HUI</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.createdToday || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center justify-between">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
                  <TabsTrigger value="toutes">Toutes ({stats.totalActive})</TabsTrigger>
                  <TabsTrigger value="utilisateurs">Utilisateurs ({stats.userSanctions})</TabsTrigger>
                  <TabsTrigger value="annonces">Annonces ({stats.listingSanctions})</TabsTrigger>
                  <TabsTrigger value="expirent_bientot">Expire bientôt ({stats.expiringSoon})</TabsTrigger>
                  <TabsTrigger value="permanentes">Permanentes ({stats.permanentCount})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email, raison..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="expired">Expirées</SelectItem>
                  <SelectItem value="revoked">Révoquées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_creation">Date de création</SelectItem>
                  <SelectItem value="date_expiration">Date d'expiration</SelectItem>
                  <SelectItem value="type_sanction">Type de sanction</SelectItem>
                  <SelectItem value="nom_cible">Nom de la cible</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="w-full sm:w-12">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </CardHeader>

          {/* Table Content */}
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {loadingSanctions ? (
                <div className="flex justify-center items-center h-[500px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : errorSanctions ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-center px-4">
                  <Shield className="h-20 w-20 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">Erreur de chargement</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-sm">
                    Une erreur est survenue lors du chargement des sanctions : {errorSanctions}. Veuillez réessayer plus tard.
                  </p>
                </div>
              ) : filteredSanctions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-center px-4">
                  <Shield className="h-20 w-20 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucune sanction trouvée</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-sm">
                    {searchTerm || filterStatus !== 'active'
                      ? "Aucun résultat ne correspond à votre recherche et vos filtres."
                      : "Aucune sanction active dans le système pour le moment."
                    }
                  </p>
                  {(searchTerm || filterStatus !== 'active') && (
                    <Button variant="link" className="mt-4" onClick={() => { setSearchTerm(''); setFilterStatus('active'); setSortBy('date_creation'); setSortOrder('desc'); }}>
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <Table className="w-full">
                  <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-20">Type</TableHead>
                      <TableHead className="min-w-[150px]">Cible</TableHead>
                      <TableHead className="w-32">Sanction</TableHead>
                      <TableHead className="min-w-[150px]">Raison</TableHead>
                      <TableHead className="w-32">Admin</TableHead>
                      <TableHead className="w-40">Créée le</TableHead>
                      <TableHead className="w-40">Expire le</TableHead>
                      <TableHead className="w-28">Statut</TableHead>
                      <TableHead className="w-40 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSanctions.map((sanction) => (
                      <TableRow key={sanction.id} className="hover:bg-gray-50">
                        {/* Type */}
                        <TableCell>
                          <div className="p-2 inline-flex rounded-md bg-gray-100 text-gray-500">
                            {sanction.type === 'user' ? <User className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                          </div>
                        </TableCell>
                        {/* Cible */}
                        <TableCell>
                          <div className="font-medium text-sm text-gray-900">{sanction.target_name}</div>
                          <div className="text-xs text-gray-500">{sanction.target_email}</div>
                        </TableCell>
                        {/* Sanction */}
                        <TableCell>
                          <Badge variant="outline" className={`font-medium ${getSanctionTypeBadge(sanction.sanction_type)}`}>
                            {translateSanctionType(sanction.sanction_type)}
                          </Badge>
                        </TableCell>
                        {/* Raison */}
                        <TableCell className="text-sm text-gray-700">
                          {sanction.reason}
                        </TableCell>
                        {/* Admin */}
                        <TableCell className="text-sm text-gray-700">{sanction.admin_name}</TableCell>
                        {/* Création */}
                        <TableCell className="text-sm text-gray-500">{formatDate(sanction.created_at)}</TableCell>
                        {/* Expiration */}
                        <TableCell>
                          <div className="text-sm">
                            {sanction.is_permanent ? (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                Permanente
                              </Badge>
                            ) : (
                              <>
                                <p className="text-gray-700">{sanction.expires_at ? formatDate(sanction.expires_at) : 'N/A'}</p>
                                <p className={`text-xs ${sanction.days_remaining !== null && sanction.days_remaining <= 3 ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                                  {formatDaysRemaining(sanction.days_remaining)}
                                </p>
                              </>
                            )}
                          </div>
                        </TableCell>
                        {/* Statut */}
                        <TableCell>
                          <Badge className={`font-medium ${getBadgeStyle(sanction)}`}>
                            {sanction.status === 'expired' ? 'Expirée' : sanction.status === 'revoked' ? 'Révoquée' : 'Active'}
                          </Badge>
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {sanction.status === 'active' && !sanction.is_permanent && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openActionDialog(sanction, 'etendre')} title="Prolonger">
                                  <Clock className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openActionDialog(sanction, 'convertir_permanente')} title="Rendre permanente">
                                  <Ban className="h-4 w-4 text-gray-500 hover:text-red-600" />
                                </Button>
                              </>
                            )}
                            {sanction.status === 'active' && (
                              <Button variant="ghost" size="icon" onClick={() => openActionDialog(sanction, 'revoquer')} title="Révoquer">
                                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === 'revoquer' ? 'Révoquer la sanction' : actionType === 'etendre' ? 'Prolonger la sanction' : 'Rendre la sanction permanente'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div className="mt-4 space-y-4">
                  <p>
                    <span className="font-semibold">{selectedSanction?.target_name}</span> sera affecté(e).
                  </p>
                  {actionType === 'etendre' && (
                    <div>
                      <Label htmlFor="extension-days">Nombre de jours à ajouter</Label>
                      <Input
                        id="extension-days"
                        type="number"
                        value={extensionDays}
                        onChange={(e) => setExtensionDays(e.target.value)}
                        placeholder="7"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="action-reason">Raison de l'action</Label>
                    <Textarea
                      id="action-reason"
                      placeholder="Expliquez pourquoi vous effectuez cette action."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleActionSubmit} disabled={!actionReason.trim()}>
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SanctionsManagementPage;