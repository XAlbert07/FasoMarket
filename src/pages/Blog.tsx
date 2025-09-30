// La page de Blog avec des données statique a implémenter Bientot 

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, TrendingUp, Shield, Smartphone } from "lucide-react";
//import AnimatedCard from "@/components/ui/animated-card";
import FadeIn from "@/components/ui/fade-in";

const Blog = () => {
  const featuredPost = {
    id: 1,
    title: "Guide complet : Acheter un véhicule d'occasion en toute sécurité",
    excerpt: "Découvrez nos conseils d'experts pour éviter les arnaques et faire le bon choix lors de l'achat d'un véhicule d'occasion au Burkina Faso.",
    image: "/placeholder.svg",
    category: "Véhicules",
    date: "15 Mars 2024",
    author: "Équipe FasoMarket",
    readTime: "8 min"
  };

  const posts = [
    { id: 2, title: "Les tendances du marché immobilier à Ouagadougou", excerpt: "Analyse des prix et des opportunités dans l'immobilier de la capitale burkinabè.", image: "/placeholder.svg", category: "Immobilier", date: "12 Mars 2024", author: "Marie Ouédraogo", readTime: "6 min" },
    { id: 3, title: "Comment reconnaître un smartphone authentique", excerpt: "Nos astuces pour éviter les contrefaçons lors de l'achat d'un téléphone.", image: "/placeholder.svg", category: "Téléphones", date: "10 Mars 2024", author: "Ibrahim Sawadogo", readTime: "4 min" },
    { id: 4, title: "Conseils pour vendre rapidement vos articles", excerpt: "Les meilleures pratiques pour optimiser vos annonces et attirer plus d'acheteurs.", image: "/placeholder.svg", category: "Conseils", date: "8 Mars 2024", author: "Fatou Kaboré", readTime: "5 min" },
    { id: 5, title: "Sécurité : Éviter les arnaques en ligne", excerpt: "Guide complet pour identifier et éviter les tentatives d'arnaque sur les plateformes de vente.", image: "/placeholder.svg", category: "Sécurité", date: "5 Mars 2024", author: "Équipe FasoMarket", readTime: "7 min" },
    { id: 6, title: "L'essor du e-commerce au Burkina Faso", excerpt: "Comment le commerce électronique transforme les habitudes d'achat des Burkinabès.", image: "/placeholder.svg", category: "Tendances", date: "2 Mars 2024", author: "Adjara Traoré", readTime: "6 min" }
  ];

  const categories = [
    { name: "Tous", count: 25, icon: <TrendingUp className="h-4 w-4" /> },
    { name: "Véhicules", count: 8, icon: <TrendingUp className="h-4 w-4" /> },
    { name: "Immobilier", count: 6, icon: <TrendingUp className="h-4 w-4" /> },
    { name: "Sécurité", count: 5, icon: <Shield className="h-4 w-4" /> },
    { name: "Téléphones", count: 4, icon: <Smartphone className="h-4 w-4" /> },
    { name: "Conseils", count: 2, icon: <TrendingUp className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <FadeIn>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold mb-4">Blog FasoMarket</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Conseils, astuces et actualités pour optimiser vos achats et ventes sur FasoMarket
            </p>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <FadeIn delay={0.1}>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Catégories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((category, index) => (
                    <Button key={index} variant={index === 0 ? "secondary" : "ghost"} className="w-full justify-between">
                      <div className="flex items-center gap-2">{category.icon}<span>{category.name}</span></div>
                      <Badge variant="outline" className="ml-auto">{category.count}</Badge>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Article en vedette */}
            <FadeIn delay={0.2}>
              <Card className="mb-8 overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img src={featuredPost.image} alt={featuredPost.title} className="w-full h-64 md:h-full object-cover" />
                  </div>
                  <div className="md:w-1/2 p-6">
                    <Badge className="mb-3">{featuredPost.category}</Badge>
                    <h2 className="text-2xl font-bold mb-3 line-clamp-2">{featuredPost.title}</h2>
                    <p className="text-muted-foreground mb-4 line-clamp-3">{featuredPost.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{featuredPost.date}</span></div>
                      <div className="flex items-center gap-1"><User className="h-4 w-4" /><span>{featuredPost.author}</span></div>
                      <span>{featuredPost.readTime} de lecture</span>
                    </div>
                    <Button className="group">
                      Lire l'article
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </FadeIn>

            {/* Articles récents */}
            <div className="grid md:grid-cols-2 gap-6">
              {posts.map((post, index) => (
                <FadeIn key={post.id} delay={0.3 + index * 0.1}>
                  <div>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                      <div className="relative overflow-hidden">
                        <img src={post.image} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <Badge className="absolute top-3 left-3">{post.category}</Badge>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span>{post.date}</span></div>
                          <span>•</span>
                          <div className="flex items-center gap-1"><User className="h-3 w-3" /><span>{post.author}</span></div>
                          <span>•</span>
                          <span>{post.readTime} de lecture</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Pagination */}
            <FadeIn delay={0.8}>
              <div className="flex justify-center mt-12">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Précédent</Button>
                  <Button size="sm">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">Suivant</Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
