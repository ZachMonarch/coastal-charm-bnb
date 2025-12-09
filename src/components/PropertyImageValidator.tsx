import { useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface PropertyImageValidatorProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  minImages?: number;
  maxImages?: number;
  maxSizeInMB?: number;
}

export function PropertyImageValidator({
  images,
  onImagesChange,
  minImages = 1,
  maxImages = 10,
  maxSizeInMB = 5,
}: PropertyImageValidatorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const validateImage = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`;
    }

    // Check file size
    const maxSizeBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `${file.name}: File too large. Maximum size is ${maxSizeInMB}MB.`;
    }

    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max images limit
    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    setErrors([]);
    setUploading(true);
    setUploadProgress(0);

    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    // Validate all files first
    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setUploading(false);
      return;
    }

    // Convert files to base64 URLs for preview
    // In production, upload to Supabase Storage
    const imageUrls: string[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onload = (event) => {
          if (event.target?.result) {
            imageUrls.push(event.target.result as string);
          }
          setUploadProgress(((i + 1) / validFiles.length) * 100);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    onImagesChange([...images, ...imageUrls]);
    setUploading(false);
    toast.success(`${validFiles.length} image(s) uploaded successfully`);

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.info('Image removed');
  };

  const isValid = images.length >= minImages && images.length <= maxImages;
  const remainingSlots = maxImages - images.length;

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <AlertCircle className="h-5 w-5 text-warning" />
        )}
        <span className="text-sm font-medium">
          {images.length} of {minImages} required images uploaded
        </span>
        {remainingSlots > 0 && (
          <span className="text-sm text-muted-foreground">
            ({remainingSlots} slots remaining)
          </span>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeImage(index)}
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                      Primary
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {remainingSlots > 0 && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-8 hover:border-primary transition-colors cursor-pointer">
          <input
            type="file"
            id="property-images"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="property-images"
            className="flex flex-col items-center cursor-pointer w-full"
          >
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            <p className="text-sm font-medium mb-1">
              {uploading ? 'Uploading images...' : 'Upload property images'}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Click to select up to {remainingSlots} more image
              {remainingSlots !== 1 ? 's' : ''}
              <br />
              Max {maxSizeInMB}MB per image • JPEG, PNG, WebP
            </p>
          </label>
        </div>
      )}

      {/* Requirements Info */}
      {!isValid && images.length < minImages && (
        <Alert>
          <ImageIcon className="h-4 w-4" />
          <AlertDescription>
            Please upload at least {minImages} image{minImages !== 1 ? 's' : ''} to
            meet property listing requirements.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
