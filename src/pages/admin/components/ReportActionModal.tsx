import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Clock, Ban, Eye, FileX, AlertCircle } from 'lucide-react';



interface ReportActionModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
  onAction: (reportId: string, action: any) => Promise<boolean>;
}

const ReportActionModal: React.FC<ReportActionModalProps> = ({
  report,
  isOpen,
  onClose,
  onAction
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('7');
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration des actions possibles selon le type de signalement
  const getAvailableActions = () => {
    const baseActions = [
      { id: 'approve', label: 'Approuver le signalement', icon: Shield, color: 'green' },
      { id: 'dismiss', label: 'Rejeter le signalement', icon: Eye, color: 'gray' }
    ];

    if (report.report_type === 'listing') {
      return [
        ...baseActions,
        { id: 'suspend_listing', label: 'Suspendre l\'annonce', icon: AlertCircle, color: 'orange' },
        { id: 'remove_listing', label: 'Supprimer l\'annonce', icon: FileX, color: 'red' },
        { id: 'warn_user', label: 'Avertir le propriétaire', icon: AlertTriangle, color: 'yellow' },
        { id: 'suspend_user', label: 'Suspendre le propriétaire', icon: Clock, color: 'orange' },
        { id: 'ban_user', label: 'Bannir le propriétaire', icon: Ban, color: 'red' }
      ];
    } else {
      return [
        ...baseActions,
        { id: 'warn_user', label: 'Avertir l\'utilisateur', icon: AlertTriangle, color: 'yellow' },
        { id: 'suspend_user', label: 'Suspendre l\'utilisateur', icon: Clock, color: 'orange' },
        { id: 'ban_user', label: 'Bannir l\'utilisateur', icon: Ban, color: 'red' }
      ];
    }
  };

  const availableActions = getAvailableActions();
  const selectedActionConfig = availableActions.find(a => a.id === selectedAction);

  // Raisons prédéfinies selon le type d'action
  const getPredefinedReasons = (actionType: string) => {
    const reasonsMap: Record<string, string[]> = {
      'approve': ['Signalement fondé et vérifié', 'Violation des conditions d\'utilisation confirmée'],
      'dismiss': ['Signalement non fondé', 'Informations insuffisantes', 'Utilisation acceptable'],
      'warn_user': ['Premier avertissement', 'Comportement limite', 'Contenu inapproprié mineur'],
      'suspend_user': ['Violations répétées', 'Comportement abusif', 'Non-respect des avertissements'],
      'ban_user': ['Violations graves répétées', 'Fraude confirmée', 'Comportement malveillant'],
      'suspend_listing': ['Contenu non conforme', 'Prix suspect', 'Photos inappropriées'],
      'remove_listing': ['Contenu illégal', 'Fraude confirmée', 'Violation majeure']
    };
    
    return reasonsMap[actionType] || [];
  };

  const handleSubmit = async () => {
    if (!selectedAction || !reason) {
      return;
    }

    setIsProcessing(true);
    
    try {
      const actionData = {
        type: selectedAction,
        reason,
        notes: notes.trim() || undefined,
        duration: ['suspend_user', 'ban_user'].includes(selectedAction) ? parseInt(duration) : undefined
      };

      const success = await onAction(report.id, actionData);
      
      if (success) {
        onClose();
        // Reset form
        setSelectedAction('');
        setReason('');
        setNotes('');
        setDuration('7');
      }
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const needsDuration = ['suspend_user', 'ban_user'].includes(selectedAction);
  const isDestructiveAction = ['ban_user', 'remove_listing'].includes(selectedAction);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Action administrative - Signalement #{report.id?.slice(-8)}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Choisissez l'action appropriée pour traiter ce signalement
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Résumé du signalement */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={report.report_type === 'listing' ? 'default' : 'secondary'}>
                      {report.report_type === 'listing' ? 'Annonce' : 'Profil'}
                    </Badge>
                    <Badge className={`${
                      report.priority === 'high' ? 'bg-red-100 text-red-600' :
                      report.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      Priorité {report.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Cible</Label>
                  <p className="mt-1 font-medium">
                    {report.listing_title || report.reported_user_name || 'Cible inconnue'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-600">Motif du signalement</Label>
                <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{report.reason}</p>
              </div>

              {report.description && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{report.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sélection de l'action */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Action à entreprendre</Label>
            <div className="grid grid-cols-1 gap-2">
              {availableActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant={selectedAction === action.id ? "default" : "outline"}
                    className={`justify-start h-auto p-3 ${
                      selectedAction === action.id ? '' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAction(action.id)}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${
                      action.color === 'red' ? 'text-red-500' :
                      action.color === 'orange' ? 'text-orange-500' :
                      action.color === 'yellow' ? 'text-yellow-500' :
                      action.color === 'green' ? 'text-green-500' :
                      'text-gray-500'
                    }`} />
                    <div className="text-left">
                      <div className="font-medium">{action.label}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Configuration de l'action sélectionnée */}
          {selectedAction && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center space-x-2">
                {selectedActionConfig && <selectedActionConfig.icon className="h-4 w-4" />}
                <span>Configuration de l'action</span>
              </h4>

              {/* Durée pour les sanctions temporaires */}
              {needsDuration && (
                <div>
                  <Label htmlFor="duration">Durée de la sanction</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir la durée" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 jour</SelectItem>
                      <SelectItem value="3">3 jours</SelectItem>
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="14">14 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                      <SelectItem value="90">90 jours</SelectItem>
                      {selectedAction === 'ban_user' && (
                        <SelectItem value="365">Bannissement permanent</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Raison de l'action */}
              <div>
                <Label htmlFor="reason">Raison de l'action *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une raison" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPredefinedReasons(selectedAction).map((reasonOption) => (
                      <SelectItem key={reasonOption} value={reasonOption}>
                        {reasonOption}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Raison personnalisée...</SelectItem>
                  </SelectContent>
                </Select>
                
                {reason === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="Entrez une raison personnalisée"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                )}
              </div>

              {/* Notes additionnelles */}
              <div>
                <Label htmlFor="notes">Notes administratives (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes internes sur cette décision..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Avertissement pour les actions destructives */}
              {isDestructiveAction && (
                <div className="p-3 border border-red-200 bg-red-50 rounded flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Action irréversible</p>
                    <p>Cette action ne peut pas être annulée. Assurez-vous que c'est la décision appropriée.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onClose} disabled={isProcessing}>
            Annuler
          </AlertDialogCancel>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedAction || !reason || isProcessing}
            className={isDestructiveAction ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isProcessing ? 'Traitement...' : 'Appliquer l\'action'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReportActionModal;