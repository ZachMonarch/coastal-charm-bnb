import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, FileText, Users, Plus, Trash2, Send, Calendar, Building2, Loader2, Copy, Download, Image, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import logger from '@/utils/logger';
import { RFQ_CATEGORIES } from '@/lib/rfqCategories';

interface UnitConfig {
  unit_type: string;
  quantity: number;
  typical_size: string;
  capacity: string;
}

interface PaymentMilestone {
  milestone: number;
  payment_percent: number;
  condition: string;
}

interface RFQFormData {
  title: string;
  description: string;
  category: string;
  deadline: string;
  expected_duration: string;
  status: string;
  property_id: number | null;
  document_control: {
    rfq_reference: string;
    document_title: string;
    project_name: string;
    project_address: string;
    issuer: string;
    issue_date: string;
    document_status: string;
    project_email: string;
    support_email: string;
  };
  executive_summary: {
    building_overview: string;
    project_scope: string;
    design_intent: string;
  };
  building_details: {
    building_type: string;
    floors: number;
    total_area: string;
    residential_units: number;
    common_areas: string;
    parking_spaces: string;
    fire_protection: string;
  };
  system_strategy: {
    system_type: string;
    prohibited_systems: string[];
    rationale: string;
    design_finality: string;
  };
  unit_configuration: UnitConfig[];
  technical_specs: {
    residential_load: string;
    common_area_load: string;
    total_load: string;
    boq_items: Array<{ item: string; quantity: string; unit: string; notes?: string }>;
  };
  commercial_framework: {
    payment_milestones: PaymentMilestone[];
    maintenance_terms: string;
    emergency_terms: string;
  };
  codes_compliance: string[];
  staffing_requirements: {
    team_size: string;
    certifications: string[];
    suggested_roles: string[];
  };
  budget_guidance: {
    installation_min: number;
    installation_max: number;
    maintenance_min: number;
    maintenance_max: number;
    emergency_min: number;
    emergency_max: number;
    contingency_percent: string;
  };
}

const defaultFormData: RFQFormData = {
  title: '',
  description: '',
  category: '',
  deadline: '',
  expected_duration: '8-12 months',
  status: 'draft',
  property_id: null,
  document_control: {
    rfq_reference: '',
    document_title: '',
    project_name: '',
    project_address: '',
    issuer: 'Monarch Property Management',
    issue_date: new Date().toISOString().split('T')[0],
    document_status: 'Issued for Quotation (IFQ)',
    project_email: 'projects@monarchpropertymmgt.online',
    support_email: 'support@monarchpropertymmgt.online',
  },
  executive_summary: {
    building_overview: '',
    project_scope: '',
    design_intent: '',
  },
  building_details: {
    building_type: 'Residential Condominium',
    floors: 0,
    total_area: '',
    residential_units: 0,
    common_areas: '',
    parking_spaces: '',
    fire_protection: '',
  },
  system_strategy: {
    system_type: '',
    prohibited_systems: [],
    rationale: '',
    design_finality: '',
  },
  unit_configuration: [],
  technical_specs: {
    residential_load: '',
    common_area_load: '',
    total_load: '',
    boq_items: [],
  },
  commercial_framework: {
    payment_milestones: [
      { milestone: 1, payment_percent: 30, condition: 'Upon contract signing & submittal approval' },
      { milestone: 2, payment_percent: 40, condition: 'Upon equipment delivery and verified inventory' },
      { milestone: 3, payment_percent: 30, condition: 'Upon substantial completion, commissioning, TAB' },
    ],
    maintenance_terms: '',
    emergency_terms: '',
  },
  codes_compliance: [],
  staffing_requirements: {
    team_size: '',
    certifications: [],
    suggested_roles: [],
  },
  budget_guidance: {
    installation_min: 0,
    installation_max: 0,
    maintenance_min: 0,
    maintenance_max: 0,
    emergency_min: 0,
    emergency_max: 0,
    contingency_percent: '10-15%',
  },
};

export default function RFQEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';
  
  const [formData, setFormData] = useState<RFQFormData>(defaultFormData);
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [uploadDocType, setUploadDocType] = useState('specification');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<string>('');
  const autoSaveTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);

  // Fetch existing RFQ if editing
  const { data: rfqData, isLoading: rfqLoading } = useQuery({
    queryKey: ['rfq-edit', id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from('rfqs')
        .select(`
          id, title, description, category, deadline, expected_duration, status, property_id, created_at, updated_at,
          document_control, executive_summary, building_details, system_strategy, unit_configuration,
          technical_specs, commercial_framework, codes_compliance, staffing_requirements, budget_guidance,
          rfq_documents(id, file_name, file_path, file_url, file_size, mime_type, document_type, category_badge, is_required_for_bidding, created_at),
          properties(title, address)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== 'new',
  });

  // Fetch vendors for invitation
  const { data: vendors } = useQuery({
    queryKey: ['vendors-for-invite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('user_id, company_name, specialties, rating')
        .eq('is_verified', true)
        .order('rating', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch properties for selection (using safe view for RLS compliance)
  const { data: properties } = useQuery({
    queryKey: ['properties-for-rfq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('safe_property_listings')
        .select('id, title, address, city, state')
        .order('title');
      if (error) throw error;
      return data || [];
    },
  });

  // Load RFQ data into form
  useEffect(() => {
    if (rfqData) {
      setFormData({
        title: rfqData.title || '',
        description: rfqData.description || '',
        category: rfqData.category || '',
        deadline: rfqData.deadline?.split('T')[0] || '',
        expected_duration: rfqData.expected_duration || '8-12 months',
        status: rfqData.status || 'draft',
        property_id: rfqData.property_id,
        document_control: (rfqData.document_control as any) || defaultFormData.document_control,
        executive_summary: (rfqData.executive_summary as any) || defaultFormData.executive_summary,
        building_details: (rfqData.building_details as any) || defaultFormData.building_details,
        system_strategy: (rfqData.system_strategy as any) || defaultFormData.system_strategy,
        unit_configuration: (rfqData.unit_configuration as any) || [],
        technical_specs: (rfqData.technical_specs as any) || defaultFormData.technical_specs,
        commercial_framework: (rfqData.commercial_framework as any) || defaultFormData.commercial_framework,
        codes_compliance: (rfqData.codes_compliance as any) || defaultFormData.codes_compliance,
        staffing_requirements: (rfqData.staffing_requirements as any) || defaultFormData.staffing_requirements,
        budget_guidance: (rfqData.budget_guidance as any) || defaultFormData.budget_guidance,
      });
      setUploadedDocs(rfqData.rfq_documents || []);
    }
  }, [rfqData]);

  // Save RFQ mutation
  const saveMutation = useMutation({
    mutationFn: async (data: RFQFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rfqPayload: any = {
        title: data.title,
        description: data.description,
        category: data.category,
        deadline: data.deadline,
        expected_duration: data.expected_duration,
        status: data.status,
        property_id: data.property_id,
        document_control: data.document_control,
        executive_summary: data.executive_summary,
        building_details: data.building_details,
        system_strategy: data.system_strategy,
        unit_configuration: data.unit_configuration,
        technical_specs: data.technical_specs,
        commercial_framework: data.commercial_framework,
        codes_compliance: data.codes_compliance,
        staffing_requirements: data.staffing_requirements,
        budget_guidance: data.budget_guidance,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { data: tenantData } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        rfqPayload.created_by = user.id;
        rfqPayload.tenant_id = tenantData?.tenant_id || user.id;

        const { data: newRfq, error } = await supabase
          .from('rfqs')
          .insert(rfqPayload)
          .select()
          .single();
        if (error) throw error;
        return newRfq;
      } else {
        const { data: updatedRfq, error } = await supabase
          .from('rfqs')
          .update(rfqPayload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return updatedRfq;
      }
    },
    onSuccess: (data) => {
      toast.success(isNew ? 'RFQ created successfully' : 'RFQ saved');
      setHasUnsavedChanges(false);
      setLastSavedData(JSON.stringify(formData));
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      if (isNew) {
        navigate(`/admin/rfq/${data.id}/edit`);
      }
    },
    onError: (error: any) => {
      logger.error('Error saving RFQ:', error);
      toast.error(error?.message || 'Failed to save RFQ');
    },
  });

  // Document upload handler with improved error handling
  const handleDocumentUpload = async (files: FileList | null) => {
    if (!files || !id || isNew) {
      toast.error('Please save the RFQ first before uploading documents');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const file of Array.from(files)) {
      try {
        const filePath = `${id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('rfq-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          logger.error(`Upload error for ${file.name}:`, uploadError);
          if (uploadError.message?.includes('not authorized') || uploadError.message?.includes('permission')) {
            toast.error(`Permission denied. Please verify your account is properly authenticated.`);
          } else {
            toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }
          failCount++;
          continue;
        }

        // Use signed URL for private buckets instead of public URL
        const { data: signedData } = await supabase.storage
          .from('rfq-documents')
          .createSignedUrl(filePath, 86400); // 24 hour expiry for display

        const docTypeBadgeMap: Record<string, string> = {
          specification: 'Specification',
          blueprint: 'Blueprint',
          floor_plan: 'Floor Plan',
          mep_design: 'MEP Design',
          property_photo: 'Property Photo',
          other: 'Document',
        };

        const { error: insertError } = await supabase.from('rfq_documents').insert({
          rfq_id: id,
          file_name: file.name,
          file_path: filePath,
          file_url: signedData?.signedUrl || null,
          file_size: file.size,
          mime_type: file.type,
          document_type: uploadDocType,
          category_badge: docTypeBadgeMap[uploadDocType] || 'Document',
        });

        if (insertError) {
          logger.error(`Database insert error for ${file.name}:`, insertError);
          toast.error(`Failed to save ${file.name} metadata`);
          failCount++;
          continue;
        }

        successCount++;
      } catch (error: any) {
        logger.error(`Unexpected error uploading ${file.name}:`, error);
        toast.error(`Error uploading ${file.name}`);
        failCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['rfq-edit', id] });
    
    if (successCount > 0) {
      toast.success(`${successCount} document(s) uploaded successfully`);
    }
    if (failCount > 0) {
      toast.warning(`${failCount} document(s) failed to upload`);
    }
  };

  // Invite vendors mutation
  const inviteVendorsMutation = useMutation({
    mutationFn: async (vendorIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) throw new Error('Invalid state');

      const invites = vendorIds.map(vendorId => ({
        rfq_id: id,
        vendor_id: vendorId,
        invited_by: user.id,
        status: 'pending',
      }));

      const { error } = await supabase.from('rfq_invites').insert(invites);
      if (error) throw error;

      // Send invitation emails
      for (const vendorId of vendorIds) {
        await supabase.functions.invoke('send-rfq-invitation', {
          body: { rfq_id: id, vendor_id: vendorId },
        });
      }

      return vendorIds.length;
    },
    onSuccess: (count) => {
      toast.success(`Invited ${count} vendor(s) successfully`);
      setInviteDialogOpen(false);
      setSelectedVendors([]);
    },
    onError: (error: any) => {
      logger.error('Error inviting vendors:', error);
      toast.error(error?.message || 'Failed to invite vendors');
    },
  });

  const updateField = (section: keyof RFQFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && !Array.isArray(prev[section])
        ? { ...(prev[section] as object), [field]: value }
        : value,
    }));
  };

  const addUnitConfig = () => {
    setFormData(prev => ({
      ...prev,
      unit_configuration: [...prev.unit_configuration, { unit_type: '', quantity: 0, typical_size: '', capacity: '' }],
    }));
  };

  const removeUnitConfig = (index: number) => {
    setFormData(prev => ({
      ...prev,
      unit_configuration: prev.unit_configuration.filter((_, i) => i !== index),
    }));
  };

  // JSON Template Export
  const handleExportTemplate = () => {
    const { title, description, category, deadline, expected_duration, status, property_id, ...templateFields } = formData;
    const templateData = {
      title, description, category, expected_duration,
      ...templateFields,
    };
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfq-template-${formData.document_control.rfq_reference || 'new'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template exported successfully');
  };

  // JSON Template Import
  const handleImportTemplate = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setFormData(prev => ({
          ...prev,
          title: imported.title || prev.title,
          description: imported.description || prev.description,
          category: imported.category || prev.category,
          expected_duration: imported.expected_duration || prev.expected_duration,
          document_control: { ...prev.document_control, ...(imported.document_control || {}) },
          executive_summary: { ...prev.executive_summary, ...(imported.executive_summary || {}) },
          building_details: { ...prev.building_details, ...(imported.building_details || {}) },
          system_strategy: { ...prev.system_strategy, ...(imported.system_strategy || {}) },
          unit_configuration: imported.unit_configuration || prev.unit_configuration,
          technical_specs: { ...prev.technical_specs, ...(imported.technical_specs || {}) },
          commercial_framework: { ...prev.commercial_framework, ...(imported.commercial_framework || {}) },
          codes_compliance: imported.codes_compliance || prev.codes_compliance,
          staffing_requirements: { ...prev.staffing_requirements, ...(imported.staffing_requirements || {}) },
          budget_guidance: { ...prev.budget_guidance, ...(imported.budget_guidance || {}) },
        }));
        toast.success('Template imported — review fields and save');
      } catch {
        toast.error('Invalid JSON template file');
      }
    };
    reader.readAsText(file);
  };

  // CSV/XLSX Template Import
  const handleImportCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as Array<Record<string, string>>;
          // Support two formats:
          // 1) Key-value: columns "field_name" and "value"
          // 2) Flat columns matching form fields directly
          const hasKeyValue = rows.length > 0 && 'field_name' in rows[0] && 'value' in rows[0];

          if (hasKeyValue) {
            const mapped: Record<string, string> = {};
            rows.forEach(row => {
              if (row.field_name && row.value) mapped[row.field_name.trim()] = row.value.trim();
            });
            setFormData(prev => ({
              ...prev,
              title: mapped.title || prev.title,
              description: mapped.description || prev.description,
              category: mapped.category || prev.category,
              expected_duration: mapped.expected_duration || prev.expected_duration,
              document_control: {
                ...prev.document_control,
                rfq_reference: mapped.rfq_reference || prev.document_control.rfq_reference,
                document_title: mapped.document_title || prev.document_control.document_title,
                project_name: mapped.project_name || prev.document_control.project_name,
                project_address: mapped.project_address || prev.document_control.project_address,
              },
              executive_summary: {
                ...prev.executive_summary,
                building_overview: mapped.building_overview || prev.executive_summary.building_overview,
                project_scope: mapped.project_scope || prev.executive_summary.project_scope,
              },
              building_details: {
                ...prev.building_details,
                building_type: mapped.building_type || prev.building_details.building_type,
                floors: mapped.floors ? parseInt(mapped.floors) : prev.building_details.floors,
                total_area: mapped.total_area || prev.building_details.total_area,
                residential_units: mapped.residential_units ? parseInt(mapped.residential_units) : prev.building_details.residential_units,
              },
              codes_compliance: mapped.codes_compliance
                ? mapped.codes_compliance.split(',').map(s => s.trim()).filter(Boolean)
                : prev.codes_compliance,
            }));
          } else {
            // Flat format: try to use as unit_configuration rows
            const units: UnitConfig[] = rows
              .filter(r => r.unit_type)
              .map(r => ({
                unit_type: r.unit_type || '',
                quantity: parseInt(r.quantity) || 0,
                typical_size: r.typical_size || '',
                capacity: r.capacity || '',
              }));
            if (units.length > 0) {
              setFormData(prev => ({ ...prev, unit_configuration: units }));
              toast.success(`Imported ${units.length} unit configuration rows`);
              return;
            }
          }
          toast.success('CSV template imported — review fields and save');
        } catch {
          toast.error('Failed to parse CSV file');
        }
      },
      error: () => toast.error('Failed to read CSV file'),
    });
  };

  // Export CSV template
  const handleExportCSVTemplate = () => {
    const fields = [
      ['field_name', 'value', 'description'],
      ['title', '', 'RFQ project title'],
      ['description', '', 'Detailed project description'],
      ['category', '', 'Service category (e.g. hvac, painting, plumbing, electrical)'],
      ['expected_duration', '', 'e.g. 8-12 months'],
      ['rfq_reference', '', 'Reference number e.g. MPM-2025-01'],
      ['document_title', '', 'Document title'],
      ['project_name', '', 'Project name'],
      ['project_address', '', 'Full project address'],
      ['building_overview', '', 'Building overview description'],
      ['project_scope', '', 'Scope of work description'],
      ['building_type', '', 'e.g. Residential Condominium'],
      ['floors', '', 'Number of floors'],
      ['total_area', '', 'Total area in SF'],
      ['residential_units', '', 'Number of units'],
      ['codes_compliance', '', 'Comma-separated compliance codes'],
    ];
    const csv = fields.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rfq-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV template downloaded');
  };

  // Track unsaved changes
  useEffect(() => {
    const currentData = JSON.stringify(formData);
    if (lastSavedData && currentData !== lastSavedData) {
      setHasUnsavedChanges(true);
    }
  }, [formData, lastSavedData]);

  // Auto-save draft after 30s of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges || isNew || formData.status !== 'draft') return;
    const timer = setTimeout(() => {
      saveMutation.mutate(formData);
    }, 30000);
    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges, isNew]);

  // Set initial saved data snapshot
  useEffect(() => {
    if (rfqData) {
      setLastSavedData(JSON.stringify(formData));
    }
  }, [rfqData]);

  const handleCopyLink = () => {
    if (!id || isNew) return;
    const url = `${window.location.origin}/admin/rfq/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('RFQ link copied to clipboard');
  };

  const handleCopyVendorLink = () => {
    if (!id || isNew) return;
    const url = `${window.location.origin}/vendor/rfq/${id}/details`;
    navigator.clipboard.writeText(url);
    toast.success('Shareable vendor link copied to clipboard');
  };

  if (rfqLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <EnhancedPageBackground pattern="dots" gradient="mesh" primaryColor="primary" intensity="subtle">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/rfq')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to RFQs
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{isNew ? 'Create New RFQ' : 'Edit RFQ'}</h1>
                <p className="text-muted-foreground">
                  {isNew ? 'Create a detailed RFQ with all specifications' : `Editing: ${formData.title}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!isNew && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyVendorLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Share to Vendor
                  </Button>
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Invite Vendors
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Invite Vendors to RFQ</DialogTitle>
                        <DialogDescription>
                          Select verified vendors to invite to submit bids for this RFQ.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="max-h-96 overflow-y-auto">
                          {vendors?.map((vendor: any) => (
                            <div key={vendor.user_id} className="flex items-center justify-between p-3 border-b">
                              <div>
                                <p className="font-medium">{vendor.company_name}</p>
                                <p className="text-sm text-muted-foreground">{Array.isArray(vendor.specialties) ? vendor.specialties.join(', ') : 'General'}</p>
                              </div>
                              <Checkbox
                                checked={selectedVendors.includes(vendor.user_id)}
                                onCheckedChange={(checked) => {
                                  setSelectedVendors(prev =>
                                    checked === true
                                      ? [...prev, vendor.user_id]
                                      : prev.filter((vid: string) => vid !== vendor.user_id)
                                  );
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full"
                          disabled={selectedVendors.length === 0 || inviteVendorsMutation.isPending}
                          onClick={() => inviteVendorsMutation.mutate(selectedVendors)}
                        >
                          {inviteVendorsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send Invitations ({selectedVendors.length})
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save RFQ
              </Button>
            </div>
          </div>

          {/* Main Form */}
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="document-control">Document Control</TabsTrigger>
              <TabsTrigger value="executive">Executive Summary</TabsTrigger>
              <TabsTrigger value="building">Building Details</TabsTrigger>
              <TabsTrigger value="system">System Strategy</TabsTrigger>
              <TabsTrigger value="units">Unit Configuration</TabsTrigger>
              <TabsTrigger value="technical">Technical Specs</TabsTrigger>
              <TabsTrigger value="commercial">Commercial Framework</TabsTrigger>
              <TabsTrigger value="compliance">Codes & Compliance</TabsTrigger>
              <TabsTrigger value="budget">Budget Guidance</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Core RFQ details and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">RFQ Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Project Title, Scope of Work..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {RFQ_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Submission Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Expected Duration</Label>
                      <Input
                        id="duration"
                        value={formData.expected_duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, expected_duration: e.target.value }))}
                        placeholder="8-12 months"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="open">Open for Bids</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="awarded">Awarded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="property">Property</Label>
                      <Select
                        value={formData.property_id?.toString() || 'none'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, property_id: value && value !== 'none' ? parseInt(value) : null }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No property linked</SelectItem>
                          {properties?.map((prop) => (
                            <SelectItem key={prop.id} value={prop.id.toString()}>
                              {prop.title} - {prop.city}, {prop.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="project_address">Project Address</Label>
                      <Input
                        id="project_address"
                        value={formData.document_control.project_address}
                        onChange={(e) => updateField('document_control', 'project_address', e.target.value)}
                        placeholder="1312 East Broad Street, Columbus, OH 43203"
                      />
                      <p className="text-xs text-muted-foreground">Enter address manually — no property link required</p>
                    </div>
                  </div>
                  {/* JSON Template Import/Export */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <input
                      type="file"
                      id="json-import"
                      className="hidden"
                      accept=".json"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImportTemplate(e.target.files[0]);
                        e.target.value = '';
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('json-import')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import JSON Template
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Template
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Detailed RFQ description..."
                      minHeight="150px"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Document Control Tab */}
            <TabsContent value="document-control">
              <Card>
                <CardHeader>
                  <CardTitle>Document Control & Project Identification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>RFQ Reference Number</Label>
                      <Input
                        value={formData.document_control.rfq_reference}
                        onChange={(e) => updateField('document_control', 'rfq_reference', e.target.value)}
                        placeholder="MPM-HVAC-2025-01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Document Title</Label>
                      <Input
                        value={formData.document_control.document_title}
                        onChange={(e) => updateField('document_control', 'document_title', e.target.value)}
                        placeholder="HVAC Master Information Package"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        value={formData.document_control.project_name}
                        onChange={(e) => updateField('document_control', 'project_name', e.target.value)}
                        placeholder="The Broadwin Condominium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Address</Label>
                      <Input
                        value={formData.document_control.project_address}
                        onChange={(e) => updateField('document_control', 'project_address', e.target.value)}
                        placeholder="1312 East Broad Street, Columbus, OH 43203"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issue Date</Label>
                      <Input
                        type="date"
                        value={formData.document_control.issue_date}
                        onChange={(e) => updateField('document_control', 'issue_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Document Status</Label>
                      <Input
                        value={formData.document_control.document_status}
                        onChange={(e) => updateField('document_control', 'document_status', e.target.value)}
                        placeholder="Issued for Quotation (IFQ)"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Executive Summary Tab */}
            <TabsContent value="executive">
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Building Overview</Label>
                    <RichTextEditor
                      value={formData.executive_summary.building_overview}
                      onChange={(value) => updateField('executive_summary', 'building_overview', value)}
                      placeholder="8-story residential condominium with 42 units..."
                      minHeight="120px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project Scope</Label>
                    <RichTextEditor
                      value={formData.executive_summary.project_scope}
                      onChange={(value) => updateField('executive_summary', 'project_scope', value)}
                      placeholder="Turnkey HVAC system installation, commissioning, maintenance..."
                      minHeight="120px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Design Intent</Label>
                    <RichTextEditor
                      value={formData.executive_summary.design_intent}
                      onChange={(value) => updateField('executive_summary', 'design_intent', value)}
                      placeholder="Low ambiguity, minimal redesign risk, rapid execution..."
                      minHeight="100px"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Building Details Tab */}
            <TabsContent value="building">
              <Card>
                <CardHeader>
                  <CardTitle>Building Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Building Type</Label>
                      <Input
                        value={formData.building_details.building_type}
                        onChange={(e) => updateField('building_details', 'building_type', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Floors</Label>
                      <Input
                        type="number"
                        value={formData.building_details.floors}
                        onChange={(e) => updateField('building_details', 'floors', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Area (SF)</Label>
                      <Input
                        value={formData.building_details.total_area}
                        onChange={(e) => updateField('building_details', 'total_area', e.target.value)}
                        placeholder="~52,348 SF"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Residential Units</Label>
                      <Input
                        type="number"
                        value={formData.building_details.residential_units}
                        onChange={(e) => updateField('building_details', 'residential_units', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Common Areas</Label>
                      <Input
                        value={formData.building_details.common_areas}
                        onChange={(e) => updateField('building_details', 'common_areas', e.target.value)}
                        placeholder="Lobby, corridors, stairwells, laundry"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parking</Label>
                      <Input
                        value={formData.building_details.parking_spaces}
                        onChange={(e) => updateField('building_details', 'parking_spaces', e.target.value)}
                        placeholder="31 spaces (1 van-accessible)"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Fire Protection</Label>
                      <Input
                        value={formData.building_details.fire_protection}
                        onChange={(e) => updateField('building_details', 'fire_protection', e.target.value)}
                        placeholder="Full NFPA 13R sprinkler system"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Strategy Tab */}
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Strategy & Design Intent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>System Type</Label>
                    <Input
                      value={formData.system_strategy.system_type}
                      onChange={(e) => updateField('system_strategy', 'system_type', e.target.value)}
                      placeholder="Dedicated Split HVAC Systems for each residential unit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prohibited Systems (comma-separated)</Label>
                    <Textarea
                      value={formData.system_strategy.prohibited_systems.join(', ')}
                      onChange={(e) => updateField('system_strategy', 'prohibited_systems', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="VRF systems, Shared refrigerant loops, Centralized chilled water"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rationale</Label>
                    <RichTextEditor
                      value={formData.system_strategy.rationale}
                      onChange={(value) => updateField('system_strategy', 'rationale', value)}
                      placeholder="Each unit served independently for tenant independence, simplified maintenance..."
                      minHeight="100px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Design Finality Statement</Label>
                    <RichTextEditor
                      value={formData.system_strategy.design_finality}
                      onChange={(value) => updateField('system_strategy', 'design_finality', value)}
                      placeholder="HVAC design basis, system configuration, and quantities are final and authoritative..."
                      minHeight="100px"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Unit Configuration Tab */}
            <TabsContent value="units">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Unit Configuration</span>
                    <Button size="sm" onClick={addUnitConfig}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Unit Type
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Typical Size (SF)</TableHead>
                        <TableHead>HVAC Capacity</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.unit_configuration.map((unit, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={unit.unit_type}
                              onChange={(e) => {
                                const updated = [...formData.unit_configuration];
                                updated[index].unit_type = e.target.value;
                                setFormData(prev => ({ ...prev, unit_configuration: updated }));
                              }}
                              placeholder="1-Bedroom"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={unit.quantity}
                              onChange={(e) => {
                                const updated = [...formData.unit_configuration];
                                updated[index].quantity = parseInt(e.target.value) || 0;
                                setFormData(prev => ({ ...prev, unit_configuration: updated }));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={unit.typical_size}
                              onChange={(e) => {
                                const updated = [...formData.unit_configuration];
                                updated[index].typical_size = e.target.value;
                                setFormData(prev => ({ ...prev, unit_configuration: updated }));
                              }}
                              placeholder="650-750"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={unit.hvac_capacity}
                              onChange={(e) => {
                                const updated = [...formData.unit_configuration];
                                updated[index].hvac_capacity = e.target.value;
                                setFormData(prev => ({ ...prev, unit_configuration: updated }));
                              }}
                              placeholder="1.5 tons"
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeUnitConfig(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical Specs Tab */}
            <TabsContent value="technical">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications & BOQ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Residential Load</Label>
                      <Input
                        value={formData.technical_specs.residential_load}
                        onChange={(e) => updateField('technical_specs', 'residential_load', e.target.value)}
                        placeholder="~75 tons"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Common Area Load</Label>
                      <Input
                        value={formData.technical_specs.common_area_load}
                        onChange={(e) => updateField('technical_specs', 'common_area_load', e.target.value)}
                        placeholder="~20 tons"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Building Load</Label>
                      <Input
                        value={formData.technical_specs.total_load}
                        onChange={(e) => updateField('technical_specs', 'total_load', e.target.value)}
                        placeholder="~95 tons"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commercial Framework Tab */}
            <TabsContent value="commercial">
              <Card>
                <CardHeader>
                  <CardTitle>Commercial & Payment Framework</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">Payment Milestones</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Milestone</TableHead>
                          <TableHead>Payment %</TableHead>
                          <TableHead>Condition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.commercial_framework.payment_milestones.map((milestone, index) => (
                          <TableRow key={index}>
                            <TableCell>{milestone.milestone}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={milestone.payment_percent}
                                onChange={(e) => {
                                  const updated = [...formData.commercial_framework.payment_milestones];
                                  updated[index].payment_percent = parseInt(e.target.value) || 0;
                                  setFormData(prev => ({
                                    ...prev,
                                    commercial_framework: { ...prev.commercial_framework, payment_milestones: updated },
                                  }));
                                }}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={milestone.condition}
                                onChange={(e) => {
                                  const updated = [...formData.commercial_framework.payment_milestones];
                                  updated[index].condition = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    commercial_framework: { ...prev.commercial_framework, payment_milestones: updated },
                                  }));
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="space-y-2">
                    <Label>Maintenance Terms</Label>
                    <Textarea
                      value={formData.commercial_framework.maintenance_terms}
                      onChange={(e) => updateField('commercial_framework', 'maintenance_terms', e.target.value)}
                      placeholder="50% upfront, 50% post-verification"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Service Terms</Label>
                    <Textarea
                      value={formData.commercial_framework.emergency_terms}
                      onChange={(e) => updateField('commercial_framework', 'emergency_terms', e.target.value)}
                      placeholder="Per-call invoicing, Net 15 days"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Codes & Compliance Tab */}
            <TabsContent value="compliance">
              <Card>
                <CardHeader>
                  <CardTitle>Codes & Compliance Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Compliance Requirements (comma-separated)</Label>
                    <Textarea
                      value={formData.codes_compliance.join(', ')}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        codes_compliance: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                      }))}
                      placeholder="ASHRAE 62.1/90.1, International Mechanical Code, SMACNA standards..."
                      rows={4}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.codes_compliance.map((code, index) => (
                      <Badge key={index} variant="secondary">{code}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget Guidance Tab */}
            <TabsContent value="budget">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Guidance</CardTitle>
                  <CardDescription>Estimated budget ranges for vendor reference</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Installation Budget</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Minimum ($)</Label>
                          <Input
                            type="number"
                            value={formData.budget_guidance.installation_min}
                            onChange={(e) => updateField('budget_guidance', 'installation_min', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Maximum ($)</Label>
                          <Input
                            type="number"
                            value={formData.budget_guidance.installation_max}
                            onChange={(e) => updateField('budget_guidance', 'installation_max', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Annual Maintenance</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Minimum ($)</Label>
                          <Input
                            type="number"
                            value={formData.budget_guidance.maintenance_min}
                            onChange={(e) => updateField('budget_guidance', 'maintenance_min', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Maximum ($)</Label>
                          <Input
                            type="number"
                            value={formData.budget_guidance.maintenance_max}
                            onChange={(e) => updateField('budget_guidance', 'maintenance_max', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Emergency Services (Annual)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Minimum ($)</Label>
                          <Input
                            type="number"
                            value={formData.budget_guidance.emergency_min}
                            onChange={(e) => updateField('budget_guidance', 'emergency_min', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Maximum ($)</Label>
                          <Input
                            type="number"
                            value={formData.budget_guidance.emergency_max}
                            onChange={(e) => updateField('budget_guidance', 'emergency_max', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Contingency</Label>
                      <Input
                        value={formData.budget_guidance.contingency_percent}
                        onChange={(e) => updateField('budget_guidance', 'contingency_percent', e.target.value)}
                        placeholder="10-15%"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Project Documents, Floor Plans & Photos</span>
                    {!isNew && (
                      <div className="flex items-center gap-2">
                        <Select value={uploadDocType} onValueChange={setUploadDocType}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="specification">Specification</SelectItem>
                            <SelectItem value="blueprint">Blueprint</SelectItem>
                            <SelectItem value="floor_plan">Floor Plan</SelectItem>
                            <SelectItem value="mep_design">MEP Design</SelectItem>
                            <SelectItem value="property_photo">Property Photo</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <input
                          type="file"
                          id="doc-upload"
                          className="hidden"
                          multiple
                          accept=".pdf,.doc,.docx,.dwg,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.svg,.tiff"
                          onChange={(e) => handleDocumentUpload(e.target.files)}
                        />
                        <Button size="sm" onClick={() => document.getElementById('doc-upload')?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  {isNew && (
                    <CardDescription>Save the RFQ first to upload documents</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {uploadedDocs.length > 0 ? (
                    <div className="space-y-2">
                      {uploadedDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {doc.mime_type?.startsWith('image/') ? (
                              <Image className="h-5 w-5 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.category_badge && <Badge variant="outline" className="mr-2">{doc.category_badge}</Badge>}
                                {(doc.file_size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </EnhancedPageBackground>
    </OptimizedProtectedRoute>
  );
}
