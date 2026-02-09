import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSharedAdminDashboard } from "@/pages/admin/AdminDashboardContext";
import { AlertTriangle, Ban, Clock, Package, RefreshCw, Search, Shield, Trash2, User } from "lucide-react";

type ComplianceAction = "revoke" | "extend" | "permanent";

const CompliancePage = () => {
  const dashboard = useSharedAdminDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedSanctionId, setSelectedSanctionId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ComplianceAction>("revoke");
  const [actionReason, setActionReason] = useState("");
  const [extensionDays, setExtensionDays] = useState("7");
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sanctions = Array.isArray(dashboard.sanctions) ? dashboard.sanctions : [];

  const filteredSanctions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sanctions
      .filter((sanction) => (statusFilter === "all" ? true : sanction.status === statusFilter))
      .filter((sanction) => (typeFilter === "all" ? true : sanction.type === typeFilter))
      .filter((sanction) => {
        if (!term) return true;
        return (
          sanction.target_name?.toLowerCase().includes(term) ||
          sanction.reason?.toLowerCase().includes(term) ||
          sanction.admin_name?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sanctions, searchTerm, statusFilter, typeFilter]);

  const selectedSanction = useMemo(
    () => filteredSanctions.find((sanction) => sanction.id === selectedSanctionId) || filteredSanctions[0] || null,
    [filteredSanctions, selectedSanctionId]
  );

  const openActionDialog = (type: ComplianceAction) => {
    if (!selectedSanction) return;
    setActionType(type);
    setActionReason("");
    setExtensionDays("7");
    setDialogOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([dashboard.refreshSanctions(), dashboard.refreshListings(), dashboard.refreshUsers()]);
    } finally {
      setRefreshing(false);
    }
  };

  const submitAction = async () => {
    if (!selectedSanction) return;
    if (actionType !== "extend" && !actionReason.trim()) return;

    setActionLoading(true);
    try {
      let ok = false;
      if (actionType === "revoke") {
        ok = await dashboard.revokeSanction(selectedSanction.id, selectedSanction.type, actionReason.trim());
      } else if (actionType === "permanent") {
        ok = await dashboard.convertToPermanent(selectedSanction.id, selectedSanction.type, actionReason.trim());
      } else {
        const days = Number.parseInt(extensionDays, 10);
        if (Number.isFinite(days) && days > 0) {
          ok = await dashboard.extendSanction(selectedSanction.id, selectedSanction.type, days);
        }
      }

      if (ok) {
        setDialogOpen(false);
        await handleRefresh();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "expired") return "bg-muted text-muted-foreground";
    return "bg-blue-100 text-blue-700";
  };

  const canRevoke = selectedSanction?.status === "active";
  const canExtend = selectedSanction?.status === "active" && !selectedSanction?.is_permanent;
  const canMakePermanent = selectedSanction?.status === "active" && !selectedSanction?.is_permanent;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Conformité</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pilotage des sanctions depuis une seule vue, synchronisée avec la modération, les annonces et les utilisateurs.
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Actives</p>
              <p className="text-2xl font-semibold">{dashboard.stats.totalActive}</p>
            </div>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Utilisateurs</p>
              <p className="text-2xl font-semibold">{dashboard.stats.userSanctions}</p>
            </div>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Annonces</p>
              <p className="text-2xl font-semibold">{dashboard.stats.listingSanctions}</p>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Expirent bientôt</p>
              <p className="text-2xl font-semibold">{dashboard.stats.expiringSoon}</p>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
              placeholder="Rechercher une sanction..."
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="expired">Expirées</SelectItem>
              <SelectItem value="revoked">Révoquées</SelectItem>
              <SelectItem value="all">Toutes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="user">Utilisateurs</SelectItem>
              <SelectItem value="listing">Annonces</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sanctions ({filteredSanctions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[620px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[90px]">Type</TableHead>
                      <TableHead className="min-w-[250px]">Cible</TableHead>
                      <TableHead className="min-w-[220px]">Motif</TableHead>
                      <TableHead className="min-w-[120px]">Échéance</TableHead>
                      <TableHead className="min-w-[110px]">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSanctions.map((sanction) => (
                      <TableRow
                        key={sanction.id}
                        className={`cursor-pointer hover:bg-muted/40 ${selectedSanction?.id === sanction.id ? "bg-muted/50" : ""}`}
                        onClick={() => setSelectedSanctionId(sanction.id)}
                      >
                        <TableCell>
                          <Badge variant="outline">{sanction.type === "user" ? "Utilisateur" : "Annonce"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{sanction.target_name}</p>
                            {sanction.target_email && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{sanction.target_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-1">{sanction.reason}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sanction.is_permanent ? "Permanente" : dashboard.formatDaysRemaining(sanction.days_remaining)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(sanction.status)}>{dashboard.translateStatus(sanction.status)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Détail & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSanction && <p className="text-sm text-muted-foreground">Sélectionne une sanction.</p>}

            {selectedSanction && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedSanction.type === "user" ? "Utilisateur" : "Annonce"}</Badge>
                    <Badge className={getStatusBadgeClass(selectedSanction.status)}>
                      {dashboard.translateStatus(selectedSanction.status)}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold">{selectedSanction.target_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {dashboard.translateSanctionType(selectedSanction.sanction_type)}
                  </p>
                  <p className="text-sm">{selectedSanction.reason}</p>
                </div>

                <div className="space-y-2 rounded-md border border-border p-3 text-sm">
                  <p>
                    <span className="font-medium">Admin:</span> {selectedSanction.admin_name}
                  </p>
                  <p>
                    <span className="font-medium">Créée le:</span> {dashboard.formatDate(selectedSanction.created_at)}
                  </p>
                  <p>
                    <span className="font-medium">Échéance:</span>{" "}
                    {selectedSanction.is_permanent
                      ? "Permanente"
                      : selectedSanction.expires_at
                      ? dashboard.formatDate(selectedSanction.expires_at)
                      : "Non définie"}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Button variant="outline" disabled={!canExtend} onClick={() => openActionDialog("extend")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Prolonger
                  </Button>
                  <Button variant="outline" disabled={!canMakePermanent} onClick={() => openActionDialog("permanent")}>
                    <Ban className="mr-2 h-4 w-4" />
                    Rendre permanente
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={!canRevoke}
                    onClick={() => openActionDialog("revoke")}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Révoquer
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "revoke"
                ? "Révoquer la sanction"
                : actionType === "extend"
                ? "Prolonger la sanction"
                : "Rendre la sanction permanente"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Action appliquée à la cible sélectionnée. Un motif est requis sauf pour la simple prolongation.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {actionType === "extend" && (
              <div>
                <Label>Jours à ajouter</Label>
                <Input
                  type="number"
                  min="1"
                  value={extensionDays}
                  onChange={(event) => setExtensionDays(event.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            {actionType !== "extend" && (
              <div>
                <Label>Motif</Label>
                <Textarea
                  rows={3}
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  placeholder="Motif administratif"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void submitAction();
              }}
              disabled={actionLoading || (actionType !== "extend" && !actionReason.trim())}
            >
              {actionLoading ? "Traitement..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {dashboard.errors.sanctions && (
        <div className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          {dashboard.errors.sanctions}
        </div>
      )}
    </div>
  );
};

export default CompliancePage;

