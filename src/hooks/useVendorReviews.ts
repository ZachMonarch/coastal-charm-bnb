import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';

interface Review {
  id: string;
  vendor_id: string;
  reviewer_id: string;
  project_id: string | null;
  overall_rating: number;
  quality_rating: number | null;
  punctuality_rating: number | null;
  communication_rating: number | null;
  value_rating: number | null;
  review_text: string | null;
  is_verified_project: boolean;
  vendor_response: string | null;
  vendor_response_at: string | null;
  status: string;
  created_at: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

export function useVendorReviews(vendorId: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (vendorId) {
      fetchReviews();
    }
  }, [vendorId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select('id, vendor_id, reviewer_id, project_id, overall_rating, quality_rating, punctuality_rating, communication_rating, value_rating, review_text, is_verified_project, vendor_response, vendor_response_at, status, created_at')
        .eq('vendor_id', vendorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setReviews(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, r) => acc + r.overall_rating, 0);
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        data.forEach(r => {
          distribution[r.overall_rating as keyof typeof distribution]++;
        });

        setStats({
          totalReviews: total,
          averageRating: sum / total,
          ratingDistribution: distribution
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (reviewData: {
    overall_rating: number;
    quality_rating?: number;
    punctuality_rating?: number;
    communication_rating?: number;
    value_rating?: number;
    review_text?: string;
    project_id?: string;
  }) => {
    if (!user) {
      toast.error('You must be logged in to submit a review');
      return false;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('vendor_reviews').insert({
        vendor_id: vendorId,
        reviewer_id: user.id,
        project_id: reviewData.project_id || null,
        overall_rating: reviewData.overall_rating,
        quality_rating: reviewData.quality_rating || null,
        punctuality_rating: reviewData.punctuality_rating || null,
        communication_rating: reviewData.communication_rating || null,
        value_rating: reviewData.value_rating || null,
        review_text: reviewData.review_text || null,
        is_verified_project: !!reviewData.project_id,
        status: 'published'
      });

      if (error) throw error;

      toast.success('Review submitted successfully');
      fetchReviews();
      return true;
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const respondToReview = async (reviewId: string, responseText: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('vendor_reviews')
        .update({
          vendor_response: responseText,
          vendor_response_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Response submitted');
      fetchReviews();
      return true;
    } catch (error) {
      console.error('Error responding to review:', error);
      toast.error('Failed to submit response');
      return false;
    }
  };

  return {
    reviews,
    stats,
    loading,
    submitting,
    submitReview,
    respondToReview,
    refetch: fetchReviews
  };
}
