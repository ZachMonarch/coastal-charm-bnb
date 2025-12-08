import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  overall_rating: number;
  quality_rating: number | null;
  punctuality_rating: number | null;
  communication_rating: number | null;
  value_rating: number | null;
  review_text: string | null;
  is_verified_project: boolean;
  vendor_response: string | null;
  vendor_response_at: string | null;
  created_at: string;
  reviewer_name?: string;
}

interface VendorReviewListProps {
  vendorId: string;
  isOwnProfile?: boolean;
}

export default function VendorReviewList({ vendorId, isOwnProfile }: VendorReviewListProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [vendorId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select(`
          id, overall_rating, quality_rating, punctuality_rating,
          communication_rating, value_rating, review_text,
          is_verified_project, vendor_response, vendor_response_at, created_at
        `)
        .eq('vendor_id', vendorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('vendor_reviews')
        .update({
          vendor_response: responseText,
          vendor_response_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Response submitted successfully');
      setRespondingTo(null);
      setResponseText('');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.overall_rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Reviews
            <Badge variant="secondary">{reviews.length}</Badge>
          </CardTitle>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-bold">{calculateAverageRating()}</span>
              <span className="text-muted-foreground">/ 5</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No reviews yet</h3>
            <p className="text-sm text-muted-foreground">
              Reviews from completed projects will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>R</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Reviewer</span>
                        {review.is_verified_project && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified Project
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {renderStars(review.overall_rating)}
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <p className="text-sm text-muted-foreground">{review.review_text}</p>
                )}

                {/* Detailed Ratings */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setExpandedReview(
                    expandedReview === review.id ? null : review.id
                  )}
                >
                  {expandedReview === review.id ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show details
                    </>
                  )}
                </Button>

                {expandedReview === review.id && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg">
                    {review.quality_rating && (
                      <div>
                        <p className="text-xs text-muted-foreground">Quality</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{review.quality_rating}</span>
                        </div>
                      </div>
                    )}
                    {review.punctuality_rating && (
                      <div>
                        <p className="text-xs text-muted-foreground">Punctuality</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{review.punctuality_rating}</span>
                        </div>
                      </div>
                    )}
                    {review.communication_rating && (
                      <div>
                        <p className="text-xs text-muted-foreground">Communication</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{review.communication_rating}</span>
                        </div>
                      </div>
                    )}
                    {review.value_rating && (
                      <div>
                        <p className="text-xs text-muted-foreground">Value</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{review.value_rating}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Vendor Response */}
                {review.vendor_response && (
                  <div className="bg-primary/5 border-l-2 border-primary p-3 rounded-r-lg">
                    <p className="text-xs font-medium text-primary mb-1">Vendor Response</p>
                    <p className="text-sm">{review.vendor_response}</p>
                    {review.vendor_response_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(review.vendor_response_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                )}

                {/* Respond Button (for vendor's own profile) */}
                {isOwnProfile && !review.vendor_response && (
                  <>
                    {respondingTo === review.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Write your response..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => submitResponse(review.id)}
                            disabled={submitting || !responseText.trim()}
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Submit Response'
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRespondingTo(review.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Respond to Review
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
