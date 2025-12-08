import { useState, useEffect } from 'react';
import { Upload, Download, FileText, Trash2, Eye, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_required_for_bidding: boolean;
  created_at: string;
  uploaded_by: string;
}

interface DocumentManagementProps {
  projectId: string;
  isAdmin?: boolean;
  showUpload?: boolean;
}

export default function DocumentManagement({ 
  projectId, 
  isAdmin = false, 
  showUpload = false 
}: DocumentManagementProps) {
  const { user, hasRole } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRequiredForBidding, setIsRequiredForBidding] = useState(false);

  const isVendor = hasRole('vendor');
  const canDownloadDocuments = isAdmin || (isVendor && hasActiveSubscription);
  const canUploadDocuments = isAdmin || showUpload;

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_documents')
        .select('id, project_id, file_name, file_path, file_type, file_size, uploaded_by, created_at, is_required_for_bidding')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      logger.error('Error fetching project documents', { 
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      
      // Create unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `project-documents/${projectId}/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { error: dbError } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          is_required_for_bidding: isRequiredForBidding,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setSelectedFile(null);
      setIsRequiredForBidding(false);
      fetchDocuments();
    } catch (error) {
      logger.error('Error uploading project document', { 
        projectId,
        fileName: selectedFile?.name,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (document: ProjectDocument) => {
    if (!canDownloadDocuments) {
      toast.error('Active subscription required to download documents');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document downloaded');
    } catch (error) {
      logger.error('Error downloading document', { 
        documentId: document.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      toast.error('Failed to download document');
    }
  };

  const deleteDocument = async (documentId: string, filePath: string) => {
    if (!isAdmin) {
      toast.error('Insufficient permissions');
      return;
    }

    try {
      // Delete from storage
      await supabase.storage
        .from('documents')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      logger.error('Error deleting project document', { 
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📄';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Documents</h3>
          <p className="text-sm text-muted-foreground">
            {documents.length} documents available
          </p>
        </div>
        
        {canUploadDocuments && (
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Access Notice for Vendors */}
      {isVendor && !hasActiveSubscription && (
        <Card className="border-warning/30 bg-warning/10 dark:border-warning/40 dark:bg-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-warning" />
              <div>
                <h4 className="font-medium text-warning">
                  Subscription Required
                </h4>
                <p className="text-sm text-warning-foreground">
                  An active subscription is required to download project documents.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl">
                    {getFileIcon(doc.file_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{doc.file_name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      {doc.is_required_for_bidding && (
                        <Badge variant="destructive" className="text-xs">
                          Required for Bidding
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(doc)}
                    disabled={!canDownloadDocuments}
                  >
                    {!canDownloadDocuments ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {documents.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
              <p className="text-muted-foreground">
                {canUploadDocuments 
                  ? "Upload project documents to share with vendors."
                  : "Documents will appear here when uploaded by the project manager."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for this project. Supported formats: PDF, DOC, DOCX, XLS, XLSX, images.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="document">Select File</Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={isRequiredForBidding}
                onCheckedChange={(checked) => setIsRequiredForBidding(checked as boolean)}
              />
              <Label htmlFor="required" className="text-sm">
                Required for bidding
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}