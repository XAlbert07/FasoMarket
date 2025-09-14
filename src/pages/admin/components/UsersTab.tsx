// pages/admin/components/UsersTab.tsx - VERSION CORRIGÉE
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, CheckCircle, Ban, Mail, Download, Users, UserCheck, AlertTriangle, Award } from "lucide-react";

// Import du composant ChatModal pour la messagerie admin
import AdminChatModal from './AdminChatModal';

interface UsersTabProps {
  users: any[];
  loading: boolean;
  handleUserAction: (id: string, action: any) => Promise<boolean>;
  getTrustScoreColor: (score: number) => string;
  getStatusColor: (status: string) => string;
  formatAccountAge: (days: number) => string;
  activeUsersCount: number;
  suspendedUsersCount: number;
  exportUsers: (format: string) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({
  users,
  loading,
  handleUserAction,
  getTrustScoreColor,
  getStatusColor,
  formatAccountAge,
  activeUsersCount,
  suspendedUsersCount,
  exportUsers
}) => {
  // États existants
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // NOUVEAUX ÉTATS pour les fonctionnalités manquantes
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedUserForChat, setSelectedUserForChat] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fonctions existantes (inchangées)
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

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
      await handleUserAction(userId, { type: action, reason: `Action en masse: ${action}` });
    }
    setSelectedUsers([]);
  };

  const getUserRiskLevel = (user: any) => {
    if (user.reports_received > 3) return 'Élevé';
    if (user.reports_received > 1) return 'Moyen';
    return 'Faible';
  };

  // NOUVELLES FONCTIONS pour gérer les actions des boutons

  /**
   * 🔍 FONCTION 1: Voir le profil de l'utilisateur
   * Redirige vers la page de profil public du vendeur
   */
  const handleViewProfile = (user: any) => {
    console.log('👁️ [ADMIN] Consultation du profil de:', user.full_name || user.email);
    
    // Navigation vers la page de profil public du vendeur
    navigate(`/seller-profile/${user.id}`);
  };

  /**
   * 💬 FONCTION 2: Ouvrir le modal de chat administrateur
   * Permet d'envoyer un message avec distinction "message administrateur"
   */
  const handleOpenAdminChat = (user: any) => {
    console.log('💬 [ADMIN] Ouverture chat avec:', user.full_name || user.email);
    
    setSelectedUserForChat(user);
    setChatModalOpen(true);
  };

  /**
   * ⚡ FONCTION 3: Gestion améliorée des actions de suspension/activation
   * Avec feedback visuel et gestion d'état optimisée
   */
  const handleUserStatusAction = async (user: any, actionType: 'suspend' | 'activate') => {
    const userId = user.id;
    const userName = user.full_name || user.email;
    
    console.log(`⚡ [ADMIN] Action ${actionType} sur utilisateur:`, userName);
    
    // Affichage du loading sur le bouton spécifique
    setActionLoading(userId);
    
    try {
      const action = actionType === 'suspend' 
        ? {
            type: 'suspend',
            reason: 'Suspension administrative depuis le dashboard',
            duration: 7 // 7 jours par défaut
          }
        : {
            type: 'verify', // 'verify' réactive un compte suspendu
            reason: 'Réactivation administrative depuis le dashboard'
          };

      const success = await handleUserAction(userId, action);
      
      if (success) {
        console.log(`✅ [ADMIN] Action ${actionType} réussie pour:`, userName);
        
        // Message de confirmation personnalisé
        const message = actionType === 'suspend' 
          ? `L'utilisateur ${userName} a été suspendu avec succès.`
          : `L'utilisateur ${userName} a été réactivé avec succès.`;
        
        // Vous pourriez ajouter une notification toast ici si nécessaire
      } else {
        console.error(`❌ [ADMIN] Échec de l'action ${actionType} pour:`, userName);
      }
      
    } catch (error) {
      console.error(`💥 [ADMIN] Erreur lors de l'action ${actionType}:`, error);
    } finally {
      // Retrait du loading
      setActionLoading(null);
    }
  };

  /**
   * 📧 FONCTION 4: Fermeture du modal de chat
   */
  const handleCloseChatModal = () => {
    setChatModalOpen(false);
    setSelectedUserForChat(null);
  };

  // Calcul des statistiques (inchangé)
  const stats = {
    total: users.length,
    active: activeUsersCount,
    suspended: suspendedUsersCount,
    pending: users.filter(u => u.status === 'pending_verification').length,
    avgTrustScore: users.length ? Math.round(users.reduce((sum, u) => sum + u.trust_score, 0) / users.length) : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header et contrôles - INCHANGÉ */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
        <div className="flex space-x-2">
          <Input 
            placeholder="Rechercher utilisateur..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Actifs ({stats.active})</SelectItem>
              <SelectItem value="suspended">Suspendus ({stats.suspended})</SelectItem>
              <SelectItem value="pending_verification">En attente ({stats.pending})</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous rôles</SelectItem>
              <SelectItem value="merchant">Marchands</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportUsers('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter ({filteredUsers.length})
          </Button>
        </div>
      </div>

      {/* Statistiques utilisateurs - INCHANGÉ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total utilisateurs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspendus</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score moyen</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgTrustScore}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions en masse - INCHANGÉ */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('verify')}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Vérifier
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('suspend')}>
                  <Ban className="h-4 w-4 mr-1" />
                  Suspendre
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedUsers([])}>
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des utilisateurs - SECTION CORRIGÉE */}
      <Card>
        <CardContent className="p-0">
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
                <TableHead>Utilisateur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Score confiance</TableHead>
                <TableHead>Activité</TableHead>
                <TableHead>Risque</TableHead>
                <TableHead>Inscrit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={user.risk_level === 'high' ? 'bg-red-50' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.full_name || user.email.split('@')[0]}</span>
                        {user.verification_status === 'verified' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {user.role === 'admin' && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{user.location || 'Localisation non renseignée'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="truncate max-w-32">{user.email}</span>
                      <span className="text-gray-500">{user.phone || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            user.trust_score >= 80 ? 'bg-green-500' : 
                            user.trust_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${user.trust_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{user.trust_score}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{user.listings_count} annonces</span>
                      <span className="text-gray-500">{formatAccountAge(user.account_age_days)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`text-xs font-medium ${
                        getUserRiskLevel(user) === 'Élevé' ? 'text-red-600' :
                        getUserRiskLevel(user) === 'Moyen' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {getUserRiskLevel(user)}
                      </span>
                      {user.reports_received > 0 && (
                        <span className="text-xs text-red-600">{user.reports_received} signalement(s)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  
                  {/* ✨ COLONNE ACTIONS - COMPLÈTEMENT RÉÉCRITE AVEC FONCTIONNALITÉS */}
                  <TableCell>
                    <div className="flex space-x-1">
                      
                      {/* 👁️ BOUTON VOIR PROFIL - FONCTIONNEL */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Voir le profil utilisateur"
                        onClick={() => handleViewProfile(user)}
                        className="hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      
                      {/* 💬 BOUTON MESSAGE ADMIN - FONCTIONNEL */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Envoyer un message administrateur"
                        onClick={() => handleOpenAdminChat(user)}
                        className="hover:bg-green-50"
                      >
                        <Mail className="h-4 w-4 text-green-600" />
                      </Button>
                      
                      {/* ⚡ BOUTON SUSPENSION/ACTIVATION - AMÉLIORÉ */}
                      {user.status === 'active' ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Suspendre cet utilisateur"
                              className="hover:bg-red-50"
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                              ) : (
                                <Ban className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center">
                                <Ban className="h-5 w-5 text-red-600 mr-2" />
                                Suspendre l'utilisateur
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir suspendre <strong>{user.full_name || user.email}</strong> ? 
                                <br /><br />
                                Cette action va :
                                <br />• Empêcher l'utilisateur de se connecter
                                <br />• Masquer ses annonces actives
                                <br />• Lui envoyer une notification de suspension
                                <br /><br />
                                Cette action peut être annulée ultérieurement.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleUserStatusAction(user, 'suspend')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Confirmer la suspension
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          title="Réactiver cet utilisateur"
                          onClick={() => handleUserStatusAction(user, 'activate')}
                          disabled={actionLoading === user.id}
                          className="hover:bg-green-50"
                        >
                          {actionLoading === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alertes utilisateurs à risque - INCHANGÉ */}
      {users.filter(u => u.risk_level === 'high').length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Utilisateurs à risque élevé détectés</h3>
                <p className="text-sm text-red-700 mt-1">
                  {users.filter(u => u.risk_level === 'high').length} utilisateur(s) nécessitent une attention immédiate 
                  en raison de signalements multiples ou d'activité suspecte.
                </p>
                <Button size="sm" variant="outline" className="mt-2">
                  Examiner les cas prioritaires
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🆕 MODAL DE CHAT ADMINISTRATEUR */}
      {chatModalOpen && selectedUserForChat && (
        <AdminChatModal
          isOpen={chatModalOpen}
          onClose={handleCloseChatModal}
          targetUser={selectedUserForChat}
        />
      )}
    </div>
  );
};

export default UsersTab;