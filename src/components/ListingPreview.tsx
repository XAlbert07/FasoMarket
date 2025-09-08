import { useState } from "react";
import { X, Heart, Share2, Phone, MapPin, Eye, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Interface pour les données du formulaire qui seront passées au composant
interface FormDataForPreview {
  title: string;
  description: string;
  price: string;
  category: string;
  location: string;
  condition: "new" | "used";
  phone: string;
  imageUrls: string[]; // URLs temporaires des images prévisualisées
}

interface ListingPreviewProps {
  formData: FormDataForPreview;
  isOpen: boolean;
  onClose: () => void;
  userFullName?: string; // Nom de l'utilisateur connecté pour l'affichage
}

const ListingPreview = ({ formData, isOpen, onClose, userFullName = "Vous" }: ListingPreviewProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  // Utilisation des images du formulaire ou image placeholder si aucune
  const displayImages = formData.imageUrls.length > 0 
    ? formData.imageUrls 
    : ['/placeholder.svg'];

  // Formatage du prix avec la devise locale
  const formatPrice = (priceString: string) => {
    const price = parseFloat(priceString);
    return isNaN(price) ? "Prix à définir" : `${price.toLocaleString()} XOF`;
  };

  // Détermination du badge de condition
  const getConditionBadge = () => {
    return formData.condition === 'new' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Neuf</Badge>
    ) : (
      <Badge variant="outline">Occasion</Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full p-4">
        {/* Header avec indication claire qu'il s'agit d'un aperçu */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/95 backdrop-blur-sm py-4 z-10">
          <div>
            <h1 className="text-2xl font-heading font-bold">Aperçu de votre annonce</h1>
            <p className="text-sm text-muted-foreground">
              Voici comment votre annonce apparaîtra aux acheteurs
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="focus-ring"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Section principale - Informations de l'annonce */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Galerie d'images avec navigation */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    <AspectRatio ratio={4/3} className="overflow-hidden rounded-lg">
                      <img
                        src={displayImages[currentImageIndex]}
                        alt={formData.title || "Aperçu de l'annonce"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback vers placeholder si l'image ne charge pas
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </AspectRatio>
                    
                    {/* Indicateurs de navigation si plusieurs images */}
                    {displayImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <div className="flex gap-2 bg-black/50 rounded-full px-3 py-1">
                          {displayImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Miniatures si plusieurs images */}
                  {displayImages.length > 1 && (
                    <div className="p-4">
                      <div className="grid grid-cols-4 gap-2">
                        {displayImages.slice(0, 4).map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                              index === currentImageIndex 
                                ? 'border-primary shadow-lg' 
                                : 'border-transparent hover:border-muted-foreground'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`Aperçu ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {index === 3 && displayImages.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                                +{displayImages.length - 4}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations détaillées de l'annonce */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    
                    {/* Titre et actions rapides */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                          {formData.title || "Titre de votre annonce"}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Maintenant
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            0 vue
                          </div>
                        </div>
                      </div>
                      
                      {/* Boutons d'action (désactivés en aperçu) */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="icon" disabled>
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" disabled>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Prix avec mise en évidence */}
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(formData.price)}
                    </div>

                    {/* Badges informatifs */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge variant="secondary">
                        {formData.category || "Catégorie"}
                      </Badge>
                      {formData.condition && getConditionBadge()}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {formData.location || "Localisation"}
                      </div>
                    </div>

                    {/* Description complète */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {formData.description || "Aucune description fournie."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Contact et informations complémentaires */}
            <div className="space-y-6">
              
              {/* Section vendeur */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Vendeur
                  </h3>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {userFullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{userFullName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Nouveau membre
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section contact */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Contact</h3>
                  
                  <div className="space-y-3">
                    {!phoneRevealed ? (
                      <Button
                        className="w-full"
                        onClick={() => setPhoneRevealed(true)}
                        disabled={!formData.phone}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {formData.phone ? "Afficher le numéro" : "Numéro non renseigné"}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span className="font-mono">
                              {formData.phone || "Numéro manquant"}
                            </span>
                          </div>
                        </div>
                        <Button className="w-full" disabled>
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler
                        </Button>
                      </div>
                    )}
                    
                    <Button variant="outline" className="w-full" disabled>
                      Envoyer un message
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Conseils de sécurité - inchangés */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Conseils de sécurité</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Rencontrez le vendeur dans un lieu public</li>
                    <li>• Vérifiez l'article avant de payer</li>
                    <li>• Ne payez jamais à l'avance</li>
                    <li>• Signaler les annonces suspectes</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Actions d'aperçu */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button onClick={onClose} variant="outline" className="w-full">
                      Retour au formulaire
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Ceci est un aperçu. Publiez votre annonce pour la rendre visible.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPreview;