// pages/admin/components/AdminChatModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Send, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/contexts/AuthContext";

interface AdminChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: any; 
}

// Types de messages administrateur avec templates prédéfinis
const MESSAGE_TEMPLATES = {
  welcome: {
    title: "Message de bienvenue",
    content: "Bonjour et bienvenue sur FasoMarket ! Nous sommes ravis de vous accueillir sur notre plateforme. N'hésitez pas à nous contacter si vous avez des questions.",
    type: "info" as const
  },
  verification: {
    title: "Demande de vérification",
    content: "Nous avons remarqué que votre profil n'est pas encore vérifié. Pour améliorer votre visibilité et la confiance des acheteurs, nous vous encourageons à compléter votre profil avec vos informations de contact.",
    type: "info" as const
  },
  warning: {
    title: "Avertissement modération",
    content: "Nous avons reçu des signalements concernant votre activité sur FasoMarket. Veuillez vous assurer que vos annonces respectent nos conditions d'utilisation. En cas de récidive, des sanctions pourront être appliquées.",
    type: "warning" as const
  },
  policy_reminder: {
    title: "Rappel des règles",
    content: "Nous vous rappelons l'importance de respecter nos conditions d'utilisation, notamment concernant la véracité des informations et la qualité des photos de vos annonces.",
    type: "info" as const
  },
  congratulations: {
    title: "Félicitations",
    content: "Félicitations ! Votre activité exemplaire sur FasoMarket contribue à créer une communauté de confiance. Continuez ainsi !",
    type: "success" as const
  },
  custom: {
    title: "Message personnalisé",
    content: "",
    type: "info" as const
  }
};

type MessageType = "info" | "warning" | "success" | "urgent";

const AdminChatModal: React.FC<AdminChatModalProps> = ({
  isOpen,
  onClose,
  targetUser
}) => {
  // États pour gérer le formulaire et l'envoi
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof MESSAGE_TEMPLATES>('custom');
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('info');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null); // Pour stocker le profil complet
  
  const { user } = useAuthContext(); // Admin connecté (objet User de Supabase)
  const { toast } = useToast();

  // Fonction pour récupérer le profil complet de l'admin
  const fetchAdminProfile = async () => {
    if (!user?.id || userProfile) return userProfile;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('⚠️ Impossible de récupérer le profil admin:', error);
        return null;
      }

      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.warn('⚠️ Erreur lors de la récupération du profil:', error);
      return null;
    }
  };

  // Mise à jour du contenu quand le template change
  const handleTemplateChange = (templateKey: keyof typeof MESSAGE_TEMPLATES) => {
    setSelectedTemplate(templateKey);
    const template = MESSAGE_TEMPLATES[templateKey];
    setMessageContent(template.content);
    setSubject(template.title);
    setMessageType(template.type);
  };

  // Fonction pour envoyer le message administrateur
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !subject.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le sujet et le contenu du message.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour envoyer un message.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    
    try {
      console.log('📧 [ADMIN_CHAT] Envoi message admin vers:', targetUser.email);
      
      // Récupérer le profil complet de l'admin pour les métadonnées
      const adminProfile = await fetchAdminProfile();
      const adminName = adminProfile?.full_name || user.email || 'Administration';

      // Structure spéciale pour un message administrateur
      const adminMessageData = {
        receiver_id: targetUser.id,
        sender_id: user.id,
        listing_id: null, // Les messages admin ne sont pas liés à une annonce spécifique
        content: messageContent.trim(),
        message_type: 'admin', // ⚡ Nouveau : type spécial pour distinguer les messages admin
        subject: subject.trim(),
        priority: messageType === 'urgent' ? 'high' : messageType === 'warning' ? 'medium' : 'low',
        admin_metadata: {
          message_category: selectedTemplate,
          sent_from: 'admin_dashboard',
          admin_name: adminName, // ✅ Utilisation sécurisée du nom
          timestamp: new Date().toISOString()
        },
        read: false // Le message n'est pas lu par défaut
      };

      console.log('📧 [ADMIN_CHAT] Données du message:', adminMessageData);

      // Insertion dans la table messages avec les champs spéciaux admin
      const { data: messageResult, error: messageError } = await supabase
        .from('messages')
        .insert(adminMessageData)
        .select()
        .single();

      if (messageError) {
        console.error('❌ [ADMIN_CHAT] Erreur envoi message:', messageError);
        throw messageError;
      }

      console.log('✅ [ADMIN_CHAT] Message admin envoyé avec succès:', messageResult.id);

      // Enregistrement de l'action dans les logs d'audit
      try {
        await supabase
          .from('admin_actions')
          .insert({
            admin_id: user.id,
            action_type: 'SEND_MESSAGE',
            target_type: 'user',
            target_id: targetUser.id,
            reason: `Message administrateur: ${subject}`,
            notes: `Type: ${messageType}, Template: ${selectedTemplate}`,
            metadata: {
              message_id: messageResult.id,
              subject: subject,
              message_type: messageType
            }
          });
      } catch (auditError) {
        console.warn('⚠️ [ADMIN_CHAT] Erreur log audit (non bloquante):', auditError);
      }

      // Succès
      toast({
        title: "Message envoyé",
        description: `Votre message administrateur a été envoyé à ${targetUser.full_name || targetUser.email}`,
      });

      // Réinitialisation et fermeture
      setMessageContent('');
      setSubject('');
      setSelectedTemplate('custom');
      setMessageType('info');
      onClose();

    } catch (error) {
      console.error('💥 [ADMIN_CHAT] Erreur lors de l\'envoi:', error);
      
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Fonction pour obtenir la couleur selon le type de message
  const getMessageTypeColor = (type: MessageType) => {
    const colors = {
      info: "bg-blue-50 text-blue-700 border-blue-200",
      warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
      success: "bg-green-50 text-green-700 border-green-200",
      urgent: "bg-red-50 text-red-700 border-red-200"
    };
    return colors[type];
  };

  // Fonction pour obtenir l'icône selon le type
  const getMessageTypeIcon = (type: MessageType) => {
    const icons = {
      info: <Info className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      success: <CheckCircle className="h-4 w-4" />,
      urgent: <AlertCircle className="h-4 w-4" />
    };
    return icons[type];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Message Administrateur</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations du destinataire */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Destinataire</h3>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={targetUser.avatar_url} />
                <AvatarFallback>
                  {(targetUser.full_name || targetUser.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{targetUser.full_name || 'Nom non renseigné'}</span>
                  {targetUser.verification_status === 'verified' && (
                    <Badge variant="secondary" className="text-xs">Vérifié</Badge>
                  )}
                  {targetUser.role === 'admin' && (
                    <Badge variant="destructive" className="text-xs">Admin</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{targetUser.email}</p>
                {targetUser.location && (
                  <p className="text-xs text-gray-500">{targetUser.location}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sélection du template */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Type de message
            </label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">🎉 Message de bienvenue</SelectItem>
                <SelectItem value="verification">✅ Demande de vérification</SelectItem>
                <SelectItem value="warning">⚠️ Avertissement modération</SelectItem>
                <SelectItem value="policy_reminder">📋 Rappel des règles</SelectItem>
                <SelectItem value="congratulations">🏆 Félicitations</SelectItem>
                <SelectItem value="custom">✏️ Message personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type et priorité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Priorité du message
              </label>
              <Select value={messageType} onValueChange={(value: MessageType) => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span>Information</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span>Avertissement</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Félicitations</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>Urgent</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Aperçu du type
              </label>
              <div className={`p-2 rounded border text-sm flex items-center space-x-2 ${getMessageTypeColor(messageType)}`}>
                {getMessageTypeIcon(messageType)}
                <span>Message {messageType}</span>
              </div>
            </div>
          </div>

          {/* Sujet du message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Sujet du message *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Ex: Vérification de votre profil"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">{subject.length}/100 caractères</p>
          </div>

          {/* Contenu du message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Contenu du message *
            </label>
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Rédigez votre message ici..."
              className="min-h-32"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{messageContent.length}/1000 caractères</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Lecture estimée: {Math.ceil(messageContent.length / 200)} min</span>
              </div>
            </div>
          </div>

          {/* Aperçu du message */}
          {messageContent && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu du message</h4>
              <div className="bg-white border rounded p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Message de l'administration FasoMarket</span>
                  <Badge variant="secondary" className="text-xs">{messageType}</Badge>
                </div>
                <h5 className="font-medium mb-2">{subject}</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{messageContent}</p>
                <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                  Envoyé par l'équipe administrative FasoMarket
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={sending || !messageContent.trim() || !subject.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminChatModal;