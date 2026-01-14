import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      
      // Construction automatique de l'URL de redirection basée sur l'environnement actuel
      // Ceci détecte automatiquement le port utilisé (8080, 5173, etc.)
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/reset-password`;
      
      
      // Utilisation de la vraie API Supabase pour envoyer l'email de réinitialisation
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          // URL de redirection après clic sur le lien dans l'email
          // Cette URL doit être configurée dans les "Redirect URLs" de votre projet Supabase
          // L'auto-détection garantit que nous utilisons le bon port
          redirectTo: redirectUrl,
        }
      );

      // Vérification des erreurs Supabase
      if (resetError) {
        console.error("❌ Erreur Supabase:", resetError);
        
        // Gestion des différents types d'erreurs
        if (resetError.message.includes("Email not confirmed")) {
          setError("Votre email n'a pas été confirmé. Vérifiez votre boîte mail pour le lien de confirmation.");
        } else if (resetError.message.includes("Invalid email")) {
          setError("Cette adresse email n'est pas valide.");
        } else if (resetError.message.includes("not found") || resetError.message.includes("user_not_found")) {
          // Pour des raisons de sécurité, nous n'indiquons pas que l'email n'existe pas
          // Nous affichons le succès même si l'utilisateur n'existe pas
          console.warn("⚠️ Utilisateur non trouvé, mais nous affichons le succès pour des raisons de sécurité");
          setSuccess(true);
        } else if (resetError.message.includes("Email rate limit exceeded")) {
          setError("Trop de tentatives de réinitialisation. Veuillez patienter quelques minutes avant de réessayer.");
        } else {
          setError(`Erreur lors de l'envoi : ${resetError.message}`);
        }
        return;
      }

      
      setSuccess(true);
      
    } catch (err: any) {
      console.error("❌ Exception lors de l'envoi de l'email:", err);
      setError("Une erreur technique est survenue. Veuillez réessayer dans quelques instants.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour renvoyer l'email
  const handleResendEmail = async () => {
    if (!email) {
      setError("Veuillez saisir une adresse email");
      return;
    }
    
    setSuccess(false);
    await handleSubmit(new Event('submit') as any);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        {/* Zone de contenu principal optimisée mobile */}
        <main className="flex-1 px-4 py-6 sm:py-8">
          {/* Navigation de retour repositionnée et plus visible sur mobile */}
          <div className="max-w-sm mx-auto mb-6">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium p-2 -ml-2 rounded-lg hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>

          <div className="max-w-sm mx-auto">
            <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="text-center p-6 sm:p-8">
                {/* Icône de succès avec meilleure hiérarchie visuelle mobile */}
                <div className="bg-green-500/10 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                
                <h1 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">
                  Email envoyé !
                </h1>
                
                {/* Texte principal avec espacement mobile optimisé */}
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                  Si l'adresse <span className="font-semibold text-foreground">{email}</span> correspond à un compte FasoMarket, 
                  vous recevrez un email avec un lien de réinitialisation dans quelques minutes.
                </p>
                
                {/* Information complémentaire avec design discret */}
                <div className="bg-muted/30 p-3 rounded-lg mb-6">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Info className="h-3 w-3 flex-shrink-0" />
                    Vérifiez également votre dossier spam
                  </p>
                </div>
                
                {/* Boutons avec espacement mobile optimal */}
                <div className="space-y-3">
                  <Button asChild className="w-full h-12 text-base font-medium">
                    <Link to="/login">
                      Retour à la connexion
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base"
                    onClick={handleResendEmail}
                  >
                    Renvoyer l'email
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Conseils intégrés de manière plus compacte */}
            <div className="mt-6 p-4 bg-muted/20 rounded-lg">
              <details className="group">
                <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  Conseils de sécurité
                </summary>
                <ul className="mt-3 text-xs text-muted-foreground space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Le lien de réinitialisation expire après 1 heure
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    N'utilisez ce lien que si vous avez demandé une réinitialisation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Choisissez un mot de passe fort d'au moins 8 caractères
                  </li>
                </ul>
              </details>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Zone de contenu principal avec flex pour mobile */}
      <main className="flex-1 px-4 py-6 sm:py-8">
        {/* Navigation de retour améliorée pour mobile */}
        <div className="max-w-sm mx-auto mb-6">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium p-2 -ml-2 rounded-lg hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>

        <div className="max-w-sm mx-auto">
          <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-4 pt-6 sm:pt-8 px-6">
              {/* Icône principale avec taille adaptée mobile */}
              <div className="bg-primary/10 p-6 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              
              <CardTitle className="text-xl sm:text-2xl font-bold mb-3">
                Mot de passe oublié ?
              </CardTitle>
              
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </CardHeader>
            
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Champ email avec design mobile optimisé */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-12 text-base border-2 focus:border-primary transition-colors"
                  />
                </div>

                {/* Gestion des erreurs avec design mobile-friendly */}
                {error && (
                  <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm leading-relaxed">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Bouton principal avec taille tactile optimale */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Envoi en cours...
                    </div>
                  ) : (
                    "Envoyer le lien de réinitialisation"
                  )}
                </Button>
              </form>

              {/* Lien de retour vers connexion repositionné */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous vous souvenez de votre mot de passe ?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Section conseils repensée pour mobile */}
          <div className="mt-6 p-4 bg-muted/20 rounded-lg">
            <details className="group">
              <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between">
                <span>Conseils de sécurité</span>
                <Info className="h-4 w-4 group-open:rotate-180 transition-transform" />
              </summary>
              <ul className="mt-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Vérifiez votre dossier spam si vous ne recevez pas l'email
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Le lien de réinitialisation expire après 1 heure
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  N'utilisez ce lien que si vous avez demandé une réinitialisation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Utilisez un mot de passe fort avec au moins 8 caractères
                </li>
              </ul>
            </details>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;