import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users, FileText, Upload, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DocumentManagement from './DocumentManagement';
import { getStatusColor, getPriorityColor } from '@/utils/themeColors';

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
  skills_required: string[];
  created_at: string;
  created_by: string;
  assigned_vendor_id?: string;
  property_id?: number;
}

interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  is_verified: boolean;
  rating: number;
  subscription_status: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

export default function EnhancedAdminProjectManagement() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAssignVendor, setShowAssignVendor] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    budget_min: 0,
    budget_max: 0,
    deadline: '',
    preferred_start_date: '',
    location: '',
    skills_required: [] as string[]
  });

  useEffect(() => {
    fetchProjects();
    fetchVendors();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, preferred_start_date, location, skills_required, created_at, created_by, assigned_vendor_id, property_id, tenant_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      logger.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data: vendorData, error } = await supabase
        .from('vendor_profiles')
        .select(`
          id,
          user_id,
          company_name,
          is_verified,
          rating,
          subscription_status,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('is_verified', true)
        .eq('subscription_status', 'active')
        .limit(100);

      if (error) throw error;

      const vendorsWithProfiles = (vendorData || []).map(vendor => ({
        ...vendor,
        profile: Array.isArray(vendor.profiles) ? vendor.profiles[0] : vendor.profiles
      }));

      setVendors(vendorsWithProfiles);
    } catch (error) {
      logger.error('Error fetching vendors:', error);
    }
  };

  const createProject = async () => {
    if (!user) return;

    try {
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
      logger.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const assignVendor = async (projectId: string, vendorId: string) => {
    try {
      // Update project
      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          assigned_vendor_id: vendorId,
          status: 'in_progress'
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Create project assignment record
      const { error: assignmentError } = await supabase
        .from('project_assignments')
        .insert({
          project_id: projectId,
          vendor_id: vendorId,
          assigned_by: user?.id,
          status: 'active'
        });

      if (assignmentError) {
        logger.warn('Assignment tracking failed:', assignmentError);
      }

      // Create notification for vendor
      await supabase
        .from('notifications')
        .insert({
          user_id: vendorId,
          title: 'Project Assigned',
          message: `You have been assigned to project: ${selectedProject?.title}`,
          type: 'info',
          action_url: '/vendor/projects'
        });

      toast.success('Vendor assigned successfully');
      setShowAssignVendor(false);
      fetchProjects();
    } catch (error) {
      logger.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
    }
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status } : p
      ));

      toast.success('Project status updated');
    } catch (error) {
      logger.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      logger.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      case 'in_progress': return 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      default: return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
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

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects">Project Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Project Management
              </h1>
              <p className="text-muted-foreground">Create, manage, and assign projects to vendors</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>

          {/* Filters */}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
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
          </div>

          {/* Projects Table */}
          <Card>
            <CardHeader>
              <CardTitle>Projects ({filteredProjects.length})</CardTitle>
              <CardDescription>
                Manage all projects and assign them to verified vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.category}</Badge>
                      </TableCell>
                      <TableCell>
                        ${(project.budget_min || 0).toLocaleString()} - ${(project.budget_max || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(project.deadline).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setShowDocuments(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setShowAssignVendor(true);
                            }}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Select
                            value={project.status}
                            onValueChange={(value) => updateProjectStatus(project.id, value)}
                          >
                            <SelectTrigger className="w-[120px] h-8">
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
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold">{projects.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-info" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">
                      {projects.filter(p => p.status === 'open' || p.status === 'in_progress').length}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold">
                      ${projects.reduce((sum, p) => sum + (p.budget_max || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Project Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Create a new project for vendors to bid on</DialogDescription>
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
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Landscaping">Landscaping</SelectItem>
                    <SelectItem value="Renovation">Renovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newProject.priority} onValueChange={(value) => setNewProject(prev => ({ ...prev, priority: value }))}>
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
                placeholder="Project location"
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

      {/* Assign Vendor Modal */}
      <Dialog open={showAssignVendor} onOpenChange={setShowAssignVendor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Vendor</DialogTitle>
            <DialogDescription>
              Select a verified vendor to assign to "{selectedProject?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <Card key={vendor.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{vendor.company_name}</h4>
                      <p className="text-sm text-muted-foreground">{vendor.profile?.full_name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">Verified</Badge>
                        <span className="text-xs text-muted-foreground">
                          Rating: {vendor.rating.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => assignVendor(selectedProject!.id, vendor.user_id)}
                    >
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Management Modal */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Project Documents</DialogTitle>
            <DialogDescription>
              Manage documents for "{selectedProject?.title}"
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <DocumentManagement 
              projectId={selectedProject.id} 
              isAdmin={true}
              showUpload={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}