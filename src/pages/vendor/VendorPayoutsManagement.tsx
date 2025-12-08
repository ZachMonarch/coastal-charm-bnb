import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import { DollarSign, Download, Settings, TrendingUp, CheckCircle2, Clock, MessageSquare, AlertCircle, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import PageHero from '@/components/shared/PageHero';
import StatsCard from '@/components/shared/StatsCard';

interface VendorPayout {
  id: string;
  amount: number;
  status: string;
  reference: string;
  notes: string | null;
  payout_date: string;
  payout_method: string;
  created_at: string;
  vendor_acknowledged: boolean;
  vendor_notes: string | null;
  acknowledged_at: string | null;
}

export default function VendorPayoutsManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<VendorPayout | null>(null);
  const [hasPayoutSettings, setHasPayoutSettings] = useState(false);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingPayouts = payouts.filter(p => p.status === 'pending' && !p.vendor_acknowledged);
  const acknowledgedPayouts = payouts.filter(p => p.vendor_acknowledged);
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalReceived = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const totalAcknowledged = acknowledgedPayouts.reduce((sum, p) => sum + p.amount, 0);

  useEffect(() => {
    if (user) {
      fetchData();

      const channel = supabase
        .channel('vendor-payouts')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'vendor_payouts',
          filter: `vendor_id=eq.${user.id}`
        }, fetchData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: payoutsData, error: payoutsError } = await supabase
        .from('vendor_payouts')
        .select('id, amount, status, reference, notes, payout_date, payout_method, created_at, vendor_acknowledged, vendor_notes, acknowledged_at')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);

      const { data: settingsData } = await supabase
        .from('vendor_payout_settings')
        .select('id, is_verified')
        .eq('vendor_id', user.id)
        .maybeSingle();

      setHasPayoutSettings(!!settingsData && settingsData.is_verified);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgePayout = async () => {
    if (!selectedPayout) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('vendor_payouts')
        .update({ 
          vendor_acknowledged: true,
          vendor_notes: acknowledgeNotes.trim() || null,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', selectedPayout.id);

      if (error) throw error;

      toast.success('Payout acknowledged successfully');
      setShowAcknowledgeDialog(false);
      setAcknowledgeNotes('');
      setSelectedPayout(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to acknowledge payout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestWithdrawal = async (payout: VendorPayout) => {
    if (!hasPayoutSettings) {
      toast.error('Please set up your payout settings first');
      navigate('/vendor/payout-settings');
      return;
    }

    if (!payout.vendor_acknowledged) {
      toast.error('Please acknowledge the payout first');
      return;
    }

    try {
      const { error } = await supabase
        .from('vendor_payouts')
        .update({ 
          status: 'requested',
          requested_at: new Date().toISOString()
        })
        .eq('id', payout.id);

      if (error) throw error;

      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          title: 'Payout Withdrawal Requested',
          message: `Vendor requested withdrawal of $${payout.amount.toFixed(2)}`,
          type: 'info',
          action_url: '/admin/payment-management'
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast.success('Withdrawal request submitted');
      setShowWithdrawDialog(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to request withdrawal');
    }
  };

  const getStatusBadge = (status: string, acknowledged: boolean) => {
    if (!acknowledged && status === 'pending') {
      return 'bg-warning/10 text-warning border-warning/30';
    }
    const variants: Record<string, string> = {
      pending: 'bg-info/10 text-info border-info/30',
      requested: 'bg-primary/10 text-primary border-primary/30',
      processing: 'bg-secondary/10 text-secondary border-secondary/30',
      completed: 'bg-success/10 text-success border-success/30',
      failed: 'bg-destructive/10 text-destructive border-destructive/30'
    };
    return variants[status] || variants.pending;
  };

  if (loading) {
    return (
      <PrivatePageWrapper title="Payouts">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PrivatePageWrapper>
    );
  }

  return (
    <PrivatePageWrapper title="Payouts">
      <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="success" intensity="subtle" showOrbs>
        <div className="container mx-auto py-6 space-y-6">
          <PageHero
            title="My Payouts"
            description="View payouts from admin and request withdrawals"
            icon={Wallet}
            variant="gradient"
            actions={[
              { label: 'Payout Settings', href: '/vendor/payout-settings' }
            ]}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Awaiting Acknowledgment"
              value={`$${totalPending.toFixed(2)}`}
              subtitle={`${pendingPayouts.length} payout(s)`}
              icon={AlertCircle}
              color="warning"
              animated
            />
            <StatsCard
              title="Acknowledged"
              value={`$${totalAcknowledged.toFixed(2)}`}
              icon={CheckCircle2}
              color="success"
              animated
            />
            <StatsCard
              title="Total Received"
              value={`$${totalReceived.toFixed(2)}`}
              icon={TrendingUp}
              color="info"
              animated
            />
            <StatsCard
              title="All Payouts"
              value={payouts.length}
              icon={DollarSign}
              color="primary"
              animated
            />
          </div>

        {!hasPayoutSettings && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-warning">Payout Settings Required</p>
                  <p className="text-sm text-muted-foreground">Set up your bank account to receive payouts</p>
                </div>
                <Button onClick={() => navigate('/vendor/payout-settings')}>
                  Set Up Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Acknowledgment Section */}
        {pendingPayouts.length > 0 && (
          <Card className="border-warning/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                Action Required - Acknowledge Payouts
              </CardTitle>
              <CardDescription>
                Review and acknowledge these payouts. You can add notes for admin before requesting withdrawal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPayouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold">${payout.amount.toFixed(2)}</span>
                        <Badge variant="outline" className="bg-warning/10 text-warning">
                          Needs Acknowledgment
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reference: {payout.reference} • {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                      {payout.notes && (
                        <p className="text-sm mt-1 p-2 bg-muted rounded">
                          <span className="font-medium">Admin Note:</span> {payout.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedPayout(payout);
                        setShowAcknowledgeDialog(true);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No payouts yet</p>
                <p className="text-sm text-muted-foreground">Payouts will appear here when admin sends payments</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Your Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{new Date(payout.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{payout.reference}</TableCell>
                      <TableCell className="font-medium">${payout.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadge(payout.status, payout.vendor_acknowledged)}>
                            {!payout.vendor_acknowledged && payout.status === 'pending' ? 'Awaiting Ack' : payout.status}
                          </Badge>
                          {payout.vendor_acknowledged && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payout.vendor_notes ? (
                          <span className="text-sm flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {payout.vendor_notes.substring(0, 30)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payout.vendor_acknowledged && payout.status === 'pending' && hasPayoutSettings && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowWithdrawDialog(true);
                            }}
                          >
                            Request Withdrawal
                          </Button>
                        )}
                        {!payout.vendor_acknowledged && payout.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowAcknowledgeDialog(true);
                            }}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Acknowledge Dialog */}
        <Dialog open={showAcknowledgeDialog} onOpenChange={setShowAcknowledgeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Acknowledge Payout</DialogTitle>
              <DialogDescription>
                Confirm you've reviewed this payout. You can add notes for the admin.
              </DialogDescription>
            </DialogHeader>
            {selectedPayout && (
              <div className="space-y-4">
                <div className="bg-success/10 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Payout Amount</p>
                  <p className="text-3xl font-bold text-success">${selectedPayout.amount.toFixed(2)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-medium">{selectedPayout.reference}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span>{new Date(selectedPayout.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {selectedPayout.notes && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Admin Note:</p>
                    <p className="text-sm">{selectedPayout.notes}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="vendor-notes">Your Notes (Optional)</Label>
                  <Textarea
                    id="vendor-notes"
                    placeholder="Add any notes or comments for the admin..."
                    value={acknowledgeNotes}
                    onChange={(e) => setAcknowledgeNotes(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    These notes will be visible to the admin when processing your withdrawal.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAcknowledgeDialog(false);
                setAcknowledgeNotes('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleAcknowledgePayout} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm & Acknowledge'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdrawal Dialog */}
        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Submit a withdrawal request for this acknowledged payout.
              </DialogDescription>
            </DialogHeader>
            {selectedPayout && (
              <div className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Withdrawal Amount</p>
                  <p className="text-3xl font-bold">${selectedPayout.amount.toFixed(2)}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span>{selectedPayout.reference}</span>
                  </div>
                  {selectedPayout.vendor_notes && (
                    <div className="bg-muted p-3 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Your Notes:</p>
                      <p>{selectedPayout.vendor_notes}</p>
                    </div>
                  )}
                </div>

                <div className="bg-info/10 p-4 rounded-lg">
                  <p className="text-sm text-info">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Your withdrawal request will be processed by an admin. You'll receive a notification once it's completed.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>Cancel</Button>
              <Button onClick={() => selectedPayout && handleRequestWithdrawal(selectedPayout)}>
                <Download className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
