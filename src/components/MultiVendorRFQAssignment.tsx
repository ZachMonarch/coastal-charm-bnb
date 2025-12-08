import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Send, Check, X, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface VendorProfile {
  id: string;
  user_id: string;
  company_name: string;
  specialties: string[];
  service_areas: string[];
  is_verified: boolean;
  rating: number;
  completed_jobs: number;
  availability_status: string;
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  budget_min?: number;
  budget_max?: number;
  skills_required?: string[];
  deadline?: string;
  status: string;
}

interface MultiVendorRFQAssignmentProps {
  projectId?: string;
  onAssignmentComplete?: () => void;
}

export default function MultiVendorRFQAssignment({ 
  projectId, 
  onAssignmentComplete 
}: MultiVendorRFQAssignmentProps) {
  const { user, hasRole } = useAuth();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [inviteMessage, setInviteMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (hasRole('admin')) {
      fetchData();
    }
  }, [hasRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('is_verified', true)
        .eq('availability_status', 'available')
        .order('rating', { ascending: false });

      if (vendorError) throw vendorError;

      const vendorsWithProfiles = (vendorData || []).map(vendor => ({
        ...vendor,
        profiles: Array.isArray(vendor.profiles) ? vendor.profiles[0] : vendor.profiles
      }));
      
      setVendors(vendorsWithProfiles);

      // Fetch projects if not specific project
      if (!projectId) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, location, created_at, tenant_id')
          .in('status', ['open', 'draft'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (projectError) throw projectError;
        setProjects(projectData || []);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSendInvites = async () => {
    if (!selectedProject || selectedVendors.length === 0) {
      toast.error('Please select a project and at least one vendor');
      return;
    }

    setSending(true);
    try {
      const selectedProjectData = projects.find(p => p.id === selectedProject);
      
      // Send invites to selected vendors
      const invitePromises = selectedVendors.map(async (vendorId) => {
        const vendor = vendors.find(v => v.user_id === vendorId);
        if (!vendor) return;

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: vendorId,
            title: 'New Project Invitation',
            message: `You've been invited to submit a proposal for: ${selectedProjectData?.title}`,
            type: 'info',
            action_url: `/vendor/projects/${selectedProject}`
          });

        // Create project assignment record
        await supabase
          .from('project_assignments')
          .insert({
            project_id: selectedProject,
            vendor_id: vendorId,
            assigned_by: user?.id,
            status: 'invited'
          });
      });

      await Promise.all(invitePromises);

      // Update project status
      await supabase
        .from('projects')
        .update({ 
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProject);

      toast.success(`Successfully sent invites to ${selectedVendors.length} vendor(s)`);
      setSelectedVendors([]);
      setInviteMessage('');
      setDialogOpen(false);
      onAssignmentComplete?.();
    } catch (error) {
      console.error('Error sending invites:', error);
      toast.error('Failed to send invites');
    } finally {
      setSending(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = !searchTerm || 
      vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = !specialtyFilter || 
      vendor.specialties?.some(specialty => 
        specialty.toLowerCase().includes(specialtyFilter.toLowerCase())
      );
    
    const matchesVerified = !verifiedOnly || vendor.is_verified;
    
    return matchesSearch && matchesSpecialty && matchesVerified;
  });

  const allSpecialties = Array.from(
    new Set(vendors.flatMap(vendor => vendor.specialties || []))
  ).sort();

  if (!hasRole('admin')) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
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
          <p className="text-muted-foreground">Loading vendors and projects...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Multi-Vendor RFQ Assignment</h1>
        <p className="text-muted-foreground">
          Select and invite multiple vendors to submit proposals for your projects
        </p>
      </div>

      {/* Project Selection */}
      {!projectId && (
        <Card>
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to assign vendors" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title} - {project.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Vendors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Vendors</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Company name or contact name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="specialty">Filter by Specialty</Label>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All specialties</SelectItem>
                  {allSpecialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox 
                id="verified"
                checked={verifiedOnly}
                onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
              />
              <Label htmlFor="verified">Verified vendors only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Vendors ({selectedVendors.length} selected)
            </div>
            {selectedVendors.length > 0 && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Send className="h-4 w-4 mr-2" />
                    Send Invites ({selectedVendors.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Project Invitations</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You are about to send project invitations to {selectedVendors.length} vendor(s).
                    </p>
                    
                    <div>
                      <Label htmlFor="message">Custom Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Add a custom message to the invitation..."
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSendInvites}
                        disabled={sending || !selectedProject}
                        className="btn-primary"
                      >
                        {sending ? 'Sending...' : 'Send Invites'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredVendors.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Vendors Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search criteria.
                </p>
              </div>
            ) : (
              filteredVendors.map((vendor) => (
                <Card 
                  key={vendor.id} 
                  className={`cursor-pointer transition-all ${
                    selectedVendors.includes(vendor.user_id) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleVendorToggle(vendor.user_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Checkbox 
                          checked={selectedVendors.includes(vendor.user_id)}
                          onCheckedChange={() => handleVendorToggle(vendor.user_id)}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{vendor.company_name}</h3>
                            {vendor.is_verified && (
                              <Badge className="bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          {vendor.profiles?.full_name && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {vendor.profiles.full_name}
                            </p>
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
                            <span>⭐ {vendor.rating.toFixed(1)}</span>
                            <span>📋 {vendor.completed_jobs} jobs</span>
                            <span className="capitalize">📅 {vendor.availability_status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}