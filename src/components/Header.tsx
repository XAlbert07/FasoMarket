// components/Header.tsx 

import { useState, useEffect, useMemo, memo } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Search, Plus, User, Menu, LogOut, Settings, PlusCircle, ListIcon, Heart, MessageCircle, X, Home, Grid3X3, Bell } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import PublishButton from "@/components/PublishButton"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSearchTracking } from "@/hooks/usePopularSearches"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

   export const Header = memo(() => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  // Récupération de l'état d'authentification
  const { user, profile, signOut, loading } = useAuthContext()
  // Mémoriser l'URL de l'avatar pour éviter les rechargements
  const avatarUrl = useMemo(() => profile?.avatar_url || "", [profile?.avatar_url])
  

  // Fermer les menus lors du changement de route
  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
  }, [location.pathname])

  // Fonction de recherche
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  // Gestion de la déconnexion
  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/")
      setIsMenuOpen(false)
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  // Obtenir les initiales pour l'avatar
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

  // Détecter si on est sur la page d'accueil pour adapter le style
  const isHomePage = location.pathname === '/'

  return (
    <>
      {/* HEADER PRINCIPAL - Mobile First Design */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          
          {/* MOBILE: Barre principale compacte */}
          <div className="flex h-14 md:h-16 items-center justify-between">
            
            {/* Logo - optimisé mobile */}
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-1 md:space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
                  <span className="text-sm font-bold text-white">F</span>
                </div>
                <span className="text-lg md:text-xl font-heading font-bold text-gradient-primary hover:opacity-80 transition-opacity">
                  FasoMarket
                </span>
              </Link>
            </div>

            {/* MOBILE: Actions principales - toujours visibles */}
            <div className="flex items-center space-x-2 md:hidden">
              {/* Bouton recherche mobile */}
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Bouton publier - toujours visible sur mobile */}
              <PublishButton 
                variant="cta" 
                size="sm" 
                className="h-9 px-3 text-xs"
              >
                Publier
              </PublishButton>

              {/* Avatar ou connexion - compact mobile */}
              {loading ? (
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              ) : user && profile ? (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Avatar className="h-7 w-7">
                   <AvatarImage 
                      src={avatarUrl} 
                      alt={profile?.full_name || "User"}
                      loading="lazy"
                      crossOrigin="anonymous"
                    />
                    <AvatarFallback className="text-xs bg-slate-100 text-slate-700 border border-slate-200">
                      {getUserInitials()}
                  </AvatarFallback>
                 </Avatar>
                </Button>
              ) : (
               <Button variant="outline" size="icon" className="h-9 w-9" asChild>
               <Link to="/login">
               <User className="h-4 w-4" />
               </Link>
           </Button>
          )}
            </div>

            {/* DESKTOP: Interface complète traditionnelle */}
            <div className="hidden md:flex items-center space-x-4 flex-1">
              {/* Barre de recherche desktop */}
              <form onSubmit={handleSearch} className="flex flex-1 max-w-md mx-8">
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

              {/* Actions desktop */}
              <div className="flex items-center space-x-2">
                {/* Bouton publier desktop */}
                <PublishButton variant="cta" size="sm">
                  Publier
                </PublishButton>
                
                {/* Menu utilisateur desktop */}
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                ) : user && profile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Avatar className="h-8 w-8">
                        <AvatarImage 
                           src={avatarUrl} 
                           alt={profile?.full_name || "User"}
                           loading="lazy"
                           crossOrigin="anonymous"
                          />
                          <AvatarFallback className="text-xs bg-slate-100 text-slate-700 border border-slate-200">
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
                        <Link to="/my-listings" className="flex items-center cursor-pointer">
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

                      {/* Menus spéciaux selon le rôle */}
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
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/login">
                      <User className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE: Barre de recherche expansible */}
          {isSearchOpen && (
            <div className="md:hidden py-3 border-t border-border">
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Que recherchez-vous ?"
                    className="pl-10 bg-surface border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* MOBILE: Menu utilisateur full-screen overlay */}
      {isMenuOpen && user && profile && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay sombre */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu principal - slide depuis la droite */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l shadow-xl">
            <div className="flex flex-col h-full">
              
              {/* En-tête du menu avec profil utilisateur */}
              <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-heading font-semibold">Mon compte</h2>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={avatarUrl} 
                        alt={profile?.full_name || "User"}
                        loading="lazy"
                        crossOrigin="anonymous"
                    />
                    <AvatarFallback className="text-sm bg-slate-100 text-slate-700 border border-slate-200">
                     {getUserInitials()}
                    </AvatarFallback>
                    </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">
                      {profile.full_name || "Utilisateur"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation principale */}
              <div className="flex-1 py-4">
                <nav className="space-y-1 px-4">
                  
                  {/* Actions principales */}
                  <div className="space-y-1">
                    <Link
                      to="/"
                      className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home className="mr-3 h-4 w-4" />
                      Accueil
                    </Link>

                    <Link
                      to="/listings"
                      className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Grid3X3 className="mr-3 h-4 w-4" />
                      Toutes les annonces
                    </Link>

                    <Link
                      to="/publish"
                      className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors bg-primary/10 text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <PlusCircle className="mr-3 h-4 w-4" />
                      Publier une annonce
                    </Link>
                  </div>

                  {/* Séparateur */}
                  <div className="h-px bg-border my-4" />

                  {/* Mes contenus */}
                  <div className="space-y-1">
                    <Link
                      to="/my-profile"
                      className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="mr-3 h-4 w-4" />
                      Mon profil
                    </Link>

                    <Link
                      to="/my-listings"
                      className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ListIcon className="mr-3 h-4 w-4" />
                      Mes annonces
                    </Link>

                    <Link
                      to="/favorites"
                      className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Heart className="mr-3 h-4 w-4" />
                      Mes favoris
                    </Link>

                    <Link
                      to="/messages"
                      className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MessageCircle className="mr-3 h-4 w-4" />
                      Messages
                      {/* Espace pour badge de notifications */}
                      <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full hidden">
                        3
                      </span>
                    </Link>
                  </div>

                  {/* Tableaux de bord selon le rôle */}
                  {(profile.role === 'merchant' || profile.role === 'admin') && (
                    <>
                      <div className="h-px bg-border my-4" />
                      <div className="space-y-1">
                        {profile.role === 'merchant' && (
                          <Link
                            to="/merchant-dashboard"
                            className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            Tableau de bord vendeur
                          </Link>
                        )}

                        {profile.role === 'admin' && (
                          <Link
                            to="/admin-dashboard"
                            className="flex items-center px-3 py-3 text-sm font-medium rounded-lg hover:bg-accent/50 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            Administration
                          </Link>
                        )}
                      </div>
                    </>
                  )}
                </nav>
              </div>

              {/* Pied du menu - déconnexion */}
              <div className="p-4 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})