// hooks/usePresenceCleanup.ts - VERSION SIMPLIFIÉE ET STABLE
// Hook pour nettoyer automatiquement les statuts obsolètes sans surcharger le système

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

export const usePresenceCleanup = () => {
  const { user } = useAuthContext();
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  /**
   * Nettoie les statuts de présence obsolètes de manière intelligente
   * Cette fonction évite la surcharge en utilisant un approche minimaliste
   */
  const cleanupStalePresence = useCallback(async () => {
    // Éviter les exécutions concurrentes
    if (isRunningRef.current || !user) return;
    
    isRunningRef.current = true;

    try {
      console.log('🧹 Nettoyage des statuts de présence obsolètes...');
      
      // Calculer la date limite (10 minutes dans le passé pour éviter les faux positifs)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      // Mettre à jour uniquement les utilisateurs vraiment inactifs
      // Cette approche est moins agressive que l'originale
      const { data, error } = await supabase
        .from('user_presence')
        .update({ 
          status: 'offline',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'online') // Seulement ceux marqués comme en ligne
        .lt('last_seen', tenMinutesAgo)
        .select('user_id');

      if (error) {
        console.error('Erreur lors du nettoyage de présence:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`📴 ${data.length} utilisateur(s) marqué(s) comme hors ligne après inactivité`);
      }

    } catch (error) {
      console.error('Erreur inattendue lors du nettoyage:', error);
    } finally {
      isRunningRef.current = false;
    }
  }, [user]);

  /**
   * Nettoie les indicateurs de frappe expirés
   * Fonction simplifiée qui évite les conflits avec les autres opérations
   */
  const cleanupExpiredTypingIndicators = useCallback(async () => {
    if (!user || isRunningRef.current) return;

    try {
      console.log('⌨️ Nettoyage des indicateurs de frappe expirés...');
      
      // Supprimer les indicateurs expirés (délai plus long pour éviter les suppressions prématurées)
      const { data, error } = await supabase
        .from('typing_indicators')
        .delete()
        .lt('expires_at', new Date(Date.now() - 60000).toISOString()) // 1 minute de délai
        .select('id');

      if (error) {
        console.error('Erreur lors du nettoyage des indicateurs de frappe:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`🗑️ ${data.length} indicateur(s) de frappe supprimé(s)`);
      }

    } catch (error) {
      console.error('Erreur inattendue lors du nettoyage des indicateurs:', error);
    }
  }, [user]);

  /**
   * Exécute toutes les tâches de nettoyage de manière séquentielle
   * Cette approche évite les conflits et la surcharge du serveur
   */
  const runCleanupTasks = useCallback(async () => {
    if (!user || isRunningRef.current) return;

    try {
      // Exécution séquentielle pour éviter les conflits de base de données
      await cleanupStalePresence();
      
      // Petit délai entre les opérations pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await cleanupExpiredTypingIndicators();
    } catch (error) {
      console.error('Erreur lors de l\'exécution des tâches de nettoyage:', error);
    }
  }, [user, cleanupStalePresence, cleanupExpiredTypingIndicators]);

  /**
   * Démarre le nettoyage automatique avec un intervalle raisonnable
   * Intervalle plus long pour réduire la charge serveur
   */
  useEffect(() => {
    if (!user) {
      // Nettoyer l'intervalle existant si plus d'utilisateur
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
      return;
    }

    console.log('🚀 Démarrage du nettoyage automatique de présence');

    // Exécuter immédiatement au démarrage (avec délai pour éviter les conflits d'initialisation)
    const initialCleanupTimeout = setTimeout(() => {
      runCleanupTasks();
    }, 5000); // 5 secondes après l'initialisation

    // Programmer l'exécution répétée toutes les 2 minutes (au lieu de 1 minute)
    // Cela réduit la charge serveur tout en maintenant l'efficacité
    cleanupIntervalRef.current = setInterval(() => {
      runCleanupTasks();
    }, 120000); // 2 minutes

    // Nettoyage à la fermeture du composant
    return () => {
      clearTimeout(initialCleanupTimeout);
      
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [user, runCleanupTasks]);

  /**
   * Nettoyage manuel optimisé pour les cas d'urgence
   * Cette fonction peut être appelée depuis l'interface si nécessaire
   */
  const manualCleanup = useCallback(async () => {
    if (isRunningRef.current) {
      console.log('⚠️ Nettoyage déjà en cours - opération ignorée');
      return;
    }

    console.log('🚀 Nettoyage manuel déclenché');
    await runCleanupTasks();
  }, [runCleanupTasks]);

  /**
   * Nettoyage spécifique pour l'utilisateur actuel lors de la déconnexion
   * Cette fonction est plus ciblée et évite les opérations inutiles
   */
  const cleanupCurrentUser = useCallback(async () => {
    if (!user) return;

    try {
      console.log('👋 Nettoyage pour utilisateur actuel:', user.id);
      
      // Marquer l'utilisateur actuel comme hors ligne
      const { error } = await supabase
        .from('user_presence')
        .update({ 
          status: 'offline',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut utilisateur:', error);
      } else {
        console.log('✅ Utilisateur actuel marqué comme hors ligne');
      }

    } catch (error) {
      console.error('Erreur lors du nettoyage de l\'utilisateur actuel:', error);
    }
  }, [user]);

  /**
   * Gestionnaire pour la fermeture de la page/onglet
   * Assure que l'utilisateur est marqué comme hors ligne
   */
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Utiliser sendBeacon pour un envoi fiable lors de la fermeture
      if (navigator.sendBeacon) {
        const data = new FormData();
        data.append('user_id', user.id);
        data.append('action', 'logout');
        
        // Note: Ceci nécessiterait un endpoint dédié côté serveur
        // Pour l'instant, on utilise la méthode classique
      }
      
      // Fallback classique
      cleanupCurrentUser();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // L'utilisateur a changé d'onglet ou minimisé
        // On peut le marquer comme "away" au lieu de "offline"
        if (user) {
          supabase
            .from('user_presence')
            .update({ 
              status: 'away',
              last_seen: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .then(() => console.log('👁️ Utilisateur marqué comme absent'));
        }
      } else {
        // L'utilisateur est revenu
        if (user) {
          supabase
            .from('user_presence')
            .update({ 
              status: 'online',
              last_seen: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .then(() => console.log('👁️ Utilisateur marqué comme en ligne'));
        }
      }
    };

    // Écouteurs d'événements pour la gestion de la présence
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, cleanupCurrentUser]);

  return {
    // Fonction principale pour nettoyage manuel
    manualCleanup,
    
    // Fonctions spécialisées (exposées pour les cas d'usage avancés)
    cleanupStalePresence,
    cleanupExpiredTypingIndicators,
    cleanupCurrentUser,
    
    // État de statut (utile pour l'UI)
    isRunning: isRunningRef.current
  };
};