import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useListings } from '@/hooks/useListings';
import { useFavorites } from '@/hooks/useFavorites';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Heart, MapPin, Eye, Calendar, Search, Filter, Grid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const CategoryListings = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { listings, loading, fetchListings } = useListings();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showFilters, setShowFilters] = useState(false);

  // Noms de catégories lisibles
  const categoryNames: Record<string, string> = {
    'vehicules': 'Véhicules',
    'immobilier': 'Immobilier',
    'telephones': 'Téléphones',
    'mode': 'Mode',
    'maison': 'Maison',
    'emploi': 'Emploi',
    'loisirs': 'Loisirs',
    'autres': 'Autres'
  };

  const categoryName = category ? categoryNames[category] || category : 'Toutes les annonces';

  useEffect(() => {
    const filters = {
      category: categoryName !== 'Toutes les annonces' ? categoryName : undefined,
      query: searchQuery || undefined,
      location: location || undefined,
      condition: condition as 'new' | 'used' | undefined,
      sortBy: sortBy as any,
      priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
      priceMax: priceRange[1] < 1000000 ? priceRange[1] : undefined
    };

    fetchListings(filters);

    // Mettre à jour l'URL
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    if (condition) params.set('condition', condition);
    if (sortBy !== 'date') params.set('sort', sortBy);
    
    setSearchParams(params);
  }, [category, searchQuery, location, condition, sortBy, priceRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Le useEffect se chargera de la recherche
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2">{categoryName}</h1>
          <p className="text-muted-foreground">
            {loading ? 'Chargement...' : `${listings.length} annonces trouvées`}
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans cette catégorie..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>

              {showFilters && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Localisation</label>
                      <Input
                        placeholder="Ville..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">État</label>
                      <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les états" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous les états</SelectItem>
                          <SelectItem value="new">Neuf</SelectItem>
                          <SelectItem value="used">Occasion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Trier par</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Plus récent</SelectItem>
                          <SelectItem value="price_asc">Prix croissant</SelectItem>
                          <SelectItem value="price_desc">Prix décroissant</SelectItem>
                          <SelectItem value="views">Plus vus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-4 block">
                      Prix: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} FCFA
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000000}
                      step={10000}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Résultats */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des annonces...</p>
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Aucune annonce trouvée</h2>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche ou de filtrage.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {listings.map((listing) => (
              <Card key={listing.id} className={`group hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}>
                <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className={`object-cover ${
                        viewMode === 'list' 
                          ? 'w-full h-full rounded-l-lg' 
                          : 'w-full h-48 rounded-t-lg'
                      }`}
                    />
                  ) : (
                    <div className={`bg-muted flex items-center justify-center ${
                      viewMode === 'list' 
                        ? 'w-full h-full rounded-l-lg' 
                        : 'w-full h-48 rounded-t-lg'
                    }`}>
                      <span className="text-muted-foreground">Aucune image</span>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={() => toggleFavorite(listing.id)}
                  >
                    <Heart className={`h-4 w-4 ${
                      isFavorite(listing.id) ? 'fill-red-500 text-red-500' : ''
                    }`} />
                  </Button>

                  {/* ✅ Vérification sécurisée de featured */}
                  {listing.featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
                      En vedette
                    </Badge>
                  )}
                </div>

                <div className="flex-1">
                  <CardHeader className={viewMode === 'list' ? 'pb-2' : 'pb-3'}>
                    <CardTitle className={`line-clamp-2 group-hover:text-primary transition-colors ${
                      viewMode === 'list' ? 'text-lg' : ''
                    }`}>
                      <Link to={`/listing/${listing.id}`}>
                        {listing.title}
                      </Link>
                    </CardTitle>
                    <div className="text-2xl font-bold text-primary">
                      {listing.price.toLocaleString()} FCFA
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {listing.location}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDistanceToNow(new Date(listing.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </div>

                      {/* ✅ Utilisation de views_count avec fallback */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Eye className="h-4 w-4 mr-1" />
                        {listing.views_count || 0} vues
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant={listing.condition === 'new' ? 'default' : 'secondary'}>
                          {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                        </Badge>
                        <Badge variant="outline">
                          {listing.category || 'Non classé'}
                        </Badge>
                      </div>
                    </div>

                    {viewMode === 'grid' && (
                      <div className="mt-4">
                        <Button asChild className="w-full">
                          <Link to={`/listing/${listing.id}`}>
                            Voir les détails
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryListings;