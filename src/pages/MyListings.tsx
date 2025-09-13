import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Play, 
  Pause, 
  Shield, 
  AlertTriangle,
  MessageCircle 
} from "lucide-react";
import { useListings, useCreateListing } from "@/hooks/useListings";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

const MyListings = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  // Utilisation correcte du hook amélioré
  const { listings, loading, error, fetchUserListings, dataSource, clearListings } = useListings();
  const { deleteListing } = useCreateListing();
  const [activeTab, setActiveTab] = useState("all");
  const [operationLoading, setOperationLoading] = useState<string | null>(null); // Pour tracker les opérations en cours

  // Effect pour charger les annonces utilisateur au montage du composant
  useEffect(() => {
    if (user?.id) {
      console.log("🔄 Chargement des annonces utilisateur pour ID:", user.id);
      fetchUserListings(user.id);
    } else {
      console.log("⚠️ Aucun utilisateur connecté - nettoyage des données");
      clearListings();
    }
  }, [user?.id, fetchUserListings, clearListings]);

  // Maintenant listings contient directement les annonces de l'utilisateur
  const userListings = listings;
  
  // Filtrage par statut pour les onglets - MODIFIÉ pour inclure les suspensions
  const activeListings = userListings.filter(listing => listing.status === 'active');
  const soldListings = userListings.filter(listing => listing.status === 'sold');
  const draftListings = userListings.filter(listing => listing.status === 'draft');
  const suspendedListings = userListings.filter(listing => listing.status === 'suspended');

  // ========================================
  // FONCTIONS NOUVELLES : Gestion des suspensions avec vérification des droits
  // ========================================

  /**
   * Détermine si l'utilisateur peut réactiver une annonce suspendue
   * en fonction du type de suspension
   */
  const canUserReactivateListing = (listing: any): boolean => {
    if (listing.status !== 'suspended') {
      return false;
    }

    // Si le champ suspension_type n'existe pas ou est null, on considère que c'est une suspension utilisateur
    if (!listing.suspension_type || listing.suspension_type === 'user') {
      return true;
    }

    // Les suspensions admin et system ne peuvent pas être levées par l'utilisateur
    return listing.suspension_type !== 'admin' && listing.suspension_type !== 'system';
  };

  /**
   * Obtient un message explicatif sur le type de suspension
   */
  const getSuspensionExplanation = (listing: any): string => {
    if (listing.status !== 'suspended') return '';

    const suspensionType = listing.suspension_type || 'user';
    
    switch (suspensionType) {
      case 'admin':
        const reason = listing.suspension_reason ? ` (${listing.suspension_reason})` : '';
        const until = listing.suspended_until 
          ? ` jusqu'au ${new Date(listing.suspended_until).toLocaleDateString('fr-FR')}`
          : '';
        return `Suspendu par l'administration${until}${reason}`;
      
      case 'system':
        return `Suspendu automatiquement par le système. Contactez le support.`;
      
      case 'user':
      default:
        return `Mis en pause par vous-même. Vous pouvez le réactiver.`;
    }
  };

  /**
   * Suspend volontairement une annonce (action utilisateur)
   */
  const handlePauseListing = async (listingId: string) => {
    if (!user?.id) return;
    
    setOperationLoading(listingId);
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'suspended',
          suspension_type: 'user',  // Marquer comme suspension volontaire
          suspended_by: user.id,
          suspension_reason: 'Pause volontaire par le propriétaire',
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .eq('user_id', user.id); // Sécurité : seul le propriétaire peut modifier

      if (error) throw error;

      // Recharger les annonces pour refléter le changement
      fetchUserListings(user.id);
      
      toast({
        title: "Annonce mise en pause",
        description: "Votre annonce n'est plus visible par les acheteurs. Vous pouvez la réactiver à tout moment."
      });
    } catch (error) {
      console.error('Erreur pause:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre en pause l'annonce",
        variant: "destructive"
      });
    } finally {
      setOperationLoading(null);
    }
  };

  /**
   * Réactive une annonce suspendue UNIQUEMENT si l'utilisateur en a le droit
   */
  const handleResumeListing = async (listingId: string, listing: any) => {
    if (!user?.id) return;

    // Vérification critique : L'utilisateur peut-il réactiver cette annonce ?
    if (!canUserReactivateListing(listing)) {
      const explanation = getSuspensionExplanation(listing);
      toast({
        title: "Réactivation impossible",
        description: explanation,
        variant: "destructive"
      });
      return; // Arrêter l'exécution ici
    }
    
    setOperationLoading(listingId);
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'active',
          // Nettoyer les champs de suspension lors de la réactivation
          suspension_type: null,
          suspended_by: null,
          suspension_reason: null,
          suspended_until: null,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
        })
        .eq('id', listingId)
        .eq('user_id', user.id); // Sécurité

      if (error) throw error;

      // Recharger les annonces
      fetchUserListings(user.id);
      
      toast({
        title: "Annonce réactivée",
        description: "Votre annonce est de nouveau visible par les acheteurs"
      });
    } catch (error) {
      console.error('Erreur réactivation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réactiver l'annonce",
        variant: "destructive"
      });
    } finally {
      setOperationLoading(null);
    }
  };

  // ========================================
  // FONCTION MISE À JOUR : Badge de statut avec logique complète
  // ========================================

  /**
   * Génère le badge de statut approprié selon le statut et le type de suspension
   * Cette fonction implémente exactement la logique suggérée par l'IA
   */
  const getStatusBadge = (status: string, suspensionType?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Actif</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Vendu</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Brouillon</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Expiré</Badge>;
      case 'suspended':
        // LOGIQUE CRITIQUES : Distinction entre suspensions admin et utilisateur
        if (suspensionType === 'admin') {
          return <Badge className="bg-red-600/10 text-red-600 border-red-600/20">Suspendu par admin</Badge>;
        } else if (suspensionType === 'system') {
          return <Badge className="bg-purple-600/10 text-purple-600 border-purple-600/20">Suspendu (système)</Badge>;
        }
        // Suspension volontaire utilisateur ou suspension legacy (rétrocompatibilité)
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">En pause</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // ========================================
  // FONCTION MISE À JOUR : Contenu du menu déroulant avec logique conditionnelle
  // ========================================

  /**
   * Génère les éléments du menu d'actions selon le statut et les droits de l'utilisateur
   */
  const getActionMenuItems = (listing: any) => {
    const canReactivate = canUserReactivateListing(listing);
    const isOperating = operationLoading === listing.id;

    return (
       <DropdownMenuContent align="end">
        {/* Voir l'annonce (toujours disponible) */} 
        <DropdownMenuItem asChild> 
          <Link to={`/listing/${listing.id}`} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Voir l'annonce
          </Link>
        </DropdownMenuItem> 

        {/* Voir les détails/statistiques (toujours disponible) */}
        <DropdownMenuItem asChild>
          <Link to={`/listing/${listing.id}`} className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Voir les détails
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Actions conditionnelles selon le statut */}
        {listing.status === 'active' && (
          <>
            <DropdownMenuItem asChild>
              <Link to={`/edit-listing/${listing.id}`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2"
              onClick={() => handlePauseListing(listing.id)}
              disabled={isOperating}
            >
              <Pause className="h-4 w-4" />
              {isOperating ? "Pause en cours..." : "Mettre en pause"}
            </DropdownMenuItem>
          </>
        )}

        {listing.status === 'suspended' && canReactivate && (
          <DropdownMenuItem 
            className="flex items-center gap-2 text-green-600"
            onClick={() => handleResumeListing(listing.id, listing)}
            disabled={isOperating}
          >
            <Play className="h-4 w-4" />
            {isOperating ? "Réactivation..." : "Réactiver"}
          </DropdownMenuItem>
        )}

        {listing.status === 'suspended' && !canReactivate && (
          <DropdownMenuItem disabled className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            Suspension administrative
          </DropdownMenuItem>
        )}

        {/* Modification (disponible sauf pour les suspensions admin) */}
        {listing.status !== 'suspended' || canReactivate ? (
          <DropdownMenuItem asChild>
            <Link to={`/edit-listing/${listing.id}`} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        {/* Support pour les suspensions administratives */}
        {listing.status === 'suspended' && !canReactivate && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/help-support" className="flex items-center gap-2 text-blue-600">
                <MessageCircle className="h-4 w-4" />
                Contacter le support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Suppression (toujours disponible) */}
        <DropdownMenuItem 
          className="text-destructive flex items-center gap-2"
          onClick={() => handleDelete(listing.id)}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    );
  };

  // Fonction de filtrage mise à jour pour inclure les suspensions
  const getListingsToShow = () => {
    switch (activeTab) {
      case 'active':
        return activeListings;
      case 'sold':
        return soldListings;
      case 'draft':
        return draftListings;
      case 'suspended':
        return suspendedListings;
      default:
        return userListings;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const handleDelete = async (listingId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      const success = await deleteListing(listingId);
      if (success && user?.id) {
        fetchUserListings(user.id);
      }
    }
  };

  // Gestion de l'état de chargement (inchangée)
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de vos annonces...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion des erreurs (inchangée)
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              Erreur de chargement
            </h3>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={() => user?.id && fetchUserListings(user.id)}>
              Réessayer
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion du cas où l'utilisateur n'est pas connecté (inchangée)
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Connexion requise
            </h3>
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour voir vos annonces.
            </p>
            <Link to="/login">
              <Button>Se connecter</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">
              Mes annonces
            </h1>
            <p className="text-muted-foreground">
              Gérez vos annonces et suivez vos ventes
            </p>
          </div>
          <Link to="/publish">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle annonce
            </Button>
          </Link>
        </div>

        {/* Statistiques MISES À JOUR avec suspensions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{userListings.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{activeListings.length}</div>
              <div className="text-sm text-muted-foreground">Actives</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{soldListings.length}</div>
              <div className="text-sm text-muted-foreground">Vendues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{draftListings.length}</div>
              <div className="text-sm text-muted-foreground">Brouillons</div>
            </CardContent>
          </Card>
          {/* NOUVELLE CARTE : Statistique des suspensions */}
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{suspendedListings.length}</div>
              <div className="text-sm text-muted-foreground">Suspendues</div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets MODIFIÉS avec onglet suspensions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Toutes ({userListings.length})</TabsTrigger>
            <TabsTrigger value="active">Actives ({activeListings.length})</TabsTrigger>
            <TabsTrigger value="suspended">
              Suspendues ({suspendedListings.length})
              {suspendedListings.some(l => l.suspension_type === 'admin') && (
                <Shield className="h-3 w-3 ml-1 text-red-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="sold">Vendues ({soldListings.length})</TabsTrigger>
            <TabsTrigger value="draft">Brouillons ({draftListings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {getListingsToShow().length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucune annonce trouvée
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all' 
                      ? "Vous n'avez pas encore créé d'annonces." 
                      : `Vous n'avez pas d'annonces ${
                          activeTab === 'active' ? 'actives' : 
                          activeTab === 'sold' ? 'vendues' : 
                          activeTab === 'suspended' ? 'suspendues' :
                          'en brouillon'
                        }.`
                    }
                  </p>
                  <Link to="/publish">
                    <Button>
                      {activeTab === 'all' ? 'Créer ma première annonce' : 'Créer une nouvelle annonce'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getListingsToShow().map((listing) => (
                  <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={listing.images?.[0] || '/placeholder.svg'}
                        alt={listing.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        {/* APPEL MODIFIÉ : Passage du suspension_type */}
                        {getStatusBadge(listing.status, listing.suspension_type)}
                      </div>
                      <div className="absolute top-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="bg-white/90 hover:bg-white"
                              disabled={operationLoading === listing.id}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          {/* MENU MODIFIÉ : Utilisation de la fonction conditionnelle */}
                          {getActionMenuItems(listing)}
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {listing.title}
                      </h3>
                      <p className="text-2xl font-bold text-primary mb-2">
                        {formatPrice(listing.price)}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {listing.location}
                      </p>

                      {/* SECTION AJOUTÉE : Explication des suspensions */}
                      {listing.status === 'suspended' && (
                        <div className="mb-3 p-2 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {getSuspensionExplanation(listing)}
                          </p>
                          {listing.suspension_type === 'admin' && (
                            <p className="text-xs text-red-600 mt-1">
                              Contactez le support pour plus d'informations
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Créée le {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span>
                          {listing.views_count || 0} vues
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MyListings;