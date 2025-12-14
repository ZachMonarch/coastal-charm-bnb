import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, CheckCircle, XCircle, Clock, Search, 
  AlertCircle, DollarSign, Calendar, User 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SubscriptionRequest {
  id: string;
  vendor_id: string;
  current_plan: string | null;
  requested_plan: string;
  status: string;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  admin_notes: string | null;
  vendor?: {
    full_name: string | null;
    email: string;
  };
}

interface VendorSubscription {
  user_id: string;
  company_name: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  profile?: {
    full_name: string | null;
    email: string;
  };
}

export default function AdminSubscriptionManagement() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [vendors, setVendors] = useState<VendorSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorSubscription | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending subscription requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('subscription_requests')
        .select('id, vendor_id, current_plan, requested_plan, status, requested_at, processed_at, processed_by, admin_notes')
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch vendor profiles for requests
      if (requestsData && requestsData.length > 0) {
        const vendorIds = requestsData.map(r => r.vendor_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', vendorIds);

        const enrichedRequests = requestsData.map(req => ({
          ...req,
          vendor: profiles?.find(p => p.id === req.vendor_id)
        }));

        setRequests(enrichedRequests);
      } else {
        setRequests([]);
      }

      // Fetch all vendor subscriptions
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('user_id, company_name, subscription_plan, subscription_status')
        .order('company_name');

      if (vendorError) throw vendorError;

      if (vendorData && vendorData.length > 0) {
        const userIds = vendorData.map(v => v.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const enrichedVendors = vendorData.map(vendor => ({
          ...vendor,
          profile: profiles?.find(p => p.id === vendor.user_id)
        }));

        setVendors(enrichedVendors);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('admin-update-vendor-subscription', {
        body: {
          vendorId: selectedRequest.vendor_id,
          newPlan: actionType === 'approve' ? selectedRequest.requested_plan : selectedRequest.current_plan || 'free',
          requestId: selectedRequest.id,
          action: actionType,
          adminNotes
        }
      });

      if (error) throw error;

      toast.success(`Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowActionDialog(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast.error(error.message || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualUpdate = async () => {
    if (!selectedVendor || !newPlan) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('admin-update-vendor-subscription', {
        body: {
          vendorId: selectedVendor.user_id,
          newPlan,
          adminNotes
        }
      });

      if (error) throw error;

      toast.success('Subscription updated successfully');
      setShowManualDialog(false);
      setSelectedVendor(null);
      setNewPlan('');
      setAdminNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error(error.message || 'Failed to update subscription');
    } finally {
      setProcessing(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');
  
  const filteredVendors = vendors.filter(v => 
    v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.profile?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanBadgeColor = (plan: string | null) => {
    switch (plan) {
      case 'enterprise': return 'bg-primary/10 text-primary border-primary/30';
      case 'premium': return 'bg-success/10 text-success border-success/30';
      case 'basic': return 'bg-info/10 text-info border-info/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-sm text-muted-foreground">Pending Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{vendors.filter(v => v.subscription_plan === 'premium' || v.subscription_plan === 'enterprise').length}</div>
            <p className="text-sm text-muted-foreground">Premium+ Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">{vendors.filter(v => v.subscription_plan === 'basic').length}</div>
            <p className="text-sm text-muted-foreground">Basic Plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold">{vendors.filter(v => !v.subscription_plan || v.subscription_plan === 'free').length}</div>
            <p className="text-sm text-muted-foreground">Free Tier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-vendors">All Vendors</TabsTrigger>
          <TabsTrigger value="history">Request History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground">All subscription requests have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(request => (
              <Card key={request.id} className="border-warning/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{request.vendor?.full_name || 'Unknown Vendor'}</h3>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{request.vendor?.email}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">From:</span>
                          <Badge variant="outline" className={getPlanBadgeColor(request.current_plan)}>
                            {request.current_plan || 'Free'}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">To:</span>
                          <Badge variant="outline" className={getPlanBadgeColor(request.requested_plan)}>
                            {request.requested_plan}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested: {format(new Date(request.requested_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType('reject');
                          setShowActionDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType('approve');
                          setShowActionDialog(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all-vendors" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredVendors.map(vendor => (
              <Card key={vendor.user_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{vendor.company_name}</h3>
                        <Badge variant="outline" className={getPlanBadgeColor(vendor.subscription_plan)}>
                          {vendor.subscription_plan || 'Free'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{vendor.profile?.email}</p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setNewPlan(vendor.subscription_plan || 'free');
                        setShowManualDialog(true);
                      }}
                    >
                      Change Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No History</h3>
                <p className="text-muted-foreground">No processed requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            processedRequests.map(request => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{request.vendor?.full_name || 'Unknown Vendor'}</h3>
                        <Badge variant="outline" className={
                          request.status === 'approved' 
                            ? 'bg-success/10 text-success border-success/30'
                            : 'bg-destructive/10 text-destructive border-destructive/30'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.current_plan || 'Free'} → {request.requested_plan}
                      </p>
                      {request.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Note: {request.admin_notes}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {request.processed_at && format(new Date(request.processed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Subscription Request' : 'Reject Subscription Request'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedRequest.vendor?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.current_plan || 'Free'} → {selectedRequest.requested_plan}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Admin Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Update Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Vendor Subscription</DialogTitle>
          </DialogHeader>
          
          {selectedVendor && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedVendor.company_name}</p>
                <p className="text-sm text-muted-foreground">{selectedVendor.profile?.email}</p>
              </div>
              
              <div className="space-y-2">
                <Label>New Plan</Label>
                <Select value={newPlan} onValueChange={setNewPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic ($49.99/mo)</SelectItem>
                    <SelectItem value="premium">Premium ($99.99/mo)</SelectItem>
                    <SelectItem value="enterprise">Enterprise ($399.99/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Admin Notes (optional)</Label>
                <Textarea
                  placeholder="Reason for change..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualUpdate} disabled={processing}>
              {processing ? 'Updating...' : 'Update Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
