// TwoFactorAuthModal.tsx - VERSION RÉELLE avec intégration Supabase MFA
// Cette version utilise les vraies méthodes MFA du hook useAuth étendu

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { AlertCircle, Copy, Check, Shield, Smartphone } from "lucide-react";

// Import du hook d'authentification étendu
import { useAuthContext } from "@/contexts/AuthContext";

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

enum TwoFAStep {
  STATUS_CHECK = 0, // Nouvelle étape pour vérifier le statut actuel
  SETUP = 1,
  VERIFICATION = 2,
  BACKUP_CODES = 3,
  DISABLE = 4        // Nouvelle étape pour désactiver la 2FA
}

interface MFASetupData {
  qr_code: string;
  secret: string;
  backup_codes: string[];
  factorId: string;
}

export const TwoFactorAuthModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  onError 
}: TwoFactorAuthModalProps) => {
  
  // Utilisation du hook d'authentification étendu
  const { setupMFA, verifyMFA, disableMFA, getMFAStatus, debugMFAState } = useAuthContext();
  
  const [currentStep, setCurrentStep] = useState<TwoFAStep>(TwoFAStep.STATUS_CHECK);
  const [verificationCode, setVerificationCode] = useState("");
  const [mfaSetupData, setMfaSetupData] = useState<MFASetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  // Vérification du statut MFA lors de l'ouverture de la modal
  useEffect(() => {
    if (isOpen) {
      checkMFAStatus();
    }
  }, [isOpen]);

  const checkMFAStatus = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Vérification du statut MFA...');
      
      const status = await getMFAStatus();
      setIsMfaEnabled(status.enabled);
      
      // Déterminer l'étape initiale selon le statut
      if (status.enabled) {
        setCurrentStep(TwoFAStep.DISABLE);
      } else {
        setCurrentStep(TwoFAStep.SETUP);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut MFA:', error);
      setLocalError("Erreur lors de la vérification du statut 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModalState = useCallback(() => {
    setCurrentStep(TwoFAStep.STATUS_CHECK);
    setVerificationCode("");
    setMfaSetupData(null);
    setBackupCodes([]);
    setIsMfaEnabled(false);
    setLocalError("");
    setCopiedCode("");
    setIsLoading(false);
  }, []);

  // NOUVELLE FONCTION - Configuration initiale de la MFA
  const handleSetupMFA = async () => {
    setIsLoading(true);
    setLocalError("");

    try {
      console.log('⚙️ Démarrage de la configuration MFA...');
      
      // Appel à la vraie méthode du hook
      const setupData = await setupMFA();
      
      setMfaSetupData(setupData);
      setCurrentStep(TwoFAStep.VERIFICATION);
      
      console.log('✅ Configuration MFA initialisée avec succès');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la configuration 2FA";
      setLocalError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateVerificationCode = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  // FONCTION MISE À JOUR - Vérification du code TOTP
  // FONCTION MISE À JOUR - Vérification du code TOTP
const handleVerifyCode = async () => {
  if (!validateVerificationCode(verificationCode)) {
    setLocalError("Le code de vérification doit contenir exactement 6 chiffres");
    return;
  }

  setIsLoading(true);
  setLocalError("");
  
  try {
    console.log('Vérification du code TOTP...');
    
    // Appel à la vraie méthode du hook
    const receivedBackupCodes = await verifyMFA(verificationCode);
    
    // Conversion des codes de sauvegarde au format attendu
    setBackupCodes(receivedBackupCodes.map(bc => bc.code));
    setCurrentStep(TwoFAStep.BACKUP_CODES);
    setIsMfaEnabled(true);
    
    console.log('Code TOTP vérifié avec succès');
    
  } catch (error) {
    console.error('Erreur de vérification:', error);
    
    let errorMessage = "Code de vérification incorrect";
    
    if (error instanceof Error) {
      if (error.message.includes("Aucun facteur TOTP")) {
        errorMessage = "Configuration invalide. Veuillez recommencer la procédure.";
        // Retourner à l'étape de setup
        setCurrentStep(TwoFAStep.SETUP);
        setMfaSetupData(null);
      } else if (error.message.includes("invalide ou expiré")) {
        errorMessage = "Code invalide ou expiré. Vérifiez le code dans votre application.";
      } else if (error.message.includes("Trop de tentatives")) {
        errorMessage = "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
      } else {
        errorMessage = error.message;
      }
    }
    
    setLocalError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  // NOUVELLE FONCTION - Désactivation de la 2FA
  const handleDisableMFA = async () => {
    setIsLoading(true);
    setLocalError("");
    
    try {
      console.log('🔓 Désactivation de la 2FA...');
      
      // Appel à la vraie méthode du hook
      await disableMFA();
      
      setIsMfaEnabled(false);
      resetModalState();
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
      
      console.log('✅ 2FA désactivée avec succès');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la désactivation 2FA";
      setLocalError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete2FA = async () => {
    setIsLoading(true);
    
    try {
      // Finalisation - pas d'appel API supplémentaire nécessaire
      // car la vérification du code a déjà activé la 2FA
      console.log('✅ Activation 2FA finalisée');
      
      resetModalState();
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      const errorMessage = "Erreur lors de la finalisation";
      setLocalError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (error) {
      console.error("Impossible de copier le code:", error);
    }
  };

  const handleCopySecret = async () => {
    if (mfaSetupData?.secret) {
      await handleCopyCode(mfaSetupData.secret);
    }
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handleGoBack = () => {
    if (currentStep > TwoFAStep.SETUP) {
      setCurrentStep(currentStep - 1);
      setLocalError("");
    }
  };

  const handleVerificationCodeChange = (value: string) => {
    const filteredValue = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(filteredValue);
    
    if (localError && filteredValue.length > 0) {
      setLocalError("");
    }
  };

  const getModalTitle = (): string => {
    switch (currentStep) {
      case TwoFAStep.STATUS_CHECK:
        return "Authentification à deux facteurs";
      case TwoFAStep.SETUP:
        return "Activer l'authentification à deux facteurs";
      case TwoFAStep.VERIFICATION:
        return "Vérifier votre application";
      case TwoFAStep.BACKUP_CODES:
        return "Codes de sauvegarde";
      case TwoFAStep.DISABLE:
        return "Désactiver la 2FA";
      default:
        return "Authentification à deux facteurs";
    }
  };

  const getModalDescription = (): string => {
    switch (currentStep) {
      case TwoFAStep.STATUS_CHECK:
        return "Chargement du statut de l'authentification à deux facteurs...";
      case TwoFAStep.SETUP:
        return "Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)";
      case TwoFAStep.VERIFICATION:
        return "Entrez le code à 6 chiffres généré par votre application";
      case TwoFAStep.BACKUP_CODES:
        return "Sauvegardez ces codes de récupération dans un endroit sûr";
      case TwoFAStep.DISABLE:
        return "L'authentification à deux facteurs est actuellement activée sur votre compte";
      default:
        return "";
    }
  };

  // Rendu pour l'étape de vérification du statut
  const renderStatusCheckStep = () => (
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Vérification du statut...</p>
    </div>
  );

  // Rendu pour l'étape de configuration avec QR code réel
  const renderSetupStep = () => (
    <div className="text-center space-y-4">
      <div className="bg-white p-4 rounded-lg border mx-auto w-fit">
        {mfaSetupData?.qr_code ? (
          <div className="w-48 h-48">
            <img 
              src={mfaSetupData.qr_code} 
              alt="QR Code 2FA" 
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
            <div className="text-center">
              <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <span className="text-sm text-gray-500">Génération du QR Code...</span>
            </div>
          </div>
        )}
      </div>
      
      {mfaSetupData?.secret && (
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Clé manuelle :</strong>
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {mfaSetupData.secret}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopySecret}
              className="h-6 w-6 p-0"
            >
              {copiedCode === mfaSetupData.secret ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs">
            Si vous ne pouvez pas scanner le QR code, saisissez cette clé manuellement.
          </p>
        </div>
      )}
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verificationCode">Code de vérification</Label>
        <Input
          id="verificationCode"
          type="text"
          value={verificationCode}
          onChange={(e) => handleVerificationCodeChange(e.target.value)}
          placeholder="123456"
          className="text-center text-2xl tracking-widest"
          maxLength={6}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground text-center">
          Entrez le code à 6 chiffres de votre application d'authentification
        </p>
      </div>
    </div>
  );

  const renderBackupCodesStep = () => (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important :</strong> Sauvegardez ces codes dans un endroit sûr. 
          Ils vous permettront d'accéder à votre compte si vous perdez votre téléphone.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-2 gap-2">
        {backupCodes.map((code, index) => (
          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
            <code>{code}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyCode(code)}
              className="h-6 w-6 p-0"
            >
              {copiedCode === code ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Chaque code ne peut être utilisé qu'une seule fois.
      </p>
    </div>
  );

  // NOUVEAU - Rendu pour l'étape de désactivation
  const renderDisableStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-2 p-4 bg-green-50 rounded-lg border border-green-200">
        <Shield className="h-5 w-5 text-green-600" />
        <span className="text-sm font-medium text-green-800">
          L'authentification à deux facteurs est activée
        </span>
      </div>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Attention :</strong> Désactiver la 2FA rendra votre compte moins sécurisé. 
          Assurez-vous de comprendre les risques avant de continuer.
        </AlertDescription>
      </Alert>
      
      <div className="text-sm text-muted-foreground">
        <p>La désactivation de l'authentification à deux facteurs :</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Supprimera tous les facteurs d'authentification configurés</li>
          <li>Invalidera tous les codes de sauvegarde existants</li>
          <li>Réduira la sécurité de votre compte</li>
        </ul>
      </div>
    </div>
  );

  const renderFooterButtons = () => {
    const backButton = (
      <Button
        variant="outline"
        onClick={currentStep === TwoFAStep.SETUP ? handleClose : handleGoBack}
        disabled={isLoading}
      >
        {currentStep === TwoFAStep.SETUP || currentStep === TwoFAStep.DISABLE ? "Annuler" : "Retour"}
      </Button>
    );

    switch (currentStep) {
      case TwoFAStep.STATUS_CHECK:
        return null;
        
      case TwoFAStep.SETUP:
  return (
    <>
      {backButton}
      <Button 
        onClick={mfaSetupData ? () => setCurrentStep(TwoFAStep.VERIFICATION) : handleSetupMFA} 
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Configuration...
          </div>
        ) : mfaSetupData ? (
          "J'ai scanné le QR code"
        ) : (
          "Générer le QR code"
        )}
      </Button>
    </>
  );
      
      case TwoFAStep.VERIFICATION:
        return (
          <>
            {backButton}
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Vérification...
                </div>
              ) : (
                "Vérifier le code"
              )}
            </Button>
          </>
        );
      
      case TwoFAStep.BACKUP_CODES:
        return (
          <>
            {backButton}
            <Button onClick={handleComplete2FA} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Finalisation...
                </div>
              ) : (
                "Terminer l'activation"
              )}
            </Button>
          </>
        );
        
      case TwoFAStep.DISABLE:
        return (
          <>
            {backButton}
            <Button variant="destructive" onClick={handleDisableMFA} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Désactivation...
                </div>
              ) : (
                "Désactiver la 2FA"
              )}
            </Button>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {localError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}

          {currentStep === TwoFAStep.STATUS_CHECK && renderStatusCheckStep()}
          {currentStep === TwoFAStep.SETUP && renderSetupStep()}
          {currentStep === TwoFAStep.VERIFICATION && renderVerificationStep()}
          {currentStep === TwoFAStep.BACKUP_CODES && renderBackupCodesStep()}
          {currentStep === TwoFAStep.DISABLE && renderDisableStep()}
        </div>

        <DialogFooter>
          {renderFooterButtons()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};