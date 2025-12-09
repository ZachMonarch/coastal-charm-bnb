import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useVendorDocumentComments, VendorDocumentComment } from '@/hooks/useVendorDocumentComments';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import LoadingSpinner from './LoadingSpinner';
import ReusableAvatar from './Avatar';
import { MessageSquare, Shield, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VendorDocumentCommentsProps {
  documentId: string;
  documentName: string;
  vendorId: string;
}

export function VendorDocumentComments({ documentId, documentName, vendorId }: VendorDocumentCommentsProps) {
  const { comments, loading, addComment } = useVendorDocumentComments(documentId);
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<VendorDocumentComment['comment_type']>('admin_note');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = hasRole('admin');
  const isVendor = user?.id === vendorId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await addComment(newComment, commentType, isInternal);
      setNewComment('');
      toast({ title: 'Comment added successfully' });
    } catch (error) {
      toast({
        title: 'Error adding comment',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCommentTypeBadge = (type: string) => {
    const badges = {
      verification_note: <Badge variant="default">Verification</Badge>,
      rejection_reason: <Badge variant="destructive">Rejection</Badge>,
      admin_note: <Badge variant="secondary">Admin Note</Badge>,
      vendor_response: <Badge variant="outline">Vendor Response</Badge>
    };
    return badges[type as keyof typeof badges] || <Badge>{type}</Badge>;
  };

  if (loading) {
    return <LoadingSpinner text="Loading comments..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Document Comments: {documentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-lg border ${
                  comment.is_internal ? 'bg-warning/10 border-warning/30 dark:bg-warning/20 dark:border-warning/40' : 'bg-card'
                }`}
              >
                <div className="flex items-start gap-3">
                  <ReusableAvatar
                    url={comment.user?.avatar_url}
                    name={comment.user?.full_name || 'Unknown User'}
                    size="sm"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{comment.user?.full_name || 'Unknown User'}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getCommentTypeBadge(comment.comment_type)}
                      {comment.is_internal && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Internal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Add Comment</Label>
            <Textarea
              id="comment"
              placeholder={
                isAdmin
                  ? 'Add verification notes, rejection reasons, or general comments...'
                  : 'Respond to verification notes or provide additional information...'
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">{newComment.length}/2000 characters</p>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="commentType">Comment Type</Label>
                <Select value={commentType} onValueChange={(v) => setCommentType(v as any)}>
                  <SelectTrigger id="commentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_note">Admin Note</SelectItem>
                    <SelectItem value="verification_note">Verification Note</SelectItem>
                    <SelectItem value="rejection_reason">Rejection Reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
                <Label htmlFor="internal" className="text-sm">
                  Internal Only
                  <span className="block text-xs text-muted-foreground">Hidden from vendor</span>
                </Label>
              </div>
            </div>
          )}

          {isInternal && isAdmin && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 dark:bg-warning/20 rounded-md border border-warning/30">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-xs text-warning">
                This comment will only be visible to admins and will not be shown to the vendor.
              </p>
            </div>
          )}

          <Button type="submit" disabled={!newComment.trim() || submitting} className="w-full">
            {submitting ? 'Adding...' : 'Add Comment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
