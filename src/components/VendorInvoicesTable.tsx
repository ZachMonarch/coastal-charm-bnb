import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, Edit, Send, FileText } from 'lucide-react';
import { VendorInvoice } from '@/hooks/useVendorInvoicing';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { getPaymentStatusColor } from '@/utils/themeColors';

interface VendorInvoicesTableProps {
  invoices: VendorInvoice[];
  loading: boolean;
  onUpdateStatus: (invoiceId: string, status: string) => void;
}

export default function VendorInvoicesTable({ invoices, loading, onUpdateStatus }: VendorInvoicesTableProps) {
  // Status color function removed - using imported utility

  const handleDownloadPDF = async (invoice: VendorInvoice) => {
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices
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
          <FileText className="h-5 w-5" />
          Invoices ({invoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No invoices found</p>
            <p className="text-sm">Generate invoices from completed milestones</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Project/Milestone</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {invoice.project?.title || 'Unknown Project'}
                      </div>
                      {invoice.milestone && (
                        <div className="text-sm text-muted-foreground">
                          {invoice.milestone.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(invoice.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {invoice.status === 'draft' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateStatus(invoice.id, 'sent')}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
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