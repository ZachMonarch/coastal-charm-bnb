import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Trophy, DollarSign, Star, Clock, CheckCircle, RefreshCw, Loader2, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VendorTierBadge from '@/components/vendor/VendorTierBadge';

interface Bid {
  id: string;
  vendor_id: string;
  bid_amount: number;
  estimated_duration: string | null;
  proposal_details: string;
  submitted_at: string;
  status: string;
  vendor_name?: string;
  vendor_rating?: number;
  vendor_tier?: string;
  vendor_completed_jobs?: number;
  score?: {
    price_score: number;
    rating_score: number;
    completion_rate_score: number;
    tier_bonus: number;
    total_score: number;
  };
}

interface BidComparisonDashboardProps {
  projectId: string;
  budgetMax?: number;
  onSelectBid?: (bidId: string) => void;
}

export default function BidComparisonDashboard({
  projectId,
  budgetMax = 0,
  onSelectBid
}: BidComparisonDashboardProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [view, setView] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    fetchBids();
  }, [projectId]);

  const fetchBids = async () => {
    try {
      // Fetch bids with vendor info
      const { data: bidsData, error: bidsError } = await supabase
        .from('vendor_bids')
        .select(`
          id, vendor_id, bid_amount, estimated_duration, 
          proposal_details, submitted_at, status
        `)
        .eq('project_id', projectId)
        .order('submitted_at', { ascending: true });

      if (bidsError) throw bidsError;

      // Fetch vendor details and scores for each bid
      const enrichedBids = await Promise.all(
        (bidsData || []).map(async (bid) => {
          // Get vendor profile
          const { data: vendorData } = await supabase
            .from('vendor_profiles')
            .select('company_name, rating, completed_jobs')
            .eq('user_id', bid.vendor_id)
            .single();

          // Get tier info
          const { data: tierData } = await supabase
            .from('vendor_tiers')
            .select('current_tier')
            .eq('vendor_id', bid.vendor_id)
            .single();

          // Get bid score
          const { data: scoreData } = await supabase
            .from('bid_scores')
            .select('price_score, rating_score, completion_rate_score, tier_bonus, total_score')
            .eq('bid_id', bid.id)
            .single();

          return {
            ...bid,
            vendor_name: vendorData?.company_name || 'Unknown Vendor',
            vendor_rating: vendorData?.rating || 0,
            vendor_completed_jobs: vendorData?.completed_jobs || 0,
            vendor_tier: tierData?.current_tier || 'bronze',
            score: scoreData || null
          };
        })
      );

      // Sort by total score if available
      enrichedBids.sort((a, b) => {
        if (a.score && b.score) {
          return b.score.total_score - a.score.total_score;
        }
        return 0;
      });

      setBids(enrichedBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const calculateAllScores = async () => {
    setScoring(true);
    try {
      for (const bid of bids) {
        await supabase.rpc('calculate_bid_score', { p_bid_id: bid.id });
      }
      toast.success('Scores calculated successfully');
      fetchBids();
    } catch (error) {
      console.error('Error calculating scores:', error);
      toast.error('Failed to calculate scores');
    } finally {
      setScoring(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success dark:text-success';
    if (score >= 50) return 'text-warning dark:text-warning';
    return 'text-destructive dark:text-destructive';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-primary text-primary-foreground">🥇 Best Match</Badge>;
    if (index === 1) return <Badge className="bg-muted text-muted-foreground">🥈 Runner Up</Badge>;
    if (index === 2) return <Badge className="bg-warning text-warning-foreground font-semibold">🥉 Third</Badge>;
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading bid comparison...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Bid Comparison Dashboard
            </CardTitle>
            <CardDescription>
              Compare {bids.length} vendor bids using automated scoring
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={calculateAllScores}
              disabled={scoring}
            >
              {scoring ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Recalculate Scores
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No bids received yet</h3>
            <p className="text-sm text-muted-foreground">
              Vendor bids will appear here for comparison once submitted.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="table">
            <TabsList variant="default" className="mb-4">
              <TabsTrigger variant="default" value="table">Table View</TabsTrigger>
              <TabsTrigger variant="default" value="cards">Card View</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Bid Amount</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">Tier</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((bid, index) => (
                      <TableRow key={bid.id} className={index === 0 ? 'bg-success/5 dark:bg-success/10' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRankBadge(index) || <span className="text-muted-foreground">{index + 1}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{bid.vendor_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {bid.vendor_completed_jobs} jobs completed
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${bid.bid_amount.toLocaleString()}
                          {budgetMax > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {((bid.bid_amount / budgetMax) * 100).toFixed(0)}% of budget
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                            <span>{Number(bid.vendor_rating).toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <VendorTierBadge vendorId={bid.vendor_id} size="sm" />
                        </TableCell>
                        <TableCell className="text-center">
                          {bid.score ? (
                            <div className={`font-bold ${getScoreColor(bid.score.total_score)}`}>
                              {bid.score.total_score.toFixed(0)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={index === 0 ? 'default' : 'outline'}
                            onClick={() => onSelectBid?.(bid.id)}
                          >
                            {index === 0 ? 'Select Best' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="cards">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bids.map((bid, index) => (
                  <Card key={bid.id} className={index === 0 ? 'border-2 border-success' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          {getRankBadge(index)}
                          <CardTitle className="text-lg mt-2">{bid.vendor_name}</CardTitle>
                        </div>
                        <VendorTierBadge vendorId={bid.vendor_id} size="sm" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Bid Amount</span>
                        </div>
                        <span className="font-bold">${bid.bid_amount.toLocaleString()}</span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Rating</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="font-medium">{Number(bid.vendor_rating).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Jobs */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Completed Jobs</span>
                        </div>
                        <span className="font-medium">{bid.vendor_completed_jobs}</span>
                      </div>

                      {/* Duration */}
                      {bid.estimated_duration && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Est. Duration</span>
                          </div>
                          <span className="font-medium">{bid.estimated_duration}</span>
                        </div>
                      )}

                      {/* Score Breakdown */}
                      {bid.score && (
                        <div className="pt-3 border-t space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Score</span>
                            <span className={`text-lg font-bold ${getScoreColor(bid.score.total_score)}`}>
                              {bid.score.total_score.toFixed(0)}/100
                            </span>
                          </div>
                          <Progress value={bid.score.total_score} className="h-2" />
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price</span>
                              <span>{bid.score.price_score.toFixed(0)}/30</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rating</span>
                              <span>{bid.score.rating_score.toFixed(0)}/25</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Experience</span>
                              <span>{bid.score.completion_rate_score.toFixed(0)}/20</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tier Bonus</span>
                              <span>{bid.score.tier_bonus.toFixed(0)}/10</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full" 
                        variant={index === 0 ? 'default' : 'outline'}
                        onClick={() => onSelectBid?.(bid.id)}
                      >
                        {index === 0 ? (
                          <>
                            <Award className="h-4 w-4 mr-2" />
                            Select Best Match
                          </>
                        ) : (
                          'Select Vendor'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Scoring Explanation */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Scoring Algorithm</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Price (30%)</p>
              <p>Lower bids score higher</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rating (25%)</p>
              <p>Higher ratings score higher</p>
            </div>
            <div>
              <p className="text-muted-foreground">Experience (20%)</p>
              <p>More completed jobs score higher</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tier Bonus (10%)</p>
              <p>Platinum: 10, Gold: 7, Silver: 4, Bronze: 1</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
