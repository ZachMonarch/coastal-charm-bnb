import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Eye, Edit, Trash2, Users, Calendar, DollarSign, MapPin, Clock, CheckCircle2, AlertCircle, Upload, Briefcase, FileText, TrendingUp, Target, Share2, Bell, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  source: 'projects' | 'rfqs';
  property_id?: number;
  lots_count?: number;
  invites_count?: number;
}

interface RFQItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  deadline: string;
  created_by: string;
  created_at: string;
  property_id: number | null;
  tenant_id: string;
  lots_count: number;
  invites_count: number;
  property?: {
    title: string | null;
    address: string | null;
  } | null;
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
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<RFQProject | null>(null);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQItem | null>(null);
  const [editingProject, setEditingProject] = useState<RFQProject | null>(null);
  const [projectBids, setProjectBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBidsOpen, setIsBidsOpen] = useState(false);
  const [isRFQDetailOpen, setIsRFQDetailOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [activeTab, setActiveTab] = useState("rfqs");

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
    fetchRFQItems();
  }, []);

  // Fetch RFQs from the rfqs table (new RFQ system with lots/invites)
  const fetchRFQItems = async () => {
    try {
      const { data: rfqs, error } = await supabase
        .from('rfqs')
        .select(`
          id,
          title,
          description,
          category,
          status,
          deadline,
          created_by,
          created_at,
          property_id,
          tenant_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching RFQs:', error);
        throw error;
      }

      if (!rfqs || rfqs.length === 0) {
        setRfqItems([]);
        return;
      }

      // Get property info
      const propertyIds = rfqs.map(r => r.property_id).filter(Boolean) as number[];
      let propertiesMap: Record<number, any> = {};
      if (propertyIds.length > 0) {
        const { data: properties } = await supabase
          .from('properties')
          .select('id, title, address')
          .in('id', propertyIds);
        if (properties) {
          propertiesMap = properties.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
      }

      // Get lots count for each RFQ
      const rfqIds = rfqs.map(r => r.id);
      const { data: lots } = await supabase
        .from('rfq_lots')
        .select('rfq_id')
        .in('rfq_id', rfqIds);
      
      const lotsCountMap = (lots || []).reduce((acc, lot) => {
        acc[lot.rfq_id] = (acc[lot.rfq_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get invites count for each RFQ
      const { data: invites } = await supabase
        .from('rfq_invites')
        .select('rfq_id')
        .in('rfq_id', rfqIds);
      
      const invitesCountMap = (invites || []).reduce((acc, inv) => {
        acc[inv.rfq_id] = (acc[inv.rfq_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const rfqsWithDetails = rfqs.map(rfq => ({
        ...rfq,
        property: rfq.property_id ? propertiesMap[rfq.property_id] : null,
        lots_count: lotsCountMap[rfq.id] || 0,
        invites_count: invitesCountMap[rfq.id] || 0
      }));

      setRfqItems(rfqsWithDetails);
    } catch (error) {
      console.error('Error in fetchRFQItems:', error);
      toast.error('Failed to load RFQs');
    }
  };

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
        bids_count: bidCountMap.get(project.id) || 0,
        source: 'projects' as const
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
      const { data: bidsData, error: bidsError } = await supabase
        .from('vendor_bids')
        .select('id, vendor_id, application_id, project_id, bid_amount, estimated_duration, proposal_details, status, submitted_at')
        .or(`application_id.eq.${projectId},project_id.eq.${projectId}`)
        .order('submitted_at', { ascending: false });

      if (bidsError) throw bidsError;

      const bidsWithVendorInfo = await Promise.all(
        (bidsData || []).map(async (bid) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', bid.vendor_id)
            .single();

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

  const handleDeleteRFQ = async (rfqId: string) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .delete()
        .eq('id', rfqId);

      if (error) throw error;

      toast.success('RFQ deleted successfully');
      setRfqItems(prev => prev.filter(r => r.id !== rfqId));
    } catch (error) {
      logger.error('Error deleting RFQ:', error);
      toast.error('Failed to delete RFQ');
    }
  };

  const updateRFQStatus = async (rfqId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status })
        .eq('id', rfqId);

      if (error) throw error;

      setRfqItems(prev => prev.map(r => 
        r.id === rfqId ? { ...r, status } : r
      ));

      toast.success('RFQ status updated successfully');
    } catch (error) {
      logger.error('Error updating RFQ status:', error);
      toast.error('Failed to update RFQ status');
    }
  };

  const handleShareProject = (project: RFQProject) => {
    const url = `${window.location.origin}/dashboard/projects/${project.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Project link copied to clipboard');
  };

  const handleSendNotification = async (project: RFQProject) => {
    try {
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
      const { error: bidError } = await supabase
        .from('vendor_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (bidError) throw bidError;

      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          status: 'in_progress',
          assigned_vendor_id: vendorId
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

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

  const filteredRFQs = rfqItems.filter(rfq => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      closed: 'secondary',
      awarded: 'success',
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

  const getCategoryColor = (category: string | null): 'primary' | 'success' | 'warning' | 'info' | 'secondary' => {
    const colors: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'secondary'> = {
      'Plumbing': 'info',
      'Electrical': 'warning',
      'HVAC': 'secondary',
      'Landscaping': 'success',
      'Cleaning': 'primary',
      'Maintenance': 'info',
      'Renovation': 'warning',
    };
    return colors[category || ''] || 'secondary';
  };

  // Compute stats for PageHero
  const openRFQs = rfqItems.filter(r => r.status === 'open').length;
  const openProjects = rfqProjects.filter(p => p.status === 'open').length;
  const totalInvites = rfqItems.reduce((sum, r) => sum + (r.invites_count || 0), 0);
  const totalLots = rfqItems.reduce((sum, r) => sum + (r.lots_count || 0), 0);

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
        description="Manage Request for Quotations, vendor invites, and project bids"
        icon={Briefcase}
        variant="gradient"
        stats={[
          { label: 'Open RFQs', value: openRFQs, icon: FileText, color: 'info' },
          { label: 'Total Lots', value: totalLots, icon: Package, color: 'warning' },
          { label: 'Vendor Invites', value: totalInvites, icon: Users, color: 'success' },
          { label: 'Legacy Projects', value: openProjects, icon: Target, color: 'primary' },
        ]}
        actions={[]}
      />

      {/* Tabs for RFQs vs Legacy Projects */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="rfqs" className="gap-2">
            <FileText className="h-4 w-4" />
            RFQs ({rfqItems.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Legacy Projects ({rfqProjects.length})
          </TabsTrigger>
        </TabsList>

        {/* RFQs Tab Content */}
        <TabsContent value="rfqs" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RFQs..."
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
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* RFQs Table */}
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle className="text-foreground">Request for Quotations</CardTitle>
              <CardDescription className="text-muted-foreground">
                {filteredRFQs.length} RFQ{filteredRFQs.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRFQs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No RFQs Found</h3>
                  <p className="text-muted-foreground">No RFQs match your current filters.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">RFQ</TableHead>
                      <TableHead className="text-foreground">Category</TableHead>
                      <TableHead className="text-foreground">Property</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">Lots</TableHead>
                      <TableHead className="text-foreground">Invites</TableHead>
                      <TableHead className="text-foreground">Deadline</TableHead>
                      <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRFQs.map((rfq) => {
                      const statusAccent = {
                        open: 'border-l-info',
                        closed: 'border-l-muted',
                        awarded: 'border-l-success',
                      }[rfq.status] || 'border-l-muted';

                      return (
                        <TableRow 
                          key={rfq.id} 
                          className={`table-row-glow border-l-4 ${statusAccent} hover:bg-primary/5 transition-all duration-300`}
                        >
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <ColorfulIconBox 
                                icon={FileText} 
                                color={getCategoryColor(rfq.category)} 
                                size="sm" 
                                glow 
                              />
                              <div>
                                <div className="font-semibold text-foreground">{rfq.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {rfq.description || 'No description'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="info" className="font-medium">
                              {rfq.category || 'General'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <MapPin className="h-3.5 w-3.5 text-info" />
                              <span className="text-foreground">
                                {rfq.property?.title || rfq.property?.address || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(rfq.status)}>
                              {rfq.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning/10">
                              <Package className="h-4 w-4 text-warning" />
                              <span className="font-semibold text-warning">{rfq.lots_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10">
                              <Users className="h-4 w-4 text-success" />
                              <span className="font-semibold text-success">{rfq.invites_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar className="h-3.5 w-3.5 text-warning" />
                              <span className="text-foreground">
                                {format(new Date(rfq.deadline), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedRFQ(rfq);
                                  setIsRFQDetailOpen(true);
                                }}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    title="Delete RFQ"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-foreground">Delete RFQ</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">
                                      Are you sure you want to delete "{rfq.title}"? This will also delete all associated lots and invites.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteRFQ(rfq.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Select 
                                value={rfq.status} 
                                onValueChange={(value) => updateRFQStatus(rfq.id, value)}
                              >
                                <SelectTrigger className="w-[120px]" variant="colorful">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                  <SelectItem value="awarded">Awarded</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legacy Projects Tab Content */}
        <TabsContent value="projects" className="space-y-4 mt-4">
          {/* Create Button */}
          <div className="flex justify-end">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Project</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Create a new project for vendors to bid on</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-foreground">Project Title</Label>
                    <Input
                      id="title"
                      value={newProject.title}
                      onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter project title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-foreground">Description</Label>
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
                      <Label htmlFor="category" className="text-foreground">Category</Label>
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
                      <Label htmlFor="priority" className="text-foreground">Priority</Label>
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
                      <Label htmlFor="budget_min" className="text-foreground">Min Budget ($)</Label>
                      <Input
                        id="budget_min"
                        type="number"
                        value={newProject.budget_min}
                        onChange={(e) => setNewProject(prev => ({ ...prev, budget_min: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget_max" className="text-foreground">Max Budget ($)</Label>
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
                    <Label htmlFor="location" className="text-foreground">Location</Label>
                    <Input
                      id="location"
                      value={newProject.location}
                      onChange={(e) => setNewProject(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Project location or property address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-foreground">Preferred Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newProject.preferred_start_date}
                        onChange={(e) => setNewProject(prev => ({ ...prev, preferred_start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deadline" className="text-foreground">Deadline</Label>
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
                    <Button onClick={createRFQProject}>
                      Create Project
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle className="text-foreground">Legacy Projects</CardTitle>
              <CardDescription className="text-muted-foreground">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Project</TableHead>
                    <TableHead className="text-foreground">Category</TableHead>
                    <TableHead className="text-foreground">Budget Range</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Priority</TableHead>
                    <TableHead className="text-foreground">Bids</TableHead>
                    <TableHead className="text-foreground">Deadline</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => {
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
                            <span className="text-foreground">
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
                                  <AlertDialogTitle className="text-foreground">Delete Project</AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
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
        </TabsContent>
      </Tabs>

      {/* RFQ Detail Dialog */}
      <Dialog open={isRFQDetailOpen} onOpenChange={setIsRFQDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedRFQ?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              RFQ Details and Status
            </DialogDescription>
          </DialogHeader>
          {selectedRFQ && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedRFQ.status)} className="mt-1">
                    {selectedRFQ.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="text-foreground">{selectedRFQ.category || 'General'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Deadline</Label>
                  <p className="text-foreground">{format(new Date(selectedRFQ.deadline), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Property</Label>
                  <p className="text-foreground">{selectedRFQ.property?.title || selectedRFQ.property?.address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Lots</Label>
                  <p className="text-foreground font-semibold">{selectedRFQ.lots_count}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vendor Invites</Label>
                  <p className="text-foreground font-semibold">{selectedRFQ.invites_count}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-foreground mt-1">{selectedRFQ.description || 'No description provided'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bids Dialog */}
      <Dialog open={isBidsOpen} onOpenChange={setIsBidsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Project Bids - {selectedProject?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
                          <h4 className="font-medium text-foreground">{bid.vendor_name}</h4>
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
            <DialogTitle className="text-foreground">Edit Project</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update project details</DialogDescription>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="text-foreground">Project Title</Label>
                <Input
                  id="edit-title"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-foreground">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category" className="text-foreground">Category</Label>
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
                  <Label htmlFor="edit-priority" className="text-foreground">Priority</Label>
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
                  <Label htmlFor="edit-budget-min" className="text-foreground">Min Budget ($)</Label>
                  <Input
                    id="edit-budget-min"
                    type="number"
                    value={editingProject.budget_min}
                    onChange={(e) => setEditingProject({ ...editingProject, budget_min: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-budget-max" className="text-foreground">Max Budget ($)</Label>
                  <Input
                    id="edit-budget-max"
                    type="number"
                    value={editingProject.budget_max}
                    onChange={(e) => setEditingProject({ ...editingProject, budget_max: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-location" className="text-foreground">Location</Label>
                <Input
                  id="edit-location"
                  value={editingProject.location}
                  onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start-date" className="text-foreground">Preferred Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editingProject.preferred_start_date?.split('T')[0] || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, preferred_start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-deadline" className="text-foreground">Deadline</Label>
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
