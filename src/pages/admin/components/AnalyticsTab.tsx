import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { AlertTriangle, ShieldCheck, UserPlus, Package, Flag, Eye } from "lucide-react";
import { DashboardStats } from '@/hooks/useAdminDashboard';
import { supabase } from '@/lib/supabase';

interface AnalyticsTabProps {
  dashboardStats: DashboardStats | null;
  weeklyData: any[];
  users: any[];
  listings: any[];
  reports: any[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ dashboardStats, weeklyData, users, listings, reports }) => {
  const [uniqueVisitors7d, setUniqueVisitors7d] = useState(0);

  useEffect(() => {
    const loadUniqueVisitors = async () => {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('listing_views')
          .select('visitor_id')
          .gte('viewed_at', sevenDaysAgo);

        if (error) {
          console.error('Erreur chargement visiteurs (7j):', error);
          setUniqueVisitors7d(0);
          return;
        }

        const unique = new Set((data || []).map((row: any) => row.visitor_id).filter(Boolean)).size;
        setUniqueVisitors7d(unique);
      } catch (error) {
        console.error('Erreur chargement visiteurs (7j):', error);
        setUniqueVisitors7d(0);
      }
    };

    loadUniqueVisitors();
  }, []);

  const kpis = useMemo(() => {
    const pendingReports = reports.filter((r) => r.status === 'pending').length;
    const inReviewReports = reports.filter((r) => r.status === 'in_review').length;
    const activeListings = listings.filter((l) => l.status === 'active').length;
    const suspendedListings = listings.filter((l) => l.status === 'suspended').length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsers7d = users.filter((u) => new Date(u.created_at).getTime() >= sevenDaysAgo).length;

    return {
      pendingReports,
      inReviewReports,
      activeListings,
      suspendedListings,
      newUsers7d,
    };
  }, [users, listings, reports]);

  const categoryRiskData = useMemo(() => {
    const map = new Map<string, { category: string; listings: number; reports: number }>();

    listings.forEach((listing) => {
      const key = listing.category_name || listing.categories?.name || 'Sans catégorie';
      const current = map.get(key) || { category: key, listings: 0, reports: 0 };
      current.listings += 1;
      map.set(key, current);
    });

    reports.forEach((report) => {
      if (!report.listing_id) return;
      const listing = listings.find((l) => l.id === report.listing_id);
      if (!listing) return;
      const key = listing.category_name || listing.categories?.name || 'Sans catégorie';
      const current = map.get(key) || { category: key, listings: 0, reports: 0 };
      current.reports += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        reportRate: row.listings > 0 ? Number(((row.reports / row.listings) * 100).toFixed(1)) : 0,
      }))
      .filter((row) => row.listings > 0)
      .sort((a, b) => b.reportRate - a.reportRate)
      .slice(0, 8);
  }, [listings, reports]);

  const topReportedSellers = useMemo(() => {
    const bySeller = new Map<string, { sellerId: string; sellerName: string; reports: number; activeListings: number }>();

    reports.forEach((report) => {
      const listing = listings.find((l) => l.id === report.listing_id);
      if (!listing) return;
      const sellerId = listing.user_id;
      const sellerName = listing.merchant_name || 'Marchand inconnu';

      const current = bySeller.get(sellerId) || {
        sellerId,
        sellerName,
        reports: 0,
        activeListings: listings.filter((l) => l.user_id === sellerId && l.status === 'active').length,
      };

      current.reports += 1;
      bySeller.set(sellerId, current);
    });

    return Array.from(bySeller.values()).sort((a, b) => b.reports - a.reports).slice(0, 8);
  }, [listings, reports]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Signalements en attente</p>
                <p className="text-2xl font-semibold">{kpis.pendingReports}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Annonces actives</p>
                <p className="text-2xl font-semibold">{kpis.activeListings}</p>
              </div>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Annonces suspendues</p>
                <p className="text-2xl font-semibold">{kpis.suspendedListings}</p>
              </div>
              <Flag className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Nouveaux comptes (7j)</p>
                <p className="text-2xl font-semibold">{kpis.newUsers7d}</p>
              </div>
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Signalements en cours</p>
                <p className="text-2xl font-semibold">{kpis.inReviewReports}</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Visiteurs annonces (7j)</p>
                <p className="text-2xl font-semibold">{uniqueVisitors7d}</p>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Tendance hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#2563eb" name="Utilisateurs" strokeWidth={2} />
                <Line type="monotone" dataKey="listings" stroke="#059669" name="Annonces" strokeWidth={2} />
                <Line type="monotone" dataKey="reports" stroke="#dc2626" name="Signalements" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Catégories à risque</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryRiskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reportRate" fill="#b91c1c" name="Taux signalement (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Top vendeurs signalés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topReportedSellers.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune donnée de signalement vendeur.</p>
            )}
            {topReportedSellers.map((seller) => (
              <div key={seller.sellerId} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{seller.sellerName}</p>
                  <p className="text-xs text-muted-foreground">{seller.activeListings} annonce(s) active(s)</p>
                </div>
                <Badge variant="outline">{seller.reports} signalement(s)</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
