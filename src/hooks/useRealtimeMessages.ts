// hooks/useRealtimeMessages.ts 

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types pour les messages
export interface Message {
  id: string;
  listing_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  message_type: 'user' | 'admin' | 'system';
  sender?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
  receiver?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
  listing?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
  } | null;
  
  type?: 'standard' | 'guest';
  is_read?: boolean;
  sender_info?: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string | null;
    is_registered: boolean;
    status?: 'online' | 'offline' | 'away';
  };
}

export interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_email: string;
  participant_avatar?: string | null;
  participant_status: 'online' | 'offline' | 'away';
  listing_id: string | null;
  listing_title?: string;
  listing_price?: number;
  listing_currency?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_typing: boolean;
  is_participant_registered: boolean;
  participant_phone?: string;
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
}

export const useRealtimeMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const { user } = useAuthContext();
  const { toast } = useToast();

  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const enrichMessage = useCallback((msg: any): Message => {
    const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
    const receiver = Array.isArray(msg.receiver) ? msg.receiver[0] : msg.receiver;
    const listing = Array.isArray(msg.listing) ? msg.listing[0] : msg.listing;

    return {
      ...msg,
      type: 'standard',
      is_read: msg.read,
      sender_info: sender ? {
        id: sender.id,
        name: sender.full_name || 'Utilisateur',
        email: sender.email || '',
        avatar_url: sender.avatar_url,
        is_registered: true,
        status: userPresence[sender.id]?.status || 'offline'
      } : undefined
    };
  }, [userPresence]);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, email, avatar_url),
          listing:listings(id, title, price, currency, images)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('message_type', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationsMap = new Map<string, Conversation>();

      data?.forEach((msg) => {
        const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
        const receiver = Array.isArray(msg.receiver) ? msg.receiver[0] : msg.receiver;
        const listing = Array.isArray(msg.listing) ? msg.listing[0] : msg.listing;

        const otherUser = msg.sender_id === user.id ? receiver : sender;
        
        if (!otherUser) return;

        const conversationKey = `${otherUser.id}_${msg.listing_id || 'general'}`;

        if (!conversationsMap.has(conversationKey)) {
          conversationsMap.set(conversationKey, {
            id: conversationKey,
            participant_id: otherUser.id,
            participant_name: otherUser.full_name || 'Utilisateur',
            participant_email: otherUser.email || '',
            participant_avatar: otherUser.avatar_url,
            participant_status: 'offline',
            participant_phone: undefined,
            is_participant_registered: true,
            listing_id: msg.listing_id,
            listing_title: listing?.title,
            listing_price: listing?.price,
            listing_currency: listing?.currency,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: 0,
            is_typing: false
          });
        }

        const conv = conversationsMap.get(conversationKey)!;
        
        if (!msg.read && msg.receiver_id === user.id) {
          conv.unread_count++;
        }

        if (new Date(msg.created_at) > new Date(conv.last_message_at)) {
          conv.last_message = msg.content;
          conv.last_message_at = msg.created_at;
        }
      });

      const sortedConversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setConversations(sortedConversations);
      setIsConnected(true);

    } catch (error) {
      console.error('Erreur fetchConversations:', error);
      setIsConnected(false);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de récupérer vos conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const fetchMessages = useCallback(async (
    participantId: string, 
    listingId: string | null = null
  ) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, email, avatar_url),
          listing:listings(id, title, price, currency, images)
        `)
        .eq('message_type', 'user')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`);

      if (listingId) {
        query = query.eq('listing_id', listingId);
      } else {
        query = query.is('listing_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      const enrichedMessages = (data || []).map(enrichMessage);
      setMessages(enrichedMessages);
      setIsConnected(true);

    } catch (error) {
      console.error('Erreur fetchMessages:', error);
      setIsConnected(false);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, enrichMessage]);

  // ✅ CORRECTION : Ajout optimiste + retour du message inséré
  const sendMessage = useCallback(async (
    receiverId: string,
    content: string,
    listingId: string | null = null
  ): Promise<boolean> => {
    if (!user?.id || !content.trim()) return false;

    // Récupérer les infos du profil de l'utilisateur courant
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Créer un message optimiste
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      listing_id: listingId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      read: false,
      created_at: new Date().toISOString(),
      message_type: 'user',
      type: 'standard',
      is_read: false,
      sender_info: {
        id: user.id,
        name: userProfile?.full_name || user.email || 'Vous',
        email: user.email || '',
        avatar_url: userProfile?.avatar_url,
        is_registered: true,
        status: 'online'
      }
    };

    // Ajouter immédiatement à l'interface
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          listing_id: listingId,
          message_type: 'user',
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Remplacer le message temporaire par le vrai ID
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? { ...optimisticMessage, id: data.id } : m
      ));

      setIsConnected(true);
      return true;

    } catch (error) {
      console.error('Erreur sendMessage:', error);
      // Retirer le message optimiste en cas d'erreur
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setIsConnected(false);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  const markAsRead = useCallback(async (
    participantId: string,
    listingId: string | null = null
  ) => {
    if (!user?.id) return;

    try {
      let query = supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', participantId)
        .eq('receiver_id', user.id);

      if (listingId) {
        query = query.eq('listing_id', listingId);
      } else {
        query = query.is('listing_id', null);
      }

      await query;

    } catch (error) {
      console.error('Erreur markAsRead:', error);
    }
  }, [user?.id]);

  const updatePresence = useCallback(async (status: 'online' | 'offline' | 'away') => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

    } catch (error) {
      console.error('Erreur updatePresence:', error);
    }
  }, [user?.id]);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!user?.id || !typingChannelRef.current) return;

    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { 
        user_id: user.id, 
        conversation_id: conversationId,
        typing: isTyping 
      }
    });
  }, [user?.id]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // ✅ CORRECTION : Écoute des messages REÇUS et ENVOYÉS
  useEffect(() => {
    if (!user?.id) return;


    messagesChannelRef.current = supabase
      .channel(`user_messages:${user.id}`)
      // Écouter les messages REÇUS
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const enrichedMessage: Message = {
            ...(payload.new as any),
            type: 'standard',
            is_read: payload.new.read,
            sender_info: senderData ? {
              id: senderData.id,
              name: senderData.full_name || 'Utilisateur',
              email: senderData.email || '',
              avatar_url: senderData.avatar_url,
              is_registered: true,
              status: userPresence[senderData.id]?.status || 'offline'
            } : undefined
          };
          
          setMessages(prev => {
            const isInCurrentConversation = prev.some(m => 
              (m.sender_id === enrichedMessage.sender_id || m.receiver_id === enrichedMessage.sender_id)
            );
            
            if (isInCurrentConversation) {
              return [...prev, enrichedMessage];
            }
            return prev;
          });

          fetchConversations();

          if (Notification.permission === 'granted' && senderData) {
            new Notification(`Nouveau message de ${senderData.full_name}`, {
              body: String(payload.new.content).substring(0, 100)
            });
          }
        }
      )
      // ✅ AJOUT : Écouter les messages ENVOYÉS
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        async (payload) => {
          
          // Mettre à jour le message optimiste avec le vrai ID si nécessaire
          setMessages(prev => {
            // Vérifier si le message existe déjà (ajout optimiste)
            const existingIndex = prev.findIndex(m => 
              m.id.toString().startsWith('temp-') && 
              m.content === payload.new.content &&
              m.receiver_id === payload.new.receiver_id
            );
            
            if (existingIndex !== -1) {
              // Remplacer le message temporaire
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                id: payload.new.id
              };
              return updated;
            }
            
            // Si pas de message optimiste, c'est un message envoyé depuis un autre appareil
            return prev;
          });

          fetchConversations();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    presenceChannelRef.current = supabase
      .channel(`presence:global`)
      .on('presence', { event: 'sync' }, () => {
        if (!presenceChannelRef.current) return;
        
        const state = presenceChannelRef.current.presenceState();
        const newPresence: Record<string, UserPresence> = {};
        
        Object.entries(state).forEach(([userId, presences]) => {
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            newPresence[userId] = {
              user_id: userId,
              status: presence.status || 'online',
              last_seen: presence.last_seen || new Date().toISOString()
            };
          }
        });
        
        setUserPresence(newPresence);

        setConversations(prev => prev.map(conv => ({
          ...conv,
          participant_status: newPresence[conv.participant_id]?.status || 'offline'
        })));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await updatePresence('online');
          
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }
          heartbeatIntervalRef.current = setInterval(() => {
            updatePresence('online');
          }, 30000);
        }
      });

    typingChannelRef.current = supabase
      .channel(`typing:${user.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, conversation_id, typing } = payload.payload;
        
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversation_id && conv.participant_id === user_id) {
            return { ...conv, is_typing: typing };
          }
          return conv;
        }));

        if (typing) {
          setTimeout(() => {
            setConversations(prev => prev.map(conv => {
              if (conv.id === conversation_id) {
                return { ...conv, is_typing: false };
              }
              return conv;
            }));
          }, 3000);
        }
      })
      .subscribe();

    fetchConversations();
    updatePresence('online');

    const handleVisibilityChange = () => {
      updatePresence(document.hidden ? 'away' : 'online');
    };

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
      }
      if (presenceChannelRef.current) {
        updatePresence('offline');
        supabase.removeChannel(presenceChannelRef.current);
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]); 

  return {
    conversations,
    messages,
    userPresence,
    loading,
    isConnected,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    updatePresence,
    sendTyping,
    clearMessages
  };
};