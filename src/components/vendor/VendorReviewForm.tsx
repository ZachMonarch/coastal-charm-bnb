import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VendorReviewFormProps {
  vendorId: string;
  projectId?: string;
  vendorName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface RatingCategory {
  key: string;
  label: string;
  description: string;
}

const ratingCategories: RatingCategory[] = [
  { key: 'overall', label: 'Overall Rating', description: 'Your overall experience' },
  { key: 'quality', label: 'Quality of Work', description: 'Quality of deliverables' },
  { key: 'punctuality', label: 'Punctuality', description: 'On-time delivery' },
  { key: 'communication', label: 'Communication', description: 'Responsiveness and clarity' },
  { key: 'value', label: 'Value for Money', description: 'Worth the cost' },
];

export default function VendorReviewForm({
  vendorId,
  projectId,
  vendorName,
  onSuccess,
  onCancel
}: VendorReviewFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({
    overall: 0,
    quality: 0,
    punctuality: 0,
    communication: 0,
    value: 0,
  });
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState('');

  const handleRatingClick = (category: string, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to submit a review');
      return;
    }

    if (ratings.overall === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('vendor_reviews').insert({
        vendor_id: vendorId,
        reviewer_id: user.id,
        project_id: projectId || null,
        overall_rating: ratings.overall,
        quality_rating: ratings.quality || null,
        punctuality_rating: ratings.punctuality || null,
        communication_rating: ratings.communication || null,
        value_rating: ratings.value || null,
        review_text: reviewText || null,
        is_verified_project: !!projectId,
        status: 'published'
      });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (category: string) => {
    const currentRating = hoveredRating[category] || ratings[category];
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
            onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [category]: star }))}
            onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [category]: 0 }))}
            onClick={() => handleRatingClick(category, star)}
            aria-label={`Rate ${star} out of 5 stars`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= currentRating
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review {vendorName}</CardTitle>
        <CardDescription>
          Share your experience working with this vendor to help others make informed decisions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Categories */}
        <div className="space-y-4">
          {ratingCategories.map((category) => (
            <div key={category.key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{category.label}</Label>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
              {renderStars(category.key)}
            </div>
          ))}
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label htmlFor="review-text">Your Review (Optional)</Label>
          <Textarea
            id="review-text"
            placeholder="Share details about your experience..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {reviewText.length}/1000 characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading || ratings.overall === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
