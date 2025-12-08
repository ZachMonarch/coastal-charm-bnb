import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Edit, Eye, Send, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getStatusBadgeClass } from '@/utils/statusBadgeHelper';

interface UserPayment {
  id: string;
  vendor_id: string;
  user_type: string;
  title: string;
  description: string;
  amount: number;
  payment_type: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  user_name?: string;
}

interface PaymentRefund {
  id: string;
  payment_id: string;
  requested_by: string;
  reason: string;
  amount: number;
  status: string;
  created_at: string;
  user_name?: string;
  payment_title?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function EnhancedPaymentManagement() {
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [refunds, setRefunds] = useState<PaymentRefund[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<UserPayment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newPayment, setNewPayment] = useState({
    user_id: '',
    user_type: 'vendor',
    title: '',
    description: '',
    amount: '',
    payment_type: 'custom',
    due_date: ''
  });

  const [editPayment, setEditPayment] = useState({
    title: '',
    description: '',
    amount: '',
    due_date: '',
    status: 'pending'
  });

  const [newPayout, setNewPayout] = useState({
    vendor_id: '',
    amount: '',
    reference: '',
    notes: ''
  });

  const paymentTypes = [
    { value: 'background_check', label: 'Background Check' },
    { value: 'service_fee', label: 'Service Fee' },
    { value: 'security_bond', label: 'Security Bond' },
    { value: 'subscription', label: 'Subscription Fee' },
    { value: 'custom', label: 'Custom' }
  ];

  const userTypes = [
    { value: 'vendor', label: 'Vendor' },
    { value: 'tenant', label: 'Tenant' },
    { value: 'property_manager', label: 'Property Manager' }
  ];

  useEffect(() => {
    fetchData();
    
    // Real-time subscription
    const channel = supabase
      .channel('payment-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_payments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_refunds' }, fetchRefunds)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPayments(), fetchRefunds(), fetchUsers()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    const { data: paymentsData } = await supabase
      .from('vendor_payments')
      .select('id, vendor_id, user_type, title, description, amount, payment_type, status, due_date, paid_at, created_at')
      .order('created_at', { ascending: false });

    if (paymentsData && paymentsData.length > 0) {
      const userIds = [...new Set(paymentsData.map(p => p.vendor_id))];
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      setPayments(paymentsData.map(p => ({
        ...p,
        user_name: userProfiles?.find(u => u.id === p.vendor_id)?.full_name || 'Unknown User'
      })));
    } else {
      setPayments([]);
    }
  };

  const fetchRefunds = async () => {
    const { data: refundsData } = await supabase
      .from('payment_refunds')
      .select('id, payment_id, requested_by, reason, amount, status, created_at')
      .order('created_at', { ascending: false });

    if (refundsData && refundsData.length > 0) {
      const userIds = [...new Set(refundsData.map(r => r.requested_by))];
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const paymentIds = [...new Set(refundsData.map(r => r.payment_id))];
      const { data: paymentDetails } = await supabase
        .from('vendor_payments')
        .select('id, title')
        .in('id', paymentIds);
      
      setRefunds(refundsData.map(r => ({
        ...r,
        user_name: userProfiles?.find(u => u.id === r.requested_by)?.full_name || 'Unknown',
        payment_title: paymentDetails?.find(p => p.id === r.payment_id)?.title || 'Unknown Payment'
      })));
    } else {
      setRefunds([]);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name');
    
    setUsers(data || []);
  };

  const handleCreatePayment = async () => {
    if (!newPayment.user_id || !newPayment.title || !newPayment.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_create_payment', {
        p_user_id: newPayment.user_id,
        p_user_type: newPayment.user_type,
        p_title: newPayment.title,
        p_description: newPayment.description,
        p_amount: parseFloat(newPayment.amount),
        p_payment_type: newPayment.payment_type,
        p_due_date: newPayment.due_date || null
      });

      if (error) throw error;

      // Send email notification to user
      try {
        await supabase.functions.invoke('send-payment-notification', {
          body: {
            userId: newPayment.user_id,
            amount: parseFloat(newPayment.amount),
            title: newPayment.title,
            type: 'payment_request',
            paymentId: data || 'new-payment'
          }
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the payment if email fails
      }

      toast.success('Payment created and user notified!');
      setShowCreateDialog(false);
      setNewPayment({
        user_id: '',
        user_type: 'vendor',
        title: '',
        description: '',
        amount: '',
        payment_type: 'custom',
        due_date: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment');
    }
  };

  const handleEditPayment = async () => {
    if (!selectedPayment) return;

    try {
      const { error } = await supabase
        .from('vendor_payments')
        .update({
          title: editPayment.title,
          description: editPayment.description,
          amount: parseFloat(editPayment.amount),
          due_date: editPayment.due_date,
          status: editPayment.status
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      // Notify user of changes
      await supabase.from('notifications').insert({
        user_id: selectedPayment.vendor_id,
        title: 'Payment Modified',
        message: `Payment "${editPayment.title}" has been updated`,
        type: 'info',
        action_url: selectedPayment.user_type === 'vendor' ? '/vendor/payments' : '/payments'
      });

      toast.success('Payment updated and user notified!');
      setShowEditDialog(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment');
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const payment = payments.find(p => p.id === id);
      if (payment && payment.status !== 'pending') {
        toast.error('Can only delete pending payments');
        return;
      }

      const { error } = await supabase
        .from('vendor_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Payment deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete payment');
    }
  };

  const handleSendPayout = async () => {
    if (!newPayout.vendor_id || !newPayout.amount || !newPayout.reference) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Get vendor details for email
      const vendor = users.find(u => u.id === newPayout.vendor_id);
      
      const { data, error } = await supabase.rpc('admin_send_payout', {
        p_vendor_id: newPayout.vendor_id,
        p_amount: parseFloat(newPayout.amount),
        p_reference: newPayout.reference,
        p_notes: newPayout.notes || null
      });

      if (error) throw error;

      // Send email notification to vendor using the dedicated payout notification function
      try {
        await supabase.functions.invoke('send-payout-notification', {
          body: {
            vendorId: newPayout.vendor_id,
            vendorEmail: vendor?.email,
            vendorName: vendor?.full_name || 'Vendor',
            amount: parseFloat(newPayout.amount),
            reference: newPayout.reference,
            notes: newPayout.notes
          }
        });
      } catch (emailError) {
        console.error('Payout email notification failed:', emailError);
        // Don't fail the payout if email fails
      }

      // Create in-app notification for the vendor
      await supabase.from('notifications').insert({
        user_id: newPayout.vendor_id,
        title: '💰 New Payout Available',
        message: `A payout of $${parseFloat(newPayout.amount).toFixed(2)} has been issued. Please acknowledge it to request withdrawal.`,
        type: 'info',
        category: 'payment',
        priority: 'high',
        action_url: '/vendor/payouts'
      });

      toast.success('Payout sent and vendor notified via email!');
      setShowPayoutDialog(false);
      setNewPayout({ vendor_id: '', amount: '', reference: '', notes: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send payout');
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    try {
      const { error } = await supabase
        .from('payment_refunds')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('id', refundId);

      if (error) throw error;

      toast.success('Refund approved');
      fetchRefunds();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve refund');
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    try {
      const { error } = await supabase
        .from('payment_refunds')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('id', refundId);

      if (error) throw error;

      toast.success('Refund rejected');
      fetchRefunds();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject refund');
    }
  };

  const getStatusBadge = (status: string) => {
    return getStatusBadgeClass(status);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <div className="flex gap-2">
          <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Send Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Vendor Payout</DialogTitle>
                <DialogDescription>
                  Select a vendor and enter payout details. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
          <div className="space-y-4">
            {newPayout.vendor_id && (
              <div>
                <Label>Vendor</Label>
                <Select value={newPayout.vendor_id} onValueChange={(v) => setNewPayout({ ...newPayout, vendor_id: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u.role === "vendor")
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!newPayout.vendor_id && (
              <div>
                <Label>Vendor *</Label>
                <Select value={newPayout.vendor_id} onValueChange={(v) => setNewPayout({ ...newPayout, vendor_id: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u.role === "vendor")
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Amount ($) *</Label>
              <Input
                type="number"
                step="0.01"
                value={newPayout.amount}
                onChange={(e) => setNewPayout({ ...newPayout, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Reference *</Label>
              <Input
                value={newPayout.reference}
                onChange={(e) => setNewPayout({ ...newPayout, reference: e.target.value })}
                placeholder="Project completion, Milestone 1, etc."
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={newPayout.notes}
                onChange={(e) => setNewPayout({ ...newPayout, notes: e.target.value })}
                placeholder="Additional details about this payout..."
              />
            </div>
          </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendPayout}>Send Payout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Payment Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Payment Request</DialogTitle>
                <DialogDescription>
                  Create a payment request for a vendor, tenant, or property manager.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>User Type *</Label>
                    <Select value={newPayment.user_type} onValueChange={(v) => setNewPayment({...newPayment, user_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {userTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>User *</Label>
                    <Select value={newPayment.user_id} onValueChange={(v) => setNewPayment({...newPayment, user_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.role === newPayment.user_type).map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Title *</Label>
                  <Input value={newPayment.title} onChange={(e) => setNewPayment({...newPayment, title: e.target.value})} placeholder="Payment request title" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newPayment.description} onChange={(e) => setNewPayment({...newPayment, description: e.target.value})} placeholder="Describe the payment request..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount ($) *</Label>
                    <Input type="number" step="0.01" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Payment Type *</Label>
                    <Select value={newPayment.payment_type} onValueChange={(v) => setNewPayment({...newPayment, payment_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Due Date (optional)</Label>
                  <Input type="date" value={newPayment.due_date} onChange={(e) => setNewPayment({...newPayment, due_date: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreatePayment}>Create Payment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment Requests ({payments.length})</TabsTrigger>
          <TabsTrigger value="refunds">Refund Requests ({refunds.filter(r => r.status === 'pending').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>All Payment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.user_name}</TableCell>
                      <TableCell className="capitalize">{payment.user_type}</TableCell>
                      <TableCell>{payment.title}</TableCell>
                      <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(payment.status)}>{payment.status}</Badge>
                      </TableCell>
                      <TableCell>{payment.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setEditPayment({
                                    title: payment.title,
                                    description: payment.description,
                                    amount: payment.amount.toString(),
                                    due_date: payment.due_date || '',
                                    status: payment.status
                                  });
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirm(payment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Refund Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>{refund.user_name}</TableCell>
                      <TableCell>{refund.payment_title}</TableCell>
                      <TableCell className="font-medium">${refund.amount.toFixed(2)}</TableCell>
                      <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(refund.status)}>{refund.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(refund.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {refund.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleApproveRefund(refund.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRejectRefund(refund.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={editPayment.title} onChange={(e) => setEditPayment({...editPayment, title: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editPayment.description} onChange={(e) => setEditPayment({...editPayment, description: e.target.value})} />
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" value={editPayment.amount} onChange={(e) => setEditPayment({...editPayment, amount: e.target.value})} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={editPayment.due_date} onChange={(e) => setEditPayment({...editPayment, due_date: e.target.value})} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editPayment.status} onValueChange={(v) => setEditPayment({...editPayment, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditPayment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">User</Label>
                <p className="font-medium">{selectedPayment.user_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedPayment.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{selectedPayment.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium text-lg">${selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusBadge(selectedPayment.status)}>{selectedPayment.status}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p>{new Date(selectedPayment.created_at).toLocaleString()}</p>
              </div>
              {selectedPayment.paid_at && (
                <div>
                  <Label className="text-muted-foreground">Paid At</Label>
                  <p>{new Date(selectedPayment.paid_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeletePayment(deleteConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
