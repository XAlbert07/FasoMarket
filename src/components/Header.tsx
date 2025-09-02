import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, Plus, User, Menu, Heart, MessageCircle } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const Header = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`)
    }
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

          {/* Search Bar - Hidden on mobile */}
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
              <Link to="/publish">
                <Plus className="mr-1 h-4 w-4" />
                Publier
              </Link>
            </Button>
            
            {/* User Actions */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/favorites">
                    <Heart className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/messages">
                    <MessageCircle className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/merchant-dashboard">
                    <User className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
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
                <Link to="/publish">
                  <Plus className="mr-2 h-4 w-4" />
                  Publier une annonce
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/listings">
                  Voir toutes les annonces
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}