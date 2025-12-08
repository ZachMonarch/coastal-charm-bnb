import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, Calendar, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";
import { logger } from '@/utils/logger';
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

export default function ProjectManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, preferred_start_date, location, created_at, created_by, assigned_vendor_id')
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All" || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });


  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Project Management
            </h1>
            <p className="text-muted-foreground">Track and manage property improvement projects</p>
          </div>
          <Button onClick={() => navigate('/admin/projects')} className="gap-2">
            <Plus className="h-4 w-4" />
            Manage Projects
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["All", "open", "in_progress", "completed", "cancelled"].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {status === "All" ? "All" : status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          
          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.filter(p => p.status === "in_progress").length}</div>
            </CardContent>
          </Card>

          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Projects</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.filter(p => p.status === "open").length}</div>
            </CardContent>
          </Card>

          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.filter(p => p.status === "completed").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="neumorphic-card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/dashboard/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/projects/${project.id}`);
                        }}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/projects`);
                        }}>
                          Admin Management
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(project.status)}>{project.status.replace('_', ' ')}</Badge>
                    <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{project.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{project.location || 'Not specified'}</p>
                    </div>
                    {project.deadline && (
                      <div>
                        <p className="text-muted-foreground">Deadline</p>
                        <p className="font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                    {(project.budget_min || project.budget_max) && (
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium">
                          ${project.budget_min?.toLocaleString() || '0'} - ${project.budget_max?.toLocaleString() || 'Open'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}