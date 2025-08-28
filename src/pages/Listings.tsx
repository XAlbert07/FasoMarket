import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, Heart, Phone } from "lucide-react";

const Listings = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  
  // Mock data - à remplacer par les vraies données
  const mockListings = [
    {
      id: 1,
      title: "iPhone 13 Pro Max 256GB",
      price: 450000,
      location: "Ouagadougou, Zone du Bois",
      category: "Électronique",
      image: "/placeholder.svg",
      views: 45,
      isNew: true,
      phone: "+226 70 12 34 56"
    },
    {
      id: 2,
      title: "Villa 4 chambres avec piscine",
      price: 85000000,
      location: "Ouagadougou, Ouaga 2000",
      category: "Immobilier",
      image: "/placeholder.svg",
      views: 128,
      isNew: false,
      phone: "+226 76 98 76 54"
    },
    {
      id: 3,
      title: "Toyota Corolla 2019",
      price: 12500000,
      location: "Bobo-Dioulasso, Secteur 25",
      category: "Véhicules",
      image: "/placeholder.svg",
      views: 89,
      isNew: false,
      phone: "+226 78 45 67 89"
    }
  ];

  const [favorites, setFavorites] = useState<number[]>([]);
  const [revealedPhones, setRevealedPhones] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const revealPhone = (id: number) => {
    setRevealedPhones(prev => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            {query ? `Résultats pour "${query}"` : "Toutes les annonces"}
          </h1>
          <p className="text-muted-foreground">
            {mockListings.length} annonces trouvées
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockListings.map((listing) => (
            <Card key={listing.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="relative">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={() => toggleFavorite(listing.id)}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favorites.includes(listing.id)
                        ? "fill-destructive text-destructive"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
                {listing.isNew && (
                  <Badge className="absolute top-2 left-2 bg-primary">
                    Nouveau
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {listing.title}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {listing.price.toLocaleString()} XOF
                    </span>
                    <Badge variant="secondary">{listing.category}</Badge>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {listing.location}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Eye className="h-4 w-4 mr-1" />
                    {listing.views} vues
                  </div>

                  <div className="pt-2 space-y-2">
                    <Button className="w-full" asChild>
                      <a href={`/listing/${listing.id}`}>
                        Voir les détails
                      </a>
                    </Button>
                    
                    {revealedPhones.includes(listing.id) ? (
                      <div className="flex items-center justify-center space-x-2 p-2 bg-muted rounded">
                        <Phone className="h-4 w-4" />
                        <span className="font-mono">{listing.phone}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(listing.phone)}
                        >
                          Copier
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => revealPhone(listing.id)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Afficher le numéro
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Listings;