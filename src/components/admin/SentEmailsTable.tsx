import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Search, RefreshCw, Eye, Send, Mail, Filter, 
  CheckCircle, XCircle, Clock, ExternalLink 
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';

interface SentEmail {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  html_content: string;
  template_used: string | null;
  email_type: string;
  status: string;
  sent_at: string;
  resend_count: number;
  error_message: string | null;
  metadata: Record<string, any>;
}

export default function SentEmailsTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedSubject, setEditedSubject] = useState('');

  const { data: emails = [], isLoading, refetch } = useQuery({
    queryKey: ['sent-emails', typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('sent_emails')
        .select('id, recipient_email, recipient_name, subject, html_content, template_used, email_type, status, sent_at, resend_count, error_message, metadata')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (typeFilter !== 'all') {
        query = query.eq('email_type', typeFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SentEmail[];
    }
  });

  const resendMutation = useMutation({
    mutationFn: async ({ email, newSubject, newContent }: { 
      email: SentEmail; 
      newSubject?: string; 
      newContent?: string; 
    }) => {
      // Map email_type to valid schema values
      const validEmailTypes = [
        'notification', 'welcome', 'reset', 'verification', 
        'maintenance', 'payment', 'booking', 'test',
        'vendor_invite', 'vendor_invitation', 'general',
        'rfq_invitation', 'contract_award', 'bid_confirmation'
      ];
      
      const emailType = validEmailTypes.includes(email.email_type) 
        ? email.email_type 
        : 'notification';

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email.recipient_email,
          subject: newSubject || email.subject,
          html: newContent || email.html_content,
          emailType
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email resent successfully');
      queryClient.invalidateQueries({ queryKey: ['sent-emails'] });
      setIsResendOpen(false);
      setSelectedEmail(null);
    },
    onError: (error: any) => {
      console.error('[SentEmailsTable] Resend error:', error);
      const errorMessage = error?.message || 
        error?.context?.message || 
        error?.error?.message ||
        'Failed to resend email. Please try again.';
      toast.error(errorMessage);
    }
  });

  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const handleViewDetails = (email: SentEmail) => {
    setSelectedEmail(email);
    setIsDetailOpen(true);
  };

  const handleResend = (email: SentEmail) => {
    setSelectedEmail(email);
    setEditedSubject(email.subject);
    setEditedContent(email.html_content);
    setIsResendOpen(true);
  };

  const confirmResend = () => {
    if (selectedEmail) {
      resendMutation.mutate({
        email: selectedEmail,
        newSubject: editedSubject !== selectedEmail.subject ? editedSubject : undefined,
        newContent: editedContent !== selectedEmail.html_content ? editedContent : undefined
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-success/10 text-success border-success/30"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'vendor_invite': 'bg-primary/10 text-primary',
      'notification': 'bg-info/10 text-info',
      'payment': 'bg-success/10 text-success',
      'maintenance': 'bg-warning/10 text-warning',
      'general': 'bg-muted text-muted-foreground'
    };
    return (
      <Badge className={colors[type] || colors.general}>
        {type.replace('_', ' ')}
      </Badge>
    );
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Sent Emails
              </CardTitle>
              <CardDescription>
                View and manage all sent emails with resend capability
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
                placeholder="Search by email or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="vendor_invite">Vendor Invite</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredEmails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Emails Found</h3>
              <p className="text-muted-foreground">
                {emails.length === 0 
                  ? 'No emails have been sent yet. Compose a new email to get started.'
                  : 'No emails match your search criteria.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Resends</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{email.recipient_email}</p>
                        {email.recipient_name && (
                          <p className="text-sm text-muted-foreground">{email.recipient_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {email.subject}
                    </TableCell>
                    <TableCell>{getTypeBadge(email.email_type)}</TableCell>
                    <TableCell>{getStatusBadge(email.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(email.sent_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {email.resend_count > 0 && (
                        <Badge variant="secondary">{email.resend_count}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(email)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleResend(email)}>
                          <Send className="h-4 w-4" />
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

      {/* View Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="font-medium">{selectedEmail.recipient_email}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedEmail.status)}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Sent At</p>
                  <p className="font-medium">
                    {format(new Date(selectedEmail.sent_at), 'PPpp')}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <div className="mt-1">{getTypeBadge(selectedEmail.email_type)}</div>
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{selectedEmail.subject}</p>
              </div>

              {selectedEmail.error_message && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                  <p className="text-sm text-destructive font-medium">Error</p>
                  <p className="text-sm">{selectedEmail.error_message}</p>
                </div>
              )}

              <div className="border rounded-lg p-4 bg-background">
                <p className="text-sm text-muted-foreground mb-2">Email Content</p>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(selectedEmail.html_content) 
                  }} 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsDetailOpen(false);
              if (selectedEmail) handleResend(selectedEmail);
            }}>
              <Send className="h-4 w-4 mr-2" />
              Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Dialog */}
      <Dialog open={isResendOpen} onOpenChange={setIsResendOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resend Email</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Recipient</p>
                <p className="font-medium">{selectedEmail.recipient_email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resend-subject">Subject</Label>
                <Input
                  id="resend-subject"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resend-content">HTML Content (editable)</Label>
                <Textarea
                  id="resend-content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResendOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmResend}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Resend Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
