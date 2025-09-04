import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, Eye, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateListing } from "@/hooks/useListings";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuthContext } from "@/contexts/AuthContext";

const PublishListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createListing, loading: creatingListing } = useCreateListing();
  const { uploadImages, uploading } = useImageUpload();
  const { getCurrentLocation, location } = useGeolocation();
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    condition: "new" as "new" | "used",
    phone: ""
  });

  // CORRECTION CRITIQUE 1: Utilisation des vrais IDs de catégories de votre base de données
  // Ces IDs correspondent exactement à ceux trouvés dans votre table categories
  // Chaque ID a été récupéré de votre diagnostic SQL précédent
  const categories = [
    { name: "Véhicules", id: "c47e7448-5f79-4aea-8b72-9cf24f52b280" },
    { name: "Immobilier", id: "bec5720d-20cf-47e2-8b06-e0ae8f0b9ef8" },
    { name: "Électronique", id: "5c06aa04-81c6-4d99-849f-b06f218ca631" },
    { name: "Mode & Beauté", id: "7bb98a94-b7f2-49a8-9e67-69da0487b824" },
    { name: "Maison & Jardin", id: "e2b83b13-dd31-47ae-a9eb-20692599e37d" },
    { name: "Services", id: "5f24e208-935e-4ee7-a27f-9562413d6e11" },
    { name: "Emploi", id: "51f56004-50b0-40cd-9576-1290b9eac09f" },
    { name: "Loisirs & Sports", id: "e22cfdd9-b424-453d-8d37-f1851584f2ab" },
  ];
  
  // Cette fonction trouve l'ID réel de catégorie basé sur le nom sélectionné
  // Elle remplace la logique précédente qui utilisait des IDs fictifs
  const getCategoryIdByName = (name: string) => {
    const category = categories.find(cat => cat.name === name);
    return category ? category.id : null;
  };
  
  // Les villes du Burkina Faso - cette liste reste inchangée car elle était correcte
  const locations = [
    "Ouagadougou",
    "Bobo-Dioulasso",
    "Koudougou",
    "Banfora",
    "Ouahigouya",
    "Pouytenga",
    "Dédougou",
    "Kaya"
  ];

  // Gestion du téléchargement d'images - logique inchangée car elle fonctionne bien
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = imageFiles.length + newFiles.length;
      
      // Vérification de la limite de 8 images pour éviter la surcharge
      if (totalFiles > 8) {
        toast({
          title: "Limite atteinte",
          description: "Vous ne pouvez télécharger que 8 images maximum",
          variant: "destructive"
        });
        return;
      }

      // Création des aperçus pour l'expérience utilisateur
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImageFiles(prev => [...prev, ...newFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Suppression d'image - inclut le nettoyage mémoire important
  const removeImage = (index: number) => {
    // Libération de la mémoire pour éviter les fuites mémoire
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Géolocalisation - logique inchangée car elle fonctionne correctement
  const handleGetLocation = async () => {
    try {
      await getCurrentLocation();
      toast({
        title: "Position obtenue",
        description: "Votre position a été enregistrée pour l'annonce"
      });
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: error instanceof Error ? error.message : "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  };

  // FONCTION DE SOUMISSION CORRIGÉE - C'est ici que les principales corrections sont appliquées
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérification de l'authentification - sécurité fondamentale
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour publier une annonce",
        variant: "destructive"
      });
      return;
    }

    // Validation des champs obligatoires - prévention des erreurs côté serveur
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Validation des images - requirement business important pour une marketplace
    if (imageFiles.length === 0) {
      toast({
        title: "Images requises",
        description: "Veuillez ajouter au moins une image",
        variant: "destructive"
      });
      return;
    }

    // CORRECTION CRITIQUE 2: Utilisation du vrai ID de catégorie
    // Cette ligne utilise maintenant la fonction corrigée qui trouve le vrai ID
    const categoryId = getCategoryIdByName(formData.category);
    if (!categoryId) {
      toast({
        title: "Erreur",
        description: "Catégorie non valide",
        variant: "destructive"
      });
      return;
    }

    try {
      // Téléchargement des images en premier - logique métier correcte
      const imageUrls = await uploadImages(imageFiles);
      
      // CONSTRUCTION DES DONNÉES AVEC LES CORRECTIONS
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price), // Conversion en nombre pour correspondre au schéma DB
        category_id: categoryId, // Utilisation du vrai ID de catégorie
        location: formData.location,
        condition: formData.condition,
        phone: formData.phone,
        images: imageUrls,
        latitude: location?.latitude, // Coordonnées GPS optionnelles
        longitude: location?.longitude,
        currency: "XOF" // Devise locale du Burkina Faso
      };

      // Appel à la fonction de création avec les bonnes données
      const newListing = await createListing(listingData);
      
      // Navigation vers le dashboard en cas de succès
      if (newListing) {
        navigate('/merchant-dashboard');
      }
    } catch (error) {
      // Gestion d'erreur robuste avec logging pour le debugging
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'annonce",
        variant: "destructive"
      });
      console.error('Erreur de publication:', error);
    }
  };

  // Gestion des changements de formulaire - logique simple et efficace
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // INTERFACE UTILISATEUR - Structure inchangée car elle était bien conçue
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Publier une annonce
          </h1>
          <p className="text-muted-foreground">
            Remplissez les informations pour publier votre annonce
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION PHOTOS - Interface utilisateur inchangée */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        disabled={uploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {imagePreviews.length < 8 && (
                    <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Ajouter</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ajoutez jusqu'à 8 photos (formats JPG, PNG) - {imagePreviews.length}/8
                </p>
                {uploading && (
                  <p className="text-sm text-primary">Téléchargement des images en cours...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECTION INFORMATIONS GÉNÉRALES */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titre de l'annonce *</Label>
                <Input
                  id="title"
                  placeholder="Ex: iPhone 13 Pro Max 256GB"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre article en détail..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prix (XOF) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="Ex: 450000"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* UTILISATION DES VRAIES CATÉGORIES avec les bons IDs */}
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Localisation *</Label>
                <div className="space-y-2">
                  <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetLocation}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {location ? "Position enregistrée ✓" : "Utiliser ma position"}
                  </Button>
                </div>
              </div>

              <div>
                <Label>État de l'article</Label>
                <RadioGroup 
                  value={formData.condition} 
                  onValueChange={(value) => handleInputChange("condition", value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new">Neuf</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="used" id="used" />
                    <Label htmlFor="used">Occasion</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* SECTION CONTACT - Inchangée */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="phone">Numéro de téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+226 70 12 34 56"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Ce numéro sera affiché aux acheteurs intéressés
                </p>
              </div>
            </CardContent>
          </Card>

          {/* BOUTONS D'ACTION */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1" disabled>
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={creatingListing || uploading || !user}
            >
              {creatingListing || uploading ? "Publication en cours..." : "Publier l'annonce"}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default PublishListing;