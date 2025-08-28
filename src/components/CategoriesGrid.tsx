import { Car, Home, Smartphone, Shirt, Sofa, Briefcase, Heart, MoreHorizontal } from "lucide-react"

const categories = [
  {
    name: "Véhicules",
    icon: Car,
    count: "2,341",
    color: "bg-primary",
    href: "/categories/vehicules"
  },
  {
    name: "Immobilier",
    icon: Home,
    count: "1,847",
    color: "bg-secondary",
    href: "/categories/immobilier"
  },
  {
    name: "Téléphones",
    icon: Smartphone,
    count: "3,152",
    color: "bg-accent",
    href: "/categories/telephones"
  },
  {
    name: "Mode",
    icon: Shirt,
    count: "1,564",
    color: "bg-primary",
    href: "/categories/mode"
  },
  {
    name: "Maison",
    icon: Sofa,
    count: "1,023",
    color: "bg-secondary",
    href: "/categories/maison"
  },
  {
    name: "Emploi",
    icon: Briefcase,
    count: "847",
    color: "bg-accent",
    href: "/categories/emploi"
  },
  {
    name: "Loisirs",
    icon: Heart,
    count: "692",
    color: "bg-primary",
    href: "/categories/loisirs"
  },
  {
    name: "Autres",
    icon: MoreHorizontal,
    count: "1,234",
    color: "bg-muted-foreground",
    href: "/categories/autres"
  }
]

export const CategoriesGrid = () => {
  return (
    <section className="py-16 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Explorez par catégorie
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez des milliers d'annonces dans toutes les catégories, 
            partout au Burkina Faso
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <a
                key={category.name}
                href={category.href}
                className="group relative overflow-hidden rounded-xl bg-card border border-card-border p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`${category.color} p-3 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="font-heading font-semibold text-lg mb-1 text-card-foreground">
                    {category.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    {category.count} annonces
                  </p>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl" />
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}