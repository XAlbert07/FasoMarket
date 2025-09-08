// components/EnhancedReviewSystem.tsx
// Version améliorée avec guidance utilisateur et vérifications renforcées

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MessageCircle, 
  AlertCircle, 
  Clock, 
  Shield, 
  CheckCircle, 
  MessageSquare,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { 
  useCanUserReview, 
  getReviewBlockMessage, 
  shouldShowContactEncouragement,
  type ReviewEligibility 
} from "@/hooks/useCanUserReview";
import { useSellerReviews } from "@/hooks/useSellerReviews";
import { supabase } from "@/lib/supabase";

interface EnhancedReviewFormProps {
  sellerId: string;
  listingId: string;
  listingTitle: string;
  onReviewSubmitted: () => void;
}

/**
 * Composant principal pour la gestion des avis avec guidance intelligente
 * 
 * Ce composant ne se contente pas de masquer ou afficher le formulaire d'avis.
 * Il guide activement l'utilisateur vers les actions nécessaires pour pouvoir
 * laisser un avis légitime, créant ainsi un cercle vertueux d'interactions
 * authentiques sur la plateforme.
 */
export const EnhancedReviewForm = ({ 
  sellerId, 
  listingId, 
  listingTitle, 
  onReviewSubmitted 
}: EnhancedReviewFormProps) => {
  const { user } = useAuthContext();
  const eligibility = useCanUserReview(sellerId, listingId);
  const { toast } = useToast();

  // États pour le formulaire d'avis
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Si l'utilisateur n'est pas connecté, on affiche une invitation à se connecter
  if (!user) {
    return (
      <Card className="mt-6 border-blue-200 bg-blue-50/50">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h3 className="font-semibold">Connectez-vous pour laisser un avis</h3>
            <p className="text-sm text-muted-foreground">
              Aidez la communauté FasoMarket en partageant votre expérience avec ce vendeur
            </p>
            <Button asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Affichage pendant le chargement de l'éligibilité
  if (eligibility.loading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">
              Vérification de vos droits d'évaluation...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si l'utilisateur peut laisser un avis, on affiche le formulaire complet
  if (eligibility.canReview) {
    return (
      <ReviewFormComponent
        sellerId={sellerId}
        listingId={listingId}
        listingTitle={listingTitle}
        onReviewSubmitted={onReviewSubmitted}
        requiresVerification={eligibility.requiresVerification}
        showForm={showForm}
        setShowForm={setShowForm}
      />
    );
  }

  // Si l'utilisateur ne peut pas laisser d'avis, on affiche une guidance personnalisée
  return (
    <ReviewGuidanceCard 
      eligibility={eligibility}
      sellerId={sellerId}
      listingId={listingId}
      listingTitle={listingTitle}
    />
  );
};

/**
 * Composant de guidance qui explique pourquoi l'utilisateur ne peut pas laisser d'avis
 * et lui donne des actions concrètes pour y arriver
 */
interface ReviewGuidanceCardProps {
  eligibility: ReviewEligibility;
  sellerId: string;
  listingId: string;
  listingTitle: string;
}

const ReviewGuidanceCard = ({ 
  eligibility, 
  sellerId, 
  listingId, 
  listingTitle 
}: ReviewGuidanceCardProps) => {
  const message = getReviewBlockMessage(eligibility.reason);
  const showContactBtn = shouldShowContactEncouragement(eligibility);

  const getGuidanceIcon = () => {
    switch (eligibility.reason) {
      case 'no_interaction':
        return <MessageSquare className="h-6 w-6 text-blue-600" />;
      case 'insufficient_interaction':
        return <MessageCircle className="h-6 w-6 text-orange-600" />;
      case 'too_soon':
        return <Clock className="h-6 w-6 text-amber-600" />;
      case 'already_reviewed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'account_too_new':
      case 'suspicious_activity':
        return <Shield className="h-6 w-6 text-red-600" />;
      default:
        return <Info className="h-6 w-6 text-gray-600" />;
    }
  };

  const getCardVariant = () => {
    switch (eligibility.reason) {
      case 'no_interaction':
        return "border-blue-200 bg-blue-50/50";
      case 'insufficient_interaction':
        return "border-orange-200 bg-orange-50/50";
      case 'too_soon':
        return "border-amber-200 bg-amber-50/50";
      case 'already_reviewed':
        return "border-green-200 bg-green-50/50";
      case 'account_too_new':
      case 'suspicious_activity':
        return "border-red-200 bg-red-50/50";
      default:
        return "border-gray-200 bg-gray-50/50";
    }
  };

  const getActionButton = () => {
    if (showContactBtn) {
      return (
        <Button className="w-full" onClick={() => {
          // Ici vous pouvez implémenter l'ouverture de la modal de contact
          // ou rediriger vers la section messages
          window.scrollTo({ 
            top: document.querySelector('[data-contact-section]')?.getBoundingClientRect().top! + window.pageYOffset - 100,
            behavior: 'smooth' 
          });
        }}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Contacter le vendeur
        </Button>
      );
    }

    if (eligibility.reason === 'insufficient_interaction') {
      return (
        <Button variant="outline" className="w-full" onClick={() => {
          window.scrollTo({ 
            top: document.querySelector('[data-contact-section]')?.getBoundingClientRect().top! + window.pageYOffset - 100,
            behavior: 'smooth' 
          });
        }}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Poursuivre la conversation
        </Button>
      );
    }

    if (eligibility.reason === 'already_reviewed') {
      return (
        <Button variant="outline" asChild>
          <Link to="/my-profile?tab=reviews">
            Voir mes avis
          </Link>
        </Button>
      );
    }

    return null;
  };

  return (
    <Card className={`mt-6 ${getCardVariant()}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          {getGuidanceIcon()}
          
          <div className="space-y-2">
            <h3 className="font-semibold">
              {eligibility.reason === 'already_reviewed' 
                ? 'Avis déjà donné' 
                : 'Pour laisser un avis'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
          </div>

          {getActionButton()}

          {/* Badges d'information sur l'état actuel */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {eligibility.interactionExists && (
              <Badge variant="secondary" className="text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Contact établi
              </Badge>
            )}
            
            {eligibility.hasExistingReview && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Avis donné
              </Badge>
            )}
          </div>

          {/* Information sur les critères d'avis authentique */}
          {eligibility.reason === 'no_interaction' && (
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Pourquoi cette vérification ?</strong> Pour garantir l'authenticité des avis,
                nous nous assurons que seules les personnes ayant vraiment interagi avec le vendeur
                peuvent laisser une évaluation. Cela protège à la fois les acheteurs et les vendeurs.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Composant du formulaire d'avis proprement dit
 * Affiché uniquement quand l'utilisateur est éligible
 */
interface ReviewFormComponentProps {
  sellerId: string;
  listingId: string;
  listingTitle: string;
  onReviewSubmitted: () => void;
  requiresVerification: boolean;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
}

const ReviewFormComponent = ({
  sellerId,
  listingId,
  listingTitle,
  onReviewSubmitted,
  requiresVerification,
  showForm,
  setShowForm
}: ReviewFormComponentProps) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Évaluation requise",
        description: "Veuillez sélectionner une note de 1 à 5 étoiles",
        variant: "destructive"
      });
      return;
    }

    if (comment.trim().length < 20) {
      toast({
        title: "Commentaire trop court",
        description: "Veuillez écrire au moins 20 caractères pour expliquer votre expérience en détail",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Insertion de l'avis avec vérification de l'interaction
      const { error } = await supabase
        .from('reviews')
        .insert({
          seller_id: sellerId,
          reviewer_id: user!.id,
          listing_id: listingId,
          rating: rating,
          comment: comment.trim(),
          is_verified_purchase: false // Dans votre contexte, c'est une transaction cash
        });

      if (error) {
        if (error.code === '23505') { // Violation de contrainte d'unicité
          toast({
            title: "Avis déjà donné",
            description: "Vous avez déjà laissé un avis pour ce vendeur sur cette annonce.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Enregistrement de l'activité pour l'audit
      await supabase.from('security_audit_log').insert({
        user_id: user!.id,
        action_type: 'review_submitted',
        details: {
          seller_id: sellerId,
          listing_id: listingId,
          rating: rating,
          requires_verification: requiresVerification
        },
        success: true
      });

      toast({
        title: "Avis publié avec succès",
        description: "Merci pour votre retour ! Il aidera d'autres acheteurs à faire leur choix.",
      });

      // Reset du formulaire
      setRating(0);
      setComment("");
      setShowForm(false);
      onReviewSubmitted();

    } catch (error) {
      console.error('Erreur lors de la soumission de l\'avis:', error);
      
      // Enregistrement de l'erreur pour l'audit
      await supabase.from('security_audit_log').insert({
        user_id: user!.id,
        action_type: 'review_submission_failed',
        details: {
          seller_id: sellerId,
          listing_id: listingId,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        },
        success: false
      });

      toast({
        title: "Erreur",
        description: "Impossible de publier votre avis. Veuillez réessayer dans quelques minutes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded transition-all duration-200"
          >
            <Star
              className={`h-7 w-7 transition-all duration-200 ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400 scale-110"
                  : "text-gray-300 hover:text-yellow-200 hover:scale-105"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingLabel = (currentRating: number): string => {
    switch (currentRating) {
      case 1: return "Très insatisfait - Expérience très négative";
      case 2: return "Insatisfait - Quelques problèmes rencontrés";
      case 3: return "Correct - Expérience acceptable";
      case 4: return "Satisfait - Bonne expérience";
      case 5: return "Très satisfait - Expérience excellente";
      default: return "Cliquez sur les étoiles pour noter votre expérience";
    }
  };

  // Vue compacte : bouton pour révéler le formulaire
  if (!showForm) {
    return (
      <Card className="mt-6 border-green-200 bg-green-50/50">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-green-800">Vous pouvez laisser un avis</span>
            </div>
            
            {requiresVerification && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                <Shield className="h-3 w-3 mr-1" />
                Nouveau compte - Modération renforcée
              </Badge>
            )}
            
            <p className="text-sm text-muted-foreground">
              Votre interaction avec ce vendeur vous permet de partager votre expérience
            </p>
            
            <Button onClick={() => setShowForm(true)} className="w-full max-w-sm">
              <Star className="h-4 w-4 mr-2" />
              Laisser un avis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue étendue : formulaire complet
  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Votre avis sur cette transaction
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowForm(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Concernant : <strong>{listingTitle}</strong></p>
          <p>Aidez les futurs acheteurs en partageant votre expérience honnête</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Système de notation par étoiles */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Votre évaluation <span className="text-red-500">*</span>
          </label>
          
          {renderStars()}
          
          <p className="text-center text-sm text-muted-foreground min-h-[40px] flex items-center justify-center">
            {getRatingLabel(hoveredRating || rating)}
          </p>
        </div>

        {/* Zone de commentaire */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Décrivez votre expérience <span className="text-red-500">*</span>
          </label>
          
          <Textarea
            placeholder="Parlez-nous de votre expérience : qualité du produit, professionnalisme du vendeur, respect du rendez-vous, état conforme à l'annonce, etc. Soyez précis pour aider d'autres acheteurs."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={1000}
            className="resize-none"
          />
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Minimum 20 caractères</span>
            <span className={comment.length >= 1000 ? "text-red-500" : ""}>
              {comment.length}/1000
            </span>
          </div>
        </div>

        {/* Conseils pour un bon avis */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Pour un avis utile :</strong> Mentionnez l'état du produit, la qualité de la communication, 
            le respect des horaires de rendez-vous, et si l'article correspondait à la description. 
            Évitez les informations personnelles.
          </AlertDescription>
        </Alert>

        {/* Avertissement pour les nouveaux comptes */}
        {requiresVerification && (
          <Alert className="bg-amber-50 border-amber-200">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Modération renforcée :</strong> Votre compte étant récent, cet avis sera vérifié 
              avant publication pour maintenir la qualité de notre communauté.
            </AlertDescription>
          </Alert>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={handleSubmitReview}
            disabled={isSubmitting || rating === 0 || comment.trim().length < 20}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Publication...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Publier l'avis
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setRating(0);
              setComment("");
              setShowForm(false);
            }}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>

        {/* Note sur la politique des avis */}
        <div className="pt-4 border-t">
          <Alert className="bg-gray-50 border-gray-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Politique des avis :</strong> Seuls les commentaires constructifs et respectueux sont acceptés. 
              Les avis inappropriés, diffamatoires ou manifestement faux seront supprimés. 
              En publiant cet avis, vous confirmez qu'il reflète votre expérience réelle.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Version améliorée du composant d'affichage des avis avec métriques de confiance
 */
export const EnhancedReviewsDisplay = ({ sellerId, compact = false }: {
  sellerId: string;
  compact?: boolean;
}) => {
  const { reviews, stats, loading, error } = useSellerReviews(sellerId, {
    limit: compact ? 5 : 15,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Chargement des avis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des avis. Veuillez réessayer plus tard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Aucun avis pour le moment</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ce vendeur n'a pas encore reçu d'avis de la part d'acheteurs.
          </p>
          <Badge variant="secondary" className="text-xs">
            Nouveau vendeur
          </Badge>
        </CardContent>
      </Card>
    );
  }

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 30) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
    return `Il y a ${Math.floor(diffInDays / 365)} ans`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span>Avis des acheteurs</span>
          </div>
          {stats && (
            <div className="flex items-center gap-3 text-sm">
              {renderStars(Math.round(stats.averageRating))}
              <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({stats.totalReviews} avis)</span>
            </div>
          )}
        </CardTitle>

        {/* Métriques de confiance */}
        {stats && stats.totalReviews > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {stats.verifiedPurchasesCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {stats.verifiedPurchasesCount} achats vérifiés
              </Badge>
            )}
            
            {stats.responseRate > 80 && (
              <Badge variant="secondary" className="text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                {stats.responseRate}% de réponses
              </Badge>
            )}
            
            {stats.recentTrend === 'improving' && (
              <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">
                ↗ Tendance positive
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {reviews.slice(0, compact ? 5 : reviews.length).map((review) => (
          <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">
                    {review.reviewer_name}
                  </span>
                  {review.is_verified_purchase && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(review.rating)}
                  <span className="text-xs text-muted-foreground">
                    {getTimeAgo(review.created_at)}
                  </span>
                </div>
              </div>
            </div>
            
            {review.comment && (
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {review.comment}
              </p>
            )}
            
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              <strong>Concernant :</strong> {review.listing_title}
            </div>

            {review.response && (
              <div className="mt-3 ml-4 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-200">
                <p className="text-xs font-medium mb-1 text-blue-800">
                  Réponse du vendeur :
                </p>
                <p className="text-sm">{review.response.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getTimeAgo(review.response.created_at)}
                </p>
              </div>
            )}
          </div>
        ))}

        {compact && reviews.length > 5 && (
          <div className="text-center pt-4 border-t">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/seller-profile/${sellerId}?tab=reviews`}>
                Voir tous les avis ({stats?.totalReviews})
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};