import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';

export interface BidFormData {
  company_info: {
    company_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    license_number: string;
    years_in_business?: number;
  };
  pricing: {
    equipment_cost: number;
    installation_cost: number;
    total_installation: number;
    annual_maintenance: number;
    warranty_years: number;
    notes?: string;
  };
  certifications: Array<{
    name: string;
    has_certification: boolean;
    file_path?: string;
    expiry_date?: string;
  }>;
  experience: {
    summary: string;
    proposed_timeline: string;
    references: Array<{
      company_name: string;
      contact_name: string;
      phone: string;
      project_description: string;
    }>;
  };
  document_uploads: Array<{
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }>;
  terms_accepted: boolean;
}

const CERTIFICATION_OPTIONS = [
  { id: 'epa_608', label: 'EPA Section 608 Certification' },
  { id: 'osha_30', label: 'OSHA 30-Hour Construction' },
  { id: 'nebb', label: 'NEBB Certified' },
  { id: 'nate', label: 'NATE Certification' },
  { id: 'acca', label: 'ACCA Membership' },
  { id: 'smacna', label: 'SMACNA Certified' },
  { id: 'ohio_mechanical', label: 'Ohio Mechanical License' }
];

export function useBidSubmission(rfqId: string | undefined, projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDraft, setIsDraft] = useState(false);

  // Fetch existing bid if any
  const { data: existingBid, isLoading: loadingBid } = useQuery({
    queryKey: ['vendor-bid', rfqId, user?.id],
    queryFn: async () => {
      if (!rfqId || !user?.id) return null;

      const { data, error } = await supabase
        .from('vendor_bids')
        .select('id, rfq_id, project_id, vendor_id, bid_amount, proposal_details, estimated_duration, status, company_info, pricing, certifications, experience, document_uploads, terms_accepted, terms_accepted_at, submitted_at')
        .eq('rfq_id', rfqId)
        .eq('vendor_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!rfqId && !!user?.id
  });

  // Fetch vendor profile for pre-filling
  const { data: vendorProfile } = useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('company_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Submit or update bid mutation
  const submitBidMutation = useMutation({
    mutationFn: async ({ formData, status }: { formData: BidFormData; status: 'draft' | 'submitted' }) => {
      if (!rfqId || !user?.id) throw new Error('Missing required data');

      // Pre-submission gates (only for final submit, not drafts)
      if (status === 'submitted') {
        const { data: vp } = await supabase
          .from('vendor_profiles')
          .select('verification_status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!vp || vp.verification_status !== true) {
          throw new Error('Your vendor profile must be approved before you can submit bids.');
        }

        const { data: subData } = await supabase.functions.invoke('check-subscription');
        if (!subData?.subscribed && !subData?.trialing) {
          throw new Error('An active subscription (or 7-day trial) is required to submit bids.');
        }

        const { data: grant } = await supabase
          .from('rfq_access_grants')
          .select('id, revoked_at')
          .eq('rfq_id', rfqId)
          .eq('user_id', user.id)
          .is('revoked_at', null)
          .maybeSingle();
        if (!grant) {
          throw new Error('You need approved access to this project before bidding. Please request access first.');
        }
      }

      const bidData = {
        rfq_id: rfqId,
        project_id: projectId || null,
        vendor_id: user.id,
        bid_amount: formData.pricing.total_installation,
        proposal_details: formData.experience.summary,
        estimated_duration: formData.experience.proposed_timeline,
        status,
        company_info: formData.company_info,
        pricing: formData.pricing,
        certifications: formData.certifications,
        experience: formData.experience,
        document_uploads: formData.document_uploads,
        terms_accepted: formData.terms_accepted,
        terms_accepted_at: formData.terms_accepted ? new Date().toISOString() : null,
        submitted_at: status === 'submitted' ? new Date().toISOString() : null
      };

      if (existingBid) {
        const { data, error } = await supabase
          .from('vendor_bids')
          .update(bidData)
          .eq('id', existingBid.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('vendor_bids')
          .insert(bidData)
          .select()
          .single();

        if (error) throw error;

        // Send confirmation email if submitted
        if (status === 'submitted') {
          await supabase.functions.invoke('send-bid-confirmation', {
            body: { 
              rfq_id: rfqId, 
              vendor_id: user.id, 
              total_amount: formData.pricing.total_installation 
            }
          });
        }

        return data;
      }
    },
    onSuccess: (data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bid', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bids'] });
      
      if (status === 'submitted') {
        toast.success('Bid submitted successfully!');
      } else {
        toast.success('Draft saved successfully');
      }
    },
    onError: (error) => {
      console.error('Bid submission error:', error);
      toast.error('Failed to submit bid. Please try again.');
    }
  });

  // Upload certification document
  const uploadCertification = async (file: File, certificationId: string) => {
    if (!user?.id) throw new Error('Not authenticated');

    const filePath = `${user.id}/certifications/${certificationId}_${file.name}`;
    
    const { error } = await supabase.storage
      .from('bid-documents')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    return filePath;
  };

  // Upload bid document
  const uploadBidDocument = async (file: File) => {
    if (!user?.id) throw new Error('Not authenticated');

    const filePath = `${user.id}/documents/${Date.now()}_${file.name}`;
    
    const { error } = await supabase.storage
      .from('bid-documents')
      .upload(filePath, file);

    if (error) throw error;

    return {
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type
    };
  };

  // Delete bid document
  const deleteBidDocument = async (filePath: string) => {
    const { error } = await supabase.storage
      .from('bid-documents')
      .remove([filePath]);

    if (error) throw error;
  };

  // Get initial form data (from existing bid or vendor profile)
  const getInitialFormData = (): BidFormData => {
    if (existingBid) {
      return {
        company_info: (existingBid.company_info as BidFormData['company_info']) || getDefaultCompanyInfo(),
        pricing: (existingBid.pricing as BidFormData['pricing']) || getDefaultPricing(),
        certifications: (existingBid.certifications as BidFormData['certifications']) || getDefaultCertifications(),
        experience: (existingBid.experience as BidFormData['experience']) || getDefaultExperience(),
        document_uploads: (existingBid.document_uploads as BidFormData['document_uploads']) || [],
        terms_accepted: existingBid.terms_accepted || false
      };
    }

    return {
      company_info: getDefaultCompanyInfo(),
      pricing: getDefaultPricing(),
      certifications: getDefaultCertifications(),
      experience: getDefaultExperience(),
      document_uploads: [],
      terms_accepted: false
    };
  };

  const getDefaultCompanyInfo = (): BidFormData['company_info'] => ({
    company_name: vendorProfile?.company_name || '',
    contact_name: '',
    contact_email: user?.email || '',
    contact_phone: vendorProfile?.phone || '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    license_number: '',
    years_in_business: undefined
  });

  const getDefaultPricing = (): BidFormData['pricing'] => ({
    equipment_cost: 0,
    installation_cost: 0,
    total_installation: 0,
    annual_maintenance: 0,
    warranty_years: 1
  });

  const getDefaultCertifications = (): BidFormData['certifications'] => 
    CERTIFICATION_OPTIONS.map(cert => ({
      name: cert.id,
      has_certification: false
    }));

  const getDefaultExperience = (): BidFormData['experience'] => ({
    summary: '',
    proposed_timeline: '',
    references: []
  });

  return {
    existingBid,
    loadingBid,
    vendorProfile,
    submitBid: submitBidMutation.mutate,
    isSubmitting: submitBidMutation.isPending,
    uploadCertification,
    uploadBidDocument,
    deleteBidDocument,
    getInitialFormData,
    CERTIFICATION_OPTIONS,
    isDraft,
    setIsDraft
  };
}
