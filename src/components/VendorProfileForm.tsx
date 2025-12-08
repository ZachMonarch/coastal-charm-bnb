import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import ReusableAvatar from './Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Plus, Building, Phone, Mail, MapPin, FileText, Camera } from 'lucide-react';
import EnhancedFileUpload from './EnhancedFileUpload';
import VendorDocumentsList from './VendorDocumentsList';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface VendorProfileFormProps {
  onUpdate?: () => void;
}

const specialtyOptions = [
  'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Painting', 'Flooring',
  'Carpentry', 'Appliance Repair', 'Landscaping', 'General Maintenance',
  'Emergency Repair', 'Security Systems', 'Cleaning Services'
];

const serviceAreaOptions = [
  'Downtown District', 'Riverside', 'West End', 'Garden District',
  'East Side', 'North Hills', 'South Bay', 'Central Valley'
];

export default function VendorProfileForm({ onUpdate }: VendorProfileFormProps) {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    company_name: '',
    business_license: '',
    specialties: [] as string[],
    service_areas: [] as string[],
    phone: '',
    email: '',
    address: '',
    avatar_url: '',
    description: ''
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newServiceArea, setNewServiceArea] = useState('');

  useEffect(() => {
    if (user) {
      fetchVendorProfile();
    }
  }, [user]);

  const fetchVendorProfile = async () => {
    if (!user) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, address, city, state, zip_code')
        .eq('id', user.id)
        .single();

      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('id, user_id, company_name, description, avatar_url, specialties, certifications, business_license, service_areas, response_time_hours, availability_status, website')
        .eq('user_id', user.id)
        .single();

      // Prioritize vendor_profiles.avatar_url for vendors (primary source)
      const avatarUrl = vendorProfile?.avatar_url || profile?.avatar_url || '';

      if (profile && !profileError) {
        setProfileData(prev => ({
          ...prev,
          phone: profile.phone || '',
          email: profile.email || '',
          address: profile.address || '',
          avatar_url: avatarUrl
        }));
      }

      if (vendorProfile && !vendorError) {
        setProfileData(prev => ({
          ...prev,
          company_name: vendorProfile.company_name || '',
          business_license: vendorProfile.business_license || '',
          specialties: vendorProfile.specialties || [],
          service_areas: vendorProfile.service_areas || [],
          description: vendorProfile.description || '',
          avatar_url: avatarUrl // Ensure avatar is set from vendor profile
        }));
      }
    } catch (error) {
      logger.error('Error fetching vendor profile', { 
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (files: File[], documentType: string = 'business_document') => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          logger.error('File upload error', { 
            fileName: file.name,
            error: uploadError.message 
          });
          continue;
        }

        // Get public URL for documents bucket (it's public)
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        // Save document metadata to vendor_documents table
        const { error: dbError } = await supabase
          .from('vendor_documents')
          .insert({
            vendor_id: user.id,
            document_type: documentType,
            file_name: file.name,
            file_path: fileName,
            file_url: publicUrl,
            mime_type: file.type,
            file_size: file.size
          });

        if (dbError) {
          logger.error('Document metadata save error', { 
            fileName: file.name,
            error: dbError.message 
          });
        }
      }
      
      // Refresh the documents list and profile data
      await fetchVendorProfile();
      
    } catch (error) {
      // Log error to security monitoring (no console in production)
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarUpload = async (files: File[]) => {
    if (!user?.id || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);

    try {
      // Upload to public-media bucket for instant display
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('public-media')
        .upload(`avatars/${filePath}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL (instant access, no signed URL needed)
      const { data: { publicUrl } } = supabase.storage
        .from('public-media')
        .getPublicUrl(`avatars/${filePath}`);

      // Save to vendor_documents to trigger avatar sync (profiles + vendor_profiles)
      const { error: docError } = await supabase
        .from('vendor_documents')
        .insert({
          vendor_id: user.id,
          document_type: 'profile_image',
          file_name: `avatar.${fileExt}`,
          file_path: `avatars/${filePath}`,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type
        });

      if (docError) throw docError;

      // Update local state immediately for instant UI feedback
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // Refresh user context to reflect changes across app
      await refreshUser();
      
      // Also refetch vendor profile to ensure consistency
      await fetchVendorProfile();
      
      toast.success('Profile image updated successfully');
    } catch (error: any) {
      // Log error to security monitoring (no console in production)
      toast.error('Failed to upload profile image');
    } finally {
      setIsUploading(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty && !profileData.specialties.includes(newSpecialty)) {
      handleInputChange('specialties', [...profileData.specialties, newSpecialty]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    handleInputChange('specialties', profileData.specialties.filter(s => s !== specialty));
  };

  const addServiceArea = () => {
    if (newServiceArea && !profileData.service_areas.includes(newServiceArea)) {
      handleInputChange('service_areas', [...profileData.service_areas, newServiceArea]);
      setNewServiceArea('');
    }
  };

  const removeServiceArea = (area: string) => {
    handleInputChange('service_areas', profileData.service_areas.filter(a => a !== area));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: profileData.phone,
          address: profileData.address,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update vendor_profiles table
      const { error: vendorError } = await supabase
        .from('vendor_profiles')
        .upsert({
          user_id: user.id,
          company_name: profileData.company_name,
          business_license: profileData.business_license,
          specialties: profileData.specialties,
          service_areas: profileData.service_areas,
          avatar_url: profileData.avatar_url,
          last_active_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (vendorError) throw vendorError;

      toast.success('Profile updated successfully!');
      
      // Refresh auth context to update avatar
      if (refreshUser) refreshUser();
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Vendor Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center gap-6">
              <ReusableAvatar 
                url={profileData.avatar_url}
                name={profileData.company_name || user?.email || 'Vendor'}
                size="xxl"
                variant="vendor"
              />
              <div className="space-y-2">
                <Label htmlFor="avatar-upload">Profile Photo</Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload([file]);
                  }}
                  className="w-auto"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a professional logo or photo
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={profileData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Your Company Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_license">Business License Number</Label>
                <Input
                  id="business_license"
                  value={profileData.business_license}
                  onChange={(e) => handleInputChange('business_license', e.target.value)}
                  placeholder="License Number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street Address, City, State, ZIP"
                rows={2}
              />
            </div>

            {/* Specialties */}
            <div className="space-y-4">
              <Label>Specialties</Label>
              <div className="flex gap-2">
                <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtyOptions
                      .filter(option => !profileData.specialties.includes(option))
                      .map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addSpecialty} disabled={!newSpecialty}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {specialty}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeSpecialty(specialty)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Service Areas */}
            <div className="space-y-4">
              <Label>Service Areas</Label>
              <div className="flex gap-2">
                <Select value={newServiceArea} onValueChange={setNewServiceArea}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add service area" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceAreaOptions
                      .filter(option => !profileData.service_areas.includes(option))
                      .map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addServiceArea} disabled={!newServiceArea}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.service_areas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {area}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeServiceArea(area)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-4">
              <Label>Business Documents</Label>
              <EnhancedFileUpload
                bucket="vendor-assets"
                multiple={true}
                maxFiles={10}
                useVendorUpload={true}
                label="Upload Business Documents"
                description="Upload insurance certificates, licenses, and certifications (max 5MB each)"
                saveToDatabase={{
                  table: 'vendor_documents',
                  documentType: 'business_document',
                  vendorId: user?.id
                }}
                onUploadComplete={(urls, names) => {
                  toast.success(`${names.length} document(s) uploaded successfully`);
                  fetchVendorProfile(); // Refresh to show new documents
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Display Uploaded Documents */}
      <VendorDocumentsList 
        vendorId={user?.id}
        isAdmin={false}
        onVerificationUpdate={fetchVendorProfile}
      />
    </div>
  );
}