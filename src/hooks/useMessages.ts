// hooks/useMessages.ts - VERSION SIMPLIFIÉE ET ROBUSTE

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGuestMessages, GuestMessage } from '@/hooks/useGuestMessages';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types pour les messages standards
export interface StandardMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  receiver?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  listing?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
  } | null;
}

// Type unifié pour tous les messages
export interface UnifiedMessage {
  id: string;
  listing_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  type: 'standard' | 'guest';
  sender_info: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string | null;
    is_registered: boolean;
    status?: 'online' | 'offline' | 'away';
  };
  listing_info?: {
    title: string;
    price: number;
    currency: string;
    images: string[];
  };
  original_data: StandardMessage | GuestMessage;
}

// Type pour les conversations avec statut simplifié
export interface Conversation {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_price: number;
  listing_currency: string;
  participant_id: string | null;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  participant_avatar?: string | null;
  is_participant_registered: boolean;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  total_messages: number;
  conversation_type: 'standard' | 'guest' | 'mixed';
  participant_status: 'online' | 'offline' | 'away';
  is_typing: boolean;
}

// Type pour la présence utilisateur
export interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
}

export const useMessages = () => {
  // États principaux simplifiés
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [isConnected, setIsConnected] = useState(true);

  // Contextes
  const { user } = useAuthContext();
  const { toast } = useToast();
  const { getGuestMessagesForSeller } = useGuestMessages();

  // Références pour éviter les re-créations et gérer les connexions
  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Fonction utilitaire pour extraire les données de listing de manière sécurisée
   */
  const extractListingData = useCallback((listing: any) => {
    if (!listing) return { title: 'Annonce supprimée', price: 0, currency: 'CFA', images: [] };
    const listingData = Array.isArray(listing) ? listing[0] : listing;
    return {
      title: listingData?.title || 'Annonce supprimée',
      price: listingData?.price || 0,
      currency: listingData?.currency || 'CFA',
      images: listingData?.images || []
    };
  }, []);

  /**
   * Fonction utilitaire pour extraire les données de profil de manière sécurisée
   */
  const extractProfileData = useCallback((profile: any) => {
    if (!profile) return { id: null, full_name: 'Utilisateur inconnu', email: '', avatar_url: null };
    const profileData = Array.isArray(profile) ? profile[0] : profile;
    return {
      id: profileData?.id || null,
      full_name: profileData?.full_name || 'Utilisateur inconnu',
      email: profileData?.email || '',
      avatar_url: profileData?.avatar_url || null
    };
  }, []);

  /**
   * Fonction pour mettre à jour la présence utilisateur
   */
  const updateUserPresence = useCallback(async (status: 'online' | 'offline' | 'away') => {
    if (!presenceChannelRef.current || !currentUserIdRef.current) return;

    try {
      await presenceChannelRef.current.track({
        user_id: currentUserIdRef.current,
        status: status,
        last_seen: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur mise à jour présence:', error);
      setIsConnected(false);
    }
  }, []);

  /**
   * Fonction pour charger toutes les conversations
   */
  const fetchConversations = useCallback(async (): Promise<void> => {
    if (!currentUserIdRef.current) return;

    setLoading(true);

    try {
      // Récupération des conversations standards avec une seule requête optimisée
      const { data: standardConversations, error: standardError } = await supabase
        .from('messages')
        .select(`
          listing_id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          listing:listings(id, title, price, currency, images),
          sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, email, avatar_url)
        `)
        .or(`sender_id.eq.${currentUserIdRef.current},receiver_id.eq.${currentUserIdRef.current}`)
        .order('created_at', { ascending: false });

      if (standardError) throw standardError;

      // Récupération des messages d'invités
      const guestMessages = await getGuestMessagesForSeller(currentUserIdRef.current);

      // Traitement simplifié des conversations standards
      const standardConversationsMap = new Map<string, Conversation>();
      
      standardConversations?.forEach(message => {
        const senderData = extractProfileData(message.sender);
        const receiverData = extractProfileData(message.receiver);
        const listingData = extractListingData(message.listing);
        
        // Détermine qui est l'autre participant
        const otherParticipant = message.sender_id === currentUserIdRef.current ? receiverData : senderData;
        const conversationKey = `${message.listing_id}_${otherParticipant.id}`;
        
        if (!standardConversationsMap.has(conversationKey)) {
          standardConversationsMap.set(conversationKey, {
            id: conversationKey,
            listing_id: message.listing_id,
            listing_title: listingData.title,
            listing_price: listingData.price,
            listing_currency: listingData.currency,
            participant_id: otherParticipant.id,
            participant_name: otherParticipant.full_name || 'Utilisateur inconnu',
            participant_email: otherParticipant.email || '',
            participant_avatar: otherParticipant.avatar_url,
            is_participant_registered: true,
            last_message: message.content || '',
            last_message_at: message.created_at || new Date().toISOString(),
            unread_count: 0,
            total_messages: 0,
            conversation_type: 'standard',
            participant_status: 'offline', // Sera mis à jour par la présence
            is_typing: false
          });
        }
        
        // Mise à jour des compteurs
        const conversation = standardConversationsMap.get(conversationKey)!;
        conversation.total_messages++;
        
        if (!message.read && message.receiver_id === currentUserIdRef.current) {
          conversation.unread_count++;
        }
        
        // Mise à jour du dernier message si plus récent
        const messageDate = new Date(message.created_at || 0);
        const conversationDate = new Date(conversation.last_message_at || 0);
        
        if (messageDate > conversationDate) {
          conversation.last_message = message.content || '';
          conversation.last_message_at = message.created_at || new Date().toISOString();
        }
      });

      // Traitement des conversations d'invités
      const guestConversationsMap = new Map<string, Conversation>();
      
      guestMessages?.forEach(guestMessage => {
        const conversationKey = `${guestMessage.listing_id}_guest_${guestMessage.guest_email}`;
        
        if (!guestConversationsMap.has(conversationKey)) {
          guestConversationsMap.set(conversationKey, {
            id: conversationKey,
            listing_id: guestMessage.listing_id || '',
            listing_title: guestMessage.listing?.title || 'Annonce supprimée',
            listing_price: guestMessage.listing?.price || 0,
            listing_currency: guestMessage.listing?.currency || 'CFA',
            participant_id: null,
            participant_name: guestMessage.guest_name || 'Invité',
            participant_email: guestMessage.guest_email || '',
            participant_phone: guestMessage.guest_phone,
            participant_avatar: null,
            is_participant_registered: false,
            last_message: guestMessage.content || '',
            last_message_at: guestMessage.created_at || new Date().toISOString(),
            unread_count: guestMessage.is_read ? 0 : 1,
            total_messages: 1,
            conversation_type: 'guest',
            participant_status: 'offline',
            is_typing: false
          });
        }
      });

      // Fusion et tri par date du dernier message
      const allConversations = [
        ...Array.from(standardConversationsMap.values()),
        ...Array.from(guestConversationsMap.values())
      ].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setConversations(allConversations);
      setIsConnected(true);

    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      setIsConnected(false);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de récupérer vos conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [getGuestMessagesForSeller, toast, extractListingData, extractProfileData]);

  /**
   * Fonction pour charger les messages d'une conversation spécifique
   */
  const fetchMessages = useCallback(async (listingId: string, participantId: string | null): Promise<void> => {
    if (!currentUserIdRef.current) return;

    setLoading(true);

    try {
      let allMessages: UnifiedMessage[] = [];

      if (participantId === null) {
        // Messages d'invités uniquement
        const guestMessages = await getGuestMessagesForSeller(currentUserIdRef.current);
        const relevantGuestMessages = guestMessages.filter(msg => msg.listing_id === listingId);
        
        allMessages = relevantGuestMessages.map(guestMsg => ({
          id: guestMsg.id || '',
          listing_id: guestMsg.listing_id || '',
          content: guestMsg.content || '',
          created_at: guestMsg.created_at || new Date().toISOString(),
          is_read: guestMsg.is_read || false,
          type: 'guest' as const,
          sender_info: {
            name: guestMsg.guest_name || 'Invité',
            email: guestMsg.guest_email || '',
            phone: guestMsg.guest_phone,
            is_registered: false,
            status: 'offline'
          },
          listing_info: guestMsg.listing ? {
            title: guestMsg.listing.title || '',
            price: guestMsg.listing.price || 0,
            currency: guestMsg.listing.currency || 'CFA',
            images: guestMsg.listing.images || []
          } : undefined,
          original_data: guestMsg
        }));
      } else {
        // Messages standards entre utilisateurs connectés
        const { data: standardMessages, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url),
            receiver:profiles!messages_receiver_id_fkey(id, full_name, email, avatar_url),
            listing:listings(id, title, price, currency, images)
          `)
          .eq('listing_id', listingId)
          .or(`and(sender_id.eq.${currentUserIdRef.current},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${currentUserIdRef.current})`)
          .order('created_at', { ascending: true });

        if (error) throw error;

        allMessages = standardMessages?.map(stdMsg => {
          const senderData = extractProfileData(stdMsg.sender);
          const listingData = extractListingData(stdMsg.listing);
          const senderPresence = userPresence[senderData.id || ''];
          
          return {
            id: stdMsg.id || '',
            listing_id: stdMsg.listing_id || '',
            content: stdMsg.content || '',
            created_at: stdMsg.created_at || new Date().toISOString(),
            is_read: stdMsg.read || false,
            type: 'standard' as const,
            sender_info: {
              id: senderData.id || undefined,
              name: senderData.full_name || 'Utilisateur inconnu',
              email: senderData.email || '',
              avatar_url: senderData.avatar_url,
              is_registered: true,
              status: senderPresence?.status || 'offline'
            },
            listing_info: stdMsg.listing ? {
              title: listingData.title,
              price: listingData.price,
              currency: listingData.currency,
              images: listingData.images
            } : undefined,
            original_data: stdMsg as StandardMessage
          };
        }) || [];
      }

      setMessages(allMessages);
      setIsConnected(true);

    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      setIsConnected(false);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [getGuestMessagesForSeller, toast, userPresence, extractProfileData, extractListingData]);

  /**
   * FONCTION CLEF : Envoi de message SANS rechargement de page
   * Cette fonction élimine complètement le besoin de recharger la page
   */
  const sendMessage = useCallback(async (
    listingId: string, 
    receiverId: string, 
    content: string
  ): Promise<boolean> => {
    if (!currentUserIdRef.current || !content.trim()) return false;

    const tempMessageId = `temp_${Date.now()}`;
    
    try {
      // Récupérer les données du profil utilisateur pour le feedback immédiat
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email')
        .eq('id', currentUserIdRef.current)
        .single();

      // Créer un message temporaire pour un feedback instantané
      const tempMessage: UnifiedMessage = {
        id: tempMessageId,
        listing_id: listingId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
        type: 'standard',
        sender_info: {
          id: currentUserIdRef.current,
          name: profile?.full_name || user?.email?.split('@')[0] || 'Moi',
          email: profile?.email || user?.email || '',
          avatar_url: profile?.avatar_url || null,
          is_registered: true,
          status: 'online'
        },
        original_data: {
          id: tempMessageId,
          listing_id: listingId,
          sender_id: currentUserIdRef.current,
          receiver_id: receiverId,
          content: content.trim(),
          read: false,
          created_at: new Date().toISOString()
        } as StandardMessage
      };

      // Ajouter immédiatement le message temporaire pour un feedback instantané
      setMessages(prev => [...prev, tempMessage]);

      // Envoyer le message réel
      const { data, error } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: currentUserIdRef.current,
          receiver_id: receiverId,
          content: content.trim(),
          read: false
        })
        .select()
        .single();

      if (error) {
        // Retirer le message temporaire en cas d'erreur
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        throw error;
      }

      // Remplacer le message temporaire par le message réel
      if (data) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessageId ? { ...msg, id: data.id } : msg
        ));
      }

      // SOLUTION CLEF : Recharger les conversations via l'API au lieu de recharger la page
      // Cette approche évite complètement les erreurs WebSocket
      setTimeout(() => {
        fetchConversations();
      }, 500);

      setIsConnected(true);
      return true;

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setIsConnected(false);
      
      // Retirer le message temporaire en cas d'erreur
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer le message. Vérifiez votre connexion.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, user, fetchConversations]);

  /**
   * Fonction pour marquer une conversation comme lue
   */
  const markConversationAsRead = useCallback(async (
    listingId: string, 
    participantId: string | null
  ): Promise<void> => {
    if (!currentUserIdRef.current || participantId === null) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('listing_id', listingId)
        .eq('sender_id', participantId)
        .eq('receiver_id', currentUserIdRef.current);

      if (error) throw error;

      // Recharger les conversations pour mettre à jour les compteurs
      await fetchConversations();

    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }, [fetchConversations]);

  /**
   * Fonction simplifiée pour l'indicateur de frappe
   */
  const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    // Implémentation simple pour l'instant - peut être étendue plus tard
    console.log('Typing indicator:', { conversationId, isTyping });
  }, []);

  /**
   * Initialisation des connexions temps réel
   */
  const initializeRealtimeConnections = useCallback(() => {
    if (!currentUserIdRef.current || isInitializedRef.current) return;

    console.log('Initialisation des connexions temps réel pour:', currentUserIdRef.current);
    isInitializedRef.current = true;

    // Configuration du canal de présence
    presenceChannelRef.current = supabase
      .channel(`user-presence-${currentUserIdRef.current}`)
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
        
        // Mise à jour des conversations avec les nouveaux statuts
        setConversations(prev => prev.map(conv => ({
          ...conv,
          participant_status: conv.participant_id 
            ? newPresence[conv.participant_id]?.status || 'offline'
            : 'offline'
        })));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await updateUserPresence('online');
          
          // Heartbeat pour maintenir la connexion
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }
          heartbeatIntervalRef.current = setInterval(() => {
            updateUserPresence('online');
          }, 30000);
        }
      });

    // Configuration du canal de messages
    messageChannelRef.current = supabase
      .channel(`messages-realtime-${currentUserIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserIdRef.current}`
        },
        async (payload) => {
          console.log('Nouveau message reçu');
          
          // Recharger les conversations automatiquement
          await fetchConversations();

          // Notification navigateur si autorisée
          if (Notification.permission === 'granted' && payload.new.sender_id) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.sender_id)
              .single();

            if (sender) {
              new Notification(`Nouveau message de ${sender.full_name}`, {
                body: String(payload.new.content).substring(0, 100),
              });
            }
          }
        }
      )
      .subscribe();

  }, [updateUserPresence, fetchConversations]);

  /**
   * Gestion des événements de présence
   */
  useEffect(() => {
    if (!currentUserIdRef.current) return;

    const handleVisibilityChange = () => {
      updateUserPresence(document.hidden ? 'away' : 'online');
    };

    const handleBeforeUnload = () => {
      updateUserPresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [updateUserPresence]);

  /**
   * Effet principal - initialisation unique basée sur l'utilisateur connecté
   */
  useEffect(() => {
    currentUserIdRef.current = user?.id || null;

    if (user?.id) {
      // Demander permission pour les notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Charger les conversations initiales
      fetchConversations();
      
      // Initialiser les connexions temps réel
      initializeRealtimeConnections();
    } else {
      // Nettoyage si pas d'utilisateur
      setConversations([]);
      setMessages([]);
      setUserPresence({});
      isInitializedRef.current = false;
    }

    // Nettoyage lors du changement d'utilisateur ou démontage
    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
      
      if (presenceChannelRef.current) {
        updateUserPresence('offline');
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      isInitializedRef.current = false;
    };
  }, [user?.id, fetchConversations, initializeRealtimeConnections, updateUserPresence]);

  /**
   * Fonction pour réinitialiser les messages (utile pour les nouvelles conversations)
   * Cette fonction maintient l'encapsulation tout en permettant la réinitialisation
   */
  const clearMessages = useCallback(() => {
    console.log('🗑️ Réinitialisation de la liste des messages');
    setMessages([]);
  }, []);

  return {
    // États
    conversations,
    messages,
    loading,
    userPresence,
    isConnected,
    
    // Fonctions
    fetchConversations,
    fetchMessages,
    sendMessage,
    sendTypingIndicator,
    markConversationAsRead,
    updateUserPresence,
    clearMessages
  };
};