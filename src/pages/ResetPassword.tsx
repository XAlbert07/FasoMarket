// ResetPassword.tsx - Version synchronisée pour éviter les problèmes de timing
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle, AlertCircle, Key, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, session } = useAuthContext();
  
  // États pour gérer le processus de réinitialisation
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  
  // États pour les champs du formulaire
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  
  // États pour la validation
  const [validationErrors, setValidationErrors] = useState({
    password: "",
    confirmPassword: ""
  });

  // Vérification intelligente des tokens avec gestion du timing
  useEffect(() => {
    const checkTokenValidity = async () => {
      console.log('🔍 Démarrage de la vérification intelligente des tokens');
      
      // Attendre un petit délai pour laisser Supabase traiter les événements
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Première méthode : vérifier les paramètres URL directement
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const recoveryType = searchParams.get('type');
      
      console.log('🔍 Tokens URL détectés:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type: recoveryType,
        sessionExists: !!session
      });
      
      // Deuxième méthode : vérifier si nous avons déjà une session active de récupération
      if (session && user) {
        console.log('✅ Session de récupération déjà établie par Supabase', {
          userId: user.id,
          email: user.email
        });
        setIsValidToken(true);
        setInitialCheckComplete(true);
        return;
      }
      
      // Troisième méthode : traiter les tokens URL si présents
      if (accessToken && refreshToken) {
        console.log('🔄 Établissement manuel de la session avec tokens URL');
        
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError || !sessionData.session) {
            console.error('❌ Erreur lors de l\'établissement de la session:', sessionError);
            setIsValidToken(false);
            toast({
              title: "Lien expiré",
              description: "Ce lien de réinitialisation a expiré. Demandez un nouveau lien.",
              variant: "destructive"
            });
            setInitialCheckComplete(true);
            return;
          }

          console.log('✅ Session établie avec succès via tokens URL');
          setIsValidToken(true);
          
        } catch (error) {
          console.error('❌ Exception lors du traitement des tokens:', error);
          setIsValidToken(false);
          toast({
            title: "Erreur technique",
            description: "Impossible de traiter le lien. Veuillez réessayer.",
            variant: "destructive"
          });
        }
      } else {
        console.warn('⚠️ Aucun token trouvé dans l\'URL et aucune session active');
        setIsValidToken(false);
        toast({
          title: "Lien invalide",
          description: "Ce lien de réinitialisation est invalide ou malformé.",
          variant: "destructive"
        });
      }
      
      setInitialCheckComplete(true);
    };

    // Lancer la vérification seulement si elle n'a pas encore été faite
    if (!initialCheckComplete) {
      checkTokenValidity();
    }
  }, [searchParams, session, user, initialCheckComplete, toast]);

  // Écouteur pour les changements de session dus aux événements Supabase
  useEffect(() => {
    if (initialCheckComplete && session && user && isValidToken === null) {
      console.log('🔄 Session mise à jour après vérification initiale - validation automatique');
      setIsValidToken(true);
    }
  }, [session, user, isValidToken, initialCheckComplete]);

  // Fonctions de validation du mot de passe (inchangées)
  const validatePassword = (password: string): string => {
    if (!password) {
      return "Le mot de passe est requis";
    }
    if (password.length < 6) {
      return "Le mot de passe doit contenir au moins 6 caractères";
    }
    if (password.length > 128) {
      return "Le mot de passe est trop long (max 128 caractères)";
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    
    if (!hasLetter) {
      return "Le mot de passe doit contenir au moins une lettre";
    }
    
    return "";
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) {
      return "Veuillez confirmer votre mot de passe";
    }
    if (password !== confirmPassword) {
      return "Les mots de passe ne correspondent pas";
    }
    return "";
  };

  // Gestionnaire de soumission avec meilleure gestion d'erreur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors({
      password: "",
      confirmPassword: ""
    });

    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);

    if (passwordError || confirmPasswordError) {
      setValidationErrors({
        password: passwordError,
        confirmPassword: confirmPasswordError
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Mise à jour du mot de passe en cours...');
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) {
        console.error('❌ Erreur Supabase lors de la mise à jour:', updateError);
        throw updateError;
      }

      console.log('✅ Mot de passe mis à jour avec succès');
      
      setIsCompleted(true);
      
      toast({
        title: "Mot de passe modifié !",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });

      // Redirection automatique après 3 secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', error);
      
      let errorMessage = "Une erreur s'est produite lors de la mise à jour.";
      
      if (error.message?.includes('session')) {
        errorMessage = "Votre session a expiré. Demandez un nouveau lien de réinitialisation.";
      } else if (error.message?.includes('weak')) {
        errorMessage = "Le mot de passe choisi n'est pas assez sécurisé.";
      } else if (error.message?.includes('same_password')) {
        errorMessage = "Le nouveau mot de passe doit être différent de l'ancien.";
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Indicateur de force du mot de passe (inchangé)
  const getPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push("Au moins 8 caractères");

    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Une majuscule");

    if (/\d/.test(password)) score += 1;
    else feedback.push("Un chiffre");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push("Un caractère spécial");

    const strength = score <= 1 ? "Faible" : score <= 3 ? "Moyen" : "Fort";
    const color = score <= 1 ? "red" : score <= 3 ? "orange" : "green";

    return { strength, color, score, feedback };
  };

  // Rendu en cas de token invalide
  if (isValidToken === false && initialCheckComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-md">
          <Card className="shadow-lg border-red-200">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-red-600">
                Lien invalide ou expiré
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Ce lien de réinitialisation n'est plus valide ou a expiré.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={() => navigate("/forgot-password")}
              >
                Demander un nouveau lien
              </Button>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  // Rendu en cas de réinitialisation réussie
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-md">
          <Card className="shadow-lg border-green-200">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-green-600">
                Mot de passe modifié !
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Votre mot de passe a été mis à jour avec succès.
                Redirection vers la connexion...
              </p>
            </CardHeader>
            
            <CardContent>
              <Button
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Se connecter maintenant
              </Button>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  // Rendu du loading pendant la vérification des tokens
  if (isValidToken === null || !initialCheckComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {!initialCheckComplete ? "Vérification du lien..." : "Préparation..."}
          </p>
        </div>
      </div>
    );
  }

  // Rendu principal du formulaire de réinitialisation
  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-primary/10 p-3">
                <Key className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-heading text-primary">
              Nouveau mot de passe
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Créez un mot de passe sécurisé pour votre compte FasoMarket.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre nouveau mot de passe"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, password: e.target.value }));
                      if (validationErrors.password) {
                        setValidationErrors(prev => ({ ...prev, password: "" }));
                      }
                    }}
                    className={validationErrors.password ? "border-red-500 pr-10" : "pr-10"}
                    autoFocus
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded">
                        <div 
                          className={`h-full rounded transition-all duration-300 bg-${passwordStrength.color}-500`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                        {passwordStrength.strength}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-xs text-gray-600">
                        Manque: {passwordStrength.feedback.join(", ")}
                      </p>
                    )}
                  </div>
                )}
                
                {validationErrors.password && (
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-500">{validationErrors.password}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmez votre nouveau mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                      if (validationErrors.confirmPassword) {
                        setValidationErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    className={validationErrors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {validationErrors.confirmPassword && (
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !formData.password || !formData.confirmPassword}
              >
                {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Conseils pour un mot de passe sécurisé :</p>
                    <p>• Au moins 8 caractères avec lettres, chiffres et symboles</p>
                    <p>• Évitez les mots courants et informations personnelles</p>
                    <p>• Utilisez un mot de passe unique pour chaque site</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;