import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { secureErrorHandler } from '@/utils/secureErrorHandler';

interface VendorDocument {
  id: string;
  vendor_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  uploaded_at: string;
}

export function useVendorDocumentsRealtime(vendorId?: string) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetVendorId = vendorId || user?.id;

  const fetchDocuments = async () => {
    if (!targetVendorId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('id, vendor_id, document_type, file_name, file_path, file_url, file_size, mime_type, is_verified, verified_at, verified_by, uploaded_at')
        .eq('vendor_id', targetVendorId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
      setError(null);
    } catch (err) {
      const safeError = secureErrorHandler.handleError(err, {
        endpoint: 'vendor_documents',
        userId: targetVendorId,
        action: 'fetch'
      });
      setError(safeError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!targetVendorId) return;

    // Initial fetch
    fetchDocuments();

    // Set up real-time subscription
    const channel = supabase
      .channel('vendor_documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_documents',
          filter: `vendor_id=eq.${targetVendorId}`
        },
        (payload) => {
          console.log('Real-time document change:', payload);
          
          // Refresh documents on any change
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetVendorId]);

  const refreshDocuments = () => {
    fetchDocuments();
  };

  return {
    documents,
    loading,
    error,
    refreshDocuments
  };
}