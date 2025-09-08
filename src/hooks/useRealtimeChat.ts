import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Interface mise à jour pour correspondre à la structure réelle de la base de données
export interface RealtimeMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean; // ⚡ Changé de 'is_read' à 'read' pour correspondre à votre DB
}

export const useRealtimeChat = (listingId: string, participantId: string) => {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  // Fetch initial messages - pas de changement nécessaire ici
  const fetchMessages = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('listing_id', listingId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, listingId, participantId, toast]);

  // Send message - ⚡ CORRECTION PRINCIPALE ICI
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: participantId,
          content: content.trim(),
          read: false // ⚡ Changé de 'is_read' à 'read'
        });

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  }, [user, listingId, participantId, toast]);

  // Mark messages as read - ⚡ CORRECTION ICI AUSSI
  const markAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ read: true }) // ⚡ Changé de 'is_read' à 'read'
        .eq('listing_id', listingId)
        .eq('sender_id', participantId)
        .eq('receiver_id', user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user, listingId, participantId]);

  // Set up real-time subscriptions - pas de changement nécessaire
  useEffect(() => {
    if (!user) return;

    fetchMessages();

    // Subscribe to new messages
    const messagesChannel = supabase
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
            (newMessage.sender_id === user.id && newMessage.receiver_id === participantId) ||
            (newMessage.sender_id === participantId && newMessage.receiver_id === user.id)
          ) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
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

    // Subscribe to presence (online status)
    const presenceChannel = supabase
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

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, listingId, participantId, fetchMessages]);

  // Send typing indicator - pas de changement nécessaire
  const sendTyping = useCallback((isTyping: boolean) => {
    supabase
      .channel(`typing:${listingId}:${user?.id}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user?.id, typing: isTyping }
      });
  }, [listingId, user?.id]);

  return {
    messages,
    sendMessage,
    markAsRead,
    typing,
    onlineUsers,
    loading,
    sendTyping
  };
};