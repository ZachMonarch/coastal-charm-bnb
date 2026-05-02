import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdminRFQAccessRequest {
  id: string;
  rfq_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  rfqs?: { title: string | null } | null;
}

type Tab = 'pending' | 'approved' | 'rejected';

export default function AdminRFQAccessRequestsPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('pending');
  const [requests, setRequests] = useState<AdminRFQAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async (currentTab: Tab) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rfq_access_requests')
      .select('id,rfq_id,user_id,email,full_name,company_name,phone,message,status,admin_notes,created_at,reviewed_at,rfqs(title)')
      .eq('status', currentTab)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      toast.error(`Failed to load access requests: ${error.message}`);
    } else {
      setRequests((data ?? []) as unknown as AdminRFQAccessRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests(tab);
  }, [tab]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('rfq_access_requests')
      .update({
        status,
        admin_notes: notes ?? null,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    setProcessingId(null);
    if (error) {
      toast.error(`Could not ${status === 'approved' ? 'approve' : 'reject'} request: ${error.message}`);
      return;
    }
    toast.success(status === 'approved' ? 'Access granted to vendor' : 'Request rejected');
    fetchRequests(tab);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Access Requests</CardTitle>
        <CardDescription>
          Review per-project access requests. Approving creates an access grant so the vendor can view the full RFQ and submit bids (if their plan and approval status allow).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              <Clock className="h-3.5 w-3.5 mr-1" /> Pending
            </TabsTrigger>
            <TabsTrigger value="approved">
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approved
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="h-3.5 w-3.5 mr-1" /> Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No {tab} requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[220px] truncate">
                          {r.rfqs?.title ?? r.rfq_id}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{r.full_name ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        </TableCell>
                        <TableCell>
                          <div>{r.company_name ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{r.phone ?? ''}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {tab === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingId === r.id}
                                onClick={() => updateStatus(r.id, 'rejected')}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                disabled={processingId === r.id}
                                onClick={() => updateStatus(r.id, 'approved')}
                              >
                                Approve
                              </Button>
                            </>
                          ) : (
                            <Badge variant={tab === 'approved' ? 'default' : 'secondary'}>
                              {tab}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
