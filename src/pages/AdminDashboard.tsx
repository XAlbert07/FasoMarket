import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Package, AlertTriangle, BarChart3, Settings, CheckCircle, XCircle, Eye, Trash2, UserCheck, UserX, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState([
    {
      id: 1,
      title: "iPhone 13 Pro",
      merchant: "Jean Dupont",
      price: "450 000 FCFA",
      status: "pending",
      createdAt: "2024-01-15",
      reports: 0
    },
    {
      id: 2,
      title: "Terrain à vendre - Ouaga",
      merchant: "Marie Kaboré",
      price: "15 000 000 FCFA",
      status: "active",
      createdAt: "2024-01-10",
      reports: 2
    }
  ]);
  
  const [merchants, setMerchants] = useState([
    {
      id: 1,
      name: "Jean Dupont",
      email: "jean@email.com",
      status: "active",
      listings: 5,
      joinedAt: "2023-12-01"
    },
    {
      id: 2,
      name: "Marie Kaboré",
      email: "marie@email.com",
      status: "suspended",
      listings: 3,
      joinedAt: "2023-11-15"
    }
  ]);

  const [reports, setReports] = useState([
    {
      id: 1,
      listingId: 2,
      listingTitle: "Terrain à vendre - Ouaga",
      reason: "Prix suspect",
      reporter: "Utilisateur anonyme",
      status: "pending",
      createdAt: "2024-01-20"
    }
  ]);

  useEffect(() => {
    // Check if user is authenticated and has admin role
    const checkAuth = async () => {
      const mockUser = { id: 1, email: "admin@test.com", role: "admin" };
      setUser(mockUser);
    };
    checkAuth();
  }, []);

  const handleApproveListing = (id: number) => {
    setListings(listings.map(l => 
      l.id === id ? { ...l, status: "active" } : l
    ));
    toast({
      title: "Annonce approuvée",
      description: "L'annonce a été approuvée et est maintenant visible.",
    });
  };

  const handleRejectListing = (id: number) => {
    setListings(listings.map(l => 
      l.id === id ? { ...l, status: "rejected" } : l
    ));
    toast({
      title: "Annonce rejetée",
      description: "L'annonce a été rejetée.",
      variant: "destructive"
    });
  };

  const handleDeleteListing = (id: number) => {
    setListings(listings.filter(l => l.id !== id));
    toast({
      title: "Annonce supprimée",
      description: "L'annonce a été définitivement supprimée.",
    });
  };

  const handleSuspendMerchant = (id: number) => {
    setMerchants(merchants.map(m => 
      m.id === id ? { ...m, status: "suspended" } : m
    ));
    toast({
      title: "Marchand suspendu",
      description: "Le marchand a été suspendu.",
    });
  };

  const handleActivateMerchant = (id: number) => {
    setMerchants(merchants.map(m => 
      m.id === id ? { ...m, status: "active" } : m
    ));
    toast({
      title: "Marchand activé",
      description: "Le marchand a été réactivé.",
    });
  };

  const handleResolveReport = (id: number) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, status: "resolved" } : r
    ));
    toast({
      title: "Signalement résolu",
      description: "Le signalement a été traité.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      active: "default",
      pending: "secondary",
      rejected: "destructive",
      suspended: "destructive"
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <Shield className="mr-2 h-5 w-5" />
              Accès Refusé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous n'avez pas les permissions pour accéder à cette page.</p>
            <Button className="mt-4" onClick={() => navigate("/")}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Administration FasoMarket
          </h1>
          <p className="text-muted-foreground">
            Gérez la plateforme, les utilisateurs et les contenus
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchants.length}</div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {listings.filter(l => l.status === "pending").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Signalements</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.filter(r => r.status === "pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">Annonces</TabsTrigger>
            <TabsTrigger value="merchants">Marchands</TabsTrigger>
            <TabsTrigger value="reports">Signalements</TabsTrigger>
            <TabsTrigger value="analytics">Statistiques</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gestion des Annonces</h2>
              <Input 
                placeholder="Rechercher une annonce..." 
                className="max-w-sm"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Marchand</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Signalements</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell>{listing.merchant}</TableCell>
                    <TableCell>{listing.price}</TableCell>
                    <TableCell>{getStatusBadge(listing.status)}</TableCell>
                    <TableCell>
                      {listing.reports > 0 && (
                        <Badge variant="destructive">{listing.reports}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{listing.createdAt}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {listing.status === "pending" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleApproveListing(listing.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRejectListing(listing.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. L'annonce sera définitivement supprimée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteListing(listing.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="merchants" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gestion des Marchands</h2>
              <Input 
                placeholder="Rechercher un marchand..." 
                className="max-w-sm"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Annonces</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell className="font-medium">{merchant.name}</TableCell>
                    <TableCell>{merchant.email}</TableCell>
                    <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                    <TableCell>{merchant.listings}</TableCell>
                    <TableCell>{merchant.joinedAt}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {merchant.status === "active" ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSuspendMerchant(merchant.id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleActivateMerchant(merchant.id)}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-xl font-semibold">Signalements</h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Annonce</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Signalé par</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.listingTitle}</TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>{report.reporter}</TableCell>
                    <TableCell>{report.createdAt}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      {report.status === "pending" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResolveReport(report.id)}
                        >
                          Résoudre
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques de la Plateforme</CardTitle>
                <CardDescription>
                  Analysez l'activité globale de FasoMarket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tableau de bord analytique complet en cours de développement.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de la Plateforme</CardTitle>
                <CardDescription>
                  Configurez les paramètres globaux de FasoMarket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface de configuration en cours de développement.
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

export default AdminDashboard;