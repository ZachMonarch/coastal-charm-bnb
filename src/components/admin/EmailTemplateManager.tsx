import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Mail, Plus, Edit, Trash2, Eye, RefreshCw, Code, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplateManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    is_active: true
  });

  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, html_content, text_content, variables, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailTemplate[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at' | 'variables'>) => {
      const { error } = await supabase
        .from('email_templates')
        .insert(template);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email template created successfully');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...template }: Partial<EmailTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('email_templates')
        .update(template)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email template updated successfully');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email template deleted');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      is_active: true
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      is_active: template.is_active
    });
    setIsDialogOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.subject || !formData.html_content) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (template: EmailTemplate) => {
    updateMutation.mutate({ id: template.id, is_active: !template.is_active });
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
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Templates
              </CardTitle>
              <CardDescription>Manage email templates for system notifications</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Email Templates</h3>
              <p className="text-muted-foreground mb-4">Create your first email template to get started.</p>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{template.subject}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(template.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleActive(template)}
                          className={template.is_active ? 'text-warning' : 'text-success'}
                        >
                          <Switch checked={template.is_active} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteMutation.mutate(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Email Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Welcome to Monarch Property Management"
                />
              </div>
            </div>

            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html" className="gap-2">
                  <Code className="h-4 w-4" />
                  HTML Content
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Plain Text
                </TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="html_content">HTML Content *</Label>
                  <Textarea
                    id="html_content"
                    value={formData.html_content}
                    onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                    placeholder="<html><body><h1>Hello {{name}}</h1></body></html>"
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{variable}}"} syntax for dynamic content. Common variables: {"{{name}}"}, {"{{email}}"}, {"{{company}}"}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="text_content">Plain Text Content (Optional)</Label>
                  <Textarea
                    id="text_content"
                    value={formData.text_content}
                    onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                    placeholder="Hello {{name}}, Welcome to Monarch Property Management..."
                    className="min-h-[300px]"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Template is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {selectedTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{selectedTemplate.subject}</p>
              </div>
              <div className="border rounded-lg p-4 bg-background">
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
