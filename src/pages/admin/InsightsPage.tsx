import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnalyticsTab from "@/pages/admin/components/AnalyticsTab";
import { useSharedAdminDashboard } from "@/pages/admin/AdminDashboardContext";

const InsightsPage = () => {
  const dashboard = useSharedAdminDashboard();

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Analyses</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Analyses et tendances pour le pilotage hebdomadaire. Cette section complète la modération.
        </CardContent>
      </Card>

      <AnalyticsTab
        dashboardStats={dashboard.dashboardStats}
        weeklyData={dashboard.weeklyData}
        users={dashboard.users}
        listings={dashboard.listings}
        reports={dashboard.reports}
      />
    </div>
  );
};

export default InsightsPage;
