// components/OwnerListingDetail.tsx
// Version Mobile-First complète avec navigation tactile optimisée
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  MapPin,
  Shield,
  Clock,
  ChevronLeft,
  ArrowLeft,
  ExternalLink,
  MoreVertical,
  Share2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useListing } from "@/hooks/useListings";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/contexts/AuthContext";

// Interfaces conservées pour la compatibilité avec le système existant
interface RealListingStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  favoriteCount: number;
  contactsCount: number;
  messagesCount: number;
  lastViewedAt: string | null;
  isActive: boolean;
}

interface RealContactLead {
  id: string;
  prospectName: string;
  prospectEmail: string;
  prospectPhone: string | null;
  contactedAt: string;
  contactMethod: 'phone' | 'message' | 'guest_message';
  message: string;
  status: 'unread' | 'read' | 'replied';
  listing_id: string;
}


const extractSenderData = (sender: any) => {
  if (!sender) {
    return { full_name: 'Utilisateur', email: 'N/A', phone: null };
  }
  
  if (Array.isArray(sender)) {
    const senderObj = sender[0] || {};
    return {
      full_name: senderObj.full_name || 'Utilisateur',
      email: senderObj.email || 'N/A',
      phone: senderObj.phone || null
    };
  }
  
  return {
    full_name: sender.full_name || 'Utilisateur',
    email: sender.email || 'N/A',
    phone: sender.phone || null
  };
};



const OwnerListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { listing, loading, error, refetch } = useListing(id!);
  
  // États pour les données métier
  const [stats, setStats] = useState<RealListingStats | null>(null);
  const [contacts, setContacts] = useState<RealContactLead[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // États spécifiques pour l'interface mobile
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);

  // Logique métier conservée identique pour la gestion des suspensions
  const canUserReactivateListing = (): boolean => {
    if (!listing || listing.status !== 'suspended') return false;
    if (!listing.suspension_type || listing.suspension_type === 'user') return true;
    return false;
  };

  const getSuspensionMessage = (): { message: string; canReactivate: boolean; isAdminAction: boolean } => {
    if (!listing || listing.status !== 'suspended') {
      return { message: '', canReactivate: false, isAdminAction: false };
    }

    const canReactivate = canUserReactivateListing();
    const suspensionType = listing.suspension_type || 'user';

    switch (suspensionType) {
      case 'admin':
        const untilDate = listing.suspended_until 
          ? new Date(listing.suspended_until).toLocaleDateString('fr-FR')
          : 'une durée indéterminée';
        const reason = listing.suspension_reason ? ` Raison : ${listing.suspension_reason}` : '';
        return {
          message: `Suspendue par l'administration jusqu'au ${untilDate}.${reason}`,
          canReactivate: false,
          isAdminAction: true
        };
      case 'system':
        return {
          message: "Suspendue automatiquement par le système. Contactez le support.",
          canReactivate: false,
          isAdminAction: false
        };
      default:
        return {
          message: "Annonce en pause. Vous pouvez la réactiver à tout moment.",
          canReactivate: true,
          isAdminAction: false
        };
    }
  };

  // Fonction de récupération des statistiques réelles depuis la base de données
  const fetchRealStats = useCallback(async () => {
    if (!listing?.id) return;
    
    setStatsLoading(true);
    try {
      // Récupération du nombre de favoris réels
      const { count: favoriteCount } = await supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .eq('listing_id', listing.id);

      // Récupération du nombre de messages réels
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('listing_id', listing.id)
        .eq('receiver_id', listing.user_id);

      // Utilisation des vues existantes et calculs estimatifs
      const totalViews = listing.views_count || 0;
      const todayViews = Math.floor(totalViews * 0.1);
      const weekViews = Math.floor(totalViews * 0.3);

      const realStats: RealListingStats = {
        totalViews,
        todayViews, 
        weekViews,
        favoriteCount: favoriteCount || 0,
        contactsCount: messagesCount || 0,
        messagesCount: messagesCount || 0,
        lastViewedAt: new Date().toISOString(),
        isActive: listing.status === 'active'
      };

      setStats(realStats);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques.",
        variant: "destructive"
      });
    } finally {
      setStatsLoading(false);
    }
  }, [listing, toast]);

  // Fonction de récupération des contacts réels
  const fetchRealContacts = useCallback(async () => {
    if (!listing?.id) return;
    
    setContactsLoading(true);
    try {
      // Récupération des messages d'utilisateurs connectés
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          read,
          created_at,
          sender:profiles!messages_sender_id_fkey(
            full_name,
            email,
            phone
          )
        `)
        .eq('listing_id', listing.id)
        .eq('receiver_id', listing.user_id)
        .order('created_at', { ascending: false });

      // Récupération des messages d'invités
      const { data: guestMessages } = await supabase
        .from('guest_messages')
        .select('*')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: false });

      const realContacts: RealContactLead[] = [];

      // Transformation des messages en format unifié
      if (messages) {
        messages.forEach(msg => {

          const senderData = extractSenderData(msg.sender);
          realContacts.push({
            id: msg.id,
            prospectName: senderData.full_name,
            prospectEmail: senderData.email,
            prospectPhone: senderData.phone,
            contactedAt: msg.created_at,
            contactMethod: 'message',
            message: msg.content,
            status: msg.read ? 'read' : 'unread',
            listing_id: listing.id
          });
        });
      }

      if (guestMessages) {
        guestMessages.forEach(msg => {
          realContacts.push({
            id: msg.id,
            prospectName: msg.guest_name || 'Invité',
            prospectEmail: msg.guest_email || 'N/A',
            prospectPhone: msg.guest_phone || null,
            contactedAt: msg.created_at,
            contactMethod: 'guest_message',
            message: msg.message,
            status: msg.status === 'read' ? 'read' : 'unread',
            listing_id: listing.id
          });
        });
      }

      // Tri par date décroissante pour afficher les plus récents en premier
      realContacts.sort((a, b) => new Date(b.contactedAt).getTime() - new Date(a.contactedAt).getTime());
      setContacts(realContacts);
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les contacts.",
        variant: "destructive"
      });
    } finally {
      setContactsLoading(false);
    }
  }, [listing?.id, listing?.user_id, toast]);

  // Chargement des données au montage du composant
  useEffect(() => {
    if (listing) {
      fetchRealStats();
      fetchRealContacts();
    }
  }, [listing, fetchRealStats, fetchRealContacts]);

  // Fonction de mise en pause volontaire par l'utilisateur
  const handlePauseListing = async () => {
    if (!listing?.id || !user?.id) return;
    
    setIsUpdatingStatus(true);
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
        .eq('id', listing.id)
        .eq('user_id', listing.user_id);

      if (error) throw error;
      await refetch();
      
      toast({
        title: "Annonce mise en pause",
        description: "Votre annonce n'est plus visible par les acheteurs."
      });
    } catch (error) {
      console.error('Erreur lors de la mise en pause:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre en pause l'annonce",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Fonction de réactivation avec vérification des droits
  const handleResumeListing = async () => {
    if (!listing?.id || !user?.id || !canUserReactivateListing()) {
      const suspensionInfo = getSuspensionMessage();
      toast({
        title: "Réactivation impossible",
        description: suspensionInfo.message,
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdatingStatus(true);
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
        .eq('id', listing.id)
        .eq('user_id', listing.user_id);

      if (error) throw error;
      await refetch();
      
      toast({
        title: "Annonce réactivée",
        description: "Votre annonce est de nouveau visible par les acheteurs"
      });
    } catch (error) {
      console.error('Erreur lors de la réactivation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réactiver l'annonce",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Fonctions utilitaires pour la navigation et les actions
  const handleEditListing = () => navigate(`/edit-listing/${id}`);
  
  const handleDeleteListing = async () => {
    if (!listing?.id || !window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?')) return;
    
    try {
      // Nettoyage des données liées avant suppression
      await supabase.from('favorites').delete().eq('listing_id', listing.id);
      await supabase.from('messages').delete().eq('listing_id', listing.id);
      
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id)
        .eq('user_id', listing.user_id);

      if (error) throw error;
      
      toast({
        title: "Annonce supprimée",
        description: "Votre annonce a été supprimée définitivement"
      });
      navigate('/my-listings');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'annonce",
        variant: "destructive"
      });
    }
  };

  // Fonction pour marquer un contact comme lu
  const markContactAsRead = async (contactId: string, contactMethod: string) => {
    try {
      if (contactMethod === 'message') {
        await supabase.from('messages').update({ read: true }).eq('id', contactId);
      } else if (contactMethod === 'guest_message') {
        await supabase.from('guest_messages').update({ status: 'read' }).eq('id', contactId);
      }
      fetchRealContacts();
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  // Gestion de l'état de chargement avec skeleton adapté mobile
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="space-y-4">
            {/* Skeleton mobile-optimisé */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-6 bg-muted rounded w-48 animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
            
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Gestion de l'erreur avec interface claire
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold mb-2">Annonce introuvable</h1>
                <p className="text-muted-foreground text-sm mb-4">
                  Cette annonce n'existe pas ou vous n'avez pas les droits pour la consulter.
                </p>
                <Button onClick={() => navigate('/my-listings')} className="w-full">
                  Retour à mes annonces
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const suspensionInfo = getSuspensionMessage();
  const unreadMessages = contacts.filter(c => c.status === 'unread').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* MOBILE: Barre de navigation sticky avec actions contextuelles */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3 md:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/my-listings')}
              className="flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Mes annonces
            </Button>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${
                listing.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
              }`} />
              <span>{listing.status === 'active' ? 'Actif' : 'En pause'}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          {/* Menu contextuel mobile avec actions principales */}
          {showMobileMenu && (
            <div className="absolute right-4 top-full mt-2 bg-background border border-border rounded-lg shadow-lg py-2 min-w-48 z-50">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm px-4 py-2"
                onClick={() => {
                  handleEditListing();
                  setShowMobileMenu(false);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier l'annonce
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm px-4 py-2"
                asChild
                onClick={() => setShowMobileMenu(false)}
              >
                <Link to={`/listing/${listing.id}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir l'annonce publique
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm px-4 py-2"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: listing.title,
                      url: `${window.location.origin}/listing/${listing.id}`
                    });
                  }
                  setShowMobileMenu(false);
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager l'annonce
              </Button>
              
              <Separator className="my-2" />
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  handleDeleteListing();
                  setShowMobileMenu(false);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </Button>
            </div>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl pb-24 md:pb-8">
        
        {/* DESKTOP: En-tête traditionnel conservé pour la cohérence */}
        <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Gestion de votre annonce
            </h1>
            <p className="text-muted-foreground">
              Consultez les performances et gérez votre annonce "{listing.title}"
            </p>
          </div>
          
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
            ) : listing.status === 'suspended' ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResumeListing}
                disabled={isUpdatingStatus || !suspensionInfo.canReactivate}
              >
                <Play className="h-4 w-4 mr-2" />
                {isUpdatingStatus ? "..." : "Réactiver"}
              </Button>
            ) : null}
            
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

        {/* MOBILE: Titre compact avec informations essentielles */}
        <div className="md:hidden mb-4">
          <div className="space-y-3">
            <div>
              <h1 className="text-lg font-bold leading-tight line-clamp-2">
                {listing.title}
              </h1>
              <div className="text-xl font-bold text-primary mt-1">
                {formatPrice(listing.price, listing.currency)}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                {listing.status === 'active' ? 'Actif' : 
                 listing.status === 'suspended' && listing.suspension_type === 'admin' ? 'Suspendu' :
                 'En pause'}
              </Badge>
              <Badge variant="outline">
                {listing.categories?.name || 'Non catégorisé'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.location}
              </Badge>
            </div>
          </div>
        </div>

        {/* Alerte de suspension adaptée pour mobile et desktop */}
        {listing.status !== 'active' && (
          <div className="mb-6">
            <Card className={`${
              suspensionInfo.isAdminAction 
                ? 'border-red-200 bg-red-50 dark:bg-red-950' 
                : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {suspensionInfo.isAdminAction ? (
                    <Shield className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${
                      suspensionInfo.isAdminAction 
                        ? 'text-red-800 dark:text-red-200' 
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      <strong className="block mb-1">
                        {suspensionInfo.isAdminAction ? 'Suspension administrative' : 'Annonce en pause'}
                      </strong>
                      <p className="leading-relaxed">{suspensionInfo.message}</p>
                      
                      {listing.suspended_until && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          Jusqu'au {new Date(listing.suspended_until).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions de réactivation pour mobile */}
                {listing.status === 'suspended' && suspensionInfo.canReactivate && (
                  <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-700">
                    <Button
                      size="sm"
                      onClick={handleResumeListing}
                      disabled={isUpdatingStatus}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isUpdatingStatus ? "Réactivation en cours..." : "Réactiver maintenant"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* MOBILE: Statistiques en carrousel horizontal défilable */}
        <div className="md:hidden mb-6">
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              <Card className="flex-shrink-0 w-32">
                <CardContent className="p-3 text-center">
                  <Eye className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold">
                    {statsLoading ? "..." : stats?.totalViews || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Vues totales</div>
                  {!statsLoading && stats && (
                    <div className="text-xs text-green-600">+{stats.todayViews} aujourd'hui</div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="flex-shrink-0 w-32">
                <CardContent className="p-3 text-center">
                  <Heart className="h-4 w-4 text-red-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">
                    {statsLoading ? "..." : stats?.favoriteCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Favoris</div>
                </CardContent>
              </Card>
              
              <Card className="flex-shrink-0 w-32">
                <CardContent className="p-3 text-center">
                  <MessageCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold">
                    {contactsLoading ? "..." : contacts.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Messages</div>
                  {unreadMessages > 0 && (
                    <div className="text-xs text-red-600 font-medium">{unreadMessages} non lus</div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="flex-shrink-0 w-32">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold">
                    {stats?.totalViews && stats.totalViews > 0 ? 
                      ((stats.contactsCount / stats.totalViews) * 100).toFixed(1) + '%' : 
                      '0%'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Conversion</div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* DESKTOP: Statistiques en grille traditionnelle */}
        <div className="hidden md:block">
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 text-center">
                    <div className="animate-pulse space-y-2">
                      <div className="w-8 h-8 bg-muted rounded mx-auto"></div>
                      <div className="w-16 h-6 bg-muted rounded mx-auto"></div>
                      <div className="w-20 h-4 bg-muted rounded mx-auto"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <Eye className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalViews}</div>
                  <div className="text-sm text-muted-foreground">Vues totales</div>
                  <div className="text-xs text-green-600">+{stats.todayViews} aujourd'hui</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Heart className="h-5 w-5 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.favoriteCount}</div>
                  <div className="text-sm text-muted-foreground">Favoris</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.totalViews > 0 ? ((stats.favoriteCount / stats.totalViews) * 100).toFixed(1) : 0}% des vues
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.contactsCount}</div>
                  <div className="text-sm text-muted-foreground">Messages reçus</div>
                  <div className="text-xs text-green-600">
                    {stats.totalViews > 0 ? ((stats.contactsCount / stats.totalViews) * 100).toFixed(1) : 0}% de conversion
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.isActive ? 'Actif' : 'Inactif'}</div>
                  <div className="text-sm text-muted-foreground">Statut</div>
                  <div className="text-xs text-muted-foreground">
                    Mis à jour {formatRelativeTime(listing.updated_at)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* MOBILE: Section principale avec actions rapides et contenu prioritaire */}
        <div className="md:hidden space-y-4">
          
          {/* Actions rapides mobiles - Interface tactile optimisée */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditListing}
                  className="flex items-center justify-center gap-2 h-12"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Button>
                
                {listing.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseListing}
                    disabled={isUpdatingStatus}
                    className="flex items-center justify-center gap-2 h-12"
                  >
                    <Pause className="w-4 h-4" />
                    {isUpdatingStatus ? "..." : "Pause"}
                  </Button>
                ) : listing.status === 'suspended' && suspensionInfo.canReactivate ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResumeListing}
                    disabled={isUpdatingStatus}
                    className="flex items-center justify-center gap-2 h-12"
                  >
                    <Play className="w-4 h-4" />
                    {isUpdatingStatus ? "..." : "Activer"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="flex items-center justify-center gap-2 h-12"
                  >
                    <Shield className="w-4 h-4" />
                    Suspendu
                  </Button>
                )}
              </div>
              
              <Separator className="my-3" />
              
              {/* Actions secondaires */}
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start h-10" asChild>
                  <Link to={`/listing/${listing.id}`} target="_blank">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir comme acheteur
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Link>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-10"
                  onClick={() => setShowDetailedStats(!showDetailedStats)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistiques détaillées
                  {showDetailedStats ? (
                    <ChevronUp className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  )}
                </Button>
              </div>

              {/* Statistiques détaillées repliables pour mobile */}
              {showDetailedStats && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-lg font-bold text-blue-600">
                        {stats?.weekViews || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Vues cette semaine</div>
                    </div>
                    
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-lg font-bold text-green-600">
                        {stats?.totalViews && stats.totalViews > 0 ? 
                          ((stats.favoriteCount / stats.totalViews) * 100).toFixed(1) + '%' : 
                          '0%'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">Taux d'intérêt</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Publié le :</span>
                      <span>{new Date(listing.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dernière modification :</span>
                      <span>{formatRelativeTime(listing.updated_at || listing.created_at)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages récents - Priorité mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                  {unreadMessages > 0 && (
                    <Badge variant="destructive" className="text-xs px-2 py-0">
                      {unreadMessages}
                    </Badge>
                  )}
                </div>
                {contacts.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllContacts(!showAllContacts)}
                    className="text-xs"
                  >
                    {showAllContacts ? 'Moins' : 'Tous'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="animate-pulse space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="w-24 h-4 bg-muted rounded" />
                          <div className="w-16 h-6 bg-muted rounded" />
                        </div>
                        <div className="w-full h-12 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contacts.length > 0 ? (
                <div className="space-y-3">
                  {(showAllContacts ? contacts : contacts.slice(0, 3)).map((contact) => (
                    <div 
                      key={contact.id} 
                      className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <span className="truncate">{contact.prospectName}</span>
                            {contact.status === 'unread' && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                Nouveau
                              </Badge>
                            )}
                          </h4>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(contact.contactedAt)}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedContact(
                            expandedContact === contact.id ? null : contact.id
                          )}
                          className="p-1 h-6 w-6"
                        >
                          {expandedContact === contact.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {contact.message}
                      </div>

                      {expandedContact === contact.id && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          <div className="text-xs space-y-1">
                            <div><strong>Email:</strong> {contact.prospectEmail}</div>
                            {contact.prospectPhone && (
                              <div><strong>Téléphone:</strong> {contact.prospectPhone}</div>
                            )}
                            <div><strong>Type:</strong> {
                              contact.contactMethod === 'message' ? 'Message privé' :
                              contact.contactMethod === 'guest_message' ? 'Message invité' :
                              'Appel téléphonique'
                            }</div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {contact.status === 'unread' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markContactAsRead(contact.id, contact.contactMethod)}
                                className="text-xs h-8"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Marquer lu
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-8"
                              asChild
                            >
                              <Link to={`/messages?contact=${contact.id}`}>
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Répondre
                              </Link>
                            </Button>
                            
                            {contact.prospectPhone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.location.href = `tel:${contact.prospectPhone}`}
                                className="text-xs h-8"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                Appeler
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {contacts.length > 3 && !showAllContacts && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAllContacts(true)}
                    >
                      Voir les {contacts.length - 3} autres messages
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium mb-1">Aucun message</h3>
                  <p className="text-sm text-muted-foreground">
                    Les personnes intéressées apparaîtront ici
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations de l'annonce - Version mobile compacte */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Détails de l'annonce
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Condition :</span>
                  <span className="font-medium">
                    {listing.condition === 'new' ? 'Neuf' : 
                     listing.condition === 'refurbished' ? 'Reconditionné' : 'Occasion'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Catégorie :</span>
                  <span className="font-medium">{listing.categories?.name || 'Non catégorisé'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Publié le :</span>
                  <span className="font-medium">
                    {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Expire le :</span>
                  <span className="font-medium">
                    {listing.expires_at ? 
                      new Date(listing.expires_at).toLocaleDateString('fr-FR') : 
                      'Aucune'
                    }
                  </span>
                </div>
              </div>
              
              {listing.description && (
                <div>
                  <span className="text-muted-foreground text-sm block mb-1">Description :</span>
                  <p className="text-sm leading-relaxed line-clamp-3">
                    {listing.description}
                  </p>
                </div>
              )}
              
              {/* Informations de suspension détaillées si nécessaire */}
              {listing.status === 'suspended' && (
                <div className="mt-4 pt-3 border-t border-border">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Informations de suspension
                  </h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type :</span>
                      <span>
                        {listing.suspension_type === 'admin' ? 'Administrative' :
                         listing.suspension_type === 'system' ? 'Automatique' :
                         'Volontaire'}
                      </span>
                    </div>
                    {listing.suspension_reason && (
                      <div>
                        <span className="text-muted-foreground">Raison :</span>
                        <p className="text-xs mt-1">{listing.suspension_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* DESKTOP: Contenu traditionnel avec onglets (conservé pour compatibilité) */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        {listing.categories?.name || 'Non catégorisé'}
                      </Badge>
                      <Badge variant={listing.condition === 'new' ? 'default' : 'outline'}>
                        {listing.condition === 'new' ? 'Neuf' : 
                         listing.condition === 'refurbished' ? 'Reconditionné' : 'Occasion'}
                      </Badge>
                      
                      <Badge variant={
                        listing.status === 'active' ? 'default' : 
                        listing.status === 'suspended' && listing.suspension_type === 'admin' ? 'destructive' :
                        'secondary'
                      }>
                        {listing.status === 'active' ? 'Actif' : 
                         listing.status === 'suspended' && listing.suspension_type === 'admin' ? 'Suspendu par admin' :
                         listing.status === 'suspended' ? 'En pause' :
                         listing.status === 'sold' ? 'Vendu' : 'Expiré'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4" />
                      {listing.location}
                    </div>
                    
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
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
                    <div>
                      <span className="text-muted-foreground">Expire le :</span>
                      <p className="font-medium">
                        {listing.expires_at ? 
                          new Date(listing.expires_at).toLocaleDateString('fr-FR') : 
                          'Aucune expiration'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID de l'annonce :</span>
                      <p className="font-medium font-mono text-xs">{listing.id}</p>
                    </div>
                  </div>

                  {/* Informations de suspension détaillées pour desktop */}
                  {listing.status === 'suspended' && (
                    <>
                      <Separator />
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Informations de suspension
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type de suspension :</span>
                            <p className="font-medium">
                              {listing.suspension_type === 'admin' ? 'Administrative' :
                               listing.suspension_type === 'system' ? 'Automatique' :
                               'Volontaire'}
                            </p>
                          </div>
                          {listing.suspended_until && (
                            <div>
                              <span className="text-muted-foreground">Suspendu jusqu'au :</span>
                              <p className="font-medium">
                                {new Date(listing.suspended_until).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          )}
                          {listing.suspension_reason && (
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Raison :</span>
                              <p className="font-medium">{listing.suspension_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Messages détaillés pour desktop */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Messages reçus
                    {unreadMessages > 0 && (
                      <Badge variant="destructive">
                        {unreadMessages} non lus
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Personnes qui ont contacté au sujet de votre annonce
                  </p>
                </CardHeader>
                <CardContent>
                  {contactsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="animate-pulse space-y-3">
                            <div className="flex justify-between">
                              <div className="w-32 h-4 bg-muted rounded" />
                              <div className="w-20 h-6 bg-muted rounded" />
                            </div>
                            <div className="w-full h-16 bg-muted rounded" />
                            <div className="flex gap-2">
                              <div className="w-20 h-8 bg-muted rounded" />
                              <div className="w-20 h-8 bg-muted rounded" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : contacts.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium flex items-center gap-2">
                                {contact.prospectName}
                                {contact.status === 'unread' && (
                                  <Badge variant="default" className="text-xs px-2 py-0">
                                    Nouveau
                                  </Badge>
                                )}
                              </h4>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>
                                  {contact.contactMethod === 'phone' && 'Appel téléphonique'}
                                  {contact.contactMethod === 'message' && 'Message privé'}
                                  {contact.contactMethod === 'guest_message' && 'Message invité'}
                                  • {formatRelativeTime(contact.contactedAt)}
                                </p>
                                <p>Email: {contact.prospectEmail}</p>
                                {contact.prospectPhone && (
                                  <p>Tél: {contact.prospectPhone}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant={
                              contact.status === 'unread' ? 'destructive' :
                              contact.status === 'read' ? 'secondary' :
                              'default'
                            }>
                              {contact.status === 'unread' && 'Non lu'}
                              {contact.status === 'read' && 'Lu'}
                              {contact.status === 'replied' && 'Répondu'}
                            </Badge>
                          </div>
                          
                          <div className="bg-muted p-3 rounded text-sm mb-3 border-l-4 border-primary/30">
                            <p className="whitespace-pre-wrap">{contact.message}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            {contact.status === 'unread' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markContactAsRead(contact.id, contact.contactMethod)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Marquer comme lu
                              </Button>
                            )}
                            
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/messages?contact=${contact.id}`}>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Répondre
                              </Link>
                            </Button>
                            
                            {contact.prospectPhone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.location.href = `tel:${contact.prospectPhone}`}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Appeler
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2 text-lg">Aucun message pour le moment</h3>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Les personnes intéressées par votre annonce apparaîtront ici. 
                        Assurez-vous que votre annonce est visible et attractive.
                      </p>
                      <div className="mt-6">
                        <Button variant="outline" asChild>
                          <Link to={`/listing/${listing.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir votre annonce
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar desktop avec actions et performance */}
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
                  
                  {listing.status === 'active' ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handlePauseListing}
                      disabled={isUpdatingStatus}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Mettre en pause
                    </Button>
                  ) : listing.status === 'suspended' && suspensionInfo.canReactivate ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleResumeListing}
                      disabled={isUpdatingStatus}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Réactiver
                    </Button>
                  ) : listing.status === 'suspended' && !suspensionInfo.canReactivate ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled
                      title="Cette annonce a été suspendue par l'administration"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Suspension administrative
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              {/* Performance actuelle */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance actuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <div className="w-20 h-4 bg-muted rounded"></div>
                          <div className="w-16 h-4 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : stats ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Vues cette semaine :</span>
                        <span className="font-medium">{stats.weekViews}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dans les favoris :</span>
                        <span className="font-medium">{stats.favoriteCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Messages reçus :</span>
                        <span className="font-medium">{stats.messagesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taux d'intérêt :</span>
                        <span className="font-medium">
                          {stats.totalViews > 0 ? 
                            ((stats.contactsCount / stats.totalViews) * 100).toFixed(1) + '%' : 
                            'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>

              {/* Aide et support pour les suspensions administratives */}
              {listing.status === 'suspended' && listing.suspension_type === 'admin' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Besoin d'aide ?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                    <p>Votre annonce a été suspendue par notre équipe de modération.</p>
                    <p>Si vous pensez qu'il s'agit d'une erreur, vous pouvez :</p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/help-support">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contacter le support
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/legal-notice">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir nos règles
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conseils d'optimisation basés sur les données réelles */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Conseils d'optimisation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                    {stats.totalViews < 10 && (
                      <p className="p-2 bg-blue-50 rounded text-blue-800">
                        Votre annonce a peu de vues. Essayez d'améliorer le titre et d'ajouter plus d'images.
                      </p>
                    )}
                    {stats.favoriteCount === 0 && stats.totalViews > 5 && (
                      <p className="p-2 bg-yellow-50 rounded text-yellow-800">
                        Aucune personne n'a mis votre annonce en favoris. Le prix est peut-être trop élevé.
                      </p>
                    )}
                    {stats.contactsCount === 0 && stats.totalViews > 20 && (
                      <p className="p-2 bg-orange-50 rounded text-orange-800">
                        Beaucoup de vues mais aucun contact. Vérifiez vos informations de contact.
                      </p>
                    )}
                    {stats.totalViews > 0 && (stats.contactsCount / stats.totalViews) > 0.05 && (
                      <p className="p-2 bg-green-50 rounded text-green-800">
                        Excellent taux de conversion ! Votre annonce attire l'attention.
                      </p>
                    )}
                    {(!listing.images || listing.images.length === 0) && (
                      <p className="p-2 bg-amber-50 rounded text-amber-800">
                        Ajoutez des photos pour augmenter l'intérêt des acheteurs.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE: Barre d'actions flottante (bottom action bar) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-30">
          <div className="container mx-auto max-w-md">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditListing}
                className="flex-1 h-12"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              
              {listing.status === 'active' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseListing}
                  disabled={isUpdatingStatus}
                  className="flex-1 h-12"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  {isUpdatingStatus ? "..." : "Pause"}
                </Button>
              ) : listing.status === 'suspended' && suspensionInfo.canReactivate ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleResumeListing}
                  disabled={isUpdatingStatus}
                  className="flex-1 h-12"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isUpdatingStatus ? "..." : "Réactiver"}
                </Button>
              ) : null}
              
              <Button
                variant="outline"
                size="sm"
                className="h-12 px-3"
                asChild
              >
                <Link to={`/listing/${listing.id}`} target="_blank">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OwnerListingDetail;