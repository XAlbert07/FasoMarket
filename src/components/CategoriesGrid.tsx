// components/CategoriesGrid.tsx 

import { useState } from "react"
import { Link } from "react-router-dom"
import { Car, Home, Smartphone, Shirt, Sofa, Briefcase, Heart, MoreHorizontal, RefreshCw, AlertCircle, ChevronRight, Grid3X3 } from "lucide-react"
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

type IconName = keyof typeof IconComponents;

export const CategoriesGrid = () => {
  const { categories, loading, error, refreshCategories } = useCategories();
  const [showAll, setShowAll] = useState(false);

  // Fonction pour obtenir le composant d'icône à partir du nom
  const getIconComponent = (iconName: string): React.ComponentType<any> => {
    if (iconName in IconComponents) {
      return IconComponents[iconName as IconName];
    }
    return MoreHorizontal;
  };

  // Logique de gestion du nombre de catégories affichées
  // Sur mobile : 6 principales + bouton "Voir plus"
  // Sur desktop : toutes visibles d'emblée
  const displayedCategories = showAll ? categories : categories.slice(0, 6);
  const hasMoreCategories = categories.length > 6;

  // Affichage pendant le chargement - Version mobile optimisée
  if (loading) {
    return (
      <section className="py-8 md:py-16 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center md:text-left mb-6 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2 md:mb-4">
              Explorez par catégorie
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl md:mx-auto lg:mx-0">
              Découvrez des milliers d'annonces dans toutes les catégories, 
              partout au Burkina Faso
            </p>
          </div>

          {/* Squelettes de chargement adaptés mobile-first */}
          <div className="space-y-3 md:hidden">
            {/* Version mobile : liste verticale de squelettes */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`mobile-skeleton-${index}`}
                className="flex items-center p-4 bg-card border border-card-border rounded-lg animate-pulse"
              >
                <div className="bg-muted rounded-lg w-12 h-12 mr-4 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="bg-muted rounded w-24 h-5 mb-2"></div>
                  <div className="bg-muted rounded w-16 h-4"></div>
                </div>
                <div className="bg-muted rounded w-4 h-4 ml-2"></div>
              </div>
            ))}
          </div>

          {/* Version desktop : grid de squelettes */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`desktop-skeleton-${index}`}
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

          <div className="text-center mt-6">
            <div className="inline-flex items-center text-muted-foreground">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Chargement des catégories...
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <section className="py-8 md:py-16 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2 md:mb-4">
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

  // Affichage principal
  return (
    <section className="py-8 md:py-16 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center md:text-left mb-6 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2 md:mb-4">
            Explorez par catégorie
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl md:mx-auto lg:mx-0">
            Découvrez des milliers d'annonces dans toutes les catégories, 
            partout au Burkina Faso
          </p>
        </div>

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
          <>
            {/* AFFICHAGE MOBILE : Liste verticale avec navigation fluide */}
            <div className="block md:hidden">
              <div className="space-y-3">
                {displayedCategories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  
                  return (
                    <Link
                      key={category.id}
                      to={category.href}
                      className="group flex items-center p-4 bg-card border border-card-border rounded-lg hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                    >
                      {/* Icône avec couleur de catégorie */}
                      <div className={`${category.color} p-3 rounded-lg mr-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      
                      {/* Contenu principal */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-base text-card-foreground mb-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {category.count} annonce{parseInt(category.count.replace(/\D/g, '')) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      {/* Badge populaire mobile - CORRECTION: Comparaison numérique correcte */}
                      {category.listing_count > 100 && (
                        <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium mr-2 flex-shrink-0">
                          Populaire
                        </div>
                      )}
                      
                      {/* Icône de navigation */}
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>

              {/* Bouton "Voir plus" sur mobile */}
              {hasMoreCategories && !showAll && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowAll(true)}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Voir toutes les catégories ({categories.length - 6} de plus)
                </Button>
              )}

              {/* Bouton "Voir moins" sur mobile */}
              {showAll && hasMoreCategories && (
                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => setShowAll(false)}
                >
                  Afficher moins de catégories
                </Button>
              )}
            </div>

            {/* AFFICHAGE DESKTOP : Grid classique maintenu et amélioré */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {categories.map((category) => {
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
                      
                      <h3 className="font-heading font-semibold text-lg mb-1 text-card-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground">
                        {category.count} annonce{parseInt(category.count.replace(/\D/g, '')) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Effet de survol avec dégradé */}
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl" />
                    
                    {/* Badge pour les catégories populaires - CORRECTION: Comparaison numérique correcte */}
                    {category.listing_count > 100 && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                        Populaire
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Bouton de rafraîchissement - maintenant discret */}
        <div className="text-center mt-6 md:mt-8">
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