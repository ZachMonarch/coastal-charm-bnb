import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Crown, Medal, Award, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TierInfo {
  current_tier: string;
  total_completed_jobs: number;
  average_rating: number;
  review_count: number;
  next_tier_progress: {
    jobs_needed?: number;
    rating_needed?: number;
    reviews_needed?: number;
  };
}

interface VendorTierBadgeProps {
  vendorId: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
  bronze: {
    label: 'Bronze',
    icon: Medal,
    color: 'bg-warning/20 text-warning-foreground dark:bg-warning/30 border-warning/50',
    description: 'Starting tier for new vendors',
    requirements: { jobs: 0, rating: 0, reviews: 0 }
  },
  silver: {
    label: 'Silver',
    icon: Award,
    color: 'bg-muted text-muted-foreground dark:bg-muted/50 border-border',
    description: '10+ jobs, 3.5+ rating, 5+ reviews',
    requirements: { jobs: 10, rating: 3.5, reviews: 5 }
  },
  gold: {
    label: 'Gold',
    icon: Star,
    color: 'bg-primary/20 text-primary dark:bg-primary/30 border-primary/50',
    description: '25+ jobs, 4.0+ rating, 10+ reviews',
    requirements: { jobs: 25, rating: 4.0, reviews: 10 }
  },
  platinum: {
    label: 'Platinum',
    icon: Crown,
    color: 'bg-accent text-accent-foreground dark:bg-accent/80 border-accent',
    description: '50+ jobs, 4.5+ rating, 20+ reviews',
    requirements: { jobs: 50, rating: 4.5, reviews: 20 }
  }
};

export default function VendorTierBadge({ 
  vendorId, 
  showDetails = false,
  size = 'md' 
}: VendorTierBadgeProps) {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTierInfo();
  }, [vendorId]);

  const fetchTierInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_tiers')
        .select('current_tier, total_completed_jobs, average_rating, review_count, next_tier_progress')
        .eq('vendor_id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const progress = data.next_tier_progress as Record<string, number> | null;
        setTierInfo({
          current_tier: data.current_tier,
          total_completed_jobs: data.total_completed_jobs,
          average_rating: Number(data.average_rating),
          review_count: data.review_count,
          next_tier_progress: {
            jobs_needed: progress?.jobs_needed,
            rating_needed: progress?.rating_needed,
            reviews_needed: progress?.reviews_needed
          }
        });
      } else {
        setTierInfo({
          current_tier: 'bronze',
          total_completed_jobs: 0,
          average_rating: 0,
          review_count: 0,
          next_tier_progress: {}
        });
      }
    } catch (error) {
      console.error('Error fetching tier info:', error);
      setTierInfo({
        current_tier: 'bronze',
        total_completed_jobs: 0,
        average_rating: 0,
        review_count: 0,
        next_tier_progress: {}
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (!tierInfo) return null;

  const tier = tierConfig[tierInfo.current_tier as keyof typeof tierConfig] || tierConfig.bronze;
  const Icon = tier.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const badge = (
    <Badge 
      variant="outline" 
      className={`${tier.color} ${sizeClasses[size]} gap-1 font-medium`}
    >
      <Icon className={iconSizes[size]} />
      {tier.label}
    </Badge>
  );

  if (!showDetails) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{tier.label} Tier Vendor</p>
          <p className="text-xs text-muted-foreground">{tier.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {badge}
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{tierInfo.total_completed_jobs}</p>
          <p className="text-xs text-muted-foreground">Jobs Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{Number(tierInfo.average_rating).toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{tierInfo.review_count}</p>
          <p className="text-xs text-muted-foreground">Reviews</p>
        </div>
      </div>

      {/* Progress to next tier */}
      {tierInfo.current_tier !== 'platinum' && (
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Next tier requirements:</p>
          <ul className="space-y-1 text-xs">
            {tierInfo.next_tier_progress?.jobs_needed && (
              <li>• {tierInfo.next_tier_progress.jobs_needed} more jobs needed</li>
            )}
            {tierInfo.next_tier_progress?.rating_needed && (
              <li>• Maintain {tierInfo.next_tier_progress.rating_needed}+ rating</li>
            )}
            {tierInfo.next_tier_progress?.reviews_needed && (
              <li>• {tierInfo.next_tier_progress.reviews_needed} more reviews needed</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
