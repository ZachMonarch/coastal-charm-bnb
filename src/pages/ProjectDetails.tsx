import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, MapPin, User, FileText, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import { getStatusColor, getPriorityColor } from '@/utils/themeColors';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  preferred_start_date?: string;
  location?: string;
  skills_required?: string[];
  created_at: string;
  created_by: string;
  assigned_vendor_id?: string;
  property_id?: number;
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, preferred_start_date, location, skills_required, created_at, created_by, assigned_vendor_id, property_id, tenant_id, updated_at, documents')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
      setEditProject(data);
    } catch (error) {
      logger.error('Error fetching project:', error);
      toast.error('Failed to load project details');
      navigate('/dashboard/projects');
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async () => {
    if (!editProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editProject.title,
          description: editProject.description,
          category: editProject.category,
          priority: editProject.priority,
          status: editProject.status,
          budget_min: editProject.budget_min,
          budget_max: editProject.budget_max,
          deadline: editProject.deadline,
          preferred_start_date: editProject.preferred_start_date,
          location: editProject.location,
          skills_required: editProject.skills_required
        })
        .eq('id', editProject.id);

      if (error) throw error;

      setProject(editProject);
      setIsEditOpen(false);
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const deleteProject = async () => {
    if (!project || !confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Project deleted successfully');
      navigate('/dashboard/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const updateProjectStatus = async (newStatus: string) => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', project.id);

      if (error) throw error;

      setProject(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success('Project status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update project status');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button asChild>
            <Link to="/dashboard/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/dashboard/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(project.priority)}>
                  {project.priority}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {(hasRole('admin') || project.created_by === user?.id) && (
              <>
                <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={deleteProject}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1">{project.description || 'No description available'}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="mt-1 font-medium">{project.category}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
                
                {project.location && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <div className="flex items-center space-x-1 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{project.location}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline & Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {project.deadline && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Deadline</Label>
                    <div className="flex items-center space-x-1 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {project.preferred_start_date && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                    <div className="flex items-center space-x-1 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(project.preferred_start_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {(project.budget_min || project.budget_max) && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Budget Range</Label>
                  <div className="flex items-center space-x-1 mt-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      ${project.budget_min?.toLocaleString() || '0'} - ${project.budget_max?.toLocaleString() || 'Unlimited'}
                    </span>
                  </div>
                </div>
              )}
              
              {project.skills_required && project.skills_required.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Skills Required</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.skills_required.map((skill, idx) => (
                      <Badge key={idx} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Management */}
        <Card>
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
            <CardDescription>Update project status and track progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Label>Status:</Label>
              <Select value={project.status} onValueChange={updateProjectStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Edit Project Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project details and requirements</DialogDescription>
            </DialogHeader>
            
            {editProject && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={editProject.title}
                    onChange={(e) => setEditProject(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editProject.description || ''}
                    onChange={(e) => setEditProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editProject.category}
                      onValueChange={(value) => setEditProject(prev => prev ? { ...prev, category: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="renovation">Renovation</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="upgrade">Upgrade</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={editProject.priority}
                      onValueChange={(value) => setEditProject(prev => prev ? { ...prev, priority: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label htmlFor="budget_min">Min Budget</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      value={editProject.budget_min || ''}
                      onChange={(e) => setEditProject(prev => prev ? { ...prev, budget_min: Number(e.target.value) } : null)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="budget_max">Max Budget</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      value={editProject.budget_max || ''}
                      onChange={(e) => setEditProject(prev => prev ? { ...prev, budget_max: Number(e.target.value) } : null)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateProject}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </OptimizedProtectedRoute>
  );
}