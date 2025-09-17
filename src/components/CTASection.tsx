import { useState } from "react"
import { Plus, Search, Shield, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"

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


  const handleListings = () => {
  const navigate = useNavigate();

  const handleListings = () => {
    navigate("/listings"); // redirige vers la page /listings
  };
};


  const handlePublish = () => {
    const navigate = useNavigate();

    const handlePublish = () => {
      navigate("/publish"); // redirige vers le formulaire de pubblication
    };
  };


  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern - Optimisé pour mobile */}
      <div className="absolute inset-0 opacity-5 sm:opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] repeat" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 relative">
        {/* Titre principal - Mobile-first avec espacement optimisé */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 sm:mb-6 leading-tight">
            Rejoignez la nouvelle
            <span className="block">marketplace burkinabè</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2">
            FasoMarket démarre sa mission : connecter acheteurs et vendeurs 
            dans tout le Burkina Faso. Soyez parmi les premiers !
          </p>
        </div>

        {/* Avantages d'être pionnier - Remplace les fausses stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Pionniers
            </div>
            <div className="text-white/80 text-sm sm:text-base">
              Rejoignez les premiers utilisateurs
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Gratuit
            </div>
            <div className="text-white/80 text-sm sm:text-base">
              Publiez vos annonces sans frais
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Support
            </div>
            <div className="text-white/80 text-sm sm:text-base">
              Accompagnement personnalisé
            </div>
          </div>
        </div>

        {/* Boutons d'action - Optimisés pour mobile */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-8 sm:mb-12 lg:mb-16 px-4 sm:px-0">
          <Button 
            variant="secondary" 
            size="xl" 
            className="bg-white text-primary hover:bg-white/90 w-full sm:min-w-[200px] sm:w-auto text-base sm:text-lg font-semibold py-3 sm:py-4" 
          >
            <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            <Link to="/publish" onClick={handlePublish} >
            
             Publier une annonce
            </Link>
            
          </Button>
          
          <Button 
            variant="secondary" 
            size="xl" 
            className="bg-white text-primary hover:bg-white/90 w-full sm:min-w-[200px] sm:w-auto text-base sm:text-lg font-semibold py-3 sm:py-4" 
          
          >
             <Search className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            <Link to="/listings" onClick={handleListings}>
             
                Parcourir les annonces
            </Link>
           
          </Button>
        </div>

        {/* Avantages - Layout mobile-first */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-white/20 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="font-heading font-semibold text-white mb-2 text-lg sm:text-xl">
              Sécurisé
            </h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Modération active et signalement pour votre sécurité
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/20 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="font-heading font-semibold text-white mb-2 text-lg sm:text-xl">
              Local
            </h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Conçu spécialement pour le marché burkinabè
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/20 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="font-heading font-semibold text-white mb-2 text-lg sm:text-xl">
              Simple
            </h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Interface intuitive et contact direct instantané
            </p>
          </div>
        </div>

        {/* Message d'encouragement pour early adopters */}
        <div className="text-center mt-8 sm:mt-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-auto">
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              <span className="font-semibold">Lancez-vous avec nous !</span><br />
              Votre avis compte pour façonner la marketplace de demain au Burkina Faso.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}