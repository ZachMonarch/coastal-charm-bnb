import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Send, Mail, FileText, Eye, Code, Users, RefreshCw } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  is_active: boolean;
}

interface EmailComposeFormProps {
  onEmailSent?: () => void;
}

export default function EmailComposeForm({ onEmailSent }: EmailComposeFormProps) {
  const [recipientType, setRecipientType] = useState<'individual' | 'vendors' | 'tenants'>('individual');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [emailType, setEmailType] = useState('notification');
  const [previewMode, setPreviewMode] = useState(false);

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, html_content, is_active')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as EmailTemplate[];
    }
  });

  // Fetch vendor emails using RPC function for reliable access
  const { data: vendorEmails = [], isLoading: vendorEmailsLoading, error: vendorEmailsError } = useQuery({
    queryKey: ['vendor-emails-rpc'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vendor_emails');
      
      if (error) {
        console.error('Failed to fetch vendor emails:', error);
        throw error;
      }
      return data?.map((v: { email: string; company_name: string; user_id: string }) => ({
        email: v.email,
        name: v.company_name,
        userId: v.user_id
      })).filter((v: { email: string }) => v.email) || [];
    },
    staleTime: 30000 // Cache for 30 seconds
  });

  // Fetch tenant emails using RPC function for reliable access
  const { data: tenantEmails = [], isLoading: tenantEmailsLoading, error: tenantEmailsError } = useQuery({
    queryKey: ['tenant-emails-rpc'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tenant_emails');
      
      if (error) {
        console.error('Failed to fetch tenant emails:', error);
        throw error;
      }
      return data?.map((t: { email: string; full_name: string; user_id: string }) => ({
        email: t.email,
        name: t.full_name || 'Tenant',
        userId: t.user_id
      })).filter((t: { email: string }) => t.email) || [];
    },
    staleTime: 30000 // Cache for 30 seconds
  });

  const sendMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const results = await Promise.allSettled(
        emails.map(email => 
          supabase.functions.invoke('send-email', {
            body: {
              to: email,
              subject,
              html: htmlContent,
              emailType
            }
          })
        )
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        throw new Error(`${failed} of ${emails.length} emails failed to send`);
      }
      return results.length;
    },
    onSuccess: (count) => {
      toast.success(`Successfully sent ${count} email(s)`);
      resetForm();
      onEmailSent?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send emails');
    }
  });

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'none') {
      setSelectedTemplate('');
      setSubject('');
      setHtmlContent('');
      toast.info('Template cleared');
      return;
    }
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setHtmlContent(template.html_content);
      toast.success(`Template "${template.name}" loaded`);
    } else {
      toast.error('Failed to load template');
    }
  };

  const getRecipientEmails = (): string[] => {
    switch (recipientType) {
      case 'individual':
        return recipientEmail ? [recipientEmail] : [];
      case 'vendors':
        return vendorEmails.map(v => v.email);
      case 'tenants':
        return tenantEmails.map(t => t.email);
      default:
        return [];
    }
  };

  const handleSend = () => {
    const emails = getRecipientEmails();
    if (emails.length === 0) {
      toast.error('Please specify at least one recipient');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!htmlContent.trim()) {
      toast.error('Please enter email content');
      return;
    }

    sendMutation.mutate(emails);
  };

  const resetForm = () => {
    setRecipientEmail('');
    setSelectedTemplate('');
    setSubject('');
    setHtmlContent('');
    setPreviewMode(false);
  };

  const recipientCount = getRecipientEmails().length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Compose Email
        </CardTitle>
        <CardDescription>
          Send emails using templates or custom content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Selection */}
        <div className="space-y-4">
          <Label>Recipient Type</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={recipientType === 'individual' ? 'default' : 'outline'}
              onClick={() => setRecipientType('individual')}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Individual
            </Button>
            <Button
              variant={recipientType === 'vendors' ? 'default' : 'outline'}
              onClick={() => setRecipientType('vendors')}
              className="gap-2"
              disabled={vendorEmailsLoading}
            >
              {vendorEmailsLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              All Vendors ({vendorEmailsLoading ? '...' : vendorEmails.length})
            </Button>
            <Button
              variant={recipientType === 'tenants' ? 'default' : 'outline'}
              onClick={() => setRecipientType('tenants')}
              className="gap-2"
              disabled={tenantEmailsLoading}
            >
              {tenantEmailsLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              All Tenants ({tenantEmailsLoading ? '...' : tenantEmails.length})
            </Button>
          </div>

          {/* Error displays for RPC failures */}
          {vendorEmailsError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">
                Failed to load vendor emails. Please refresh or try again.
              </p>
            </div>
          )}

          {tenantEmailsError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">
                Failed to load tenant emails. Please refresh or try again.
              </p>
            </div>
          )}

          {recipientType === 'individual' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
              
              {vendorEmailsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading vendors...
                </div>
              ) : vendorEmails.length > 0 ? (
                <div className="space-y-2">
                  <Label>Or select a vendor</Label>
                  <Select value={recipientEmail} onValueChange={setRecipientEmail}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorEmails.map((v) => (
                        <SelectItem key={v.email} value={v.email}>
                          {v.name} ({v.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm text-warning">
                    No vendors with email addresses found. Invite vendors first.
                  </p>
                </div>
              )}
            </div>
          )}

          {recipientType === 'vendors' && vendorEmails.length === 0 && !vendorEmailsLoading && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-sm text-warning">
                No vendors with email addresses found. Invite vendors first.
              </p>
            </div>
          )}

          {recipientType === 'tenants' && tenantEmails.length === 0 && !tenantEmailsLoading && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-sm text-warning">
                No tenants with email addresses found.
              </p>
            </div>
          )}

          {recipientType !== 'individual' && recipientCount > 0 && (
            <div className="p-3 bg-info/10 border border-info/30 rounded-lg">
              <p className="text-sm text-info">
                This email will be sent to {recipientCount} {recipientType === 'vendors' ? 'vendors' : 'tenants'}
              </p>
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Use Template (Optional)</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <FileText className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No template</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Email Type */}
        <div className="space-y-2">
          <Label>Email Type</Label>
          <Select value={emailType} onValueChange={setEmailType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="vendor_invite">Vendor Invite</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
          />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="edit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="edit" className="gap-2">
              <Code className="h-4 w-4" />
              Edit HTML
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <div className="space-y-2">
              <Label htmlFor="html-content">HTML Content *</Label>
              <Textarea
                id="html-content"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<html><body><h1>Hello!</h1><p>Your email content here...</p></body></html>"
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{variable}}"} syntax for dynamic content. Common variables: {"{{name}}"}, {"{{email}}"}, {"{{company}}"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-lg p-4 bg-background min-h-[300px]">
              {htmlContent ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(htmlContent) 
                  }} 
                />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p>Enter HTML content to see preview</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={resetForm}>
            Clear
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || recipientCount === 0 || !subject || !htmlContent}
            >
              {sendMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send {recipientCount > 1 ? `to ${recipientCount} recipients` : 'Email'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
