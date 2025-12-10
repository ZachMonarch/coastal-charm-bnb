import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Download,
  Upload,
  Shield,
  Lock,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useVendorApplications, useVendorProfiles } from "@/hooks/useVendors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VerifiedBadge from "@/components/VerifiedBadge";
import { cn } from "@/lib/utils";

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
  location: string;
  skills_required: string[];
  created_at: string;
  documents?: any;
  assigned_vendor_id?: string;
  attachments?: string[];
  requirements_documents?: string[];
  property_id?: number;
  preferred_start_date?: string;
  created_by?: string;
  updated_at?: string;
}

interface EnhancedRFQProps {
  className?: string;
}

export default function EnhancedRFQSystemWithSubscription({ className }: EnhancedRFQProps) {
  const { user, hasRole } = useAuth();
  const { subscription, hasActiveSubscription, subscriptionTier } = useSubscription();
  const [activeTab, setActiveTab] = useState("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [projects, setProjects] = useState<RFQProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<RFQProject | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Access control
  const isAdmin = hasRole(['admin', 'property_manager']);
  const isVendor = hasRole('vendor');
  const canViewAllProjects = isAdmin || hasActiveSubscription;
  const canApplyToProjects = isVendor && hasActiveSubscription;
  const canViewPremiumProjects = hasActiveSubscription && (subscriptionTier === 'Premium' || subscriptionTier === 'Enterprise');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, location, skills_required, created_at, created_by, documents, attachments, requirements_documents')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedProjects = (data || []).map(project => ({
        ...project,
        documents: Array.isArray(project.documents) ? project.documents : 
                  project.documents ? [project.documents] : []
      }));
      
      setProjects(transformedProjects);
    } catch (error) {
      logger.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const canAccessProject = (project: RFQProject) => {
    if (isAdmin) return true;
    
    // High-value projects require premium subscription
    const isHighValue = (project.budget_max || 0) > 50000;
    if (isHighValue && !canViewPremiumProjects) return false;
    
    return canViewAllProjects;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-success/10 text-success border-success/30 dark:bg-success/20";
      case "in_progress": return "bg-info/10 text-info border-info/30 dark:bg-info/20";
      case "completed": return "bg-muted text-muted-foreground border-border";
      default: return "bg-warning/10 text-warning border-warning/30 dark:bg-warning/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20";
      case "high": return "bg-warning/10 text-warning border-warning/30 dark:bg-warning/20";
      case "medium": return "bg-warning/10 text-warning border-warning/30 dark:bg-warning/20";
      case "low": return "bg-success/10 text-success border-success/30 dark:bg-success/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory;
    const canAccess = canAccessProject(project);
    
    return matchesSearch && matchesCategory && canAccess;
  });

  const categories = Array.from(new Set(projects.map(p => p.category)));

  const applyToProject = async (projectId: string) => {
    if (!canApplyToProjects) {
      toast.error('Active subscription required to apply to projects');
      return;
    }

    try {
      // Navigate to application form or show modal
      toast.success('Application process started');
    } catch (error) {
      toast.error('Failed to start application');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Subscription Status */}
      <Card className="gradient-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">RFQ System</CardTitle>
                <CardDescription>
                  {isVendor ? "Browse and apply to available projects" : "Request for Quote Management"}
                </CardDescription>
              </div>
            </div>
            
            {isVendor && (
              <div className="flex items-center space-x-2">
                <Badge variant={hasActiveSubscription ? "default" : "outline"} className="flex items-center space-x-1">
                  {hasActiveSubscription ? (
                    <>
                      <Crown className="h-3 w-3" />
                      <span>{subscriptionTier || 'Active'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>No Subscription</span>
                    </>
                  )}
                </Badge>
                <VerifiedBadge isVerified={hasActiveSubscription} showText />
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Statistics - Only for Admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "Total Projects", value: projects.length, icon: FileText, color: "text-info" },
            { title: "Active Projects", value: projects.filter(p => p.status === 'open').length, icon: Clock, color: "text-success" },
            { title: "High Priority", value: projects.filter(p => p.priority === 'high' || p.priority === 'critical').length, icon: AlertCircle, color: "text-destructive" },
            { title: "Total Budget", value: `$${projects.reduce((sum, p) => sum + (p.budget_max || 0), 0).toLocaleString()}`, icon: DollarSign, color: "text-accent-foreground" }
          ].map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="grid" className="grid w-full grid-cols-3">
          <TabsTrigger variant="grid" value="available">Available RFQs</TabsTrigger>
          {isVendor && <TabsTrigger variant="grid" value="my-applications">My Applications</TabsTrigger>}
          {isAdmin && <TabsTrigger variant="grid" value="management">RFQ Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="available" className="space-y-4">
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Non-subscribed vendor warning */}
          {isVendor && !hasActiveSubscription && (
            <Card className="border-warning/30 bg-warning/10 dark:bg-warning/20 dark:border-warning/40">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Lock className="h-5 w-5 text-warning" />
                  <div>
                    <h4 className="font-medium text-warning">Subscription Required</h4>
                    <p className="text-sm text-warning/80">
                      An active subscription is required to apply to projects and access premium features.
                    </p>
                  </div>
                  <Button size="sm" className="ml-auto">
                    Subscribe Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Cards */}
          <div className="grid gap-4">
            {filteredProjects.map((project) => {
              const isHighValue = (project.budget_max || 0) > 50000;
              const requiresPremium = isHighValue && !canViewPremiumProjects;
              
              return (
                <Card key={project.id} className={cn(
                  "transition-all hover:shadow-lg",
                  requiresPremium && "opacity-75"
                )}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{project.title}</h3>
                          {isHighValue && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${(project.budget_min || 0).toLocaleString()} - ${(project.budget_max || 0).toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {project.category}
                      </div>
                    </div>

                    {project.skills_required && project.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills_required.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {project.skills_required.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.skills_required.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {project.documents && project.documents.length > 0 && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Documents ({project.documents.length})
                          </Button>
                        )}
                      </div>

                      {isVendor && (
                        <Button 
                          size="sm"
                          disabled={!canApplyToProjects || requiresPremium}
                          onClick={() => applyToProject(project.id)}
                        >
                          {requiresPremium ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              Premium Required
                            </>
                          ) : !hasActiveSubscription ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              Subscribe to Apply
                            </>
                          ) : (
                            'Apply Now'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {isVendor && (
          <TabsContent value="my-applications" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">My Applications</h3>
                <p className="text-muted-foreground">
                  Track your project applications and their status here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="management" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">RFQ Management</h3>
                <p className="text-muted-foreground">
                  Advanced RFQ management tools for administrators.
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New RFQ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Project Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
            <DialogDescription>{selectedProject?.category}</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <p className="text-sm">{selectedProject.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Budget Range:</span>
                  <p>${(selectedProject.budget_min || 0).toLocaleString()} - ${(selectedProject.budget_max || 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium">Deadline:</span>
                  <p>{new Date(selectedProject.deadline).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium">Location:</span>
                  <p>{selectedProject.location}</p>
                </div>
                <div>
                  <span className="font-medium">Priority:</span>
                  <Badge className={getPriorityColor(selectedProject.priority)}>
                    {selectedProject.priority}
                  </Badge>
                </div>
              </div>

              {selectedProject.skills_required && (
                <div>
                  <span className="font-medium">Required Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProject.skills_required.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}