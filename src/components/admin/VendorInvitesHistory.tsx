import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Search, RefreshCw, Send, UserPlus, Mail, 
  CheckCircle, Clock, XCircle, ExternalLink 
} from 'lucide-react';
import { format } from 'date-fns';

interface VendorInvitation {
  id: string;
  email: string;
  company_name: string | null;
  specialties: string[] | null;
  status: string;
  invited_at: string;
  accepted_at: string | null;
}

export default function VendorInvitesHistory() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: invitations = [], isLoading, refetch } = useQuery({
    queryKey: ['vendor-invitations', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('vendor_invitations')
        .select('id, email, company_name, specialties, status, invited_at, accepted_at')
        .order('invited_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as VendorInvitation[];
    }
  });

  const resendMutation = useMutation({
    mutationFn: async (invitation: VendorInvitation) => {
      const mainDomain = 'https://monarchpropertymmgt.com';
      const signupUrl = `${mainDomain}/auth?email=${encodeURIComponent(invitation.email)}&role=vendor&company=${encodeURIComponent(invitation.company_name || '')}&invite=true`;

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: invitation.email,
          subject: `Vendor Network Invitation Reminder - ${invitation.company_name || 'Your Company'}`,
          template: 'vendor-invite',
          data: {
            companyName: invitation.company_name,
            specialties: invitation.specialties,
            signupUrl,
            adminEmail: 'admin@monarchpropertymmgt.com',
            isReminder: true
          }
        }
      });

      if (error) throw error;

      // Update invitation status to show it was resent
      await supabase
        .from('vendor_invitations')
        .update({ 
          status: 'pending',
          invited_at: new Date().toISOString()
        })
        .eq('id', invitation.id);
    },
    onSuccess: () => {
      toast.success('Invitation resent successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-invitations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resend invitation');
    }
  });

  const filteredInvitations = invitations.filter(inv => {
    const matchesSearch = 
      inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'accepted') {
      return <Badge className="bg-success/10 text-success border-success/30"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-warning/10 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Stats
  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Invites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.accepted}</div>
            <p className="text-sm text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Vendor Invitations
              </CardTitle>
              <CardDescription>
                Track and manage all vendor invitation emails
              </CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Invitations Found</h3>
              <p className="text-muted-foreground">
                {invitations.length === 0 
                  ? 'No vendor invitations have been sent yet.'
                  : 'No invitations match your search criteria.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Accepted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>{invitation.company_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {invitation.specialties?.slice(0, 2).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                        {(invitation.specialties?.length ?? 0) > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(invitation.specialties?.length ?? 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invitation.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invitation.invited_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.accepted_at 
                        ? format(new Date(invitation.accepted_at), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {invitation.status !== 'accepted' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => resendMutation.mutate(invitation)}
                          disabled={resendMutation.isPending}
                        >
                          {resendMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
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
    </div>
  );
}
