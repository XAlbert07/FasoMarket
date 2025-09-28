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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, X, Eye, ChevronLeft, ChevronRight, Camera, MapPin, CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateListing } from "@/hooks/useListings";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuthContext } from "@/contexts/AuthContext";
import ListingPreview from "@/components/ListingPreview";

const PublishListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createListing, loading: creatingListing } = useCreateListing();
  const { uploadImages, uploading } = useImageUpload();
  
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    condition: "new" as "new" | "used",
    phone: ""
  });

  // ÉTATS : Spécifiques à l'interface mobile pour la navigation par étapes
  const [currentStep, setCurrentStep] = useState(0);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);

  // Configuration des catégories identique
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
  
  const burkinaCities = [
    "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora",
    "Ouahigouya", "Pouytenga", "Dédougou", "Kaya",
    "Fada N'Gourma", "Tenkodogo", "Réo", "Gaoua"
  ];

  // Toutes les fonctions métier 
  const getCategoryIdByName = (name: string) => {
    const category = categories.find(cat => cat.name === name);
    return category ? category.id : null;
  };

  const canShowPreview = () => {
    return formData.title.trim() !== "" && 
           formData.description.trim() !== "" && 
           formData.price.trim() !== "" && 
           formData.category !== "" && 
           formData.location.trim() !== "";
  };

  const handlePreview = () => {
    if (!canShowPreview()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir au moins les champs obligatoires pour voir l'aperçu",
        variant: "destructive"
      });
      return;
    }
    
    setShowPreview(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = imageFiles.length + newFiles.length;
      
      if (totalFiles > 8) {
        toast({
          title: "Limite atteinte",
          description: "Vous ne pouvez télécharger que 8 images maximum",
          variant: "destructive"
        });
        return;
      }

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImageFiles(prev => [...prev, ...newFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
      
      // Marquer l'étape images comme complétée
      updateStepCompletion(0, newFiles.length > 0);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    
    //  Mise à jour du statut de l'étape
    updateStepCompletion(0, newFiles.length > 0);
  };

  const handleLocationInput = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
    setShowLocationSuggestions(value.length > 0);
    
    // Validation temps réel pour la navigation mobile
    updateStepCompletion(2, value.trim() !== "");
  };

  const selectSuggestedCity = (city: string) => {
    setFormData(prev => ({ ...prev, location: city }));
    setShowLocationSuggestions(false);
    updateStepCompletion(2, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour publier une annonce",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (imageFiles.length === 0) {
      toast({
        title: "Images requises", 
        description: "Veuillez ajouter au moins une image",
        variant: "destructive"
      });
      return;
    }

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
      const imageUrls = await uploadImages(imageFiles);
      
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: categoryId,
        location: formData.location,
        condition: formData.condition,
        phone: formData.phone,
        images: imageUrls,
        currency: "XOF"
      };

      const newListing = await createListing(listingData);
      
      if (newListing) {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validation temps réel pour le parcours mobile
    switch (field) {
      case 'title':
      case 'description':
      case 'price':
      case 'category':
        updateStepCompletion(1, value.trim() !== "");
        break;
      case 'phone':
        updateStepCompletion(3, value.trim() !== "");
        break;
    }
  };

  // Gestion des étapes pour l'interface mobile
  const updateStepCompletion = (stepIndex: number, isCompleted: boolean) => {
    setCompletedSteps(prev => {
      const newSteps = [...prev];
      newSteps[stepIndex] = isCompleted;
      return newSteps;
    });
  };

  // Validation de chaque étape pour la navigation
  const getStepValidation = () => {
    return [
      imageFiles.length > 0, // Étape 1: Images
      formData.title && formData.description && formData.price && formData.category, // Étape 2: Infos générales
      formData.location.trim() !== "", // Étape 3: Localisation
      formData.phone.trim() !== "" // Étape 4: Contact
    ];
  };

  const goToNextStep = () => {
    const validations = getStepValidation();
    if (currentStep < 3 && validations[currentStep]) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completedStepsCount = getStepValidation().filter(Boolean).length;
  const progressPercentage = (completedStepsCount / 4) * 100;

  // Configuration des étapes pour l'interface mobile
  const steps = [
    {
      title: "Photos",
      description: "Ajoutez des photos attrayantes",
      icon: <Camera className="w-5 h-5" />,
      required: true
    },
    {
      title: "Informations", 
      description: "Détails de votre article",
      icon: <CheckCircle className="w-5 h-5" />,
      required: true
    },
    {
      title: "Localisation",
      description: "Où se trouve l'article",
      icon: <MapPin className="w-5 h-5" />,
      required: true
    },
    {
      title: "Contact",
      description: "Comment vous joindre",
      icon: <Eye className="w-5 h-5" />,
      required: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* MOBILE: Barre de progression sticky avec navigation intuitive */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3 md:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            
            <div className="text-sm font-medium">
              Étape {currentStep + 1} sur 4
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {steps[currentStep].title} - {steps[currentStep].description}
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        
        {/* DESKTOP: En-tête traditionnel conservé */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Publier une annonce
          </h1>
          <p className="text-muted-foreground">
            Remplissez les informations pour publier votre annonce sur FasoMarket
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          
          {/* MOBILE: Navigation par étapes - Interface intuitive pour petits écrans */}
          <div className="md:hidden">
            
            {/* Étape 1: Photos - Interface tactile optimisée */}
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photos de votre article
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Des photos de qualité augmentent vos chances de vente
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Galerie mobile-optimisée avec carrousel horizontal */}
                  {imagePreviews.length > 0 && (
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-2 pb-2">
                        {imagePreviews.map((image, index) => (
                          <div key={index} className="relative flex-shrink-0">
                            <img 
                              src={image} 
                              alt={`Image ${index + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => removeImage(index)}
                              disabled={uploading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  
                  {/* Zone de téléchargement tactile friendly */}
                  {imagePreviews.length < 8 && (
                    <label className="block border-2 border-dashed border-primary/25 rounded-lg p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors">
                      <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Touchez pour ajouter des photos</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formats JPG, PNG - Max 8 photos
                      </p>
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
                  
                  {/* Indicateur de progression pour mobile */}
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {imagePreviews.length}/8 photos ajoutées
                    </span>
                    {uploading && (
                      <p className="text-sm text-primary animate-pulse mt-1">
                        Téléchargement en cours...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Étape 2: Informations générales - Formulaire optimisé mobile */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div>
                    <Label htmlFor="mobile-title">Titre de l'annonce *</Label>
                    <Input
                      id="mobile-title"
                      placeholder="Ex: iPhone 13 Pro Max 256GB neuf"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                      maxLength={100}
                      className="text-base" // Évite le zoom sur iOS
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Titre accrocheur et précis
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="mobile-description">Description *</Label>
                    <Textarea
                      id="mobile-description"
                      placeholder="État, caractéristiques, raison de la vente..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      required
                      maxLength={2000}
                      className="text-base resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.description.length}/2000 caractères
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="mobile-price">Prix (F CFA) *</Label>
                    <Input
                      id="mobile-price"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="100"
                      placeholder="450000"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      required
                      className="text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile-category">Catégorie *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Choisir une catégorie" />
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

                  <div>
                    <Label>État de l'article</Label>
                    <RadioGroup 
                      value={formData.condition} 
                      onValueChange={(value) => handleInputChange("condition", value)}
                      className="flex flex-col gap-3 mt-2"
                    >
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="new" id="mobile-new" />
                        <Label htmlFor="mobile-new" className="font-normal flex-1">
                          <span className="block font-medium">Neuf</span>
                          <span className="text-xs text-muted-foreground">Jamais utilisé, emballage d'origine</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="used" id="mobile-used" />
                        <Label htmlFor="mobile-used" className="font-normal flex-1">
                          <span className="block font-medium">Occasion</span>
                          <span className="text-xs text-muted-foreground">Déjà utilisé, bon état général</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Étape 3: Localisation - Interface géographique simplifiée */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Localisation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Indiquez où se trouve votre article
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div>
                    <Label htmlFor="mobile-location">Ville / Quartier *</Label>
                    <Input
                      id="mobile-location"
                      placeholder="Ex: Ouagadougou - Secteur 15"
                      value={formData.location}
                      onChange={(e) => handleLocationInput(e.target.value)}
                      required
                      className="text-base"
                    />
                  </div>
                  
                  {/* Suggestions de villes en grille tactile */}
                  <div>
                    <p className="text-sm font-medium mb-3">Villes principales :</p>
                    <div className="grid grid-cols-2 gap-2">
                      {burkinaCities.slice(0, 8).map((city) => (
                        <Button
                          key={city}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="justify-start text-sm"
                          onClick={() => selectSuggestedCity(city)}
                        >
                          {city}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Conseil :</strong> Précisez votre quartier pour faciliter les rencontres avec les acheteurs
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Étape 4: Contact - Informations finales */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Contact et finalisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div>
                    <Label htmlFor="mobile-phone">Numéro de téléphone *</Label>
                    <Input
                      id="mobile-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="+226 70 12 34 56"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Les acheteurs vous contacteront sur ce numéro
                    </p>
                  </div>

                  {/* Récapitulatif visuel pour validation finale */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Récapitulatif</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Photos :</span>
                        <span>{imagePreviews.length} ajoutée(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Titre :</span>
                        <span className="text-right max-w-[150px] truncate">{formData.title || "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix :</span>
                        <span>{formData.price ? `${formData.price} XOF` : "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Catégorie :</span>
                        <span>{formData.category || "Non choisie"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lieu :</span>
                        <span className="text-right max-w-[150px] truncate">{formData.location || "Non indiqué"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions finales avec aperçu prioritaire sur mobile */}
                  <div className="space-y-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={handlePreview}
                      disabled={!canShowPreview() || uploading}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir l'aperçu
                    </Button>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={creatingListing || uploading || !user}
                      size="lg"
                    >
                      {creatingListing || uploading ? "Publication en cours..." : "Publier l'annonce"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* DESKTOP: Interface traditionnelle complète conservée */}
          <div className="hidden md:block space-y-8">
            
            <Card>
              <CardHeader>
                <CardTitle>Photos de votre article</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`Image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
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

            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix de vente (F CFA) *</Label>
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
                      Prix en Francs CFA (F CFA)
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

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                En publiant cette annonce, vous acceptez nos conditions d'utilisation. 
                Votre annonce sera visible immédiatement après validation.
              </p>
            </div>
          </div>

          {/* MOBILE: Navigation entre étapes - Barre flottante intuitive */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 md:hidden">
            <div className="container mx-auto max-w-md">
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={goToPreviousStep}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={goToNextStep}
                    disabled={!getStepValidation()[currentStep]}
                    className="flex-1"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={creatingListing || uploading || !user || !getStepValidation().every(Boolean)}
                    className="flex-1"
                  >
                    {creatingListing || uploading ? "Publication..." : "Publier"}
                  </Button>
                )}
              </div>
              
              {/* Indicateur de validation pour l'étape courante */}
              {!getStepValidation()[currentStep] && (
                <p className="text-xs text-center text-red-600 mt-2">
                  {currentStep === 0 && "Ajoutez au moins une photo"}
                  {currentStep === 1 && "Remplissez tous les champs obligatoires"}
                  {currentStep === 2 && "Indiquez votre localisation"}
                  {currentStep === 3 && "Saisissez votre numéro de téléphone"}
                </p>
              )}
            </div>
          </div>

          {/* Espace pour la barre de navigation mobile */}
          <div className="h-20 md:hidden" />
        </form>
      </main>

      {/* Modal d'aperçu identique */}
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
            imageUrls: imagePreviews
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