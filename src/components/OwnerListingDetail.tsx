// components/OwnerListingDetail.tsx
// Vue spéciale quand un vendeur consulte sa propre annonce
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Edit, 
  Eye, 
  Heart, 
  MessageCircle, 
  Phone, 
  Calendar, 
  TrendingUp,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
  BarChart3,
  Users,
  MapPin
} from "lucide-react";
import { useListing } from "@/hooks/useListings";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatRelativeTime } from "@/lib/utils";

// Interface pour les statistiques détaillées de l'annonce du point de vue propriétaire
interface OwnerListingStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  favoriteCount: number;
  contactsCount: number;
  messagesCount: number;
  conversionRate: number; // Pourcentage de vues qui ont généré un contact
  averageViewDuration: number; // En secondes
  peakViewingHours: string[]; // Heures où l'annonce est le plus consultée
}

// Interface pour les contacts/leads générés par l'annonce
interface ContactLead {
  id: string;
  prospectName: string;
  contactedAt: string;
  contactMethod: 'phone' | 'message';
  status: 'pending' | 'responded' | 'converted' | 'lost';
  lastMessage?: string;
}

const OwnerListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listing, loading, error } = useListing(id!);
  
  // États spécifiques à la vue propriétaire
  const [stats, setStats] = useState<OwnerListingStats | null>(null);
  const [contacts, setContacts] = useState<ContactLead[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Simulation du chargement des statistiques propriétaire
  // Dans une vraie implémentation, ceci ferait appel à votre API
  useEffect(() => {
    if (listing) {
      // Simulation de données statistiques pour la démonstration
      const mockStats: OwnerListingStats = {
        totalViews: listing.views_count || 0,
        todayViews: Math.floor((listing.views_count || 0) * 0.1),
        weekViews: Math.floor((listing.views_count || 0) * 0.3),
        favoriteCount: Math.floor((listing.views_count || 0) * 0.05),
        contactsCount: Math.floor((listing.views_count || 0) * 0.02),
        messagesCount: Math.floor((listing.views_count || 0) * 0.015),
        conversionRate: 2.3,
        averageViewDuration: 45,
        peakViewingHours: ['18:00-19:00', '20:00-21:00', '14:00-15:00']
      };

      const mockContacts: ContactLead[] = [
        {
          id: '1',
          prospectName: 'Fatou D.',
          contactedAt: '2024-01-20T14:30:00Z',
          contactMethod: 'phone',
          status: 'pending',
          lastMessage: 'Intéressée par le produit, demande plus d\'informations'
        },
        {
          id: '2',
          prospectName: 'Ibrahim K.',
          contactedAt: '2024-01-19T16:15:00Z',
          contactMethod: 'message',
          status: 'responded',
          lastMessage: 'Souhaite négocier le prix'
        }
      ];

      setStats(mockStats);
      setContacts(mockContacts);
    }
  }, [listing]);

  // Gestion des actions propriétaire
  const handlePauseListing = async () => {
    setIsUpdatingStatus(true);
    try {
      // Ici, vous feriez appel à votre API pour changer le statut
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      
      toast({
        title: "Annonce mise en pause",
        description: "Votre annonce n'est plus visible par les acheteurs"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre en pause l'annonce",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResumeListing = async () => {
    setIsUpdatingStatus(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      
      toast({
        title: "Annonce réactivée",
        description: "Votre annonce est de nouveau visible par les acheteurs"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réactiver l'annonce",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleEditListing = () => {
    navigate(`/edit-listing/${id}`);
  };

  const handleDeleteListing = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.')) {
      try {
        // Appel API pour supprimer
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
        
        toast({
          title: "Annonce supprimée",
          description: "Votre annonce a été supprimée définitivement"
        });
        
        navigate('/my-listings');
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'annonce",
          variant: "destructive"
        });
      }
    }
  };

  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Chargement de votre annonce...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Annonce introuvable</h1>
            <p className="text-muted-foreground mb-4">
              Cette annonce n'existe pas ou vous n'avez pas les droits pour la consulter.
            </p>
            <Button onClick={() => navigate('/my-listings')}>
              Mes annonces
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* En-tête avec actions propriétaire */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Gestion de votre annonce
            </h1>
            <p className="text-muted-foreground">
              Consultez les performances et gérez votre annonce "{listing.title}"
            </p>
          </div>
          
          {/* Actions principales du propriétaire */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEditListing}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            
            {listing.status === 'active' ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePauseListing}
                disabled={isUpdatingStatus}
              >
                <Pause className="h-4 w-4 mr-2" />
                {isUpdatingStatus ? "..." : "Mettre en pause"}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResumeListing}
                disabled={isUpdatingStatus}
              >
                <Play className="h-4 w-4 mr-2" />
                {isUpdatingStatus ? "..." : "Réactiver"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeleteListing}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Alerte de statut si nécessaire */}
        {listing.status !== 'active' && (
          <div className="mb-6">
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Annonce en pause :</strong> Votre annonce n'est actuellement pas visible par les acheteurs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistiques en aperçu - SECTION CORRIGÉE */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Carte Vues totales */}
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.totalViews}</div>
                <div className="text-sm text-muted-foreground">Vues totales</div>
                <div className="text-xs text-green-600">+{stats.todayViews} aujourd'hui</div>
              </CardContent>
            </Card>
            
            {/* Carte Favoris */}
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.favoriteCount}</div>
                <div className="text-sm text-muted-foreground">Favoris</div>
                <div className="text-xs text-muted-foreground">
                  {((stats.favoriteCount / stats.totalViews) * 100).toFixed(1)}% des vues
                </div>
              </CardContent>
            </Card>
            
            {/* Carte Contacts */}
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.contactsCount}</div>
                <div className="text-sm text-muted-foreground">Contacts reçus</div>
                <div className="text-xs text-green-600">{stats.conversionRate}% de conversion</div>
              </CardContent>
            </Card>
            
            {/* Carte Durée moyenne */}
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.averageViewDuration}s</div>
                <div className="text-sm text-muted-foreground">Durée moyenne</div>
                <div className="text-xs text-muted-foreground">par visite</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section des onglets - STRUCTURE CORRIGÉE */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="analytics">Statistiques</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
            <TabsTrigger value="preview">Aperçu public</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations de l'annonce */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Détails de votre annonce</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                      <div className="text-2xl font-bold text-primary mb-3">
                        {formatPrice(listing.price, listing.currency)}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">
                          {listing.categories?.name || listing.category_id}
                        </Badge>
                        <Badge variant={listing.condition === 'new' ? 'default' : 'outline'}>
                          {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                        </Badge>
                        <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                          {listing.status === 'active' ? 'Actif' : 'En pause'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        {listing.location}
                      </div>
                      
                      <p className="text-muted-foreground text-sm">
                        {listing.description}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Publié le :</span>
                        <p className="font-medium">
                          {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dernière modification :</span>
                        <p className="font-medium">
                          {formatRelativeTime(listing.updated_at || listing.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions rapides */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" onClick={handleEditListing}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier l'annonce
                    </Button>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/listing/${listing.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir comme acheteur
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={listing.status === 'active' ? handlePauseListing : handleResumeListing}
                      disabled={isUpdatingStatus}
                    >
                      {listing.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Mettre en pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Réactiver
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance cette semaine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Nouvelles vues :</span>
                        <span className="font-medium">{stats?.weekViews}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nouveaux favoris :</span>
                        <span className="font-medium">+{Math.floor((stats?.favoriteCount || 0) * 0.3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contacts reçus :</span>
                        <span className="font-medium">+{Math.floor((stats?.contactsCount || 0) * 0.4)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Statistiques détaillées */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Évolution des vues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    [Graphique des vues par jour - à implémenter avec Chart.js]
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Heures de pic d'affluence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.peakViewingHours.map((hour, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{hour}</span>
                        <div className="w-20 h-2 bg-muted rounded">
                          <div 
                            className="h-full bg-primary rounded" 
                            style={{ width: `${90 - (index * 20)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Optimisez vos réponses aux messages pendant ces créneaux
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Comparaison avec vos autres annonces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">+23%</div>
                    <div className="text-sm text-muted-foreground">Vues vs moyenne</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">+15%</div>
                    <div className="text-sm text-muted-foreground">Taux d'engagement</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{stats?.conversionRate}%</div>
                    <div className="text-sm text-muted-foreground">Taux de conversion</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion des contacts */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Prospects intéressés
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Personnes qui ont manifesté un intérêt pour votre annonce
                </p>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{contact.prospectName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {contact.contactMethod === 'phone' ? 'Appel téléphonique' : 'Message'}
                              • {formatRelativeTime(contact.contactedAt)}
                            </p>
                          </div>
                          <Badge variant={
                            contact.status === 'pending' ? 'secondary' :
                            contact.status === 'responded' ? 'default' :
                            contact.status === 'converted' ? 'default' :
                            'outline'
                          }>
                            {contact.status === 'pending' && 'En attente'}
                            {contact.status === 'responded' && 'Répondu'}
                            {contact.status === 'converted' && 'Converti'}
                            {contact.status === 'lost' && 'Perdu'}
                          </Badge>
                        </div>
                        
                        {contact.lastMessage && (
                          <p className="text-sm bg-muted p-2 rounded">
                            {contact.lastMessage}
                          </p>
                        )}
                        
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Répondre
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4 mr-2" />
                            Appeler
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Aucun contact pour le moment</h3>
                    <p className="text-muted-foreground text-sm">
                      Les personnes intéressées par votre annonce apparaîtront ici
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aperçu public */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aperçu acheteur</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Voici comment les acheteurs voient votre annonce
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-center text-muted-foreground">
                    [Ici s'afficherait l'aperçu de votre annonce tel que vu par les acheteurs]
                  </p>
                  <div className="text-center mt-4">
                    <Button asChild>
                      <Link to={`/listing/${listing.id}`} target="_blank">
                        Voir la version complète
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default OwnerListingDetail;