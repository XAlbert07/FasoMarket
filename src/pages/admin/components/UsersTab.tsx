// pages/admin/components/UsersTab.tsx 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { 
  Eye, CheckCircle, Ban, Mail, Download, Users, UserCheck, AlertTriangle, 
  Search, Filter, X, MoreVertical, RefreshCw, Shield, Clock, MapPin
} from "lucide-react";
// En haut du fichier
import { useAdminDashboard, UserAction } from '@/hooks/useAdminDashboard';

// ==========================================
// INTERFACES
// ==========================================

interface UsersTabProps {
  users: any[];
  loading: boolean;
  handleUserAction: (userId: string, action: UserAction) => Promise<boolean>; 
  getTrustScoreColor: (score: number) => string;
  getStatusColor: (status: string) => string;
  formatDate: (dateString: string) => string;
  activeUsersCount: number;
  suspendedUsersCount: number;
  pendingVerificationCount: number;
  totalUsers?: number;
  averageTrustScore?: number;
  exportUsers?: (format: string) => void;
  refreshUsers?: () => Promise<void>;
  error?: string | null;
}

const UsersTab: React.FC<UsersTabProps> = ({
  users,
  loading,
  handleUserAction,
  getTrustScoreColor,
  getStatusColor,
  formatDate,
  activeUsersCount,
  suspendedUsersCount,
  pendingVerificationCount,
  totalUsers = 0,
  averageTrustScore = 0,
  exportUsers = () => console.log('Export non implémenté'),
  refreshUsers,
  error
}) => {
  // États 
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // États pour l'interface mobile
  const [showFilters, setShowFilters] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigate = useNavigate();

  // ==========================================
  // FONCTIONS UTILITAIRES CORRIGÉES
  // ==========================================

  const formatAccountAge = (days: number): string => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "1 jour";
    if (days < 7) return `${days} jours`;
    if (days < 30) return `${Math.round(days / 7)} sem.`;
    if (days < 365) return `${Math.round(days / 30)} mois`;
    return `${Math.round(days / 365)} an(s)`;
  };

  // ==========================================
  // FONCTION POUR DÉTERMINER LE STATUT RÉEL
  // ==========================================
  
  /**
   * Détermine le vrai statut d'un utilisateur 
   */
  const getUserRealStatus = (user: any): 'active' | 'suspended' | 'banned' | 'pending_verification' => {
    // Priorité 1: Vérifier les bannissements permanents
    if (user.is_banned === true) {
      return 'banned';
    }
    
    // Priorité 2: Vérifier les suspensions temporaires
    if (user.suspended_until) {
      const suspensionEnd = new Date(user.suspended_until);
      const now = new Date();
      if (suspensionEnd > now) {
        return 'suspended';
      }
      // Si la suspension est expirée, l'utilisateur redevient actif
    }
    
    // Priorité 3: Vérifier le statut de vérification
    if (!user.phone || !user.full_name) {
      return 'pending_verification';
    }
    
    // Par défaut: actif
    return 'active';
  };

  /**
   * Vérifie si un utilisateur est actuellement suspendu
   */
  const isUserSuspended = (user: any): boolean => {
    const realStatus = getUserRealStatus(user);
    return realStatus === 'suspended' || realStatus === 'banned';
  };

  // ==========================================
  // LOGIQUE DE FILTRAGE 
  // ==========================================
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Utiliser le statut réel au lieu du statut calculé
    const realStatus = getUserRealStatus(user);
    const matchesStatus = statusFilter === "all" || realStatus === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // ==========================================
  // FONCTIONS D'ACTION 
  // ==========================================
  
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id));
  };

  const handleBulkAction = async (action: string) => {
    for (const userId of selectedUsers) {
      let correctedAction;
      switch (action) {
        case 'verify':
          correctedAction = { type: 'verify', reason: 'Vérification en masse depuis le dashboard' };
          break;
        case 'suspend':
          correctedAction = { type: 'suspend', reason: 'Suspension en masse depuis le dashboard', duration: 7 };
          break;
        default:
          correctedAction = { type: action, reason: `Action en masse: ${action}` };
      }
      await handleUserAction(userId, correctedAction);
    }
    setSelectedUsers([]);
  };

  const handleViewProfile = (user: any) => {
    navigate(`/seller-profile/${user.id}`);
  };

  /**
   * Gestion des actions suspension/réactivation
   * Cette fonction utilise  les types d'actions du hook
   */
  const handleUserStatusAction = async (user: any, actionType: 'suspend' | 'activate') => {
    const userId = user.id;
    const userName = user.full_name || user.email;
    
    setActionLoading(userId);
    
    try {
      let action;
      
      if (actionType === 'suspend') {
        // Action de suspension
        action = {
          type: 'suspend',
          reason: 'Suspension administrative depuis le dashboard administrateur',
          duration: 7, // 7 jours par défaut
          notes: `Utilisateur suspendu par l'administrateur via le dashboard le ${new Date().toLocaleString('fr-FR')}`
        };
      } else {
        // Action de réactivation (= verify dans le hook)
        action = {
          type: 'verify',
          reason: 'Réactivation administrative depuis le dashboard',
          notes: `Suspension levée par l'administrateur via le dashboard le ${new Date().toLocaleString('fr-FR')}`
        };
      }

      
      const success = await handleUserAction(userId, action);
      
      if (success) {
        
        // Rafraîchir les données pour avoir l'état le plus récent
        if (refreshUsers) {
          await refreshUsers();
        }
      } else {
        console.error(`❌ Échec de l'action ${actionType} pour:`, userName);
      }
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'action ${actionType}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    if (!refreshUsers) return;
    setIsRefreshing(true);
    try {
      await refreshUsers();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRoleFilter("all");
  };

  // ==========================================
  // STATISTIQUES
  // ==========================================
  
  const stats = {
    total: totalUsers || users.length,
    active: users.filter(u => getUserRealStatus(u) === 'active').length,
    suspended: users.filter(u => getUserRealStatus(u) === 'suspended').length,
    banned: users.filter(u => getUserRealStatus(u) === 'banned').length,
    pending: users.filter(u => getUserRealStatus(u) === 'pending_verification').length
  };

  // Gestion des erreurs 
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground">Impossible de charger les utilisateurs</p>
            <p className="text-xs text-red-600 break-words">{error}</p>
          </div>
          {refreshUsers && (
            <Button onClick={handleRefresh} variant="outline" size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64 p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Chargement des utilisateurs</h3>
            <p className="text-sm text-muted-foreground">Récupération des données...</p>
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
              <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                Gestion des utilisateurs
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Administration et modération des comptes utilisateurs
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
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => exportUsers('csv')}
            >
              <Download className="h-3 w-3 mr-1" />
              Exporter ({filteredUsers.length})
            </Button>
            <Button onClick={resetFilters} variant="ghost" size="sm" className="text-xs">
              <X className="h-3 w-3 mr-1" />
              Reset filtres
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques corrigées - 2 colonnes sur mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase truncate">Total</p>
              <p className="text-lg md:text-xl font-bold text-foreground">{stats.total}</p>
            </div>
            <Users className="h-6 w-6 text-blue-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase truncate">Actifs</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{stats.active}</p>
            </div>
            <UserCheck className="h-6 w-6 text-green-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase truncate">Suspendus</p>
              <p className="text-lg md:text-xl font-bold text-orange-600">{stats.suspended}</p>
            </div>
            <Ban className="h-6 w-6 text-orange-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase truncate">Bannis</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{stats.banned}</p>
            </div>
            <Shield className="h-6 w-6 text-red-500 flex-shrink-0" />
          </div>
        </Card>

      </div>

      {/* Actions en masse - Version mobile */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-3">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <span className="text-sm font-medium">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('verify')} className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Vérifier
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('suspend')} className="text-xs">
                  <Ban className="h-3 w-3 mr-1" />
                  Suspendre
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedUsers([])} className="text-xs">
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher utilisateur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtres en grille responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1 block">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({stats.total})</SelectItem>
                  <SelectItem value="active">Actifs ({stats.active})</SelectItem>
                  <SelectItem value="suspended">Suspendus ({stats.suspended})</SelectItem>
                  <SelectItem value="banned">Bannis ({stats.banned})</SelectItem>
                  <SelectItem value="pending_verification">En attente ({stats.pending})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Rôle</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous rôles</SelectItem>
                  <SelectItem value="merchant">Marchands</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-1">
              <Label className="text-sm font-medium mb-1 block">Actions</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex-1 h-9 text-xs"
                >
                  {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? 'Désélectionner' : 'Sélectionner'} tout
                </Button>
              </div>
            </div>
          </div>

          {/* Tags des filtres actifs */}
          {(statusFilter !== "all" || roleFilter !== "all" || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 text-sm pt-2 border-t">
              <span className="text-muted-foreground text-xs">Filtres:</span>
              {statusFilter !== "all" && <Badge variant="secondary" className="text-xs">{statusFilter}</Badge>}
              {roleFilter !== "all" && <Badge variant="secondary" className="text-xs">{roleFilter}</Badge>}
              {searchTerm && <Badge variant="secondary" className="text-xs">"{searchTerm}"</Badge>}
              <Badge variant="outline" className="text-xs">
                {filteredUsers.length} résultat(s)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sélecteur de vue mobile */}
      <div className="flex justify-between items-center md:hidden">
        <h3 className="text-lg font-semibold">Utilisateurs ({filteredUsers.length})</h3>
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

      {/* Contenu principal */}
      {filteredUsers.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Users className="h-16 w-16 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">Aucun utilisateur trouvé</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchTerm || statusFilter !== "all" || roleFilter !== "all"
                  ? "Aucun utilisateur ne correspond aux critères de filtrage actuels."
                  : "Il n'y a actuellement aucun utilisateur dans le système."
                }
              </p>
            </div>
            {(searchTerm || statusFilter !== "all" || roleFilter !== "all") && (
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
              {filteredUsers.map((user) => {
                const realStatus = getUserRealStatus(user);
                const isSuspended = isUserSuspended(user);
                
                return (
                  <Card key={user.id} className="p-4">
                    <div className="space-y-3">
                      {/* En-tête de la carte */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                              className="rounded flex-shrink-0"
                            />
                            <h4 className="font-medium text-sm truncate" title={user.full_name || user.email}>
                              {user.full_name || user.email.split('@')[0]}
                            </h4>
                            {user.verification_status === 'verified' && (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                            {user.role === 'admin' && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">ID: {user.id.slice(-8)}</p>
                          
                          {/* AFFICHAGE DU STATUT RÉEL */}
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`text-xs ${getStatusColor(realStatus)}`}>
                              {realStatus === 'active' && 'Actif'}
                              {realStatus === 'suspended' && 'Suspendu'}
                              {realStatus === 'banned' && 'Banni'}
                              {realStatus === 'pending_verification' && 'En attente'}
                            </Badge>
                            
                            {/* Affichage de la durée de suspension */}
                            {realStatus === 'suspended' && user.suspended_until && (
                              <span className="text-xs text-orange-600">
                                Jusqu'au {new Date(user.suspended_until).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewProfile(user)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Informations principales */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <div>
                            <span className="text-muted-foreground flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              Email:
                            </span>
                            <p className="font-medium truncate" title={user.email}>
                              {user.email}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              Lieu:
                            </span>
                            <p className="truncate" title={user.location}>
                              {user.location || 'Non renseigné'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-muted-foreground">Téléphone:</span>
                            <p className="font-medium">
                              {user.phone || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Inscrit:
                            </span>
                            <p>{formatAccountAge(user.account_age_days)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Métriques utilisateur */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <span>{user.listings_count} annonces</span>
                          <span>{user.reports_received || 0} signalement(s)</span>
                        </div>
                      </div>

                      {/* Signalements reçus */}
                      {user.reports_received > 0 && (
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive" className="text-xs">
                            {user.reports_received} signalement(s)
                          </Badge>
                        </div>
                      )}

                      {/* Actions rapides mobile */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Inscrit le {formatDate ? formatDate(user.created_at) : new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewProfile(user)}
                            className="h-7 px-2 text-xs"
                            title="Voir profil"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {/* LOGIQUE POUR LES BOUTONS DE SUSPENSION/RÉACTIVATION */}
                          {!isSuspended ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={actionLoading === user.id}
                                  className="h-7 px-2 text-xs"
                                  title="Suspendre cet utilisateur"
                                >
                                  {actionLoading === user.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600" />
                                  ) : (
                                    <Ban className="h-3 w-3 text-red-600" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[95vw] max-w-md m-2">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center text-base">
                                    <Ban className="h-4 w-4 text-red-600 mr-2" />
                                    Suspendre l'utilisateur
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm">
                                    Êtes-vous sûr de vouloir suspendre <strong>{user.full_name || user.email}</strong> ?
                                    <br /><br />
                                    Cette action empêchera l'utilisateur de se connecter et masquera ses annonces.
                                    <br /><br />
                                    <strong>Statut actuel:</strong> {realStatus}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleUserStatusAction(user, 'suspend')}
                                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                  >
                                    Confirmer la suspension
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={actionLoading === user.id}
                                  className="h-7 px-2 text-xs"
                                  title="Réactiver cet utilisateur"
                                >
                                  {actionLoading === user.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[95vw] max-w-md m-2">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center text-base">
                                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                    Réactiver l'utilisateur
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm">
                                    Êtes-vous sûr de vouloir réactiver <strong>{user.full_name || user.email}</strong> ?
                                    <br /><br />
                                    Cette action lèvera la suspension et permettra à l'utilisateur de se reconnecter.
                                    <br /><br />
                                    <strong>Statut actuel:</strong> {realStatus}
                                    {user.suspended_until && (
                                      <>
                                        <br />
                                        <strong>Suspendu jusqu'au:</strong> {new Date(user.suspended_until).toLocaleString('fr-FR')}
                                      </>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleUserStatusAction(user, 'activate')}
                                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                  >
                                    Confirmer la réactivation
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Vue tableau pour mobile et desktop */}
          <Card className={`${mobileViewMode === 'table' ? 'block' : 'hidden'} md:block`}>
            <CardHeader className="pb-3 hidden md:block">
              <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </TableHead>
                        <TableHead className="min-w-[200px]">Utilisateur</TableHead>
                        <TableHead className="min-w-[150px] hidden lg:table-cell">Contact</TableHead>
                        <TableHead className="min-w-[100px] hidden sm:table-cell">Statut</TableHead>
                        <TableHead className="min-w-[100px] hidden lg:table-cell">Activité</TableHead>
                        <TableHead className="min-w-[100px] hidden xl:table-cell">Inscrit</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const realStatus = getUserRealStatus(user);
                        const isSuspended = isUserSuspended(user);
                        
                        return (
                          <TableRow
                            key={user.id}
                            className="hover:bg-muted/40 transition-colors"
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleSelectUser(user.id)}
                                className="rounded"
                              />
                            </TableCell>
                            
                            <TableCell className="min-w-0">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm truncate max-w-[150px]" title={user.full_name || user.email}>
                                    {user.full_name || user.email.split('@')[0]}
                                  </span>
                                  {user.verification_status === 'verified' && (
                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  )}
                                  {user.role === 'admin' && (
                                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                                  )}
                                </div>
                                <span className="text-sm text-muted-foreground truncate block max-w-[180px]">
                                  {user.location || 'Localisation non renseignée'}
                                </span>
                                
                                {/* Informations mobiles dans le tableau */}
                                <div className="lg:hidden space-y-1">
                                  <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={user.email}>
                                    {user.email}
                                  </p>
                                  <div className="flex items-center space-x-2 text-xs">
                                    <Badge className={`${getStatusColor(realStatus)}`}>
                                      {realStatus === 'active' && 'Actif'}
                                      {realStatus === 'suspended' && 'Suspendu'}
                                      {realStatus === 'banned' && 'Banni'}
                                      {realStatus === 'pending_verification' && 'En attente'}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {user.reports_received || 0} signalement(s)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="hidden lg:table-cell">
                              <div className="space-y-1 text-sm">
                                <span className="truncate block max-w-[120px]" title={user.email}>
                                  {user.email}
                                </span>
                                <span className="text-muted-foreground">{user.phone || 'N/A'}</span>
                              </div>
                            </TableCell>
                            
                            <TableCell className="hidden sm:table-cell">
                              <div className="space-y-1">
                                <Badge className={`text-xs ${getStatusColor(realStatus)}`}>
                                  {realStatus === 'active' && 'Actif'}
                                  {realStatus === 'suspended' && 'Suspendu'}
                                  {realStatus === 'banned' && 'Banni'}
                                  {realStatus === 'pending_verification' && 'En attente'}
                                </Badge>
                                
                                {/* Affichage de la durée de suspension */}
                                {realStatus === 'suspended' && user.suspended_until && (
                                  <div className="text-xs text-orange-600">
                                    Jusqu'au {new Date(user.suspended_until).toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell className="hidden lg:table-cell">
                              <div className="space-y-1 text-sm">
                                <span>{user.listings_count} annonces</span>
                                <span className="text-muted-foreground">{user.reports_received || 0} signalement(s)</span>
                                <span className="text-muted-foreground">{formatAccountAge(user.account_age_days)}</span>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">
                              {formatDate ? formatDate(user.created_at) : new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                {/* Bouton Voir Profil - toujours visible */}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  title="Voir le profil utilisateur"
                                  onClick={() => handleViewProfile(user)}
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                
                                {/* Actions contextuelles cachées sur très petit écran */}
                                <div className="hidden sm:flex items-center space-x-1">
                                  {/* LOGIQUE POUR LES BOUTONS DE SUSPENSION/RÉACTIVATION */}
                                  {!isSuspended ? (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          title="Suspendre cet utilisateur"
                                          className="h-8 w-8 p-0"
                                          disabled={actionLoading === user.id}
                                        >
                                          {actionLoading === user.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                          ) : (
                                            <Ban className="h-4 w-4 text-red-600" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="w-[95vw] max-w-lg m-2">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="flex items-center">
                                            <Ban className="h-5 w-5 text-red-600 mr-2" />
                                            Suspendre l'utilisateur
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Êtes-vous sûr de vouloir suspendre <strong>{user.full_name || user.email}</strong> ? 
                                            <br /><br />
                                            Cette action va empêcher l'utilisateur de se connecter, masquer ses annonces actives et lui envoyer une notification de suspension.
                                            <br /><br />
                                            <strong>Statut actuel:</strong> {realStatus}
                                            <br /><br />
                                            Cette action peut être annulée ultérieurement.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                          <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleUserStatusAction(user, 'suspend')}
                                            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                          >
                                            Confirmer la suspension
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  ) : (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          title="Réactiver cet utilisateur"
                                          onClick={() => {}} // Ouverture du dialog
                                          disabled={actionLoading === user.id}
                                          className="h-8 w-8 p-0"
                                        >
                                          {actionLoading === user.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                                          ) : (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="w-[95vw] max-w-lg m-2">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="flex items-center">
                                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                            Réactiver l'utilisateur
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Êtes-vous sûr de vouloir réactiver <strong>{user.full_name || user.email}</strong> ?
                                            <br /><br />
                                            Cette action va lever la suspension et permettre à l'utilisateur de se reconnecter.
                                            <br /><br />
                                            <strong>Statut actuel:</strong> {realStatus}
                                            {user.suspended_until && (
                                              <>
                                                <br />
                                                <strong>Suspendu jusqu'au:</strong> {new Date(user.suspended_until).toLocaleString('fr-FR')}
                                              </>
                                            )}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                          <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleUserStatusAction(user, 'activate')}
                                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                          >
                                            Confirmer la réactivation
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
};

export default UsersTab;
