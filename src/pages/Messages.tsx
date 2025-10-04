// pages/Messages.tsx 

import { useState, useEffect, useRef } from 'react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import type { Conversation, Message } from '@/hooks/useRealtimeMessages';
import { usePresenceCleanup } from '@/hooks/usePresenceCleanup';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
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
  AlertCircle,
  Search,
  MoreVertical,
  CheckCheck,
  Check,
  Wifi,
  WifiOff,
  Circle,
  Plus,
  X,
  Paperclip,
  Mic
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formatDateSeparator = (date: Date): string => {
  if (isToday(date)) {
    return 'Aujourd\'hui';
  } else if (isYesterday(date)) {
    return 'Hier';
  } else {
    return format(date, 'dd/MM', { locale: fr });
  }
};

const formatLastMessageTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
  
  if (diffInMinutes < 1) return 'maintenant';
  if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'hier';
  if (diffInMinutes < 7 * 24 * 60) return format(date, 'EEE', { locale: fr });
  return format(date, 'dd/MM');
};

const createReturnToMessagesUrl = (conversationId?: string, participantId?: string): string => {
  const params = new URLSearchParams({
    fromProfile: 'true'
  });
  
  if (conversationId && conversationId !== 'new-conversation') {
    params.set('conversationId', conversationId);
  }
  
  if (participantId) {
    params.set('participantId', participantId);
  }
  
  return `/messages?${params.toString()}`;
};

const Messages = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { 
    conversations, 
    messages, 
    loading, 
    userPresence,
    isConnected,
    fetchMessages, 
    sendMessage,
    markAsRead,
    updatePresence,
    sendTyping,
    fetchConversations,
    clearMessages
  } = useRealtimeMessages();
  
  const { manualCleanup } = usePresenceCleanup();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fromProfile = searchParams.get('fromProfile');
    const conversationId = searchParams.get('conversationId');
    const participantId = searchParams.get('participantId');

    if (fromProfile === 'true' && conversations.length > 0) {
      if (conversationId && participantId) {
        const targetConversation = conversations.find(conv => 
          conv.id === conversationId || 
          (conv.participant_id === participantId)
        );
        
        if (targetConversation) {
          console.log('Restauration de la conversation après retour du profil:', targetConversation.id);
          handleSelectConversation(targetConversation);
        }
      }
      
      navigate('/messages', { replace: true });
    }
  }, [searchParams, conversations, navigate]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    if (isAtBottom || messages.length === 1) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [messages]);

  const handleSelectConversation = async (conversation: Conversation) => {
    console.log('Sélection de conversation:', conversation.id);
    setSelectedConversation(conversation);
    setCurrentView('chat');
    
    if (conversation.id === 'new-conversation') {
      clearMessages();
      return;
    }
    
    await fetchMessages(conversation.participant_id, conversation.listing_id);
    
    if (conversation.unread_count > 0) {
      markAsRead(conversation.participant_id, conversation.listing_id);
    }
    
    setTimeout(() => {
      if (window.innerWidth < 768) {
        inputRef.current?.focus();
      }
    }, 300);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedConversation(null);
    setNewMessage('');
  };

  const getProfileLink = (participantId: string, conversationId?: string): string => {
    const returnUrl = createReturnToMessagesUrl(conversationId, participantId);
    return `/seller-profile/${participantId}?${new URLSearchParams({ 
      returnTo: 'messages',
      returnUrl: encodeURIComponent(returnUrl)
    }).toString()}`;
  };

  useEffect(() => {
    const sellerId = searchParams.get('sellerId');
    const sellerName = searchParams.get('sellerName');
    const listingId = searchParams.get('listingId');
    const isDirect = searchParams.get('direct') === 'true';

    if (sellerId && sellerName && isDirect && conversations.length > 0) {
      console.log('Recherche de conversation existante pour:', sellerName);
      
      const existingConversation = conversations.find(conv => 
        conv.participant_id === sellerId || 
        (conv.listing_id === listingId && conv.participant_name === sellerName)
      );

      if (existingConversation) {
        console.log('Conversation existante trouvée:', existingConversation.id);
        handleSelectConversation(existingConversation);
      } else {
        console.log('Création d\'une nouvelle conversation');
        
        const newConversationData = {
          sellerId,
          sellerName,
          listingId: listingId || '',
          sellerAvatar: searchParams.get('sellerAvatar')
        };
        
        sessionStorage.setItem('pendingConversation', JSON.stringify(newConversationData));
        
        const newConv: Conversation = {
          id: 'new-conversation',
          listing_id: listingId || null,
          listing_title: 'Nouvelle conversation',
          listing_price: 0,
          listing_currency: 'CFA',
          participant_id: sellerId,
          participant_name: sellerName,
          participant_email: '',
          participant_avatar: searchParams.get('sellerAvatar') || undefined,
          is_participant_registered: true,
          last_message: '',
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          participant_status: userPresence[sellerId]?.status || 'offline',
          is_typing: false
        };
        
        handleSelectConversation(newConv);
      }

      navigate('/messages', { replace: true });
    }
  }, [searchParams, conversations, navigate, userPresence]);

  const handleTypingChange = (value: string) => {
    setNewMessage(value);
    
    if (!selectedConversation || selectedConversation.id === 'new-conversation') return;

    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTyping(selectedConversation.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(selectedConversation.id, false);
      }
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending || !selectedConversation || !isConnected) return;
    
    setIsSending(true);
    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(selectedConversation.id, false);
      }

      let targetUserId: string;
      let targetListingId: string | null;

      if (selectedConversation.id === 'new-conversation') {
        const pendingData = sessionStorage.getItem('pendingConversation');
        if (!pendingData) throw new Error('Données de conversation manquantes');

        const { sellerId, listingId } = JSON.parse(pendingData);
        targetUserId = sellerId;
        targetListingId = listingId || null;
        sessionStorage.removeItem('pendingConversation');
      } else {
        if (!selectedConversation.participant_id) {
          console.error('Impossible d\'envoyer un message à cet utilisateur');
          return;
        }
        targetUserId = selectedConversation.participant_id;
        targetListingId = selectedConversation.listing_id;
      }

      const success = await sendMessage(targetUserId, messageToSend, targetListingId);

      if (success) {
        inputRef.current?.focus();

        if (selectedConversation.id === 'new-conversation') {
          setTimeout(async () => {
            await fetchConversations();
            setTimeout(() => {
              const newConversation = conversations.find(conv => 
                conv.participant_id === targetUserId &&
                conv.listing_id === targetListingId
              );
              
              if (newConversation) {
                setSelectedConversation(newConversation);
                fetchMessages(newConversation.participant_id, newConversation.listing_id);
              }
            }, 1000);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setNewMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const getUserStatus = (userId: string | null): 'online' | 'offline' | 'away' => {
    if (!userId) return 'offline';
    return userPresence[userId]?.status || 'offline';
  };

  const renderPresenceBadge = (
    status: 'online' | 'offline' | 'away', 
    isRegistered: boolean = true, 
    size: 'sm' | 'md' | 'lg' = 'sm'
  ) => {
    if (!isRegistered) return null;

    const sizeClasses = {
      sm: 'h-2.5 w-2.5',
      md: 'h-3 w-3', 
      lg: 'h-3.5 w-3.5'
    };

    const statusColors = {
      online: 'bg-green-500',
      away: 'bg-yellow-500',
      offline: 'bg-gray-400'
    };

    return (
      <div className={cn(
        'rounded-full border-2 border-white shadow-sm',
        sizeClasses[size],
        statusColors[status],
        status === 'online' && 'animate-pulse'
      )} />
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.listing_title && conv.listing_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Connexion requise</h2>
                <p className="text-muted-foreground">
                  Connectez-vous pour accéder à vos messages et discussions.
                </p>
              </div>
              <Button onClick={() => navigate('/auth')} className="w-full h-12 rounded-xl text-lg font-medium">
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      {!isConnected && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 text-center text-sm flex items-center justify-center gap-2 shadow-lg">
          <WifiOff className="h-4 w-4 animate-pulse" />
          <span className="font-medium">Reconnexion en cours...</span>
        </div>
      )}
      
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LISTE DES CONVERSATIONS */}
        <div className={cn(
          "flex flex-col bg-white border-r border-slate-200",
          "lg:w-1/3 xl:w-1/4",
          currentView === 'chat' ? "hidden lg:flex" : "flex"
        )}>
          
          <div className="bg-white border-b border-slate-100 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className="h-9 w-9 p-0 rounded-full"
                >
                  {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <Wifi className="h-4 w-4 text-green-600" />
                    </div>
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
            
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                  autoFocus
                />
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 rounded-full">
                  {conversations.filter(c => c.unread_count > 0).length} non lu{conversations.filter(c => c.unread_count > 0).length > 1 ? 's' : ''}
                </Badge>
                <span>{Object.values(userPresence).filter(p => p.status === 'online').length} en ligne</span>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading && conversations.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm text-muted-foreground">Chargement des conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-semibold mb-2">
                    {searchTerm ? 'Aucun résultat' : 'Aucune conversation'}
                  </h3>
                  <p className="text-sm text-muted-foreground px-4">
                    {searchTerm 
                      ? 'Essayez avec d\'autres mots-clés'
                      : 'Vos conversations avec les acheteurs apparaîtront ici.'
                    }
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const participantStatus = getUserStatus(conversation.participant_id);
                  
                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "p-3 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98]",
                        "hover:bg-slate-50 border border-transparent",
                        selectedConversation?.id === conversation.id 
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm" 
                          : "hover:border-slate-200"
                      )}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          {conversation.is_participant_registered && conversation.participant_id ? (
                            <Link 
                              to={getProfileLink(conversation.participant_id, conversation.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="block transition-transform hover:scale-105"
                            >
                              <Avatar className="h-12 w-12 border-2 border-white shadow-lg hover:shadow-xl transition-shadow">
                                <AvatarImage src={conversation.participant_avatar || undefined} />
                                <AvatarFallback className="font-semibold text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {conversation.participant_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                          ) : (
                            <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                              <AvatarImage src={conversation.participant_avatar || undefined} />
                              <AvatarFallback className="font-semibold text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {conversation.participant_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className="absolute -bottom-0.5 -right-0.5">
                            {conversation.is_participant_registered ? (
                              renderPresenceBadge(participantStatus, true, 'md')
                            ) : (
                              <div className="h-3 w-3 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                                <Mail className="h-1.5 w-1.5 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={cn(
                              "font-semibold text-sm truncate",
                              conversation.unread_count > 0 ? "text-slate-900" : "text-slate-700"
                            )}>
                              {conversation.participant_name}
                            </h4>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {formatLastMessageTime(new Date(conversation.last_message_at))}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Badge className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-600 rounded-full">
                                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {conversation.is_typing ? (
                              <div className="flex items-center gap-2 text-blue-600">
                                <div className="flex space-x-1">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-xs italic">tape...</span>
                              </div>
                            ) : (
                              <p className={cn(
                                "text-xs truncate",
                                conversation.unread_count > 0 
                                  ? "font-medium text-slate-800" 
                                  : "text-muted-foreground"
                              )}>
                                {conversation.last_message || 'Nouvelle conversation'}
                              </p>
                            )}
                          </div>
                          
                          {conversation.listing_title && conversation.listing_title !== 'Nouvelle conversation' && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <Circle className="h-1 w-1 fill-current" />
                              <span className="truncate">{conversation.listing_title}</span>
                              {conversation.listing_price && (
                                <span className="font-medium text-blue-600 whitespace-nowrap">
                                  {conversation.listing_price.toLocaleString()} {conversation.listing_currency}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ZONE DE CHAT */}
        <div className={cn(
          "flex-1 flex flex-col bg-white",
          currentView === 'list' ? "hidden lg:flex" : "flex"
        )}>
          
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
              <div className="text-center max-w-sm px-6">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">Commencez une conversation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sélectionnez une conversation dans la liste pour commencer à discuter.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="p-2 lg:hidden rounded-full hover:bg-slate-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="relative">
                  {selectedConversation.is_participant_registered && selectedConversation.participant_id ? (
                    <Link 
                      to={getProfileLink(selectedConversation.participant_id, selectedConversation.id)}
                      className="block transition-transform hover:scale-105"
                    >
                      <Avatar className="h-10 w-10 border-2 border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                        <AvatarImage src={selectedConversation.participant_avatar || undefined} />
                        <AvatarFallback className="font-medium text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {selectedConversation.participant_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : (
                    <Avatar className="h-10 w-10 border-2 border-slate-100">
                      <AvatarImage src={selectedConversation.participant_avatar || undefined} />
                      <AvatarFallback className="font-medium text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {selectedConversation.participant_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {selectedConversation.is_participant_registered ? (
                      renderPresenceBadge(getUserStatus(selectedConversation.participant_id), true, 'md')
                    ) : (
                      <div className="h-3 w-3 bg-orange-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg truncate">
                    {selectedConversation.participant_name}
                  </h2>
                  {selectedConversation.is_typing ? (
                    <p className="text-sm text-blue-600 flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="font-medium">tape...</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {getUserStatus(selectedConversation.participant_id) === 'online' 
                        ? 'En ligne' 
                        : getUserStatus(selectedConversation.participant_id) === 'away'
                        ? 'Absent'
                        : 'Vu récemment'
                      }
                    </p>
                  )}
                </div>
                
                <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-slate-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 relative bg-slate-50">
                <ScrollArea className="h-full" ref={messagesContainerRef}>
                  <div className="px-4 py-6 space-y-4">
                    {selectedConversation.id === 'new-conversation' ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                          <Plus className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Nouvelle conversation</h3>
                        <p className="text-muted-foreground mb-6">
                          Commencez votre discussion avec {selectedConversation.participant_name}
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200">
                          {renderPresenceBadge(getUserStatus(selectedConversation.participant_id), true, 'sm')}
                          <span className="text-sm font-medium">
                            {getUserStatus(selectedConversation.participant_id) === 'online' 
                              ? 'En ligne maintenant' 
                              : 'Sera notifié de votre message'
                            }
                          </span>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <MessageCircle className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Début de la conversation</h3>
                        <p className="text-sm text-muted-foreground">
                          Envoyez votre premier message à {selectedConversation.participant_name}
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => {
                          const isFromCurrentUser = message.sender_id === user.id;
                          const showAvatar = !isFromCurrentUser && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id);
                          
                          const currentMessageDate = new Date(message.created_at);
                          const previousMessageDate = index > 0 ? new Date(messages[index - 1].created_at) : null;
                          const showDateSeparator = index === 0 || 
                            !previousMessageDate ||
                            currentMessageDate.toDateString() !== previousMessageDate.toDateString();
                          
                          return (
                            <div key={message.id} className="space-y-3">
                              {showDateSeparator && (
                                <div className="flex justify-center">
                                  <div className="bg-white px-4 py-2 rounded-full text-xs font-medium text-muted-foreground border border-slate-200 shadow-sm">
                                    {formatDateSeparator(currentMessageDate)}
                                  </div>
                                </div>
                              )}
                              
                              <div className={cn(
                                "flex items-end gap-3",
                                isFromCurrentUser ? "justify-end" : "justify-start"
                              )}>
                                {showAvatar && !isFromCurrentUser && (
                                  <div className="relative mb-1">
                                    {message.sender_info?.is_registered && message.sender_info?.id ? (
                                      <Link 
                                        to={getProfileLink(message.sender_info.id, selectedConversation.id)}
                                        className="block transition-transform hover:scale-105"
                                      >
                                        <Avatar className="h-8 w-8 border-2 border-white shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                                          <AvatarImage src={message.sender_info?.avatar_url || undefined} />
                                          <AvatarFallback className="text-xs bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                                            {message.sender_info?.name?.charAt(0) || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                      </Link>
                                    ) : (
                                      <Avatar className="h-8 w-8 border-2 border-white shadow-md">
                                        <AvatarImage src={message.sender_info?.avatar_url || undefined} />
                                        <AvatarFallback className="text-xs bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                                          {message.sender_info?.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    {message.sender_info?.is_registered && message.sender_info?.id && (
                                      <div className="absolute -bottom-0.5 -right-0.5">
                                        {renderPresenceBadge(getUserStatus(message.sender_info.id), true, 'sm')}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {!showAvatar && !isFromCurrentUser && <div className="w-8"></div>}
                                
                                <div className={cn(
                                  "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm relative",
                                  "break-words hyphens-auto",
                                  isFromCurrentUser
                                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md ml-auto"
                                    : "bg-white text-slate-900 border border-slate-200 rounded-bl-md shadow-md"
                                )}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                  
                                  <div className={cn(
                                    "flex items-center justify-end gap-1.5 mt-2 text-xs",
                                    isFromCurrentUser 
                                      ? "text-blue-100" 
                                      : "text-muted-foreground"
                                  )}>
                                    <span className="font-medium">
                                      {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    
                                    {isFromCurrentUser && (
                                      <div className="flex items-center">
                                        {message.read ? (
                                          <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5 text-blue-300" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className={cn(
                                    "absolute bottom-0 w-4 h-4",
                                    isFromCurrentUser 
                                      ? "-right-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-bl-full"
                                      : "-left-1 bg-white border-l border-b border-slate-200 rounded-br-full"
                                  )} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {selectedConversation.is_typing && (
                          <div className="flex items-end gap-3">
                            <div className="w-8"></div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-md relative">
                              <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                                <span className="text-xs text-muted-foreground">{selectedConversation.participant_name} tape...</span>
                              </div>
                              <div className="absolute bottom-0 -left-1 w-4 h-4 bg-white border-l border-b border-slate-200 rounded-br-full" />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </ScrollArea>
                
                {showScrollToBottom && (
                  <div className="absolute bottom-4 right-4">
                    <Button
                      onClick={() => scrollToBottom(true)}
                      size="sm"
                      className="h-10 w-10 p-0 rounded-full shadow-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                      variant="outline"
                    >
                      <ArrowLeft className="h-4 w-4 rotate-90" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-white border-t border-slate-200 p-4">
                {selectedConversation.is_participant_registered && 
                 (selectedConversation.participant_id || selectedConversation.id === 'new-conversation') ? (
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <div className="relative bg-slate-100 rounded-3xl border border-slate-200 focus-within:border-blue-400 focus-within:bg-white transition-all duration-200">
                          <Input
                            ref={inputRef}
                            placeholder={`Message à ${selectedConversation.participant_name}...`}
                            value={newMessage}
                            onChange={(e) => handleTypingChange(e.target.value)}
                            className="border-0 bg-transparent rounded-3xl px-6 py-4 text-sm focus:ring-0 resize-none min-h-[52px]"
                            disabled={loading || !isConnected || isSending}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                              }
                            }}
                          />
                          
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full hover:bg-slate-200"
                              disabled={loading || !isConnected}
                            >
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={(!newMessage.trim() && !loading) || !isConnected || isSending}
                        className={cn(
                          "rounded-full h-12 w-12 p-0 shadow-lg transition-all duration-200",
                          newMessage.trim() && !isSending
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 scale-100"
                            : "bg-slate-300 cursor-not-allowed scale-95",
                          isSending && "animate-pulse"
                        )}
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : newMessage.trim() ? (
                          <Send className="h-5 w-5" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {!isConnected ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <WifiOff className="h-3 w-3" />
                            <span>Hors ligne</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span>En ligne</span>
                          </div>
                        )}
                        
                        {selectedConversation.id === 'new-conversation' && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Plus className="h-3 w-3" />
                            <span>Nouvelle conversation</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Appuyez sur Entrée pour envoyer
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="text-center space-y-4 py-2">
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4">
                      <p className="text-sm font-medium text-orange-800 mb-3">
                        Contactez ce visiteur directement :
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`mailto:${selectedConversation.participant_email}`)}
                          className="rounded-full border-orange-300 text-orange-700 hover:bg-orange-100"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                        {selectedConversation.participant_phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${selectedConversation.participant_phone}`)}
                            className="rounded-full border-orange-300 text-orange-700 hover:bg-orange-100"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Appeler
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;