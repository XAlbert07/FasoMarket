import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, RefreshCw, Search, Pause, Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ListingsTabProps {
  listings: any[];
  loading: boolean;
  error: string | null;
  handleListingAction: (id: string, action: any) => Promise<boolean>;
  refreshListings: () => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  needsReviewCount: number;
}

type ListingActionType = 'suspend' | 'delete';

const ListingsTab: React.FC<ListingsTabProps> = ({
  listings,
  loading,
  error,
  handleListingAction,
  refreshListings,
  formatCurrency,
  formatDate,
  needsReviewCount,
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<ListingActionType>('suspend');
  const [actionTargets, setActionTargets] = useState<any[]>([]);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  const stats = useMemo(() => {
    const safeListings = Array.isArray(listings) ? listings : [];
    return {
      total: safeListings.length,
      active: safeListings.filter((l) => l.status === 'active').length,
      suspended: safeListings.filter((l) => l.status === 'suspended').length,
      needsReview: needsReviewCount,
    };
  }, [listings, needsReviewCount]);

  const filteredListings = useMemo(() => {
    const safeListings = Array.isArray(listings) ? listings : [];
    const now = Date.now();

    const threshold =
      periodFilter === '7d'
        ? now - 7 * 24 * 60 * 60 * 1000
        : periodFilter === '30d'
        ? now - 30 * 24 * 60 * 60 * 1000
        : periodFilter === '90d'
        ? now - 90 * 24 * 60 * 60 * 1000
        : 0;

    return safeListings
      .filter((listing) => {
        const createdAtMs = listing.created_at ? new Date(listing.created_at).getTime() : NaN;
        const hasValidDate = Number.isFinite(createdAtMs);
        const matchesPeriod = threshold === 0 || !hasValidDate || createdAtMs >= threshold;

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'needs_review' ? Boolean(listing.needs_review) : listing.status === statusFilter);

        const matchesSearch =
          !searchTerm ||
          listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.id?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesPeriod && matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [listings, searchTerm, statusFilter, periodFilter]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) || null,
    [listings, selectedListingId]
  );
  const selectedListings = useMemo(
    () => filteredListings.filter((listing) => selectedListingIds.includes(listing.id)),
    [filteredListings, selectedListingIds]
  );
  const selectedActiveCount = useMemo(
    () => selectedListings.filter((listing) => listing.status === 'active').length,
    [selectedListings]
  );
  const selectedSuspendedCount = useMemo(
    () => selectedListings.filter((listing) => listing.status === 'suspended').length,
    [selectedListings]
  );

  const getStatusBadgeClass = (status: string) => {
    if (status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'suspended') return 'bg-red-100 text-red-700';
    if (status === 'sold') return 'bg-blue-100 text-blue-700';
    if (status === 'expired') return 'bg-muted text-muted-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshListings();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openActionDialog = (listing: any, type: ListingActionType) => {
    setActionTargets([listing]);
    setActionType(type);
    setActionReason('');
    setActionNotes('');
    setShowActionDialog(true);
  };

  const openBulkActionDialog = (type: ListingActionType) => {
    const targets = filteredListings.filter((listing) => {
      if (!selectedListingIds.includes(listing.id)) return false;
      if (type === 'suspend') return listing.status === 'active';
      return true;
    });
    if (targets.length === 0) return;
    setActionTargets(targets);
    setActionType(type);
    setActionReason('');
    setActionNotes('');
    setShowActionDialog(true);
  };

  const toggleSelection = (listingId: string) => {
    setSelectedListingIds((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredListings.map((listing) => listing.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedListingIds.includes(id));
    setSelectedListingIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      const merged = new Set([...prev, ...filteredIds]);
      return Array.from(merged);
    });
  };

  const handleReactivate = async (listing: any) => {
    setActionLoadingId(listing.id);
    try {
      const ok = await handleListingAction(listing.id, {
        type: 'unsuspend',
        reason: 'Réactivation depuis la modération annonces',
      });
      if (ok) {
        await refreshListings();
      } else {
        toast({
          title: "Action non appliquée",
          description: "La réactivation a échoué. Vérifie vos droits d'administration.",
          variant: "destructive",
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkReactivate = async () => {
    const targets = filteredListings.filter(
      (listing) => selectedListingIds.includes(listing.id) && listing.status === 'suspended'
    );
    if (targets.length === 0) return;

    setActionLoadingId('__bulk__');
    try {
      const results = await Promise.all(
        targets.map((listing) =>
          handleListingAction(listing.id, {
            type: 'unsuspend',
            reason: 'Réactivation en masse depuis la modération annonces',
          })
        )
      );
      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        setSelectedListingIds([]);
        await refreshListings();
      }
      if (successCount === 0) {
        toast({
          title: "Action non appliquée",
          description: "Aucune annonce n'a été réactivée. Vérifie vos droits d'administration.",
          variant: "destructive",
        });
      } else if (successCount !== targets.length) {
        toast({
          title: "Action partielle",
          description: `${successCount}/${targets.length} annonces réactivées.`,
          variant: "destructive",
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmAction = async () => {
    if (actionTargets.length === 0) return;

    setActionLoadingId(actionTargets.length > 1 ? '__bulk__' : actionTargets[0].id);
    try {
      const results = await Promise.all(
        actionTargets.map((target) => {
          const fallbackReason =
            actionType === 'suspend'
              ? 'Suspension depuis la modération annonces'
              : 'Suppression depuis la modération annonces';
          const resolvedReason = actionReason.trim() || fallbackReason;
          if (actionType === 'suspend') {
            return handleListingAction(target.id, {
              type: 'suspend_listing',
              reason: resolvedReason,
              notes: actionNotes.trim() || undefined,
            });
          }
          return handleListingAction(target.id, {
            type: 'remove_listing',
            reason: resolvedReason,
            notes: actionNotes.trim() || undefined,
          });
        })
      );

      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        setShowActionDialog(false);
        setSelectedListingIds([]);
        await refreshListings();
      }
      if (successCount === 0) {
        toast({
          title: "Action non appliquée",
          description: "Aucune annonce n'a été mise à jour. Vérifie vos droits d'administration.",
          variant: "destructive",
        });
      } else if (successCount !== actionTargets.length) {
        toast({
          title: "Action partielle",
          description: `${successCount}/${actionTargets.length} annonces traitées.`,
          variant: "destructive",
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground">Impossible de charger les annonces</p>
            <p className="text-xs text-red-600 break-words">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (loading && stats.total === 0) {
    return (
      <div className="flex items-center justify-center min-h-64 p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement des annonces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gestion des annonces</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} annonces · {stats.needsReview} à réviser · {stats.suspended} suspendues
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              placeholder="Rechercher une annonce..."
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="suspended">Suspendues</SelectItem>
              <SelectItem value="needs_review">À réviser</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedListingIds.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{selectedListingIds.length} sélectionnées</Badge>
            {selectedActiveCount > 0 && (
              <Button size="sm" onClick={() => openBulkActionDialog('suspend')} disabled={actionLoadingId !== null}>
                <Pause className="mr-1 h-3.5 w-3.5" /> Suspendre en masse ({selectedActiveCount})
              </Button>
            )}
            {selectedSuspendedCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleBulkReactivate} disabled={actionLoadingId !== null}>
                <Play className="mr-1 h-3.5 w-3.5" /> Réactiver en masse ({selectedSuspendedCount})
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => openBulkActionDialog('delete')}
              disabled={actionLoadingId !== null}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer en masse
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedListingIds([])} disabled={actionLoadingId !== null}>
              Effacer la sélection
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Annonces ({filteredListings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={
                            filteredListings.length > 0 &&
                            filteredListings.every((listing) => selectedListingIds.includes(listing.id))
                          }
                          onChange={toggleSelectAllFiltered}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead className="min-w-[320px]">Annonce</TableHead>
                      <TableHead className="min-w-[110px]">Statut</TableHead>
                      <TableHead className="min-w-[100px]">Date</TableHead>
                      <TableHead className="min-w-[170px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredListings.map((listing) => (
                      <TableRow
                        key={listing.id}
                        onClick={() => setSelectedListingId(listing.id)}
                        className={`cursor-pointer hover:bg-muted/40 ${selectedListingId === listing.id ? 'bg-muted/50' : ''}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedListingIds.includes(listing.id)}
                            onChange={() => toggleSelection(listing.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {listing.merchant_name || 'Marchand'} · {listing.location || 'Lieu non précisé'}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(listing.price)}</p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={getStatusBadgeClass(listing.status)}>{listing.status}</Badge>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">{formatDate(listing.created_at)}</TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {listing.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openActionDialog(listing, 'suspend')}
                                disabled={actionLoadingId === listing.id}
                              >
                                <Pause className="mr-1 h-3.5 w-3.5" /> Suspendre
                              </Button>
                            ) : listing.status === 'suspended' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivate(listing)}
                                disabled={actionLoadingId === listing.id}
                              >
                                <Play className="mr-1 h-3.5 w-3.5" /> Réactiver
                              </Button>
                            ) : null}

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => openActionDialog(listing, 'delete')}
                              disabled={actionLoadingId === listing.id}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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
            <CardTitle className="text-base">Détails</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedListing ? (
              <p className="text-sm text-muted-foreground">Sélectionne une annonce pour voir les détails utiles.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedListing.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {selectedListing.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Marchand</p>
                    <p>{selectedListing.merchant_name || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Catégorie</p>
                    <p>{selectedListing.category_name || 'Sans catégorie'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Créée le</p>
                    <p>{formatDate(selectedListing.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mise à jour</p>
                    <p>{selectedListing.updated_at ? formatDate(selectedListing.updated_at) : 'Non disponible'}</p>
                  </div>
                </div>

                {selectedListing.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedListing.description}</p>
                  </div>
                )}

                {selectedListing.status === 'suspended' && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm space-y-1">
                    <p><span className="font-medium">Raison:</span> {selectedListing.suspension_reason || 'Non renseignée'}</p>
                    {selectedListing.suspended_until && (
                      <p><span className="font-medium">Suspendue jusqu'au:</span> {new Date(selectedListing.suspended_until).toLocaleString('fr-FR')}</p>
                    )}
                    {selectedListing.moderation_notes && (
                      <p><span className="font-medium">Notes:</span> {selectedListing.moderation_notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent className="w-[95vw] max-w-lg m-2 overflow-x-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'suspend'
                ? actionTargets.length > 1
                  ? `Suspendre ${actionTargets.length} annonces`
                  : "Suspendre l'annonce"
                : actionTargets.length > 1
                ? `Supprimer ${actionTargets.length} annonces`
                : "Supprimer l'annonce"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'suspend'
                ? "Cette action masque temporairement l'annonce sur la plateforme."
                : "Cette action supprime définitivement l'annonce."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-sm">Raison (optionnel)</Label>
              <Input
                className="mt-1"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: non conforme, doublon, demande utilisateur..."
              />
            </div>

            <div>
              <Label className="text-sm">Notes internes</Label>
              <Textarea
                className="mt-1"
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Notes optionnelles"
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto"
              onClick={(event) => {
                event.preventDefault();
                void confirmAction();
              }}
              disabled={!actionTargets.length || actionLoadingId !== null}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListingsTab;
