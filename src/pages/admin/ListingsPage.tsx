import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ListingsTab from "@/pages/admin/components/ListingsTab";
import { useSharedAdminDashboard } from "@/pages/admin/AdminDashboardContext";

const ListingsPage = () => {
  const dashboard = useSharedAdminDashboard();

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Gestion des annonces</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Revue éditoriale, modération et actions sur les annonces.
        </CardContent>
      </Card>

      <ListingsTab
        listings={dashboard.listings}
        loading={dashboard.loading.listings}
        error={dashboard.errors.listings}
        handleListingAction={dashboard.handleListingAction}
        refreshListings={dashboard.refreshListings}
        formatCurrency={dashboard.formatCurrency}
        formatDate={dashboard.formatDate}
        needsReviewCount={dashboard.needsReviewCount}
      />
    </div>
  );
};

export default ListingsPage;
