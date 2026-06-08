import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RFQDocument {
  id: string;
  rfq_id: string;
  file_name: string;
  file_path: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  document_type: string;
  category_badge: string | null;
  is_required_for_bidding: boolean;
  created_at: string;
}

export interface RFQDetailData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string;
  category: string | null;
  expected_duration: string | null;
  created_at: string;
  property_id: number | null;
  document_control: {
    rfq_reference?: string;
    document_title?: string;
    project_name?: string;
    project_address?: string;
    issuer?: string;
    website?: string;
    project_email?: string;
    support_email?: string;
    issue_purpose?: string;
    document_status?: string;
  };
  executive_summary: {
    project_summary?: string;
    design_intent?: string;
    expected_duration?: string;
    building_type?: string;
    floors?: number;
    total_area?: string;
    residential_units?: number;
    common_areas?: string;
    parking?: string;
    fire_protection?: string;
  };
  building_details: {
    building_type?: string;
    floors?: number;
    total_area?: string;
    residential_units?: number;
    common_areas?: string;
    parking?: string;
    fire_protection?: string;
  };
  system_strategy: {
    system_type?: string;
    prohibited_systems?: string[];
    rationale?: string;
    design_finality?: string[];
  };
  unit_configuration: Array<{
    unit_type: string;
    quantity: number;
    typical_size: string;
    hvac_capacity?: string;
  }>;
  technical_specs: {
    load_basis?: Array<{ unit_type: string; capacity: string }>;
    cooling_load_summary?: { residential: string; common_area: string; total: string };
    boq?: {
      residential_systems?: Array<{ item: string; quantity: string; unit: string }>;
      common_area_systems?: Array<{ item: string; quantity: string; unit: string }>;
      mechanical_distribution?: Array<{ item: string; quantity: string; unit: string; notes?: string }>;
      controls_commissioning?: Array<{ item: string; quantity: string; unit: string }>;
    };
    installation_scope?: string[];
    ductwork_standards?: string[];
    piping_standards?: string[];
    site_access?: string[];
    controls?: Array<{ feature: string; specification: string }>;
    tab_requirements?: string[];
    commissioning_deliverables?: string[];
  };
  commercial_framework: {
    installation_milestones?: Array<{ milestone: number; payment_percent: string; condition: string }>;
    maintenance_payment?: Array<{ service_type: string; payment_terms: string }>;
  };
  codes_compliance: string[];
  staffing_requirements: {
    requirements?: string[];
    team_size?: string;
    suggested_staffing?: string[];
  };
  budget_guidance: {
    items?: Array<{ service: string; budget_range: string }>;
    total_estimate?: string;
    notes?: string[];
  };
  documents?: RFQDocument[];
  property?: {
    id: number;
    title: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

type JsonRecord = Record<string, any>;

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};

const asArray = <T = any,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];

  const cleaned = value.trim();
  if (!cleaned) return [];

  return cleaned
    .split(/\r?\n|;|\u2022/)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
};

const normalizeRfqJson = (rfq: any): Omit<RFQDetailData, 'documents' | 'property'> => {
  const documentControl = asRecord(rfq.document_control);
  const executiveSummary = asRecord(rfq.executive_summary);
  const buildingDetails = asRecord(rfq.building_details);
  const systemStrategy = asRecord(rfq.system_strategy);
  const technicalSpecs = asRecord(rfq.technical_specs);
  const commercialFramework = asRecord(rfq.commercial_framework);
  const staffingRequirements = asRecord(rfq.staffing_requirements);
  const budgetGuidance = asRecord(rfq.budget_guidance);

  return {
    ...rfq,
    document_control: documentControl,
    executive_summary: {
      ...executiveSummary,
      project_summary: executiveSummary.project_summary || executiveSummary.building_overview || executiveSummary.project_scope,
      expected_duration: executiveSummary.expected_duration || rfq.expected_duration,
    },
    building_details: {
      ...buildingDetails,
      parking: buildingDetails.parking || buildingDetails.parking_spaces,
    },
    system_strategy: {
      ...systemStrategy,
      prohibited_systems: asStringArray(systemStrategy.prohibited_systems),
      design_finality: asStringArray(systemStrategy.design_finality),
    },
    unit_configuration: asArray<JsonRecord>(rfq.unit_configuration).map((unit) => ({
      unit_type: unit.unit_type || '',
      quantity: Number(unit.quantity) || 0,
      typical_size: unit.typical_size || '',
      hvac_capacity: unit.hvac_capacity || unit.capacity || '',
    })),
    technical_specs: {
      ...technicalSpecs,
      cooling_load_summary:
        technicalSpecs.cooling_load_summary ||
        (technicalSpecs.residential_load || technicalSpecs.common_area_load || technicalSpecs.total_load
          ? {
              residential: technicalSpecs.residential_load || 'N/A',
              common_area: technicalSpecs.common_area_load || 'N/A',
              total: technicalSpecs.total_load || 'N/A',
            }
          : undefined),
      boq: {
        ...asRecord(technicalSpecs.boq),
        residential_systems: asArray(technicalSpecs.boq?.residential_systems || technicalSpecs.boq_items),
      },
      installation_scope: asStringArray(technicalSpecs.installation_scope),
    },
    commercial_framework: {
      ...commercialFramework,
      installation_milestones: asArray(commercialFramework.installation_milestones || commercialFramework.payment_milestones),
      maintenance_payment:
        asArray(commercialFramework.maintenance_payment).length > 0
          ? asArray(commercialFramework.maintenance_payment)
          : [
              commercialFramework.maintenance_terms
                ? { service_type: 'Maintenance', payment_terms: commercialFramework.maintenance_terms }
                : null,
              commercialFramework.emergency_terms
                ? { service_type: 'Emergency', payment_terms: commercialFramework.emergency_terms }
                : null,
            ].filter(Boolean),
    },
    codes_compliance: asStringArray(rfq.codes_compliance),
    staffing_requirements: {
      ...staffingRequirements,
      requirements: asStringArray(staffingRequirements.requirements || staffingRequirements.certifications),
      suggested_staffing: asStringArray(staffingRequirements.suggested_staffing || staffingRequirements.suggested_roles),
    },
    budget_guidance: {
      ...budgetGuidance,
      items:
        asArray(budgetGuidance.items).length > 0
          ? asArray(budgetGuidance.items)
          : [
              budgetGuidance.installation_min || budgetGuidance.installation_max
                ? { service: 'Installation', budget_range: `$${budgetGuidance.installation_min || 0} - $${budgetGuidance.installation_max || 0}` }
                : null,
              budgetGuidance.maintenance_min || budgetGuidance.maintenance_max
                ? { service: 'Maintenance', budget_range: `$${budgetGuidance.maintenance_min || 0} - $${budgetGuidance.maintenance_max || 0}` }
                : null,
              budgetGuidance.emergency_min || budgetGuidance.emergency_max
                ? { service: 'Emergency', budget_range: `$${budgetGuidance.emergency_min || 0} - $${budgetGuidance.emergency_max || 0}` }
                : null,
            ].filter(Boolean),
      notes: asStringArray(budgetGuidance.notes || budgetGuidance.contingency_percent),
    },
  };
};

export function useRFQDetail(rfqId: string | undefined) {
  return useQuery({
    queryKey: ['rfq-detail', rfqId],
    queryFn: async (): Promise<RFQDetailData | null> => {
      if (!rfqId) return null;

      const { data: rfq, error } = await supabase
        .from('rfqs')
        .select(`
          id, title, description, status, deadline, category, expected_duration, created_at, property_id,
          document_control, executive_summary, building_details, system_strategy,
          unit_configuration, technical_specs, commercial_framework, codes_compliance,
          staffing_requirements, budget_guidance
        `)
        .eq('id', rfqId)
        .single();

      if (error) throw error;
      if (!rfq) return null;

      // Fetch property info if available
      let property = null;
      if (rfq.property_id) {
        const { data: propData } = await supabase
          .from('safe_property_listings')
          .select('id, title, address, city, state')
          .eq('id', rfq.property_id)
          .single();
        property = propData;
      }

      // Fetch documents - explicit columns per egress policy
      const { data: documents } = await supabase
        .from('rfq_documents')
        .select('id, rfq_id, file_name, file_path, file_url, file_size, mime_type, document_type, category_badge, is_required_for_bidding, created_at')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: true });

      return {
        ...normalizeRfqJson(rfq),
        documents: documents || [],
        property
      };
    },
    enabled: !!rfqId
  });
}

export function useRFQDocumentDownload() {
  const downloadDocument = async (filePath: string, fileName: string): Promise<{ success: boolean; error?: unknown }> => {
    try {
      // First try signed URL approach for private buckets
      const { data: signedData, error: signedError } = await supabase.storage
        .from('rfq-documents')
        .createSignedUrl(filePath, 3600);

      if (signedError) {
        // Fall back to direct download for public files
        const { data, error } = await supabase.storage
          .from('rfq-documents')
          .download(filePath);

        if (error) {
          // Check if it's a permission error
          if (error.message?.includes('not authorized') || error.message?.includes('permission')) {
            toast.error('You do not have permission to download this document. Please ensure your account is verified.');
            return { success: false, error };
          }
          throw error;
        }

        // Create download link from blob
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      }

      // Use signed URL for download
      const response = await fetch(signedData.signedUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      if (errorMessage.includes('not authorized') || errorMessage.includes('permission')) {
        toast.error('Access denied. Please verify your account to download documents.');
      }
      return { success: false, error };
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('rfq-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      if (error.message?.includes('not authorized') || error.message?.includes('permission')) {
        toast.error('You do not have permission to preview this document.');
      }
      throw error;
    }
    return data.signedUrl;
  };

  const getPublicUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from('rfq-documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return { downloadDocument, getSignedUrl, getPublicUrl };
}
