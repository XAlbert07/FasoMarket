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
import { Upload, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateListing } from "@/hooks/useListings";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuthContext } from "@/contexts/AuthContext";
import ListingPreview from "@/components/ListingPreview"; // Import du composant d'aperçu

const PublishListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createListing, loading: creatingListing } = useCreateListing();
  const { uploadImages, uploading } = useImageUpload();
  
  // États pour la gestion des images et de l'aperçu
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false); // Contrôle l'affichage du modal d'aperçu
  
  // État du formulaire - toutes les données saisies par l'utilisateur
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    condition: "new" as "new" | "used",
    phone: ""
  });

  // Configuration des catégories avec leurs vrais IDs de base de données
  // Ces IDs correspondent exactement à ceux de votre table categories dans Supabase
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
  
  // Liste des principales villes du Burkina Faso pour les suggestions de localisation
  // Cette approche remplace complètement le système de géolocalisation GPS
  const burkinaCities = [
    "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora",
    "Ouahigouya", "Pouytenga", "Dédougou", "Kaya",
    "Fada N'Gourma", "Tenkodogo", "Réo", "Gaoua"
  ];

  // Fonction utilitaire pour convertir le nom de catégorie en ID de base de données
  // Cette fonction est cruciale pour que les annonces soient correctement catégorisées
  const getCategoryIdByName = (name: string) => {
    const category = categories.find(cat => cat.name === name);
    return category ? category.id : null;
  };

  // Validation pour déterminer si l'aperçu peut être affiché de manière utile
  // L'aperçu nécessite au minimum les informations essentielles pour être pertinent
  const canShowPreview = () => {
    return formData.title.trim() !== "" && 
           formData.description.trim() !== "" && 
           formData.price.trim() !== "" && 
           formData.category !== "" && 
           formData.location.trim() !== "";
  };

  // Fonction pour déclencher l'affichage de l'aperçu
  // Cette fonction valide d'abord que les données nécessaires sont présentes
  const handlePreview = () => {
    if (!canShowPreview()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir au moins les champs obligatoires pour voir l'aperçu",
        variant: "destructive"
      });
      return;
    }
    
    // Ouvre le modal d'aperçu si la validation passe
    setShowPreview(true);
  };

  // Gestion du téléchargement d'images avec validation et prévisualisation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = imageFiles.length + newFiles.length;
      
      // Validation de la limite d'images pour éviter la surcharge du serveur
      if (totalFiles > 8) {
        toast({
          title: "Limite atteinte",
          description: "Vous ne pouvez télécharger que 8 images maximum",
          variant: "destructive"
        });
        return;
      }

      // Création des URLs temporaires pour l'affichage immédiat des images
      // Ces URLs seront utilisées tant pour le formulaire que pour l'aperçu
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImageFiles(prev => [...prev, ...newFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Suppression d'une image avec nettoyage mémoire approprié
  const removeImage = (index: number) => {
    // Libération de l'URL temporaire pour éviter les fuites mémoire
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Gestion de la saisie manuelle de localisation
  const handleLocationInput = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  };

  // Fonction pour sélectionner rapidement une ville suggérée
  // Cette approche simplifie considérablement l'expérience utilisateur
  const selectSuggestedCity = (city: string) => {
    setFormData(prev => ({ ...prev, location: city }));
  };

  // Fonction principale de soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérification de l'authentification avant tout traitement
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour publier une annonce",
        variant: "destructive"
      });
      return;
    }

    // Validation complète de tous les champs obligatoires
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Validation spécifique pour les images - requirement business important
    if (imageFiles.length === 0) {
      toast({
        title: "Images requises", 
        description: "Veuillez ajouter au moins une image",
        variant: "destructive"
      });
      return;
    }

    // Conversion du nom de catégorie en ID pour la base de données
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
      // Téléchargement des images en premier - cette opération peut prendre du temps
      const imageUrls = await uploadImages(imageFiles);
      
      // Construction de l'objet de données pour l'API
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price), // Conversion en nombre pour la base de données
        category_id: categoryId, // Utilisation de l'ID réel de catégorie
        location: formData.location,
        condition: formData.condition,
        phone: formData.phone,
        images: imageUrls,
        currency: "XOF" // Devise du Burkina Faso
      };

      // Appel à l'API pour créer l'annonce
      const newListing = await createListing(listingData);
      
      if (newListing) {
        // Redirection vers le dashboard en cas de succès
        navigate('/merchant-dashboard');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'annonce",
        variant: "destructive"
      });
      console.error('Erreur de publication:', error);
    }
  };

  // Fonction générique pour mettre à jour les données du formulaire
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Publier une annonce
          </h1>
          <p className="text-muted-foreground">
            Remplissez les informations pour publier votre annonce sur FasoMarket
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section de téléchargement des photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos de votre article</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Grille d'affichage des images téléchargées */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      {/* Bouton de suppression qui n'apparaît qu'au survol */}
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
                  
                  {/* Zone de téléchargement si la limite n'est pas atteinte */}
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
                
                {/* Informations sur l'état du téléchargement */}
                <p className="text-sm text-muted-foreground">
                  Ajoutez jusqu'à 8 photos de qualité (formats JPG, PNG) - {imagePreviews.length}/8
                </p>
                {uploading && (
                  <p className="text-sm text-primary animate-pulse">
                    Téléchargement des images en cours...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section des informations générales de l'annonce */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Titre de l'annonce - champ critique pour l'attractivité */}
              <div>
                <Label htmlFor="title">Titre de l'annonce *</Label>
                <Input
                  id="title"
                  placeholder="Ex: iPhone 13 Pro Max 256GB, État neuf avec accessoires"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Soyez précis et attractif - ce titre apparaîtra dans les résultats de recherche
                </p>
              </div>

              {/* Description détaillée */}
              <div>
                <Label htmlFor="description">Description complète *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre article en détail : état, caractéristiques, raison de la vente..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Une description détaillée augmente vos chances de vente ({formData.description.length}/2000)
                </p>
              </div>

              {/* Prix et catégorie sur la même ligne pour optimiser l'espace */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prix de vente (XOF) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Ex: 450000"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Prix en Francs CFA (XOF)
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Section localisation simplifiée - remplacement du système GPS */}
              <div>
                <Label htmlFor="location">Où se trouve votre article ? *</Label>
                <div className="space-y-3">
                  <Input
                    id="location"
                    placeholder="Ex: Ouagadougou - Secteur 15, Bobo-Dioulasso - Quartier Diarradougou..."
                    value={formData.location}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    required
                  />
                  
                  {/* Suggestions de villes pour accélérer la saisie */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground self-center">Villes principales :</span>
                    {burkinaCities.slice(0, 6).map((city) => (
                      <Button
                        key={city}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => selectSuggestedCity(city)}
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Précisez votre quartier ou secteur pour faciliter les rencontres avec les acheteurs
                  </p>
                </div>
              </div>

              {/* État de l'article - information cruciale pour les acheteurs */}
              <div>
                <Label>Dans quel état est votre article ?</Label>
                <RadioGroup 
                  value={formData.condition} 
                  onValueChange={(value) => handleInputChange("condition", value)}
                  className="flex gap-8 mt-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="font-normal">
                      Neuf
                      <span className="block text-xs text-muted-foreground">Jamais utilisé, encore emballé</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="used" id="used" />
                    <Label htmlFor="used" className="font-normal">
                      Occasion
                      <span className="block text-xs text-muted-foreground">Déjà utilisé, en bon état</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Section contact - informations essentielles pour la transaction */}
          <Card>
            <CardHeader>
              <CardTitle>Vos informations de contact</CardTitle>
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
                <p className="text-sm text-muted-foreground mt-2">
                  Ce numéro sera visible par les acheteurs intéressés pour vous contacter directement. 
                  Assurez-vous qu'il soit correct et actif.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action principaux avec aperçu fonctionnel */}
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={handlePreview}
              disabled={!canShowPreview() || uploading}
              title={!canShowPreview() ? "Remplissez les champs obligatoires pour voir l'aperçu" : "Voir comment votre annonce apparaîtra aux acheteurs"}
            >
              <Eye className="h-4 w-4 mr-2" />
              {canShowPreview() ? "Aperçu" : "Aperçu (champs requis)"}
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={creatingListing || uploading || !user}
            >
              {creatingListing || uploading ? "Publication en cours..." : "Publier l'annonce"}
            </Button>
          </div>

          {/* Informations supplémentaires pour rassurer l'utilisateur */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              En publiant cette annonce, vous acceptez nos conditions d'utilisation. 
              Votre annonce sera visible immédiatement après validation.
            </p>
          </div>
        </form>
      </main>

      {/* Modal d'aperçu conditionnel - ne s'affiche que quand nécessaire */}
      {showPreview && (
        <ListingPreview
          formData={{
            title: formData.title,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            location: formData.location,
            condition: formData.condition,
            phone: formData.phone,
            imageUrls: imagePreviews // Utilise les URLs temporaires créées lors du téléchargement
          }}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          userFullName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Utilisateur"}
        />
      )}

      <Footer />
    </div>
  );
};

export default PublishListing;