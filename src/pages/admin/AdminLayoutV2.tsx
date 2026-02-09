import { NavLink, Outlet } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Shield, Gavel, Users, Package, Scale, BarChart3 } from "lucide-react";
import { AdminDashboardProvider } from "@/pages/admin/AdminDashboardContext";

const navItems = [
  { to: "/admin/moderation", label: "Modération", icon: Gavel },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/listings", label: "Annonces", icon: Package },
  { to: "/admin/compliance", label: "Conformité", icon: Scale },
  { to: "/admin/insights", label: "Analyses", icon: BarChart3 },
];

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
    isActive
      ? "bg-foreground text-background"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

const AdminLayoutV2 = () => {
  return (
    <AdminDashboardProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
            <div className="inline-flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Console Admin</p>
                <p className="text-xs text-muted-foreground">FasoMarket v2</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Admin
            </Badge>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-border bg-card p-3 lg:sticky lg:top-6 lg:h-fit">
            <nav className="flex gap-2 overflow-auto lg:flex-col">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={linkClassName}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </AdminDashboardProvider>
  );
};

export default AdminLayoutV2;
