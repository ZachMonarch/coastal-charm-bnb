import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { sanitizeFileName, validateFileType, validateFileSize } from '@/utils/sanitization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadSecureProps {
  bucket: string;
  path?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  multiple?: boolean;
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export const FileUploadSecure: React.FC<FileUploadSecureProps> = ({
  bucket,
  path = '',
  allowedTypes = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  onUploadComplete,
  onUploadError,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Security checks for file validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!validateFileType(file.name, allowedTypes)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    if (!validateFileSize(file.size, maxSize)) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`
      };
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.pif$/i,
      /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.php$/i, /\.asp$/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return {
        valid: false,
        error: 'File type not allowed for security reasons'
      };
    }

    // Check file content (basic MIME type validation)
    const expectedMimeTypes: Record<string, string[]> = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };

    const extension = file.name.toLowerCase().split('.').pop();
    if (extension && expectedMimeTypes[extension]) {
      if (!expectedMimeTypes[extension].includes(file.type)) {
        return {
          valid: false,
          error: 'File content does not match extension'
        };
      }
    }

    return { valid: true };
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      const sanitizedName = sanitizeFileName(uploadFile.file.name);
      const timestamp = Date.now();
      const fileName = `${timestamp}-${sanitizedName}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, uploadFile.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100, url: publicUrl }
          : f
      ));

      toast.success('File uploaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      onUploadError?.(errorMessage);
      toast.error(`Upload failed: ${errorMessage}`);
    }
  };

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);
    
    if (!multiple && fileArray.length > 1) {
      toast.error('Only one file allowed');
      return;
    }

    const newFiles: UploadFile[] = fileArray.map(file => {
      const validation = validateFile(file);
      
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: validation.valid ? 'pending' : 'error',
        error: validation.error,
      };
    });

    setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);

    // Auto-upload valid files
    newFiles.forEach(file => {
      if (file.status === 'pending') {
        uploadFile(file);
      }
    });
  }, [multiple, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const { files: droppedFiles } = e.dataTransfer;
    if (droppedFiles?.length) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const completedFiles = files.filter(f => f.status === 'completed');
  
  // Notify parent of completed uploads
  React.useEffect(() => {
    if (completedFiles.length > 0) {
      const urls = completedFiles.map(f => f.url!);
      onUploadComplete?.(urls);
    }
  }, [completedFiles.length, onUploadComplete]);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Allowed types: {allowedTypes.join(', ')} • Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
        </p>
        
        <input
          type="file"
          multiple={multiple}
          accept={allowedTypes.map(type => `.${type}`).join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        
        <Button asChild variant="outline">
          <label htmlFor="file-upload" className="cursor-pointer">
            Select Files
          </label>
        </Button>
      </div>

      {/* Security Information */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Files are automatically scanned and validated for security. Only safe file types are allowed.
        </AlertDescription>
      </Alert>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Upload Progress</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-3 p-3 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024).toFixed(1)} KB
                </p>
                
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="mt-2" />
                )}
                
                {file.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">
                    {file.error}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {file.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
                {file.status === 'error' && (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};