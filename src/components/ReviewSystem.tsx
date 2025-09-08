// components/ReviewSystem.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSellerReviews } from "@/hooks/useSellerReviews";
import { supabase } from "@/lib/supabase";

interface ReviewFormProps {
  sellerId: string;
  listingId: string;
  listingTitle: string;
  onReviewSubmitted: () => void;
  canReview: boolean; // Détermine si l'utilisateur peut laisser un avis
}

// Composant pour laisser un avis - s'affiche conditionnellement
export const ReviewForm = ({ sellerId, listingId, listingTitle, onReviewSubmitted, canReview }: ReviewFormProps) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si l'utilisateur ne peut pas laisser d'avis, ne pas afficher le formulaire
  if (!canReview || !user || user.id === sellerId) {
    return null;
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Évaluation requise",
        description: "Veuillez sélectionner une note de 1 à 5 étoiles",
        variant: "destructive"
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Commentaire trop court",
        description: "Veuillez écrire au moins 10 caractères pour expliquer votre expérience",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          seller_id: sellerId,
          reviewer_id: user.id,
          listing_id: listingId,
          rating: rating,
          comment: comment.trim(),
          is_verified_purchase: false // À implémenter selon votre logique métier
        })
        .single();

      if (error) throw error;

      toast({
        title: "Avis publié",
        description: "Merci pour votre retour ! Il aidera d'autres acheteurs."
      });

      // Reset du formulaire
      setRating(0);
      setComment("");
      onReviewSubmitted();

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de publier votre avis. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-200"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Laisser un avis sur cette transaction
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Partagez votre expérience avec ce vendeur pour aider d'autres acheteurs
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Votre évaluation *
          </label>
          {renderStars()}
          <p className="text-xs text-muted-foreground mt-1">
            {rating === 0 && "Cliquez sur les étoiles pour noter"}
            {rating === 1 && "Très insatisfait"}
            {rating === 2 && "Insatisfait"}
            {rating === 3 && "Correct"}
            {rating === 4 && "Satisfait"}
            {rating === 5 && "Très satisfait"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Votre commentaire *
          </label>
          <Textarea
            placeholder="Décrivez votre expérience : qualité du produit, communication avec le vendeur, rapidité de la transaction..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {comment.length}/500 caractères - Minimum 10 caractères
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleSubmitReview}
            disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            className="flex-1"
          >
            {isSubmitting ? "Publication..." : "Publier l'avis"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setRating(0);
              setComment("");
            }}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Politique des avis :</strong> Seuls les commentaires honnêtes et respectueux sont acceptés. 
            Les avis inappropriés ou frauduleux seront supprimés.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook pour déterminer si un utilisateur peut laisser un avis
export const useCanUserReview = (sellerId: string, listingId: string) => {
  const { user } = useAuthContext();
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!user || user.id === sellerId) {
        setCanReview(false);
        setLoading(false);
        return;
      }

      try {
        // Vérifier si l'utilisateur a déjà laissé un avis pour ce vendeur sur cette annonce
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('seller_id', sellerId)
          .eq('reviewer_id', user.id)
          .eq('listing_id', listingId)
          .single();

        if (existingReview) {
          setCanReview(false); // Déjà évalué
          return;
        }

        // Ici vous pourriez ajouter d'autres vérifications :
        // - L'utilisateur a-t-il contacté ce vendeur ?
        // - Y a-t-il eu une transaction confirmée ?
        // Pour l'instant, on permet à tout utilisateur connecté (sauf le vendeur) de laisser un avis
        setCanReview(true);

      } catch (error) {
        console.error('Erreur lors de la vérification des droits d\'avis:', error);
        setCanReview(false);
      } finally {
        setLoading(false);
      }
    };

    checkReviewEligibility();
  }, [user, sellerId, listingId]);

  return { canReview, loading };
};

// Composant d'affichage des avis existants
interface ReviewsDisplayProps {
  sellerId: string;
  compact?: boolean; // Version compacte pour la page de détail d'annonce
}

export const ReviewsDisplay = ({ sellerId, compact = false }: ReviewsDisplayProps) => {
  const { reviews, stats, loading, error } = useSellerReviews(sellerId, {
    limit: compact ? 3 : 10
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des avis...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Erreur lors du chargement des avis
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Aucun avis pour ce vendeur pour le moment</p>
            <p className="text-sm mt-1">Soyez le premier à laisser un avis !</p>
          </div>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Avis des acheteurs</span>
          {stats && (
            <div className="flex items-center gap-2 text-sm">
              {renderStars(Math.round(stats.averageRating))}
              <span className="font-semibold">{stats.averageRating}</span>
              <span className="text-muted-foreground">
                ({stats.totalReviews} avis)
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.slice(0, compact ? 3 : reviews.length).map((review) => (
          <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{review.reviewer_name}</span>
                  {review.is_verified_purchase && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Achat vérifié
                    </span>
                  )}
                </div>
                {renderStars(review.rating)}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            
            {review.comment && (
              <p className="text-sm text-muted-foreground mb-2">
                {review.comment}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Concernant : {review.listing_title}
            </p>

            {review.response && (
              <div className="mt-3 ml-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium mb-1">Réponse du vendeur :</p>
                <p className="text-sm">{review.response.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(review.response.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        ))}

        {compact && reviews.length > 3 && (
          <div className="text-center">
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