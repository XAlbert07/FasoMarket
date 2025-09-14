import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { 
  Shield, User, Package, Clock, Ban, AlertTriangle, CheckCircle, 
  XCircle, Calendar, Search, Filter, RefreshCw, Timer, Eye, 
  Settings, FileText, UserX, AlertOctagon, Infinity
} from "lucide-react";

// Interface mise à jour selon votre structure exacte
interface ActiveSanction {
  id: string;
  type: 'user' | 'listing';
  target_id: string;
  target_name: string;
  target_email?: string;
  sanction_type: string;
  reason: string;
  admin_name: string;
  admin_id: string;
  created_at: string;
  expires_at?: string;
  is_permanent: boolean;
  status: 'active' | 'expired' | 'revoked';
  days_remaining?: number;
  notes?: string;
  description?: string;
  duration_days?: number;
  effective_from?: string;
  revoked_at?: string;
  revoked_by?: string;
  revoked_reason?: string;
}

interface SanctionsStats {
  totalActive: number;
  userSanctions: number;
  listingSanctions: number;
  temporaryCount: number;
  permanentCount: number;
  expiringSoon: number;
  expiredToday: number;
  createdToday: number;
}

interface SanctionsManagementModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SanctionsManagementModal: React.FC<SanctionsManagementModalProps> = ({
  trigger,
  isOpen,
  onOpenChange
}) => {
  // États principaux
  const [sanctions, setSanctions] = useState<ActiveSanction[]>([]);
  const [stats, setStats] = useState<SanctionsStats>({
    totalActive: 0,
    userSanctions: 0,
    listingSanctions: 0,
    temporaryCount: 0,
    permanentCount: 0,
    expiringSoon: 0,
    expiredToday: 0,
    createdToday: 0
  });
  const [loading, setLoading] = useState(false);

  // États pour les filtres et recherche
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'listing'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'expires' | 'type' | 'priority'>('priority');

  // États pour les actions
  const [selectedSanction, setSelectedSanction] = useState<ActiveSanction | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'revoke' | 'extend' | 'convert' | 'details'>('revoke');
  const [newDuration, setNewDuration] = useState('7');
  const [actionReason, setActionReason] = useState('');

  // Simulation de données pour la démo
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockSanctions: ActiveSanction[] = [
          {
            id: '1',
            type: 'user',
            target_id: 'user1',
            target_name: 'Jean Dupont',
            target_email: 'jean.dupont@email.com',
            sanction_type: 'suspend',
            reason: 'Comportement inapproprié répété',
            admin_name: 'Marie Martin',
            admin_id: 'admin1',
            created_at: '2024-09-10T14:30:00Z',
            expires_at: '2024-09-16T14:30:00Z',
            is_permanent: false,
            status: 'active',
            days_remaining: 2,
            description: 'Suspension suite à multiples signalements',
            duration_days: 7
          },
          {
            id: '2',
            type: 'user',
            target_id: 'user2',
            target_name: 'Sophie Lambert',
            target_email: 'sophie.lambert@email.com',
            sanction_type: 'ban',
            reason: 'Activité frauduleuse détectée',
            admin_name: 'Paul Durand',
            admin_id: 'admin2',
            created_at: '2024-09-01T09:15:00Z',
            expires_at: null,
            is_permanent: true,
            status: 'active',
            days_remaining: null,
            description: 'Bannissement définitif pour fraude avérée',
            duration_days: null
          },
          {
            id: '3',
            type: 'listing',
            target_id: 'listing1',
            target_name: 'Vélo électrique neuf',
            target_email: 'vendeur@email.com',
            sanction_type: 'suspend',
            reason: 'Contenu inapproprié dans la description',
            admin_name: 'Anne Leroy',
            admin_id: 'admin3',
            created_at: '2024-09-12T16:45:00Z',
            expires_at: '2024-09-15T16:45:00Z',
            is_permanent: false,
            status: 'active',
            days_remaining: 1,
            notes: 'Suspension temporaire en attente de correction'
          },
          {
            id: '4',
            type: 'user',
            target_id: 'user3',
            target_name: 'Pierre Moreau',
            target_email: 'pierre.moreau@email.com',
            sanction_type: 'warning',
            reason: 'Premier avertissement pour spam',
            admin_name: 'Marie Martin',
            admin_id: 'admin1',
            created_at: '2024-09-13T11:20:00Z',
            expires_at: '2024-09-20T11:20:00Z',
            is_permanent: false,
            status: 'active',
            days_remaining: 6,
            description: 'Avertissement formel suite à signalement',
            duration_days: 7
          }
        ];

        const calculatedStats: SanctionsStats = {
          totalActive: 4,
          userSanctions: 3,
          listingSanctions: 1,
          temporaryCount: 3,
          permanentCount: 1,
          expiringSoon: 1,
          expiredToday: 0,
          createdToday: 1
        };

        setSanctions(mockSanctions);
        setStats(calculatedStats);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen]);

  const filteredSanctions = useMemo(() => {
    let filtered = sanctions;

    switch (activeTab) {
      case 'users':
        filtered = filtered.filter(s => s.type === 'user');
        break;
      case 'listings':
        filtered = filtered.filter(s => s.type === 'listing');
        break;
      case 'expiring':
        filtered = filtered.filter(s => s.days_remaining !== null && s.days_remaining <= 3);
        break;
      case 'urgent':
        filtered = filtered.filter(s => 
          s.status === 'expired' || 
          (s.days_remaining !== null && s.days_remaining <= 1) ||
          s.sanction_type === 'ban'
        );
        break;
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.type === filterType);
    }

    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(s => s.status === 'active');
        break;
      case 'expiring':
        filtered = filtered.filter(s => s.days_remaining !== null && s.days_remaining <= 1);
        break;
      case 'expired':
        filtered = filtered.filter(s => s.status === 'expired');
        break;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.target_name.toLowerCase().includes(term) ||
        s.reason.toLowerCase().includes(term) ||
        s.admin_name.toLowerCase().includes(term) ||
        s.target_email?.toLowerCase().includes(term) ||
        s.sanction_type.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [sanctions, activeTab, filterType, filterStatus, searchTerm]);

  const handleSanctionAction = async () => {
    if (!selectedSanction || !actionReason.trim()) {
      return;
    }

    // Actions simulées
    setShowActionDialog(false);
    setSelectedSanction(null);
    setActionReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDaysRemaining = (days: number | null) => {
    if (days === null) return 'Permanente';
    if (days <= 0) return 'Expirée';
    if (days === 1) return '1 jour restant';
    return `${days} jours restants`;
  };

  const getSanctionPriority = (sanction: ActiveSanction): 'urgent' | 'high' | 'medium' | 'low' => {
    if (sanction.status === 'expired') return 'urgent';
    if (sanction.days_remaining !== null && sanction.days_remaining <= 0) return 'urgent';
    if (sanction.days_remaining !== null && sanction.days_remaining <= 1) return 'high';
    if (sanction.sanction_type === 'ban') return 'high';
    if (sanction.days_remaining !== null && sanction.days_remaining <= 3) return 'medium';
    return 'low';
  };

  const getSanctionTypeLabel = (type: string) => {
    const labels = {
      'suspend': 'Suspension',
      'ban': 'Bannissement',
      'warning': 'Avertissement',
      'restriction': 'Restriction'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getSanctionTypeIcon = (type: string) => {
    switch (type) {
      case 'ban': return <Ban className="h-4 w-4 text-red-600" />;
      case 'suspend': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertOctagon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadgeColor = (sanction: ActiveSanction) => {
    if (sanction.status === 'expired') return 'bg-gray-100 text-gray-700';
    if (sanction.status === 'revoked') return 'bg-green-100 text-green-700';
    if (sanction.is_permanent) return 'bg-red-100 text-red-700';
    if (sanction.days_remaining !== null && sanction.days_remaining <= 1) return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  };

  const modalContent = (
    <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <span>Centre de gestion des sanctions</span>
          <Badge variant="outline" className="ml-2">
            {stats.totalActive} sanctions actives
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 overflow-hidden">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="border-blue-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-blue-600">{stats.totalActive}</div>
              <div className="text-xs text-gray-600">Total actives</div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-purple-600">{stats.userSanctions}</div>
              <div className="text-xs text-gray-600">Utilisateurs</div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">{stats.listingSanctions}</div>
              <div className="text-xs text-gray-600">Annonces</div>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-yellow-600">{stats.temporaryCount}</div>
              <div className="text-xs text-gray-600">Temporaires</div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-red-600">{stats.permanentCount}</div>
              <div className="text-xs text-gray-600">Permanentes</div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-orange-600">{stats.expiringSoon}</div>
              <div className="text-xs text-gray-600">Expirent bientôt</div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-gray-600">{stats.expiredToday}</div>
              <div className="text-xs text-gray-600">Expirées aujourd'hui</div>
            </CardContent>
          </Card>
          
          <Card className="border-indigo-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-indigo-600">{stats.createdToday}</div>
              <div className="text-xs text-gray-600">Créées aujourd'hui</div>
            </CardContent>
          </Card>
        </div>

        {/* Contrôles */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualisation...' : 'Actualiser'}
            </Button>
            
            <div className="text-sm text-gray-600">
              Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une sanction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="user">Utilisateurs</SelectItem>
                <SelectItem value="listing">Annonces</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="expiring">Expirent bientôt</SelectItem>
                <SelectItem value="expired">Expirées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              Toutes ({stats.totalActive})
            </TabsTrigger>
            <TabsTrigger value="users">
              <User className="h-4 w-4 mr-1" />
              Utilisateurs ({stats.userSanctions})
            </TabsTrigger>
            <TabsTrigger value="listings">
              <Package className="h-4 w-4 mr-1" />
              Annonces ({stats.listingSanctions})
            </TabsTrigger>
            <TabsTrigger value="expiring">
              <Clock className="h-4 w-4 mr-1" />
              Expire bientôt ({stats.expiringSoon})
            </TabsTrigger>
            <TabsTrigger value="urgent">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Urgentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="h-[500px] mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">Chargement des sanctions en cours...</p>
                </div>
              </div>
            ) : filteredSanctions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 max-w-md">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune sanction trouvée</h3>
                    <p className="text-gray-600">
                      {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                        ? "Aucune sanction ne correspond aux critères de recherche sélectionnés."
                        : "Aucune sanction n'est actuellement active dans le système."
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Priorité</TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[250px]">Cible</TableHead>
                      <TableHead className="w-[120px]">Sanction</TableHead>
                      <TableHead className="w-[200px]">Motif</TableHead>
                      <TableHead className="w-[120px]">Admin</TableHead>
                      <TableHead className="w-[140px]">Créée le</TableHead>
                      <TableHead className="w-[140px]">Expiration</TableHead>
                      <TableHead className="w-[100px]">Statut</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSanctions.map((sanction) => (
                      <TableRow key={`${sanction.type}-${sanction.id}`}>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityBadgeColor(getSanctionPriority(sanction))}`}
                          >
                            {getSanctionPriority(sanction) === 'urgent' && 'Urgent'}
                            {getSanctionPriority(sanction) === 'high' && 'Élevée'}
                            {getSanctionPriority(sanction) === 'medium' && 'Moyenne'}
                            {getSanctionPriority(sanction) === 'low' && 'Faible'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          {sanction.type === 'user' ? (
                            <User className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Package className="h-4 w-4 text-green-600" />
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm truncate max-w-[220px]" title={sanction.target_name}>
                              {sanction.target_name}
                            </p>
                            {sanction.target_email && (
                              <p className="text-xs text-gray-500 truncate max-w-[220px]">
                                {sanction.target_email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getSanctionTypeIcon(sanction.sanction_type)}
                            <Badge variant="outline" className="text-xs">
                              {getSanctionTypeLabel(sanction.sanction_type)}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <p className="text-sm truncate max-w-[180px]" title={sanction.reason}>
                            {sanction.reason}
                          </p>
                        </TableCell>
                        
                        <TableCell className="text-sm text-gray-600">
                          <div className="truncate max-w-[100px]" title={sanction.admin_name}>
                            {sanction.admin_name}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(sanction.created_at)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {sanction.expires_at ? (
                              <div>
                                <p className="font-medium">{formatDate(sanction.expires_at)}</p>
                                <p className={`text-xs ${
                                  sanction.days_remaining !== null && sanction.days_remaining <= 1 
                                    ? 'text-red-600 font-medium' 
                                    : 'text-gray-500'
                                }`}>
                                  {formatDaysRemaining(sanction.days_remaining)}
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <Infinity className="h-4 w-4 text-red-600" />
                                <span className="text-red-600 font-medium">Permanente</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={getStatusBadgeColor(sanction)}>
                            {sanction.status === 'active' ? 'Active' :
                             sanction.status === 'expired' ? 'Expirée' : 'Révoquée'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSanction(sanction);
                                setActionType('details');
                                setShowActionDialog(true);
                              }}
                              className="h-8 w-8 p-0"
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            
                            {sanction.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSanction(sanction);
                                  setActionType('revoke');
                                  setShowActionDialog(true);
                                }}
                                className="h-8 w-8 p-0"
                                title="Révoquer"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog d'action */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-3">
              {actionType === 'details' ? (
                <>
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span>Détails de la sanction</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>Révoquer la sanction</span>
                </>
              )}
            </AlertDialogTitle>
            
            {selectedSanction && (
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p><strong>Cible:</strong> {selectedSanction.target_name}</p>
                  <p><strong>Type:</strong> {getSanctionTypeLabel(selectedSanction.sanction_type)}</p>
                  <p><strong>Motif:</strong> {selectedSanction.reason}</p>
                </div>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {actionType === 'details' && selectedSanction && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">ID de la sanction</Label>
                      <p className="text-sm font-mono">{selectedSanction.id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Administrateur</Label>
                      <p className="text-sm">{selectedSanction.admin_name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500">Date de création</Label>
                    <p className="text-sm">{formatDate(selectedSanction.created_at)}</p>
                  </div>
                  
                  {selectedSanction.expires_at && (
                    <div>
                      <Label className="text-xs text-gray-500">Date d'expiration</Label>
                      <p className="text-sm">{formatDate(selectedSanction.expires_at)}</p>
                    </div>
                  )}
                  
                  {selectedSanction.description && (
                    <div>
                      <Label className="text-xs text-gray-500">Description</Label>
                      <p className="text-sm bg-blue-50 p-2 rounded">{selectedSanction.description}</p>
                    </div>
                  )}
                  
                  {selectedSanction.notes && (
                    <div>
                      <Label className="text-xs text-gray-500">Notes</Label>
                      <p className="text-sm bg-yellow-50 p-2 rounded">{selectedSanction.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {actionType === 'revoke' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Attention</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Cette action révoquera immédiatement la sanction. Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="revocation-reason" className="text-sm font-medium">
                    Justification de la révocation *
                  </Label>
                  <Textarea
                    id="revocation-reason"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Expliquez pourquoi cette sanction doit être révoquée..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowActionDialog(false);
              setActionReason('');
            }}>
              Annuler
            </AlertDialogCancel>
            
            {actionType === 'revoke' && (
              <AlertDialogAction 
                onClick={handleSanctionAction}
                disabled={!actionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirmer la révocation
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  );

  return trigger ? (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      {modalContent}
    </Dialog>
  ) : (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {modalContent}
    </Dialog>
  );
};

export default SanctionsManagementModal;