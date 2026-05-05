import { useParams, Link } from 'react-router-dom';
import { useAdminVendorDetail, useToggleBlacklist } from '@/hooks/useAdminVendorOps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Ban, ShieldCheck, Star, Briefcase } from 'lucide-react';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import { format } from 'date-fns';
import { useState } from 'react';

function Inner() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = useAdminVendorDetail(id);
  const blacklist = useToggleBlacklist();
  const [reason, setReason] = useState('');

  if (isLoading) return <div className="container py-8">Loading…</div>;
  if (!data) return <div className="container py-8">Vendor not found.</div>;

  const profile = (data as any).profile || {};
  const user = (data as any).user || {};
  const contracts = (data as any).contracts || [];
  const bids = (data as any).bids || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button variant="ghost" asChild><Link to="/admin?tab=vendors"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{profile.company_name || user.full_name || 'Vendor'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex gap-2 mt-2">
            {profile.is_verified && <Badge variant="secondary"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>}
            {profile.is_blacklisted && <Badge variant="destructive">Blacklisted</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {profile.is_blacklisted ? (
            <Button variant="outline" onClick={async () => { await blacklist.mutateAsync({ vendor_user_id: id!, blacklist: false }); refetch(); }}>
              Remove from Blacklist
            </Button>
          ) : (
            <div className="flex gap-2 items-center">
              <input className="border rounded px-2 py-1 text-sm" placeholder="Reason"
                value={reason} onChange={e => setReason(e.target.value)} />
              <Button variant="destructive" onClick={async () => { await blacklist.mutateAsync({ vendor_user_id: id!, blacklist: true, reason }); refetch(); }}>
                <Ban className="h-4 w-4 mr-2" />Blacklist
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4" />Rating</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{Number(profile.rating || 0).toFixed(1)} / 5</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4" />Completed Jobs</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{profile.completed_jobs || 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Contracts</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{contracts.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Score Breakdown</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>Verified: {profile.is_verified ? '✓' : '—'}</li>
            <li>Insurance: {profile.insurance_verified ? '✓' : '—'}</li>
            <li>Background check: {profile.background_check_verified ? '✓' : '—'}</li>
            <li>Specialties: {(profile.specialties || []).join(', ') || '—'}</li>
            <li>Subscription: {profile.subscription_status || 'none'}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bid History ({bids.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Submitted</TableHead><TableHead>Lot</TableHead><TableHead>Price</TableHead></TableRow></TableHeader>
            <TableBody>
              {bids.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No bids submitted</TableCell></TableRow>
              ) : bids.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell>{b.submitted_at ? format(new Date(b.submitted_at), 'MMM d, yyyy') : '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{String(b.rfq_lot_id).slice(0, 8)}…</TableCell>
                  <TableCell>${Number(b.unit_price || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contract History ({contracts.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No contracts</TableCell></TableRow>
              ) : contracts.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>${Number(c.contract_value || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminVendorDetail() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <PrivatePageWrapper title="Vendor Detail"><Inner /></PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}
