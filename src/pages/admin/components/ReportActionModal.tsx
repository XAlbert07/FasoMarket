// components/ReportActionModal.tsx - Version corrigée avec gestion des durées

import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Shield, Clock, Ban, Eye, FileX, AlertCircle, Calendar, Timer, Settings } from 'lucide-react';

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
  const [customDuration, setCustomDuration] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration des actions possibles selon le type de signalement
  const getAvailableActions = () => {
    const baseActions = [
      { 
        id: 'approve', 
        label: 'Approuver le signalement', 
        icon: Shield, 
        color: 'green',
        description: 'Confirmer que le signalement est fondé et prendre les mesures appropriées'
      },
      { 
        id: 'dismiss', 
        label: 'Rejeter le signalement', 
        icon: Eye, 
        color: 'gray',
        description: 'Considérer le signalement comme non fondé et le fermer'
      }
    ];

    if (report.report_type === 'listing') {
      return [
        ...baseActions,
        { 
          id: 'suspend_listing', 
          label: 'Suspendre l\'annonce temporairement', 
          icon: Timer, 
          color: 'orange',
          description: 'Suspendre l\'annonce pour une durée limitée',
          supportsDuration: true
        },
        { 
          id: 'remove_listing', 
          label: 'Supprimer l\'annonce définitivement', 
          icon: FileX, 
          color: 'red',
          description: 'Supprimer définitivement l\'annonce (action irréversible)'
        },
        { 
          id: 'warn_user', 
          label: 'Avertir le propriétaire', 
          icon: AlertTriangle, 
          color: 'yellow',
          description: 'Envoyer un avertissement au propriétaire de l\'annonce'
        },
        { 
          id: 'suspend_user', 
          label: 'Suspendre le propriétaire temporairement', 
          icon: Clock, 
          color: 'orange',
          description: 'Suspendre temporairement le compte du propriétaire',
          supportsDuration: true
        },
        { 
          id: 'ban_user', 
          label: 'Bannir le propriétaire', 
          icon: Ban, 
          color: 'red',
          description: 'Bannir définitivement ou temporairement le propriétaire',
          supportsDuration: true,
          allowPermanent: true
        }
      ];
    } else {
      return [
        ...baseActions,
        { 
          id: 'warn_user', 
          label: 'Avertir l\'utilisateur', 
          icon: AlertTriangle, 
          color: 'yellow',
          description: 'Envoyer un avertissement à l\'utilisateur'
        },
        { 
          id: 'suspend_user', 
          label: 'Suspendre l\'utilisateur temporairement', 
          icon: Clock, 
          color: 'orange',
          description: 'Suspendre temporairement le compte de l\'utilisateur',
          supportsDuration: true
        },
        { 
          id: 'ban_user', 
          label: 'Bannir l\'utilisateur', 
          icon: Ban, 
          color: 'red',
          description: 'Bannir définitivement ou temporairement l\'utilisateur',
          supportsDuration: true,
          allowPermanent: true
        }
      ];
    }
  };

  const availableActions = getAvailableActions();
  const selectedActionConfig = availableActions.find(a => a.id === selectedAction);

  // Raisons prédéfinies selon le type d'action avec plus d'options
  const getPredefinedReasons = (actionType: string) => {
    const reasonsMap: Record<string, string[]> = {
      'approve': [
        'Signalement fondé et vérifié',
        'Violation des conditions d\'utilisation confirmée',
        'Contenu inapproprié confirmé',
        'Activité suspecte détectée'
      ],
      'dismiss': [
        'Signalement non fondé',
        'Informations insuffisantes',
        'Utilisation acceptable du service',
        'Malentendu ou erreur de signalement',
        'Pas de violation des règles communautaires'
      ],
      'warn_user': [
        'Premier avertissement - comportement limite',
        'Contenu inapproprié mineur',
        'Non-respect des bonnes pratiques',
        'Amélioration nécessaire du contenu',
        'Rappel des règles communautaires'
      ],
      'suspend_user': [
        'Violations répétées des règles',
        'Comportement abusif envers d\'autres utilisateurs',
        'Non-respect des avertissements précédents',
        'Activité suspecte nécessitant investigation',
        'Contenu inapproprié récurrent'
      ],
      'ban_user': [
        'Violations graves et répétées',
        'Fraude confirmée',
        'Comportement malveillant persistant',
        'Tentative d\'escroquerie',
        'Création de comptes multiples (ban evasion)',
        'Contenus illégaux ou dangereux'
      ],
      'suspend_listing': [
        'Contenu non conforme aux standards',
        'Prix suspect ou irréaliste',
        'Photos inappropriées ou trompeuses',
        'Description incomplète ou mensongère',
        'Produit potentiellement contrefait'
      ],
      'remove_listing': [
        'Contenu illégal confirmé',
        'Fraude avérée',
        'Violation majeure des conditions',
        'Produit interdit sur la plateforme',
        'Contenu dangereux pour les utilisateurs'
      ]
    };
    
    return reasonsMap[actionType] || [];
  };

  // Options de durée prédéfinies
  const getDurationOptions = () => {
    const baseOptions = [
      { value: '1', label: '1 jour', description: 'Suspension très courte' },
      { value: '3', label: '3 jours', description: 'Avertissement sérieux' },
      { value: '7', label: '7 jours', description: 'Suspension standard' },
      { value: '14', label: '14 jours', description: 'Suspension prolongée' },
      { value: '30', label: '30 jours', description: 'Sanction sévère' },
      { value: '90', label: '90 jours', description: 'Suspension très longue' }
    ];

    if (selectedActionConfig?.allowPermanent) {
      return [
        ...baseOptions,
        { value: '365', label: 'Bannissement permanent', description: 'Interdiction définitive' },
        { value: 'custom', label: 'Durée personnalisée', description: 'Spécifier une durée exacte' }
      ];
    }

    return [
      ...baseOptions,
      { value: 'custom', label: 'Durée personnalisée', description: 'Spécifier une durée exacte (max 90 jours)' }
    ];
  };

  const handleSubmit = async () => {
    if (!selectedAction || !reason) {
      return;
    }

    // Validation de la durée personnalisée
    let finalDuration = parseInt(duration);
    if (duration === 'custom') {
      finalDuration = parseInt(customDuration);
      
      if (isNaN(finalDuration) || finalDuration < 1) {
        alert('Veuillez entrer une durée valide (nombre de jours)');
        return;
      }
      
      if (!selectedActionConfig?.allowPermanent && finalDuration > 90) {
        alert('La durée maximale pour cette action est de 90 jours');
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      const actionData = {
        type: selectedAction,
        reason: reason === 'custom' ? document.querySelector<HTMLInputElement>('[data-custom-reason]')?.value || reason : reason,
        notes: notes.trim() || undefined,
        duration: selectedActionConfig?.supportsDuration ? finalDuration : undefined
      };

      const success = await onAction(report.id, actionData);
      
      if (success) {
        handleClose();
      }
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSelectedAction('');
    setReason('');
    setNotes('');
    setDuration('7');
    setCustomDuration('');
    onClose();
  };

  const needsDuration = selectedActionConfig?.supportsDuration;
  const isDestructiveAction = ['ban_user', 'remove_listing'].includes(selectedAction);
  const isPermanentAction = duration === '365';

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Action administrative - Signalement #{report?.id?.slice(-8)}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Choisissez l'action appropriée pour traiter ce signalement. Toutes les actions sont enregistrées pour audit.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Résumé du signalement */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type et Priorité</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={report?.report_type === 'listing' ? 'default' : 'secondary'}>
                        {report?.report_type === 'listing' ? 'Annonce' : 'Profil'}
                      </Badge>
                      <Badge className={`${
                        report?.priority === 'high' ? 'bg-red-100 text-red-600 border-red-200' :
                        report?.priority === 'medium' ? 'bg-yellow-100 text-yellow-600 border-yellow-200' :
                        'bg-green-100 text-green-600 border-green-200'
                      }`}>
                        Priorité {report?.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Signalé par</Label>
                    <div className="mt-1">
                      <p className="font-medium">{report?.reporter_name || 'Anonyme'}</p>
                      <Badge variant="outline" className="text-xs">
                        {report?.reporter_type === 'guest' ? 'Utilisateur invité' : 'Utilisateur inscrit'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cible du signalement</Label>
                    <div className="mt-1">
                      <p className="font-medium">
                        {report?.listing_title || report?.reported_user_name || 'Cible inconnue'}
                      </p>
                      {report?.listing_price && (
                        <p className="text-sm text-gray-500">{report?.listing_price.toLocaleString()} CFA</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date de signalement</Label>
                    <p className="text-sm text-gray-700 mt-1">
                      {new Date(report?.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Motif du signalement</Label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800 font-medium">{report?.reason}</p>
                  </div>
                </div>

                {report?.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description détaillée</Label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {report?.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sélection de l'action */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-medium">Action à entreprendre</Label>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {availableActions.map((action) => {
                const Icon = action.icon;
                const isSelected = selectedAction === action.id;
                
                return (
                  <Card 
                    key={action.id}
                    className={`cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAction(action.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          action.color === 'red' ? 'bg-red-100' :
                          action.color === 'orange' ? 'bg-orange-100' :
                          action.color === 'yellow' ? 'bg-yellow-100' :
                          action.color === 'green' ? 'bg-green-100' :
                          'bg-gray-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            action.color === 'red' ? 'text-red-600' :
                            action.color === 'orange' ? 'text-orange-600' :
                            action.color === 'yellow' ? 'text-yellow-600' :
                            action.color === 'green' ? 'text-green-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{action.label}</h4>
                            {action.supportsDuration && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Temporaire
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Configuration de l'action sélectionnée */}
          {selectedAction && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  {selectedActionConfig && <selectedActionConfig.icon className="h-5 w-5 text-blue-600" />}
                  <h4 className="font-medium text-blue-900">Configuration de l'action</h4>
                </div>

                <div className="space-y-4">
                  {/* Durée pour les sanctions temporaires */}
                  {needsDuration && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <Label htmlFor="duration" className="font-medium">Durée de la sanction</Label>
                      </div>
                      
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir la durée" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDurationOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-500">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {duration === 'custom' && (
                        <div>
                          <Label htmlFor="custom-duration">Nombre de jours personnalisé</Label>
                          <Input
                            id="custom-duration"
                            type="number"
                            min="1"
                            max={selectedActionConfig?.allowPermanent ? "9999" : "90"}
                            value={customDuration}
                            onChange={(e) => setCustomDuration(e.target.value)}
                            placeholder="Entrez le nombre de jours"
                            className="mt-1"
                          />
                        </div>
                      )}

                      {isPermanentAction && (
                        <div className="p-3 border border-red-200 bg-red-50 rounded flex items-start space-x-2">
                          <Ban className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-red-700">
                            <p className="font-medium">Bannissement permanent sélectionné</p>
                            <p>Cette action interdira définitivement l'accès à la plateforme.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raison de l'action */}
                  <div className="space-y-3">
                    <Label htmlFor="reason" className="font-medium flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Raison de l'action *</span>
                    </Label>
                    
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
                        <SelectItem value="custom">✏️ Raison personnalisée...</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {reason === 'custom' && (
                      <Input
                        data-custom-reason
                        placeholder="Entrez une raison personnalisée"
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Notes administratives */}
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="font-medium">Notes administratives internes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ajoutez des notes internes sur cette décision pour l'équipe d'administration..."
                      rows={3}
                    />
                  </div>

                  {/* Avertissement pour les actions destructives */}
                  {isDestructiveAction && (
                    <div className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-start space-x-3">
                      <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700">
                        <p className="font-medium text-base mb-2">⚠️ Action irréversible</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Cette action ne peut pas être annulée automatiquement</li>
                          <li>Un processus d'appel manuel sera nécessaire pour la révision</li>
                          <li>L'utilisateur sera immédiatement affecté par cette décision</li>
                          <li>Assurez-vous que cette décision est justifiée et proportionnelle</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-6">
          <AlertDialogCancel onClick={handleClose} disabled={isProcessing}>
            Annuler
          </AlertDialogCancel>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedAction || !reason || isProcessing}
            className={`${isDestructiveAction ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} min-w-[140px]`}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Traitement...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {selectedActionConfig && <selectedActionConfig.icon className="h-4 w-4" />}
                <span>Appliquer l'action</span>
              </div>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReportActionModal;