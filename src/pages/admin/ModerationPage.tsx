import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSharedAdminDashboard } from "@/pages/admin/AdminDashboardContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileWarning,
  Gavel,
  Package,
  Pause,
  Play,
  Search,
  Square,
  CheckSquare,
  Shield,
  User,
  XCircle,
} from "lucide-react";

type QueueKind = "report" | "listing" | "user";

interface QueueItem {
  queueId: string;
  kind: QueueKind;
  itemId: string;
  title: string;
  subject: string;
  status: string;
  createdAt: string;
  reason: string;
  raw: any;
}

interface DecisionLog {
  id: string;
  queueId: string;
  action: string;
  note: string;
  createdAt: string;
}

const DECISION_LOGS_STORAGE_KEY = "fasomarket_admin_moderation_decision_logs_v1";
const DB_EVENTS_TABLE = "admin_moderation_events";

const kindIcon = {
  report: FileWarning,
  listing: Package,
  user: User,
};

const kindLabel: Record<QueueKind, string> = {
  report: "Signalement",
  listing: "Annonce",
  user: "Utilisateur",
};

const ModerationPage = () => {
  const dashboard = useSharedAdminDashboard();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | QueueKind>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>([]);
  const [dbPersistenceEnabled, setDbPersistenceEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const { data, error } = await supabase
          .from(DB_EVENTS_TABLE)
          .select("queue_id, action, note, created_at, meta")
          .order("created_at", { ascending: false })
          .limit(400);

        if (error) throw error;

        const mappedLogs: DecisionLog[] = (data || []).map((event: any, index: number) => ({
          id: `${event.queue_id}-${event.created_at}-${index}`,
          queueId: event.queue_id,
          action: event.action,
          note: event.note || "",
          createdAt: event.created_at,
        }));

        setDecisionLogs(mappedLogs);
        setDbPersistenceEnabled(true);
      } catch {
        try {
          const rawLogs = localStorage.getItem(DECISION_LOGS_STORAGE_KEY);
          if (rawLogs) setDecisionLogs(JSON.parse(rawLogs));
        } catch {
          // Ignore invalid local cache
        }
        setDbPersistenceEnabled(false);
      }
    };

    loadPersistedData();
  }, []);

  useEffect(() => {
    if (dbPersistenceEnabled === false) {
      localStorage.setItem(DECISION_LOGS_STORAGE_KEY, JSON.stringify(decisionLogs.slice(0, 400)));
    }
  }, [decisionLogs, dbPersistenceEnabled]);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "En attente",
      in_review: "En cours",
      active: "Active",
      suspended: "Suspendue",
      resolved: "Resolue",
      dismissed: "Rejetee",
    };
    return map[status] || status;
  };

  const getUserModerationReason = (user: any) => {
    if (user.status === "suspended" && user.suspended_until) {
      return `Compte suspendu jusqu'au ${new Date(user.suspended_until).toLocaleDateString("fr-FR")}`;
    }
    if (user.reports_received > 0) {
      return `${user.reports_received} signalement(s) recu(s)`;
    }
    if (typeof user.trust_score === "number" && user.trust_score < 60) {
      return `Score de confiance bas: ${user.trust_score}%`;
    }
    return "Revue de compte administrateur";
  };

  const queueItems = useMemo<QueueItem[]>(() => {
    const fromReports: QueueItem[] = dashboard.reports
      .filter((report) => report.status === "pending" || report.status === "in_review")
      .map((report) => ({
        queueId: `report-${report.id}`,
        kind: "report" as const,
        itemId: report.id,
        title: report.reason || "Signalement",
        subject: report.listing_title || report.reported_user_name || "Cible inconnue",
        status: report.status,
        createdAt: report.created_at,
        reason: report.description || report.reason || "Aucun detail",
        raw: report,
      }));

    const fromListings: QueueItem[] = dashboard.listings
      .filter((listing) => listing.needs_review || listing.risk_level === "high" || listing.status === "suspended")
      .map((listing) => ({
        queueId: `listing-${listing.id}`,
        kind: "listing" as const,
        itemId: listing.id,
        title: listing.title,
        subject: listing.merchant_name || "Marchand inconnu",
        status: listing.status,
        createdAt: listing.created_at,
        reason: listing.moderation_notes || listing.suspension_reason || "Revue de qualite/moderation",
        raw: listing,
      }));

    const fromUsers: QueueItem[] = dashboard.users
      .filter((user) => user.risk_level === "high" || user.status === "suspended")
      .map((user) => ({
        queueId: `user-${user.id}`,
        kind: "user" as const,
        itemId: user.id,
        title: user.full_name || user.email,
        subject: user.email,
        status: user.status,
        createdAt: user.created_at,
        reason: getUserModerationReason(user),
        raw: user,
      }));

    return [...fromReports, ...fromListings, ...fromUsers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [dashboard.reports, dashboard.listings, dashboard.users]);

  const filteredQueue = useMemo(() => {
    return queueItems.filter((item) => {
      const matchesType = typeFilter === "all" || item.kind === typeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.subject.toLowerCase().includes(term) ||
        item.reason.toLowerCase().includes(term);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [queueItems, searchTerm, typeFilter, statusFilter]);

  const selectedItem = useMemo(
    () => filteredQueue.find((item) => item.queueId === selectedQueueId) || filteredQueue[0] || null,
    [filteredQueue, selectedQueueId]
  );

  const counts = useMemo(() => {
    const byKind = {
      report: queueItems.filter((item) => item.kind === "report").length,
      listing: queueItems.filter((item) => item.kind === "listing").length,
      user: queueItems.filter((item) => item.kind === "user").length,
    };
    return { total: queueItems.length, ...byKind };
  }, [queueItems]);

  const persistModerationEvent = async (
    queueId: string,
    entityType: QueueKind,
    entityId: string,
    action: string,
    note: string,
    meta: Record<string, unknown> = {}
  ) => {
    if (dbPersistenceEnabled !== true) return false;

    const { error } = await supabase.from(DB_EVENTS_TABLE).insert({
      queue_id: queueId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      note,
      meta,
      created_by: user?.id || null,
    });

    if (error) {
      setDbPersistenceEnabled(false);
      return false;
    }

    return true;
  };

  const runAction = async (
    actionId: string,
    actionLabel: string,
    queueId: string,
    handler: () => Promise<boolean>,
    refresh: () => Promise<void>
  ) => {
    setActionLoading(actionId);
    try {
      const ok = await handler();
      if (ok) {
        await refresh();
        const note = "Action executee depuis moderation unifiee";
        const eventPersisted = await persistModerationEvent(
          queueId,
          queueId.split("-")[0] as QueueKind,
          queueId.split("-").slice(1).join("-"),
          actionLabel,
          note
        );
        setDecisionLogs((prev) => [
          {
            id: `${queueId}-${Date.now()}`,
            queueId,
            action: actionLabel,
            note,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        if (eventPersisted) {
          // Keep DB as source of truth when available by avoiding growth if DB write succeeded.
          setDecisionLogs((prev) => prev.slice(0, 400));
        }
      }
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelected = (queueId: string) => {
    setSelectedQueueIds((prev) => (prev.includes(queueId) ? prev.filter((id) => id !== queueId) : [...prev, queueId]));
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredQueue.map((item) => item.queueId);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedQueueIds.includes(id));
    setSelectedQueueIds(allSelected ? selectedQueueIds.filter((id) => !filteredIds.includes(id)) : [...new Set([...selectedQueueIds, ...filteredIds])]);
  };

  const runBulkAction = async (mode: "reactivate" | "suspend") => {
    const selectedItems = queueItems.filter((item) => selectedQueueIds.includes(item.queueId));
    if (selectedItems.length === 0) return;
    setActionLoading(`bulk-${mode}`);
    for (const item of selectedItems) {
      if (item.kind === "report" && mode === "reactivate") {
        await dashboard.handleReportAction(item.itemId, { type: "approve", reason: "Validation en masse depuis moderation unifiee", notifyUser: true });
      }
      if (item.kind === "listing") {
        if (mode === "reactivate") {
          await dashboard.handleListingAction(item.itemId, {
            type: "unsuspend",
            reason: "Réactivation en masse depuis la modération annonces",
          });
        } else {
          await dashboard.handleListingAction(item.itemId, {
            type: "suspend_listing",
            reason: "Suspension en masse depuis la modération annonces",
          });
        }
      }
      if (item.kind === "user") {
        if (mode === "suspend") {
          await dashboard.handleUserAction(item.itemId, { type: "suspend", reason: "Suspension en masse depuis moderation unifiee", duration: 7 });
        } else if (item.raw?.status === "suspended") {
          await dashboard.handleUserAction(item.itemId, { type: "verify", reason: "Reactivation en masse depuis moderation unifiee" });
        }
      }
      const note = `Action en masse (${item.kind})`;
      await persistModerationEvent(
        item.queueId,
        item.kind,
        item.itemId,
        mode === "reactivate" ? "Bulk reactivate" : "Bulk suspend",
        note,
        { bulk: true }
      );
      setDecisionLogs((prev) => [
        {
          id: `${item.queueId}-${Date.now()}-${mode}`,
          queueId: item.queueId,
          action: mode === "reactivate" ? "Bulk reactivate" : "Bulk suspend",
          note,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    await Promise.all([dashboard.refreshReports(), dashboard.refreshListings(), dashboard.refreshUsers()]);
    setSelectedQueueIds([]);
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Modération unifiée</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          File unique de traitement pour signalements, annonces et utilisateurs.
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-semibold">{counts.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Signalements</p><p className="text-2xl font-semibold">{counts.report}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Annonces</p><p className="text-2xl font-semibold">{counts.listing}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Utilisateurs</p><p className="text-2xl font-semibold">{counts.user}</p></CardContent></Card>
      </div>

      {selectedQueueIds.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-wrap items-center gap-2 p-3">
            <Badge variant="outline">{selectedQueueIds.length} sélectionnés</Badge>
            <Button size="sm" onClick={() => runBulkAction("reactivate")} disabled={actionLoading !== null}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Réactiver en masse
            </Button>
            <Button size="sm" variant="outline" onClick={() => runBulkAction("suspend")} disabled={actionLoading !== null}>
              <Shield className="mr-2 h-4 w-4" />
              Suspendre en masse
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedQueueIds([])} disabled={actionLoading !== null}>
              Effacer la sélection
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" placeholder="Rechercher dans la file de modération..." />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | QueueKind)}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="report">Signalements</SelectItem>
              <SelectItem value="listing">Annonces</SelectItem>
              <SelectItem value="user">Utilisateurs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_review">En cours</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">File de modération ({filteredQueue.length})</CardTitle>
              <Button size="sm" variant="ghost" onClick={toggleSelectAllFiltered}>
                {filteredQueue.length > 0 && filteredQueue.every((item) => selectedQueueIds.includes(item.queueId)) ? (
                  <><CheckSquare className="mr-2 h-4 w-4" />Tout désélectionner</>
                ) : (
                  <><Square className="mr-2 h-4 w-4" />Tout sélectionner</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[560px]">
              <div className="divide-y divide-border">
                {filteredQueue.map((item) => {
                  const Icon = kindIcon[item.kind];
                  const isSelected = selectedItem?.queueId === item.queueId;
                  return (
                    <button
                      type="button"
                      key={item.queueId}
                      onClick={() => setSelectedQueueId(item.queueId)}
                      className={`w-full px-4 py-3 text-left transition-colors ${isSelected ? "bg-muted/60" : "hover:bg-muted/40"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedQueueIds.includes(item.queueId)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelected(item.queueId);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                          </div>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{item.subject}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.reason}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline">{kindLabel[item.kind]}</Badge>
                          <span className="text-[11px] text-muted-foreground">{dashboard.formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detail & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedItem && <p className="text-sm text-muted-foreground">Aucun element selectionne.</p>}

            {selectedItem && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{kindLabel[selectedItem.kind]}</Badge>
                    <Badge variant="outline">{getStatusLabel(selectedItem.status)}</Badge>
                  </div>
                  <h3 className="text-base font-semibold">{selectedItem.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.subject}</p>
                  <p className="text-sm">{selectedItem.reason}</p>
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {dashboard.formatDate(selectedItem.createdAt)}
                  </div>
                </div>

                {selectedItem.kind === "report" && (
                  <div className="grid gap-2">
                    <Button
                      onClick={() =>
                        runAction(
                          "report-approve",
                          "Approve report",
                          selectedItem.queueId,
                          () =>
                            dashboard.handleReportAction(selectedItem.itemId, {
                              type: "approve",
                              reason: "Valide depuis la moderation unifiee",
                              notifyUser: true,
                            }),
                          dashboard.refreshReports
                        )
                      }
                      disabled={actionLoading !== null}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approuver
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        runAction(
                          "report-dismiss",
                          "Dismiss report",
                          selectedItem.queueId,
                          () =>
                            dashboard.handleReportAction(selectedItem.itemId, {
                              type: "dismiss",
                              reason: "Rejete depuis la moderation unifiee",
                              notifyUser: true,
                            }),
                          dashboard.refreshReports
                        )
                      }
                      disabled={actionLoading !== null}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter
                    </Button>
                  </div>
                )}

                {selectedItem.kind === "listing" && (
                  <div className="grid gap-2">
                    {selectedItem.raw?.status !== "suspended" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          runAction(
                            "listing-suspend",
                            "Suspend listing",
                            selectedItem.queueId,
                            () =>
                              dashboard.handleListingAction(selectedItem.itemId, {
                                type: "suspend_listing",
                                reason: "Suspension depuis la modération annonces",
                              }),
                            dashboard.refreshListings
                          )
                        }
                        disabled={actionLoading !== null}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Suspendre
                      </Button>
                    )}
                    {selectedItem.raw?.status === "suspended" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          runAction(
                            "listing-reactivate",
                            "Reactivate listing",
                            selectedItem.queueId,
                            () =>
                              dashboard.handleListingAction(selectedItem.itemId, {
                                type: "unsuspend",
                                reason: "Réactivation depuis la modération annonces",
                              }),
                            dashboard.refreshListings
                          )
                        }
                        disabled={actionLoading !== null}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Réactiver
                      </Button>
                    )}
                  </div>
                )}

                {selectedItem.kind === "user" && (
                  <div className="grid gap-2">
                    {selectedItem.raw?.status !== "suspended" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          runAction(
                            "user-suspend",
                            "Suspend user",
                            selectedItem.queueId,
                            () =>
                              dashboard.handleUserAction(selectedItem.itemId, {
                                type: "suspend",
                                reason: "Suspension depuis moderation unifiee",
                                duration: 7,
                              }),
                            dashboard.refreshUsers
                          )
                        }
                        disabled={actionLoading !== null}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Suspendre 7 Jours
                      </Button>
                    )}
                    {selectedItem.raw?.status === "suspended" && (
                      <Button
                        onClick={() =>
                          runAction(
                            "user-verify",
                            "Reactivate user",
                            selectedItem.queueId,
                            () =>
                              dashboard.handleUserAction(selectedItem.itemId, {
                                type: "verify",
                                reason: "Reactivation du compte depuis moderation unifiee",
                              }),
                            dashboard.refreshUsers
                          )
                        }
                        disabled={actionLoading !== null}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Reactiver Le Compte
                      </Button>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  {(selectedItem.kind === "listing" ||
                    (selectedItem.kind === "report" && selectedItem.raw?.listing_id) ||
                    selectedItem.kind === "user") && (
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <a
                        href={
                          selectedItem.kind === "listing"
                            ? `/listing/${selectedItem.itemId}`
                            : selectedItem.kind === "user"
                              ? `/seller-profile/${selectedItem.itemId}`
                              : `/listing/${selectedItem.raw?.listing_id}`
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ouvrir la fiche
                      </a>
                    </Button>
                  )}
                </div>

                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Historique des decisions</p>
                  <div className="space-y-2">
                    {decisionLogs.filter((log) => log.queueId === selectedItem.queueId).slice(0, 5).map((log) => (
                      <div key={log.id} className="rounded-md border border-border p-2">
                        <p className="text-xs font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.note}</p>
                        <p className="text-[11px] text-muted-foreground">{dashboard.formatDate(log.createdAt)}</p>
                      </div>
                    ))}
                    {decisionLogs.filter((log) => log.queueId === selectedItem.queueId).length === 0 && (
                      <p className="text-xs text-muted-foreground">Aucune decision enregistree pour cet element.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {actionLoading && (
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <Gavel className="h-3.5 w-3.5" />
          Action en cours...
        </div>
      )}
      {dbPersistenceEnabled === false && (
        <div className="inline-flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
          Persistance locale active (table DB d'audit non detectee)
        </div>
      )}
    </div>
  );
};

export default ModerationPage;
