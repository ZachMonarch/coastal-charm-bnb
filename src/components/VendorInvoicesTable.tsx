import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Download, Eye, Edit, Send, FileText, AlertCircle } from 'lucide-react';
import { VendorInvoice } from '@/hooks/useVendorInvoicing';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { getPaymentStatusColor } from '@/utils/themeColors';
import { toast } from 'sonner';

interface VendorInvoicesTableProps {
  invoices: VendorInvoice[];
  loading: boolean;
  onUpdateStatus: (invoiceId: string, status: string) => void;
}

export default function VendorInvoicesTable({ invoices, loading, onUpdateStatus }: VendorInvoicesTableProps) {
  const [confirmSendDialog, setConfirmSendDialog] = useState<{ open: boolean; invoice: VendorInvoice | null }>({ 
    open: false, 
    invoice: null 
  });
  const [isSending, setIsSending] = useState(false);
  const handleDownloadPDF = async (invoice: VendorInvoice) => {
    try {
      await generateInvoicePDF(invoice);
      toast.success('Invoice PDF downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleSendInvoice = async () => {
    if (!confirmSendDialog.invoice) return;
    
    setIsSending(true);
    try {
      // Update status to 'sent'
      await onUpdateStatus(confirmSendDialog.invoice.id, 'sent');
      toast.success(`Invoice ${confirmSendDialog.invoice.invoice_number} sent to ${confirmSendDialog.invoice.client_email}`);
      setConfirmSendDialog({ open: false, invoice: null });
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsSending(false);
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
    <>
      {/* Send Confirmation Dialog */}
      <Dialog open={confirmSendDialog.open} onOpenChange={(open) => !open && setConfirmSendDialog({ open: false, invoice: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Invoice
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to send this invoice?
            </DialogDescription>
          </DialogHeader>
          {confirmSendDialog.invoice && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span className="font-medium">{confirmSendDialog.invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">${Number(confirmSendDialog.invoice.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{confirmSendDialog.invoice.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{confirmSendDialog.invoice.client_email}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-info/10 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-info mt-0.5" />
                <p className="text-muted-foreground">
                  The invoice will be marked as sent. An email notification will be sent to the client.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSendDialog({ open: false, invoice: null })}>
              Cancel
            </Button>
            <Button onClick={handleSendInvoice} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                              onClick={() => setConfirmSendDialog({ open: true, invoice })}
                              title="Send invoice to client"
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
    </>
  );
}