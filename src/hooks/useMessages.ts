// hooks/useMessages.ts - VERSION AVEC VÉRIFICATIONS DE SÉCURITÉ TYPESCRIPT
// Hook unifié pour gérer les messages standards et les messages d'invités

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGuestMessages, GuestMessage } from '@/hooks/useGuestMessages';

// Interface pour les messages standards (utilisateurs connectés)
export interface StandardMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  
  // Relations avec d'autres tables - avec vérifications de nullité appropriées
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

// Interface unifiée qui combine les deux types de messages
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
  };
  
  listing_info?: {
    title: string;
    price: number;
    currency: string;
    images: string[];
  };
  
  original_data: StandardMessage | GuestMessage;
}

// Interface pour une conversation
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
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const { getGuestMessagesForSeller } = useGuestMessages();

  /**
   * Fonctions utilitaires pour l'extraction sécurisée des données
   */
  const extractListingData = useCallback((listing: any) => {
    if (!listing) return { title: 'Annonce supprimée', price: 0, currency: 'CFA' };
    
    // Gestion du cas où listing est un tableau (relation one-to-many)
    const listingData = Array.isArray(listing) ? listing[0] : listing;
    
    return {
      title: listingData?.title || 'Annonce supprimée',
      price: listingData?.price || 0,
      currency: listingData?.currency || 'CFA'
    };
  }, []);

  const extractProfileData = useCallback((profile: any) => {
    if (!profile) return { id: null, full_name: 'Utilisateur inconnu', email: '', avatar_url: null };
    
    // Gestion du cas où profile est un tableau (relation one-to-many)
    const profileData = Array.isArray(profile) ? profile[0] : profile;
    
    return {
      id: profileData?.id || null,
      full_name: profileData?.full_name || 'Utilisateur inconnu',
      email: profileData?.email || '',
      avatar_url: profileData?.avatar_url || null
    };
  }, []);

  /**
   * Récupère toutes les conversations pour l'utilisateur connecté
   * VERSION AVEC VÉRIFICATIONS DE SÉCURITÉ COMPLÈTES
   */
  const fetchConversations = useCallback(async (): Promise<void> => {
    if (!user) {
      console.warn('Tentative de récupération des conversations sans utilisateur connecté');
      return;
    }

    setLoading(true);

    try {
      console.log('Récupération des conversations pour l\'utilisateur:', user.id);

      // Récupération des conversations depuis les messages standards
      const { data: standardConversations, error: standardError } = await supabase
        .from('messages')
        .select(`
          listing_id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          listing:listings(
            id,
            title,
            price,
            currency,
            images
          ),
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (standardError) {
        console.error('Erreur lors de la récupération des messages standards:', standardError);
        throw standardError;
      }

      // Récupération des messages d'invités
      const guestMessages = await getGuestMessagesForSeller(user.id);

      // Traitement des conversations standards avec vérifications de sécurité
      const standardConversationsMap = new Map<string, Conversation>();
      
      if (standardConversations && Array.isArray(standardConversations)) {
        standardConversations.forEach(message => {
          // CORRECTION: Extraction sécurisée des données relationnelles
          const senderData = extractProfileData(message.sender);
          const receiverData = extractProfileData(message.receiver);
          const listingData = extractListingData(message.listing);
          
          // Déterminer qui est l'autre participant dans la conversation
          const otherParticipant = message.sender_id === user.id ? receiverData : senderData;
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
              conversation_type: 'standard'
            });
          }
          
          // Mise à jour des compteurs et du dernier message
          const conversation = standardConversationsMap.get(conversationKey);
          if (conversation) {
            conversation.total_messages++;
            
            // Compter les messages non lus (seulement ceux reçus par l'utilisateur actuel)
            if (!message.read && message.receiver_id === user.id) {
              conversation.unread_count++;
            }
            
            // Mettre à jour le dernier message si celui-ci est plus récent
            const messageDate = new Date(message.created_at || 0);
            const conversationDate = new Date(conversation.last_message_at || 0);
            
            if (messageDate > conversationDate) {
              conversation.last_message = message.content || '';
              conversation.last_message_at = message.created_at || new Date().toISOString();
            }
          }
        });
      }

      // Traitement des conversations d'invités
      const guestConversationsMap = new Map<string, Conversation>();
      
      if (Array.isArray(guestMessages)) {
        guestMessages.forEach(guestMessage => {
          // Pour les invités, on utilise l'email comme identifiant unique
          const conversationKey = `${guestMessage.listing_id}_guest_${guestMessage.guest_email}`;
          
          if (!guestConversationsMap.has(conversationKey)) {
            guestConversationsMap.set(conversationKey, {
              id: conversationKey,
              listing_id: guestMessage.listing_id || '',
              listing_title: guestMessage.listing?.title || 'Annonce supprimée',
              listing_price: guestMessage.listing?.price || 0,
              listing_currency: guestMessage.listing?.currency || 'CFA',
              participant_id: null, // Les invités n'ont pas d'ID utilisateur
              participant_name: guestMessage.guest_name || 'Invité',
              participant_email: guestMessage.guest_email || '',
              participant_phone: guestMessage.guest_phone,
              participant_avatar: null, // Les invités n'ont pas d'avatar
              is_participant_registered: false,
              last_message: guestMessage.content || '',
              last_message_at: guestMessage.created_at || new Date().toISOString(),
              unread_count: guestMessage.is_read ? 0 : 1,
              total_messages: 1,
              conversation_type: 'guest'
            });
          } else {
            // Mise à jour d'une conversation existante
            const conversation = guestConversationsMap.get(conversationKey);
            if (conversation) {
              conversation.total_messages++;
              
              if (!guestMessage.is_read) {
                conversation.unread_count++;
              }
              
              const messageDate = new Date(guestMessage.created_at || 0);
              const conversationDate = new Date(conversation.last_message_at || 0);
              
              if (messageDate > conversationDate) {
                conversation.last_message = guestMessage.content || '';
                conversation.last_message_at = guestMessage.created_at || new Date().toISOString();
              }
            }
          }
        });
      }

      // Fusion et tri des conversations
      const allConversations = [
        ...Array.from(standardConversationsMap.values()),
        ...Array.from(guestConversationsMap.values())
      ].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setConversations(allConversations);
      
      console.log(`${allConversations.length} conversations récupérées (${standardConversationsMap.size} standards, ${guestConversationsMap.size} invités)`);

    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, getGuestMessagesForSeller, extractProfileData, extractListingData]);

  /**
   * Récupère tous les messages pour une conversation spécifique
   * VERSION AVEC VÉRIFICATIONS DE SÉCURITÉ
   */
  const fetchMessages = useCallback(async (listingId: string, participantId: string | null): Promise<void> => {
    if (!user) return;

    setLoading(true);

    try {
      console.log('Récupération des messages pour la conversation:', { listingId, participantId });

      let allMessages: UnifiedMessage[] = [];

      // Si participantId est null, c'est une conversation avec un invité
      if (participantId === null) {
        // Récupérer les messages d'invités pour cette annonce
        const guestMessages = await getGuestMessagesForSeller(user.id);
        const relevantGuestMessages = guestMessages.filter(msg => msg.listing_id === listingId);
        
        // Convertir les messages d'invités au format unifié
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
            is_registered: false
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
        // Récupérer les messages standards pour cette conversation
        const { data: standardMessages, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(
              id,
              full_name,
              email,
              avatar_url
            ),
            receiver:profiles!messages_receiver_id_fkey(
              id,
              full_name,
              email,
              avatar_url
            ),
            listing:listings(
              id,
              title,
              price,
              currency,
              images
            )
          `)
          .eq('listing_id', listingId)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erreur lors de la récupération des messages standards:', error);
          throw error;
        }

        // Convertir les messages standards au format unifié avec vérifications de sécurité
        if (standardMessages && Array.isArray(standardMessages)) {
          allMessages = standardMessages.map(stdMsg => {
            const senderData = extractProfileData(stdMsg.sender);
            const listingData = extractListingData(stdMsg.listing);
            
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
                is_registered: true
              },
              listing_info: stdMsg.listing ? {
                title: listingData.title,
                price: listingData.price,
                currency: listingData.currency,
                images: Array.isArray(stdMsg.listing) 
                  ? (stdMsg.listing[0]?.images || [])
                  : (stdMsg.listing?.images || [])
              } : undefined,
              original_data: stdMsg as StandardMessage
            };
          });
        }
      }

      // Trier les messages par date (plus ancien en premier pour l'affichage de chat)
      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setMessages(allMessages);
      console.log(`${allMessages.length} messages récupérés pour la conversation`);

    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, getGuestMessagesForSeller, extractProfileData, extractListingData]);

  /**
   * Envoie un message standard (utilisateur connecté à utilisateur connecté)
   */
  const sendMessage = useCallback(async (
    listingId: string, 
    receiverId: string, 
    content: string
  ): Promise<boolean> => {
    if (!user || !content.trim()) {
      console.warn('Tentative d\'envoi de message invalide');
      return false;
    }

    try {
      console.log('Envoi d\'un message standard:', { listingId, receiverId });

      const { error } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          read: false
        });

      if (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        throw error;
      }

      console.log('Message standard envoyé avec succès');
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });

      // Rafraîchir les messages de la conversation actuelle
      await fetchMessages(listingId, receiverId);
      
      return true;

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast, fetchMessages]);

  /**
   * Marque les messages comme lus pour une conversation
   */
  const markConversationAsRead = useCallback(async (
    listingId: string, 
    participantId: string | null
  ): Promise<void> => {
    if (!user) return;

    try {
      if (participantId === null) {
        console.log('Marquage des messages d\'invités comme lus');
        // Pour l'instant, on ne fait rien car useGuestMessages gère cela individuellement
        // Une amélioration future serait de créer une fonction batch
      } else {
        console.log('Marquage des messages standards comme lus');
        
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('listing_id', listingId)
          .eq('sender_id', participantId)
          .eq('receiver_id', user.id);
      }

      // Rafraîchir les conversations pour mettre à jour les compteurs
      await fetchConversations();

    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      // On ne montre pas d'erreur à l'utilisateur pour cette action secondaire
    }
  }, [user, fetchConversations]);

  // Charger les conversations au montage du composant
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markConversationAsRead
  };
};