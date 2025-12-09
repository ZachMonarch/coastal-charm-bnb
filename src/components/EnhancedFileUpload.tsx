import React, { useState, useRef } from "react";
import { Upload, X, FileText, Image, AlertCircle, CheckCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";
import { 
  uploadVendorFile, 
  validateVendorFile, 
  MAX_FILE_SIZE_MB,
  VENDOR_FILE_EXTENSIONS 
} from "@/utils/vendorFileUpload";
import { logger } from "@/utils/logger";

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

interface EnhancedFileUploadProps {
  bucket: 'property-images' | 'profile-avatars' | 'documents' | 'property-documents' | 'vendor-assets';
  folder?: string;
  onUploadComplete?: (urls: string[], fileNames: string[]) => void;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  maxFiles?: number;
  multiple?: boolean;
  className?: string;
  label?: string;
  description?: string;
  accept?: string;
  // New props for database integration
  saveToDatabase?: {
    table: 'vendor_documents';
    documentType: string;
    vendorId?: string;
  };
  // Use vendor-specific upload utility
  useVendorUpload?: boolean;
}

export default function EnhancedFileUpload({
  bucket,
  folder = '',
  onUploadComplete,
  allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  maxSize = 5, // Changed default to 5MB for vendor uploads
  maxFiles = 5,
  multiple = false,
  className = '',
  label = 'Upload Files',
  description = 'Drag and drop files here, or click to browse',
  accept,
  saveToDatabase,
  useVendorUpload = false
}: EnhancedFileUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const createFilePreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  };

  const validateFile = (file: File): string | null => {
    // Use vendor-specific validation if enabled
    if (useVendorUpload) {
      const vendorValidation = validateVendorFile(file);
      if (!vendorValidation.valid) {
        return vendorValidation.error || 'File validation failed';
      }
      return null;
    }

    // Standard validation for other uploads
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is ${maxSize}MB.`;
    }

    if (allowedTypes.length > 0) {
      const isValidType = allowedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type);
      });

      if (!isValidType) {
        return `File type not supported for ${file.name}. Allowed types: ${allowedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles);
    
    // Validate file count
    if (!multiple && newFiles.length > 1) {
      toast.error("Only one file allowed");
      return;
    }

    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and process each file
    const validFiles: FileWithPreview[] = [];
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: generateFileId(),
        preview: createFilePreview(file)
      });
      validFiles.push(fileWithPreview);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const uploadFiles = async () => {
    if (!user || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];
    const uploadedNames: string[] = [];

    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress(prev => ({ ...prev, [file.id]: 0 }));

        if (useVendorUpload) {
          // Use vendor-specific upload utility
          const result = await uploadVendorFile(file, user.id, {
            documentType: saveToDatabase?.documentType || 'business_document',
            generateSignedUrl: true,
            signedUrlExpiry: 3600 // 1 hour
          });

          if (!result.success) {
            toast.error(result.error || `Failed to upload ${file.name}`);
            continue;
          }

          setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
          uploadedUrls.push(result.signedUrl || result.fileUrl || '');
          uploadedNames.push(file.name);
          toast.success(`${file.name} uploaded successfully`);

        } else {
          // Standard upload logic for other buckets
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${folder ? folder + '/' : ''}${Date.now()}-${index}.${fileExt}`;
          
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (error) throw error;

          // Get URL based on bucket privacy
          let fileUrl = '';
          if (bucket === 'property-images' || bucket === 'profile-avatars') {
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(data.path);
            fileUrl = urlData.publicUrl;
          } else {
            const { data: urlData } = await supabase.storage
              .from(bucket)
              .createSignedUrl(data.path, 3600); // 1 hour
            fileUrl = urlData?.signedUrl || '';
          }

          setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
          uploadedUrls.push(fileUrl);
          uploadedNames.push(file.name);
          
          // Save to database if configured
          if (saveToDatabase && saveToDatabase.table === 'vendor_documents') {
            try {
              const { error: dbError } = await supabase
                .from('vendor_documents')
                .insert({
                  vendor_id: saveToDatabase.vendorId || user.id,
                  document_type: saveToDatabase.documentType || 'business_document',
                  file_name: file.name,
                  file_path: data.path,
                  file_url: fileUrl,
                  file_size: file.size,
                  mime_type: file.type
                });
              
              if (dbError) {
                logger.error('Document metadata save error', { 
                  fileName: file.name,
                  error: dbError.message 
                });
              }
            } catch (dbError: any) {
              logger.error('Document metadata save error', { 
                fileName: file.name,
                error: dbError.message 
              });
              toast.error(`Failed to save ${file.name} to database`);
            }
          }
          
          toast.success(`${file.name} uploaded successfully`);
        }
      }

      // Cleanup previews
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });

      setFiles([]);
      setUploadProgress({});
      
      if (onUploadComplete) {
        onUploadComplete(uploadedUrls, uploadedNames);
      }
    } catch (error) {
      logger.error('File upload error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="neumorphic-card">
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted hover:border-primary/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{label}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              {useVendorUpload ? (
                <>
                  <p>Supported formats: {VENDOR_FILE_EXTENSIONS.join(', ')}</p>
                  <p>Maximum size: {MAX_FILE_SIZE_MB}MB per file</p>
                </>
              ) : (
                <>
                  {allowedTypes.length > 0 && (
                    <p>Supported formats: {allowedTypes.join(', ')}</p>
                  )}
                  <p>Maximum size: {maxSize}MB per file</p>
                </>
              )}
              <p>Maximum files: {maxFiles}</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple={multiple}
            accept={accept || allowedTypes.join(',')}
            onChange={(e) => {
              if (e.target.files) {
                handleFileSelect(e.target.files);
              }
            }}
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Selected Files:</h4>
              <div className="grid gap-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 glass-card rounded-lg">
                    <div className="flex items-center space-x-3">
                      {file.preview ? (
                        <img 
                          src={file.preview} 
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        getFileIcon(file)
                      )}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {uploadProgress[file.id] !== undefined && (
                          <Progress 
                            value={uploadProgress[file.id]} 
                            className="w-32 h-2 mt-1"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadProgress[file.id] === 100 && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                      {!uploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  files.forEach(file => {
                    if (file.preview) {
                      URL.revokeObjectURL(file.preview);
                    }
                  });
                  setFiles([]);
                }}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button 
                onClick={uploadFiles}
                disabled={uploading || files.length === 0}
                className="btn-primary"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}