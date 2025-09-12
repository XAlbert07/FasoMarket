// MyProfile.tsx - VERSION REFACTORISÉE
// Composant principal allégé qui orchestre les modales spécialisées
// Démontre une architecture modulaire et maintenable

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, Mail, Phone, MapPin, Calendar, Star, Package, Shield, 
  Camera, Save, AlertCircle, CheckCircle 
} from "lucide-react";

// Imports des composants spécialisés - architecture modulaire
import { ChangePasswordModal } from "@/components/security/ChangePasswordModal";
import { TwoFactorAuthModal } from "@/components/security/TwoFactorAuthModal";
import { ActiveSessionsModal } from "@/components/security/ActiveSessionsModal";

// Imports des hooks existants
import { useAuthContext } from "@/contexts/AuthContext";
import { useListings } from "@/hooks/useListings";
import { useReviews } from "@/hooks/useReviews";


// Composant de chargement réutilisable
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
    </div>
  </div>
);

// Interface pour les données du formulaire de profil
interface ProfileFormData {
  full_name: string;
  phone: string;
  bio: string;
  location: string;
}

const MyProfile = () => {
  const { user, profile, updateProfile } = useAuthContext();
  const { listings, loading: listingsLoading, fetchUserListings } = useListings();
  const { reviews } = useReviews();
  
  // ========================================
  // ÉTATS POUR L'ÉDITION DU PROFIL
  // ========================================
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    location: profile?.location || ""
  });

  // ========================================
  // ÉTATS POUR LES MODALES DE SÉCURITÉ
  // ========================================
  // Remarquez comme c'est simple maintenant : juste des booléens !
  // Toute la complexité est encapsulée dans les composants spécialisés
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  // ========================================
  // EFFETS ET LOGIQUE MÉTIER
  // ========================================
  
  // Chargement des annonces utilisateur
  useEffect(() => {
    if (user?.id) {
      console.log("Chargement des annonces pour l'utilisateur:", user.id);
      fetchUserListings(user.id);
    }
  }, [user?.id, fetchUserListings]);

  // Synchronisation des données de profil avec le formulaire
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        location: profile.location || ""
      });
    }
  }, [profile]);

  // ========================================
  // CALCULS ET STATISTIQUES
  // ========================================
  const userListings = listings;
  const userReviews = reviews.filter((review: any) => review.seller_id === user?.id);
  const averageRating = userReviews.length > 0 
    ? userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length 
    : 0;

  // ========================================
  // GESTIONNAIRES POUR L'ÉDITION DU PROFIL
  // ========================================
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateProfile(formData);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // GESTIONNAIRES POUR LES MODALES DE SÉCURITÉ
  // ========================================
  // Regardez comme ces fonctions sont maintenant simples et élégantes !
  // Chaque modale gère sa propre complexité interne
  
  const handlePasswordChangeClick = () => {
    console.log("Ouverture de la modale de changement de mot de passe");
    setShowPasswordModal(true);
  };

  const handle2FAActivationClick = () => {
    console.log("Ouverture de la modale 2FA");
    setShow2FAModal(true);
  };

  const handleViewSessionsClick = () => {
    console.log("Ouverture de la gestion des sessions");
    setShowSessionsModal(true);
  };

  // ========================================
  // CALLBACKS POUR LES MODALES
  // ========================================
  // Ces fonctions sont appelées par les modales pour notifier des événements

  // Callback universel de succès - peut être utilisé par toutes les modales
  const handleSecurityActionSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Callback universel d'erreur - peut être utilisé par toutes les modales
  const handleSecurityActionError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(""), 5000); // Effacer l'erreur après 5 secondes
  };

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  // ========================================
  // GESTION DU CHARGEMENT
  // ========================================
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <LoadingSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  // ========================================
  // RENDU PRINCIPAL
  // ========================================
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-heading font-bold mb-8">Mon Profil</h1>

          {/* ========================================
               ALERTES GLOBALES
               ======================================== */}
          {success && (
            <Alert className="mb-6 border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Opération réalisée avec succès !
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ========================================
                 COLONNE GAUCHE - INFORMATIONS PRINCIPALES
                 ======================================== */}
            <div className="lg:col-span-1">
              {/* Carte de profil principal */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="relative mb-6">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-2xl">
                        {profile.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-2"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>

                  <h2 className="text-2xl font-bold mb-2">
                    {profile.full_name || "Nom non renseigné"}
                  </h2>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex">
                      {renderStars(Math.round(averageRating))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({userReviews.length} avis)
                    </span>
                  </div>

                  <Badge variant="secondary" className="mb-4">
                    <Shield className="h-3 w-3 mr-1" />
                    Membre depuis {new Date(profile.created_at).getFullYear()}
                  </Badge>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte de statistiques */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-sm">Annonces publiées</span>
                    </div>
                    {listingsLoading ? (
                      <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <Badge>{userListings.length}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Note moyenne</span>
                    </div>
                    <Badge>{averageRating.toFixed(1)}/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Avis reçus</span>
                    </div>
                    <Badge>{userReviews.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ========================================
                 COLONNE DROITE - ÉDITION DU PROFIL
                 ======================================== */}
            <div className="lg:col-span-2">
              {/* Carte d'édition des informations personnelles */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Informations personnelles</CardTitle>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        Modifier
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              full_name: profile.full_name || "",
                              phone: profile.phone || "",
                              bio: profile.bio || "",
                              location: profile.location || ""
                            });
                          }}
                        >
                          Annuler
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Sauvegarde...
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Sauvegarder
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet</Label>
                      {isEditing ? (
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Votre nom complet"
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md">
                          {formData.full_name || "Non renseigné"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+226 XX XX XX XX"
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md">
                          {formData.phone || "Non renseigné"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Localisation</Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Votre ville ou région"
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md">
                        {formData.location || "Non renseigné"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biographie</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Parlez-nous de vous..."
                        rows={4}
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md min-h-[100px]">
                        {formData.bio || "Aucune biographie renseignée"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ========================================
                   SECTION SÉCURITÉ - VERSION SIMPLIFIÉE
                   ======================================== */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Sécurité du compte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Option changement de mot de passe */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Mot de passe</h4>
                      <p className="text-sm text-muted-foreground">
                        Dernière modification il y a 30 jours
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handlePasswordChangeClick}
                    >
                      Changer le mot de passe
                    </Button>
                  </div>

                  {/* Option 2FA */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Authentification à deux facteurs</h4>
                      <p className="text-sm text-muted-foreground">
                        Sécurisez votre compte avec 2FA
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handle2FAActivationClick}
                    >
                      Activer 2FA
                    </Button>
                  </div>

                  {/* Option sessions actives */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Sessions actives</h4>
                      <p className="text-sm text-muted-foreground">
                        Gérez vos sessions de connexion
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleViewSessionsClick}
                    >
                      Voir les sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================
           MODALES DE SÉCURITÉ - COMPOSANTS SÉPARÉS
           ========================================
           Regardez comme c'est propre maintenant !
           Chaque modale est un composant spécialisé et autonome.
           MyProfile n'a plus besoin de connaître leur complexité interne.
           ======================================== */}

      {/* Modal de changement de mot de passe */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleSecurityActionSuccess}
        onError={handleSecurityActionError}
      />

      {/* Modal d'authentification à deux facteurs */}
      <TwoFactorAuthModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={handleSecurityActionSuccess}
        onError={handleSecurityActionError}
      />

      {/* Modal de gestion des sessions actives */}
      <ActiveSessionsModal
        isOpen={showSessionsModal}
        onClose={() => setShowSessionsModal(false)}
        onSuccess={handleSecurityActionSuccess}
        onError={handleSecurityActionError}
      />

      <Footer />
    </div>
  );
};

export default MyProfile;