import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, UserPlus, CheckCircle, XCircle, Mail, Phone, Star, 
  Settings, Edit, Shield, Crown, DollarSign, Calendar, Building, Search
} from 'lucide-react';
import { useVendorProfiles } from '@/hooks/useVendors';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminVendorInvite from './AdminVendorInvite';
import VendorVerificationSystem from './VendorVerificationSystem';
import VerifiedBadge from './VerifiedBadge';
import { logger } from '@/utils/logger';

export default function AdminVendorManagement() {
  const { vendors, loading, refetch } = useVendorProfiles();
  const { projects } = useProjects();
  const { user } = useAuth();
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const openProjects = projects.filter(p => p.status === 'open');
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'verified' && vendor.is_verified) ||
      (statusFilter === 'unverified' && !vendor.is_verified);
    return matchesSearch && matchesStatus;
  });

  const assignVendorToProject = async () => {
    if (!selectedVendor || !selectedProject) {
      toast.error('Please select both vendor and project');
      return;
    }

    setProcessing(true);
    try {
      // Use secure RPC function instead of direct database mutation
      const { data, error } = await supabase.rpc('admin_assign_vendor_to_project_secure', {
        p_project_id: selectedProject,
        p_vendor_id: selectedVendor.user_id,
      });

      if (error) throw error;

      toast.success('Vendor assigned to project successfully!');
      setShowAssignDialog(false);
      setSelectedVendor(null);
      setSelectedProject('');
      refetch();
    } catch (error: any) {
      logger.error('Error assigning vendor to project', { 
        vendorId: selectedVendor?.id,
        projectId: selectedProject,
        errorMessage: error.message 
      });
      toast.error(error.message || 'Failed to assign vendor to project');
    } finally {
      setProcessing(false);
    }
  };

  const updateVendorStatus = async (vendorId: string, status: 'available' | 'busy' | 'inactive') => {
    try {
      // Use secure RPC function instead of direct database mutation
      const { data, error } = await supabase.rpc('admin_update_vendor_status_secure', {
        p_vendor_id: vendorId,
        p_status: status,
      });

      if (error) throw error;
      
      toast.success('Vendor status updated successfully');
      refetch();
    } catch (error: any) {
      logger.error('Error updating vendor status', { 
        vendorId,
        status,
        errorMessage: error.message 
      });
      toast.error(error.message || 'Failed to update vendor status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-muted-foreground">Manage vendors, assignments, and verification</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAssignDialog(true)}
            disabled={!selectedVendor || openProjects.length === 0}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign to Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-sm text-muted-foreground">Total Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">{vendors.filter(v => v.is_verified).length}</div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">{vendors.filter(v => !v.is_verified).length}</div>
            <p className="text-sm text-muted-foreground">Pending Verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{vendors.filter(v => v.availability_status === 'available').length}</div>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendors">All Vendors</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="invitations">Invite Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vendors List */}
          <div className="grid gap-4">
            {filteredVendors.map((vendor) => (
              <Card 
                key={vendor.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedVendor?.id === vendor.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedVendor(selectedVendor?.id === vendor.id ? null : vendor)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{vendor.company_name}</h3>
                          <VerifiedBadge isVerified={vendor.is_verified} />
                          <Badge 
                            className={`capitalize ${
                              vendor.availability_status === 'available' ? 'bg-success/10 text-success border-success/30' :
                              vendor.availability_status === 'busy' ? 'bg-warning/10 text-warning border-warning/30' :
                              'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {vendor.availability_status}
                          </Badge>
                        </div>
                        
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-warning" />
                            <span>{vendor.rating.toFixed(1)} Rating</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>{vendor.completed_jobs} Jobs</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-info" />
                            <span>{vendor.response_time_hours}h Response</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Crown className="h-4 w-4 text-primary" />
                            <span>Free Plan</span>
                          </div>
                        </div>

                        {vendor.specialties && vendor.specialties.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1">
                              {vendor.specialties.slice(0, 4).map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {vendor.specialties.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{vendor.specialties.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Select 
                        value={vendor.availability_status}
                        onValueChange={(value) => updateVendorStatus(vendor.id, value as any)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedVendor?.id === vendor.id && (
                        <Badge className="bg-primary text-primary-foreground text-center">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verification">
          <VendorVerificationSystem />
        </TabsContent>

        <TabsContent value="invitations">
          <AdminVendorInvite />
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Vendor to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVendor && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Selected Vendor:</h4>
                <p className="text-sm text-muted-foreground">{selectedVendor.company_name}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {openProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title} - {project.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAssignDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={assignVendorToProject}
                disabled={processing || !selectedProject}
              >
                {processing ? 'Assigning...' : 'Assign Vendor'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}