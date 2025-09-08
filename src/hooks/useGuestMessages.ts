// hooks/useGuestMessages.ts
// Hook spécialisé pour gérer les messages d'invités

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface GuestMessage {
  id: string;
  listing_id: string;
  receiver_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  content: string;
  is_read: boolean;
  replied: boolean;
  created_at: string;
  
  // Relations avec d'autres tables
  listing?: {
    title: string;
    price: number;
    currency: string;
    images: string[];
  };
}

export interface GuestMessageData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export const useGuestMessages = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Envoie un message en tant qu'invité
   * Cette fonction est accessible même aux utilisateurs non connectés
   * @param listingId - ID de l'annonce concernée
   * @param receiverId - ID du vendeur qui recevra le message
   * @param guestData - Données de l'invité (nom, email, téléphone, message)
   */
  const sendGuestMessage = useCallback(async (
    listingId: string, 
    receiverId: string, 
    guestData: GuestMessageData
  ): Promise<void> => {
    // Validation des données d'entrée pour éviter les erreurs
    if (!guestData.name.trim()) {
      throw new Error('Le nom est obligatoire');
    }
    
    if (!guestData.email.trim()) {
      throw new Error('L\'email est obligatoire');
    }
    
    if (!guestData.message.trim()) {
      throw new Error('Le message est obligatoire');
    }
    
    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestData.email)) {
      throw new Error('Format d\'email invalide');
    }

    setLoading(true);

    try {
      console.log('📧 Envoi d\'un message d\'invité pour l\'annonce:', listingId);

      // Insertion du message d'invité dans la table spécialisée
      const { error } = await supabase
        .from('guest_messages')
        .insert({
          listing_id: listingId,
          receiver_id: receiverId,
          guest_name: guestData.name.trim(),
          guest_email: guestData.email.trim().toLowerCase(),
          guest_phone: guestData.phone?.trim() || null,
          content: guestData.message.trim(),
          is_read: false,
          replied: false
        });

      if (error) {
        console.error('❌ Erreur lors de l\'envoi du message d\'invité:', error);
        throw error;
      }

      console.log('✅ Message d\'invité envoyé avec succès');
      
      toast({
        title: "Message envoyé !",
        description: "Votre message a été transmis au vendeur. Il pourra vous recontacter via email ou téléphone.",
      });

      // Optionnel : Envoyer une notification au vendeur
      // Ceci peut être fait via un trigger Supabase ou une fonction Edge
      await notifySellerOfGuestMessage(receiverId, guestData.name);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi du message";
      console.error('❌ Erreur lors de l\'envoi du message d\'invité:', error);
      
      toast({
        title: "Erreur d'envoi",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Récupère les messages d'invités pour un vendeur connecté
   * Cette fonction n'est accessible qu'aux utilisateurs connectés
   * @param sellerId - ID du vendeur (doit être l'utilisateur connecté)
   * @param limit - Nombre maximum de messages à récupérer
   */
  const getGuestMessagesForSeller = useCallback(async (
    sellerId: string, 
    limit: number = 50
  ): Promise<GuestMessage[]> => {
    setLoading(true);

    try {
      console.log('📋 Récupération des messages d\'invités pour le vendeur:', sellerId);

      // Récupération des messages avec les données de l'annonce associée
      const { data, error } = await supabase
        .from('guest_messages')
        .select(`
          *,
          listing:listings(
            title,
            price,
            currency,
            images
          )
        `)
        .eq('receiver_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erreur lors de la récupération des messages d\'invités:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} messages d'invités récupérés`);
      return data || [];

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des messages d\'invités:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les messages",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Marque un message d'invité comme lu
   * @param messageId - ID du message à marquer comme lu
   * @param sellerId - ID du vendeur (pour la vérification de sécurité)
   */
  const markGuestMessageAsRead = useCallback(async (
    messageId: string, 
    sellerId: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('guest_messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('receiver_id', sellerId);

      if (error) throw error;

      console.log('✅ Message d\'invité marqué comme lu:', messageId);
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
      // On ne montre pas d'erreur à l'utilisateur pour cette action secondaire
    }
  }, []);

  /**
   * Marque un message d'invité comme ayant reçu une réponse
   * @param messageId - ID du message
   * @param sellerId - ID du vendeur
   */
  const markGuestMessageAsReplied = useCallback(async (
    messageId: string, 
    sellerId: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('guest_messages')
        .update({ replied: true })
        .eq('id', messageId)
        .eq('receiver_id', sellerId);

      if (error) throw error;

      console.log('✅ Message d\'invité marqué comme ayant reçu une réponse:', messageId);
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme répondu:', error);
    }
  }, []);

  return {
    sendGuestMessage,
    getGuestMessagesForSeller,
    markGuestMessageAsRead,
    markGuestMessageAsReplied,
    loading
  };
};

/**
 * Fonction utilitaire pour notifier le vendeur d'un nouveau message d'invité
 * Cette fonction peut déclencher l'envoi d'un email ou d'une notification push
 * @param sellerId - ID du vendeur à notifier
 * @param guestName - Nom de l'invité qui a envoyé le message
 */
const notifySellerOfGuestMessage = async (sellerId: string, guestName: string): Promise<void> => {
  try {
    // Option 1: Créer une notification dans la table notifications
    await supabase
      .from('notifications')
      .insert({
        user_id: sellerId,
        type: 'message',
        title: 'Nouveau message d\'un visiteur',
        content: `${guestName} vous a envoyé un message concernant une de vos annonces.`,
        read: false,
        action_url: '/messages', // URL vers la page de messages du vendeur
        created_at: new Date().toISOString()
      });

    // Option 2: Déclencher l'envoi d'un email via une fonction Edge
    // await supabase.functions.invoke('send-guest-message-notification', {
    //   body: { sellerId, guestName }
    // });

    console.log('✅ Notification envoyée au vendeur');
  } catch (error) {
    console.error('⚠️ Erreur lors de l\'envoi de la notification:', error);
    // On ne bloque pas l'envoi du message si la notification échoue
  }
};