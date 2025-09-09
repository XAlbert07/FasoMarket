import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Eye, Edit, Trash2, Package, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useListings, useCreateListing } from "@/hooks/useListings"; // Import ajouté pour useCreateListing
import { useAuthContext } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";


const MyListings = () => {
  const { user } = useAuthContext();
  
  // CHANGEMENT CRITIQUE : Utilisation correcte du hook amélioré
  // Nous récupérons maintenant dataSource pour savoir d'où viennent nos données
  const { listings, loading, error, fetchUserListings, dataSource, clearListings } = useListings();
  const { deleteListing } = useCreateListing(); // Hook pour les opérations CRUD
  const [activeTab, setActiveTab] = useState("all");

  // Effect pour charger les annonces utilisateur au montage du composant
  useEffect(() => {
    // Vérification que l'utilisateur est connecté et a un ID
    if (user?.id) {
      console.log("🔄 Chargement des annonces utilisateur pour ID:", user.id);
      fetchUserListings(user.id);
    } else {
      console.log("⚠️ Aucun utilisateur connecté - nettoyage des données");
      clearListings(); // Nettoyer les données si pas d'utilisateur
    }
  }, [user?.id, fetchUserListings, clearListings]); // Dependencies complètes

  // Maintenant listings contient directement les annonces de l'utilisateur
  // Plus besoin de filtrer côté client
  const userListings = listings;
  
  // Filtrage par statut pour les onglets
  const activeListings = userListings.filter(listing => listing.status === 'active');
  const soldListings = userListings.filter(listing => listing.status === 'sold');
  const draftListings = userListings.filter(listing => listing.status === 'draft');

  const getStatusBadge = (status: string) => {
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
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getListingsToShow = () => {
    switch (activeTab) {
      case 'active':
        return activeListings;
      case 'sold':
        return soldListings;
      case 'draft':
        return draftListings;
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
      // Si la suppression réussit, recharger les annonces
      if (success && user?.id) {
        fetchUserListings(user.id);
      }
    }
  };

  // Gestion de l'état de chargement
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

  // Gestion des erreurs
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

  // Gestion du cas où l'utilisateur n'est pas connecté
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

        {/* Statistiques - Affichage même si pas d'annonces */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Toutes ({userListings.length})</TabsTrigger>
            <TabsTrigger value="active">Actives ({activeListings.length})</TabsTrigger>
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
                      : `Vous n'avez pas d'annonces ${activeTab === 'active' ? 'actives' : activeTab === 'sold' ? 'vendues' : 'en brouillon'}.`
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
                        {getStatusBadge(listing.status)}
                      </div>
                      <div className="absolute top-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/listing/${listing.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Voir l'annonce
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/edit-listing/${listing.id}`} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive flex items-center gap-2"
                              onClick={() => handleDelete(listing.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
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