import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    images: string[];
  };
  sender?: {
    id: string;
    full_name: string;
  };
}

export interface Conversation {
  id: string;
  listing_id: string;
  participant_id: string;
  participant_name: string;
  listing_title: string;
  listing_image?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          listing_id,
          sender_id,
          receiver_id,
          content,
          created_at,
          listing:listings(id, title, images),
          sender:profiles!sender_id(id, full_name),
          receiver:profiles!receiver_id(id, full_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper les messages par conversation
      const conversationMap = new Map<string, any>();
      
      data?.forEach((message: any) => {
        const isReceiver = message.receiver_id === user.id;
        const participantId = isReceiver ? message.sender_id : message.receiver_id;
        const participantName = isReceiver ? message.sender?.full_name : message.receiver?.full_name;
        const conversationKey = `${message.listing_id}-${participantId}`;

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            id: conversationKey,
            listing_id: message.listing_id,
            participant_id: participantId,
            participant_name: participantName || 'Utilisateur',
            listing_title: message.listing?.title || '',
            listing_image: message.listing?.images?.[0],
            last_message: message.content,
            last_message_at: message.created_at,
            unread_count: 0
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (listingId: string, participantId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, full_name)
        `)
        .eq('listing_id', listingId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Marquer les messages comme lus
      await markAsRead(listingId, participantId);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (listingId: string, receiverId: string, content: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour envoyer un message",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          is_read: false
        });

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });

      // Recharger les messages
      await fetchMessages(listingId, receiverId);
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi du message",
        variant: "destructive"
      });
      return false;
    }
  };

  const markAsRead = async (listingId: string, senderId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('listing_id', listingId)
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id);
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  return {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    refetch: fetchConversations
  };
};