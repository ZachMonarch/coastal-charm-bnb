import { useState, useEffect } from "react";
import { Plus, Search, Calendar, DollarSign, Clock, AlertTriangle, CheckCircle, User, Building, Edit, Trash2, Users, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminRFQSystem from "@/components/AdminRFQSystem";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import { logger } from '@/utils/logger';
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  preferred_start_date: string;
  location: string;
  created_by: string;
  assigned_vendor_id?: string;
  property_id?: number;
  created_at: string;
  updated_at: string;
  skills_required: string[];
  assigned_vendor?: {
    id: string;
    full_name: string;
    email: string;
  };
  progress?: number;
}

interface NewProject {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget_min: number;
  budget_max: number;
  deadline: string;
  preferred_start_date: string;
  location: string;
  property_id?: number;
  skills_required: string[];
}

export default function AdminProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<NewProject>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    budget_min: 0,
    budget_max: 0,
    deadline: '',
    preferred_start_date: '',
    location: '',
    skills_required: []
  });

  useEffect(() => {
    fetchProjects();
    fetchVendors();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, preferred_start_date, location, created_at, created_by, assigned_vendor_id, property_id, tenant_id, updated_at, skills_required, attachments')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Process projects to add vendor info where needed
      const processedProjects = await Promise.all((data || []).map(async (project) => {
        if (project.assigned_vendor_id) {
          // Fetch vendor profile
          const { data: vendorProfile } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', project.assigned_vendor_id)
            .single();

          return {
            ...project,
            assigned_vendor: vendorProfile || undefined
          };
        }
        return project;
      }));

      setProjects(processedProjects);
    } catch (error) {
      logger.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data: vendorProfiles, error } = await supabase
        .from('vendor_profiles')
        .select('id, user_id, company_name, specialties, service_areas, rating, is_verified, certifications, subscription_status, email, phone')
        .eq('is_verified', true)
        .limit(100);

      if (error) throw error;

      // Fetch user profiles for each vendor
      const vendorsWithProfiles = await Promise.all(
        (vendorProfiles || []).map(async (vendor) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', vendor.user_id)
            .single();

          return {
            ...vendor,
            profiles: profileData || { id: vendor.user_id, full_name: 'Unknown', email: 'N/A' }
          };
        })
      );

      setVendors(vendorsWithProfiles);
    } catch (error) {
      logger.error('Error fetching vendors:', error);
    }
  };

  const createProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('projects')
        .insert({
          ...newProject,
          created_by: user.id,
          status: 'open'
        });

      if (error) throw error;

      toast.success('Project created successfully');
      setIsCreateOpen(false);
      setNewProject({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        budget_min: 0,
        budget_max: 0,
        deadline: '',
        preferred_start_date: '',
        location: '',
        skills_required: []
      });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, status } : p
      ));

      toast.success('Project status updated');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const assignVendor = async (projectId: string, vendorId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ assigned_vendor_id: vendorId, status: 'in_progress' })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Vendor assigned successfully');
      setIsAssignOpen(false);
      fetchProjects();
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || project.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      case 'in_progress': return 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40';
      case 'open': return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      case 'high': return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'medium': return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'low': return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'open': return <Calendar className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <PrivatePageWrapper title="Project Management">
      <EnhancedPageBackground pattern="dots" gradient="radial" primaryColor="primary" intensity="subtle">
        <div className="space-y-6">
          {/* PageHero */}
          <PageHero
            title="Project Management"
            description="Manage property improvement projects and assign vendors"
            icon={FolderKanban}
            variant="gradient"
            stats={[
              { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'info' },
              { label: 'In Progress', value: projects.filter(p => p.status === 'in_progress').length, icon: Clock, color: 'warning' },
              { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, icon: CheckCircle, color: 'success' },
              { label: 'Open', value: projects.filter(p => p.status === 'open').length, icon: Calendar, color: 'primary' },
            ]}
            actions={[
              { label: 'Create Project', href: '#', variant: 'default' },
            ]}
          />

          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects">Project Management</TabsTrigger>
              <TabsTrigger value="rfq">RFQ System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="space-y-6">
              {/* Filters */}
              <Card variant="glass" className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 shadow-md">
                          <Plus className="h-4 w-4" />
                          Create Project
                        </Button>
                      </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>Add a new property improvement project</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                          id="title"
                          value={newProject.title}
                          onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter project title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newProject.description}
                          onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the project requirements"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={newProject.category} onValueChange={(value) => setNewProject(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Plumbing">Plumbing</SelectItem>
                              <SelectItem value="Electrical">Electrical</SelectItem>
                              <SelectItem value="HVAC">HVAC</SelectItem>
                              <SelectItem value="Landscaping">Landscaping</SelectItem>
                              <SelectItem value="Cleaning">Cleaning</SelectItem>
                              <SelectItem value="Maintenance">General Maintenance</SelectItem>
                              <SelectItem value="Renovation">Renovation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select value={newProject.priority} onValueChange={(value: any) => setNewProject(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="budget_min">Min Budget ($)</Label>
                          <Input
                            id="budget_min"
                            type="number"
                            value={newProject.budget_min}
                            onChange={(e) => setNewProject(prev => ({ ...prev, budget_min: Number(e.target.value) }))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="budget_max">Max Budget ($)</Label>
                          <Input
                            id="budget_max"
                            type="number"
                            value={newProject.budget_max}
                            onChange={(e) => setNewProject(prev => ({ ...prev, budget_max: Number(e.target.value) }))}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newProject.location}
                          onChange={(e) => setNewProject(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Project location or property address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_date">Preferred Start Date</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={newProject.preferred_start_date}
                            onChange={(e) => setNewProject(prev => ({ ...prev, preferred_start_date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="deadline">Deadline</Label>
                          <Input
                            id="deadline"
                            type="date"
                            value={newProject.deadline}
                            onChange={(e) => setNewProject(prev => ({ ...prev, deadline: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createProject}>
                          Create Project
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="neumorphic-card hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(project.status)}
                            {project.status.replace('_', ' ')}
                          </div>
                        </Badge>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                        <Badge variant="outline">{project.category}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Budget Range</p>
                          <p className="font-medium">
                            ${project.budget_min?.toLocaleString()} - ${project.budget_max?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Deadline</p>
                          <p className="font-medium">
                            {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                      </div>

                      {project.location && (
                        <div>
                          <p className="text-muted-foreground text-sm">Location</p>
                          <p className="font-medium text-sm">{project.location}</p>
                        </div>
                      )}

                      {project.assigned_vendor && (
                        <div>
                          <p className="text-muted-foreground text-sm">Assigned Vendor</p>
                          <p className="font-medium text-sm">{project.assigned_vendor.full_name}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedProject(project);
                            setIsAssignOpen(true);
                          }}
                        >
                          <User className="h-4 w-4 mr-1" />
                          {project.assigned_vendor ? 'Reassign' : 'Assign'} Vendor
                        </Button>
                        <Select 
                          value={project.status} 
                          onValueChange={(value) => updateProjectStatus(project.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Assign Vendor Dialog */}
              <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Vendor</DialogTitle>
                    <DialogDescription>
                      Select a verified vendor for {selectedProject?.title}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {vendors.map((vendor) => (
                        <Card key={vendor.id} className="p-3 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{vendor.company_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Rating: {vendor.rating}/5 • {vendor.completed_jobs} jobs completed
                              </p>
                              {vendor.profiles && (
                                <p className="text-sm text-muted-foreground">
                                  Contact: {vendor.profiles.full_name}
                                </p>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => selectedProject && assignVendor(selectedProject.id, vendor.user_id)}
                            >
                              Assign
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            <TabsContent value="rfq">
              <AdminRFQSystem />
            </TabsContent>
          </Tabs>
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
