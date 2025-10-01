// Login.tsx 
import { useState } from "react";
import { useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Store, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";


const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useAuth();
  
  // États de logique métier conservés 
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: ""
  });
  const [validationErrors, setValidationErrors] = useState({
    login: { email: "", password: "" },
    register: { name: "", email: "", phone: "", password: "", confirmPassword: "" }
  });

  // État UX minimal et fonctionnel
  const [isRegistering, setIsRegistering] = useState(false);


  // Vérifier si on attend une confirmation email

const { toast } = useToast();

useEffect(() => {
  const pendingVerification = sessionStorage.getItem('signup_pending_verification')
  
  if (pendingVerification) {
    try {
      const data = JSON.parse(pendingVerification)
      const timeSinceSignup = Date.now() - data.timestamp
      
      // Afficher le message seulement pendant 5 minutes
      if (timeSinceSignup < 5 * 60 * 1000) {
        toast({
          title: "En attente de vérification",
          description: `Un email a été envoyé à ${data.email}. Cliquez sur le lien pour activer votre compte.`,
          duration: 8000
        })
      } else {
        // Nettoyer si trop ancien
        sessionStorage.removeItem('signup_pending_verification')
      }
    } catch (e) {
      console.error('Erreur parsing signup data:', e)
    }
  }
}, [toast])

  // Fonctions de validation conservées identiques
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidBurkinaPhone = (phone: string): boolean => {
  if (!phone) return true;
  
  // Retire tous les espaces, tirets et points
  const cleanPhone = phone.replace(/[\s\-\.]/g, '');
  
  // Accepte :
  // - Format international : +226 suivi de 8 chiffres (n'importe lesquels)
  // - Format local : 0 suivi de 8 chiffres
  const phoneRegex = /^(\+226\d{8}|0\d{8})$/;
  
  return phoneRegex.test(cleanPhone);
};

  const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Logique métier 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors(prev => ({ ...prev, login: { email: "", password: "" } }));

    let hasErrors = false;
    const errors = { email: "", password: "" };

    if (!loginData.email) {
      errors.email = "L'email est requis";
      hasErrors = true;
    } else if (!isValidEmail(loginData.email)) {
      errors.email = "Format d'email invalide";
      hasErrors = true;
    }

    if (!loginData.password) {
      errors.password = "Le mot de passe est requis";
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationErrors(prev => ({ ...prev, login: errors }));
      return;
    }

    try {
      console.log('Tentative de connexion pour:', loginData.email);
      await signIn(loginData.email, loginData.password);
      navigate("/");
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors(prev => ({
      ...prev,
      register: { name: "", email: "", phone: "", password: "", confirmPassword: "" }
    }));

    let hasErrors = false;
    const errors = { name: "", email: "", phone: "", password: "", confirmPassword: "" };

    if (!registerData.name.trim()) {
      errors.name = "Le nom complet est requis";
      hasErrors = true;
    } else if (registerData.name.trim().length < 2) {
      errors.name = "Le nom doit contenir au moins 2 caractères";
      hasErrors = true;
    }

    if (!registerData.email) {
      errors.email = "L'email est requis";
      hasErrors = true;
    } else if (!isValidEmail(registerData.email)) {
      errors.email = "Format d'email invalide";
      hasErrors = true;
    }

    if (registerData.phone && !isValidBurkinaPhone(registerData.phone)) {
      errors.phone = "Format de téléphone invalide. Exemple: +226 70 12 34 56";
      hasErrors = true;
    }

    if (!registerData.password) {
      errors.password = "Le mot de passe est requis";
      hasErrors = true;
    } else if (!isValidPassword(registerData.password)) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
      hasErrors = true;
    }

    if (!registerData.confirmPassword) {
      errors.confirmPassword = "La confirmation du mot de passe est requise";
      hasErrors = true;
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationErrors(prev => ({ ...prev, register: errors }));
      return;
    }

    try {
      console.log('Création d\'un nouveau compte marchand pour:', registerData.email);
      await signUp(
        registerData.email, 
        registerData.password, 
        registerData.name.trim(), 
        registerData.phone.trim() || undefined
      );
      console.log('Processus de création de compte marchand initié avec succès');
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto md:max-w-6xl">
          
          {/* DESKTOP: Layout en grille avec section informative */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-12 md:items-start">
            
            {/* Section informative desktop */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Store className="h-10 w-10 text-primary" />
                  <ShoppingBag className="h-8 w-8 text-primary/70" />
                </div>
                
                <h1 className="text-4xl font-bold text-foreground">
                  Bienvenue sur <span className="text-primary">FasoMarket</span>
                </h1>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  La marketplace burkinabè qui connecte acheteurs et vendeurs. 
                  Une plateforme locale, sécurisée et adaptée à nos besoins.
                </p>
              </div>

              <div className="space-y-6 p-6 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-lg">Pourquoi FasoMarket ?</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Transactions sécurisées entre Burkinabè</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Support client en français</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Adapté au marché local</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Commission réduite pour les marchands</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                <p className="font-medium text-primary mb-1">Plateforme 100% burkinabè</p>
                <p className="text-sm text-muted-foreground">
                  Développé pour et par des Burkinabè, pour soutenir notre économie locale.
                </p>
              </div>
            </div>

            {/* Formulaire desktop */}
            <div>
              <Card className="shadow-lg">
                <CardHeader className="text-center space-y-2">
                  <CardTitle className="text-2xl text-primary">
                    {isRegistering ? "Créer un compte" : "Connexion"}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {isRegistering 
                      ? "Rejoignez la communauté des marchands burkinabè" 
                      : "Connectez-vous à votre compte marchand"
                    }
                  </p>
                </CardHeader>
                
                <CardContent>
                  {/* Commutateur connexion/inscription */}
                  <div className="flex rounded-lg bg-muted p-1 mb-6">
                    <button
                      onClick={() => setIsRegistering(false)}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        !isRegistering
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Connexion
                    </button>
                    <button
                      onClick={() => setIsRegistering(true)}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        isRegistering
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Inscription
                    </button>
                  </div>

                  {/* Formulaire de connexion */}
                  {!isRegistering ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="login-email">Adresse email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                          className={validationErrors.login.email ? "border-red-500" : ""}
                          required
                        />
                        {validationErrors.login.email && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.login.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="login-password">Mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Votre mot de passe"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            className={validationErrors.login.password ? "border-red-500" : ""}
                            required
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
                        {validationErrors.login.password && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.login.password}</p>
                        )}
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Connexion..." : "Se connecter"}
                      </Button>
                      
                      <div className="text-center">
                        <Button variant="link" className="text-sm" type="button">
                          <Link to="/forgot-password">Mot de passe oublié ?</Link>
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Formulaire d'inscription */
                    <div>
                      <div className="bg-primary/5 p-3 rounded-md mb-6">
                        <p className="text-sm text-primary font-medium">
                          Votre compte marchand vous permet de publier gratuitement sur FasoMarket
                        </p>
                      </div>
                      
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                          <Label htmlFor="register-name">Nom complet</Label>
                          <Input
                            id="register-name"
                            placeholder="Votre nom et prénom"
                            value={registerData.name}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                            className={validationErrors.register.name ? "border-red-500" : ""}
                            required
                          />
                          {validationErrors.register.name && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.register.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="register-email">Adresse email</Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="votre@email.com"
                            value={registerData.email}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                            className={validationErrors.register.email ? "border-red-500" : ""}
                            required
                          />
                          {validationErrors.register.email && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.register.email}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="register-phone">Téléphone (optionnel)</Label>
                          <Input
                            id="register-phone"
                            type="tel"
                            placeholder="+226 70 12 34 56"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                            className={validationErrors.register.phone ? "border-red-500" : ""}
                          />
                          {validationErrors.register.phone && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.register.phone}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Facilite le contact avec vos acheteurs
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="register-password">Mot de passe</Label>
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="Minimum 6 caractères"
                            value={registerData.password}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                            className={validationErrors.register.password ? "border-red-500" : ""}
                            required
                          />
                          {validationErrors.register.password && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.register.password}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="register-confirm">Confirmer le mot de passe</Label>
                          <Input
                            id="register-confirm"
                            type="password"
                            placeholder="Répétez votre mot de passe"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={validationErrors.register.confirmPassword ? "border-red-500" : ""}
                            required
                          />
                          {validationErrors.register.confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.register.confirmPassword}</p>
                          )}
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Création du compte..." : "Créer mon compte"}
                        </Button>
                      </form>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <Separator className="mb-4" />
                    <p className="text-xs text-muted-foreground text-center">
                      En vous connectant, vous acceptez nos{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Conditions d'utilisation
                      </Link>{" "}
                      et notre{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Politique de confidentialité
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* MOBILE: Interface simplifiée et professionnelle */}
          <div className="md:hidden">
            <Card className="shadow-sm">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center items-center space-x-2 mb-3">
                  <Store className="h-8 w-8 text-primary" />
                  <ShoppingBag className="h-6 w-6 text-primary/70" />
                </div>
                <CardTitle className="text-xl text-primary">FasoMarket</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isRegistering 
                    ? "Créez votre compte marchand" 
                    : "Connectez-vous à votre compte"
                  }
                </p>
              </CardHeader>
              
              <CardContent>
                {/* Commutateur mobile */}
                <div className="flex rounded-lg bg-muted p-1 mb-6">
                  <button
                    onClick={() => setIsRegistering(false)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      !isRegistering
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => setIsRegistering(true)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      isRegistering
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Inscription
                  </button>
                </div>

                {/* Formulaires mobiles */}
                {!isRegistering ? (
                  /* Connexion mobile */
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <Label htmlFor="mobile-login-email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="mobile-login-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        className={`mt-1 h-12 ${validationErrors.login.email ? "border-red-500" : ""}`}
                        required
                      />
                      {validationErrors.login.email && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.login.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="mobile-login-password" className="text-sm font-medium">
                        Mot de passe
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="mobile-login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Votre mot de passe"
                          value={loginData.password}
                          onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                          className={`h-12 pr-12 ${validationErrors.login.password ? "border-red-500" : ""}`}
                          required
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
                      {validationErrors.login.password && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.login.password}</p>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                      {loading ? "Connexion..." : "Se connecter"}
                    </Button>
                    
                    <div className="text-center">
                      <Button variant="link" className="text-sm" type="button">
                        <Link to="/forgot-password">Mot de passe oublié ?</Link>
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Inscription mobile */
                  <div>
                    <div className="bg-primary/5 p-3 rounded-md mb-6">
                      <p className="text-sm text-primary">
                        Votre compte vous permet d'acheter et de vendre sur la plateforme
                      </p>
                    </div>
                    
                    <form onSubmit={handleRegister} className="space-y-5">
                      <div>
                        <Label htmlFor="mobile-register-name" className="text-sm font-medium">
                          Nom complet
                        </Label>
                        <Input
                          id="mobile-register-name"
                          placeholder="Votre nom et prénom"
                          value={registerData.name}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                          className={`mt-1 h-12 ${validationErrors.register.name ? "border-red-500" : ""}`}
                          required
                        />
                        {validationErrors.register.name && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.register.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="mobile-register-email" className="text-sm font-medium">
                          Email
                        </Label>
                        <Input
                          id="mobile-register-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={registerData.email}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                          className={`mt-1 h-12 ${validationErrors.register.email ? "border-red-500" : ""}`}
                          required
                        />
                        {validationErrors.register.email && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.register.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="mobile-register-phone" className="text-sm font-medium">
                          Téléphone (optionnel)
                        </Label>
                        <Input
                          id="mobile-register-phone"
                          type="tel"
                          placeholder="+226 70 12 34 56"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                          className={`mt-1 h-12 ${validationErrors.register.phone ? "border-red-500" : ""}`}
                        />
                        {validationErrors.register.phone && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.register.phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="mobile-register-password" className="text-sm font-medium">
                          Mot de passe
                        </Label>
                        <Input
                          id="mobile-register-password"
                          type="password"
                          placeholder="Minimum 6 caractères"
                          value={registerData.password}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                          className={`mt-1 h-12 ${validationErrors.register.password ? "border-red-500" : ""}`}
                          required
                        />
                        {validationErrors.register.password && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.register.password}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="mobile-register-confirm" className="text-sm font-medium">
                          Confirmer le mot de passe
                        </Label>
                        <Input
                          id="mobile-register-confirm"
                          type="password"
                          placeholder="Répétez votre mot de passe"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={`mt-1 h-12 ${validationErrors.register.confirmPassword ? "border-red-500" : ""}`}
                          required
                        />
                        {validationErrors.register.confirmPassword && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.register.confirmPassword}</p>
                        )}
                      </div>
                      
                      <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                        {loading ? "Création..." : "Créer mon compte"}
                      </Button>
                    </form>
                  </div>
                )}
                
                <div className="mt-6">
                  <Separator className="mb-4" />
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    En continuant, vous acceptez nos{" "}
                    <Link to="/terms-of-service" className="text-primary">
                      conditions d'utilisation
                    </Link>{" "}
                    et notre{" "}
                    <Link to="/privacy-policy" className="text-primary">
                      politique de confidentialité
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;