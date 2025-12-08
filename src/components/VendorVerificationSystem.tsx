import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReusableAvatar from './Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Shield, CheckCircle, XCircle, Clock, AlertTriangle, FileText, 
  Star, Phone, Mail, MapPin, Building, User, Eye 
} from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VerifiedBadge from './VerifiedBadge';
import EnhancedVerifiedBadge from './EnhancedVerifiedBadge';
import VendorDocumentsList from './VendorDocumentsList';

interface VendorProfile {
  id: string;
  user_id: string;
  company_name: string;
  business_license: string;
  specialties: string[];
  service_areas: string[];
  is_verified: boolean;
  insurance_verified: boolean;
  background_check_verified: boolean;
  rating: number;
  completed_jobs: number;
  response_time_hours: number;
  availability_status: string;
  last_active_at: string;
  created_at: string;
  verification_approved_at?: string;
  verification_approved_by?: string;
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string;
    address: string;
  };
}

export default function VendorVerificationSystem() {
  const { user, hasRole, refreshUser } = useAuth();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (hasRole('admin')) {
      fetchVendors();
    }
  }, [hasRole]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone,
            avatar_url,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vendorsWithProfiles = (data || []).map(vendor => ({
        ...vendor,
        profiles: Array.isArray(vendor.profiles) ? vendor.profiles[0] : vendor.profiles
      }));

      setVendors(vendorsWithProfiles);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (vendorId: string, action: 'approve' | 'reject') => {
    if (!user || !selectedVendor) return;

    setProcessing(true);
    try {
      const updates = {
        is_verified: action === 'approve',
        verification_approved_at: action === 'approve' ? new Date().toISOString() : null,
        verification_approved_by: action === 'approve' ? user.id : null,
        insurance_verified: action === 'approve',
        background_check_verified: action === 'approve',
        subscription_status: action === 'approve' ? 'active' : 'inactive',
        subscription_plan: action === 'approve' ? 'premium' : 'free'
      };

      const { error } = await supabase
        .from('vendor_profiles')
        .update(updates)
        .eq('id', vendorId);

      if (error) throw error;

      // Create notification for vendor
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedVendor.user_id,
          title: `Verification ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          message: action === 'approve' 
            ? 'Congratulations! Your vendor profile has been verified.'
            : `Your verification was not approved. ${verificationNotes || 'Please contact support for more details.'}`,
          type: action === 'approve' ? 'success' : 'warning',
          action_url: '/vendor/dashboard'
        });

      toast.success(`Vendor ${action === 'approve' ? 'verified' : 'rejected'} successfully`);
      
      // Update the user's profile to reflect the new subscription plan in the auth context
      if (action === 'approve') {
        // Trigger auth context refresh by updating subscription directly
        await supabase
          .from('profiles')
          .update({ 
            role: 'vendor',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedVendor.user_id);
      }
      
      // Refresh user context if the current user is the verified vendor
      if (user.id === selectedVendor.user_id) {
        await refreshUser(); // Refresh user data to reflect new subscription plan
      }
      setSelectedVendor(null);
      setVerificationNotes('');
      fetchVendors();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification status');
    } finally {
      setProcessing(false);
    }
  };

  const getVerificationStatus = (vendor: VendorProfile) => {
    if (vendor.is_verified) {
      return {
        status: 'verified',
        label: 'Verified',
        color: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
        icon: CheckCircle
      };
    }
    return {
      status: 'pending',
      label: 'Pending Review',
      color: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
      icon: Clock
    };
  };

  const pendingVendors = vendors.filter(v => !v.is_verified);
  const verifiedVendors = vendors.filter(v => v.is_verified);

  if (!hasRole('admin')) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor verification requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Vendor Verification System</h1>
        <p className="text-muted-foreground">
          Review and manage vendor verification requests
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">{pendingVendors.length}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">{verifiedVendors.length}</div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-sm text-muted-foreground">Total Vendors</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingVendors.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({verifiedVendors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingVendors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending verification requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onSelect={setSelectedVendor}
                  isPending={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          <div className="grid gap-4">
            {verifiedVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={setSelectedVendor}
                isPending={false}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Verification Dialog */}
      <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Verification Details</DialogTitle>
          </DialogHeader>
          
          {selectedVendor && (
            <VendorVerificationDetails
              vendor={selectedVendor}
              verificationNotes={verificationNotes}
              setVerificationNotes={setVerificationNotes}
              onApprove={() => handleVerification(selectedVendor.id, 'approve')}
              onReject={() => handleVerification(selectedVendor.id, 'reject')}
              processing={processing}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface VendorCardProps {
  vendor: VendorProfile;
  onSelect: (vendor: VendorProfile) => void;
  isPending: boolean;
}

function VendorCard({ vendor, onSelect, isPending }: VendorCardProps) {
  const verification = getVerificationStatus(vendor);
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(vendor)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <ReusableAvatar 
              url={vendor.profiles?.avatar_url}
              name={vendor.profiles?.full_name || vendor.company_name}
              size="lg"
              variant="vendor"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold">{vendor.company_name}</h3>
                <EnhancedVerifiedBadge 
                  isVerified={vendor.is_verified} 
                  tier="premium"
                  size="lg" 
                  showText={true}
                  animated={true}
                />
              </div>
              
              {vendor.profiles?.full_name && (
                <p className="text-sm text-muted-foreground mb-2">{vendor.profiles.full_name}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-2">
                {vendor.specialties?.slice(0, 3).map((specialty, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {vendor.specialties?.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{vendor.specialties.length - 3} more
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>{vendor.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>{vendor.completed_jobs} jobs</span>
                </div>
                {vendor.profiles?.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>{vendor.profiles.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <Badge className={verification.color}>
              <verification.icon className="h-3 w-3 mr-1" />
              {verification.label}
            </Badge>
            {isPending && (
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface VendorVerificationDetailsProps {
  vendor: VendorProfile;
  verificationNotes: string;
  setVerificationNotes: (notes: string) => void;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}

function VendorVerificationDetails({
  vendor,
  verificationNotes,
  setVerificationNotes,
  onApprove,
  onReject,
  processing
}: VendorVerificationDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Vendor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <ReusableAvatar 
                url={vendor.profiles?.avatar_url}
                name={vendor.profiles?.full_name || vendor.company_name}
                size="xl"
                variant="vendor"
              />
              <div>
                <h3 className="font-semibold">{vendor.company_name}</h3>
                {vendor.profiles?.full_name && (
                  <p className="text-sm text-muted-foreground">{vendor.profiles.full_name}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{vendor.profiles?.email}</span>
              </div>
              {vendor.profiles?.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.profiles.phone}</span>
                </div>
              )}
              {vendor.profiles?.address && (
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{vendor.profiles.address}</span>
                </div>
              )}
              {vendor.business_license && (
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>License: {vendor.business_license}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Services & Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Specialties</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {vendor.specialties?.map((specialty, idx) => (
                  <Badge key={idx} variant="secondary">{specialty}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Service Areas</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {vendor.service_areas?.map((area, idx) => (
                  <Badge key={idx} variant="outline">{area}</Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Rating</Label>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-warning" />
                  <span className="font-medium">{vendor.rating.toFixed(1)}/5.0</span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Completed Jobs</Label>
                <p className="font-medium">{vendor.completed_jobs}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Response Time</Label>
                <p className="font-medium">{vendor.response_time_hours}h</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Badge className="capitalize">{vendor.availability_status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-info" />
                <span>Background Check</span>
              </div>
              <Badge className={vendor.background_check_verified ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}>
                {vendor.background_check_verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Insurance Certificate</span>
              </div>
              <Badge className={vendor.insurance_verified ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}>
                {vendor.insurance_verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-warning" />
                <span>Business License</span>
              </div>
              <Badge className={vendor.business_license ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'}>
                {vendor.business_license ? 'Provided' : 'Missing'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorDocumentsList 
            vendorId={vendor.user_id} 
            isAdmin={true}
            onVerificationUpdate={() => {
              // Refresh vendor data after document verification
              // This could trigger a parent refresh if needed
            }}
          />
        </CardContent>
      </Card>

      {/* Verification Notes */}
      {!vendor.is_verified && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Verification Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add any notes about the verification decision..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onReject}
              disabled={processing}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Verification
            </Button>
            <Button
              onClick={onApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Verification
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getVerificationStatus(vendor: VendorProfile) {
  if (vendor.is_verified) {
    return {
      status: 'verified',
      label: 'Verified',
      color: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
      icon: CheckCircle
    };
  }
  return {
    status: 'pending',
    label: 'Pending Review',
    color: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
    icon: Clock
  };
}