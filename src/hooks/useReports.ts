// hooks/useReports.ts

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Types pour le hook
interface GuestInfo {
  name: string;
  email: string;
  phone: string;
}

interface ReportSubmissionData {
  listingId?: string;
  listingTitle?: string;
  profileId?: string;
  profileName?: string;
  reason: string;
  description: string;
  guestInfo?: GuestInfo;
}

interface ReportFilters {
  status?: 'pending' | 'resolved' | 'dismissed';
  reportType?: 'listing' | 'profile';
  limit?: number;
  offset?: number;
}

interface UseReportsReturn {
  // États
  isSubmitting: boolean;
  isFetching: boolean;
  error: string | null;
  
  // Fonctions principales
  submitReport: (data: ReportSubmissionData, userId?: string) => Promise<boolean>;
  fetchReports: (filters?: ReportFilters) => Promise<any[]>;
  fetchReportById: (id: string) => Promise<any | null>;
  updateReportStatus: (id: string, status: string, adminNote?: string) => Promise<boolean>;
  fetchReportStats: () => Promise<{ pending: number; resolved: number; dismissed: number }>;
  
  // Utilitaires
  validateGuestInfo: (guestInfo: GuestInfo) => boolean;
  checkDuplicateReport: (userId: string, listingId?: string, profileId?: string) => Promise<boolean>;
}

export const useReports = (): UseReportsReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Validation des informations d'invité
  const validateGuestInfo = (guestInfo: GuestInfo): boolean => {
    return !!(
      guestInfo.name.trim() && 
      guestInfo.email.trim() &&
      guestInfo.email.includes('@')
    );
  };

  // Vérification des signalements en double
  const checkDuplicateReport = async (
    userId: string, 
    listingId?: string, 
    profileId?: string
  ): Promise<boolean> => {
    try {
      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq(listingId ? 'listing_id' : 'user_id', listingId || profileId)
        .eq('reporter_id', userId)
        .maybeSingle();

      return !!existingReport;
    } catch (error) {
      console.error('Error checking duplicate report:', error);
      return false;
    }
  };

  // Soumission d'un signalement
  const submitReport = async (data: ReportSubmissionData, userId?: string): Promise<boolean> => {
    const { listingId, profileId, reason, description, guestInfo, listingTitle, profileName } = data;
    
    // Validation des données requises
    if (!reason) {
      toast({
        title: "Motif requis",
        description: "Veuillez sélectionner un motif de signalement.",
        variant: "destructive"
      });
      return false;
    }

    // Validation pour les invités
    if (!userId && (!guestInfo || !validateGuestInfo(guestInfo))) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez renseigner au moins votre nom et email.",
        variant: "destructive"
      });
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Vérification des doublons pour les utilisateurs connectés
      if (userId) {
        const isDuplicate = await checkDuplicateReport(userId, listingId, profileId);
        if (isDuplicate) {
          toast({
            title: "Déjà signalé",
            description: `Vous avez déjà signalé ${profileId ? 'ce profil' : 'cette annonce'}.`,
            variant: "destructive"
          });
          return false;
        }
      }

      // Préparation du payload
      const reportPayload = {
        listing_id: listingId || null,
        user_id: profileId || null,
        reporter_id: userId || null,
        reason,
        description: description.trim() || null,
        status: 'pending' as const,
        report_type: profileId ? 'profile' : 'listing',
        
        // Données invité si applicable
        ...(!userId && guestInfo && validateGuestInfo(guestInfo) && {
          guest_name: guestInfo.name.trim(),
          guest_email: guestInfo.email.trim(),
          guest_phone: guestInfo.phone.trim() || null,
        })
      };

      // Soumission à Supabase
      const { error: submitError } = await supabase
        .from('reports')
        .insert(reportPayload);

      if (submitError) {
        console.error('Report submission error:', submitError);
        throw submitError;
      }

      // Message de succès
      const entityType = profileId ? 'profil' : 'annonce';
      const userType = userId ? 'Votre signalement' : 'Votre signalement anonyme';
      const entityName = profileId ? profileName : listingTitle;
      
      toast({
        title: "Signalement envoyé",
        description: `${userType} concernant ${entityType === 'annonce' ? 'l\'' : 'le '}${entityType} "${entityName || 'cet élément'}" a été transmis à notre équipe de modération.`,
        duration: 6000
      });

      return true;

    } catch (error) {
      console.error('Error submitting report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue s\'est produite';
      setError(errorMessage);
      
      toast({
        title: "Erreur lors du signalement",
        description: "Une erreur s'est produite. Veuillez réessayer dans quelques instants.",
        variant: "destructive"
      });

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Récupération des signalements (pour l'admin)
  const fetchReports = async (filters: ReportFilters = {}): Promise<any[]> => {
    setIsFetching(true);
    setError(null);

    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          listing:listings(*),
          reported_user:profiles!user_id(*),
          reporter:profiles!reporter_id(*)
        `)
        .order('created_at', { ascending: false });

      // Application des filtres
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.reportType) {
        query = query.eq('report_type', filters.reportType);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      return data || [];

    } catch (error) {
      console.error('Error fetching reports:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération';
      setError(errorMessage);
      return [];
    } finally {
      setIsFetching(false);
    }
  };

  // Récupération d'un signalement par ID
  const fetchReportById = async (id: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          listing:listings(*),
          reported_user:profiles!user_id(*),
          reporter:profiles!reporter_id(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération');
      return null;
    }
  };

  // Mise à jour du statut d'un signalement
  const updateReportStatus = async (
    id: string, 
    status: string, 
    adminNote?: string
  ): Promise<boolean> => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (adminNote) {
        updateData.admin_note = adminNote;
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Signalement mis à jour",
        description: `Le statut a été changé vers "${status}".`,
      });

      return true;
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour le signalement.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Statistiques des signalements
  const fetchReportStats = async (): Promise<{ pending: number; resolved: number; dismissed: number }> => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('status');

      if (error) {
        throw error;
      }

      const stats = { pending: 0, resolved: 0, dismissed: 0 };
      data?.forEach((report) => {
        if (report.status in stats) {
          stats[report.status as keyof typeof stats]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching report stats:', error);
      return { pending: 0, resolved: 0, dismissed: 0 };
    }
  };

  return {
    // États
    isSubmitting,
    isFetching,
    error,
    
    // Fonctions
    submitReport,
    fetchReports,
    fetchReportById,
    updateReportStatus,
    fetchReportStats,
    
    // Utilitaires
    validateGuestInfo,
    checkDuplicateReport
  };
};