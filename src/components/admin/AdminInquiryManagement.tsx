import { useState, useEffect } from "react";
import { MessageSquare, Search, Filter, CheckCircle2, Clock, AlertCircle, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { formatDistanceToNow } from "date-fns";
import { ButtonSpinner } from "@/components/shared/LoadingSpinner";

interface VendorInquiry {
  id: string;
  vendor_id: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  vendor?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'project_update_report', label: 'Project Update Report' },
  { id: 'needs', label: 'Needs' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'support', label: 'Support' },
  { id: 'assistance', label: 'Assistance' },
  { id: 'inquiries', label: 'Inquiries' },
  { id: 'other', label: 'Other' },
];

const STATUSES = [
  { id: 'all', label: 'All Statuses' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"; icon: typeof Clock }> = {
    open: { variant: 'info', icon: Clock },
    in_progress: { variant: 'warning', icon: AlertCircle },
    resolved: { variant: 'success', icon: CheckCircle2 },
    closed: { variant: 'secondary', icon: CheckCircle2 },
  };
  const config = variants[status] || variants.open;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </Badge>
  );
};

const getPriorityBadge = (priority: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
    low: 'secondary',
    normal: 'outline',
    high: 'warning',
    urgent: 'destructive',
  };
  return <Badge variant={variants[priority] || 'outline'}>{priority}</Badge>;
};

export default function AdminInquiryManagement() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<VendorInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<VendorInquiry | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_inquiries')
        .select(`
          id, vendor_id, category, subject, message, priority, status,
          admin_response, responded_by, responded_at, created_at, updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch vendor profiles for each inquiry
      const vendorIds = [...new Set((data || []).map(i => i.vendor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', vendorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedInquiries = (data || []).map(inquiry => ({
        ...inquiry,
        vendor: profileMap.get(inquiry.vendor_id) || { full_name: 'Unknown', email: '', avatar_url: null }
      }));

      setInquiries(enrichedInquiries);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedInquiry || !responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setResponding(true);
    try {
      const { error } = await supabase
        .from('vendor_inquiries')
        .update({
          admin_response: responseText,
          responded_by: user?.id,
          responded_at: new Date().toISOString(),
          status: newStatus || 'in_progress',
        })
        .eq('id', selectedInquiry.id);

      if (error) throw error;

      // Create notification for vendor
      await supabase.from('notifications').insert({
        user_id: selectedInquiry.vendor_id,
        title: 'Inquiry Response',
        message: `Your inquiry "${selectedInquiry.subject}" has received a response.`,
        type: 'info',
        action_url: '/vendor/inquiries',
      });

      toast.success('Response sent successfully');
      setSelectedInquiry(null);
      setResponseText('');
      setNewStatus('');
      fetchInquiries();
    } catch (error) {
      console.error('Error responding to inquiry:', error);
      toast.error('Failed to send response');
    } finally {
      setResponding(false);
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.vendor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || inquiry.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: inquiries.length,
    open: inquiries.filter(i => i.status === 'open').length,
    inProgress: inquiries.filter(i => i.status === 'in_progress').length,
    resolved: inquiries.filter(i => i.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted/50 rounded-lg" />
        <div className="h-64 bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Inquiries</p>
          </CardContent>
        </Card>
        <Card className="border-info/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-info">{stats.open}</div>
            <p className="text-sm text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className="border-warning/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-success">{stats.resolved}</div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      <div className="space-y-4">
        {filteredInquiries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No inquiries found</p>
            </CardContent>
          </Card>
        ) : (
          filteredInquiries.map((inquiry) => (
            <Card 
              key={inquiry.id} 
              className="hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedInquiry(inquiry);
                setNewStatus(inquiry.status);
              }}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={inquiry.vendor?.avatar_url || ''} />
                    <AvatarFallback>
                      {inquiry.vendor?.full_name?.charAt(0) || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold truncate">{inquiry.subject}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getPriorityBadge(inquiry.priority)}
                        {getStatusBadge(inquiry.status)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      From: {inquiry.vendor?.full_name || 'Unknown'} • {inquiry.vendor?.email}
                    </p>
                    <p className="text-sm line-clamp-2">{inquiry.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Category: {inquiry.category.replace('_', ' ')}</span>
                      <span>{formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}</span>
                      {inquiry.admin_response && (
                        <Badge variant="outline" className="text-xs">Responded</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Inquiry</DialogTitle>
            <DialogDescription>
              {selectedInquiry?.subject}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4">
              {/* Vendor Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedInquiry.vendor?.avatar_url || ''} />
                  <AvatarFallback>
                    {selectedInquiry.vendor?.full_name?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedInquiry.vendor?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedInquiry.vendor?.email}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  {getPriorityBadge(selectedInquiry.priority)}
                  <Badge variant="outline">{selectedInquiry.category.replace('_', ' ')}</Badge>
                </div>
              </div>

              {/* Original Message */}
              <div className="space-y-2">
                <Label>Original Message</Label>
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Previous Response */}
              {selectedInquiry.admin_response && (
                <div className="space-y-2">
                  <Label>Previous Response</Label>
                  <div className="p-3 bg-primary/10 rounded-lg text-sm border-l-2 border-primary">
                    {selectedInquiry.admin_response}
                  </div>
                </div>
              )}

              {/* Response Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Response</Label>
                  <Textarea
                    placeholder="Type your response..."
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={responding || !responseText.trim()}>
              {responding ? (
                <>
                  <ButtonSpinner className="mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
