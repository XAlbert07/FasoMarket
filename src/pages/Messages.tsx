// pages/Messages.tsx
// Page de messagerie unifiée qui gère les messages standards et les messages d'invités
// Maintenant avec navigation vers les profils des utilisateurs connectés

import { useState, useEffect, useRef } from 'react';
import { useMessages, Conversation, UnifiedMessage } from '@/hooks/useMessages';
import { useGuestMessages } from '@/hooks/useGuestMessages';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // ⚡ Import ajouté pour la navigation
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  MessageCircle, 
  ArrowLeft, 
  Mail, 
  Phone, 
  User, 
  UserCheck,
  Clock,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Messages = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate(); // ⚡ Hook de navigation ajouté
  const { 
    conversations, 
    messages, 
    loading, 
    fetchMessages, 
    sendMessage,
    markConversationAsRead 
  } = useMessages();
  const { markGuestMessageAsRead } = useGuestMessages();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gérer le redimensionnement de l'écran pour l'interface mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Marquer les messages comme lus quand une conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation && selectedConversation.unread_count > 0) {
      markConversationAsRead(
        selectedConversation.listing_id, 
        selectedConversation.participant_id
      );
    }
  }, [selectedConversation, markConversationAsRead]);

  // ⚡ Nouvelle fonction pour naviguer vers le profil d'un utilisateur connecté
  const handleNavigateToProfile = (conversation: Conversation) => {
    // Cette fonction ne devrait être appelée que pour les utilisateurs connectés
    if (!conversation.is_participant_registered || !conversation.participant_id) {
      console.warn('Tentative de navigation vers le profil d\'un invité');
      return;
    }

    // Naviguer vers le profil du vendeur
    // La route /seller-profile/:sellerId est déjà configurée dans App.tsx
    navigate(`/seller-profile/${conversation.participant_id}`);
  };

  /**
   * Gère la sélection d'une conversation
   * Cette fonction charge les messages et marque la conversation comme lue
   */
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Charger les messages de la conversation
    await fetchMessages(conversation.listing_id, conversation.participant_id);
    
    // Marquer les messages individuels d'invités comme lus si nécessaire
    if (conversation.conversation_type === 'guest' && conversation.unread_count > 0) {
      // Pour les messages d'invités, nous devons marquer chaque message individuellement
      // car ils n'ont pas de système de conversation groupée comme les messages standards
      messages
        .filter(msg => msg.type === 'guest' && !msg.is_read)
        .forEach(async (msg) => {
          if (msg.original_data && 'guest_email' in msg.original_data) {
            await markGuestMessageAsRead(msg.id, user!.id);
          }
        });
    }
  };

  /**
   * Gère l'envoi d'un nouveau message
   * Cette fonction ne fonctionne que pour les conversations avec des utilisateurs connectés
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessage.trim()) {
      return;
    }

    // Vérifier que c'est bien une conversation avec un utilisateur connecté
    if (!selectedConversation.participant_id || !selectedConversation.is_participant_registered) {
      console.warn('Tentative d\'envoi de message à un invité');
      return;
    }

    const success = await sendMessage(
      selectedConversation.listing_id,
      selectedConversation.participant_id,
      newMessage.trim()
    );

    if (success) {
      setNewMessage('');
    }
  };

  /**
   * Détermine quelle partie de l'interface afficher sur mobile
   */
  const showConversationList = !selectedConversation || !isMobile;
  const showMessages = selectedConversation && (!isMobile || !showConversationList);

  // Interface pour les utilisateurs non connectés
  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
              <p className="text-muted-foreground">
                Vous devez être connecté pour accéder à vos messages.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold">Mes Messages</h1>
          <p className="text-muted-foreground">
            Gérez vos conversations avec les acheteurs intéressés
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
          {/* Liste des conversations */}
          {showConversationList && (
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Conversations
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {conversations.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[580px]">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Clock className="h-6 w-6 mx-auto mb-2 animate-spin" />
                      Chargement des conversations...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <h3 className="font-medium mb-2">Aucune conversation</h3>
                      <p className="text-sm">
                        Les messages des acheteurs intéressés par vos annonces apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cn(
                          "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedConversation?.id === conversation.id && "bg-muted"
                        )}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={cn(
                                conversation.is_participant_registered 
                                  ? "bg-primary/10 text-primary" 
                                  : "bg-orange-100 text-orange-700"
                              )}>
                                {conversation.participant_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {/* Indicateur du type d'utilisateur */}
                            <div className={cn(
                              "absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center",
                              conversation.is_participant_registered 
                                ? "bg-green-500" 
                                : "bg-orange-500"
                            )}>
                              {conversation.is_participant_registered ? (
                                <UserCheck className="h-2.5 w-2.5 text-white" />
                              ) : (
                                <User className="h-2.5 w-2.5 text-white" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* En-tête de la conversation avec nom potentiellement cliquable */}
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {/* ⚡ Le nom est maintenant cliquable pour les utilisateurs connectés */}
                                {conversation.is_participant_registered && conversation.participant_id ? (
                                  <Button
                                    variant="ghost"
                                    className="h-auto p-0 font-medium text-left hover:bg-transparent hover:text-primary transition-colors text-sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Empêcher la sélection de la conversation
                                      handleNavigateToProfile(conversation);
                                    }}
                                  >
                                    <span className="truncate flex items-center gap-1">
                                      {conversation.participant_name}
                                      <User className="h-3 w-3 opacity-60 hover:opacity-100 transition-opacity" />
                                    </span>
                                  </Button>
                                ) : (
                                  <h4 className="font-medium truncate text-sm">
                                    {conversation.participant_name}
                                  </h4>
                                )}
                                {!conversation.is_participant_registered && (
                                  <Badge variant="outline" className="text-xs px-1">
                                    Invité
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {conversation.unread_count > 0 && (
                                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conversation.last_message_at), {
                                    addSuffix: true,
                                    locale: fr
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            {/* Informations sur l'annonce */}
                            <p className="text-sm text-muted-foreground truncate mb-1">
                              📦 {conversation.listing_title} • {conversation.listing_price.toLocaleString()} {conversation.listing_currency}
                            </p>
                            
                            {/* Dernier message */}
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.last_message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Zone de messages */}
          {showMessages && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {selectedConversation ? (
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {/* ⚡ Le nom dans l'en-tête est aussi cliquable pour les utilisateurs connectés */}
                        {selectedConversation.is_participant_registered && selectedConversation.participant_id ? (
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-semibold text-left hover:bg-transparent hover:text-primary transition-colors"
                            onClick={() => handleNavigateToProfile(selectedConversation)}
                          >
                            <span className="flex items-center gap-1">
                              {selectedConversation.participant_name}
                              <User className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity" />
                            </span>
                          </Button>
                        ) : (
                          <span>{selectedConversation.participant_name}</span>
                        )}
                        {selectedConversation.is_participant_registered ? (
                          <Badge className="text-xs">Utilisateur connecté</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Visiteur</Badge>
                        )}
                      </div>
                      <div className="text-sm font-normal text-muted-foreground">
                        📦 {selectedConversation.listing_title}
                      </div>
                    </div>
                  ) : (
                    'Sélectionnez une conversation'
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex flex-col h-[580px] p-0">
                {selectedConversation ? (
                  <>
                    {/* Zone des messages */}
                    <ScrollArea className="flex-1 px-4">
                      <div className="space-y-4 py-4">
                        {messages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Aucun message dans cette conversation</p>
                          </div>
                        ) : (
                          messages.map((message, index) => {
                            const isFromCurrentUser = message.sender_info.id === user.id;
                            const isGuestMessage = message.type === 'guest';
                            
                            return (
                              <div key={message.id}>
                                {/* Affichage spécial pour le premier message d'un invité */}
                                {isGuestMessage && index === 0 && (
                                  <Alert className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      <div className="space-y-2">
                                        <p className="font-medium">Message d'un visiteur non inscrit :</p>
                                        <div className="text-sm space-y-1">
                                          <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            <span>{message.sender_info.email}</span>
                                          </div>
                                          {message.sender_info.phone && (
                                            <div className="flex items-center gap-2">
                                              <Phone className="h-3 w-3" />
                                              <span>{message.sender_info.phone}</span>
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          Pour répondre, utilisez l'email ou le téléphone ci-dessus.
                                        </p>
                                      </div>
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                {/* Bulle de message */}
                                <div className={cn(
                                  "flex",
                                  isFromCurrentUser ? "justify-end" : "justify-start"
                                )}>
                                  <div className={cn(
                                    "max-w-[70%] rounded-lg px-4 py-2 space-y-1",
                                    isFromCurrentUser
                                      ? "bg-primary text-primary-foreground"
                                      : isGuestMessage
                                      ? "bg-orange-50 text-orange-900 border border-orange-200"
                                      : "bg-muted text-foreground"
                                  )}>
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                    <div className={cn(
                                      "flex items-center justify-between text-xs",
                                      isFromCurrentUser 
                                        ? "text-primary-foreground/70" 
                                        : "text-muted-foreground"
                                    )}>
                                      <span>
                                        {formatDistanceToNow(new Date(message.created_at), {
                                          addSuffix: true,
                                          locale: fr
                                        })}
                                      </span>
                                      {isGuestMessage && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Invité
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Zone de saisie ou informations de contact */}
                    <div className="border-t p-4">
                      {selectedConversation.is_participant_registered && selectedConversation.participant_id ? (
                        // Interface pour répondre aux utilisateurs connectés
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                          <Input
                            placeholder="Tapez votre réponse..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1"
                            disabled={loading}
                          />
                          <Button 
                            type="submit" 
                            size="icon" 
                            disabled={!newMessage.trim() || loading}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      ) : (
                        // Interface pour les messages d'invités (lecture seule + coordonnées)
                        <div className="space-y-3">
                          <Separator />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                              Pour répondre à ce visiteur, contactez-le directement :
                            </p>
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`mailto:${selectedConversation.participant_email}`)}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                              {selectedConversation.participant_phone && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`tel:${selectedConversation.participant_phone}`)}
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  Appeler
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // État par défaut quand aucune conversation n'est sélectionnée
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div className="space-y-3">
                      <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/30" />
                      <h3 className="font-medium text-muted-foreground">
                        Sélectionnez une conversation
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Choisissez une conversation dans la liste pour voir les messages 
                        et répondre aux acheteurs intéressés.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;