import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";


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
      // Simulation d'envoi d'email de réinitialisation
      // Dans une vraie app, ceci ferait appel à Supabase auth.resetPasswordForEmail()
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
              <Card>
                <CardContent className="text-center p-8">
                  <div className="bg-green-500/10 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Email envoyé !</h2>
                  <p className="text-muted-foreground mb-6">
                    Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>. 
                    Vérifiez votre boîte mail et suivez les instructions.
                  </p>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link to="/login">
                        Retour à la connexion
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSuccess(false);
                        setEmail("");
                      }}
                    >
                      Renvoyer l'email
                    </Button>
                  </div>
                </CardContent>
              </Card>
          
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
            <div className="mb-6">
              <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
         

         
            <Card>
              <CardHeader className="text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Mot de passe oublié ?</CardTitle>
                <p className="text-muted-foreground">
                  Pas de problème ! Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Envoi en cours...
                      </div>
                    ) : (
                      "Envoyer le lien de réinitialisation"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>Vous vous souvenez de votre mot de passe ?{" "}
                    <Link to="/login" className="text-primary hover:underline">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-sm">Conseils de sécurité :</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Vérifiez votre dossier spam si vous ne recevez pas l'email</li>
                  <li>• Le lien de réinitialisation expire après 24 heures</li>
                  <li>• Utilisez un mot de passe fort avec au moins 8 caractères</li>
                </ul>
              </CardContent>
            </Card>
         
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;