// pages/admin/components/ListingsTab.tsx
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, Star, XCircle, Trash2, AlertTriangle, Package, Activity, TrendingUp, Filter } from "lucide-react";

interface ListingsTabProps {
  listings: any[];
  loading: boolean;
  handleListingAction: (id: string, action: any) => Promise<boolean>;
  getQualityScoreColor: (score: number) => string;
  needsReviewCount: number;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

const ListingsTab: React.FC<ListingsTabProps> = ({
  listings,
  loading,
  handleListingAction,
  getQualityScoreColor,
  needsReviewCount,
  formatCurrency,
  formatDate
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [selectedListings, setSelectedListings] = useState<string[]>([]);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchTerm || 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || listing.category_name === categoryFilter;
    const matchesQuality = qualityFilter === "all" || 
      (qualityFilter === "high" && listing.quality_score >= 80) ||
      (qualityFilter === "medium" && listing.quality_score >= 50 && listing.quality_score < 80) ||
      (qualityFilter === "low" && listing.quality_score < 50);
    
    return matchesSearch && matchesStatus && matchesCategory && matchesQuality;
  });

  const categories = [...new Set(listings.map(l => l.category_name))];

  const handleSelectListing = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleSelectAll = () => {
    setSelectedListings(selectedListings.length === filteredListings.length ? [] : filteredListings.map(l => l.id));
  };

  const handleBulkAction = async (action: string) => {
    for (const listingId of selectedListings) {
      await handleListingAction(listingId, { type: action, reason: `Action en masse: ${action}` });
    }
    setSelectedListings([]);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      sold: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    suspended: listings.filter(l => l.status === 'suspended').length,
    needsReview: needsReviewCount,
    featured: listings.filter(l => l.is_featured).length,
    avgQuality: listings.length ? Math.round(listings.reduce((sum, l) => sum + l.quality_score, 0) / listings.length) : 0,
    totalViews: listings.reduce((sum, l) => sum + l.views_count, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Chargement des annonces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header et contrôles */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des annonces</h2>
        <div className="flex space-x-2">
          <Input 
            placeholder="Rechercher annonce..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Actives ({stats.active})</SelectItem>
              <SelectItem value="suspended">Suspendues ({stats.suspended})</SelectItem>
              <SelectItem value="sold">Vendues</SelectItem>
              <SelectItem value="expired">Expirées</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={qualityFilter} onValueChange={setQualityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes qualités</SelectItem>
              <SelectItem value="high">Haute qualité (80%+)</SelectItem>
              <SelectItem value="medium">Qualité moyenne (50-79%)</SelectItem>
              <SelectItem value="low">Faible qualité (&lt;50%)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtres avancés
          </Button>
        </div>
      </div>

      {/* Statistiques des annonces */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total annonces</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">À réviser</p>
                <p className="text-2xl font-bold text-orange-600">{stats.needsReview}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En vedette</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vues totales</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de performance */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.avgQuality}%</div>
              <p className="text-xs text-gray-500">Qualité moyenne</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500">Taux d'activation</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {stats.total > 0 ? Math.round(stats.totalViews / stats.total) : 0}
              </div>
              <p className="text-xs text-gray-500">Vues moyennes</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {stats.total > 0 ? Math.round((stats.needsReview / stats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500">Nécessitent révision</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions en masse */}
      {selectedListings.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedListings.length} annonce(s) sélectionnée(s)
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('feature')}>
                  <Star className="h-4 w-4 mr-1" />
                  Mettre en vedette
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('suspend')}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Suspendre
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('approve')}>
                  Approuver
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedListings([])}>
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des annonces */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedListings.length === filteredListings.length && filteredListings.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Annonce</TableHead>
                <TableHead>Marchand</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Qualité</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredListings.map((listing) => (
                <TableRow 
                  key={listing.id} 
                  className={listing.needs_review ? 'bg-orange-50' : ''}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedListings.includes(listing.id)}
                      onChange={() => handleSelectListing(listing.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium max-w-48 truncate">{listing.title}</span>
                        {listing.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
                        {listing.needs_review && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      </div>
                      <span className="text-sm text-gray-500">{listing.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{listing.merchant_name}</span>
                      <span className="text-xs text-gray-500">{listing.merchant_email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency ? formatCurrency(listing.price) : `${listing.price.toLocaleString()} CFA`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{listing.category_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{listing.views_count}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Star className="h-3 w-3" />
                        <span>{listing.favorites_count}</span>
                      </div>
                      {listing.engagement_rate > 0 && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span>{listing.engagement_rate.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            listing.quality_score >= 80 ? 'bg-green-500' : 
                            listing.quality_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${listing.quality_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{listing.quality_score}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" title="Voir détails">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {listing.status === 'active' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            title={listing.is_featured ? "Retirer de la vedette" : "Mettre en vedette"}
                            onClick={() => handleListingAction(listing.id, {
                              type: listing.is_featured ? 'unfeature' : 'feature',
                              reason: listing.is_featured ? 'Retrait de la vedette' : 'Mise en vedette'
                            })}
                          >
                            <Star className={`h-4 w-4 ${listing.is_featured ? 'text-yellow-500 fill-current' : ''}`} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            title="Suspendre"
                            onClick={() => handleListingAction(listing.id, {
                              type: 'suspend',
                              reason: 'Suspension administrative'
                            })}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" title="Supprimer">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'annonce</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera définitivement l'annonce "{listing.title}". 
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleListingAction(listing.id, {
                                type: 'delete',
                                reason: 'Suppression administrative'
                              })}
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alertes annonces problématiques */}
      {listings.filter(l => l.needs_review).length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800">Annonces nécessitant une révision</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {listings.filter(l => l.needs_review).length} annonce(s) ont été signalées comme nécessitant 
                  une attention particulière (prix suspects, contenu manquant, signalements multiples).
                </p>
                <Button size="sm" variant="outline" className="mt-2">
                  Réviser les annonces prioritaires
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ListingsTab;