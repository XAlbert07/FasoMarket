// hooks/useRealtimeChat.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Interface mise à jour pour supporter les messages administrateurs
export interface RealtimeMessage {
  id: string;
  listing_id: string | null; // Peut être null pour les messages admin
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  
  // NOUVEAUX CHAMPS pour les messages administrateurs
  message_type: 'user' | 'admin' | 'system';
  subject?: string | null;
  priority: 'low' | 'medium' | 'high';
  admin_metadata?: any;
  
  // Données enrichies (récupérées via jointure)
  sender_profile?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
}

export const useRealtimeChat = (listingId?: string, participantId?: string) => {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [adminMessages, setAdminMessages] = useState<RealtimeMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  /**
   * Récupération des messages normaux (liés à une annonce)
   */
  const fetchMessages = useCallback(async () => {
    if (!user || !listingId || !participantId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            id, full_name, email, role, avatar_url
          )
        `)
        .eq('listing_id', listingId)
        .eq('message_type', 'user') 
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, listingId, participantId, toast]);

  /**
   * NOUVELLE FONCTION: Récupération des messages administrateurs
   * Les messages admin ne sont pas liés à une annonce spécifique
   */
  const fetchAdminMessages = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            id, full_name, email, role, avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('message_type', 'admin') 
        .is('listing_id', null) 
        .order('created_at', { ascending: false })
        .limit(50); 

      if (error) throw error;
      setAdminMessages(data || []);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des messages admin:', error);
    }
  }, [user]);

  /**
   * Envoi d'un message utilisateur normal (inchangé)
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim() || !listingId || !participantId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: participantId,
          content: content.trim(),
          message_type: 'user', 
          priority: 'low',
          read: false
        });

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  }, [user, listingId, participantId, toast]);

  /**
   * Marquer les messages comme lus (amélioré pour gérer admin)
   */
  const markAsRead = useCallback(async (messageType: 'user' | 'admin' = 'user') => {
    if (!user) return;

    try {
      let query = supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('message_type', messageType);

      // Pour les messages utilisateurs, ajouter les filtres habituels
      if (messageType === 'user' && listingId && participantId) {
        query = query
          .eq('listing_id', listingId)
          .eq('sender_id', participantId);
      }

      await query;
      
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }, [user, listingId, participantId]);

  /**
   * NOUVELLE FONCTION: Marquer un message admin spécifique comme lu
   */
  const markAdminMessageAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .eq('receiver_id', user.id);

      // Mise à jour locale
      setAdminMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      
    } catch (error) {
      console.error('Erreur lors du marquage admin comme lu:', error);
    }
  }, [user]);

  /**
   * Obtenir le nombre de messages admin non lus
   */
  const getUnreadAdminCount = useCallback(() => {
    return adminMessages.filter(msg => !msg.read).length;
  }, [adminMessages]);

  /**
   * Obtenir le style d'affichage selon le type de message
   */
  const getMessageStyle = useCallback((message: RealtimeMessage) => {
    if (message.message_type === 'admin') {
      return {
        containerClass: "border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg",
        headerClass: "text-blue-800 font-semibold",
        contentClass: "text-blue-900",
        badge: "ADMINISTRATION",
        badgeClass: "bg-blue-100 text-blue-800"
      };
    }
    
    if (message.priority === 'high') {
      return {
        containerClass: "border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg",
        headerClass: "text-red-800 font-semibold",
        contentClass: "text-red-900",
        badge: "URGENT",
        badgeClass: "bg-red-100 text-red-800"
      };
    }
    
    return {
      containerClass: "bg-white p-3 rounded-lg border",
      headerClass: "text-gray-800",
      contentClass: "text-gray-700",
      badge: null,
      badgeClass: ""
    };
  }, []);

  // Configuration des abonnements temps réel
  useEffect(() => {
    if (!user) return;

    // Récupération initiale
    if (listingId && participantId) {
      fetchMessages();
    }
    fetchAdminMessages();

    // Abonnement aux nouveaux messages utilisateurs
    let messagesChannel;
    if (listingId) {
      messagesChannel = supabase
        .channel(`messages:${listingId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `listing_id=eq.${listingId}`
          },
          (payload) => {
            const newMessage = payload.new as RealtimeMessage;
            if (
              newMessage.message_type === 'user' &&
              ((newMessage.sender_id === user.id && newMessage.receiver_id === participantId) ||
               (newMessage.sender_id === participantId && newMessage.receiver_id === user.id))
            ) {
              setMessages(prev => [...prev, newMessage]);
            }
          }
        )
        .subscribe();
    }

    // NOUVEL ABONNEMENT: Messages administrateurs
    const adminChannel = supabase
      .channel(`admin_messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as RealtimeMessage;
          if (newMessage.message_type === 'admin') {
            // Récupérer les infos du sender pour le message admin
            supabase
              .from('profiles')
              .select('id, full_name, email, role, avatar_url')
              .eq('id', newMessage.sender_id)
              .single()
              .then(({ data }) => {
                const enrichedMessage = {
                  ...newMessage,
                  sender_profile: data
                };
                setAdminMessages(prev => [enrichedMessage, ...prev]);
                
                // Notification pour les messages admin
                toast({
                  title: "Message administrateur",
                  description: newMessage.subject || "Vous avez reçu un message de l'administration",
                  duration: 5000,
                });
              });
          }
        }
      )
      .subscribe();

    // Indicateurs de frappe (pour les messages utilisateurs seulement)
    let typingChannel;
    if (participantId) {
      typingChannel = supabase
        .channel(`typing:${listingId}:${participantId}`)
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload.user_id === participantId) {
            setTyping(payload.payload.typing);
            if (payload.payload.typing) {
              setTimeout(() => setTyping(false), 3000);
            }
          }
        })
        .subscribe();
    }

    // Statut de présence
    let presenceChannel;
    if (listingId) {
      presenceChannel = supabase
        .channel(`presence:${listingId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const users = Object.keys(state);
          setOnlineUsers(users);
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          setOnlineUsers(prev => [...prev, key]);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          setOnlineUsers(prev => prev.filter(id => id !== key));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ user_id: user.id });
          }
        });
    }

    // Nettoyage
    return () => {
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      supabase.removeChannel(adminChannel);
      if (typingChannel) supabase.removeChannel(typingChannel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [user, listingId, participantId, fetchMessages, fetchAdminMessages, toast]);

  // Indicateur de frappe (inchangé)
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!participantId) return;
    
    supabase
      .channel(`typing:${listingId}:${user?.id}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user?.id, typing: isTyping }
      });
  }, [listingId, user?.id, participantId]);

  return {
    // Messages utilisateurs (conversation normale)
    messages,
    sendMessage,
    markAsRead,
    
    // NOUVEAUX: Messages administrateurs
    adminMessages,
    markAdminMessageAsRead,
    getUnreadAdminCount,
    refreshAdminMessages: fetchAdminMessages,
    
    // Utilitaires d'affichage
    getMessageStyle,
    
    // États existants
    typing,
    onlineUsers,
    loading,
    sendTyping,
    
    // Fonctions de rafraîchissement
    refreshMessages: fetchMessages
  };
};