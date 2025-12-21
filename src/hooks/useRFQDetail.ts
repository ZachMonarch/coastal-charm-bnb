import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

      // Fetch documents
      const { data: documents } = await supabase
        .from('rfq_documents')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: true });

      return {
        ...rfq,
        document_control: (rfq.document_control as RFQDetailData['document_control']) || {},
        executive_summary: (rfq.executive_summary as RFQDetailData['executive_summary']) || {},
        building_details: (rfq.building_details as RFQDetailData['building_details']) || {},
        system_strategy: (rfq.system_strategy as RFQDetailData['system_strategy']) || {},
        unit_configuration: (rfq.unit_configuration as RFQDetailData['unit_configuration']) || [],
        technical_specs: (rfq.technical_specs as RFQDetailData['technical_specs']) || {},
        commercial_framework: (rfq.commercial_framework as RFQDetailData['commercial_framework']) || {},
        codes_compliance: (rfq.codes_compliance as string[]) || [],
        staffing_requirements: (rfq.staffing_requirements as RFQDetailData['staffing_requirements']) || {},
        budget_guidance: (rfq.budget_guidance as RFQDetailData['budget_guidance']) || {},
        documents: documents || [],
        property
      };
    },
    enabled: !!rfqId
  });
}

export function useRFQDocumentDownload() {
  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('rfq-documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error downloading document:', error);
      return { success: false, error };
    }
  };

  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('rfq-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  return { downloadDocument, getSignedUrl };
}
