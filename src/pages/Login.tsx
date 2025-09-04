// Login.tsx - Version corrigée pour FasoMarket
// Cette version reflète le nouveau modèle où tous les utilisateurs deviennent des marchands

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Store, ShoppingBag } from "lucide-react";
// Correction importante : Utilisation directe du hook useAuth au lieu du contexte
// Cela simplifie l'architecture et évite les problèmes de double wrapping
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  // Utilisation directe du hook useAuth qui contient toute la logique d'authentification
  const { signIn, signUp, loading } = useAuth();
  
  // État pour contrôler la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);
  
  // État pour les données du formulaire de connexion
  const [loginData, setLoginData] = useState({ 
    email: "", 
    password: "" 
  });
  
  // État pour les données du formulaire d'inscription
  // Plus besoin de gérer le rôle car tous les nouveaux utilisateurs sont des marchands
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  // Validation et état pour les erreurs de validation côté client
  const [validationErrors, setValidationErrors] = useState({
    login: { email: "", password: "" },
    register: { name: "", email: "", phone: "", password: "", confirmPassword: "" }
  });

  // Fonction de validation de l'email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fonction de validation du numéro de téléphone burkinabè
  const isValidBurkinaPhone = (phone: string): boolean => {
    if (!phone) return true; // Le téléphone est optionnel
    // Format burkinabè : +226 XX XX XX XX ou 0X XX XX XX XX
    const phoneRegex = /^(\+226|0)[567]\d{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Fonction de validation du mot de passe
  const isValidPassword = (password: string): boolean => {
    return password.length >= 6; // Minimum 6 caractères comme requis par Supabase
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialisation des erreurs de validation
    setValidationErrors(prev => ({
      ...prev,
      login: { email: "", password: "" }
    }));

    // Validation côté client avant envoi
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
      console.log('🔐 Tentative de connexion pour:', loginData.email);
      await signIn(loginData.email, loginData.password);
      
      // Redirection vers la page d'accueil après connexion réussie
      // La fonction signIn du hook useAuth gère déjà les messages de succès/erreur
      navigate("/");
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      // La gestion d'erreur est déjà prise en charge par le hook useAuth
      // qui affiche les toasts appropriés
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialisation des erreurs de validation
    setValidationErrors(prev => ({
      ...prev,
      register: { name: "", email: "", phone: "", password: "", confirmPassword: "" }
    }));

    // Validation complète côté client
    let hasErrors = false;
    const errors = { name: "", email: "", phone: "", password: "", confirmPassword: "" };

    // Validation du nom complet
    if (!registerData.name.trim()) {
      errors.name = "Le nom complet est requis";
      hasErrors = true;
    } else if (registerData.name.trim().length < 2) {
      errors.name = "Le nom doit contenir au moins 2 caractères";
      hasErrors = true;
    }

    // Validation de l'email
    if (!registerData.email) {
      errors.email = "L'email est requis";
      hasErrors = true;
    } else if (!isValidEmail(registerData.email)) {
      errors.email = "Format d'email invalide";
      hasErrors = true;
    }

    // Validation du téléphone (optionnel mais doit être valide si fourni)
    if (registerData.phone && !isValidBurkinaPhone(registerData.phone)) {
      errors.phone = "Format de téléphone invalide. Exemple: +226 70 12 34 56";
      hasErrors = true;
    }

    // Validation du mot de passe
    if (!registerData.password) {
      errors.password = "Le mot de passe est requis";
      hasErrors = true;
    } else if (!isValidPassword(registerData.password)) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
      hasErrors = true;
    }

    // Validation de la confirmation du mot de passe
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
      console.log('🏪 Création d\'un nouveau compte marchand pour:', registerData.email);
      
      // Appel de la fonction signUp corrigée qui assigne automatiquement le rôle "merchant"
      // Le téléphone est optionnel (undefined si vide)
      await signUp(
        registerData.email, 
        registerData.password, 
        registerData.name.trim(), 
        registerData.phone.trim() || undefined
      );
      
      // Pas de redirection automatique car l'utilisateur doit confirmer son email
      // Le hook useAuth affiche déjà le message approprié
      console.log('✅ Processus de création de compte marchand initié avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du compte:', error);
      // La gestion d'erreur est prise en charge par le hook useAuth
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center items-center space-x-2 mb-2">
              <Store className="h-8 w-8 text-primary" />
              <ShoppingBag className="h-6 w-6 text-primary/70" />
            </div>
            <CardTitle className="text-2xl font-heading text-primary">
              Rejoignez FasoMarket
            </CardTitle>
            <p className="text-muted-foreground">
              {/* Message adapté au nouveau modèle métier où tous les utilisateurs sont des marchands */}
              La marketplace locale du Burkina Faso. Connectez-vous ou créez votre compte marchand pour acheter et vendre facilement.
            </p>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center space-x-1">
                  <span>Connexion</span>
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center space-x-1">
                  <span>Compte Marchand</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Formulaire de connexion */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email *</Label>
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
                    <Label htmlFor="login-password">Mot de passe *</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
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
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                  
                  <div className="text-center">
                    <Button variant="link" className="text-sm" type="button">
                      Mot de passe oublié ?
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              {/* Formulaire d'inscription - Création de compte marchand */}
              <TabsContent value="register" className="space-y-4">
                <div className="bg-primary/5 p-3 rounded-md mb-4">
                  <p className="text-sm text-primary font-medium flex items-center">
                    <Store className="h-4 w-4 mr-2" />
                    Votre compte marchand vous permettra de :
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 ml-6 space-y-1">
                    <li>• Acheter des produits sur la plateforme</li>
                    <li>• Publier et gérer vos propres annonces</li>
                    <li>• Communiquer avec d'autres marchands</li>
                    <li>• Accéder à votre tableau de bord personnalisé</li>
                  </ul>
                </div>
                
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="register-name">Nom complet *</Label>
                    <Input
                      id="register-name"
                      placeholder="Votre nom complet"
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
                    <Label htmlFor="register-email">Email *</Label>
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
                      Facilitera le contact avec vos acheteurs
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="register-password">Mot de passe *</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Au moins 6 caractères"
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
                    <Label htmlFor="register-confirm">Confirmer le mot de passe *</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={validationErrors.register.confirmPassword ? "border-red-500" : ""}
                      required
                    />
                    {validationErrors.register.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.register.confirmPassword}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? "Création du compte..." : "Créer mon compte marchand"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6">
              <Separator className="mb-4" />
              <p className="text-xs text-muted-foreground text-center">
                En vous connectant, vous acceptez nos{" "}
                <Button variant="link" className="h-auto p-0 text-xs" type="button">
                  Conditions d'utilisation
                </Button>{" "}
                et notre{" "}
                <Button variant="link" className="h-auto p-0 text-xs" type="button">
                  Politique de confidentialité
                </Button>
              </p>
              
              {/* Information spécifique au contexte burkinabè */}
              <div className="mt-3 p-2 bg-green-50 rounded text-center">
                <p className="text-xs text-green-700 font-medium">
                  🇧🇫 Plateforme 100% burkinabè - Soutenons notre économie locale !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Login;