import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/SmartImage";
import { MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  TrendingUp, 
  Play, 
  Pause, 
  Shield, 
  AlertTriangle,
  MessageCircle,
  ChevronDown
} from "lucide-react";
import { useListings, useCreateListing } from "@/hooks/useListings";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

const MyListings = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const { 
    listings, 
    loading, 
    error, 
    clearListings,
    fetchUserListings 
  } = useListings();
  const { deleteListing } = useCreateListing();
  const [activeTab, setActiveTab] = useState("all");
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [isMobileTabsOpen, setIsMobileTabsOpen] = useState(false);
  
  // État pour le dialogue de confirmation de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserListings(user.id);
    } else {
      clearListings();
    }
  }, [user?.id, fetchUserListings, clearListings]);

  const userListings = listings;
  
  const activeListings = userListings.filter(listing => listing.status === 'active');
  const suspendedListings = userListings.filter(listing => listing.status === 'suspended');

  const canUserReactivateListing = (listing: any): boolean => {
    if (listing.status !== 'suspended') {
      return false;
    }

    if (!listing.suspension_type || listing.suspension_type === 'user') {
      return true;
    }

    return listing.suspension_type !== 'admin' && listing.suspension_type !== 'system';
  };

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

  const handlePauseListing = async (listingId: string) => {
    if (!user?.id) return;
    
    setOperationLoading(listingId);
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'suspended',
          suspension_type: 'user',
          suspended_by: user.id,
          suspension_reason: 'Pause volontaire par le propriétaire',
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .eq('user_id', user.id);

      if (error) throw error;

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

  const handleResumeListing = async (listingId: string, listing: any) => {
    if (!user?.id) return;

    if (!canUserReactivateListing(listing)) {
      const explanation = getSuspensionExplanation(listing);
      toast({
        title: "Réactivation impossible",
        description: explanation,
        variant: "destructive"
      });
      return;
    }
    
    setOperationLoading(listingId);
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'active',
          suspension_type: null,
          suspended_by: null,
          suspension_reason: null,
          suspended_until: null,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', listingId)
        .eq('user_id', user.id);

      if (error) throw error;

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
        if (suspensionType === 'admin') {
          return <Badge className="bg-red-600/10 text-red-600 border-red-600/20">Suspendu par admin</Badge>;
        } else if (suspensionType === 'system') {
          return <Badge className="bg-purple-600/10 text-purple-600 border-purple-600/20">Suspendu (système)</Badge>;
        }
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">En pause</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Ouvrir le dialogue de confirmation de suppression
  const openDeleteDialog = (listingId: string) => {
    setListingToDelete(listingId);
    setDeleteDialogOpen(true);
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    if (!listingToDelete) return;
    
    const success = await deleteListing(listingToDelete);
    if (success && user?.id) {
      fetchUserListings(user.id);
      toast({
        title: "Annonce supprimée",
        description: "Votre annonce a été supprimée avec succès"
      });
    }
    
    setDeleteDialogOpen(false);
    setListingToDelete(null);
  };

  const getActionMenuItems = (listing: any) => {
    const canReactivate = canUserReactivateListing(listing);
    const isOperating = operationLoading === listing.id;

    return (
       <DropdownMenuContent align="end">
        <DropdownMenuItem asChild> 
          <Link to={`/listing/${listing.id}`} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Voir l'annonce
          </Link>
        </DropdownMenuItem> 

        <DropdownMenuItem asChild>
          <Link to={`/listing/${listing.id}`} className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Voir les détails
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {listing.status === 'active' && (
          <DropdownMenuItem 
            className="flex items-center gap-2"
            onClick={() => handlePauseListing(listing.id)}
            disabled={isOperating}
          >
            <Pause className="h-4 w-4" />
            {isOperating ? "Pause en cours..." : "Mettre en pause"}
          </DropdownMenuItem>
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

        {(listing.status !== 'suspended' || canReactivate) && (
          <DropdownMenuItem asChild>
            <Link to={`/edit-listing/${listing.id}`} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

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

        <DropdownMenuItem 
          className="text-destructive flex items-center gap-2"
          onClick={() => openDeleteDialog(listing.id)}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    );
  };

  const getListingsToShow = () => {
    switch (activeTab) {
      case 'active':
        return activeListings;
      case 'suspended':
        return suspendedListings;
      default:
        return userListings;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getActiveTabLabel = () => {
    switch (activeTab) {
      case 'all': return `Toutes (${userListings.length})`;
      case 'active': return `Actives (${activeListings.length})`;
      case 'suspended': return `Suspendues (${suspendedListings.length})`;
      default: return 'Toutes';
    }
  };

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
        
      </div>
    );
  }

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
        
      </div>
    );
  }

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
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* En-tête adapté mobile */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
              Mes annonces
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gérez vos annonces et suivez vos ventes
            </p>
          </div>
          <Link to="/publish">
            <Button className="gap-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              Nouvelle annonce
            </Button>
          </Link>
        </div>

        {/* Statistiques adaptées mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">{userListings.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">{activeListings.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Actives</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">{suspendedListings.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Suspendues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <Eye className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">
                {userListings.reduce((total, listing) => total + (listing.views_count || 0), 0)}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Vues totales</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation par onglets adaptée mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="hidden md:flex">
            <TabsTrigger value="all">Toutes ({userListings.length})</TabsTrigger>
            <TabsTrigger value="active">Actives ({activeListings.length})</TabsTrigger>
            <TabsTrigger value="suspended">
              Suspendues ({suspendedListings.length})
              {suspendedListings.some(l => l.suspension_type === 'admin') && (
                <Shield className="h-3 w-3 ml-1 text-red-500" />
              )}
            </TabsTrigger>
          </TabsList>

          <div className="md:hidden relative">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsMobileTabsOpen(!isMobileTabsOpen)}
            >
              <span>{getActiveTabLabel()}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isMobileTabsOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isMobileTabsOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-card border rounded-lg shadow-lg">
                <div className="p-2 space-y-1">
                  {[
                    { key: 'all', label: `Toutes (${userListings.length})` },
                    { key: 'active', label: `Actives (${activeListings.length})` },
                    { 
                      key: 'suspended', 
                      label: `Suspendues (${suspendedListings.length})`,
                      hasAdminSuspension: suspendedListings.some(l => l.suspension_type === 'admin')
                    }
                  ].map((tab) => (
                    <Button
                      key={tab.key}
                      variant={activeTab === tab.key ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab(tab.key);
                        setIsMobileTabsOpen(false);
                      }}
                    >
                      {tab.label}
                      {tab.hasAdminSuspension && (
                        <Shield className="h-3 w-3 ml-2 text-red-500" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <TabsContent value={activeTab} className="mt-4">
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
                          'suspendues'
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
              <>
                {/* AFFICHAGE MOBILE optimisé avec SmartImage */}
                <div className="block md:hidden space-y-3">
                  {getListingsToShow().map((listing) => (
                    <div
                      key={listing.id}
                      className="group bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex">
                        {/* Image à gauche optimisée */}
                        <div className="relative w-28 flex-shrink-0">
                          <SmartImage
                            src={listing.images?.[0] || "/placeholder.svg"}
                            alt={listing.title}
                            context="thumbnail"
                            className="aspect-square w-full group-hover:scale-105 transition-transform duration-300"
                            objectFit="cover"
                            lazy={true}
                            quality="medium"
                            showLoadingState={true}
                          />
                          
                          {/* Badge de statut */}
                          <div className="absolute top-1 left-1">
                            {getStatusBadge(listing.status, listing.suspension_type)}
                          </div>
                          
                          {/* Menu actions */}
                          <div className="absolute top-1 right-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="bg-background hover:bg-accent h-7 w-7 border border-border shadow-sm"
                                  disabled={operationLoading === listing.id}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              {getActionMenuItems(listing)}
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Contenu à droite */}
                        <div className="flex-1 p-3 flex flex-col justify-between min-h-28">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm leading-tight text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                              <Link to={`/listing/${listing.id}`} className="hover:underline">
                                {listing.title}
                              </Link>
                            </h3>
                            
                            <div className="text-lg font-bold text-primary mb-2">
                              {formatPrice(listing.price)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{listing.location}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Eye className="h-3 w-3" />
                                <span>{listing.views_count || 0}</span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground/80">
                              Créée le {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                            </div>

                            {listing.status === 'suspended' && (
                              <div className="mt-1 p-1.5 bg-muted/50 rounded text-xs text-muted-foreground">
                                {getSuspensionExplanation(listing)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AFFICHAGE DESKTOP optimisé avec SmartImage */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {getListingsToShow().map((listing) => (
                    <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <SmartImage
                          src={listing.images?.[0] || '/placeholder.svg'}
                          alt={listing.title}
                          context="card"
                          className="w-full h-40 md:h-48"
                          objectFit="cover"
                          lazy={true}
                          quality="high"
                          showLoadingState={true}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-2 md:top-3 left-2 md:left-3">
                          {getStatusBadge(listing.status, listing.suspension_type)}
                        </div>
                        <div className="absolute top-2 md:top-3 right-2 md:right-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="bg-background hover:bg-accent h-7 w-7 border border-border shadow-sm"
                                disabled={operationLoading === listing.id}
                              >
                                <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {getActionMenuItems(listing)}
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-semibold mb-2 text-sm md:text-base line-clamp-2">
                          <Link to={`/listing/${listing.id}`} className="hover:text-primary transition-colors">
                            {listing.title}
                          </Link>
                        </h3>
                        <p className="text-lg md:text-2xl font-bold text-primary mb-2">
                          {formatPrice(listing.price)}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3">
                          {listing.location}
                        </p>

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
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogue de confirmation de suppression personnalisé */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette annonce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'annonce sera définitivement supprimée 
              et ne pourra pas être récupérée. Toutes les photos et informations associées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setListingToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      
    </div>
  );
};

export default MyListings;