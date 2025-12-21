import { useState } from 'react';
import { useAdminAccessRequests, type AccessRequestAdmin } from '@/hooks/useAdminAccessRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle, Clock, Building2, Briefcase, Mail, Phone, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function AdminAccessRequestsPanel() {
  const {
    requests,
    isLoading,
    isProcessing,
    fetchRequests,
    approveRequest,
    rejectRequest,
    pendingCount,
    isAdmin
  } = useAdminAccessRequests();

  const [selectedRequest, setSelectedRequest] = useState<AccessRequestAdmin | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject' | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const handleTabChange = (value: string) => {
    const tab = value as 'pending' | 'approved' | 'rejected' | 'all';
    setActiveTab(tab);
    fetchRequests(tab);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    const success = await approveRequest(selectedRequest.id);
    if (success) {
      setSelectedRequest(null);
      setDialogMode(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    const success = await rejectRequest(selectedRequest.id, rejectReason);
    if (success) {
      setSelectedRequest(null);
      setDialogMode(null);
      setRejectReason('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-success border-success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-destructive border-destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'vendor' 
      ? <Briefcase className="h-4 w-4 text-info" />
      : <Building2 className="h-4 w-4 text-primary" />;
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          You do not have permission to view access requests.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const filteredRequests = activeTab === 'all' 
    ? requests 
    : requests.filter(r => r.status === activeTab);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Access Requests
                {pendingCount > 0 && (
                  <Badge variant="destructive">{pendingCount} Pending</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Review and manage user access requests for vendor and property manager roles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No {activeTab === 'all' ? '' : activeTab} requests found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role Requested</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {request.full_name || 'No name'}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {request.email}
                            </div>
                            {request.phone && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {request.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(request.role_requested)}
                            <span className="capitalize">{request.role_requested.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{request.company_name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-success hover:bg-success/10"
                                disabled={isProcessing === request.id}
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setDialogMode('approve');
                                }}
                              >
                                {isProcessing === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10"
                                disabled={isProcessing === request.id}
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setDialogMode('reject');
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {request.reviewed_at 
                                ? formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })
                                : '-'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={dialogMode === 'approve'} onOpenChange={() => { setDialogMode(null); setSelectedRequest(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Access Request</DialogTitle>
            <DialogDescription>
              This will grant <strong>{selectedRequest?.role_requested === 'vendor' ? 'Vendor' : 'Property Manager'}</strong> access to {selectedRequest?.full_name || selectedRequest?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm"><strong>Email:</strong> {selectedRequest?.email}</p>
            <p className="text-sm"><strong>Company:</strong> {selectedRequest?.company_name || 'Not specified'}</p>
            <p className="text-sm"><strong>Phone:</strong> {selectedRequest?.phone || 'Not specified'}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); setSelectedRequest(null); }}>
              Cancel
            </Button>
            <Button 
              className="bg-success hover:bg-success/90" 
              onClick={handleApprove}
              disabled={!!isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve & Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={dialogMode === 'reject'} onOpenChange={() => { setDialogMode(null); setSelectedRequest(null); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Access Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this request. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); setSelectedRequest(null); setRejectReason(''); }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim() || !!isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
