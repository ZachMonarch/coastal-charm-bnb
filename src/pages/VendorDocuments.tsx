import { useState, useEffect, useCallback } from 'react';
import VendorDocumentsList from "@/components/VendorDocumentsList";
import EnhancedFileUpload from "@/components/EnhancedFileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, FolderOpen, CheckCircle, Clock, HardDrive } from "lucide-react";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";

interface DocumentStats {
  total: number;
  certificates: number;
  pending: number;
  storageUsed: number;
}

export default function VendorDocuments() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<DocumentStats>({ total: 0, certificates: 0, pending: 0, storageUsed: 0 });
  const { toast } = useToast();

  const fetchDocumentStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('id, document_type, is_verified, file_size')
        .eq('vendor_id', user.id);

      if (error) throw error;

      const docs = data || [];
      const totalStorage = docs.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
      
      setStats({
        total: docs.length,
        certificates: docs.filter(d => 
          d.document_type?.toLowerCase().includes('certificate') ||
          d.document_type?.toLowerCase().includes('license') ||
          d.document_type?.toLowerCase().includes('certification')
        ).length,
        pending: docs.filter(d => d.is_verified === false || d.is_verified === null).length,
        storageUsed: totalStorage
      });
    } catch (err) {
      console.error('Error fetching document stats:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDocumentStats();
  }, [fetchDocumentStats, refreshKey]);

  const formatStorageSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUploadComplete = (files: any[]) => {
    toast({
      title: "Upload complete",
      description: `${files.length} file(s) uploaded successfully.`,
    });
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PrivatePageWrapper title="Documents & Files">
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="info">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Hero Section */}
          <PageHero
            title="Documents & Files"
            description="Upload and manage your documents, certificates, and project files securely"
            icon={FolderOpen}
            variant="gradient"
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Documents"
              value={stats.total}
              icon={FileText}
              color="info"
              subtitle="Uploaded files"
            />
            <StatsCard
              title="Certificates"
              value={stats.certificates}
              icon={CheckCircle}
              color="success"
              subtitle="Licenses & certifications"
            />
            <StatsCard
              title="Pending Review"
              value={stats.pending}
              icon={Clock}
              color="warning"
              subtitle="Awaiting verification"
            />
            <StatsCard
              title="Storage Used"
              value={formatStorageSize(stats.storageUsed)}
              icon={HardDrive}
              color="secondary"
              subtitle="of 100 MB"
            />
          </div>

          {/* File Upload Section */}
          <Card variant="gradient" className="border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <EnhancedFileUpload
                bucket="vendor-assets"
                folder="documents"
                onUploadComplete={handleUploadComplete}
                allowedTypes={[
                  'image/jpeg', 'image/png', 'image/webp',
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ]}
                maxSize={5 * 1024 * 1024}
                maxFiles={10}
                label="Upload Business Documents"
                description="Drag and drop files or click to browse. Supported formats: Images, PDF, Word, Excel (max 5MB each)"
                saveToDatabase={{ 
                  table: "vendor_documents", 
                  documentType: "business_document",
                  vendorId: undefined 
                }}
                useVendorUpload={true}
              />
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card variant="interactive">
            <CardHeader className="bg-gradient-to-r from-info/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-info animate-pulse" />
                Your Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <VendorDocumentsList key={refreshKey} />
            </CardContent>
          </Card>
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
