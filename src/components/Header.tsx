import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, LogOut, Settings, PlusCircle, ListIcon, Heart, MessageCircle, X, Home, Grid3X3, Menu } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import PublishButton from "@/components/PublishButton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchTracking } from "@/hooks/usePopularSearches";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const Header = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { user, profile, signOut, loading } = useAuthContext();
  const { trackSearch } = useSearchTracking();
  const avatarUrl = useMemo(() => profile?.avatar_url || "", [profile?.avatar_url]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      trackSearch({
        search_query: trimmedQuery,
        user_id: user?.id,
        source_page: "header",
        category_filter: undefined,
      }).catch((err) => {
        console.warn("Erreur tracking header (ignoree):", err);
      });

      navigate(`/listings?q=${encodeURIComponent(trimmedQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    },
    [searchQuery, navigate, trackSearch, user?.id]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate("/");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Erreur lors de la deconnexion:", error);
    }
  }, [signOut, navigate]);

  const getUserInitials = useCallback(() => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  }, [profile?.full_name, user?.email]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-14 md:h-16 items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-heading font-extrabold text-primary-foreground shadow-sm">
                F
              </div>
              <span className="text-lg font-heading font-extrabold tracking-tight text-foreground md:text-xl">FasoMarket</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
              <Link to="/listings" className="hover:text-foreground transition-colors">Annonces</Link>
              <Link to="/help-support" className="hover:text-foreground transition-colors">Aide</Link>
            </nav>

            <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une annonce"
                    className="h-10 pl-9 bg-card"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </form>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <PublishButton variant="cta" size="sm">Publier</PublishButton>

              {loading ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : user && profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={avatarUrl} alt={profile?.full_name || "User"} loading="lazy" crossOrigin="anonymous" />
                        <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-56 border border-border bg-background" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile.full_name || "Utilisateur"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link to="/my-profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mon profil
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
                        Mes annonces
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/publish" className="flex items-center cursor-pointer">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Creer une annonce
                      </Link>
                    </DropdownMenuItem>

                    {profile.role === "merchant" && (
                      <DropdownMenuItem asChild>
                        <Link to="/merchant-dashboard" className="flex items-center cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Tableau de bord
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {profile.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin-dashboard" className="flex items-center cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Se deconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                  <Link to="/login">
                    <User className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex md:hidden items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSearchOpen(!isSearchOpen);
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  setIsSearchOpen(false);
                  setIsMenuOpen(!isMenuOpen);
                }}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setIsSearchOpen(false)} />
          <div className="absolute inset-x-0 top-0 border-b border-border bg-background p-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une annonce"
                  className="h-11 pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="bottom"
          className="z-[55] h-[82vh] rounded-t-2xl border-t border-border px-0 pb-0 pt-8 md:hidden"
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border/80" />
          <SheetTitle className="sr-only">Menu mobile</SheetTitle>

          <div className="flex h-full flex-col">
            <div className="border-b border-border px-4 pb-4">
              {user && profile ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border border-border">
                    <AvatarImage src={avatarUrl} alt={profile?.full_name || "User"} loading="lazy" crossOrigin="anonymous" />
                    <AvatarFallback className="text-sm">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{profile.full_name || "Utilisateur"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button size="sm" className="ml-auto" asChild>
                    <Link to="/publish" onClick={() => setIsMenuOpen(false)}>
                      Publier
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Bienvenue sur FasoMarket</p>
                  <p className="text-xs text-muted-foreground">Connectez-vous pour gerer vos annonces, favoris et messages.</p>
                  <Button asChild className="w-full">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Se connecter
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <div>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Explorer</p>
                <div className="space-y-1">
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                    <Home className="mr-3 h-4 w-4" />
                    Accueil
                  </Link>
                  <Link to="/listings" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                    <Grid3X3 className="mr-3 h-4 w-4" />
                    Toutes les annonces
                  </Link>
                  <Link to="/publish" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 text-primary hover:bg-primary/10">
                    <PlusCircle className="mr-3 h-4 w-4" />
                    Deposer une annonce
                  </Link>
                </div>
              </div>

              {user && profile ? (
                <div>
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Mon compte</p>
                  <div className="space-y-1">
                    <Link to="/my-profile" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                      <User className="mr-3 h-4 w-4" />
                      Mon profil
                    </Link>
                    <Link to="/my-listings" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                      <ListIcon className="mr-3 h-4 w-4" />
                      Mes annonces
                    </Link>
                    <Link to="/favorites" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                      <Heart className="mr-3 h-4 w-4" />
                      Mes favoris
                    </Link>
                    <Link to="/messages" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                      <MessageCircle className="mr-3 h-4 w-4" />
                      Messages
                    </Link>
                    {profile.role === "merchant" && (
                      <Link to="/merchant-dashboard" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                        <Settings className="mr-3 h-4 w-4" />
                        Tableau de bord vendeur
                      </Link>
                    )}
                    {profile.role === "admin" && (
                      <Link to="/admin-dashboard" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                        <Settings className="mr-3 h-4 w-4" />
                        Administration
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Support</p>
                <div className="space-y-1">
                  <Link to="/help-support" onClick={() => setIsMenuOpen(false)} className="flex h-11 items-center rounded-lg px-3 hover:bg-muted">
                    <Settings className="mr-3 h-4 w-4" />
                    Aide
                  </Link>
                </div>
              </div>
            </nav>

            {user && profile ? (
              <div className="border-t border-border p-4">
                <Button variant="ghost" className="h-11 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleSignOut}>
                  <LogOut className="mr-3 h-4 w-4" />
                  Se deconnecter
                </Button>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});

Header.displayName = "Header";
