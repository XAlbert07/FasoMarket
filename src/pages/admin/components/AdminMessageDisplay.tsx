// components/AdminMessageDisplay.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Clock, Mail, AlertCircle, Info, CheckCircle, X, MailOpen } from "lucide-react";
import { RealtimeMessage } from "@/hooks/useRealtimeChat";

interface AdminMessageDisplayProps {
  messages: RealtimeMessage[];
  onMarkAsRead: (messageId: string) => void;
  loading?: boolean;
}

const AdminMessageDisplay: React.FC<AdminMessageDisplayProps> = ({
  messages,
  onMarkAsRead,
  loading = false
}) => {
  const [selectedMessage, setSelectedMessage] = useState<RealtimeMessage | null>(null);

  // Fonction pour obtenir l'icône selon la priorité
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'low':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  // Fonction pour obtenir la couleur selon la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: diffDays > 365 ? 'numeric' : undefined 
      });
    }
  };

  // Fonction pour ouvrir le détail d'un message
  const handleOpenMessage = (message: RealtimeMessage) => {
    setSelectedMessage(message);
    if (!message.read) {
      onMarkAsRead(message.id);
    }
  };

  // Fonction pour fermer le détail
  const handleCloseMessage = () => {
    setSelectedMessage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun message administrateur</h3>
          <p className="text-gray-600">
            Vous n'avez reçu aucun message de l'équipe d'administration pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {messages.map((message) => (
          <Card 
            key={message.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              !message.read ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            } ${getPriorityColor(message.priority)}`}
            onClick={() => handleOpenMessage(message)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <span>{message.subject || 'Message de l\'administration'}</span>
                      {!message.read && (
                        <Badge variant="default" className="bg-blue-600 text-white text-xs">
                          Nouveau
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600">
                        Administration FasoMarket
                      </span>
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(message.priority)}
                        <span className="text-xs capitalize text-gray-500">
                          {message.priority === 'high' ? 'Urgent' : 
                           message.priority === 'medium' ? 'Important' : 'Information'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(message.created_at)}
                  </div>
                  {message.read ? (
                    <MailOpen className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Mail className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-700 line-clamp-2">
                {message.content}
              </p>
              {message.admin_metadata?.message_category && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {message.admin_metadata.message_category}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de détail du message */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={handleCloseMessage}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Message de l'administration</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* En-tête du message */}
              <div className={`p-4 rounded-lg border-l-4 ${getPriorityColor(selectedMessage.priority)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Shield className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">Administration FasoMarket</p>
                      <p className="text-sm text-gray-600">
                        {selectedMessage.sender_profile?.full_name || 'Équipe administrative'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {getPriorityIcon(selectedMessage.priority)}
                      <Badge variant="secondary" className="text-xs">
                        {selectedMessage.priority === 'high' ? 'Urgent' : 
                         selectedMessage.priority === 'medium' ? 'Important' : 'Information'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedMessage.created_at)}
                    </p>
                  </div>
                </div>

                {/* Sujet du message */}
                {selectedMessage.subject && (
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {selectedMessage.subject}
                  </h3>
                )}
              </div>

              {/* Contenu du message */}
              <div className="prose prose-sm max-w-none">
                <div className="bg-white p-4 rounded border">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>

              {/* Métadonnées administratives */}
              {selectedMessage.admin_metadata && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Informations complémentaires
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedMessage.admin_metadata.message_category && (
                      <div>
                        <span className="text-gray-600">Catégorie:</span>
                        <span className="ml-2 font-medium">
                          {selectedMessage.admin_metadata.message_category}
                        </span>
                      </div>
                    )}
                    {selectedMessage.admin_metadata.admin_name && (
                      <div>
                        <span className="text-gray-600">Envoyé par:</span>
                        <span className="ml-2 font-medium">
                          {selectedMessage.admin_metadata.admin_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pied de page */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      {selectedMessage.read ? 'Message lu' : 'Marqué comme lu'}
                    </span>
                  </div>
                  <Button variant="outline" onClick={handleCloseMessage}>
                    <X className="h-4 w-4 mr-2" />
                    Fermer
                  </Button>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-800">
                  <p>
                    Ce message provient de l'équipe d'administration de FasoMarket. 
                    Si vous avez des questions, vous pouvez nous contacter via 
                    la section Aide et Support.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AdminMessageDisplay;