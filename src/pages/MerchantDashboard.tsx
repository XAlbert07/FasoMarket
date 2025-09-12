import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice } from "@/lib/utils";
import { 
  Plus, Eye, Edit, Trash2, Package, MessageCircle, Settings, 
  Star, Calendar, Phone, Mail, MapPin, AlertCircle, CheckCircle2, 
  Clock, PauseCircle, XCircle, Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Import de tous les hooks nécessaires
import { useSellerListings } from "@/hooks/useSellerListings";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useSellerReviews } from "@/hooks/useSellerReviews";
import { useCreateListing } from "@/hooks/useListings";
import { useMessages } from "@/hooks/useMessages";

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthContext();
  
  // États locaux pour la gestion de l'interface
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Utilisation de tous les hooks avec gestion d'erreur appropriée
  const { 
    listings, 
    loading: listingsLoading, 
    error: listingsError,
    refreshListings 
  } = useSellerListings(user?.id || '', {
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const {
    profile,
    stats: profileStats,
    loading: profileLoading,
    error: profileError,
    refreshProfile
  } = useSellerProfile(user?.id || '');

  const {
    stats: reviewsStats,
    loading: reviewsLoading,
    error: reviewsError
  } = useSellerReviews(user?.id || '');

  // Hook pour les opérations CRUD sur les annonces
  const { deleteListing } = useCreateListing();

  // Hook pour la messagerie unifiée
  const {
    conversations,
    messages,
    loading: messagesLoading,
    fetchMessages,
    sendMessage,
    markConversationAsRead
  } = useMessages();

  // Vérification d'authentification dans useEffect pour éviter les erreurs de setState
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour accéder au tableau de bord.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, authLoading, navigate, toast]);

  // Fonction pour supprimer une annonce avec confirmation
  const handleDeleteListing = async (listingId: string, title: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'annonce "${title}" ?\n\nCette action est irréversible.`
    );
    
    if (confirmed) {
      const success = await deleteListing(listingId);
      if (success) {
        toast({
          title: "Annonce supprimée",
          description: "L'annonce a été supprimée avec succès.",
        });
        refreshListings();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'annonce. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    }
  };

  // Fonction pour obtenir le badge de statut approprié
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        variant: "default" as const, 
        label: "Actif", 
        icon: CheckCircle2,
        className: "bg-green-500/10 text-green-500 border-green-500/20"
      },
      sold: { 
        variant: "secondary" as const, 
        label: "Vendu", 
        icon: CheckCircle2,
        className: "bg-blue-500/10 text-blue-500 border-blue-500/20"
      },
      paused: { 
        variant: "secondary" as const, 
        label: "En pause", 
        icon: PauseCircle,
        className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      },
      expired: { 
        variant: "destructive" as const, 
        label: "Expiré", 
        icon: Clock,
        className: "bg-orange-500/10 text-orange-500 border-orange-500/20"
      },
      suspended: { 
        variant: "destructive" as const, 
        label: "Suspendu", 
        icon: XCircle,
        className: "bg-red-500/10 text-red-500 border-red-500/20"
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
      icon: AlertCircle,
      className: ""
    };

    const IconComponent = config.icon;

    return (
      <Badge className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcul des métriques du tableau de bord
  const getDashboardMetrics = () => {
    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === 'active').length;
    const totalViews = listings.reduce((acc, listing) => acc + (listing.views_count || 0), 0);
    const unreadMessages = conversations.reduce((acc, conv) => acc + conv.unread_count, 0);
    
    return {
      totalListings,
      activeListings,
      totalViews,
      unreadMessages,
      totalConversations: conversations.length,
      averageRating: reviewsStats?.averageRating || 0,
      totalReviews: reviewsStats?.totalReviews || 0
    };
  };

  const metrics = getDashboardMetrics();

  // Fonctions pour la gestion des conversations
  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      await fetchMessages(conversation.listing_id, conversation.participant_id);
      await markConversationAsRead(conversation.listing_id, conversation.participant_id);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation || !conversation.participant_id) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer un message à un invité depuis cette interface",
        variant: "destructive"
      });
      return;
    }

    const success = await sendMessage(
      conversation.listing_id,
      conversation.participant_id,
      newMessage
    );

    if (success) {
      setNewMessage("");
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Hier ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  // Gestion des états de chargement
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de votre tableau de bord...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion des erreurs d'authentification
  if (!user) {
    return null; // Le useEffect redirige déjà
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* En-tête avec informations du profil */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {profile?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Bonjour, {profile?.full_name || 'Marchand'}
                </h1>
                <p className="text-muted-foreground">
                  Bienvenue sur votre tableau de bord FasoMarket
                </p>
                {profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => navigate("/publish")} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Annonce
            </Button>
          </div>
          
          {/* Informations de contact */}
          {profile && (
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              {profile.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              {profile.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.city}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Membre depuis {formatDate(profile.created_at)}
              </div>
            </div>
          )}
        </div>

        {/* Alertes d'erreur */}
        {(listingsError || profileError || reviewsError) && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Une erreur s'est produite lors du chargement de certaines données. 
              Veuillez rafraîchir la page ou contacter le support si le problème persiste.
            </AlertDescription>
          </Alert>
        )}

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Annonces</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalListings}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeListings} active{metrics.activeListings !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Moyenne: {metrics.totalListings > 0 ? Math.round(metrics.totalViews / metrics.totalListings) : 0} par annonce
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalReviews} avis reçu{metrics.totalReviews !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets du tableau de bord */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="listings">Mes Annonces ({metrics.totalListings})</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              Messages
              {metrics.unreadMessages > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {metrics.unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dernières annonces */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Dernières Annonces</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTab("listings")}>
                      Voir tout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {listingsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Chargement...</p>
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Aucune annonce pour le moment
                      </p>
                      <Button size="sm" onClick={() => navigate("/publish")}>
                        Créer ma première annonce
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {listings.slice(0, 5).map((listing) => (
                        <div key={listing.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={listing.images?.[0] || '/placeholder.svg'} 
                              alt={listing.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(listing.price, listing.currency)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(listing.status)}
                            <span className="text-xs text-muted-foreground">
                              {listing.views_count} vues
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques de performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                  <CardDescription>
                    Vos statistiques des 30 derniers jours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Annonces actives</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.activeListings}/{metrics.totalListings}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Vues totales</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.totalViews.toLocaleString()}
                      </span>
                    </div>
                    {reviewsStats && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Note moyenne</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-muted-foreground">
                            {reviewsStats.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Mes Annonces */}
          <TabsContent value="listings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Mes Annonces</h2>
                <p className="text-sm text-muted-foreground">
                  Gérez vos {metrics.totalListings} annonce{metrics.totalListings !== 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={() => navigate("/publish")} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Annonce
              </Button>
            </div>

            {listingsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement de vos annonces...</p>
              </div>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune annonce</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre première annonce sur FasoMarket
                  </p>
                  <Button onClick={() => navigate("/publish")}>
                    Créer ma première annonce
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {listings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex space-x-4">
                          <img 
                            src={listing.images?.[0] || '/placeholder.svg'} 
                            alt={listing.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
                              {getStatusBadge(listing.status)}
                            </div>
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(listing.price, listing.currency)}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Eye className="mr-1 h-4 w-4" />
                                {listing.views_count} vues
                              </span>
                              <span className="flex items-center">
                                <MapPin className="mr-1 h-4 w-4" />
                                {listing.location}
                              </span>
                              <span>
                                Créée le {formatDate(listing.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/listing/${listing.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/edit-listing/${listing.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteListing(listing.id, listing.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Messages - Interface complète */}
          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Liste des conversations */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Conversations
                    </CardTitle>
                    {metrics.unreadMessages > 0 && (
                      <Badge variant="destructive">
                        {metrics.unreadMessages} non lu{metrics.unreadMessages > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {metrics.totalConversations} conversation{metrics.totalConversations !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[450px] overflow-y-auto">
                    {messagesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Chargement...</p>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Aucune conversation pour le moment
                        </p>
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedConversation === conversation.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleSelectConversation(conversation.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage src={conversation.participant_avatar} />
                                <AvatarFallback>
                                  {conversation.participant_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm truncate">
                                    {conversation.participant_name}
                                  </p>
                                  {!conversation.is_participant_registered && (
                                    <Badge variant="outline" className="text-xs">
                                      Invité
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-1 truncate">
                                  {conversation.listing_title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {conversation.last_message}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-muted-foreground">
                                {formatMessageDate(conversation.last_message_at)}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Badge 
                                  variant="destructive" 
                                  className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                                >
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Interface de conversation */}
              <div className="lg:col-span-2">
                {selectedConversation ? (
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      {(() => {
                        const conversation = conversations.find(c => c.id === selectedConversation);
                        return conversation ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={conversation.participant_avatar} />
                                <AvatarFallback>
                                  {conversation.participant_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {conversation.participant_name}
                                  {!conversation.is_participant_registered && (
                                    <Badge variant="outline" className="text-xs">
                                      Invité
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription>
                                  À propos de: {conversation.listing_title}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>{formatPrice(conversation.listing_price, conversation.listing_currency)}</p>
                              <p>{conversation.total_messages} message{conversation.total_messages !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </CardHeader>

                    {/* Zone des messages */}
                    <CardContent className="flex-1 flex flex-col min-h-0">
                      <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-[300px]">
                        {messagesLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">Chargement des messages...</p>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Aucun message dans cette conversation
                            </p>
                          </div>
                        ) : (
                          messages.map((message) => {
                            const isFromMe = message.sender_info.id === user?.id;
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`flex items-start space-x-2 max-w-[70%] ${isFromMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                  {!isFromMe && (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={message.sender_info.avatar_url} />
                                      <AvatarFallback className="text-xs">
                                        {message.sender_info.name.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div>
                                    <div
                                      className={`rounded-lg px-3 py-2 ${
                                        isFromMe
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      <p className="text-sm">{message.content}</p>
                                    </div>
                                    <p className={`text-xs text-muted-foreground mt-1 ${isFromMe ? 'text-right' : 'text-left'}`}>
                                      {formatMessageDate(message.created_at)}
                                      {!message.is_read && !isFromMe && (
                                        <span className="ml-1 text-blue-500">• Nouveau</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Zone d'envoi de message */}
                      {(() => {
                        const conversation = conversations.find(c => c.id === selectedConversation);
                        if (!conversation?.is_participant_registered) {
                          return (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Ce message provient d'un invité. Vous pouvez le contacter directement par 
                                email ({conversation?.participant_email}) ou téléphone 
                                {conversation?.participant_phone && ` (${conversation.participant_phone})`}.
                              </AlertDescription>
                            </Alert>
                          );
                        }

                        return (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Tapez votre message..."
                              className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              disabled={messagesLoading}
                            />
                            <Button 
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim() || messagesLoading}
                              size="sm"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
                      <p className="text-muted-foreground">
                        Choisissez une conversation dans la liste pour voir les messages
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Paramètres du Compte
                  </CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles et préférences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => navigate("/profile")} variant="outline">
                      Modifier mon profil
                    </Button>
                    <Button onClick={() => navigate("/my-listings")} variant="outline">
                      Voir toutes mes annonces
                    </Button>
                    <Button onClick={refreshProfile} variant="outline">
                      Actualiser mes données
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques de base */}
              {profileStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Total des annonces</p>
                        <p className="text-2xl font-bold">{profileStats.totalListings}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Annonces actives</p>
                        <p className="text-2xl font-bold">{profileStats.activeListings}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Vues totales</p>
                        <p className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Note moyenne</p>
                        <p className="text-2xl font-bold">
                          {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : '--'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MerchantDashboard;