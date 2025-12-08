// Optimized vendor upload hook with realtime updates and instant visibility
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface VendorDocument {
  id: string;
  vendor_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  is_verified: boolean;
  uploaded_at: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

interface UseOptimizedVendorUploadReturn {
  documents: VendorDocument[];
  uploadProgress: Record<string, UploadProgress>;
  isLoading: boolean;
  uploadAvatar: (file: File) => Promise<void>;
  uploadDocument: (file: File, documentType: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const useOptimizedVendorUpload = (): UseOptimizedVendorUploadReturn => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('id, vendor_id, document_type, file_name, file_path, file_url, file_size, uploaded_at, verified_at, verified_by, is_verified, mime_type')
        .eq('vendor_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      logger.error('Error fetching vendor documents', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Realtime subscription for instant updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('vendor-documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_documents',
          filter: `vendor_id=eq.${user.id}`,
        },
        (payload) => {
          logger.info('Realtime document update', payload);

          if (payload.eventType === 'INSERT') {
            setDocuments((prev) => [payload.new as VendorDocument, ...prev]);
            toast.success('Document uploaded successfully');
          } else if (payload.eventType === 'UPDATE') {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === payload.new.id ? (payload.new as VendorDocument) : doc
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDocuments((prev) => prev.filter((doc) => doc.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Validate file
  const validateFile = (file: File, isAvatar: boolean): string | null => {
    const maxSize = isAvatar ? AVATAR_MAX_SIZE : MAX_FILE_SIZE;
    const allowedTypes = isAvatar ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;

    if (file.size > maxSize) {
      return `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  // Generate storage path
  const generatePath = (userId: string, fileName: string, bucketType: 'avatar' | 'doc'): string => {
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-_]/g, '_');
    const timestamp = Date.now();
    return `${userId}/${timestamp}_${sanitized}`;
  };

  // Upload avatar with optimistic UI
  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      const fileId = `avatar_${Date.now()}`;
      const validation = validateFile(file, true);
      if (validation) {
        toast.error(validation);
        return;
      }

      // Optimistic update
      setUploadProgress((prev) => ({
        ...prev,
        [fileId]: {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        },
      }));

      try {
        const filePath = generatePath(user.id, file.name, 'avatar');

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('vendor_avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL (bucket is public)
        const { data: urlData } = supabase.storage
          .from('vendor_avatars')
          .getPublicUrl(filePath);

        // Save to database (trigger will sync to profiles)
        const { error: dbError } = await supabase.from('vendor_documents').insert({
          vendor_id: user.id,
          document_type: 'profile_image',
          file_name: file.name,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          is_verified: true,
        });

        if (dbError) throw dbError;

        // Update progress
        setUploadProgress((prev) => ({
          ...prev,
          [fileId]: {
            fileId,
            fileName: file.name,
            progress: 100,
            status: 'success',
            url: urlData.publicUrl,
          },
        }));

        // Clear after 3 seconds
        setTimeout(() => {
          setUploadProgress((prev) => {
            const { [fileId]: _, ...rest } = prev;
            return rest;
          });
        }, 3000);
      } catch (error) {
        logger.error('Avatar upload failed', error);
        setUploadProgress((prev) => ({
          ...prev,
          [fileId]: {
            fileId,
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          },
        }));
        toast.error('Failed to upload avatar');
      }
    },
    [user?.id]
  );

  // Upload document with optimistic UI
  const uploadDocument = useCallback(
    async (file: File, documentType: string) => {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      const fileId = `doc_${Date.now()}`;
      const validation = validateFile(file, false);
      if (validation) {
        toast.error(validation);
        return;
      }

      // Optimistic update
      setUploadProgress((prev) => ({
        ...prev,
        [fileId]: {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        },
      }));

      try {
        const filePath = generatePath(user.id, file.name, 'doc');

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('vendor_docs')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Generate signed URL (bucket is private)
        const { data: signedData, error: signedError } = await supabase.storage
          .from('vendor_docs')
          .createSignedUrl(filePath, 3600);

        if (signedError) throw signedError;

        // Save to database
        const { error: dbError } = await supabase.from('vendor_documents').insert({
          vendor_id: user.id,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_url: signedData.signedUrl,
          file_size: file.size,
          mime_type: file.type,
          is_verified: false,
        });

        if (dbError) throw dbError;

        // Update progress
        setUploadProgress((prev) => ({
          ...prev,
          [fileId]: {
            fileId,
            fileName: file.name,
            progress: 100,
            status: 'success',
            url: signedData.signedUrl,
          },
        }));

        // Clear after 3 seconds
        setTimeout(() => {
          setUploadProgress((prev) => {
            const { [fileId]: _, ...rest } = prev;
            return rest;
          });
        }, 3000);
      } catch (error) {
        logger.error('Document upload failed', error);
        setUploadProgress((prev) => ({
          ...prev,
          [fileId]: {
            fileId,
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          },
        }));
        toast.error('Failed to upload document');
      }
    },
    [user?.id]
  );

  // Delete document
  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!user?.id) return;

      try {
        const doc = documents.find((d) => d.id === documentId);
        if (!doc) return;

        // Optimistically remove from UI
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));

        // Delete from storage
        const bucket = doc.document_type === 'profile_image' ? 'vendor_avatars' : 'vendor_docs';
        await supabase.storage.from(bucket).remove([doc.file_path]);

        // Delete from database
        const { error } = await supabase
          .from('vendor_documents')
          .delete()
          .eq('id', documentId);

        if (error) throw error;

        toast.success('Document deleted');
      } catch (error) {
        logger.error('Delete failed', error);
        toast.error('Failed to delete document');
        // Revert optimistic update
        fetchDocuments();
      }
    },
    [user?.id, documents, fetchDocuments]
  );

  return {
    documents,
    uploadProgress,
    isLoading,
    uploadAvatar,
    uploadDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
};
