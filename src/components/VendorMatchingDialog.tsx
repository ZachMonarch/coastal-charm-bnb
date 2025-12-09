import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  getTopVendorMatches,
  getConfidenceBadgeColor,
  formatMatchScore,
  type VendorMatch,
} from '@/utils/vendorMatching';

interface VendorMatchingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    title: string;
    category: string;
    skills_required: string[];
    location?: string;
    budget_min?: number;
    budget_max?: number;
    priority: string;
  };
  onAssign: (projectId: string, vendorId: string) => Promise<void>;
}

export function VendorMatchingDialog({
  open,
  onOpenChange,
  project,
  onAssign,
}: VendorMatchingDialogProps) {
  const [matches, setMatches] = useState<VendorMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchVendorMatches();
    }
  }, [open, project.id]);

  const fetchVendorMatches = async () => {
    try {
      setLoading(true);

      const { data: vendors, error } = await supabase
        .from('vendor_profiles')
        .select('id, user_id, company_name, specialties, rating, completed_jobs, response_time_hours, availability_status, service_areas, certifications, description, is_verified, subscription_status')
        .eq('is_verified', true)
        .eq('availability_status', 'available')
        .eq('subscription_status', 'active')
        .limit(100);

      if (error) throw error;

      const topMatches = getTopVendorMatches(project, vendors || [], 10);
      setMatches(topMatches);

      if (topMatches.length === 0) {
        toast.info('No matching vendors found. Try adjusting project requirements.');
      }
    } catch (error) {
      console.error('Error fetching vendor matches:', error);
      toast.error('Failed to find matching vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (vendorId: string) => {
    try {
      setAssigning(vendorId);
      await onAssign(project.id, vendorId);
      onOpenChange(false);
    } catch (error) {
      // Error already handled in parent
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Vendor Matching
          </DialogTitle>
          <DialogDescription>
            AI-powered vendor recommendations for "{project.title}"
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No qualified vendors found for this project.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try inviting vendors or adjusting project requirements.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <Card
                  key={match.vendor.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                            #{index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">
                              {match.vendor.company_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={getConfidenceBadgeColor(match.confidence)}
                              >
                                {formatMatchScore(match.score)} Match
                              </Badge>
                              <Badge variant="secondary">
                                {match.confidence.toUpperCase()} Confidence
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-primary fill-primary" />
                            <span className="font-medium">
                              {match.vendor.rating.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{match.vendor.completed_jobs} completed jobs</span>
                          </div>
                          {match.vendor.response_time_hours && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                Responds in {match.vendor.response_time_hours}h
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Match Reasons */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Why this vendor?
                          </div>
                          <ul className="space-y-1">
                            {match.matchReasons.map((reason, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Specialties */}
                        {match.vendor.specialties &&
                          match.vendor.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {match.vendor.specialties.slice(0, 4).map((specialty) => (
                                <Badge key={specialty} variant="outline">
                                  {specialty}
                                </Badge>
                              ))}
                              {match.vendor.specialties.length > 4 && (
                                <Badge variant="outline">
                                  +{match.vendor.specialties.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Assign Button */}
                      <Button
                        onClick={() => handleAssign(match.vendor.user_id)}
                        disabled={assigning !== null}
                        size="lg"
                        className="min-w-[120px]"
                      >
                        {assigning === match.vendor.user_id
                          ? 'Assigning...'
                          : 'Assign'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {matches.length > 0 && (
          <>
            <Separator />
            <div className="text-sm text-muted-foreground text-center">
              Showing top {matches.length} vendor{matches.length !== 1 ? 's' : ''}{' '}
              based on project requirements
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
