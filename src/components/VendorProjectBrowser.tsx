import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Search, Calendar, DollarSign, MapPin, Clock, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import VendorApplicationForm from './VendorApplicationForm';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { getPriorityColor } from '@/utils/themeColors';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  deadline?: string;
  status: string;
  created_at: string;
}

export default function VendorProjectBrowser() {
  const { user, hasRole, isSubscribed } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);

  const canApply = hasRole('vendor') && isSubscribed('basic');
  const canViewAll = hasRole('vendor') && isSubscribed('premium');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, categoryFilter, priorityFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch all projects that vendors can see (open status only)
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, preferred_start_date, location, skills_required, created_at, property_id')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Projects fetch error:', error);
        toast.error('Failed to load projects');
        return;
      }

      // Filter projects for vendor visibility
      const filteredData = (data as Project[]) || [];
      setProjects(filteredData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    const filtered = projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
      
      return matchesSearch && matchesCategory && matchesPriority;
    });
    // Do not limit visibility by subscription; vendors can see all open projects
    // Application capability is still gated by subscription in the UI

    setFilteredProjects(filtered);
  };

  const handleApplyClick = (project: Project) => {
    setSelectedProject(project);
    setShowBidForm(true);
  };

  // Priority color function removed - using imported utility

  const categories = Array.from(new Set(projects.map(p => p.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Available Projects</h2>
          <p className="text-muted-foreground">Browse and apply for open projects</p>
        </div>
        <Badge variant="secondary">{filteredProjects.length} Projects Available</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchProjects}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Notice */}
      {!canViewAll && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {canApply 
                    ? `Showing ${filteredProjects.length} of ${projects.length} projects` 
                    : `Showing ${filteredProjects.length} of ${projects.length} projects (Limited Access)`
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {canApply 
                    ? 'Upgrade to Premium to see all available projects'
                    : 'Subscribe to Basic plan to apply for projects'
                  }
                </p>
              </div>
              <Button size="sm" asChild>
                <Link to="/vendor/subscription">
                  {canApply ? 'Upgrade to Premium' : 'Subscribe Now'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      <div className="grid gap-6">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No projects found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or check back later</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <p className="text-muted-foreground mt-2">{project.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                    <Badge variant="outline">{project.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {project.budget_min && project.budget_max && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${project.budget_min} - ${project.budget_max}</span>
                    </div>
                  )}
                  
                  {project.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{project.location}</span>
                    </div>
                  )}
                  
                  {project.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Posted {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  {canApply ? (
                    <Button onClick={() => handleApplyClick(project)}>
                      Apply for Project
                    </Button>
                  ) : (
                    <Button disabled>
                      {hasRole('vendor') ? 'Subscription Required' : 'Login Required'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bid Form Dialog */}
      <Dialog open={showBidForm} onOpenChange={setShowBidForm}>
        <DialogContent className="max-w-2xl" aria-describedby="bid-form-description">
          <VisuallyHidden.Root>
            <DialogTitle>Submit Project Bid</DialogTitle>
            <DialogDescription id="bid-form-description">
              Submit your bid proposal for the selected project
            </DialogDescription>
          </VisuallyHidden.Root>
          {selectedProject && (
            <VendorApplicationForm
              project={{
                id: selectedProject.id,
                title: selectedProject.title,
                description: selectedProject.description,
                category: selectedProject.category,
                budget_min: selectedProject.budget_min,
                budget_max: selectedProject.budget_max,
                location: selectedProject.location,
                deadline: selectedProject.deadline,
              }}
              onClose={() => setShowBidForm(false)}
              onSuccess={() => {
                setShowBidForm(false);
                toast.success('Application submitted successfully!');
                fetchProjects(); // Refresh projects
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}