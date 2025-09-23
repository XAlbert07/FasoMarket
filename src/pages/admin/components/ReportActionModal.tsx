// pages/admin/components/ReportActionModal.tsx
// Modal de sanctions avancées - Mobile First avec toutes les fonctionnalités

import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

import { 
  AlertTriangle, Shield, Clock, Ban, Eye, FileX, AlertCircle, Calendar, 
  Timer, Settings, Gavel, UserX, MessageSquare, Trash2, 
  CheckCircle2, XCircle, Info, Zap, Target
} from 'lucide-react';




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
  // États pour le formulaire de sanction
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('7');
  const [customDuration, setCustomDuration] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSelectedAction('');
      setReason('');
      setCustomReason('');
      setNotes('');
      setDuration('7');
      setCustomDuration('');
      setIsProcessing(false);
      setShowPreview(false);
      setNotifyUser(true);
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Configuration des actions disponibles selon le type de signalement
  const getAvailableActions = () => {
    const baseActions = [
      { 
        id: 'approve', 
        label: 'Approuver le signalement', 
        icon: CheckCircle2, 
        color: 'green',
        severity: 'low',
        description: 'Confirmer que le signalement est fondé sans appliquer de sanction immédiate',
        requiresDuration: false
      },
      { 
        id: 'dismiss', 
        label: 'Rejeter le signalement', 
        icon: XCircle, 
        color: 'gray',
        severity: 'low',
        description: 'Considérer le signalement comme non fondé et le fermer',
        requiresDuration: false
      }
    ];

    if (report.report_type === 'listing') {
      return [
        ...baseActions,
        { 
          id: 'warn_user', 
          label: 'Avertir le propriétaire', 
          icon: AlertTriangle, 
          color: 'yellow',
          severity: 'low',
          description: 'Envoyer un avertissement au propriétaire de l\'annonce',
          requiresDuration: false
        },
        { 
          id: 'suspend_listing', 
          label: 'Suspendre l\'annonce temporairement', 
          icon: Timer, 
          color: 'orange',
          severity: 'medium',
          description: 'Rendre l\'annonce invisible pendant une durée déterminée',
          requiresDuration: true,
          supportsDuration: true
        },
        { 
          id: 'remove_listing', 
          label: 'Supprimer l\'annonce définitivement', 
          icon: Trash2, 
          color: 'red',
          severity: 'high',
          description: 'Supprimer définitivement l\'annonce (action irréversible)',
          requiresDuration: false
        },
        { 
          id: 'suspend_user', 
          label: 'Suspendre le propriétaire temporairement', 
          icon: UserX, 
          color: 'orange',
          severity: 'high',
          description: 'Suspendre temporairement le compte du propriétaire',
          requiresDuration: true,
          supportsDuration: true
        },
        { 
          id: 'ban_user', 
          label: 'Bannir le propriétaire', 
          icon: Ban, 
          color: 'red',
          severity: 'critical',
          description: 'Bannir définitivement ou temporairement le propriétaire',
          requiresDuration: true,
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
          severity: 'low',
          description: 'Envoyer un avertissement à l\'utilisateur',
          requiresDuration: false
        },
        { 
          id: 'suspend_user', 
          label: 'Suspendre l\'utilisateur temporairement', 
          icon: UserX, 
          color: 'orange',
          severity: 'high',
          description: 'Suspendre temporairement le compte de l\'utilisateur',
          requiresDuration: true,
          supportsDuration: true
        },
        { 
          id: 'ban_user', 
          label: 'Bannir l\'utilisateur', 
          icon: Ban, 
          color: 'red',
          severity: 'critical',
          description: 'Bannir définitivement ou temporairement l\'utilisateur',
          requiresDuration: true,
          supportsDuration: true,
          allowPermanent: true
        }
      ];
    }
  };

  const availableActions = getAvailableActions();
  const selectedActionConfig = availableActions.find(a => a.id === selectedAction);

  // Raisons prédéfinies selon le type d'action
  const getPredefinedReasons = (actionType: string) => {
    const reasonsMap: Record<string, string[]> = {
      'approve': [
        'Signalement fondé et vérifié',
        'Violation des conditions d\'utilisation confirmée',
        'Contenu inapproprié confirmé',
        'Activité suspecte détectée',
        'Non-conformité aux standards de la plateforme'
      ],
      'dismiss': [
        'Signalement non fondé',
        'Informations insuffisantes',
        'Utilisation acceptable du service',
        'Malentendu ou erreur de signalement',
        'Pas de violation des règles communautaires',
        'Désaccord commercial normal'
      ],
      'warn_user': [
        'Premier avertissement - comportement limite',
        'Contenu inapproprié mineur',
        'Non-respect des bonnes pratiques',
        'Amélioration nécessaire du contenu',
        'Rappel des règles communautaires',
        'Description ou prix peu clair',
        'Photos de qualité insuffisante'
      ],
      'suspend_user': [
        'Violations répétées des règles',
        'Comportement abusif envers d\'autres utilisateurs',
        'Non-respect des avertissements précédents',
        'Activité suspecte nécessitant investigation',
        'Contenu inapproprié récurrent',
        'Tentatives de contournement des règles',
        'Prix artificiellement gonflés de manière répétée'
      ],
      'ban_user': [
        'Violations graves et répétées',
        'Fraude confirmée',
        'Comportement malveillant persistant',
        'Tentative d\'escroquerie avérée',
        'Création de comptes multiples (ban evasion)',
        'Contenus illégaux ou dangereux',
        'Harcèlement ou menaces envers d\'autres utilisateurs',
        'Utilisation de la plateforme à des fins criminelles'
      ],
      'suspend_listing': [
        'Contenu non conforme aux standards',
        'Prix suspect ou irréaliste',
        'Photos inappropriées ou trompeuses',
        'Description incomplète ou mensongère',
        'Produit potentiellement contrefait',
        'Informations de contact invalides',
        'Violation des règles de catégorisation'
      ],
      'remove_listing': [
        'Contenu illégal confirmé',
        'Fraude avérée',
        'Violation majeure des conditions',
        'Produit interdit sur la plateforme',
        'Contenu dangereux pour les utilisateurs',
        'Arnaque confirmée par investigation',
        'Contenu pornographique ou violent'
      ]
    };
    
    return reasonsMap[actionType] || [];
  };

  // Options de durée selon l'action
  const getDurationOptions = () => {
    const baseOptions = [
      { value: '1', label: '1 jour', description: 'Sanction très légère' },
      { value: '3', label: '3 jours', description: 'Avertissement sérieux' },
      { value: '7', label: '1 semaine', description: 'Suspension standard' },
      { value: '14', label: '2 semaines', description: 'Sanction modérée' },
      { value: '30', label: '1 mois', description: 'Sanction sévère' },
      { value: '90', label: '3 mois', description: 'Suspension longue' }
    ];

    if (selectedActionConfig?.allowPermanent) {
      return [
        ...baseOptions,
        { value: '365', label: 'Bannissement permanent', description: '⚠️ Interdiction définitive' },
        { value: 'custom', label: 'Durée personnalisée', description: 'Spécifier une durée exacte' }
      ];
    }

    return [
      ...baseOptions,
      { value: 'custom', label: 'Durée personnalisée', description: 'Spécifier une durée exacte (max 90 jours)' }
    ];
  };

  // Validation du formulaire
  const validateForm = () => {
    if (!selectedAction) return { isValid: false, message: 'Veuillez sélectionner une action' };
    if (!reason && reason !== 'custom') return { isValid: false, message: 'Veuillez sélectionner un motif' };
    if (reason === 'custom' && !customReason.trim()) return { isValid: false, message: 'Veuillez saisir un motif personnalisé' };
    
    if (selectedActionConfig?.requiresDuration) {
      if (duration === 'custom') {
        const customDur = parseInt(customDuration);
        if (isNaN(customDur) || customDur < 1) {
          return { isValid: false, message: 'Veuillez entrer une durée valide' };
        }
        if (!selectedActionConfig?.allowPermanent && customDur > 90) {
          return { isValid: false, message: 'La durée maximale pour cette action est de 90 jours' };
        }
      }
    }
    
    return { isValid: true, message: '' };
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    setIsProcessing(true);
    
    try {
      let finalDuration = parseInt(duration);
      if (duration === 'custom') {
        finalDuration = parseInt(customDuration);
      }

      const actionData = {
        type: selectedAction,
        reason: reason === 'custom' ? customReason : reason,
        notes: notes.trim() || undefined,
        duration: selectedActionConfig?.requiresDuration ? finalDuration : undefined,
        notifyUser: notifyUser
      };

      console.log('🔧 Exécution de l\'action avancée:', actionData);

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

  // Fermeture et réinitialisation
  const handleClose = () => {
    setSelectedAction('');
    setReason('');
    setCustomReason('');
    setNotes('');
    setDuration('7');
    setCustomDuration('');
    setCurrentStep(1);
    setShowPreview(false);
    onClose();
  };

  // Couleurs selon la sévérité
  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'border-green-200 bg-green-50',
      medium: 'border-orange-200 bg-orange-50',
      high: 'border-red-200 bg-red-50',
      critical: 'border-red-300 bg-red-100'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getSeverityTextColor = (severity: string) => {
    const colors = {
      low: 'text-green-800',
      medium: 'text-orange-800', 
      high: 'text-red-800',
      critical: 'text-red-900'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  // Couleur de l'action selon le type
  const getActionColor = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-700 border-red-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      gray: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const needsDuration = selectedActionConfig?.requiresDuration;
  const isDestructiveAction = ['ban_user', 'remove_listing'].includes(selectedAction);
  const isPermanentAction = duration === '365';
  const isCriticalAction = selectedActionConfig?.severity === 'critical';

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-3">
            <Gavel className="h-6 w-6 text-blue-600" />
            <div className="flex-1">
              <div className="text-xl font-bold">Actions administratives</div>
              <div className="text-sm font-normal text-gray-600 mt-1">
                Signalement #{report?.id?.slice(-8)} • Type: {report?.report_type === 'listing' ? 'Annonce' : 'Profil'}
              </div>
            </div>
            <Badge className="text-xs" variant={report?.priority === 'high' ? 'destructive' : 'outline'}>
              Priorité {report?.priority}
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Choisissez l'action appropriée pour traiter ce signalement. 
            Toutes les sanctions sont enregistrées dans l'historique d'audit.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Contenu principal - responsive */}
        <div className="space-y-6">
          
          {/* Étape 1 : Résumé du signalement */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Résumé du signalement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colonne gauche */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-blue-800">Cible signalée</Label>
                    <div className="mt-1 p-3 bg-white rounded-md border border-blue-200">
                      <p className="font-semibold text-gray-900">
                        {report?.listing_title || report?.reported_user_name || 'Cible inconnue'}
                      </p>
                      {report?.listing_price && (
                        <p className="text-sm text-green-600 mt-1">
                          Prix: {report?.listing_price.toLocaleString()} CFA
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-blue-800">Motif du signalement</Label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800 font-medium text-sm">{report?.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-blue-800">Signalé par</Label>
                    <div className="mt-1 p-3 bg-white rounded-md border border-blue-200">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{report?.reporter_name || 'Anonyme'}</p>
                        <Badge variant="outline" className="text-xs">
                          {report?.reporter_type === 'guest' ? 'Invité' : 'Inscrit'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-blue-800">Informations temporelles</Label>
                    <div className="mt-1 p-3 bg-white rounded-md border border-blue-200 space-y-1">
                      <p className="text-sm">
                        <strong>Signalé le:</strong> {new Date(report?.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm">
                        <strong>Temps écoulé:</strong> {Math.round((report?.response_time_hours || 0))}h
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {report?.description && (
                <div className="mt-4">
                  <Label className="text-sm font-semibold text-blue-800">Description détaillée</Label>
                  <div className="mt-1 p-3 bg-white rounded-md border border-blue-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {report?.description}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Étape 2 : Sélection de l'action */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold">Choisir une action</h3>
            </div>
            
            {/* Grid d'actions - responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {availableActions.map((action) => {
                const Icon = action.icon;
                const isSelected = selectedAction === action.id;
                
                return (
                  <Card 
                    key={action.id}
                    className={`cursor-pointer transition-all duration-200 border-2 ${
                      isSelected 
                        ? `border-blue-500 ${getSeverityColor(action.severity)}`
                        : `border-gray-200 hover:border-gray-300 hover:${getSeverityColor(action.severity)}`
                    }`}
                    onClick={() => setSelectedAction(action.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Icône de l'action */}
                        <div className={`p-2 rounded-lg ${getActionColor(action.color)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        {/* Contenu de l'action */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 leading-tight">
                              {action.label}
                            </h4>
                            <div className="flex items-center space-x-2 ml-2">
                              {action.requiresDuration && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Durée
                                </Badge>
                              )}
                              <Badge 
                                className={`text-xs ${getSeverityColor(action.severity)} ${getSeverityTextColor(action.severity)}`}
                                variant="outline"
                              >
                                {action.severity === 'critical' ? 'Critique' : 
                                 action.severity === 'high' ? 'Élevé' :
                                 action.severity === 'medium' ? 'Modéré' : 'Faible'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                        </div>
                        
                        {/* Indicateur de sélection */}
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
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

          {/* Étape 3 : Configuration de l'action sélectionnée */}
          {selectedAction && (
            <Card className={`border-2 ${getSeverityColor(selectedActionConfig?.severity || 'low')}`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center space-x-2">
                  {selectedActionConfig && <selectedActionConfig.icon className="h-5 w-5" />}
                  <span>Configuration de l'action</span>
                  <Badge className={`${getSeverityColor(selectedActionConfig?.severity || 'low')} ${getSeverityTextColor(selectedActionConfig?.severity || 'low')}`}>
                    {selectedActionConfig?.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                
                {/* Configuration de la durée */}
                {needsDuration && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <Label className="text-base font-semibold">Durée de la sanction</Label>
                    </div>
                    
                    {/* Grid pour les options de durée - responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getDurationOptions().map((option) => (
                        <Card 
                          key={option.value}
                          className={`cursor-pointer transition-all border ${
                            duration === option.value 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setDuration(option.value)}
                        >
                          <CardContent className="p-3 text-center">
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Durée personnalisée */}
                    {duration === 'custom' && (
                      <div className="mt-4">
                        <Label htmlFor="custom-duration" className="text-sm font-medium">
                          Nombre de jours (1-{selectedActionConfig?.allowPermanent ? "9999" : "90"})
                        </Label>
                        <Input
                          id="custom-duration"
                          type="number"
                          min="1"
                          max={selectedActionConfig?.allowPermanent ? "9999" : "90"}
                          value={customDuration}
                          onChange={(e) => setCustomDuration(e.target.value)}
                          placeholder="Ex: 15"
                          className="mt-2 max-w-xs"
                        />
                      </div>
                    )}

                    {/* Avertissement pour bannissement permanent */}
                    {isPermanentAction && (
                      <div className="p-4 border-2 border-red-300 bg-red-50 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Ban className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-red-900 text-base">
                              ⚠️ Bannissement permanent sélectionné
                            </h4>
                            <div className="text-sm text-red-800 mt-2 space-y-1">
                              <p>• Cette action interdira <strong>définitivement</strong> l'accès à la plateforme</p>
                              <p>• L'utilisateur ne pourra plus se connecter ni créer de nouveau compte</p>
                              <p>• Cette décision ne peut être révoquée que manuellement par un super-administrateur</p>
                              <p>• Assurez-vous que cette sanction est justifiée et proportionnelle</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sélection du motif */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <Label className="text-base font-semibold">Motif de l'action *</Label>
                  </div>
                  
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un motif prédéfini" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {getPredefinedReasons(selectedAction).map((reasonOption) => (
                        <SelectItem key={reasonOption} value={reasonOption}>
                          {reasonOption}
                        </SelectItem>
                      ))}
                      <Separator className="my-2" />
                      <SelectItem value="custom">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>Motif personnalisé...</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Motif personnalisé */}
                  {reason === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-reason">Motif personnalisé *</Label>
                      <Textarea
                        id="custom-reason"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Décrivez le motif de cette action..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Notes administratives */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-base font-semibold flex items-center space-x-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span>Notes internes (optionnel)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajoutez des notes internes pour l'équipe d'administration..."
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-600">
                    Ces notes ne seront visibles que par l'équipe d'administration
                  </p>
                </div>

                {/* Options de notification */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Options de notification</Label>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notify-user"
                      checked={notifyUser}
                      onCheckedChange={(checked) => setNotifyUser(!!checked)}
                    />
                    <Label htmlFor="notify-user" className="text-sm cursor-pointer">
                      Notifier l'utilisateur par email de cette action
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600 ml-6">
                    L'utilisateur recevra un email expliquant la sanction appliquée
                  </p>
                </div>

                {/* Avertissement pour actions destructives */}
                {isDestructiveAction && (
                  <div className="p-4 border-2 border-orange-300 bg-orange-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-orange-900 text-base mb-2">
                          ⚠️ Action à impact majeur
                        </h4>
                        <div className="text-sm text-orange-800 space-y-1">
                          <p>• Cette action aura un <strong>impact significatif</strong> sur l'utilisateur</p>
                          <p>• Vérifiez que la sanction est <strong>proportionnelle</strong> à la violation</p>
                          <p>• Un processus d'appel sera disponible pour l'utilisateur</p>
                          <p>• Cette action sera enregistrée dans l'historique permanent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aperçu de l'action */}
                {selectedAction && reason && (
                  <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Eye className="h-5 w-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">Aperçu de l'action</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p><strong>Action :</strong> {selectedActionConfig?.label}</p>
                      <p><strong>Motif :</strong> {reason === 'custom' ? customReason : reason}</p>
                      {needsDuration && (
                        <p><strong>Durée :</strong> {
                          duration === 'custom' 
                            ? `${customDuration} jour(s)` 
                            : duration === '365' 
                              ? 'Permanent' 
                              : getDurationOptions().find(opt => opt.value === duration)?.label
                        }</p>
                      )}
                      {notes && <p><strong>Notes :</strong> {notes}</p>}
                      <p><strong>Notification :</strong> {notifyUser ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer avec actions */}
        <AlertDialogFooter className="flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6">
          <AlertDialogCancel onClick={handleClose} disabled={isProcessing} className="w-full sm:w-auto">
            Annuler
          </AlertDialogCancel>
          
          <Button 
            onClick={handleSubmit}
            disabled={!selectedAction || !reason || isProcessing}
            className={`w-full sm:w-auto min-w-[200px] ${
              isCriticalAction || isDestructiveAction 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Traitement en cours...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {selectedActionConfig && <selectedActionConfig.icon className="h-4 w-4" />}
                <span>
                  {isCriticalAction ? 'Confirmer et appliquer' : 'Appliquer l\'action'}
                </span>
              </div>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReportActionModal;