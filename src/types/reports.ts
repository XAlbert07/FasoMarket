// types/reports.ts
// Extension de vos types existants pour supporter les signalements invités et profils

export interface EnhancedReport extends Report {
  // Ajout de champs pour les signalements invités
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  
  // Type de signalement pour différencier annonces/profils
  report_type: 'listing' | 'profile';
  
  // Metadata pour une meilleure traçabilité
  user_agent?: string;
  ip_address?: string; // Géré côté backend pour éviter les abus
}

export interface ReportFormData {
  reason: string;
  description?: string;
  // Pour les utilisateurs invités
  guestInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

// hooks/useEnhancedReports.ts
// Hook amélioré qui remplace votre useReports existant avec plus de flexibilité

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedReportData {
  reason: string;
  description?: string;
  guestInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}


export interface ReportAction {
  type: 'approve' | 'dismiss' | 'escalate' | 'ban_user' | 'suspend_user' | 'warn_user' | 'remove_listing' | 'suspend_listing';
  reason: string;
  notes?: string;
  duration?: number; // En jours pour les sanctions temporaires
  allowPermanent?: boolean; // Permet de savoir si la sanction peut être permanente
  supportsDuration?: boolean; // Indique si la durée est applicable
}


export const useEnhancedReports = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  // Fonction pour signaler une annonce (utilisateur connecté ou invité)
  const reportListing = async (listingId: string, reportData: EnhancedReportData) => {
    return await submitReport('listing', listingId, null, reportData);
  };

  // Fonction pour signaler un profil utilisateur (utilisateur connecté ou invité)
  const reportProfile = async (userId: string, reportData: EnhancedReportData) => {
    return await submitReport('profile', null, userId, reportData);
  };

  // Fonction générique de soumission des signalements
  const submitReport = async (
    reportType: 'listing' | 'profile',
    listingId: string | null,
    userId: string | null,
    reportData: EnhancedReportData
  ) => {
    setLoading(true);
    
    try {
      // Pour les utilisateurs connectés, vérifier s'ils ont déjà signalé
      if (user) {
        const { data: existingReport } = await supabase
          .from('reports')
          .select('id')
          .eq('listing_id', listingId)
          .eq('user_id', userId)
          .eq('reporter_id', user.id)
          .single();

        if (existingReport) {
          toast({
            title: "Déjà signalé",
            description: `Vous avez déjà signalé ${reportType === 'listing' ? 'cette annonce' : 'ce profil'}`,
            variant: "destructive"
          });
          return false;
        }
      }

      // Préparation des données selon le type d'utilisateur
      const reportPayload = {
        listing_id: listingId,
        user_id: userId,
        reporter_id: user?.id || null,
        reason: reportData.reason,
        description: reportData.description || null,
        status: 'pending' as const,
        report_type: reportType,
        
        // Pour les utilisateurs invités, on stocke leurs informations
        ...(reportData.guestInfo && !user && {
          guest_name: reportData.guestInfo.name,
          guest_email: reportData.guestInfo.email,
          guest_phone: reportData.guestInfo.phone || null,
        })
      };

      const { error } = await supabase
        .from('reports')
        .insert(reportPayload);

      if (error) {
        console.error('Report submission error:', error);
        throw error;
      }

      // Messages de succès contextuels
      const entityType = reportType === 'listing' ? 'annonce' : 'profil';
      const userType = user ? 'Votre signalement' : 'Votre signalement anonyme';
      
      toast({
        title: "Signalement envoyé",
        description: `${userType} concernant ${entityType === 'annonce' ? 'cette' : 'ce'} ${entityType} a été transmis à notre équipe de modération.`,
        duration: 5000
      });

      return true;

    } catch (error) {
      console.error('Error submitting report:', error);
      
      toast({
        title: "Erreur lors du signalement",
        description: "Impossible d'envoyer le signalement. Veuillez réessayer.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction utilitaire pour vérifier les limitations (anti-spam)
  const checkReportLimitations = async (entityId: string, entityType: 'listing' | 'profile') => {
    // Pour les utilisateurs invités, on pourrait implémenter une limitation par IP
    // côté backend. Ici on se contente de vérifications basiques
    
    if (!user) {
      // Les invités ont des limitations plus strictes
      // Cette logique pourrait être étendue avec du rate limiting côté serveur
      return true;
    }

    return true;
  };

  return {
    reportListing,
    reportProfile,
    loading,
    checkReportLimitations
  };
};