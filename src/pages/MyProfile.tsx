// pages/MyProfile.tsx - VERSION COMPLÈTE MOBILE-FIRST AVEC UPLOAD AVATAR

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

import {
  User, Mail, Phone, MapPin, Calendar, Star, Package, Shield, Camera, Save, 
  AlertCircle, CheckCircle, Edit, Eye, Settings, ChevronRight, MoreVertical,
  Lock, Smartphone, Monitor, TrendingUp, MessageCircle, Heart, Upload, Trash2, X
} from "lucide-react";

// Imports des composants spécialisés 
import { ChangePasswordModal } from "@/components/security/ChangePasswordModal";
import { TwoFactorAuthModal } from "@/components/security/TwoFactorAuthModal";
import { ActiveSessionsModal } from "@/components/security/ActiveSessionsModal";

// Imports des hooks existants
import { useAuthContext } from "@/contexts/AuthContext";
import { useListings } from "@/hooks/useListings";
import { useReviews } from "@/hooks/useReviews";

// Interface pour les données du formulaire de profil
interface ProfileFormData {
  full_name: string;
  phone: string;
  bio: string;
  location: string;
}

// Composant de chargement mobile-optimisé
const MobileLoadingSkeleton = () => (
  <div className="space-y-4">
    {/* Avatar skeleton */}
    <div className="flex items-center gap-4 p-4">
      <div className="w-16 h-16 bg-muted rounded-full animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-muted rounded animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
      </div>
    </div>
    
    {/* Stats skeleton */}
    <div className="grid grid-cols-3 gap-4 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <div className="h-6 bg-muted rounded animate-pulse"></div>
          <div className="h-4 bg-muted rounded animate-pulse"></div>
        </div>
      ))}
    </div>
    
    {/* Cards skeleton */}
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
    ))}
  </div>
);

// Composant Modal d'upload d'avatar intégré - Mobile-First
const AvatarUploadModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, profile, updateProfile } = useAuthContext();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation immédiate
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image (JPG, PNG, WebP)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Création du preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processAvatarImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Canvas non supporté'));
        return;
      }

      img.onload = () => {
        // Dimensions optimales pour avatar (carré)
        const size = 400;
        canvas.width = size;
        canvas.height = size;

        // Calcul pour crop carré centré
        const { width: imgWidth, height: imgHeight } = img;
        const minDimension = Math.min(imgWidth, imgHeight);
        const cropX = (imgWidth - minDimension) / 2;
        const cropY = (imgHeight - minDimension) / 2;

        // Configuration optimisée pour avatars
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dessin avec crop carré centré
        ctx.drawImage(
          img,
          cropX, cropY, minDimension, minDimension, // Source (crop carré)
          0, 0, size, size // Destination (redimensionnement)
        );

        // Conversion en blob avec qualité élevée pour les avatars
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Avatar traité: ${imgWidth}x${imgHeight} → ${size}x${size} (${Math.round(blob.size/1024)}KB)`);
              resolve(blob);
            } else {
              reject(new Error('Échec traitement image'));
            }
          },
          'image/jpeg',
          0.9 // Qualité élevée pour les avatars
        );

        img.remove();
      };

      img.onerror = () => reject(new Error('Impossible de charger l\'image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const deleteOldAvatar = async (userId: string) => {
    try {
      // Liste des fichiers existants pour cet utilisateur
      const { data: files, error: listError } = await supabase.storage
        .from('avatars')
        .list('', {
          search: userId
        });

      if (listError || !files) return;

      // Suppression de tous les anciens avatars de l'utilisateur
      const oldFiles = files
        .filter(file => file.name.startsWith(userId))
        .map(file => file.name);

      if (oldFiles.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(oldFiles);

        if (deleteError) {
          console.warn('Erreur suppression ancien avatar:', deleteError);
        } else {
          console.log(`Supprimé ${oldFiles.length} ancien(s) avatar(s)`);
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la suppression de l\'ancien avatar:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);

    try {
      // Compression et redimensionnement de l'avatar
      const processedFile = await processAvatarImage(selectedFile);
      
      // Nom de fichier unique pour éviter les conflits
      const fileExt = selectedFile.type.split('/')[1];
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // Suppression de l'ancien avatar si existant
      await deleteOldAvatar(user.id);

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processedFile, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erreur upload:', uploadError);
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      // Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      // Mise à jour du profil utilisateur
      await updateProfile({ avatar_url: publicUrl });

      toast({
        title: "Avatar mis à jour",
        description: "Votre photo de profil a été mise à jour avec succès"
      });

      resetModal();
      onClose();

    } catch (error) {
      console.error('Erreur upload avatar:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'avatar',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setUploading(true);

    try {
      // Suppression du fichier dans le storage
      await deleteOldAvatar(user.id);

      // Mise à jour du profil pour supprimer l'URL
      await updateProfile({ avatar_url: null });

      toast({
        title: "Avatar supprimé",
        description: "Votre photo de profil a été supprimée"
      });

      resetModal();
      onClose();

    } catch (error) {
      console.error('Erreur suppression avatar:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo de profil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aperçu de l'avatar actuel/nouveau */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-muted">
                <AvatarImage 
                  src={previewUrl || profile?.avatar_url} 
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 
                   user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {(previewUrl || profile?.avatar_url) && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => {
                    if (previewUrl) {
                      resetModal();
                    } else {
                      handleDelete();
                    }
                  }}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {selectedFile 
                  ? `Nouvelle photo sélectionnée: ${selectedFile.name}`
                  : profile?.avatar_url 
                    ? 'Photo de profil actuelle'
                    : 'Aucune photo de profil'}
              </p>
            </div>
          </div>

          {/* Input file caché */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Actions */}
          <div className="space-y-3">
            {!selectedFile ? (
              <>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choisir une photo
                </Button>

                {profile?.avatar_url && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="w-full"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer la photo
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetModal}
                  className="flex-1"
                  disabled={uploading}
                >
                  Annuler
                </Button>
                
                <Button
                  onClick={handleUpload}
                  className="flex-1"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Conseils */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Formats acceptés: JPG, PNG, WebP</p>
            <p>• Taille maximale: 5MB</p>
            <p>• L'image sera automatiquement recadrée au format carré</p>
            <p>• Résolution recommandée: 400x400px minimum</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MyProfile = () => {
  const { user, profile, updateProfile } = useAuthContext();
  const { listings, loading: listingsLoading, fetchUserListings } = useListings();
  const { reviews } = useReviews();

  // États pour l'édition du profil - approche mobile-first
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // États pour les modales d'édition - approche progressive disclosure
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // États pour les modales de sécurité - architecture modulaire maintenue
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    location: profile?.location || ""
  });

  // Chargement des annonces utilisateur
  useEffect(() => {
    if (user?.id) {
      fetchUserListings(user.id);
    }
  }, [user?.id, fetchUserListings]);

  // Synchronisation des données de profil
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

  // Calculs et statistiques
  const userListings = listings;
  const userReviews = reviews.filter((review: any) => review.seller_id === user?.id);
  const averageRating = userReviews.length > 0
    ? userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length
    : 0;

  // Statistiques des annonces par statut
  const activeListings = userListings.filter(listing => listing.status === 'active').length;
  const totalViews = userListings.reduce((sum, listing) => sum + (listing.views_count || 0), 0);
  const favoriteCount = 0; // À calculer via une requête dédiée

  // Gestionnaires pour l'édition du profil
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateProfile(formData);
      setSuccess(true);
      setShowEditProfileModal(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  // Callbacks pour les modales de sécurité
  const handleSecurityActionSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSecurityActionError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(""), 5000);
  };

  // Fonction utilitaire pour le rendu des étoiles
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  // Gestion du chargement
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-4 md:py-8">
          <MobileLoadingSkeleton />
        </main>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">

        {/* MOBILE: En-tête de profil compact */}
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-heading font-bold mb-4">Mon Profil</h1>
          
          {/* Alertes globales - Mobile optimisées */}
          {success && (
            <Alert className="mb-4 border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Opération réalisée avec succès !
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* MOBILE: Carte de profil principale - Avatar cliquable */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              {/* Avatar avec bouton de modification - Interactive */}
              <div className="relative flex-shrink-0">
                <Avatar 
                  className="h-16 w-16 md:h-20 md:w-20 cursor-pointer ring-2 ring-offset-2 ring-transparent hover:ring-primary/50 transition-all duration-200" 
                  onClick={() => setShowAvatarModal(true)}
                >
                  <AvatarImage src={profile.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-lg md:text-xl">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 
                     user.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0 shadow-lg border-2 border-background hover:scale-110 transition-transform"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {/* Informations principales */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg md:text-xl font-bold truncate">
                    {profile.full_name || "Nom non renseigné"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditProfileModal(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">{renderStars(Math.round(averageRating))}</div>
                  <span className="text-sm text-muted-foreground">
                    ({userReviews.length} avis)
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Membre depuis {new Date(profile.created_at).getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Informations de contact - Layout mobile optimisé */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{profile.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MOBILE: Statistiques en grille compacte */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">Statistiques</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatsModal(true)}
                className="md:hidden"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary mr-1" />
                </div>
                {listingsLoading ? (
                  <div className="h-6 w-full bg-muted rounded animate-pulse"></div>
                ) : (
                  <div className="text-lg md:text-xl font-bold">{userListings.length}</div>
                )}
                <div className="text-xs text-muted-foreground">Annonces</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                </div>
                <div className="text-lg md:text-xl font-bold">{averageRating.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Note moy.</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Eye className="h-4 w-4 text-blue-500 mr-1" />
                </div>
                <div className="text-lg md:text-xl font-bold">{totalViews}</div>
                <div className="text-xs text-muted-foreground">Vues</div>
              </div>
            </div>

            {/* Statistiques détaillées pour desktop */}
            <div className="hidden md:block mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Annonces actives</span>
                  </div>
                  <Badge>{activeListings}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Favoris reçus</span>
                  </div>
                  <Badge>{favoriteCount}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Messages reçus</span>
                  </div>
                  <Badge>0</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Inscription</span>
                  </div>
                  <Badge variant="secondary">
                    {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MOBILE: Biographie - Section dédiée */}
        {profile.bio && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base">À propos</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditProfileModal(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* MOBILE: Actions rapides - Liste verticale */}
        <div className="space-y-3 mb-6">
          
          {/* Édition du profil */}
          <Card>
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => setShowEditProfileModal(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Edit className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Modifier le profil</div>
                    <div className="text-sm text-muted-foreground">
                      Nom, téléphone, localisation, bio
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Sécurité du compte */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="font-medium">Sécurité du compte</div>
                  <div className="text-sm text-muted-foreground">
                    Mot de passe, 2FA, sessions
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto p-3"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Changer le mot de passe</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto p-3"
                  onClick={() => setShow2FAModal(true)}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">Authentification à deux facteurs</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto p-3"
                  onClick={() => setShowSessionsModal(true)}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm">Sessions actives</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>

      {/* MODAL: Upload d'avatar - Mobile optimisé */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />

      {/* MODAL: Édition du profil - Mobile optimisé */}
      <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier mon profil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-full-name">Nom complet</Label>
                <Input
                  id="edit-full-name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Votre nom complet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+226 XX XX XX XX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Localisation</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Votre ville ou région"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bio">Biographie</Label>
                <Textarea
                  id="edit-bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Parlez-nous de vous..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditProfileModal(false);
                  setFormData({
                    full_name: profile.full_name || "",
                    phone: profile.phone || "",
                    bio: profile.bio || "",
                    location: profile.location || ""
                  });
                }}
                disabled={isLoading}
              >
                Annuler
              </Button>
              
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: Statistiques détaillées - Mobile uniquement */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="sm:max-w-md md:hidden">
          <DialogHeader>
            <DialogTitle>Mes statistiques</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Package className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-xl font-bold">{userListings.length}</div>
                <div className="text-sm text-muted-foreground">Annonces publiées</div>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl font-bold">{activeListings}</div>
                <div className="text-sm text-muted-foreground">Annonces actives</div>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-xl font-bold">{averageRating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Note moyenne</div>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl font-bold">{totalViews}</div>
                <div className="text-sm text-muted-foreground">Vues totales</div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Membre depuis le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modales de sécurité - Architecture modulaire maintenue */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleSecurityActionSuccess}
        onError={handleSecurityActionError}
      />

      <TwoFactorAuthModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={handleSecurityActionSuccess}
        onError={handleSecurityActionError}
      />

      <ActiveSessionsModal
        isOpen={showSessionsModal}
        onClose={() => setShowSessionsModal(false)}
        onSuccess={handleSecurityActionSuccess}
        onError={handleSecurityActionError}
      />

      <div className="hidden md:block">
       
      </div>
    </div>
  );
};

export default MyProfile;