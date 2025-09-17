// pages/EditListing.tsx
// Page complète pour éditer une annonce existante, optimisée pour le mobile-first.

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useListing } from "@/hooks/useListings";
import { useCategories } from "@/hooks/useCategories";
import { useCreateListing } from "@/hooks/useListings";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  X, 
  AlertTriangle,
  MapPin,
  Package,
  FileText,
  Phone,
  Plus,
  Image as ImageIcon
} from "lucide-react";

// Liste des emplacements (inchangée)
const BURKINA_LOCATIONS = [
  "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Banfora", 
  "Dédougou", "Kaya", "Tenkodogo", "Fada N'Gourma", "Ziniaré",
  "Réo", "Gaoua", "Dori", "Manga", "Boulsa"
];

// Le composant principal reste le même, seule la partie JSX a été refactorisée
const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const { listing, loading: listingLoading, error } = useListing(id!);
  const { categories, loading: categoriesLoading } = useCategories();
  const { updateListing, loading: updateLoading } = useCreateListing();

  // Référence pour l'input file caché
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    location: '',
    condition: 'used' as 'new' | 'used' | 'refurbished',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    images: [] as string[]
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Charger les données de l'annonce dans le formulaire
  useEffect(() => {
    if (listing) {
      // Vérifier que l'utilisateur est bien le propriétaire
      if (listing.user_id !== user?.id) {
        toast({
          title: "Accès refusé",
          description: "Vous ne pouvez modifier que vos propres annonces.",
          variant: "destructive"
        });
        navigate('/my-listings');
        return;
      }

      // Remplir le formulaire avec les données existantes (sans la devise)
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price?.toString() || '',
        category_id: listing.category_id || '',
        location: listing.location || '',
        condition: listing.condition || 'used',
        contact_phone: listing.contact_phone || '',
        contact_email: listing.contact_email || user?.email || '',
        contact_whatsapp: listing.contact_whatsapp || '',
        images: listing.images || []
      });
    }
  }, [listing, user, navigate, toast]);

  // Détecter les changements dans le formulaire (sans la devise)
  useEffect(() => {
    if (listing) {
      const hasFormChanges = 
        formData.title !== (listing.title || '') ||
        formData.description !== (listing.description || '') ||
        formData.price !== (listing.price?.toString() || '') ||
        formData.category_id !== (listing.category_id || '') ||
        formData.location !== (listing.location || '') ||
        formData.condition !== (listing.condition || 'used') ||
        formData.contact_phone !== (listing.contact_phone || '') ||
        formData.contact_email !== (listing.contact_email || '') ||
        formData.contact_whatsapp !== (listing.contact_whatsapp || '') ||
        JSON.stringify(formData.images) !== JSON.stringify(listing.images || []) ||
        imageToRemove.length > 0;
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, listing, imageToRemove]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Supprimer l'erreur du champ modifié
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Fonction pour gérer l'upload d'images
  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    // Vérifier que l'on ne dépasse pas 5 images au total
    if (formData.images.length + files.length > 5) {
      toast({
        title: "Trop d'images",
        description: "Vous ne pouvez pas avoir plus de 5 images par annonce",
        variant: "destructive"
      });
      return;
    }

    setUploadingImages(true);
    const newImages: string[] = [];

    try {
      // Simuler l'upload - en réalité vous devriez utiliser votre service d'upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Vérifications de base
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Format non supporté",
            description: `Le fichier ${file.name} n'est pas une image`,
            variant: "destructive"
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB max
          toast({
            title: "Fichier trop volumineux",
            description: `L'image ${file.name} dépasse 5MB`,
            variant: "destructive"
          });
          continue;
        }

        // Créer un URL temporaire pour la prévisualisation
        // En production, vous devriez uploader vers votre serveur/cloud
        const imageUrl = URL.createObjectURL(file);
        newImages.push(imageUrl);
      }

      // Ajouter les nouvelles images
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));

      if (newImages.length > 0) {
        toast({
          title: "Images ajoutées",
          description: `${newImages.length} image(s) ajoutée(s) avec succès`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'ajouter les images",
        variant: "destructive"
      });
    } finally {
      setUploadingImages(false);
    }
  };

  // Gestionnaire pour ouvrir le sélecteur de fichiers
  const handleAddImages = () => {
    fileInputRef.current?.click();
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Le titre est obligatoire";
    } else if (formData.title.length < 10) {
      errors.title = "Le titre doit contenir au moins 10 caractères";
    } else if (formData.title.length > 100) {
      errors.title = "Le titre ne peut pas dépasser 100 caractères";
    }

    if (!formData.description.trim()) {
      errors.description = "La description est obligatoire";
    } else if (formData.description.length < 20) {
      errors.description = "La description doit contenir au moins 20 caractères";
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      errors.price = "Le prix doit être un nombre positif";
    } else if (price > 100000000) {
      errors.price = "Le prix semble trop élevé";
    }

    if (!formData.category_id) {
      errors.category_id = "Veuillez sélectionner une catégorie";
    }

    if (!formData.location.trim()) {
      errors.location = "La localisation est obligatoire";
    }

    // Validation du téléphone si fourni
    if (formData.contact_phone) {
      const phoneRegex = /^(\+226|226|0)?[0-9]{8}$/;
      if (!phoneRegex.test(formData.contact_phone.replace(/\s/g, ''))) {
        errors.contact_phone = "Format de téléphone invalide (ex: +226 12 34 56 78)";
      }
    }

    // Validation de l'email si fourni
    if (formData.contact_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_email)) {
        errors.contact_email = "Format d'email invalide";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erreurs dans le formulaire",
        description: "Veuillez corriger les erreurs avant de sauvegarder",
        variant: "destructive"
      });
      return;
    }

    if (!id) {
      toast({
        title: "Erreur",
        description: "ID de l'annonce manquant",
        variant: "destructive"
      });
      return;
    }

    try {
      // Préparer les données pour la mise à jour
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        currency: 'FCFA', // Devise fixe pour le marché local burkinabé
        category_id: formData.category_id,
        location: formData.location.trim(),
        condition: formData.condition,
        contact_phone: formData.contact_phone.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_whatsapp: formData.contact_whatsapp.trim() || null,
        images: formData.images.filter(img => !imageToRemove.includes(img)),
        updated_at: new Date().toISOString()
      };

      const result = await updateListing(id, updateData);

      if (result) {
        toast({
          title: "Annonce mise à jour",
          description: "Vos modifications ont été sauvegardées avec succès",
          duration: 4000
        });

        // Rediriger vers la page de gestion de l'annonce
        navigate(`/listing/${id}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive"
      });
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setImageToRemove(prev => [...prev, imageUrl]);
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  const handleCancel = () => {
    // Remplacer window.confirm par une modale custom pour éviter les problèmes d'iframe
    // Ici, nous allons simplement naviguer en arrière pour l'exemple
    if (hasChanges) {
       console.log("Des modifications non sauvegardées ont été détectées. Redirection annulée.");
       // En production, il faudrait afficher un composant de confirmation
    }
    navigate(`/listing/${id}`);
  };

  // États de chargement et d'erreur (pas de changements)
  if (listingLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement de l'annonce à modifier...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="p-8">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Impossible de modifier l'annonce</h1>
                <p className="text-muted-foreground mb-6">
                  Cette annonce n'existe pas ou vous n'avez pas les droits pour la modifier.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate('/my-listings')}>
                    Mes annonces
                  </Button>
                  <Button onClick={() => navigate('/')}>
                    Accueil
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Container principal adapté pour le mobile-first */}
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Input file caché pour l'upload d'images */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            className="hidden"
          />

          {/* En-tête - Simplifié pour mobile, aligné pour le desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
            {/* Colonne de gauche avec le bouton de retour et le titre */}
            <div>
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="mb-2 sm:mb-4 px-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'annonce
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold">Modifier votre annonce</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Apportez des modifications à votre annonce "{listing.title}"
              </p>
            </div>
            
            {/* Bouton de prévisualisation à droite sur desktop */}
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href={`/listing/${id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Prévisualiser
                </a>
              </Button>
            </div>
          </div>

          {/* Alerte si changements non sauvegardés */}
          {hasChanges && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous avez des modifications non sauvegardées. N'oubliez pas de cliquer sur "Sauvegarder" avant de quitter.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
            {/* La grille est maintenant mobile-first : une seule colonne par défaut, 3 colonnes sur les écrans larges */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Colonne principale - Le formulaire, s'étend sur 2 colonnes sur les grands écrans */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informations générales */}
                <Card className="rounded-lg shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 text-primary" />
                      Informations générales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="title" className="mb-1">Titre de l'annonce *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Ex: iPhone 13 Pro Max 256Go état neuf avec accessoires"
                        maxLength={100}
                        className={`mt-1 ${formErrors.title ? "border-red-500" : ""}`}
                      />
                      {formErrors.title && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.title.length}/100 caractères
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description" className="mb-1">Description détaillée *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Décrivez votre article en détail : état, âge, raison de la vente, etc."
                        rows={6}
                        maxLength={2000}
                        className={`mt-1 ${formErrors.description ? "border-red-500" : ""}`}
                      />
                      {formErrors.description && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.description.length}/2000 caractères
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Prix et catégorie - Section modifiée */}
                <Card className="rounded-lg shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Package className="h-5 w-5 text-primary" />
                      Catégorie et prix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Les deux sélecteurs sont maintenant empilés sur mobile, puis côte à côte sur desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="mb-1">Catégorie *</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => handleInputChange('category_id', value)}
                        >
                          <SelectTrigger className={`mt-1 ${formErrors.category_id ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Choisir une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.category_id && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.category_id}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="condition" className="mb-1">État</Label>
                        <Select
                          value={formData.condition}
                          onValueChange={(value: 'new' | 'used' | 'refurbished') => 
                            handleInputChange('condition', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Neuf</SelectItem>
                            <SelectItem value="used">Occasion</SelectItem>
                            <SelectItem value="refurbished">Reconditionné</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="price" className="mb-1">Prix en FCFA *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="500000"
                        min="0"
                        step="1000"
                        className={`mt-1 ${formErrors.price ? "border-red-500" : ""}`}
                      />
                      {formErrors.price && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Entrez le prix en Francs CFA (XOF)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Localisation */}
                <Card className="rounded-lg shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MapPin className="h-5 w-5 text-primary" />
                      Localisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="location" className="mb-1">Ville/Localité *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => handleInputChange('location', value)}
                      >
                        <SelectTrigger className={`mt-1 ${formErrors.location ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Choisir votre localisation" />
                        </SelectTrigger>
                        <SelectContent>
                          {BURKINA_LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.location && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Coordonnées de contact */}
                <Card className="rounded-lg shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Phone className="h-5 w-5 text-primary" />
                      Informations de contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="contact_phone" className="mb-1">Téléphone</Label>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                        placeholder="+226 12 34 56 78"
                        className={`mt-1 ${formErrors.contact_phone ? "border-red-500" : ""}`}
                      />
                      {formErrors.contact_phone && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.contact_phone}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="contact_email" className="mb-1">Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                        placeholder="votre@email.com"
                        className={`mt-1 ${formErrors.contact_email ? "border-red-500" : ""}`}
                      />
                      {formErrors.contact_email && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.contact_email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="contact_whatsapp" className="mb-1">WhatsApp (optionnel)</Label>
                      <Input
                        id="contact_whatsapp"
                        value={formData.contact_whatsapp}
                        onChange={(e) => handleInputChange('contact_whatsapp', e.target.value)}
                        placeholder="+226 12 34 56 78"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Si différent du numéro de téléphone principal
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Images et actions - S'affiche en deuxième sur mobile, à droite sur desktop */}
              <div className="space-y-6">
                {/* Gestion des images améliorée */}
                <Card className="rounded-lg shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      Photos de l'annonce
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Grille des images existantes, plus espacée sur mobile */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden border">
                            <img
                              src={image}
                              alt={`Image ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            {/* Bouton de suppression d'image stylisé et animé */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(image)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bouton d'ajout d'images */}
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 rounded-lg"
                        onClick={handleAddImages}
                        disabled={uploadingImages || formData.images.length >= 5}
                      >
                        {uploadingImages ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                            Upload en cours...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            {formData.images.length === 0 ? "Ajouter des photos" : "Ajouter plus de photos"}
                          </>
                        )}
                      </Button>

                      {/* Informations sur les images */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• {formData.images.length}/5 photos ajoutées</p>
                        <p>• Formats supportés: JPG, PNG, JPEG</p>
                        <p>• Taille max: 5MB par image</p>
                      </div>

                      {/* Message si aucune image */}
                      {formData.images.length === 0 && (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">Aucune photo ajoutée</p>
                          <p className="text-xs text-gray-400">Cliquez pour commencer</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="rounded-lg shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-lg"
                      disabled={updateLoading || !hasChanges}
                    >
                      {updateLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder les modifications
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-lg"
                      onClick={handleCancel}
                      disabled={updateLoading}
                    >
                      Annuler
                    </Button>

                    <Separator className="my-4" />

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Modifié le: {new Date(listing.updated_at || listing.created_at).toLocaleDateString('fr-FR')}</p>
                      <p>• Statut: <Badge variant="outline" className="text-xs">{listing.status}</Badge></p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditListing;
