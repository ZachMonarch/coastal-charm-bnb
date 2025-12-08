import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorFileUploadResult {
  success: boolean;
  fileUrl?: string;
  signedUrl?: string;
  error?: string;
}

export interface VendorFileUploadOptions {
  documentType?: string;
  generateSignedUrl?: boolean;
  signedUrlExpiry?: number; // in seconds, default 1 hour
}

// Allowed file types for vendor uploads
export const VENDOR_ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const VENDOR_FILE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'
];

// Maximum file size: 5MB
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validates a file for vendor uploads
 */
export function validateVendorFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
    };
  }

  // Check file type
  const isValidMimeType = VENDOR_ALLOWED_FILE_TYPES.includes(file.type);
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidExtension = VENDOR_FILE_EXTENSIONS.includes(fileExtension);

  if (!isValidMimeType && !isValidExtension) {
    return {
      valid: false,
      error: `File type not supported for "${file.name}". Allowed types: ${VENDOR_FILE_EXTENSIONS.join(', ')}`
    };
  }

  // Security check: ensure file extension matches MIME type for images
  if (file.type.startsWith('image/')) {
    const mimeExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    };
    
    const expectedExtensions = mimeExtensionMap[file.type];
    if (expectedExtensions && !expectedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `File extension does not match file type for "${file.name}"`
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove special characters and spaces, keep only alphanumeric, dots, hyphens, underscores
  return filename.replace(/[^a-zA-Z0-9.-_]/g, '_');
}

/**
 * Generates the storage path for vendor files
 */
export function generateVendorFilePath(userId: string, filename: string): string {
  const sanitizedFilename = sanitizeFilename(filename);
  return `vendor-assets/${userId}/${sanitizedFilename}`;
}

/**
 * Uploads a file to vendor storage and optionally saves to database
 */
export async function uploadVendorFile(
  file: File,
  userId: string,
  options: VendorFileUploadOptions = {}
): Promise<VendorFileUploadResult> {
  const {
    documentType = 'business_document',
    generateSignedUrl = true,
    signedUrlExpiry = 3600 // 1 hour
  } = options;

  try {
    // Validate file
    const validation = validateVendorFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate file path
    const filePath = generateVendorFilePath(userId, file.name);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendor-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      // Error logged server-side; return user-friendly message
      return { 
        success: false, 
        error: `Failed to upload file: ${uploadError.message}` 
      };
    }

    // Generate signed URL for immediate access
    let signedUrl = '';
    if (generateSignedUrl) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('vendor-assets')
        .createSignedUrl(uploadData.path, signedUrlExpiry);

      if (signedError) {
        // Error logged server-side
      } else {
        signedUrl = signedData?.signedUrl || '';
      }
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('vendor_documents')
      .insert({
        vendor_id: userId,
        document_type: documentType,
        file_name: file.name,
        file_path: uploadData.path,
        file_url: signedUrl, // Store signed URL for immediate access
        file_size: file.size,
        mime_type: file.type
      });

    if (dbError) {
      // Error logged server-side
      toast.error(`Failed to save ${file.name} to database`);
    }

    return {
      success: true,
      fileUrl: uploadData.path,
      signedUrl: signedUrl
    };

  } catch (error) {
    // Error logged server-side
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Generates a fresh signed URL for accessing a vendor file
 */
export async function getVendorFileSignedUrl(
  filePath: string,
  expirySeconds: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('vendor-assets')
      .createSignedUrl(filePath, expirySeconds);

    if (error) {
      // Error logged server-side
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    // Error logged server-side
    return null;
  }
}

/**
 * Downloads a vendor file using signed URL
 */
export async function downloadVendorFile(filePath: string, fileName: string): Promise<void> {
  try {
    const signedUrl = await getVendorFileSignedUrl(filePath, 300); // 5 minutes for download
    
    if (!signedUrl) {
      toast.error('Failed to generate download link');
      return;
    }

    // Create temporary download link
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    // Error logged server-side
    toast.error('Failed to download file');
  }
}
