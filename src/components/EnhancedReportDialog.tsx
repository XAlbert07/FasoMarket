// EnhancedReportDialog.tsx

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useReports } from '@/hooks/useReports';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Flag, AlertTriangle, User, Package, Shield, Info, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Interface pour les props du composant
interface EnhancedReportDialogProps {
  listingId?: string;
  listingTitle?: string;
  profileId?: string;
  profileName?: string;
  trigger?: React.ReactNode;
  className?: string;
}

// Configuration des motifs de signalement pour les annonces
const listingReasons = [
  { 
    value: 'fake', 
    label: 'Annonce frauduleuse', 
    icon: AlertTriangle, 
    description: 'Article inexistant, photos trompeuses, informations mensongères',
    severity: 'high'
  },
  { 
    value: 'inappropriate', 
    label: 'Contenu inapproprié', 
    icon: Flag, 
    description: 'Images ou texte choquant, contenu hors catégorie',
    severity: 'medium'
  },
  { 
    value: 'spam', 
    label: 'Spam ou publicité', 
    icon: Package, 
    description: 'Publicité déguisée, annonce répétitive ou commerciale',
    severity: 'low'
  },
  { 
    value: 'duplicate', 
    label: 'Annonce en double', 
    icon: Package, 
    description: 'Même article publié plusieurs fois par le même vendeur',
    severity: 'low'
  },
  { 
    value: 'sold', 
    label: 'Article déjà vendu', 
    icon: Package, 
    description: 'Annonce non mise à jour après la vente',
    severity: 'low'
  },
  { 
    value: 'price_manipulation', 
    label: 'Prix suspect', 
    icon: AlertTriangle, 
    description: 'Prix anormalement bas ou élevé, possible tentative d\'arnaque',
    severity: 'medium'
  },
  { 
    value: 'other', 
    label: 'Autre raison', 
    icon: Flag, 
    description: 'Autre problème non mentionné ci-dessus',
    severity: 'medium'
  }
];

// Configuration des motifs de signalement pour les profils utilisateurs
const profileReasons = [
  { 
    value: 'fake_profile', 
    label: 'Profil frauduleux', 
    icon: User, 
    description: 'Faux profil, informations d\'identité mensongères',
    severity: 'high'
  },
  { 
    value: 'harassment', 
    label: 'Harcèlement', 
    icon: AlertTriangle, 
    description: 'Messages insistants, comportement déplacé ou menaçant',
    severity: 'high'
  },
  { 
    value: 'scam', 
    label: 'Activité frauduleuse', 
    icon: Shield, 
    description: 'Tentatives d\'escroquerie, demandes d\'argent suspectes',
    severity: 'high'
  },
  { 
    value: 'inappropriate_content', 
    label: 'Contenu inapproprié', 
    icon: Flag, 
    description: 'Photos de profil ou bio inappropriées',
    severity: 'medium'
  },
  { 
    value: 'impersonation', 
    label: 'Usurpation d\'identité', 
    icon: User, 
    description: 'Se fait passer pour une autre personne ou entité',
    severity: 'high'
  },
  { 
    value: 'spam_profile', 
    label: 'Compte spam', 
    icon: Package, 
    description: 'Création d\'annonces en masse, comportement automatisé suspect',
    severity: 'medium'
  },
  { 
    value: 'other', 
    label: 'Autre raison', 
    icon: Flag, 
    description: 'Autre comportement problématique non listé',
    severity: 'medium'
  }
];

export const EnhancedReportDialog = ({ 
  listingId, 
  listingTitle,
  profileId, 
  profileName,
  trigger,
  className
}: EnhancedReportDialogProps) => {
  // États pour l'interface utilisateur
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  // Hooks
  const { user } = useAuthContext();
  const { submitReport, isSubmitting, validateGuestInfo } = useReports();
  
  // Détermination du type de signalement
  const isProfileReport = Boolean(profileId);
  const isListingReport = Boolean(listingId);
  const reasons = isProfileReport ? profileReasons : listingReasons;
  
  // Validation des props
  if (!isProfileReport && !isListingReport) {
    console.warn('EnhancedReportDialog: Vous devez spécifier soit listingId soit profileId');
    return null;
  }

  // Réinitialisation du formulaire
  const resetForm = () => {
    setReason('');
    setDescription('');
    setGuestInfo({ name: '', email: '', phone: '' });
  };

  // Gestion de la soumission
  const handleSubmit = async () => {
    const success = await submitReport({
      listingId,
      listingTitle,
      profileId,
      profileName,
      reason,
      description,
      guestInfo: !user ? guestInfo : undefined
    }, user?.id);

    if (success) {
      setOpen(false);
      resetForm();
    }
  };

  // Variables dérivées pour l'interface
  const selectedReason = reasons.find(r => r.value === reason);
  const isGuestFormValid = !user ? validateGuestInfo(guestInfo) : true;
  const canSubmit = reason && isGuestFormValid && !isSubmitting;

  // Gestion de la fermeture du dialogue
  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={className}>
            <Flag className="h-4 w-4 mr-2" />
            Signaler
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isProfileReport ? (
              <User className="h-5 w-5 text-red-500" />
            ) : (
              <Package className="h-5 w-5 text-red-500" />
            )}
            Signaler {isProfileReport ? 'ce profil' : 'cette annonce'}
          </DialogTitle>
        </DialogHeader>

        {/* Bannière d'information */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {isProfileReport 
                  ? `Signalement du profil : ${profileName || 'Vendeur'}`
                  : `Signalement de l'annonce : ${listingTitle || 'Annonce'}`
                }
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Votre signalement sera examiné par notre équipe de modération dans les plus brefs délais. 
                {!user && ' En tant qu\'invité, vos coordonnées nous permettront de vous tenir informé si nécessaire.'}
                {user && ' Nous vous tiendrons informé via votre compte si des actions sont requises.'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          
          {/* Section des motifs */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              Motif du signalement *
              <Badge variant="secondary" className="text-xs">Obligatoire</Badge>
            </Label>
            <RadioGroup 
              value={reason} 
              onValueChange={setReason} 
              className="space-y-3"
            >
              {reasons.map((r) => {
                const IconComponent = r.icon;
                const isSelected = reason === r.value;
                
                return (
                  <div 
                    key={r.value} 
                    className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-muted/50 ${
                      isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                    }`}
                    onClick={() => setReason(r.value)}
                  >
                    <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <Label htmlFor={r.value} className={`font-medium cursor-pointer ${isSelected ? 'text-primary' : ''}`}>
                          {r.label}
                        </Label>
                        {r.severity === 'high' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Aperçu de la sélection */}
          {selectedReason && (
            <Alert className={`border-l-4 ${
              selectedReason.severity === 'high' ? 'border-l-red-500 bg-red-50/30' : 
              selectedReason.severity === 'medium' ? 'border-l-orange-500 bg-orange-50/30' : 
              'border-l-blue-500 bg-blue-50/30'
            }`}>
              <selectedReason.icon className={`h-4 w-4 ${
                selectedReason.severity === 'high' ? 'text-red-500' : 
                selectedReason.severity === 'medium' ? 'text-orange-500' : 
                'text-blue-500'
              }`} />
              <AlertDescription className="text-sm">
                <strong>Motif sélectionné :</strong> {selectedReason.label}
                <br />
                <span className="text-xs text-muted-foreground">{selectedReason.description}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Section de description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium flex items-center justify-between">
              <span>Description détaillée {reason === 'other' && <Badge variant="destructive" className="text-xs ml-2">Obligatoire</Badge>}</span>
              <span className="text-xs text-muted-foreground font-normal">
                Optionnelle mais recommandée
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder={`Décrivez précisément le problème${reason === 'other' ? ' que vous avez rencontré' : ' (cela aidera notre équipe à traiter votre signalement plus efficacement)'}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Une description détaillée accélère le traitement de votre signalement</span>
              <span className={description.length > 800 ? 'text-orange-600' : ''}>{description.length}/1000 caractères</span>
            </div>
          </div>

          {/* Formulaire pour les invités */}
          {!user && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <Label className="text-base font-semibold">Vos coordonnées</Label>
                  <Badge variant="outline" className="text-xs">Pour le suivi</Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest-name" className="text-sm font-medium flex items-center gap-1">
                      Nom complet *
                      {guestInfo.name.trim() && <div className="h-2 w-2 bg-green-500 rounded-full" />}
                    </Label>
                    <Input
                      id="guest-name"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Votre nom complet"
                      className={guestInfo.name.trim() ? 'border-green-300 focus:border-green-500' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guest-phone" className="text-sm font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Téléphone
                      {guestInfo.phone.trim() && <div className="h-2 w-2 bg-green-500 rounded-full" />}
                    </Label>
                    <Input
                      id="guest-phone"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+226 XX XX XX XX"
                      className={guestInfo.phone.trim() ? 'border-green-300 focus:border-green-500' : ''}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="guest-email" className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Adresse email *
                    {guestInfo.email.trim() && guestInfo.email.includes('@') && <div className="h-2 w-2 bg-green-500 rounded-full" />}
                  </Label>
                  <Input
                    id="guest-email"
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="votre@email.com"
                    className={guestInfo.email.trim() && guestInfo.email.includes('@') ? 'border-green-300 focus:border-green-500' : ''}
                  />
                </div>
                
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Confidentialité assurée :</strong> Vos coordonnées ne seront utilisées que pour le suivi de ce signalement 
                    et ne seront jamais partagées avec des tiers ou utilisées à des fins commerciales.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-red-600 hover:bg-red-700 min-w-[120px] order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  Envoyer le signalement
                </>
              )}
            </Button>
          </div>
          
          {/* Indication de validation */}
          {!canSubmit && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {!reason && "Sélectionnez un motif pour continuer"}
                {reason && !isGuestFormValid && "Remplissez vos coordonnées pour continuer"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};