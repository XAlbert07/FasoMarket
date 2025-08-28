import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export const CTASection = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast({
        title: "Inscription réussie !",
        description: "Vous recevrez nos dernières annonces par email.",
      });
      setEmail("");
    }
  };
  return (
    <section className="py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] repeat" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Rejoignez la communauté
            <span className="block">FasoMarket</span>
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Des milliers de Burkinabè utilisent déjà FasoMarket pour vendre 
            et acheter en toute confiance. Rejoignez-les aujourd'hui !
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {[
            { label: "Annonces actives", value: "12,000+" },
            { label: "Utilisateurs", value: "45,000+" },
            { label: "Villes couvertes", value: "15+" },
            { label: "Transactions réussies", value: "8,500+" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-white/80 text-sm md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16">
          <Button variant="secondary" size="xl" className="bg-white text-primary hover:bg-white/90 min-w-[200px]" asChild>
            <Link to="/publish">
              <Plus className="mr-2 h-5 w-5" />
              Publier une annonce
            </Link>
          </Button>
          
          <Button variant="outline" size="xl" className="border-white text-white hover:bg-white hover:text-primary min-w-[200px]" asChild>
            <Link to="/listings">
              <Search className="mr-2 h-5 w-5" />
              Parcourir les annonces
            </Link>
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-white/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-heading font-semibold text-white mb-2">
              Sécurisé
            </h3>
            <p className="text-white/80 text-sm">
              Modération active et signalement pour votre sécurité
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-heading font-semibold text-white mb-2">
              Communauté
            </h3>
            <p className="text-white/80 text-sm">
              Connectez-vous avec des vendeurs et acheteurs locaux
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-heading font-semibold text-white mb-2">
              Facilité
            </h3>
            <p className="text-white/80 text-sm">
              Recherche intuitive et contact direct avec les vendeurs
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}