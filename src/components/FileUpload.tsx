import { useState, useRef } from "react";
import { Upload, X, FileText, Image, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from '@/utils/logger';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";

interface FileUploadProps {
  bucket: 'property-images' | 'profile-avatars' | 'documents';
  folder?: string;
  onUploadComplete?: (url: string, fileName: string) => void;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  maxFiles?: number;
  multiple?: boolean;
  className?: string;
}

export default function FileUpload({
  bucket,
  folder = '',
  onUploadComplete,
  allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  maxSize = 10,
  maxFiles = 5,
  multiple = false,
  className = ''
}: FileUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is ${maxSize}MB.`;
    }

    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return `File type not supported for ${file.name}. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
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

    // Validate each file
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
    const uploadPromises = files.map(async (file, index) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${folder ? folder + '/' : ''}${Date.now()}-${index}.${fileExt}`;
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        // Get public URL for public buckets
        let publicUrl = '';
        if (bucket === 'property-images' || bucket === 'profile-avatars') {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);
          publicUrl = urlData.publicUrl;
        } else {
          // For private buckets, get signed URL
          const { data: urlData } = await supabase.storage
            .from(bucket)
            .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days
          publicUrl = urlData?.signedUrl || '';
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        if (onUploadComplete) {
          onUploadComplete(publicUrl, file.name);
        }

        toast.success(`${file.name} uploaded successfully`);
        return { success: true, url: publicUrl, fileName: file.name };
      } catch (error) {
        logger.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
        return { success: false, error };
      }
    });

    await Promise.all(uploadPromises);
    setFiles([]);
    setUploadProgress({});
    setUploading(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="neumorphic-card">
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-primary');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary');
              const droppedFiles = e.dataTransfer.files;
              if (droppedFiles.length > 0) {
                handleFileSelect(droppedFiles);
              }
            }}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Files</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Supported formats: {allowedTypes.join(', ')}</p>
              <p>Maximum size: {maxSize}MB per file</p>
              <p>Maximum files: {maxFiles}</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple={multiple}
            accept={allowedTypes.join(',')}
            onChange={(e) => {
              if (e.target.files) {
                handleFileSelect(e.target.files);
              }
            }}
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Selected Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file)}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadProgress[file.name] !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {uploadProgress[file.name]}%
                      </Badge>
                    )}
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setFiles([])}
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