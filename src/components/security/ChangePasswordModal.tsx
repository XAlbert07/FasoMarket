// ChangePasswordModal.tsx - VERSION RÉELLE avec intégration Supabase
// Cette version utilise les vraies méthodes d'authentification du hook useAuth étendu

import { useState } from "react";
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
import { AlertCircle, Eye, EyeOff } from "lucide-react";

// Import du hook d'authentification étendu
import { useAuthContext } from "@/contexts/AuthContext";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordVisibility {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

export const ChangePasswordModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  onError 
}: ChangePasswordModalProps) => {
  
  // Utilisation du hook d'authentification étendu
  const { changePassword } = useAuthContext();
  
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState<PasswordVisibility>({
    current: false,
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  // Validation côté client améliorée
  const validateForm = (): string | null => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      return "Tous les champs sont obligatoires";
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      return "Les nouveaux mots de passe ne correspondent pas";
    }
    
    if (formData.newPassword.length < 6) {
      return "Le nouveau mot de passe doit contenir au moins 6 caractères";
    }

    if (formData.currentPassword === formData.newPassword) {
      return "Le nouveau mot de passe doit être différent de l'ancien";
    }

    // Validation de la complexité du mot de passe
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumbers = /\d/.test(formData.newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return "Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre";
    }

    return null;
  };

  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (localError) {
      setLocalError("");
    }
  };

  const togglePasswordVisibility = (field: keyof PasswordVisibility) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // FONCTION PRINCIPALE - Utilise maintenant la vraie méthode changePassword
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setIsLoading(true);
    setLocalError("");
    
    try {
      // CHANGEMENT PRINCIPAL: Utilisation de la vraie méthode du hook
      // Plus de simulation - appel direct à l'API Supabase via le hook
      await changePassword(formData.currentPassword, formData.newPassword);
      
      // Réinitialiser le formulaire après succès
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Fermer la modal
      onClose();
      
      // Notifier le parent du succès
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      // Gestion d'erreur améliorée
      let errorMessage = "Erreur lors du changement de mot de passe";
      
      if (error instanceof Error) {
        if (error.message.includes("Mot de passe actuel incorrect")) {
          errorMessage = "Le mot de passe actuel est incorrect";
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Le mot de passe ne respecte pas les critères de sécurité";
        } else {
          errorMessage = error.message;
        }
      }
      
      setLocalError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setLocalError("");
    setIsLoading(false);
    onClose();
  };

  const renderPasswordField = (
    field: keyof PasswordFormData,
    visibilityField: keyof PasswordVisibility,
    label: string,
    placeholder: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <div className="relative">
        <Input
          id={field}
          type={showPasswords[visibilityField] ? "text" : "password"}
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => togglePasswordVisibility(visibilityField)}
          disabled={isLoading}
        >
          {showPasswords[visibilityField] ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Saisissez votre mot de passe actuel et choisissez un nouveau mot de passe sécurisé.
            Le nouveau mot de passe doit contenir au moins 6 caractères avec une majuscule, une minuscule et un chiffre.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {localError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}

          {renderPasswordField(
            "currentPassword", 
            "current", 
            "Mot de passe actuel", 
            "Votre mot de passe actuel"
          )}

          {renderPasswordField(
            "newPassword", 
            "new", 
            "Nouveau mot de passe", 
            "Nouveau mot de passe (min. 6 caractères)"
          )}

          {renderPasswordField(
            "confirmPassword", 
            "confirm", 
            "Confirmer le nouveau mot de passe", 
            "Confirmez votre nouveau mot de passe"
          )}

          {/* Indicateur de force du mot de passe */}
          {formData.newPassword && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Force du mot de passe :</div>
              <div className="space-y-1">
                <div className={`text-xs ${formData.newPassword.length >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                  ✓ Au moins 6 caractères
                </div>
                <div className={`text-xs ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                  ✓ Une majuscule
                </div>
                <div className={`text-xs ${/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                  ✓ Une minuscule
                </div>
                <div className={`text-xs ${/\d/.test(formData.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                  ✓ Un chiffre
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Modification...
              </div>
            ) : (
              "Changer le mot de passe"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};