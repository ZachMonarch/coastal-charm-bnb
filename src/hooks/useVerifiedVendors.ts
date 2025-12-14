import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VerifiedVendor {
  id: string;
  user_id: string;
  company_name: string;
  description?: string;
  avatar_url?: string;
  specialties: string[];
  certifications: string[];
  rating: number;
  completed_jobs: number;
  response_time_hours: number;
  is_verified: boolean;
  insurance_verified: boolean;
  background_check_verified: boolean;
  subscription_plan: string;
  subscription_status: string;
  years_experience?: number;
  phone?: string;
  email?: string;
  address?: string;
  service_areas: string[];
}

interface UseVerifiedVendorsOptions {
  specialty?: string;
  minRating?: number;
  location?: string;
  limit?: number;
}

export const useVerifiedVendors = (options: UseVerifiedVendorsOptions = {}) => {
  const [vendors, setVendors] = useState<VerifiedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifiedVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Show all verified vendors (subscription_status filter removed for inclusivity)
      // Verified status is the primary filter; subscription tiers affect display priority
      let query = supabase
        .from('vendor_profiles')
        .select(`
          id,
          user_id,
          company_name,
          description,
          avatar_url,
          specialties,
          certifications,
          rating,
          completed_jobs,
          response_time_hours,
          is_verified,
          insurance_verified,
          background_check_verified,
          subscription_plan,
          subscription_status,
          years_experience,
          phone,
          email,
          address,
          service_areas
        `)
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .order('completed_jobs', { ascending: false });

      // Apply filters
      if (options.specialty) {
        query = query.contains('specialties', [options.specialty]);
      }

      if (options.minRating) {
        query = query.gte('rating', options.minRating);
      }

      if (options.location) {
        query = query.contains('service_areas', [options.location]);
      }

      query = query.limit(options.limit || 50);

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching verified vendors:', fetchError);
        throw fetchError;
      }

      setVendors((data as VerifiedVendor[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch verified vendors';
      console.error('Verified vendors fetch error:', err);
      setError(errorMessage);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifiedVendors();
  }, [options.specialty, options.minRating, options.location, options.limit]);

  return {
    vendors,
    loading,
    error,
    refetch: fetchVerifiedVendors
  };
};
