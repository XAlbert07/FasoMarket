// MyProfile.tsx - VERSION CORRIGÉE

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Phone, MapPin, Calendar, Star, Package, Shield, Camera, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useListings } from "@/hooks/useListings"; // Changement ici
import { useReviews } from "@/hooks/useReviews";

// Composant de chargement simple pour remplacer LoadingSkeleton
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
    </div>
  </div>
);

const MyProfile = () => {
  const { user, profile, updateProfile } = useAuthContext();
  // CORRECTION : Utilisation du hook useListings avec fetchUserListings
  const { listings, loading: listingsLoading, fetchUserListings } = useListings();
  const { reviews } = useReviews();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    location: profile?.location || ""
  });

  // CORRECTION : Récupération des annonces de l'utilisateur au montage du composant
  // fetchUserListings est maintenant stable grâce à useCallback
  useEffect(() => {
    if (user?.id) {
      console.log("Chargement des annonces pour l'utilisateur:", user.id);
      fetchUserListings(user.id);
    }
  }, [user?.id, fetchUserListings]); // Maintenant fetchUserListings est stable

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

  // CORRECTION : Les statistiques utilisateur - maintenant basées sur les données chargées
  const userListings = listings; // Les listings sont déjà filtrés par fetchUserListings
  const userReviews = reviews.filter((review: any) => review.seller_id === user?.id);
  const averageRating = userReviews.length > 0 
    ? userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length 
    : 0;

  // CORRECTION : Debug pour voir ce qui se passe
  useEffect(() => {
    console.log("Données de débogage MyProfile:");
    console.log("- Utilisateur connecté:", user?.id);
    console.log("- Nombre d'annonces chargées:", listings.length);
    console.log("- Annonces:", listings);
    console.log("- Chargement en cours:", listingsLoading);
  }, [user, listings, listingsLoading]);

  const handleInputChange = (field: string, value: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-heading font-bold mb-8">Mon Profil</h1>

            {success && (
              <Alert className="mb-6 border-green-500/20 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  Profil mis à jour avec succès !
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
              {/* Colonne gauche - Informations principales */}
              <div className="lg:col-span-1">
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

                {/* CORRECTION : Statistiques avec indicateur de chargement */}
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

              {/* Colonne droite - Édition du profil */}
              <div className="lg:col-span-2">
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

                {/* Section Sécurité */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Sécurité du compte</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Mot de passe</h4>
                        <p className="text-sm text-muted-foreground">
                          Dernière modification il y a 30 jours
                        </p>
                      </div>
                      <Button variant="outline">
                        Changer le mot de passe
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Authentification à deux facteurs</h4>
                        <p className="text-sm text-muted-foreground">
                          Sécurisez votre compte avec 2FA
                        </p>
                      </div>
                      <Button variant="outline">
                        Activer 2FA
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Sessions actives</h4>
                        <p className="text-sm text-muted-foreground">
                          Gérez vos sessions de connexion
                        </p>
                      </div>
                      <Button variant="outline">
                        Voir les sessions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyProfile;