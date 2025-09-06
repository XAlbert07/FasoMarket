// components/CategoriesGrid.tsx

import { Link } from "react-router-dom"
import { Car, Home, Smartphone, Shirt, Sofa, Briefcase, Heart, MoreHorizontal, RefreshCw, AlertCircle } from "lucide-react"
import { useCategories } from "@/hooks/useCategories"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mapping des icônes string vers les composants Lucide React
const IconComponents = {
  Car,
  Home,
  Smartphone,
  Shirt,
  Sofa,
  Briefcase,
  Heart,
  MoreHorizontal
} as const;

// Type pour s'assurer que nous utilisons des icônes valides
type IconName = keyof typeof IconComponents;

export const CategoriesGrid = () => {
  const { categories, loading, error, refreshCategories } = useCategories();

  // Fonction pour obtenir le composant d'icône à partir du nom
  const getIconComponent = (iconName: string): React.ComponentType<any> => {
    // Vérifier si l'iconName correspond à une clé valide
    if (iconName in IconComponents) {
      return IconComponents[iconName as IconName];
    }
    // Retourner l'icône par défaut si l'icône n'est pas trouvée
    return MoreHorizontal;
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <section className="py-16 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Explorez par catégorie
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez des milliers d'annonces dans toutes les catégories, 
              partout au Burkina Faso
            </p>
          </div>

          {/* Animation de chargement avec des squelettes de cartes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Créer 8 cartes squelettes pour simuler le chargement */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="relative overflow-hidden rounded-xl bg-card border border-card-border p-6 animate-pulse"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-muted rounded-lg w-12 h-12 mb-4"></div>
                  <div className="bg-muted rounded w-20 h-6 mb-2"></div>
                  <div className="bg-muted rounded w-16 h-4"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Indicateur de chargement central */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center text-muted-foreground">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Chargement des catégories...
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Affichage en cas d'erreur avec possibilité de réessayer
  if (error) {
    return (
      <section className="py-16 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Explorez par catégorie
            </h2>
          </div>

          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-4">
              <span>
                Une erreur s'est produite lors du chargement des catégories : {error}
              </span>
              <Button 
                onClick={refreshCategories} 
                variant="outline" 
                size="sm"
                className="self-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  // Affichage normal avec les données récupérées
  return (
    <section className="py-16 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Explorez par catégorie
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez des milliers d'annonces dans toutes les catégories, 
            partout au Burkina Faso
          </p>
        </div>

        {/* Afficher un message si aucune catégorie n'est disponible */}
        {categories.length === 0 ? (
          <div className="text-center">
            <Alert className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune catégorie n'est disponible pour le moment. 
                Les catégories apparaîtront ici une fois que des annonces seront publiées.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => {
              // Récupérer le composant d'icône approprié
              const IconComponent = getIconComponent(category.icon);
              
              return (
                <Link
                  key={category.id}
                  to={category.href}
                  className="group relative overflow-hidden rounded-xl bg-card border border-card-border p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`${category.color} p-3 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="font-heading font-semibold text-lg mb-1 text-card-foreground">
                      {category.name}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground">
                      {category.count} annonces
                    </p>
                  </div>

                  {/* Effet de survol avec dégradé */}
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl" />
                  
                  {/* Badge pour les catégories populaires (plus de 100 annonces) */}
                  {category.listing_count > 100 && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                      Populaire
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Bouton de rafraîchissement discret pour les administrateurs */}
        <div className="text-center mt-8">
          <Button
            onClick={refreshCategories}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser les données
          </Button>
        </div>
      </div>
    </section>
  );
};