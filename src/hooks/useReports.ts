import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  listing_id: string;
  user_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const reportListing = async (listingId: string, reason: string, description?: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour signaler une annonce",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // Vérifier si l'utilisateur a déjà signalé cette annonce
      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', user.id)
        .single();

      if (existingReport) {
        toast({
          title: "Déjà signalé",
          description: "Vous avez déjà signalé cette annonce",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('reports')
        .insert({
          listing_id: listingId,
          user_id: user.id,
          reason,
          description,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Signalement envoyé",
        description: "Merci pour votre signalement. Notre équipe va l'examiner."
      });

      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du signalement",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    reportListing,
    loading
  };
};