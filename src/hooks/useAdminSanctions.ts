import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

export interface ActiveSanction {
  id: string;
  type: 'user' | 'listing';
  target_id: string;
  target_name: string;
  target_email?: string;
  sanction_type: string;
  reason: string;
  admin_name: string;
  admin_id: string;
  created_at: string;
  expires_at?: string;
  is_permanent: boolean;
  status: 'active' | 'expired' | 'revoked';
  days_remaining?: number;
  notes?: string;
  description?: string;
  duration_days?: number;
  effective_from?: string;
  revoked_at?: string;
  revoked_by?: string;
  revoked_reason?: string;
}

export interface SanctionsStats {
  totalActive: number;
  userSanctions: number;
  listingSanctions: number;
  temporaryCount: number;
  permanentCount: number;
  expiringSoon: number;
  expiredToday: number;
  createdToday: number;
}

export const useAdminSanctions = () => {
  const [sanctions, setSanctions] = useState<ActiveSanction[]>([]);
  const [stats, setStats] = useState<SanctionsStats>({
    totalActive: 0,
    userSanctions: 0,
    listingSanctions: 0,
    temporaryCount: 0,
    permanentCount: 0,
    expiringSoon: 0,
    expiredToday: 0,
    createdToday: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const fetchActiveSanctions = useCallback(async () => {
    console.log('🔍 [ADMIN_SANCTIONS] Tentative de récupération des sanctions...');
    
    try {
      setLoading(true);
      setError(null);
      const now = new Date();

      // 1. SANCTIONS UTILISATEURS - Requête corrigée
      console.log('Récupération des sanctions utilisateurs...');
      const { data: userSanctions, error: userError } = await supabase
        .from('user_sanctions')
        .select(`
          id,
          user_id,
          admin_id,
          sanction_type,
          reason,
          description,
          duration_days,
          effective_from,
          effective_until,
          status,
          created_at,
          updated_at,
          revoked_at,
          revoked_by,
          revoked_reason,
          related_report_id
        `)
        .or('status.eq.active,status.eq.expired');

      if (userError) {
        console.error('❌ Erreur sanctions utilisateurs:', userError);
        throw new Error(`Erreur user_sanctions: ${userError.message}`);
      }

      console.log(`✅ Sanctions utilisateurs: ${userSanctions?.length || 0} trouvées.`);

      // 2. ANNONCES SUSPENDUES - Requête corrigée
      console.log('Récupération des annonces suspendues...');
      const { data: suspendedListings, error: listingError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          price,
          status,
          user_id,
          suspended_until,
          suspension_reason,
          moderation_notes,
          suspension_type,
          suspended_by,
          updated_at,
          created_at
        `)
        .eq('status', 'suspended');

      if (listingError) {
        console.error('❌ Erreur annonces suspendues:', listingError);
        throw new Error(`Erreur listings: ${listingError.message}`);
      }

      console.log(`✅ Annonces suspendues: ${suspendedListings?.length || 0} trouvées.`);

      // 3. RÉCUPÉRATION DES PROFILS
      const allUserIds = new Set<string>();
      const allAdminIds = new Set<string>();

      userSanctions?.forEach(s => {
        if (s.user_id) allUserIds.add(s.user_id);
        if (s.admin_id) allAdminIds.add(s.admin_id);
        if (s.revoked_by) allAdminIds.add(s.revoked_by);
      });
      
      suspendedListings?.forEach(s => {
        if (s.user_id) allUserIds.add(s.user_id);
        if (s.suspended_by) allAdminIds.add(s.suspended_by);
      });

      const allIds = [...allUserIds, ...allAdminIds];
      let profilesMap = new Map();
      
      if (allIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', allIds);

        if (profileError) {
          console.warn('Avertissement profils:', profileError);
        } else {
          profiles?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      // 4. NORMALISATION - Sanctions utilisateurs
      const normalizedSanctions: ActiveSanction[] = [];

      userSanctions?.forEach(sanction => {
        const userProfile = profilesMap.get(sanction.user_id);
        const adminProfile = profilesMap.get(sanction.admin_id);
        
        const expiresAt = sanction.effective_until ? new Date(sanction.effective_until) : null;
        const isExpired = expiresAt && expiresAt < now;
        const daysRemaining = expiresAt ? 
          Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

        normalizedSanctions.push({
          id: sanction.id,
          type: 'user',
          target_id: sanction.user_id,
          target_name: userProfile?.full_name || 'Utilisateur inconnu',
          target_email: userProfile?.email,
          sanction_type: sanction.sanction_type || 'suspend',
          reason: sanction.reason || 'Raison non spécifiée',
          admin_name: adminProfile?.full_name || 'Admin inconnu',
          admin_id: sanction.admin_id || '',
          created_at: sanction.created_at,
          expires_at: sanction.effective_until,
          is_permanent: !sanction.effective_until,
          status: isExpired ? 'expired' : sanction.status as any,
          days_remaining: daysRemaining,
          
          notes: sanction.description,
          description: sanction.description,
          duration_days: sanction.duration_days,
          effective_from: sanction.effective_from,
          revoked_at: sanction.revoked_at,
          revoked_by: sanction.revoked_by,
          revoked_reason: sanction.revoked_reason
        });
      });

      // 5. NORMALISATION - Annonces suspendues
      suspendedListings?.forEach(listing => {
        const userProfile = profilesMap.get(listing.user_id);
        const adminProfile = profilesMap.get(listing.suspended_by);
        
        const expiresAt = listing.suspended_until ? new Date(listing.suspended_until) : null;
        const isExpired = expiresAt && expiresAt < now;
        const daysRemaining = expiresAt ? 
          Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

        normalizedSanctions.push({
          id: listing.id,
          type: 'listing',
          target_id: listing.id,
          target_name: listing.title || 'Annonce sans titre',
          target_email: userProfile?.email,
          sanction_type: 'suspend',
          reason: listing.suspension_reason || 'Suspension d\'annonce',
          admin_name: adminProfile?.full_name || 'Système',
          admin_id: listing.suspended_by || '',
          created_at: listing.updated_at || listing.created_at,
          expires_at: listing.suspended_until,
          is_permanent: !listing.suspended_until,
          status: isExpired ? 'expired' : 'active',
          days_remaining: daysRemaining,
          
          notes: listing.moderation_notes
        });
      });

      // 6. CALCUL DES STATISTIQUES
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const activeOnly = normalizedSanctions.filter(s => s.status === 'active');
      const expiringSoon = activeOnly.filter(s => 
        s.days_remaining !== null && s.days_remaining <= 1 && s.days_remaining > 0
      );
      const expiredToday = normalizedSanctions.filter(s => 
        s.status === 'expired' && s.expires_at && 
        new Date(s.expires_at).toDateString() === today.toDateString()
      );
      const createdToday = normalizedSanctions.filter(s => {
        const createdDate = new Date(s.created_at);
        return createdDate >= today && createdDate < tomorrow;
      });

      const calculatedStats: SanctionsStats = {
        totalActive: activeOnly.length,
        userSanctions: activeOnly.filter(s => s.type === 'user').length,
        listingSanctions: activeOnly.filter(s => s.type === 'listing').length,
        temporaryCount: activeOnly.filter(s => !s.is_permanent).length,
        permanentCount: activeOnly.filter(s => s.is_permanent).length,
        expiringSoon: expiringSoon.length,
        expiredToday: expiredToday.length,
        createdToday: createdToday.length
      };

      console.log('✅ [ADMIN_SANCTIONS] Récupération réussie:', calculatedStats);
      
      setSanctions(normalizedSanctions);
      setStats(calculatedStats);

    } catch (err) {
      console.error('❌ [ADMIN_SANCTIONS] Erreur:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      
      toast({
        title: "Erreur de chargement des sanctions",
        description: `Impossible de charger les sanctions: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // RÉVOCATION - Fonction corrigée
  const revokeSanction = useCallback(async (sanctionId: string, sanctionType: 'user' | 'listing', reason: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour révoquer une sanction.",
        variant: "destructive"
      });
      return false;
    }

    try {
      if (sanctionType === 'user') {
        // Révocation dans user_sanctions - utilise les vraies colonnes
        const { error } = await supabase
          .from('user_sanctions')
          .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            revoked_by: user.id,
            revoked_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', sanctionId);

        if (error) throw error;

      } else {
        // Révocation d'annonce suspendue
        const currentSanction = sanctions.find(s => s.id === sanctionId);
        const currentNotes = currentSanction?.notes || '';
        const revocationNote = `RÉVOQUÉE le ${new Date().toLocaleDateString('fr-FR')} par ${user.email}: ${reason}`;
        
        const { error } = await supabase
          .from('listings')
          .update({
            status: 'active',
            suspended_until: null,
            suspension_reason: null,
            moderation_notes: currentNotes ? `${currentNotes}\n\n${revocationNote}` : revocationNote,
            updated_at: new Date().toISOString()
          })
          .eq('id', sanctionId);

        if (error) throw error;
      }

      // Audit trail
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: 'revoke_sanction',
          target_type: sanctionType,
          target_id: sanctionId,
          reason: reason,
          metadata: { 
            revocation_timestamp: new Date().toISOString()
          }
        });

      toast({
        title: "Sanction révoquée",
        description: "La sanction a été révoquée avec succès"
      });

      await fetchActiveSanctions();
      return true;

    } catch (error) {
      console.error('❌ Erreur révocation:', error);
      toast({
        title: "Erreur de révocation",
        description: error instanceof Error ? error.message : "Impossible de révoquer la sanction",
        variant: "destructive"
      });
      return false;
    }
  }, [user, sanctions, toast, fetchActiveSanctions]);

  // EXTENSION - Fonction corrigée
  const extendSanction = useCallback(async (sanctionId: string, sanctionType: 'user' | 'listing', additionalDays: number): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour étendre une sanction.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const sanction = sanctions.find(s => s.id === sanctionId);
      if (!sanction) throw new Error('Sanction introuvable');

      const currentExpiry = sanction.expires_at ? new Date(sanction.expires_at) : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);

      if (sanctionType === 'user') {
        // Pour user_sanctions - utiliser effective_until et description
        const currentDescription = sanction.description || '';
        const extensionNote = `ÉTENDUE de ${additionalDays} jour(s) le ${new Date().toLocaleDateString('fr-FR')}`;
        
        const { error } = await supabase
          .from('user_sanctions')
          .update({
            effective_until: newExpiry.toISOString(),
            description: currentDescription ? `${currentDescription}\n${extensionNote}` : extensionNote,
            updated_at: new Date().toISOString()
          })
          .eq('id', sanctionId);

        if (error) throw error;

      } else {
        // Pour listings - utiliser suspended_until et moderation_notes
        const currentNotes = sanction.notes || '';
        const extensionNote = `ÉTENDUE de ${additionalDays} jour(s) le ${new Date().toLocaleDateString('fr-FR')} par ${user.email}`;
        
        const { error } = await supabase
          .from('listings')
          .update({
            suspended_until: newExpiry.toISOString(),
            moderation_notes: currentNotes ? `${currentNotes}\n${extensionNote}` : extensionNote,
            updated_at: new Date().toISOString()
          })
          .eq('id', sanctionId);

        if (error) throw error;
      }

      // Audit
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: 'extend_sanction',
          target_type: sanctionType,
          target_id: sanctionId,
          reason: `Extension de ${additionalDays} jours`,
          metadata: { 
            additional_days: additionalDays,
            new_expiry: newExpiry.toISOString(),
            original_expiry: sanction.expires_at
          }
        });

      toast({
        title: "Sanction étendue",
        description: `La sanction a été étendue de ${additionalDays} jour(s) jusqu'au ${newExpiry.toLocaleDateString('fr-FR')}`
      });

      await fetchActiveSanctions();
      return true;

    } catch (error) {
      console.error('❌ Erreur extension:', error);
      toast({
        title: "Erreur d'extension",
        description: error instanceof Error ? error.message : "Impossible d'étendre la sanction",
        variant: "destructive"
      });
      return false;
    }
  }, [user, sanctions, toast, fetchActiveSanctions]);

  // CONVERSION PERMANENTE - Fonction corrigée
  const convertToPermanent = useCallback(async (sanctionId: string, sanctionType: 'user' | 'listing', reason: string): Promise<boolean> => {
    if (!user) return false;

    try {
      if (sanctionType === 'user') {
        // Pour user_sanctions - utiliser effective_until et description
        const currentSanction = sanctions.find(s => s.id === sanctionId);
        const currentDescription = currentSanction?.description || '';
        const conversionNote = `CONVERTIE EN PERMANENTE le ${new Date().toLocaleDateString('fr-FR')}: ${reason}`;
        
        const { error } = await supabase
          .from('user_sanctions')
          .update({
            effective_until: null,
            description: currentDescription ? `${currentDescription}\n${conversionNote}` : conversionNote,
            updated_at: new Date().toISOString()
          })
          .eq('id', sanctionId);

        if (error) throw error;

      } else {
        // Pour listings
        const currentSanction = sanctions.find(s => s.id === sanctionId);
        const currentNotes = currentSanction?.notes || '';
        const conversionNote = `CONVERTIE EN PERMANENTE le ${new Date().toLocaleDateString('fr-FR')} par ${user.email}: ${reason}`;
        
        const { error } = await supabase
          .from('listings')
          .update({
            suspended_until: null,
            moderation_notes: currentNotes ? `${currentNotes}\n${conversionNote}` : conversionNote,
            updated_at: new Date().toISOString()
          })
          .eq('id', sanctionId);

        if (error) throw error;
      }

      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: 'convert_to_permanent',
          target_type: sanctionType,
          target_id: sanctionId,
          reason: reason,
          metadata: { conversion_type: 'temporary_to_permanent' }
        });

      toast({
        title: "Sanction convertie",
        description: "La sanction a été convertie en permanente"
      });

      await fetchActiveSanctions();
      return true;

    } catch (error) {
      console.error('❌ Erreur conversion:', error);
      toast({
        title: "Erreur de conversion",
        description: error instanceof Error ? error.message : "Impossible de convertir la sanction",
        variant: "destructive"
      });
      return false;
    }
  }, [user, sanctions, toast, fetchActiveSanctions]);

  // Fonctions utilitaires
  const searchSanctions = useCallback((searchTerm: string, type?: 'user' | 'listing', status?: 'active' | 'expired') => {
    let filtered = sanctions;

    if (type) {
      filtered = filtered.filter(s => s.type === type);
    }

    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.target_name.toLowerCase().includes(term) ||
        s.reason.toLowerCase().includes(term) ||
        s.admin_name.toLowerCase().includes(term) ||
        s.target_email?.toLowerCase().includes(term) ||
        s.sanction_type.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [sanctions]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatDaysRemaining = useCallback((days: number | null) => {
    if (days === null) return 'Permanente';
    if (days <= 0) return 'Expirée';
    if (days === 1) return '1 jour restant';
    return `${days} jours restants`;
  }, []);

  const getSanctionPriority = useCallback((sanction: ActiveSanction): 'high' | 'medium' | 'low' => {
    if (sanction.status === 'expired') return 'high';
    if (sanction.days_remaining !== null && sanction.days_remaining <= 1) return 'high';
    if (sanction.sanction_type === 'ban') return 'medium';
    return 'low';
  }, []);

  // Initialisation
  useEffect(() => {
    console.log('🚀 [ADMIN_SANCTIONS] Initialisation avec structure corrigée');
    fetchActiveSanctions();

    // Pour des raisons de performance, l'intervalle est désactivé
    // Si tu veux le réactiver, décommente la ligne ci-dessous
    // const interval = setInterval(fetchActiveSanctions, 5 * 60 * 1000);
    // return () => clearInterval(interval);
  }, [fetchActiveSanctions]);

  return {
    sanctions,
    stats,
    loading,
    error,
    revokeSanction,
    extendSanction,
    convertToPermanent,
    searchSanctions,
    formatDate,
    formatDaysRemaining,
    getSanctionPriority,
    refreshSanctions: fetchActiveSanctions,
    activeSanctionsCount: sanctions.filter(s => s.status === 'active').length,
    expiringSoonCount: sanctions.filter(s => s.days_remaining !== null && s.days_remaining <= 1).length,
    expiredTodayCount: stats.expiredToday,
    highPrioritySanctionsCount: sanctions.filter(s => getSanctionPriority(s) === 'high').length,
    isHealthy: !loading && !error,
    lastRefresh: new Date().toISOString()
  };
};
