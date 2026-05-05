import { useState } from 'react';
import { useCrossRFQBids, useToggleShortlist } from '@/hooks/useAdminVendorOps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import { format } from 'date-fns';

function Inner() {
  const [status, setStatus] = useState<string>('all');
  const { data, isLoading } = useCrossRFQBids(status === 'all' ? undefined : status);
  const toggle = useToggleShortlist();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Cross-RFQ Bid Analysis</h1>
            <p className="text-muted-foreground">Compare and shortlist vendors across all RFQs</p>
          </div>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="awarded">Awarded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Bids ({data?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Loading…</p> : !data?.length ? <p className="text-muted-foreground">No bids match.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ</TableHead><TableHead>Vendor</TableHead><TableHead>Total</TableHead>
                  <TableHead>Bids</TableHead><TableHead>Last Submitted</TableHead><TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data as any[]).map((row, i) => (
                  <TableRow key={`${row.rfq_id}-${row.vendor_id}-${i}`}>
                    <TableCell>
                      <Link to={`/admin/rfq/${row.rfq_id}`} className="hover:text-primary">{row.rfq_title}</Link>
                      <Badge variant="outline" className="ml-2">{row.rfq_status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link to={`/admin/vendors/${row.vendor_id}`} className="hover:text-primary">{row.vendor_name || '—'}</Link>
                    </TableCell>
                    <TableCell className="font-semibold">${Number(row.total_amount).toLocaleString()}</TableCell>
                    <TableCell>{row.bid_count}</TableCell>
                    <TableCell>{row.last_submitted_at ? format(new Date(row.last_submitted_at), 'MMM d') : '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={row.is_shortlisted ? 'default' : 'outline'}
                        onClick={() => toggle.mutate({ rfq_id: row.rfq_id, vendor_id: row.vendor_id, shortlisted: row.is_shortlisted })}>
                        <Star className={`h-3 w-3 mr-1 ${row.is_shortlisted ? 'fill-current' : ''}`} />
                        {row.is_shortlisted ? 'Shortlisted' : 'Shortlist'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CrossRFQBidAnalysis() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <PrivatePageWrapper title="Bid Analysis"><Inner /></PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}
