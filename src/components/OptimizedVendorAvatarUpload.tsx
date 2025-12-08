import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOptimizedVendorUpload } from '@/hooks/useOptimizedVendorUpload';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export default function OptimizedVendorAvatarUpload() {
  const { user } = useAuth();
  const { uploadAvatar, uploadProgress } = useOptimizedVendorUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const avatarProgress = Object.values(uploadProgress).find((p) =>
    p.fileId.startsWith('avatar_')
  );

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    await uploadAvatar(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'VU';

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-border">
            <AvatarImage src={user?.avatar_url || ''} alt="Vendor avatar" />
            <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          {avatarProgress?.status === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {avatarProgress?.status === 'success' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          )}

          {avatarProgress?.status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          )}
        </div>

        {avatarProgress?.status === 'uploading' && (
          <div className="w-full max-w-xs">
            <Progress value={avatarProgress.progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center mt-1">
              Uploading {avatarProgress.fileName}...
            </p>
          </div>
        )}

        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors w-full max-w-md
            ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload avatar"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Camera className="h-6 w-6 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">
                Drop your avatar here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB • JPG, PNG, WEBP
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarProgress?.status === 'uploading'}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>

        {avatarProgress?.status === 'error' && (
          <p className="text-xs text-destructive text-center max-w-md">
            {avatarProgress.error || 'Upload failed. Please try again.'}
          </p>
        )}
      </div>
    </Card>
  );
}
