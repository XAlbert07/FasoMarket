import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, Plus, User, Menu, LogOut, Settings, PlusCircle, ListIcon, Heart, MessageCircle } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Header = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Cette ligne est la clé de la solution : récupération de l'état d'authentification
  const { user, profile, signOut, loading } = useAuthContext()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Fonction pour gérer le clic sur "Publier" selon l'état de connexion
  const handlePublishClick = (e) => {
    if (!user) {
      e.preventDefault()
      navigate("/login?redirect=publish&message=Connectez-vous pour publier une annonce")
    }
  }

  // Fonction pour gérer la déconnexion proprement
  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/")
      setIsMenuOpen(false)
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  // Fonction pour obtenir les initiales de l'utilisateur pour l'avatar
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
                <span className="text-sm font-bold text-white">F</span>
              </div>
              <span className="text-xl font-heading font-bold text-gradient-primary hover:opacity-80 transition-opacity">
                FasoMarket
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une annonce..."
                className="pl-10 bg-surface border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Publish Button */}
            <Button variant="cta" size="sm" className="hidden sm:flex" asChild>
              <Link to="/publish" onClick={handlePublishClick}>
                <Plus className="mr-1 h-4 w-4" />
                Publier
              </Link>
            </Button>
            
            {/* User Menu */}
            {loading ? (
              // Affichage pendant la vérification de l'authentification
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user && profile ? (
              // Interface pour utilisateur connecté
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={profile.full_name || "User"} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-md border shadow-lg" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link to="/my-profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mon Profil
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="flex items-center cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Mes favoris
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center cursor-pointer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Mes messages
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/mes-annonces" className="flex items-center cursor-pointer">
                      <ListIcon className="mr-2 h-4 w-4" />
                      Mes Annonces
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/publish" className="flex items-center cursor-pointer">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Créer une annonce
                    </Link>
                  </DropdownMenuItem>

                  {/* Menus spéciaux selon le rôle utilisateur */}
                  {profile.role === 'merchant' && (
                    <DropdownMenuItem asChild>
                      <Link to="/merchant-dashboard" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Tableau de bord
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {profile.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin-dashboard" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Interface pour utilisateur non connecté
              <Button variant="ghost" size="icon" asChild>
                <Link to="/login">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            )}
            
            {/* Mobile Menu */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Search & Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une annonce..."
                  className="pl-10 bg-surface border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            
            <div className="flex flex-col space-y-2">
              <Button variant="cta" className="w-full" asChild>
                <Link to="/publish" onClick={handlePublishClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Publier une annonce
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/listings" onClick={() => setIsMenuOpen(false)}>
                  Voir toutes les annonces
                </Link>
              </Button>
              
              {/* Section d'authentification mobile */}
              {user && profile ? (
                <div className="pt-2 border-t space-y-2">
                  <div className="text-sm font-medium px-2">
                    {profile.full_name || user.email}
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/my-profile" onClick={() => setIsMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Mon Profil
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/favorites" onClick={() => setIsMenuOpen(false)}>
                      <Heart className="mr-2 h-4 w-4" />
                      Mes favoris
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/messages" onClick={() => setIsMenuOpen(false)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Mes messages
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/mes-annonces" onClick={() => setIsMenuOpen(false)}>
                      <ListIcon className="mr-2 h-4 w-4" />
                      Mes Annonces
                    </Link>
                  </Button>
                  {profile.role === 'merchant' && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/merchant-dashboard" onClick={() => setIsMenuOpen(false)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Tableau de bord
                      </Link>
                    </Button>
                  )}
                  {profile.role === 'admin' && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/admin-dashboard" onClick={() => setIsMenuOpen(false)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Administration
                      </Link>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Se connecter / S'inscrire
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
