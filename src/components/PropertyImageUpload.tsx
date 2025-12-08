import { useState, useCallback } from 'react';
import { Upload, X, Image, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PropertyImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadProgress?: number;
}

export default function PropertyImageUpload({ 
  onImagesChange, 
  maxImages = 10, 
  maxSizeMB = 5 
}: PropertyImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload only image files (JPG, PNG, GIF, WebP)",
        variant: "destructive"
      });
      return false;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${maxSizeMB}MB`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    const validFiles: File[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (validateFile(file)) {
        validFiles.push(file);
      }
    }

    if (images.length + validFiles.length > maxImages) {
      toast({
        title: "Too Many Images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive"
      });
      return;
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    const newImages: UploadedImage[] = [];

    for (const file of validFiles) {
      const id = Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);

      const newImage: UploadedImage = {
        id,
        file,
        url,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0
      };

      newImages.push(newImage);
    }

    // Simulate upload progress
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // Simulate upload with progress
    for (let i = 0; i < newImages.length; i++) {
      const image = newImages[i];
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setImages(current => 
          current.map(img => 
            img.id === image.id 
              ? { ...img, uploadProgress: progress }
              : img
          )
        );
      }
    }

    setUploading(false);
    onImagesChange(updatedImages);

    toast({
      title: "Images Uploaded",
      description: `Successfully uploaded ${validFiles.length} image(s)`,
    });
  }, [images, maxImages, maxSizeMB, onImagesChange, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeImage = useCallback((id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    
    // Clean up object URL
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }
  }, [images, onImagesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Property Images
          </CardTitle>
          <CardDescription>
            Upload high-quality images of your property. Drag and drop or click to select files.
            Maximum {maxImages} images, {maxSizeMB}MB each.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
              ${dragOver 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-muted-foreground/30 hover:border-primary/50'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="neumorphic-inset p-4 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {dragOver ? 'Drop images here' : 'Upload Property Images'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your images here, or click the button below
                </p>
                
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading || images.length >= maxImages}
                />
                
                <label htmlFor="image-upload">
                  <Button 
                    variant="outline" 
                    className="cursor-pointer"
                    disabled={uploading || images.length >= maxImages}
                    asChild
                  >
                    <span>
                      Select Images
                    </span>
                  </Button>
                </label>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>JPG, PNG, GIF, WebP</span>
                <span>•</span>
                <span>Max {maxSizeMB}MB each</span>
                <span>•</span>
                <span>{images.length}/{maxImages} images</span>
              </div>
            </div>
          </div>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Uploaded Images ({images.length})
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="neumorphic-card p-2 rounded-2xl">
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      
                      {/* Upload Progress */}
                      {(image.uploadProgress !== undefined && image.uploadProgress < 100) && (
                        <div className="mt-2">
                          <Progress value={image.uploadProgress} className="h-1" />
                          <p className="text-xs text-center mt-1 text-muted-foreground">
                            {image.uploadProgress}%
                          </p>
                        </div>
                      )}

                      {/* Image Info */}
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium truncate" title={image.name}>
                          {image.name}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(image.size)}</span>
                          <Badge variant="secondary" className="text-xs">
                            {image.type.split('/')[1].toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Guidelines */}
          <div className="mt-6 p-4 glass-card rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-sm mb-2">Image Upload Guidelines</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use high-resolution images (minimum 1200px width recommended)</li>
                  <li>• Include exterior views, interior rooms, amenities, and neighborhood</li>
                  <li>• Ensure good lighting and clear, unobstructed views</li>
                  <li>• First image will be used as the main property photo</li>
                  <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}