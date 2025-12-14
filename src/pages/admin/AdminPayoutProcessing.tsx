import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import StatsCard from '@/components/shared/StatsCard';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import { 
  DollarSign, CheckCircle, XCircle, Clock, AlertTriangle, 
  Search, Filter, ArrowUpDown, Send, Eye, FileText, User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PayoutRequest {
  id: string;
  vendor_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  reference: string | null;
  notes: string | null;
  payout_date: string | null;
  created_at: string;
  updated_at: string;
  vendor_profile?: {
    company_name: string;
    user_id: string;
  };
  profile?: {
    full_name: string;
    email: string;
  };
}

interface PayoutStats {
  pending: number;
  pendingAmount: number;
  approved: number;
  approvedAmount: number;
  completed: number;
  completedAmount: number;
  rejected: number;
}

export default function AdminPayoutProcessing() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [stats, setStats] = useState<PayoutStats>({
    pending: 0,
    pendingAmount: 0,
    approved: 0,
    approvedAmount: 0,
    completed: 0,
    completedAmount: 0,
    rejected: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'complete' | 'reject'>('approve');
  const [transactionId, setTransactionId] = useState('');
  const [processNotes, setProcessNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!hasRole('admin')) {
      toast.error('Admin access required');
      navigate('/dashboard');
      return;
    }
    fetchPayouts();
  }, [user, hasRole, navigate]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      // Fetch payouts with vendor info
      const { data, error } = await supabase
        .from('vendor_payouts')
        .select(`
          id, vendor_id, amount, status, reference, notes, payout_date, created_at, updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch vendor profiles and user profiles
      const vendorIds = [...new Set((data || []).map(p => p.vendor_id))];
      
      let vendorProfiles: Record<string, any> = {};
      let userProfiles: Record<string, any> = {};

      if (vendorIds.length > 0) {
        const { data: vendors } = await supabase
          .from('vendor_profiles')
          .select('id, user_id, company_name')
          .in('user_id', vendorIds);
        
        if (vendors) {
          vendors.forEach(v => {
            vendorProfiles[v.user_id] = v;
          });
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', vendorIds);
        
        if (profiles) {
          profiles.forEach(p => {
            userProfiles[p.id] = p;
          });
        }
      }

      // Combine data
      const enrichedPayouts: PayoutRequest[] = (data || []).map(payout => ({
        ...payout,
        status: payout.status as PayoutRequest['status'],
        vendor_profile: vendorProfiles[payout.vendor_id],
        profile: userProfiles[payout.vendor_id],
      }));

      setPayouts(enrichedPayouts);

      // Calculate stats
      const pending = enrichedPayouts.filter(p => p.status === 'pending');
      const approved = enrichedPayouts.filter(p => p.status === 'approved');
      const completed = enrichedPayouts.filter(p => p.status === 'completed');
      const rejected = enrichedPayouts.filter(p => p.status === 'rejected');

      setStats({
        pending: pending.length,
        pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
        approved: approved.length,
        approvedAmount: approved.reduce((sum, p) => sum + p.amount, 0),
        completed: completed.length,
        completedAmount: completed.reduce((sum, p) => sum + p.amount, 0),
        rejected: rejected.length,
      });

    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };

  const openProcessDialog = (payout: PayoutRequest, action: 'approve' | 'complete' | 'reject') => {
    setSelectedPayout(payout);
    setProcessAction(action);
    setTransactionId('');
    setProcessNotes('');
    setShowProcessDialog(true);
  };

  const handleProcessPayout = async () => {
    if (!selectedPayout || !user) return;

    if (processAction === 'complete' && !transactionId.trim()) {
      toast.error('Transaction ID is required for completion');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          payoutId: selectedPayout.id,
          action: processAction,
          transactionId: transactionId.trim() || null,
          notes: processNotes.trim() || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Payout ${processAction === 'approve' ? 'approved' : processAction === 'complete' ? 'completed' : 'rejected'} successfully`);
      setShowProcessDialog(false);
      fetchPayouts();
    } catch (error: any) {
      console.error('Error processing payout:', error);
      toast.error(error.message || 'Failed to process payout');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      payout.vendor_profile?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-info/10 text-info border-info/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/30"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <PrivatePageWrapper title="Payout Processing">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </PrivatePageWrapper>
    );
  }

  return (
    <PrivatePageWrapper title="Payout Processing">
      <EnhancedPageBackground pattern="grid" gradient="radial" primaryColor="success" intensity="subtle">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Vendor Payout Processing</h1>
              <p className="text-muted-foreground">Review and process vendor withdrawal requests</p>
            </div>
            <Button onClick={fetchPayouts} variant="outline">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Pending"
              value={stats.pending}
              subtitle={`$${stats.pendingAmount.toLocaleString()}`}
              icon={Clock}
              color="warning"
            />
            <StatsCard
              title="Approved"
              value={stats.approved}
              subtitle={`$${stats.approvedAmount.toLocaleString()}`}
              icon={CheckCircle}
              color="info"
            />
            <StatsCard
              title="Completed"
              value={stats.completed}
              subtitle={`$${stats.completedAmount.toLocaleString()}`}
              icon={DollarSign}
              color="success"
            />
            <StatsCard
              title="Rejected"
              value={stats.rejected}
              icon={XCircle}
              color="error"
            />
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by vendor, email, or reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payouts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>
                {filteredPayouts.length} request{filteredPayouts.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayouts.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Payout Requests</h3>
                  <p className="text-muted-foreground">No payout requests match your filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{payout.vendor_profile?.company_name || payout.profile?.full_name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{payout.profile?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-lg">${payout.amount.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell>
                            {payout.reference ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded">{payout.reference}</code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(payout.created_at), { addSuffix: true })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {payout.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-success border-success/30"
                                    onClick={() => openProcessDialog(payout, 'approve')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive/30"
                                    onClick={() => openProcessDialog(payout, 'reject')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {payout.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => openProcessDialog(payout, 'complete')}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                              {(payout.status === 'completed' || payout.status === 'rejected') && (
                                <Button size="sm" variant="ghost" disabled>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </EnhancedPageBackground>

      {/* Process Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === 'approve' ? 'Approve Payout' : 
               processAction === 'complete' ? 'Complete Payout' : 'Reject Payout'}
            </DialogTitle>
            <DialogDescription>
              {processAction === 'approve' && 'Approve this withdrawal request for processing.'}
              {processAction === 'complete' && 'Mark this payout as completed with transaction details.'}
              {processAction === 'reject' && 'Reject this withdrawal request with a reason.'}
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor:</span>
                  <span className="font-medium">{selectedPayout.vendor_profile?.company_name || selectedPayout.profile?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold text-lg">${selectedPayout.amount.toLocaleString()}</span>
                </div>
              </div>

              {processAction === 'complete' && (
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID *</Label>
                  <Input
                    id="transactionId"
                    placeholder="Enter bank transfer or payment reference"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {processAction === 'reject' ? 'Rejection Reason *' : 'Notes (optional)'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={processAction === 'reject' 
                    ? 'Explain why this request is being rejected...' 
                    : 'Add any additional notes...'}
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {processAction === 'reject' && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">
                    Rejecting a payout will notify the vendor. Make sure to provide a clear reason.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayout}
              disabled={processing || (processAction === 'complete' && !transactionId.trim())}
              variant={processAction === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : 
               processAction === 'approve' ? 'Approve Payout' :
               processAction === 'complete' ? 'Mark as Completed' : 'Reject Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrivatePageWrapper>
  );
}
