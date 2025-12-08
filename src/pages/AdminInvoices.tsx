import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Download, Search, Filter, Edit, Trash2, Send, DollarSign, Clock, AlertCircle } from 'lucide-react';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getStatusBadgeClass } from '@/utils/statusBadgeHelper';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import PageHero from '@/components/shared/PageHero';
import StatsCard from '@/components/shared/StatsCard';
interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  status: string;
  due_date: string | null;
  created_at: string;
  description: string | null;
  vendor_id: string | null;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newInvoice, setNewInvoice] = useState({
    vendor_id: '',
    amount: '',
    description: '',
    due_date: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchInvoices(), fetchUsers()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, client_name, client_email, amount, status, due_date, created_at, description, vendor_id')
      .order('created_at', { ascending: false });

    if (data) {
      setInvoices(data);
      
      // Calculate stats
      const paid = data.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
      const pending = data.filter(i => i.status === 'sent' || i.status === 'draft').reduce((sum, i) => sum + i.amount, 0);
      const overdue = data.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
      
      setStats({
        total: data.length,
        paid,
        pending,
        overdue
      });
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name');
    
    setUsers(data || []);
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.vendor_id || !newInvoice.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const user = users.find(u => u.id === newInvoice.vendor_id);
      if (!user) {
        toast.error('User not found');
        return;
      }

      const { error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: generateInvoiceNumber(),
          client_name: user.full_name,
          client_email: user.email,
          amount: parseFloat(newInvoice.amount),
          description: newInvoice.description,
          due_date: newInvoice.due_date || null,
          status: 'sent',
          vendor_id: newInvoice.vendor_id,
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (error) throw error;

      // Send notification
      await supabase.from('notifications').insert({
        user_id: newInvoice.vendor_id,
        title: 'New Invoice',
        message: `You have received a new invoice for $${newInvoice.amount}`,
        type: 'info',
        action_url: user.role === 'vendor' ? '/vendor/payments' : '/payments'
      });

      toast.success('Invoice created and user notified!');
      setShowCreateDialog(false);
      setNewInvoice({ vendor_id: '', amount: '', description: '', due_date: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Invoice deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    return getStatusBadgeClass(status);
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.amount.toString().includes(searchQuery)
  );

  if (loading) {
    return (
      <OptimizedProtectedRoute requiredRole="admin">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </OptimizedProtectedRoute>
    );
  }

  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="primary">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <PageHero
            title="Invoice Management"
            description="Create and manage vendor and tenant invoices"
            icon={FileText}
            variant="gradient"
            actions={[
              { label: 'Create Invoice', href: '#', variant: 'default' },
            ]}
          />

          {/* Create Invoice Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>User *</Label>
                  <Select value={newInvoice.vendor_id} onValueChange={(v) => setNewInvoice({...newInvoice, vendor_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount ($) *</Label>
                  <Input 
                    type="number" 
                    value={newInvoice.amount} 
                    onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})} 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={newInvoice.description} 
                    onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                    placeholder="Invoice description..."
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input 
                    type="date" 
                    value={newInvoice.due_date} 
                    onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateInvoice}>Create Invoice</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Invoices"
              value={stats.total}
              icon={FileText}
              color="info"
            />
            <StatsCard
              title="Paid"
              value={`$${stats.paid.toFixed(2)}`}
              icon={DollarSign}
              color="success"
            />
            <StatsCard
              title="Pending"
              value={`$${stats.pending.toFixed(2)}`}
              icon={Clock}
              color="warning"
            />
            <StatsCard
              title="Overdue"
              value={`$${stats.overdue.toFixed(2)}`}
              icon={AlertCircle}
              color="error"
            />
          </div>

          {/* Search */}
          <Card variant="glass" className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices by number, name, or amount..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice List */}
          <Card variant="interactive" className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                All Invoices
              </CardTitle>
              <CardDescription>
                {filteredInvoices.length} invoices found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id}
                        className="hover:bg-muted/50 transition-colors border-l-2 border-l-transparent hover:border-l-primary"
                      >
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.client_name}</TableCell>
                        <TableCell className="font-semibold text-success">${invoice.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(invoice.status)}>
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice.id)}>
                              <Trash2 className="h-4 w-4" />
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
        </div>
      </EnhancedPageBackground>
    </OptimizedProtectedRoute>
  );
}
