import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorProfile {
  id: string;
  user_id: string;
  company_name: string;
  business_license?: string;
  specialties: string[];
  service_areas: string[];
  is_verified: boolean;
  insurance_verified: boolean;
  background_check_verified: boolean;
  rating: number;
  completed_jobs: number;
  response_time_hours: number;
  availability_status: 'available' | 'busy' | 'inactive';
  last_active_at: string;
  created_at: string;
}

export interface VendorApplication {
  id: string;
  user_id: string;
  property_id?: number;
  project_title: string;
  project_description: string;
  project_type: string;
  priority: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  preferred_start_date?: string;
  deadline?: string;
  created_at: string;
}

export interface VendorBid {
  id: string;
  vendor_id: string;
  application_id?: string;
  project_id?: string;
  bid_amount: number;
  proposal_details: string;
  estimated_duration?: string;
  status: string;
  submitted_at: string;
}

export const useVendorProfiles = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('vendor_profiles')
        .select('id, user_id, company_name, specialties, service_areas, is_verified, insurance_verified, background_check_verified, availability_status, rating, completed_jobs, response_time_hours, average_rating, success_rate, last_active_at, created_at')
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setVendors((data || []) as VendorProfile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return {
    vendors,
    loading,
    error,
    refetch: fetchVendors
  };
};

export const useVendorApplications = (filters: { status?: string; userId?: string } = {}) => {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('vendor_applications')
        .select('id, user_id, project_title, project_description, project_type, status, priority, budget_min, budget_max, location, preferred_start_date, deadline, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setApplications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filters.status, filters.userId]);

  const createApplication = async (applicationData: Omit<VendorApplication, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('vendor_applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) throw error;

      await fetchApplications(); // Refresh the list
      return data;
    } catch (error) {
      throw new Error(`Failed to create application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    createApplication
  };
};

export const useVendorBids = (applicationId?: string) => {
  const [bids, setBids] = useState<VendorBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('vendor_bids')
        .select('id, vendor_id, application_id, project_id, bid_amount, proposal_details, estimated_duration, status, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(50);

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBids(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [applicationId]);

  const submitBid = async (bidData: Omit<VendorBid, 'id' | 'submitted_at'>) => {
    try {
      const { data, error } = await supabase
        .from('vendor_bids')
        .insert({
          ...bidData,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBids(); // Refresh the list
      return data;
    } catch (error) {
      throw new Error(`Failed to submit bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    bids,
    loading,
    error,
    refetch: fetchBids,
    submitBid
  };
};