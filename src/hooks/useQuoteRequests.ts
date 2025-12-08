import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QuoteRequest {
  id: string;
  property_manager_id: string | null;
  property_id: number | null;
  service_category: string;
  title: string;
  description: string;
  urgency: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_start_date: string | null;
  location_address: string | null;
  location_city: string;
  location_zip: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: string;
  created_at: string;
  expires_at: string;
  updated_at: string;
}

interface UseQuoteRequestsOptions {
  status?: string;
  serviceCategory?: string;
  limit?: number;
}

export function useQuoteRequests(options: UseQuoteRequestsOptions = {}) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('quick_quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.serviceCategory) {
        query = query.eq('service_category', options.serviceCategory);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setRequests(data || []);
    } catch (err: any) {
      console.error("Error fetching quote requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [options.status, options.serviceCategory, options.limit]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
  };
}

export function useVendorLeadCredits(vendorId: string | null) {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const { data, error } = await supabase
          .from('vendor_lead_credits')
          .select('credit_balance')
          .eq('vendor_id', vendorId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        setCredits(data?.credit_balance || 10); // Default 10 free credits
      } catch (err) {
        console.error("Error fetching credits:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [vendorId]);

  return { credits, loading };
}
