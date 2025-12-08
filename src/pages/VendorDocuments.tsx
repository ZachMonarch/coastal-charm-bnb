import { useState } from 'react';
import VendorDocumentsList from "@/components/VendorDocumentsList";
import EnhancedFileUpload from "@/components/EnhancedFileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, FolderOpen, CheckCircle } from "lucide-react";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";

export default function VendorDocuments() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadCount, setUploadCount] = useState(0);
  const { toast } = useToast();

  const handleUploadComplete = (files: any[]) => {
    toast({
      title: "Upload complete",
      description: `${files.length} file(s) uploaded successfully.`,
    });
    setUploadCount(prev => prev + files.length);
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
              value={uploadCount || 0}
              icon={FileText}
              color="info"
              subtitle="Uploaded files"
            />
            <StatsCard
              title="Certificates"
              value={0}
              icon={CheckCircle}
              color="success"
              subtitle="Verified docs"
            />
            <StatsCard
              title="Pending Review"
              value={0}
              icon={Upload}
              color="warning"
              subtitle="Awaiting approval"
            />
            <StatsCard
              title="Storage Used"
              value="0 MB"
              icon={FolderOpen}
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
