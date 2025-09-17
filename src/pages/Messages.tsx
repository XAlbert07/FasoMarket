// pages/Messages.tsx
// Page de messagerie unifiée mobile-first avec design professionnel
// Optimisée pour 90% d'utilisateurs mobiles

import { useState, useEffect, useRef } from 'react';
import { useMessages, Conversation, UnifiedMessage } from '@/hooks/useMessages';
import { useGuestMessages } from '@/hooks/useGuestMessages';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle,
  Search,
  MoreVertical,
  CheckCheck,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Messages = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
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
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll et focus automatique sur mobile
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && window.innerWidth < 768) {
      // Focus automatique sur l'input sur mobile après un petit délai
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedConversation]);

  // Marquer les messages comme lus
  useEffect(() => {
    if (selectedConversation && selectedConversation.unread_count > 0) {
      markConversationAsRead(
        selectedConversation.listing_id, 
        selectedConversation.participant_id
      );
    }
  }, [selectedConversation, markConversationAsRead]);

  // Navigation vers profil utilisateur
  const handleNavigateToProfile = (conversation: Conversation) => {
    if (!conversation.is_participant_registered || !conversation.participant_id) return;
    navigate(`/seller-profile/${conversation.participant_id}`);
  };

  // Sélection de conversation avec animation
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.listing_id, conversation.participant_id);
    
    if (conversation.conversation_type === 'guest' && conversation.unread_count > 0) {
      messages
        .filter(msg => msg.type === 'guest' && !msg.is_read)
        .forEach(async (msg) => {
          if (msg.original_data && 'guest_email' in msg.original_data) {
            await markGuestMessageAsRead(msg.id, user!.id);
          }
        });
    }
  };

  // Envoi de message avec feedback visuel
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessage.trim()) return;
    if (!selectedConversation.participant_id || !selectedConversation.is_participant_registered) return;

    const success = await sendMessage(
      selectedConversation.listing_id,
      selectedConversation.participant_id,
      newMessage.trim()
    );

    if (success) {
      setNewMessage('');
      inputRef.current?.focus(); // Maintenir le focus
    }
  };

  // Filtrage des conversations
  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.listing_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Interface non connecté
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-3 py-8">
          <Card className="max-w-sm mx-auto border-0 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
              <p className="text-muted-foreground text-sm">
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
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* MOBILE-FIRST: Vue conversation ou liste selon sélection */}
      <main className="flex flex-col h-[calc(100vh-80px)]"> {/* Hauteur fixe pour mobile */}
        
        {/* Mode mobile : Liste des conversations */}
        {(!selectedConversation || window.innerWidth >= 768) && (
          <div className="flex-1 flex flex-col">
            {/* Header fixe avec recherche */}
            <div className="bg-white border-b px-3 py-4 sticky top-0 z-10">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold">Messages</h1>
                    <p className="text-sm text-muted-foreground">
                      {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {conversations.filter(c => c.unread_count > 0).length} non lus
                  </Badge>
                </div>
                
                {/* Barre de recherche mobile-first */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une conversation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-100 border-0"
                  />
                </div>
              </div>
            </div>

            {/* Liste des conversations optimisée mobile */}
            <ScrollArea className="flex-1">
              <div className="px-3 py-2">
                {loading ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3"></div>
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="font-medium mb-2">
                      {searchTerm ? 'Aucun résultat' : 'Aucune conversation'}
                    </h3>
                    <p className="text-sm text-muted-foreground px-4">
                      {searchTerm 
                        ? 'Essayez avec d\'autres mots-clés'
                        : 'Les messages des acheteurs intéressés apparaîtront ici.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cn(
                          "p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] touch-manipulation",
                          selectedConversation?.id === conversation.id && window.innerWidth >= 768
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-white hover:bg-slate-50 border border-slate-200"
                        )}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar amélioré avec indicateur de statut */}
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                              <AvatarImage src={conversation.participant_avatar} />
                              <AvatarFallback className={cn(
                                "font-semibold text-sm",
                                conversation.is_participant_registered 
                                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
                                  : "bg-gradient-to-br from-orange-400 to-red-500 text-white"
                              )}>
                                {conversation.participant_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Indicateur de type d'utilisateur */}
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
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
                            
                            {/* Point en ligne si récent */}
                            {new Date().getTime() - new Date(conversation.last_message_at).getTime() < 300000 && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border border-white animate-pulse"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Header avec nom et badges */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {conversation.is_participant_registered && conversation.participant_id ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigateToProfile(conversation);
                                    }}
                                    className="font-semibold text-sm hover:text-blue-600 transition-colors truncate flex items-center gap-1 group"
                                  >
                                    <span className="truncate">{conversation.participant_name}</span>
                                    <User className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  </button>
                                ) : (
                                  <h4 className="font-semibold text-sm truncate">
                                    {conversation.participant_name}
                                  </h4>
                                )}
                                
                                {conversation.is_participant_registered ? (
                                  <Badge className="text-xs px-2 py-0 bg-green-100 text-green-700 hover:bg-green-200">
                                    Membre
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs px-2 py-0 bg-orange-100 text-orange-700">
                                    Invité
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {conversation.unread_count > 0 && (
                                  <Badge className="h-5 min-w-5 px-1 flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-700">
                                    {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(conversation.last_message_at), {
                                    addSuffix: false,
                                    locale: fr
                                  }).replace('il y a ', '')}
                                </span>
                              </div>
                            </div>
                            
                            {/* Info produit avec prix */}
                            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                              <span className="truncate">{conversation.listing_title}</span>
                              <span className="font-semibold text-blue-600 whitespace-nowrap">
                                {conversation.listing_price.toLocaleString()} {conversation.listing_currency}
                              </span>
                            </div>
                            
                            {/* Dernier message avec preview */}
                            <div className="flex items-center justify-between">
                              <p className={cn(
                                "text-sm truncate",
                                conversation.unread_count > 0 
                                  ? "font-medium text-slate-900" 
                                  : "text-muted-foreground"
                              )}>
                                {conversation.last_message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Mode mobile : Conversation sélectionnée */}
        {selectedConversation && (
          <div className={cn(
            "flex flex-col h-full bg-white",
            window.innerWidth >= 768 ? "md:flex" : (selectedConversation ? "flex" : "hidden")
          )}>
            
            {/* Header de conversation fixe */}
            <div className="bg-white border-b px-4 py-3 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <Avatar className="h-10 w-10 border-2 border-slate-200">
                  <AvatarImage src={selectedConversation.participant_avatar} />
                  <AvatarFallback className={cn(
                    "font-medium text-sm",
                    selectedConversation.is_participant_registered 
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
                      : "bg-gradient-to-br from-orange-400 to-red-500 text-white"
                  )}>
                    {selectedConversation.participant_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {selectedConversation.is_participant_registered && selectedConversation.participant_id ? (
                      <button
                        onClick={() => handleNavigateToProfile(selectedConversation)}
                        className="font-semibold hover:text-blue-600 transition-colors truncate flex items-center gap-1 group"
                      >
                        <span className="truncate">{selectedConversation.participant_name}</span>
                        <User className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className="font-semibold truncate">{selectedConversation.participant_name}</span>
                    )}
                    
                    {selectedConversation.is_participant_registered ? (
                      <Badge className="text-xs bg-green-100 text-green-700">En ligne</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Hors ligne</Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedConversation.listing_title} • {selectedConversation.listing_price.toLocaleString()} {selectedConversation.listing_currency}
                  </p>
                </div>
                
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Zone des messages avec scroll optimisé */}
            <ScrollArea className="flex-1 px-4">
              <div className="py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">Le début de votre conversation</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isFromCurrentUser = message.sender_info.id === user.id;
                    const isGuestMessage = message.type === 'guest';
                    const isFirstGuestMessage = isGuestMessage && index === 0;
                    
                    return (
                      <div key={message.id}>
                        {/* Alert pour premier message invité */}
                        {isFirstGuestMessage && (
                          <Alert className="mb-4 border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="font-medium text-orange-800">Message d'un visiteur :</p>
                                <div className="text-sm space-y-1 text-orange-700">
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
                                <p className="text-xs text-orange-600">
                                  Utilisez les coordonnées ci-dessus pour répondre.
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Bulle de message moderne */}
                        <div className={cn(
                          "flex items-end gap-2",
                          isFromCurrentUser ? "justify-end" : "justify-start"
                        )}>
                          {!isFromCurrentUser && (
                            <Avatar className="h-6 w-6 mb-1">
                              <AvatarFallback className="text-xs bg-slate-200">
                                {message.sender_info.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2 shadow-sm",
                            isFromCurrentUser
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
                              : isGuestMessage
                              ? "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-900 border border-orange-200 rounded-bl-md"
                              : "bg-white text-slate-900 border border-slate-200 rounded-bl-md"
                          )}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                            
                            <div className={cn(
                              "flex items-center justify-end gap-1 mt-1 text-xs",
                              isFromCurrentUser 
                                ? "text-blue-100" 
                                : "text-muted-foreground"
                            )}>
                              <span>
                                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              
                              {isFromCurrentUser && (
                                <div className="flex">
                                  {message.is_read ? (
                                    <CheckCheck className="h-3 w-3 text-blue-200" />
                                  ) : (
                                    <Check className="h-3 w-3 text-blue-300" />
                                  )}
                                </div>
                              )}
                              
                              {isGuestMessage && (
                                <Badge variant="outline" className="ml-1 text-xs border-orange-300 text-orange-700">
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

            {/* Zone de saisie sticky */}
            <div className="border-t bg-white p-4 sticky bottom-0">
              {selectedConversation.is_participant_registered && selectedConversation.participant_id ? (
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      ref={inputRef}
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-full px-4 py-3"
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={!newMessage.trim() || loading}
                    className="rounded-full h-12 w-12 p-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Contactez ce visiteur directement :
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`mailto:${selectedConversation.participant_email}`)}
                      className="rounded-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    {selectedConversation.participant_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${selectedConversation.participant_phone}`)}
                        className="rounded-full"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Appeler
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Messages;