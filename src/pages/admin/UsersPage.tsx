import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UsersTab from "@/pages/admin/components/UsersTab";
import { useSharedAdminDashboard } from "@/pages/admin/AdminDashboardContext";

const UsersPage = () => {
  const dashboard = useSharedAdminDashboard();

  const averageTrustScore =
    dashboard.users.length > 0
      ? Math.round(dashboard.users.reduce((sum, user) => sum + user.trust_score, 0) / dashboard.users.length)
      : 0;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Gestion des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Gestion des comptes, suspensions, réactivations et conversations administrateur.
        </CardContent>
      </Card>

      <UsersTab
        users={dashboard.users}
        loading={dashboard.loading.profiles}
        error={dashboard.errors.profiles}
        handleUserAction={dashboard.handleUserAction}
        getTrustScoreColor={dashboard.getTrustScoreColor}
        getStatusColor={dashboard.getStatusColor}
        formatDate={dashboard.formatDate}
        activeUsersCount={dashboard.activeUsersCount}
        suspendedUsersCount={dashboard.suspendedUsersCount}
        pendingVerificationCount={dashboard.pendingVerificationCount}
        totalUsers={dashboard.users.length}
        averageTrustScore={averageTrustScore}
        refreshUsers={dashboard.refreshUsers}
      />
    </div>
  );
};

export default UsersPage;
