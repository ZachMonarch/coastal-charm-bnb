import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Newspaper, RefreshCw, Search, Download, Mail, Users, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import StatsCard from '@/components/shared/StatsCard';

interface NewsletterSubscription {
  id: string;
  email: string;
  subscription_type: string | null;
  categories: string[] | null;
  is_active: boolean;
  confirmed_at: string | null;
  created_at: string;
  user_id: string | null;
}

export default function NewsletterManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: subscriptions = [], isLoading, refetch } = useQuery({
    queryKey: ['newsletter-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('id, email, subscription_type, categories, is_active, confirmed_at, created_at, user_id')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as NewsletterSubscription[];
    }
  });

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && sub.is_active) ||
      (statusFilter === 'inactive' && !sub.is_active) ||
      (statusFilter === 'confirmed' && sub.confirmed_at) ||
      (statusFilter === 'unconfirmed' && !sub.confirmed_at);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.is_active).length,
    confirmed: subscriptions.filter(s => s.confirmed_at).length,
    unconfirmed: subscriptions.filter(s => !s.confirmed_at).length
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Type', 'Categories', 'Active', 'Confirmed', 'Created At'];
    const rows = filteredSubscriptions.map(sub => [
      sub.email,
      sub.subscription_type || 'weekly',
      (sub.categories || []).join('; '),
      sub.is_active ? 'Yes' : 'No',
      sub.confirmed_at ? 'Yes' : 'No',
      new Date(sub.created_at).toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Subscribers exported to CSV');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Subscribers"
          value={stats.total}
          icon={Users}
          color="info"
        />
        <StatsCard
          title="Active"
          value={stats.active}
          icon={CheckCircle}
          color="success"
        />
        <StatsCard
          title="Confirmed"
          value={stats.confirmed}
          icon={Mail}
          color="primary"
        />
        <StatsCard
          title="Unconfirmed"
          value={stats.unconfirmed}
          icon={XCircle}
          color="warning"
        />
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                Newsletter Subscribers
              </CardTitle>
              <CardDescription>Manage newsletter subscriptions and export subscriber lists</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscribers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Subscribers Found</h3>
              <p className="text-muted-foreground">
                {subscriptions.length === 0 
                  ? 'No one has subscribed to the newsletter yet.'
                  : 'No subscribers match your current filters.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead>Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sub.subscription_type || 'weekly'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(sub.categories || ['all']).slice(0, 2).map((cat, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {(sub.categories || []).length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(sub.categories || []).length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.confirmed_at ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
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
