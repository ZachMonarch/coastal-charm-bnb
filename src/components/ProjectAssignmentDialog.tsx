import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReusableAvatar from './Avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { Search, Star, CheckCircle, Users } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
}

interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  is_verified: boolean;
  rating: number;
  completed_jobs: number;
  specialties: string[];
  profiles?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface ProjectAssignmentDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (projectId: string, vendorId: string) => void;
}

export default function ProjectAssignmentDialog({ 
  project, 
  open, 
  onOpenChange, 
  onAssign 
}: ProjectAssignmentDialogProps) {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState({
    hourly_rate: '',
    estimated_hours: ''
  });

  useEffect(() => {
    if (open && project) {
      fetchVerifiedVendors();
    }
  }, [open, project]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = vendors.filter(vendor => 
        vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors(vendors);
    }
  }, [searchTerm, vendors]);

  const fetchVerifiedVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('is_verified', true)
        .eq('subscription_status', 'active')
        .order('rating', { ascending: false });

      if (error) throw error;

      const vendorsWithProfiles = (data || []).map(vendor => ({
        ...vendor,
        profiles: Array.isArray(vendor.profiles) ? vendor.profiles[0] : vendor.profiles
      }));

      setVendors(vendorsWithProfiles);
      setFilteredVendors(vendorsWithProfiles);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!project || !selectedVendor) return;

    try {
      setLoading(true);
      
      // Call the parent assignment function
      await onAssign(project.id, selectedVendor);
      
      // Create assignment record with additional details
      if (assignmentDetails.hourly_rate || assignmentDetails.estimated_hours) {
        const { error: assignmentError } = await supabase
          .from('project_assignments')
          .insert({
            project_id: project.id,
            vendor_id: selectedVendor,
            assigned_by: user?.id,
            hourly_rate: assignmentDetails.hourly_rate ? parseFloat(assignmentDetails.hourly_rate) : null,
            estimated_hours: assignmentDetails.estimated_hours ? parseInt(assignmentDetails.estimated_hours) : null,
            status: 'active'
          });

        if (assignmentError) {
          console.warn('Assignment details not saved:', assignmentError);
        }
      }

      // Reset form and close
      setSelectedVendor('');
      setAssignmentDetails({ hourly_rate: '', estimated_hours: '' });
      onOpenChange(false);
      
      toast.success('Vendor assigned successfully!');
    } catch (error) {
      console.error('Error in assignment:', error);
      toast.error('Failed to assign vendor');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Vendor to Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
              <p className="text-muted-foreground mb-2">{project.description}</p>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{project.category}</Badge>
                {project.budget_min && project.budget_max && (
                  <span className="text-sm text-muted-foreground">
                    Budget: ${project.budget_min} - ${project.budget_max}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name, company, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Assignment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (Optional)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                placeholder="50.00"
                value={assignmentDetails.hourly_rate}
                onChange={(e) => setAssignmentDetails(prev => ({ 
                  ...prev, 
                  hourly_rate: e.target.value 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours (Optional)</Label>
              <Input
                id="estimated_hours"
                type="number"
                placeholder="40"
                value={assignmentDetails.estimated_hours}
                onChange={(e) => setAssignmentDetails(prev => ({ 
                  ...prev, 
                  estimated_hours: e.target.value 
                }))}
              />
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="space-y-4">
            <Label>Select Vendor</Label>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No vendors found matching your search' : 'No verified vendors available'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredVendors.map((vendor) => (
                  <Card 
                    key={vendor.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedVendor === vendor.user_id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedVendor(vendor.user_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <ReusableAvatar 
                            url={vendor.profiles?.avatar_url}
                            name={vendor.profiles?.full_name || vendor.company_name}
                            size="lg"
                            variant="vendor"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold">{vendor.company_name}</h4>
                              {vendor.is_verified && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            
                            {vendor.profiles?.full_name && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {vendor.profiles.full_name}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-1 mb-2">
                              {vendor.specialties?.slice(0, 3).map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {vendor.specialties?.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{vendor.specialties.length - 3}
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
                            </div>
                          </div>
                        </div>
                        
                        {selectedVendor === vendor.user_id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedVendor || loading}
            >
              {loading ? 'Assigning...' : 'Assign Vendor'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}