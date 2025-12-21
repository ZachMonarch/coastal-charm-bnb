import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, Trophy, DollarSign, Star, Clock, CheckCircle, RefreshCw, 
  Loader2, Award, Download, FileText, X, Send, Gavel 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VendorTierBadge from '@/components/vendor/VendorTierBadge';

interface Bid {
  id: string;
  vendor_id: string;
  rfq_id?: string;
  bid_amount: number;
  estimated_duration: string | null;
  proposal_details: string;
  submitted_at: string;
  status: string;
  vendor_name?: string;
  vendor_rating?: number;
  vendor_tier?: string;
  vendor_completed_jobs?: number;
  company_info?: any;
  pricing?: any;
  certifications?: any;
  experience?: any;
  score?: {
    price_score: number;
    rating_score: number;
    completion_rate_score: number;
    tier_bonus: number;
    total_score: number;
  };
}

interface EnhancedBidComparisonProps {
  rfqId: string;
  rfqTitle?: string;
  budgetMax?: number;
  onContractAwarded?: (contractId: string) => void;
}

export default function EnhancedBidComparison({
  rfqId,
  rfqTitle,
  budgetMax = 0,
  onContractAwarded
}: EnhancedBidComparisonProps) {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [selectedBids, setSelectedBids] = useState<string[]>([]);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [selectedBidForAward, setSelectedBidForAward] = useState<Bid | null>(null);
  const [contractDetails, setContractDetails] = useState({
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    fetchBids();
  }, [rfqId]);

  const fetchBids = async () => {
    try {
      // Fetch bids for this RFQ
      const { data: bidsData, error: bidsError } = await supabase
        .from('vendor_bids')
        .select(`
          id, vendor_id, bid_amount, estimated_duration, 
          proposal_details, submitted_at, status, rfq_id,
          company_info, pricing, certifications, experience
        `)
        .eq('rfq_id', rfqId)
        .order('submitted_at', { ascending: true });

      if (bidsError) throw bidsError;

      // Enrich with vendor details
      const enrichedBids = await Promise.all(
        (bidsData || []).map(async (bid) => {
          const { data: vendorData } = await supabase
            .from('vendor_profiles')
            .select('company_name, rating, completed_jobs')
            .eq('user_id', bid.vendor_id)
            .single();

          const { data: tierData } = await supabase
            .from('vendor_tiers')
            .select('current_tier')
            .eq('vendor_id', bid.vendor_id)
            .single();

          const { data: scoreData } = await supabase
            .from('bid_scores')
            .select('price_score, rating_score, completion_rate_score, tier_bonus, total_score')
            .eq('bid_id', bid.id)
            .single();

          return {
            ...bid,
            vendor_name: vendorData?.company_name || (bid.company_info as any)?.company_name || 'Unknown Vendor',
            vendor_rating: vendorData?.rating || 0,
            vendor_completed_jobs: vendorData?.completed_jobs || 0,
            vendor_tier: tierData?.current_tier || 'bronze',
            score: scoreData || null
          };
        })
      );

      enrichedBids.sort((a, b) => {
        if (a.score && b.score) return b.score.total_score - a.score.total_score;
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

  const handleAwardContract = async () => {
    if (!selectedBidForAward) return;
    setAwarding(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get tenant ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      // Create contract
      const contractNumber = `CNT-${Date.now().toString(36).toUpperCase()}`;
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          contract_number: contractNumber,
          title: rfqTitle || 'Contract',
          description: `Contract awarded from RFQ bid`,
          vendor_id: selectedBidForAward.vendor_id,
          rfq_id: rfqId,
          contract_value: selectedBidForAward.pricing?.total_cost || selectedBidForAward.bid_amount,
          start_date: contractDetails.start_date,
          end_date: contractDetails.end_date,
          status: 'active',
          created_by: user.id,
          tenant_id: profile?.tenant_id || user.id,
          terms: { notes: contractDetails.notes },
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // Update bid status
      await supabase
        .from('vendor_bids')
        .update({ status: 'awarded' })
        .eq('id', selectedBidForAward.id);

      // Reject other bids
      const otherBidIds = bids
        .filter(b => b.id !== selectedBidForAward.id)
        .map(b => b.id);

      if (otherBidIds.length > 0) {
        await supabase
          .from('vendor_bids')
          .update({ status: 'rejected' })
          .in('id', otherBidIds);

        // Send rejection emails
        for (const bid of bids.filter(b => b.id !== selectedBidForAward.id)) {
          await supabase.functions.invoke('send-bid-rejection', {
            body: { bid_id: bid.id, rfq_id: rfqId },
          });
        }
      }

      // Update RFQ status
      await supabase
        .from('rfqs')
        .update({ status: 'awarded' })
        .eq('id', rfqId);

      // Send contract award email
      await supabase.functions.invoke('send-contract-award', {
        body: { contract_id: contract.id, vendor_id: selectedBidForAward.vendor_id },
      });

      toast.success('Contract awarded successfully!');
      setAwardDialogOpen(false);
      onContractAwarded?.(contract.id);
      fetchBids();
    } catch (error) {
      console.error('Error awarding contract:', error);
      toast.error('Failed to award contract');
    } finally {
      setAwarding(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Rank', 'Vendor', 'Bid Amount', 'Rating', 'Tier', 'Score', 'Status'];
    const rows = bids.map((bid, index) => [
      index + 1,
      bid.vendor_name,
      bid.bid_amount,
      bid.vendor_rating,
      bid.vendor_tier,
      bid.score?.total_score || 'N/A',
      bid.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bid-comparison-${rfqId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-primary text-primary-foreground">🥇 Best Match</Badge>;
    if (index === 1) return <Badge className="bg-muted text-muted-foreground">🥈 Runner Up</Badge>;
    if (index === 2) return <Badge className="bg-warning/20 text-warning-foreground">🥉 Third</Badge>;
    return null;
  };

  const toggleBidSelection = (bidId: string) => {
    setSelectedBids(prev =>
      prev.includes(bidId)
        ? prev.filter(id => id !== bidId)
        : prev.length < 4
          ? [...prev, bidId]
          : prev
    );
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Bid Comparison Dashboard
              </CardTitle>
              <CardDescription>
                Compare {bids.length} vendor bids using automated scoring
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
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
              <TabsList className="mb-4">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
                <TabsTrigger value="cards">Card View</TabsTrigger>
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
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.map((bid, index) => (
                        <TableRow key={bid.id} className={index === 0 ? 'bg-success/5' : ''}>
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
                            ${(bid.pricing?.total_cost || bid.bid_amount || 0).toLocaleString()}
                            {budgetMax > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {(((bid.pricing?.total_cost || bid.bid_amount) / budgetMax) * 100).toFixed(0)}% of budget
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
                          <TableCell className="text-center">
                            <Badge variant={bid.status === 'awarded' ? 'default' : bid.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {bid.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {bid.status === 'submitted' && (
                              <Button
                                size="sm"
                                variant={index === 0 ? 'default' : 'outline'}
                                onClick={() => {
                                  setSelectedBidForAward(bid);
                                  setAwardDialogOpen(true);
                                }}
                              >
                                <Award className="h-4 w-4 mr-1" />
                                Award
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="comparison">
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {bids.map((bid) => (
                      <Button
                        key={bid.id}
                        size="sm"
                        variant={selectedBids.includes(bid.id) ? 'default' : 'outline'}
                        onClick={() => toggleBidSelection(bid.id)}
                      >
                        {bid.vendor_name}
                        {selectedBids.includes(bid.id) && <X className="h-3 w-3 ml-1" />}
                      </Button>
                    ))}
                  </div>

                  {selectedBids.length > 0 && (
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedBids.length}, 1fr)` }}>
                      {selectedBids.map((bidId) => {
                        const bid = bids.find(b => b.id === bidId);
                        if (!bid) return null;
                        const index = bids.indexOf(bid);

                        return (
                          <Card key={bid.id} className={index === 0 ? 'border-2 border-success' : ''}>
                            <CardHeader className="pb-2">
                              {getRankBadge(index)}
                              <CardTitle className="text-lg">{bid.vendor_name}</CardTitle>
                              <VendorTierBadge vendorId={bid.vendor_id} size="sm" />
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Bid Amount</span>
                                <span className="font-bold">${(bid.pricing?.total_cost || bid.bid_amount || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Equipment</span>
                                <span>${(bid.pricing?.equipment_cost || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Labor</span>
                                <span>${(bid.pricing?.labor_cost || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Maintenance/yr</span>
                                <span>${(bid.pricing?.maintenance_cost || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Warranty</span>
                                <span>{bid.pricing?.warranty_years || 'N/A'} years</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Rating</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-primary text-primary" />
                                  <span>{Number(bid.vendor_rating).toFixed(1)}</span>
                                </div>
                              </div>
                              {bid.score && (
                                <div className="pt-2 border-t">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium">Total Score</span>
                                    <span className={`font-bold ${getScoreColor(bid.score.total_score)}`}>
                                      {bid.score.total_score.toFixed(0)}/100
                                    </span>
                                  </div>
                                  <Progress value={bid.score.total_score} className="h-2" />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Bid Amount</span>
                          </div>
                          <span className="font-bold">${(bid.pricing?.total_cost || bid.bid_amount || 0).toLocaleString()}</span>
                        </div>

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

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Completed Jobs</span>
                          </div>
                          <span className="font-medium">{bid.vendor_completed_jobs}</span>
                        </div>

                        {bid.estimated_duration && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Est. Duration</span>
                            </div>
                            <span className="font-medium">{bid.estimated_duration}</span>
                          </div>
                        )}

                        {bid.score && (
                          <div className="pt-3 border-t space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Total Score</span>
                              <span className={`text-lg font-bold ${getScoreColor(bid.score.total_score)}`}>
                                {bid.score.total_score.toFixed(0)}/100
                              </span>
                            </div>
                            <Progress value={bid.score.total_score} className="h-2" />
                          </div>
                        )}

                        {bid.status === 'submitted' && (
                          <Button
                            className="w-full"
                            variant={index === 0 ? 'default' : 'outline'}
                            onClick={() => {
                              setSelectedBidForAward(bid);
                              setAwardDialogOpen(true);
                            }}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Award Contract
                          </Button>
                        )}
                        {bid.status !== 'submitted' && (
                          <Badge className="w-full justify-center" variant={bid.status === 'awarded' ? 'default' : 'destructive'}>
                            {bid.status.toUpperCase()}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Scoring Algorithm Explanation */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Scoring Algorithm</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Price (30%)</p>
                <p>Lower bids score higher</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rating (25%)</p>
                <p>Higher ratings preferred</p>
              </div>
              <div>
                <p className="text-muted-foreground">Experience (20%)</p>
                <p>More jobs = higher score</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tier Bonus (10%)</p>
                <p>Platinum to Bronze</p>
              </div>
              <div>
                <p className="text-muted-foreground">Timeline (15%)</p>
                <p>Faster completion bonus</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Award Contract Dialog */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Award Contract
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedBidForAward?.vendor_name}</p>
              <p className="text-sm text-muted-foreground">
                Bid Amount: ${(selectedBidForAward?.pricing?.total_cost || selectedBidForAward?.bid_amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Start Date</Label>
                <Input
                  type="date"
                  value={contractDetails.start_date}
                  onChange={(e) => setContractDetails(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contract End Date</Label>
                <Input
                  type="date"
                  value={contractDetails.end_date}
                  onChange={(e) => setContractDetails(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={contractDetails.notes}
                onChange={(e) => setContractDetails(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional contract notes..."
                rows={3}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Awarding this contract will automatically reject all other bids and send notifications.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAwardContract} disabled={awarding || !contractDetails.start_date || !contractDetails.end_date}>
              {awarding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Award className="h-4 w-4 mr-2" />}
              Award Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
