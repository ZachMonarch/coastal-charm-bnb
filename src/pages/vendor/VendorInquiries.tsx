import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MessageSquare, Plus, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { formatDistanceToNow } from "date-fns";
import PageHero from "@/components/shared/PageHero";
import { ButtonSpinner } from "@/components/shared/LoadingSpinner";

interface Inquiry {
  id: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

const CATEGORIES = [
  { id: 'project_update_report', label: 'Project Update Report', description: 'Share updates about ongoing projects' },
  { id: 'needs', label: 'Needs', description: 'Request resources or support' },
  { id: 'complaints', label: 'Complaints', description: 'Report issues or concerns' },
  { id: 'support', label: 'Support', description: 'Get help with technical issues' },
  { id: 'assistance', label: 'Assistance', description: 'Request general assistance' },
  { id: 'inquiries', label: 'Inquiries', description: 'General questions' },
  { id: 'other', label: 'Other', description: 'Other topics' },
];

const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"; icon: typeof Clock }> = {
    open: { variant: 'info', icon: Clock },
    in_progress: { variant: 'warning', icon: AlertCircle },
    resolved: { variant: 'success', icon: CheckCircle2 },
    closed: { variant: 'secondary', icon: CheckCircle2 },
  };
  const { variant, icon: Icon } = config[status] || config.open;
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </Badge>
  );
};

export default function VendorInquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  
  const [newInquiry, setNewInquiry] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'normal',
  });

  useEffect(() => {
    if (user?.id) {
      fetchInquiries();
    }
  }, [user?.id]);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_inquiries')
        .select('id, category, subject, message, priority, status, admin_response, responded_at, created_at')
        .eq('vendor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newInquiry.category || !newInquiry.subject || !newInquiry.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('vendor_inquiries')
        .insert({
          vendor_id: user?.id,
          category: newInquiry.category,
          subject: newInquiry.subject,
          message: newInquiry.message,
          priority: newInquiry.priority,
        });

      if (error) throw error;

      toast.success('Inquiry submitted successfully');
      setIsCreateOpen(false);
      setNewInquiry({ category: '', subject: '', message: '', priority: 'normal' });
      fetchInquiries();
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: inquiries.length,
    open: inquiries.filter(i => i.status === 'open').length,
    responded: inquiries.filter(i => i.admin_response).length,
  };

  return (
    <>
      <Helmet>
        <title>Inquiries & Support | Monarch Vendor Portal</title>
        <meta name="description" content="Submit inquiries, support requests, and communicate with Monarch Property Management" />
      </Helmet>

      <div className="space-y-6">
        <PageHero
          title="Inquiries & Support"
          description="Submit inquiries, report issues, or request assistance"
          icon={MessageSquare}
          variant="gradient"
          stats={[
            { label: 'Total Inquiries', value: stats.total, icon: MessageSquare, color: 'info' },
            { label: 'Open', value: stats.open, icon: Clock, color: 'warning' },
            { label: 'Responded', value: stats.responded, icon: CheckCircle2, color: 'success' },
          ]}
          actions={[]}
        />

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({inquiries.length})</TabsTrigger>
            <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
            <TabsTrigger value="responded">Responded ({stats.responded})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {renderInquiryList(inquiries)}
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            {renderInquiryList(inquiries.filter(i => i.status === 'open'))}
          </TabsContent>

          <TabsContent value="responded" className="space-y-4">
            {renderInquiryList(inquiries.filter(i => i.admin_response))}
          </TabsContent>
        </Tabs>

        {/* Create Inquiry Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit New Inquiry</DialogTitle>
              <DialogDescription>
                Choose a category and describe your inquiry in detail
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newInquiry.category}
                  onValueChange={(v) => setNewInquiry(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div>
                          <p>{cat.label}</p>
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  placeholder="Brief description of your inquiry"
                  value={newInquiry.subject}
                  onChange={(e) => setNewInquiry(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  placeholder="Provide detailed information about your inquiry..."
                  rows={5}
                  value={newInquiry.message}
                  onChange={(e) => setNewInquiry(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newInquiry.priority}
                  onValueChange={(v) => setNewInquiry(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Inquiry
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Inquiry Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedInquiry?.subject}</DialogTitle>
              <DialogDescription>
                {selectedInquiry?.category.replace('_', ' ')} • {selectedInquiry?.created_at && formatDistanceToNow(new Date(selectedInquiry.created_at), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>

            {selectedInquiry && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {getStatusBadge(selectedInquiry.status)}
                  <Badge variant="outline">{selectedInquiry.priority}</Badge>
                </div>

                <div className="space-y-2">
                  <Label>Your Message</Label>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">
                    {selectedInquiry.message}
                  </div>
                </div>

                {selectedInquiry.admin_response && (
                  <div className="space-y-2">
                    <Label>Admin Response</Label>
                    <div className="p-3 bg-primary/10 rounded-lg text-sm border-l-2 border-primary">
                      {selectedInquiry.admin_response}
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedInquiry.responded_at && formatDistanceToNow(new Date(selectedInquiry.responded_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );

  function renderInquiryList(items: Inquiry[]) {
    if (loading) {
      return (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/50 rounded-lg" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No inquiries found</p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Submit Your First Inquiry
            </Button>
          </CardContent>
        </Card>
      );
    }

    return items.map((inquiry) => (
      <Card 
        key={inquiry.id} 
        className="hover:border-primary/30 transition-colors cursor-pointer"
        onClick={() => setSelectedInquiry(inquiry)}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold truncate">{inquiry.subject}</h4>
                {inquiry.admin_response && (
                  <Badge variant="success" className="text-xs">Responded</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {inquiry.message}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline">{inquiry.category.replace('_', ' ')}</Badge>
                <span>{formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(inquiry.status)}
              <Badge variant={inquiry.priority === 'urgent' ? 'destructive' : inquiry.priority === 'high' ? 'warning' : 'outline'}>
                {inquiry.priority}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  }
}
