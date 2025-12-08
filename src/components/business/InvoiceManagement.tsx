import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Download, Eye, Send, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at: string;
  description: string;
  line_items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

export const InvoiceManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    client_name: '',
    client_email: '',
    amount: 0,
    currency: 'USD',
    status: 'draft',
    due_date: '',
    description: '',
    line_items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
  });

  useEffect(() => {
    if (hasPermission('manage_invoices') || hasPermission('*')) {
      fetchInvoices();
    }
  }, [hasPermission]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_name, client_email, amount, currency, status, due_date, created_at, description, line_items')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedInvoices: Invoice[] = (data || []).map((inv: any) => ({
        ...inv,
        status: inv.status as Invoice['status'],
        line_items: (inv.line_items as any[]) || []
      }));

      setInvoices(typedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = String(invoices.length + 1).padStart(3, '0');
    return `INV-${year}-${month}-${sequence}`;
  };

  const calculateLineItemAmount = (quantity: number, rate: number) => {
    return quantity * rate;
  };

  const updateLineItem = (index: number, field: keyof Invoice['line_items'][0], value: any) => {
    const updatedItems = [...(newInvoice.line_items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = calculateLineItemAmount(
        field === 'quantity' ? value : updatedItems[index].quantity,
        field === 'rate' ? value : updatedItems[index].rate
      );
    }
    
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    setNewInvoice({
      ...newInvoice,
      line_items: updatedItems,
      amount: totalAmount
    });
  };

  const addLineItem = () => {
    setNewInvoice({
      ...newInvoice,
      line_items: [
        ...(newInvoice.line_items || []),
        { description: '', quantity: 1, rate: 0, amount: 0 }
      ]
    });
  };

  const removeLineItem = (index: number) => {
    const updatedItems = newInvoice.line_items?.filter((_, i) => i !== index) || [];
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    setNewInvoice({
      ...newInvoice,
      line_items: updatedItems,
      amount: totalAmount
    });
  };

  const createInvoice = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: generateInvoiceNumber(),
          client_name: newInvoice.client_name || '',
          client_email: newInvoice.client_email || '',
          amount: newInvoice.amount || 0,
          currency: newInvoice.currency || 'USD',
          status: newInvoice.status || 'draft',
          due_date: newInvoice.due_date || null,
          description: newInvoice.description || '',
          line_items: newInvoice.line_items || [],
          created_by: userData.user?.id || ''
        });

      if (error) throw error;

      await fetchInvoices();
      setIsCreateDialogOpen(false);
      setNewInvoice({
        client_name: '',
        client_email: '',
        amount: 0,
        currency: 'USD',
        status: 'draft',
        due_date: '',
        description: '',
        line_items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
      });
      toast.success('Invoice created successfully');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  const sendInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId);

      if (error) throw error;

      await fetchInvoices();
      toast.success('Invoice sent successfully');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  const downloadInvoice = (invoice: Invoice) => {
    // In a real implementation, this would generate and download a PDF
    const invoiceData = `
Invoice: ${invoice.invoice_number}
Client: ${invoice.client_name}
Amount: $${invoice.amount}
Due Date: ${invoice.due_date}

Line Items:
${invoice.line_items.map(item => 
  `${item.description} - Qty: ${item.quantity} - Rate: $${item.rate} - Amount: $${item.amount}`
).join('\n')}

Total: $${invoice.amount}
    `;
    
    const blob = new Blob([invoiceData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoice_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'paid': return 'default'; // Using default instead of success
      case 'overdue': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  if (!hasPermission('manage_invoices') && !hasPermission('*')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You don't have permission to access invoice management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-muted-foreground">Create, manage, and track invoices</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Client Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    value={newInvoice.client_name}
                    onChange={(e) => setNewInvoice({...newInvoice, client_name: e.target.value})}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={newInvoice.client_email}
                    onChange={(e) => setNewInvoice({...newInvoice, client_email: e.target.value})}
                    placeholder="Enter client email"
                  />
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={newInvoice.currency} onValueChange={(value) => setNewInvoice({...newInvoice, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                  placeholder="Enter invoice description"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {newInvoice.line_items?.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 p-4 border rounded-lg">
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Service description"
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="1"
                        />
                      </div>
                      <div>
                        <Label>Rate</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={item.amount}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          disabled={newInvoice.line_items?.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="text-right">
                  <Label>Total Amount</Label>
                  <div className="text-2xl font-bold">${newInvoice.amount?.toFixed(2) || '0.00'}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createInvoice}>
                  Create Invoice
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">Loading invoices...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {invoice.amount.toFixed(2)} {invoice.currency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.due_date}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => downloadInvoice(invoice)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button variant="outline" size="sm" onClick={() => sendInvoice(invoice.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
};