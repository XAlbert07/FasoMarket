import { MapPin, Clock, Eye, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

const recentListings = [
  {
    id: 1,
    title: "iPhone 14 Pro Max 256GB - État neuf",
    price: "450,000",
    currency: "FCFA",
    location: "Ouagadougou, Secteur 15",
    image: "/api/placeholder/300/200",
    timeAgo: "Il y a 2h",
    views: 24,
    isNew: true
  },
  {
    id: 2,
    title: "Toyota Corolla 2018 - Automatique",
    price: "8,500,000",
    currency: "FCFA",
    location: "Bobo-Dioulasso, Centre-ville",
    image: "/api/placeholder/300/200",
    timeAgo: "Il y a 4h",
    views: 67,
    isNew: false
  },
  {
    id: 3,
    title: "Villa 4 chambres avec piscine",
    price: "25,000,000",
    currency: "FCFA",
    location: "Ouagadougou, Zone du Bois",
    image: "/api/placeholder/300/200",
    timeAgo: "Il y a 1 jour",
    views: 156,
    isNew: false
  },
  {
    id: 4,
    title: "Moto Yamaha 125cc - Très bon état",
    price: "850,000",
    currency: "FCFA",
    location: "Koudougou, Centre",
    image: "/api/placeholder/300/200",
    timeAgo: "Il y a 1 jour",
    views: 43,
    isNew: false
  },
  {
    id: 5,
    title: "MacBook Pro M2 - Comme neuf",
    price: "1,200,000",
    currency: "FCFA",
    location: "Ouagadougou, Secteur 30",
    image: "/api/placeholder/300/200",
    timeAgo: "Il y a 2 jours",
    views: 89,
    isNew: false
  },
  {
    id: 6,
    title: "Terrain 500m² - Titre foncier",
    price: "12,000,000",
    currency: "FCFA",
    location: "Ouaga 2000",
    image: "/api/placeholder/300/200",
    timeAgo: "Il y a 3 jours",
    views: 203,
    isNew: false
  }
]

export const RecentListings = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Annonces récentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Les dernières opportunités près de chez vous
            </p>
          </div>
          
          <Button variant="outline" className="hidden md:flex">
            Voir toutes les annonces
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentListings.map((listing) => (
            <div
              key={listing.id}
              className="group bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {listing.isNew && (
                    <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
                      Nouveau
                    </span>
                  )}
                </div>
                
                {/* Favorite Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 bg-white/80 hover:bg-white text-muted-foreground hover:text-primary backdrop-blur-sm"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                
                {/* Stats */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white text-sm">
                  <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
                    <Eye className="h-3 w-3" />
                    {listing.views}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {listing.title}
                </h3>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-primary">
                    {parseInt(listing.price).toLocaleString()} {listing.currency}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {listing.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {listing.timeAgo}
                  </div>
                </div>
                
                <Button variant="cta" className="w-full">
                  Contacter le vendeur
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile View All Button */}
        <div className="md:hidden mt-8 text-center">
          <Button variant="outline" className="w-full">
            Voir toutes les annonces
          </Button>
        </div>
      </div>
    </section>
  )
}