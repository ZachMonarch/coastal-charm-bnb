import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TierInfo {
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalCompletedJobs: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  tierUpdatedAt: string | null;
  nextTierProgress: {
    jobsNeeded?: number;
    ratingNeeded?: number;
    reviewsNeeded?: number;
    percentComplete?: number;
  };
}

const tierRequirements = {
  bronze: { jobs: 0, rating: 0, reviews: 0 },
  silver: { jobs: 10, rating: 3.5, reviews: 5 },
  gold: { jobs: 25, rating: 4.0, reviews: 10 },
  platinum: { jobs: 50, rating: 4.5, reviews: 20 }
};

export function useVendorTier(vendorId: string) {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      fetchTierInfo();
    }
  }, [vendorId]);

  const fetchTierInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_tiers')
        .select('vendor_id, current_tier, total_completed_jobs, total_revenue, average_rating, review_count, tier_updated_at')
        .eq('vendor_id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const currentTier = data.current_tier as 'bronze' | 'silver' | 'gold' | 'platinum';
        const nextTierProgress = calculateNextTierProgress(
          currentTier,
          data.total_completed_jobs,
          Number(data.average_rating),
          data.review_count
        );

        setTierInfo({
          currentTier,
          totalCompletedJobs: data.total_completed_jobs,
          totalRevenue: Number(data.total_revenue),
          averageRating: Number(data.average_rating),
          reviewCount: data.review_count,
          tierUpdatedAt: data.tier_updated_at,
          nextTierProgress
        });
      } else {
        // Default tier info for vendors without tier record
        setTierInfo({
          currentTier: 'bronze',
          totalCompletedJobs: 0,
          totalRevenue: 0,
          averageRating: 0,
          reviewCount: 0,
          tierUpdatedAt: null,
          nextTierProgress: calculateNextTierProgress('bronze', 0, 0, 0)
        });
      }
    } catch (error) {
      console.error('Error fetching tier info:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextTierProgress = (
    currentTier: string,
    jobs: number,
    rating: number,
    reviews: number
  ) => {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex === tiers.length - 1) {
      return { percentComplete: 100 };
    }

    const nextTier = tiers[currentIndex + 1] as keyof typeof tierRequirements;
    const requirements = tierRequirements[nextTier];

    const jobsNeeded = Math.max(0, requirements.jobs - jobs);
    const ratingNeeded = rating < requirements.rating ? requirements.rating : undefined;
    const reviewsNeeded = Math.max(0, requirements.reviews - reviews);

    // Calculate percent complete to next tier
    const jobProgress = Math.min(100, (jobs / requirements.jobs) * 100);
    const ratingProgress = Math.min(100, (rating / requirements.rating) * 100);
    const reviewProgress = Math.min(100, (reviews / requirements.reviews) * 100);
    const percentComplete = Math.round((jobProgress + ratingProgress + reviewProgress) / 3);

    return {
      jobsNeeded: jobsNeeded > 0 ? jobsNeeded : undefined,
      ratingNeeded,
      reviewsNeeded: reviewsNeeded > 0 ? reviewsNeeded : undefined,
      percentComplete
    };
  };

  const getTierBenefits = (tier: string) => {
    const benefits = {
      bronze: [
        'Basic profile visibility',
        'Up to 5 active bids',
        'Standard support'
      ],
      silver: [
        'Enhanced profile visibility',
        'Up to 15 active bids',
        'Priority support',
        'Silver badge on profile'
      ],
      gold: [
        'Premium profile visibility',
        'Unlimited active bids',
        'Priority support',
        'Gold badge on profile',
        'Featured in search results'
      ],
      platinum: [
        'Maximum profile visibility',
        'Unlimited active bids',
        'Dedicated account manager',
        'Platinum badge on profile',
        'Top featured in search',
        'Exclusive leads access'
      ]
    };

    return benefits[tier as keyof typeof benefits] || benefits.bronze;
  };

  return {
    tierInfo,
    loading,
    getTierBenefits,
    refetch: fetchTierInfo
  };
}
