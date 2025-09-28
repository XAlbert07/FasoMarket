// hooks/useCanUserReview.ts 

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

export interface ReviewEligibility {
  canReview: boolean;
  loading: boolean;
  reason: ReviewBlockReason | null;
  requiresVerification: boolean;
  interactionExists: boolean;
  hasExistingReview: boolean;
}

export type ReviewBlockReason = 
  | 'not_logged_in'
  | 'own_listing'
  | 'already_reviewed'
  | 'no_interaction'
  | 'insufficient_interaction'
  | 'too_soon'
  | 'account_too_new'
  | 'suspicious_activity'
  | null;

/**
 * Hook intelligent pour déterminer si un utilisateur peut laisser un avis
 * 
 * Ce hook implémente une logique multicouche pour s'assurer que seuls
 * les utilisateurs légitimes ayant eu une interaction réelle avec le vendeur
 * peuvent laisser des avis.
 * 
 * Les vérifications incluent :
 * 1. Vérification de base (connecté, pas le propriétaire, pas déjà évalué)
 * 2. Vérification d'interaction (échange de messages)
 * 3. Vérification temporelle (délai minimum entre contact et avis)
 * 4. Vérification de l'ancienneté du compte
 * 5. Détection d'activité suspecte
 */
export const useCanUserReview = (sellerId: string, listingId: string): ReviewEligibility => {
  const { user } = useAuthContext();
  
  const [state, setState] = useState<ReviewEligibility>({
    canReview: false,
    loading: true,
    reason: null,
    requiresVerification: false,
    interactionExists: false,
    hasExistingReview: false
  });

  useEffect(() => {
    const checkEligibility = async () => {
      // Étape 1: Vérifications de base
      if (!user) {
        setState(prev => ({
          ...prev,
          loading: false,
          canReview: false,
          reason: 'not_logged_in'
        }));
        return;
      }

      if (user.id === sellerId) {
        setState(prev => ({
          ...prev,
          loading: false,
          canReview: false,
          reason: 'own_listing'
        }));
        return;
      }

      try {
        // Étape 2: Vérifier si un avis existe déjà
        const { data: existingReview, error: reviewError } = await supabase
          .from('reviews')
          .select('id, created_at')
          .eq('seller_id', sellerId)
          .eq('reviewer_id', user.id)
          .eq('listing_id', listingId)
          .single();

        if (reviewError && reviewError.code !== 'PGRST116') {
          console.error('Erreur lors de la vérification des avis existants:', reviewError);
        }

        if (existingReview) {
          setState(prev => ({
            ...prev,
            loading: false,
            canReview: false,
            reason: 'already_reviewed',
            hasExistingReview: true
          }));
          return;
        }

        // Étape 3: Vérifier l'existence d'une interaction (échange de messages)
        const { data: messageInteraction, error: messageError } = await supabase
          .from('messages')
          .select('id, created_at, sender_id, receiver_id')
          .eq('listing_id', listingId)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })
          .limit(5);

        if (messageError) {
          console.error('Erreur lors de la vérification des messages:', messageError);
        }

        const hasInteraction = messageInteraction && messageInteraction.length > 0;

        if (!hasInteraction) {
          setState(prev => ({
            ...prev,
            loading: false,
            canReview: false,
            reason: 'no_interaction',
            interactionExists: false
          }));
          return;
        }

        // Étape 4: Vérifier la qualité de l'interaction
        // Il faut au moins 2 messages (aller-retour) pour considérer une vraie interaction
        const uniqueSenders = new Set(messageInteraction.map(msg => msg.sender_id));
        if (uniqueSenders.size < 2 || messageInteraction.length < 2) {
          setState(prev => ({
            ...prev,
            loading: false,
            canReview: false,
            reason: 'insufficient_interaction',
            interactionExists: true
          }));
          return;
        }

        // Étape 5: Vérifier le délai minimum (24h entre premier contact et avis)
        const firstMessage = messageInteraction[0];
        const firstMessageTime = new Date(firstMessage.created_at);
        const now = new Date();
        const hoursElapsed = (now.getTime() - firstMessageTime.getTime()) / (1000 * 60 * 60);

        const MINIMUM_INTERACTION_HOURS = 24; // 24 heures minimum

        if (hoursElapsed < MINIMUM_INTERACTION_HOURS) {
          setState(prev => ({
            ...prev,
            loading: false,
            canReview: false,
            reason: 'too_soon',
            interactionExists: true
          }));
          return;
        }

        // Étape 6: Vérifier l'ancienneté du compte utilisateur
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('created_at, total_reviews')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Erreur lors de la vérification du profil:', profileError);
        }

        // Compte trop récent (moins de 7 jours) - nécessite une vérification supplémentaire
        const accountAge = userProfile ? 
          (now.getTime() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24) : 
          0;

        const MINIMUM_ACCOUNT_AGE_DAYS = 7;
        const isNewAccount = accountAge < MINIMUM_ACCOUNT_AGE_DAYS;

        // Étape 7: Détection d'activité suspecte
        // Vérifier si l'utilisateur a laissé beaucoup d'avis récemment
        const { data: recentReviews, error: recentReviewsError } = await supabase
          .from('reviews')
          .select('id, created_at')
          .eq('reviewer_id', user.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 derniers jours
          .order('created_at', { ascending: false });

        if (recentReviewsError) {
          console.error('Erreur lors de la vérification des avis récents:', recentReviewsError);
        }

        const recentReviewsCount = recentReviews ? recentReviews.length : 0;
        const MAX_REVIEWS_PER_WEEK = 5; // Maximum 5 avis par semaine

        const hasSuspiciousActivity = recentReviewsCount >= MAX_REVIEWS_PER_WEEK;

        if (hasSuspiciousActivity) {
          setState(prev => ({
            ...prev,
            loading: false,
            canReview: false,
            reason: 'suspicious_activity',
            interactionExists: true
          }));
          return;
        }

        // Étape 8: Décision finale
        // Si toutes les vérifications passent, l'utilisateur peut laisser un avis
        // Un compte nouveau nécessite une vérification supplémentaire mais n'est pas bloqué
        setState({
          canReview: true,
          loading: false,
          reason: null,
          requiresVerification: isNewAccount,
          interactionExists: true,
          hasExistingReview: false
        });

      } catch (error) {
        console.error('Erreur générale dans la vérification d\'éligibilité:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          canReview: false,
          reason: 'suspicious_activity'
        }));
      }
    };

    checkEligibility();
  }, [user, sellerId, listingId]);

  return state;
};

/**
 * Fonction utilitaire pour obtenir le message d'explication pour l'utilisateur
 * selon la raison du blocage
 */
export const getReviewBlockMessage = (reason: ReviewBlockReason): string => {
  switch (reason) {
    case 'not_logged_in':
      return 'Vous devez être connecté pour laisser un avis.';
    
    case 'own_listing':
      return 'Vous ne pouvez pas laisser un avis sur votre propre annonce.';
    
    case 'already_reviewed':
      return 'Vous avez déjà laissé un avis pour ce vendeur sur cette annonce.';
    
    case 'no_interaction':
      return 'Vous devez d\'abord contacter le vendeur via notre système de messages pour pouvoir laisser un avis.';
    
    case 'insufficient_interaction':
      return 'Pour garantir l\'authenticité des avis, vous devez avoir eu un véritable échange avec le vendeur (au moins 2 messages échangés).';
    
    case 'too_soon':
      return 'Veuillez attendre au moins 24h après votre premier contact avec le vendeur avant de laisser un avis.';
    
    case 'account_too_new':
      return 'Votre compte est trop récent. Veuillez attendre quelques jours avant de pouvoir laisser des avis.';
    
    case 'suspicious_activity':
      return 'Nous avons détecté une activité inhabituelle. Veuillez contacter le support si vous pensez qu\'il s\'agit d\'une erreur.';
    
    default:
      return 'Impossible de laisser un avis pour le moment.';
  }
};

/**
 * Fonction utilitaire pour déterminer si l'utilisateur peut voir
 * un message d'encouragement à contacter le vendeur
 */
export const shouldShowContactEncouragement = (eligibility: ReviewEligibility): boolean => {
  return !eligibility.loading && 
         !eligibility.canReview && 
         eligibility.reason === 'no_interaction' && 
         !eligibility.interactionExists;
};