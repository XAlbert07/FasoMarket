import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import heroImage from "@/assets/hero-marketplace.jpg"

export const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/listings?${params.toString()}`);
  };
  return (
    <section className="relative overflow-hidden bg-gradient-surface">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage}
          alt="Marché de Ouagadougou"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
            Acheter et vendre
            <span className="block text-gradient-primary bg-gradient-hero bg-clip-text text-transparent">
              localement
            </span>
            au Burkina Faso
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Trouvez tout ce dont vous avez besoin près de chez vous. 
            Contactez directement. Négociez en toute confiance.
          </p>

           {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Que recherchez-vous ?" 
                  className="pl-10 h-12 text-base border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="md:w-64 relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Ville ou région" 
                  className="pl-10 h-12 text-base border-border"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <Button type="submit" variant="hero" size="lg" className="h-12 px-8">
                <Search className="mr-2 h-5 w-5" />
                Rechercher
              </Button>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="mt-6">
            <p className="text-white/70 text-sm mb-3">Recherches populaires :</p>
            <div className="flex flex-wrap gap-2">
              {["Téléphones", "Voitures", "Maisons", "Motos", "Électroménager"].map((tag) => (
                <button
                  key={tag}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}