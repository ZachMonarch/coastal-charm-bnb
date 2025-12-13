
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Eye, Edit, Trash2, Users, Calendar, DollarSign, MapPin, Clock, CheckCircle2, AlertCircle, Upload, Briefcase, FileText, TrendingUp, Target, Share2, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { secureErrorHandler } from "@/utils/secureErrorHandler";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { logger } from "@/utils/logger";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PageHero from "@/components/shared/PageHero";
import ColorfulIconBox from "@/components/shared/ColorfulIconBox";

interface RFQProject {
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
  created_at: string;
  skills_required: string[];
  bids_count?: number;
}

interface Bid {
  id: string;
  vendor_id: string;
  bid_amount: number;
  proposal_details: string;
  estimated_duration: string;
  status: string;
  submitted_at: string;
  vendor_name?: string;
  vendor_rating?: number;
}

export default function AdminRFQSystem() {
  const { user } = useAuth();
  const [rfqProjects, setRfqProjects] = useState<RFQProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<RFQProject | null>(null);
  const [editingProject, setEditingProject] = useState<RFQProject | null>(null);
  const [projectBids, setProjectBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBidsOpen, setIsBidsOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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
    fetchRFQProjects();
  }, []);

  const fetchRFQProjects = async () => {
    try {
      // Single query with bid count aggregation to fix N+1
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, title, description, category, status, budget_min, budget_max, 
          deadline, created_at, created_by, assigned_vendor_id, priority, 
          skills_required, location, preferred_start_date, property_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get bid counts in a single query
      const projectIds = (data || []).map(p => p.id);
      const { data: bidCounts, error: bidError } = await supabase
        .from('vendor_bids')
        .select('project_id')
        .in('project_id', projectIds);
      
      // Count bids per project
      const bidCountMap = new Map<string, number>();
      (bidCounts || []).forEach(bid => {
        const count = bidCountMap.get(bid.project_id) || 0;
        bidCountMap.set(bid.project_id, count + 1);
      });

      const projectsWithBids = (data || []).map(project => ({
        ...project,
        bids_count: bidCountMap.get(project.id) || 0
      }));

      setRfqProjects(projectsWithBids);
    } catch (error) {
      const safeError = secureErrorHandler.handleError(error, {
        endpoint: 'rfq_projects',
        userId: user?.id
      });
      toast.error(safeError.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectBids = async (projectId: string) => {
    try {
      // First get the bids
      const { data: bidsData, error: bidsError } = await supabase
        .from('vendor_bids')
        .select('id, vendor_id, application_id, project_id, bid_amount, estimated_duration, proposal_details, status, submitted_at')
        .or(`application_id.eq.${projectId},project_id.eq.${projectId}`)
        .order('submitted_at', { ascending: false });

      if (bidsError) throw bidsError;

      // Then get vendor info for each bid
      const bidsWithVendorInfo = await Promise.all(
        (bidsData || []).map(async (bid) => {
          // Get vendor profile info
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', bid.vendor_id)
            .single();

          // Get vendor rating
          const { data: vendorData } = await supabase
            .from('vendor_profiles')
            .select('rating')
            .eq('user_id', bid.vendor_id)
            .single();

          return {
            ...bid,
            vendor_name: profileData?.full_name || 'Unknown Vendor',
            vendor_rating: vendorData?.rating || 0
          };
        })
      );

      setProjectBids(bidsWithVendorInfo);
    } catch (error) {
      logger.error('Error fetching project bids:', error);
      toast.error('Failed to load project bids');
    }
  };

  const createRFQProject = async () => {
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

      toast.success('RFQ project created successfully');
      setIsCreateOpen(false);
      resetNewProject();
      fetchRFQProjects();
    } catch (error) {
      logger.error('Error creating RFQ project:', error);
      toast.error('Failed to create RFQ project');
    }
  };

  const resetNewProject = () => {
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
  };

  const handleEditProject = async () => {
    if (!editingProject) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editingProject.title,
          description: editingProject.description,
          category: editingProject.category,
          priority: editingProject.priority,
          budget_min: editingProject.budget_min,
          budget_max: editingProject.budget_max,
          deadline: editingProject.deadline,
          preferred_start_date: editingProject.preferred_start_date,
          location: editingProject.location
        })
        .eq('id', editingProject.id);

      if (error) throw error;

      toast.success('Project updated successfully');
      setIsEditOpen(false);
      setEditingProject(null);
      fetchRFQProjects();
    } catch (error) {
      logger.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Project deleted successfully');
      setRfqProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      logger.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleShareProject = (project: RFQProject) => {
    const url = `${window.location.origin}/dashboard/projects/${project.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Project link copied to clipboard');
  };

  const handleSendNotification = async (project: RFQProject) => {
    try {
      // Get all vendors to notify
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendor_profiles')
        .select('user_id')
        .eq('is_verified', true)
        .eq('availability_status', 'available')
        .limit(50);

      if (vendorsError) throw vendorsError;

      if (!vendors || vendors.length === 0) {
        toast.info('No available vendors to notify');
        return;
      }

      // Create notifications for each vendor
      const notifications = vendors.map(vendor => ({
        user_id: vendor.user_id,
        title: 'New Project Available',
        message: `A new project "${project.title}" is available for bidding.`,
        type: 'info',
        action_url: `/vendor/projects`
      }));

      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifyError) throw notifyError;

      toast.success(`Notifications sent to ${vendors.length} vendors`);
    } catch (error) {
      logger.error('Error sending notifications:', error);
      toast.error('Failed to send notifications');
    }
  };

  const handleFileUpload = async (files: FileList | null, projectId?: string) => {
    if (!files || files.length === 0) return;
    
    setUploadingFiles(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `project-documents/${projectId || 'new'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // If we have a project ID, save the document reference
        if (projectId) {
          const { error: docError } = await supabase
            .from('project_documents')
            .insert({
              project_id: projectId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type || 'application/octet-stream',
              uploaded_by: user?.id
            });

          if (docError) throw docError;
        }
      }

      toast.success('Files uploaded successfully');
    } catch (error) {
      logger.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;

      setRfqProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status } : p
      ));

      toast.success('Project status updated successfully');
    } catch (error) {
      logger.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    }
  };

  const acceptBid = async (bidId: string, projectId: string, vendorId: string) => {
    try {
      // Update bid status to accepted
      const { error: bidError } = await supabase
        .from('vendor_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (bidError) throw bidError;

      // Update project status and assign vendor
      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          status: 'in_progress',
          assigned_vendor_id: vendorId
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Reject other bids
      const { error: rejectError } = await supabase
        .from('vendor_bids')
        .update({ status: 'rejected' })
        .eq('application_id', projectId)
        .neq('id', bidId);

      if (rejectError) throw rejectError;

      toast.success('Bid accepted and vendor assigned successfully');
      fetchProjectBids(projectId);
      fetchRFQProjects();
    } catch (error) {
      logger.error('Error accepting bid:', error);
      toast.error('Failed to accept bid');
    }
  };

  const filteredProjects = rfqProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper functions for colorful badges
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
      open: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'destructive',
      pending: 'warning',
      submitted: 'info',
      accepted: 'success',
      rejected: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
      low: 'secondary',
      medium: 'info',
      high: 'warning',
      critical: 'destructive',
      urgent: 'destructive',
    };
    return variants[priority] || 'secondary';
  };

  const getCategoryColor = (category: string): 'primary' | 'success' | 'warning' | 'info' | 'secondary' => {
    const colors: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'secondary'> = {
      'Plumbing': 'info',
      'Electrical': 'warning',
      'HVAC': 'secondary',
      'Landscaping': 'success',
      'Cleaning': 'primary',
      'Maintenance': 'info',
      'Renovation': 'warning',
    };
    return colors[category] || 'secondary';
  };

  // Compute stats for PageHero
  const openProjects = rfqProjects.filter(p => p.status === 'open').length;
  const inProgressProjects = rfqProjects.filter(p => p.status === 'in_progress').length;
  const totalBids = rfqProjects.reduce((sum, p) => sum + (p.bids_count || 0), 0);
  const avgBudget = rfqProjects.length > 0 
    ? Math.round(rfqProjects.reduce((sum, p) => sum + ((p.budget_min || 0) + (p.budget_max || 0)) / 2, 0) / rfqProjects.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gradient-to-r from-primary/10 via-background to-secondary/10 rounded-xl" />
        <div className="h-64 bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PageHero with Stats */}
      <PageHero
        title="RFQ Management System"
        description="Manage Request for Quotation projects and vendor bids"
        icon={Briefcase}
        variant="gradient"
        stats={[
          { label: 'Open Projects', value: openProjects, icon: FileText, color: 'info' },
          { label: 'In Progress', value: inProgressProjects, icon: Target, color: 'warning' },
          { label: 'Total Bids', value: totalBids, icon: Users, color: 'success' },
          { label: 'Avg Budget', value: `$${avgBudget.toLocaleString()}`, icon: DollarSign, color: 'primary' },
        ]}
        actions={[]}
      />

      {/* Create Button */}
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create RFQ Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New RFQ Project</DialogTitle>
              <DialogDescription>Create a new Request for Quotation project for vendors to bid on</DialogDescription>
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

                    {/* Document Upload Section */}
                    <div>
                      <Label>Project Documents</Label>
                      <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="hidden"
                          id="file-upload"
                          disabled={uploadingFiles}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <div className="text-center">
                            <Upload className={`mx-auto h-8 w-8 ${uploadingFiles ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
                            <p className="mt-1 text-sm text-foreground">
                              {uploadingFiles ? 'Uploading...' : 'Click to upload project documents or drag and drop'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, DOC, XLS, TXT, or images up to 10MB each
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createRFQProject}>
                  Create RFQ Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search RFQ projects..."
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

      {/* RFQ Projects Table */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>RFQ Projects</CardTitle>
          <CardDescription>
            {filteredProjects.length} projects found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Budget Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Bids</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                // Determine row accent color based on status
                const statusAccent = {
                  open: 'border-l-info',
                  in_progress: 'border-l-warning',
                  completed: 'border-l-success',
                  cancelled: 'border-l-destructive',
                }[project.status] || 'border-l-muted';

                return (
                  <TableRow 
                    key={project.id} 
                    className={`table-row-glow border-l-4 ${statusAccent} hover:bg-primary/5 transition-all duration-300`}
                  >
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <ColorfulIconBox 
                          icon={Briefcase} 
                          color={getCategoryColor(project.category)} 
                          size="sm" 
                          glow 
                        />
                        <div>
                          <div className="font-semibold text-foreground">{project.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{project.description}</div>
                          {project.location && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-info" />
                              {project.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info" className="font-medium">
                        {project.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-semibold text-success">
                          ${project.budget_min?.toLocaleString()} - ${project.budget_max?.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(project.priority)}>
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 hover:border-primary/50 hover:bg-primary/5"
                        onClick={() => {
                          setSelectedProject(project);
                          fetchProjectBids(project.id);
                          setIsBidsOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4 text-info" />
                        <span className="font-semibold">{project.bids_count || 0}</span> Bids
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-warning" />
                        <span className="text-muted-foreground">
                          {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                            setIsEditOpen(true);
                          }}
                          title="Edit project"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareProject(project);
                          }}
                          title="Share project link"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendNotification(project);
                          }}
                          title="Notify vendors"
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProject(project.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Select 
                          value={project.status} 
                          onValueChange={(value) => updateProjectStatus(project.id, value)}
                        >
                          <SelectTrigger className="w-[130px]" variant="colorful">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bids Dialog */}
      <Dialog open={isBidsOpen} onOpenChange={setIsBidsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Project Bids - {selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Review and manage vendor bids for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {projectBids.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bids submitted yet</p>
            ) : (
              <div className="space-y-4">
                {projectBids.map((bid) => (
                  <Card key={bid.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{bid.vendor_name}</h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i < (bid.vendor_rating || 0) ? 'bg-warning' : 'bg-muted'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground">({bid.vendor_rating || 0})</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{bid.proposal_details}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10">
                            <DollarSign className="h-4 w-4 text-success" />
                            <span className="font-semibold text-success">${bid.bid_amount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-info/10">
                            <Clock className="h-4 w-4 text-info" />
                            <span className="text-info">{bid.estimated_duration}</span>
                          </div>
                          <Badge variant={getStatusBadgeVariant(bid.status)}>
                            {bid.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {bid.status === 'submitted' && (
                          <Button
                            size="sm"
                            onClick={() => acceptBid(bid.id, selectedProject!.id, bid.vendor_id)}
                            className="gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Accept Bid
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Project Title</Label>
                <Input
                  id="edit-title"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select 
                    value={editingProject.category} 
                    onValueChange={(value) => setEditingProject({ ...editingProject, category: value })}
                  >
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
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select 
                    value={editingProject.priority} 
                    onValueChange={(value) => setEditingProject({ ...editingProject, priority: value })}
                  >
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
                  <Label htmlFor="edit-budget-min">Min Budget ($)</Label>
                  <Input
                    id="edit-budget-min"
                    type="number"
                    value={editingProject.budget_min}
                    onChange={(e) => setEditingProject({ ...editingProject, budget_min: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-budget-max">Max Budget ($)</Label>
                  <Input
                    id="edit-budget-max"
                    type="number"
                    value={editingProject.budget_max}
                    onChange={(e) => setEditingProject({ ...editingProject, budget_max: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingProject.location}
                  onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start-date">Preferred Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editingProject.preferred_start_date?.split('T')[0] || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, preferred_start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-deadline">Deadline</Label>
                  <Input
                    id="edit-deadline"
                    type="date"
                    value={editingProject.deadline?.split('T')[0] || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditProject}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
