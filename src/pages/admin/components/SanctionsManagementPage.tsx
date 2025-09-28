// pages/admin/components/SanctionsManagementPage.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { useAdminDashboard } from '@/hooks/useAdminDashboard';

import {
  Shield, User, Package, Clock, Ban, Trash2, AlertTriangle,
  Search, RefreshCw, CheckCircle2, Timer, RotateCcw
} from "lucide-react";

const SanctionsManagementPage = () => {
  const {
    sanctions,
    stats,
    loading,
    errors,
    revokeSanction,
    extendSanction,
    convertToPermanent,
    refreshSection,
    formatDate,
    formatDaysRemaining,
    getSanctionPriority,
  } = useAdminDashboard();

  // États 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('all');
  const [selectedSanction, setSelectedSanction] = useState<any>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState('revoquer');
  const [actionReason, setActionReason] = useState('');
  const [extensionDays, setExtensionDays] = useState('7');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Traductions simplifiées
  const translateStatus = (status: string): string => {
    const translations = { 'active': 'Active', 'expired': 'Expirée', 'revoked': 'Révoquée' };
    return translations[status as keyof typeof translations] || status;
  };

  const translateSanctionType = (type: string): string => {
    const translations = {
      'warning': 'Avertissement',
      'suspension': 'Suspension',
      'ban': 'Bannissement',
      'permanent_ban': 'Bannissement permanent'
    };
    return translations[type as keyof typeof translations] || type;
  };

  // Filtrage simplifié
  const filteredSanctions = useMemo(() => {
    let filtered = sanctions || [];

    // Filtres de base
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.type === filterType);
    }

    // Recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.target_name?.toLowerCase().includes(term) ||
        s.reason?.toLowerCase().includes(term) ||
        s.admin_name?.toLowerCase().includes(term)
      );
    }

    // Tri par priorité puis date
    return filtered.sort((a, b) => {
      const priorityA = getSanctionPriority(a);
      const priorityB = getSanctionPriority(b);
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[priorityB as keyof typeof priorityOrder] || 1) - 
                          (priorityOrder[priorityA as keyof typeof priorityOrder] || 1);
      
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [sanctions, searchTerm, filterStatus, filterType, getSanctionPriority]);

  // Actions principales
  const handleActionSubmit = async () => {
    if (!selectedSanction || !actionReason.trim()) return;
    
    setIsProcessingAction(true);
    
    try {
      let success = false;
      
      switch (actionType) {
        case 'revoquer':
          success = await revokeSanction(selectedSanction.id, selectedSanction.type, actionReason);
          break;
        case 'etendre':
          const days = parseInt(extensionDays);
          if (!isNaN(days) && days > 0) {
            success = await extendSanction(selectedSanction.id, selectedSanction.type, days);
          }
          break;
        case 'convertir_permanente':
          success = await convertToPermanent(selectedSanction.id, selectedSanction.type, actionReason);
          break;
      }

      if (success) {
        setShowActionDialog(false);
        setSelectedSanction(null);
        setActionReason('');
        setExtensionDays('7');
        refreshSection('userSanctions', true);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const openActionDialog = (sanction: any, action: string) => {
    setSelectedSanction(sanction);
    setActionType(action);
    setActionReason('');
    setShowActionDialog(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('active');
    setFilterType('all');
  };

  // Actions disponibles
  const getAvailableActions = (sanction: any) => ({
    canRevoke: sanction.status === 'active',
    canExtend: sanction.status === 'active' && !sanction.is_permanent,
    canMakePermanent: sanction.status === 'active' && !sanction.is_permanent
  });

  const isLoading = loading?.sanctions || loading?.global || false;
  const hasError = errors?.sanctions;
  const safeStats = stats || { totalActive: 0, userSanctions: 0, listingSanctions: 0, expiringSoon: 0 };

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
            <p className="text-sm text-gray-600 mb-4">{hasError}</p>
            <Button onClick={() => refreshSection('userSanctions', true)} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header simplifié */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sanctions actives</h1>
              <p className="text-sm text-gray-600">Gestion des mesures disciplinaires</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => refreshSection('userSanctions', true)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Statistiques essentielles */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">ACTIVES</p>
                  <p className="text-2xl font-bold text-blue-600">{safeStats.totalActive}</p>
                </div>
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">UTILISATEURS</p>
                  <p className="text-2xl font-bold text-purple-600">{safeStats.userSanctions}</p>
                </div>
                <User className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">ANNONCES</p>
                  <p className="text-2xl font-bold text-green-600">{safeStats.listingSanctions}</p>
                </div>
                <Package className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">URGENTES</p>
                  <p className="text-2xl font-bold text-orange-600">{safeStats.expiringSoon}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interface de filtrage simplifiée */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtrer les sanctions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom, raison ou admin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="expired">Expirées</SelectItem>
                  <SelectItem value="revoked">Révoquées</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateurs</SelectItem>
                  <SelectItem value="listing">Annonces</SelectItem>
                  <SelectItem value="all">Tous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              {filteredSanctions.length} sanction(s) trouvée(s)
            </div>
          </CardContent>
        </Card>

        {/* Liste des sanctions */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Chargement des sanctions...</p>
                </div>
              </div>
            ) : filteredSanctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
                <Shield className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune sanction trouvée</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {searchTerm || filterStatus !== 'active' || filterType !== 'all'
                    ? "Aucune sanction ne correspond aux critères actuels."
                    : "Aucune sanction active dans le système."}
                </p>
                {(searchTerm || filterStatus !== 'active' || filterType !== 'all') && (
                  <Button onClick={resetFilters} variant="outline">
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Cible</TableHead>
                      <TableHead>Sanction</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Créée le</TableHead>
                      <TableHead>Expire le</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSanctions.map((sanction) => {
                      const actions = getAvailableActions(sanction);
                      const priority = getSanctionPriority(sanction);
                      
                      return (
                        <TableRow 
                          key={sanction.id} 
                          className={`${
                            priority === 'high' ? 'bg-red-50 border-l-4 border-red-400' : 
                            priority === 'medium' ? 'bg-orange-50 border-l-2 border-orange-300' : ''
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-center">
                              {sanction.type === 'user' ? 
                                <User className="h-4 w-4 text-purple-500" /> : 
                                <Package className="h-4 w-4 text-green-500" />
                              }
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{sanction.target_name}</div>
                              {sanction.target_email && (
                                <div className="text-xs text-gray-500">{sanction.target_email}</div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {translateSanctionType(sanction.sanction_type)}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <p className="text-sm truncate max-w-[150px]" title={sanction.reason}>
                              {sanction.reason}
                            </p>
                          </TableCell>
                          
                          <TableCell className="text-sm">
                            {sanction.admin_name}
                          </TableCell>
                          
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(sanction.created_at)}
                          </TableCell>
                          
                          <TableCell>
                            {sanction.is_permanent ? (
                              <Badge className="bg-red-50 text-red-600 text-xs">Permanente</Badge>
                            ) : sanction.expires_at ? (
                              <div className="text-sm">
                                <p>{formatDate(sanction.expires_at)}</p>
                                <p className={`text-xs ${
                                  sanction.days_remaining !== null && sanction.days_remaining <= 3 
                                    ? 'text-orange-600 font-semibold' 
                                    : 'text-gray-500'
                                }`}>
                                  {formatDaysRemaining(sanction.days_remaining)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Non définie</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={
                              sanction.status === 'active' ? 'bg-green-100 text-green-700' :
                              sanction.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                              'bg-blue-100 text-blue-700'
                            }>
                              {translateStatus(sanction.status)}
                            </Badge>
                            {priority === 'high' && (
                              <div className="text-xs text-red-600 mt-1">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                Urgent
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {actions.canExtend && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openActionDialog(sanction, 'etendre')} 
                                  className="h-8 w-8 p-0"
                                  title="Prolonger"
                                >
                                  <Clock className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}
                              
                              {actions.canMakePermanent && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openActionDialog(sanction, 'convertir_permanente')} 
                                  className="h-8 w-8 p-0"
                                  title="Rendre permanente"
                                >
                                  <Ban className="h-4 w-4 text-purple-500" />
                                </Button>
                              )}
                              
                              {actions.canRevoke && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openActionDialog(sanction, 'revoquer')} 
                                  className="h-8 w-8 p-0"
                                  title="Révoquer"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                              
                              {sanction.status === 'revoked' && (
                                <div className="text-xs text-blue-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                </div>
                              )}
                              
                              {sanction.status === 'expired' && (
                                <div className="text-xs text-gray-500">
                                  <Timer className="h-3 w-3" />
                                </div>
                              )}
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

        {/* Dialog d'action simplifié */}
        <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                {actionType === 'revoquer' ? (
                  <Trash2 className="h-5 w-5 text-red-600" />
                ) : actionType === 'etendre' ? (
                  <Clock className="h-5 w-5 text-blue-600" />
                ) : (
                  <Ban className="h-5 w-5 text-purple-600" />
                )}
                <span>
                  {actionType === 'revoquer' ? 'Révoquer la sanction' : 
                   actionType === 'etendre' ? 'Prolonger la sanction' : 
                   'Rendre la sanction permanente'}
                </span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <span className="font-semibold">Cible:</span> {selectedSanction?.target_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Sanction:</span> {translateSanctionType(selectedSanction?.sanction_type)}
                    </p>
                  </div>
                  
                  {actionType === 'etendre' && (
                    <div>
                      <Label htmlFor="extension-days">Nombre de jours à ajouter</Label>
                      <Input
                        id="extension-days"
                        type="number"
                        min="1"
                        max="365"
                        value={extensionDays}
                        onChange={(e) => setExtensionDays(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="action-reason">Raison *</Label>
                    <Textarea
                      id="action-reason"
                      placeholder="Expliquez la raison de cette action..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessingAction}>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleActionSubmit} 
                disabled={!actionReason.trim() || isProcessingAction}
                className={
                  actionType === 'revoquer' ? 'bg-red-600 hover:bg-red-700' :
                  actionType === 'convertir_permanente' ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }
              >
                {isProcessingAction ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Traitement...</span>
                  </div>
                ) : (
                  'Confirmer'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SanctionsManagementPage;