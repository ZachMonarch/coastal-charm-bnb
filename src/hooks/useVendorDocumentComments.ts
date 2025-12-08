import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type VendorDocumentCommentRow = Database['public']['Tables']['vendor_document_comments']['Row'];

export interface VendorDocumentComment extends Omit<VendorDocumentCommentRow, 'comment_type'> {
  comment_type: 'verification_note' | 'rejection_reason' | 'admin_note' | 'vendor_response';
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export function useVendorDocumentComments(documentId?: string) {
  const [comments, setComments] = useState<VendorDocumentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setComments([]);
      setLoading(false);
      return;
    }

    const fetchComments = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('vendor_document_comments')
          .select(`
            id,
            document_id,
            user_id,
            comment_text,
            comment_type,
            is_internal,
            created_at,
            user:profiles!user_id(full_name, avatar_url)
          `)
          .eq('document_id', documentId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setComments((data || []) as VendorDocumentComment[]);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Real-time subscription
    const channel = supabase
      .channel(`comments:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_document_comments',
          filter: `document_id=eq.${documentId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  const addComment = async (
    commentText: string,
    commentType: VendorDocumentComment['comment_type'],
    isInternal: boolean = false
  ) => {
    if (!documentId) return;

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: insertError } = await supabase
        .from('vendor_document_comments')
        .insert([{
          document_id: documentId,
          user_id: user.id,
          comment_text: commentText,
          comment_type: commentType,
          is_internal: isInternal
        }]);

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  return { comments, loading, error, addComment };
}
