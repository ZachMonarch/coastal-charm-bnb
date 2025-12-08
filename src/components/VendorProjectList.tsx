import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  Briefcase,
  Star
} from 'lucide-react';
import { useVendorProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { getStatusColor, getPriorityColor } from '@/utils/themeColors';

// Status and priority colors removed - using imported utilities

export default function VendorProjectList() {
  const { projects, loading, error, refetch } = useVendorProjects();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatBudget = (min?: number, max?: number) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } else if (min) {
      return `From $${min.toLocaleString()}`;
    } else if (max) {
      return `Up to $${max.toLocaleString()}`;
    }
    return 'Budget TBD';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Failed to load projects</p>
        <Button onClick={refetch} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
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
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="renovation">Renovation</SelectItem>
            <SelectItem value="construction">Construction</SelectItem>
            <SelectItem value="landscaping">Landscaping</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No projects are currently available for vendors'
            }
          </p>
          {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProjects.map((project, index) => (
            <Card key={project.id} className="neumorphic-card floating-card group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority} priority
                      </Badge>
                      <Badge variant="outline">
                        {project.category}
                      </Badge>
                    </div>
                  </div>
                  {project.status === 'open' && (
                    <Badge className="bg-success text-success-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span>{formatBudget(project.budget_min, project.budget_max)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Due: {formatDate(project.deadline)}</span>
                  </div>
                  
                  {project.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{project.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Posted {formatDate(project.created_at)}</span>
                  </div>
                </div>

                {project.skills_required && project.skills_required.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.skills_required.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Project ID: {project.id.slice(0, 8)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {project.status === 'open' && project.assigned_vendor_id !== user?.id && (
                      <Button size="sm" className="group-hover:shadow-md transition-all">
                        Apply Now
                      </Button>
                    )}
                    {project.assigned_vendor_id === user?.id && (
                      <Badge className="bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40">
                        Assigned to You
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}