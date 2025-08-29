import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Edit, Trash2, BarChart3, Package, MessageCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState([
    {
      id: 1,
      title: "iPhone 13 Pro",
      price: "450 000 FCFA",
      status: "active",
      views: 156,
      messages: 8,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "Terrain à vendre - Ouaga",
      price: "15 000 000 FCFA",
      status: "pending",
      views: 89,
      messages: 3,
      createdAt: "2024-01-10"
    }
  ]);

  useEffect(() => {
    // Check if user is authenticated and has merchant role
    const checkAuth = async () => {
      // This will be replaced with actual Supabase auth
      const mockUser = { id: 1, email: "merchant@test.com", role: "merchant" };
      setUser(mockUser);
    };
    checkAuth();
  }, []);

  const handleDeleteListing = (id: number) => {
    setListings(listings.filter(l => l.id !== id));
    toast({
      title: "Annonce supprimée",
      description: "L'annonce a été supprimée avec succès.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      active: "default",
      pending: "secondary",
      rejected: "destructive"
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tableau de bord marchand
          </h1>
          <p className="text-muted-foreground">
            Gérez vos annonces et suivez vos performances
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Annonces</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{listings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {listings.reduce((acc, listing) => acc + listing.views, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {listings.reduce((acc, listing) => acc + listing.messages, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">Mes Annonces</TabsTrigger>
            <TabsTrigger value="analytics">Statistiques</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mes Annonces</h2>
              <Button onClick={() => navigate("/publish")}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Annonce
              </Button>
            </div>

            <div className="grid gap-4">
              {listings.map((listing) => (
                <Card key={listing.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{listing.title}</h3>
                        <p className="text-2xl font-bold text-primary">{listing.price}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Eye className="mr-1 h-4 w-4" />
                            {listing.views} vues
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            {listing.messages} messages
                          </span>
                          <span>Créée le {listing.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(listing.status)}
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteListing(listing.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques de Performance</CardTitle>
                <CardDescription>
                  Analysez les performances de vos annonces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Graphiques et analyses détaillées seront disponibles prochainement.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Gérez vos conversations avec les acheteurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Système de messagerie en cours de développement.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du Compte</CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles et préférences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Paramètres de compte à implémenter.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MerchantDashboard;