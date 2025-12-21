import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, Eye, Archive, Loader2, 
  FileImage, FileSpreadsheet, File
} from 'lucide-react';
import { useRFQDocumentDownload, RFQDocument } from '@/hooks/useRFQDetail';
import { toast } from 'sonner';

interface RFQDocumentListProps {
  documents: RFQDocument[];
  rfqTitle?: string;
}

export default function RFQDocumentList({ documents, rfqTitle }: RFQDocumentListProps) {
  const { downloadDocument, getSignedUrl } = useRFQDocumentDownload();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const getDocumentIcon = (mimeType: string | null, docType: string) => {
    if (mimeType?.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (mimeType?.includes('image')) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    }
    if (docType === 'autocad' || docType === 'mep_design') {
      return <File className="h-8 w-8 text-purple-500" />;
    }
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  const getDocumentTypeBadge = (docType: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      blueprint: { label: 'Blueprint', variant: 'default' },
      floor_plan: { label: 'Floor Plan', variant: 'secondary' },
      mep_design: { label: 'MEP Design', variant: 'outline' },
      autocad: { label: 'AutoCAD', variant: 'outline' },
      specification: { label: 'Specification', variant: 'secondary' },
      contract: { label: 'Contract', variant: 'default' },
      other: { label: 'Document', variant: 'outline' }
    };
    const badge = badges[docType] || badges.other;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleDownload = async (doc: RFQDocument) => {
    setDownloading(doc.id);
    try {
      const result = await downloadDocument(doc.file_path, doc.file_name);
      if (!result.success) {
        toast.error('Failed to download document');
      }
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (doc: RFQDocument) => {
    try {
      const signedUrl = await getSignedUrl(doc.file_path);
      window.open(signedUrl, '_blank');
    } catch (error) {
      toast.error('Failed to preview document');
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (const doc of documents) {
        await downloadDocument(doc.file_path, doc.file_name);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast.success(`Downloaded ${documents.length} documents`);
    } catch (error) {
      toast.error('Failed to download all documents');
    } finally {
      setDownloadingAll(false);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No documents available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">
          Project Documents ({documents.length})
        </h4>
        {documents.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            disabled={downloadingAll}
          >
            {downloadingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Download All
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getDocumentIcon(doc.mime_type, doc.document_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-foreground" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getDocumentTypeBadge(doc.document_type)}
                    {doc.is_required_for_bidding && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(doc.file_size)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                {doc.mime_type?.includes('pdf') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(doc)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                >
                  {downloading === doc.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
