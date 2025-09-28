import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Phone, Video, MoreVertical, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useNavigate } from 'react-router-dom'; 

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  isVerified?: boolean;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  listingId,
  receiverId,
  receiverName,
  receiverAvatar,
  isVerified = false
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate(); 
  
  const {
    messages,
    sendMessage,
    markAsRead,
    typing,
    onlineUsers,
    loading
  } = useRealtimeChat(listingId, receiverId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await sendMessage(message);
    setMessage('');
  };

  // ⚡ Fonction pour gérer la navigation vers le profil
  const handleNavigateToProfile = () => {
    // Fermer le modal d'abord pour éviter les conflits d'interface
    onClose();
    
    // Naviguer vers le profil du vendeur
    // La route /seller-profile/:sellerId est déjà configurée dans App.tsx
    navigate(`/seller-profile/${receiverId}`);
  };

  const isOnline = onlineUsers.includes(receiverId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0">
        {/* Header avec nom cliquable */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={receiverAvatar} alt={receiverName} />
                <AvatarFallback>{receiverName.charAt(0)}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {/* ⚡ Le nom est maintenant un bouton cliquable */}
              <Button
                variant="ghost"
                className="h-auto p-0 font-semibold text-left hover:bg-transparent hover:text-primary transition-colors"
                onClick={handleNavigateToProfile}
              >
                <DialogTitle className="flex items-center gap-2 text-left">
                  <span className="truncate">{receiverName}</span>
                  <User className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity" />
                  {isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      Vérifié
                    </Badge>
                  )}
                </DialogTitle>
              </Button>
              <p className="text-sm text-muted-foreground">
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              title="Appeler (bientôt disponible)"
              disabled
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              title="Appel vidéo (bientôt disponible)"
              disabled
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              title="Plus d'options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.sender_id === receiverId ? "justify-start" : "justify-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2",
                    msg.sender_id === receiverId
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={!message.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};