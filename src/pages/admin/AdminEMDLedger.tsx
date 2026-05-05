import { useState } from 'react';
import { useAdminEMDList, useRefundEMD, useForfeitEMD } from '@/hooks/useEMD';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, RotateCcw, Ban } from 'lucide-react';
import { format } from 'date-fns';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', held: 'default', refunded: 'secondary', forfeited: 'destructive', failed: 'destructive',
};

function AdminEMDLedgerInner() {
  const { data, isLoading } = useAdminEMDList();
  const refund = useRefundEMD();
  const forfeit = useForfeitEMD();
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">EMD Ledger</h1>
          <p className="text-muted-foreground">Earnest Money Deposit transactions across all RFQs</p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Loading…</p> : !data?.length ? <p className="text-muted-foreground">No EMD transactions yet.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>RFQ</TableHead><TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>{format(new Date(e.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-mono text-xs">{e.rfq_id.slice(0, 8)}…</TableCell>
                    <TableCell className="font-mono text-xs">{e.vendor_id.slice(0, 8)}…</TableCell>
                    <TableCell>${(e.amount_cents / 100).toFixed(2)} {e.currency.toUpperCase()}</TableCell>
                    <TableCell><Badge variant={statusVariant[e.status] || 'outline'}>{e.status}</Badge></TableCell>
                    <TableCell>
                      {e.status === 'held' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={busy === e.id}
                            onClick={async () => { setBusy(e.id); await refund.mutateAsync({ emd_id: e.id }); setBusy(null); }}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Refund
                          </Button>
                          <Button size="sm" variant="destructive" disabled={busy === e.id}
                            onClick={async () => { setBusy(e.id); await forfeit.mutateAsync({ emd_id: e.id }); setBusy(null); }}>
                            <Ban className="h-3 w-3 mr-1" /> Forfeit
                          </Button>
                        </div>
                      )}
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

export default function AdminEMDLedger() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <PrivatePageWrapper title="EMD Ledger"><AdminEMDLedgerInner /></PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}
