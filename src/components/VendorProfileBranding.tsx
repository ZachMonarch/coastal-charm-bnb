import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function VendorProfileBranding() {
  const { user, refreshUser } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const vendor = user?.vendor;
  const avatarUrl = vendor?.avatarUrl || user?.avatar_url;
  const logoUrl = vendor?.avatarUrl;

  const handleFileUpload = async (
    file: File,
    type: 'avatar' | 'logo',
    setLoading: (loading: boolean) => void
  ) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to vendor_avatars bucket (RLS-compliant path structure)
      const { error: uploadError } = await supabase.storage
        .from('vendor_avatars')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vendor_avatars')
        .getPublicUrl(filePath);

      // Insert into vendor_documents to trigger sync
      const { error: docError } = await supabase
        .from('vendor_documents')
        .insert({
          vendor_id: user.id,
          document_type: type === 'avatar' ? 'profile_image' : 'logo',
          file_name: fileName,
          file_path: filePath,
          file_url: publicUrl,
          mime_type: file.type,
          is_verified: false
        });

      if (docError) throw docError;

      toast.success(`${type === 'avatar' ? 'Avatar' : 'Logo'} uploaded successfully`);
      await refreshUser();
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(error.message || `Failed to upload ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle>Profile Avatar</CardTitle>
          <CardDescription>
            Upload your professional profile photo. This will be displayed across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {vendor?.companyName?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                Recommended: Square image, at least 400x400px
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploadingAvatar}
                  className="border-primary/20"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Avatar
                    </>
                  )}
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'avatar', setUploadingAvatar);
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>
            Upload your company logo for professional branding in proposals and contracts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {logoUrl ? (
              <div className="h-32 w-32 border-4 border-primary/20 rounded-lg flex items-center justify-center bg-card overflow-hidden">
                <img src={logoUrl} alt="Company Logo" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="h-32 w-32 border-4 border-dashed border-primary/20 rounded-lg flex items-center justify-center bg-muted/30">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                Recommended: Transparent PNG, 500x200px or similar aspect ratio
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploadingLogo}
                  className="border-primary/20"
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'logo', setUploadingLogo);
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Guidelines */}
      <Card className="border-primary/20 shadow-lg bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Brand Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Use high-quality images with good lighting and clear focus</li>
            <li>Avatar should be a professional headshot or company mascot</li>
            <li>Logo should be on transparent background when possible</li>
            <li>Maximum file size: 5MB per image</li>
            <li>Supported formats: JPEG, PNG, WebP</li>
            <li>Images are publicly accessible for your branding needs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
