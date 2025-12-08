import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { useVendorDocumentsRealtime } from "@/hooks/useVendorDocumentsRealtime";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getVendorFileSignedUrl } from "@/utils/vendorFileUpload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Image as ImageIcon,
  FileIcon,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { VendorDocumentComments } from './VendorDocumentComments';

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

interface VendorDocumentsListProps {
  vendorId?: string;
  isAdmin?: boolean;
  onVerificationUpdate?: () => void;
}

export default function VendorDocumentsList({ vendorId, isAdmin, onVerificationUpdate }: VendorDocumentsListProps) {
  const [selectedDocument, setSelectedDocument] = useState<VendorDocument | null>(null);
  const [selectedDocumentForComments, setSelectedDocumentForComments] = useState<VendorDocument | null>(null);
  const { user } = useAuth();
  const { documents, loading, error, refreshDocuments } = useVendorDocumentsRealtime(vendorId);
  const { toast } = useToast();
  const [displayUrls, setDisplayUrls] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 25;

  const handleVerification = async (documentId: string, verified: boolean) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('vendor_documents')
        .update({
          is_verified: verified,
          verified_at: verified ? new Date().toISOString() : null,
          verified_by: verified ? user.id : null
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: `Document ${verified ? 'verified' : 'rejected'}`,
        description: `The document has been ${verified ? 'verified' : 'rejected'} successfully.`,
      });
      
      refreshDocuments();
      onVerificationUpdate?.();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Verification failed",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vendor_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
      });
      
      refreshDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getVerificationBadge = (document: VendorDocument) => {
    if (document.is_verified) {
      return (
        <Badge className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadDocument = async (document: VendorDocument) => {
    try {
      let downloadUrl: string;
      
      if (document.file_path.startsWith('vendor-assets/')) {
        // Use fresh signed URL for vendor-assets bucket
        const signedUrl = await getVendorFileSignedUrl(document.file_path);
        if (!signedUrl) {
          throw new Error('Failed to generate download URL');
        }
        downloadUrl = signedUrl;
      } else {
        // Legacy format - use file_url directly
        downloadUrl = document.file_url;
      }

      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `${document.file_name} is being downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const viewDocument = (document: VendorDocument) => {
    if (document.mime_type?.startsWith('image/')) {
      setSelectedDocument(document);
    } else {
      downloadDocument(document);
    }
  };

  const getDocumentDisplayUrl = async (document: VendorDocument): Promise<string> => {
    const isVendorAssets = document.file_path.startsWith('vendor-assets/');
    
    if (isVendorAssets) {
      const signedUrl = await getVendorFileSignedUrl(document.file_path, 3600);
      return signedUrl || document.file_url || '';
    } else {
      return document.file_url || `/storage/v1/object/public/documents/${document.file_path}`;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDocuments();
      toast({
        title: "Documents refreshed",
        description: "Document list has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = documents.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Generate display URLs for documents
  useEffect(() => {
    const generateDisplayUrls = async () => {
      const urls: Record<string, string> = {};
      for (const doc of documents) {
        urls[doc.id] = await getDocumentDisplayUrl(doc);
      }
      setDisplayUrls(urls);
    };

    if (documents.length > 0) {
      generateDisplayUrls();
    }
  }, [documents]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p className="font-medium">Error loading documents</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Documents Uploaded</p>
            <p className="text-sm mt-1">Upload your business documents to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents ({documents.length})</h3>
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, documents.length)} of {documents.length} documents
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Documents Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>File Size</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDocuments.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {getFileIcon(document.mime_type)}
                    <div>
                      <p className="font-medium">{document.file_name}</p>
                      <p className="text-xs text-muted-foreground">{document.mime_type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {document.document_type.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatFileSize(document.file_size || 0)}
                </TableCell>
                <TableCell>
                  {new Date(document.uploaded_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {getVerificationBadge(document)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    {document.mime_type?.startsWith('image/') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => viewDocument(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDocumentForComments(document)}
                      title="Comments"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>

                    {isAdmin && !document.is_verified && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVerification(document.id, true)}
                          className="text-success hover:text-success hover:bg-success/10"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVerification(document.id, false)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {(user?.id === document.vendor_id || isAdmin) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(document.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) goToPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(page);
                    }}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) goToPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.file_name}</DialogTitle>
          </DialogHeader>
          {selectedDocument && displayUrls[selectedDocument.id] && (
            <div className="flex justify-center">
              <img
                src={displayUrls[selectedDocument.id]}
                alt={selectedDocument.file_name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={!!selectedDocumentForComments} onOpenChange={() => setSelectedDocumentForComments(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto" aria-describedby="comments-dialog-description">
          <VisuallyHidden.Root>
            <DialogTitle>Document Comments</DialogTitle>
            <DialogDescription id="comments-dialog-description">
              View and add comments for the selected document
            </DialogDescription>
          </VisuallyHidden.Root>
          {selectedDocumentForComments && (
            <VendorDocumentComments
              documentId={selectedDocumentForComments.id}
              documentName={selectedDocumentForComments.file_name}
              vendorId={selectedDocumentForComments.vendor_id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}