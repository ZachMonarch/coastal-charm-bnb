import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, ExternalLink } from 'lucide-react';
import { VendorPayout } from '@/hooks/useVendorInvoicing';
import { Button } from '@/components/ui/button';
import { getPaymentStatusColor } from '@/utils/themeColors';

interface VendorPayoutsTableProps {
  payouts: VendorPayout[];
  loading: boolean;
}

export default function VendorPayoutsTable({ payouts, loading }: VendorPayoutsTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'pending':
        return '⏸️';
      case 'failed':
        return '❌';
      default:
        return '⏸️';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payouts ({payouts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payouts found</p>
            <p className="text-sm">Payouts will appear here when payments are processed</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-mono text-sm">
                    {payout.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(payout.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(payout.status)}>
                      <span className="mr-1">{getStatusIcon(payout.status)}</span>
                      {payout.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payout.payout_date 
                      ? new Date(payout.payout_date).toLocaleDateString()
                      : new Date(payout.created_at).toLocaleDateString()
                    }
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {payout.reference || 'N/A'}
                      {payout.transaction_id && (
                        <div className="text-muted-foreground font-mono">
                          {payout.transaction_id.slice(0, 16)}...
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {payout.transaction_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // In a real app, this would link to the payment processor's transaction details
                          console.log('View transaction:', payout.transaction_id);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
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
  );
}