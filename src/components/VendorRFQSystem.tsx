import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, MapPin, Clock, CheckCircle2, AlertCircle, Building, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useVendorApplications } from '@/hooks/useVendors';
import VendorApplicationForm from './VendorApplicationForm';
import VendorBidForm from './VendorBidForm';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Project {
  id: number;
  title: string;
  property: string;
  budget: string;
  deadline: string;
  category: string;
  description: string;
  requiresVerification: boolean;
  urgency: string;
  location: string;
}

export default function VendorRFQSystem() {
  const { user, isSubscribed } = useAuth();
  const { applications, loading: applicationsLoading, refetch: refetchApplications } = useVendorApplications({ userId: user?.id });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const canApplyToProjects = user?.role === 'vendor' && isSubscribed('basic');
  const canViewAllProjects = user?.role === 'vendor' && isSubscribed('premium');

  // Mock available projects - replace with real data from Supabase
  const availableProjects: Project[] = [
    {
      id: 1,
      title: 'HVAC System Maintenance',
      property: 'Downtown Complex A',
      budget: '$5,000 - $8,000',
      deadline: '2024-03-15',
      category: 'HVAC',
      description: 'Quarterly maintenance for 24-unit HVAC system including filter replacement and system inspection',
      requiresVerification: false,
      urgency: 'medium',
      location: 'Downtown District'
    },
    {
      id: 2,
      title: 'Emergency Plumbing Repair',
      property: 'Riverside Apartments',
      budget: '$2,500 - $4,000',
      deadline: '2024-02-10',
      category: 'Plumbing',
      description: 'Emergency pipe burst repair in basement level with potential water damage assessment',
      requiresVerification: true,
      urgency: 'high',
      location: 'Riverside'
    },
    {
      id: 3,
      title: 'Electrical Panel Upgrade',
      property: 'Sunset Manor',
      budget: '$8,000 - $12,000',
      deadline: '2024-02-28',
      category: 'Electrical',
      description: '200A electrical panel upgrade with modern safety features and code compliance',
      requiresVerification: true,
      urgency: 'medium',
      location: 'West End'
    },
    {
      id: 4,
      title: 'Landscaping & Grounds Maintenance',
      property: 'Garden Villa Complex',
      budget: '$3,000 - $5,000',
      deadline: '2024-03-01',
      category: 'Landscaping',
      description: 'Spring landscaping setup and ongoing monthly maintenance for 3-month contract',
      requiresVerification: false,
      urgency: 'low',
      location: 'Garden District'
    }
  ];

  const filteredProjects = availableProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.property.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      case 'medium': return 'text-warning bg-warning/10 border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'low': return 'text-success bg-success/10 border-success/30 dark:bg-success/20 dark:border-success/40';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'HVAC': 'text-info bg-info/10 border-info/30 dark:bg-info/20 dark:border-info/40',
      'Plumbing': 'text-primary bg-primary/10 border-primary/30 dark:bg-primary/20 dark:border-primary/40',
      'Electrical': 'text-warning bg-warning/10 border-warning/30 dark:bg-warning/20 dark:border-warning/40',
      'Landscaping': 'text-success bg-success/10 border-success/30 dark:bg-success/20 dark:border-success/40',
      'Maintenance': 'text-muted-foreground bg-muted border-border'
    };
    return colors[category] || 'text-muted-foreground bg-muted border-border';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Project Opportunities</h1>
          <p className="text-muted-foreground">Browse and apply for available projects</p>
        </div>

        {/* Subscription Status Alert */}
        {!canApplyToProjects && (
          <Card className="border-warning/30 bg-warning/10 dark:border-warning/40 dark:bg-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Subscription Required</h3>
                  <p className="text-sm text-yellow-700">
                    Upgrade to Basic plan or higher to apply for projects and submit bids.
                  </p>
                </div>
                <Button asChild className="ml-auto">
                  <Link to="/dashboard/subscription">Upgrade Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Available Projects</CardTitle>
                <CardDescription>
                  {filteredProjects.length} projects available
                </CardDescription>
              </div>
              
              <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
                <DialogTrigger asChild>
                  <Button disabled={!canApplyToProjects}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Project Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  {/* TODO: Replace with proper project data */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Submit Project Request</h3>
                    <p className="text-muted-foreground">Project request form will be implemented here.</p>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowApplicationForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        setShowApplicationForm(false);
                        refetchApplications();
                      }}>
                        Submit Request
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects, properties, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Landscaping">Landscaping</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Grid */}
            <div className="grid gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <Badge className={cn("text-xs border", getUrgencyColor(project.urgency))}>
                            {project.urgency} priority
                          </Badge>
                          {project.requiresVerification && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified Only
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                      </div>
                      <Badge className={cn("border", getCategoryColor(project.category))}>
                        {project.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Property:</span>
                          <span className="ml-1 font-medium">{project.property}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="ml-1 font-medium">{project.budget}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Deadline:</span>
                          <span className="ml-1 font-medium">{project.deadline}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <span className="ml-1 font-medium">{project.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Posted 2 days ago</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        
                        {!canApplyToProjects ? (
                          <Button disabled variant="outline" size="sm">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Subscription Required
                          </Button>
                        ) : project.requiresVerification && !canViewAllProjects ? (
                          <Button disabled variant="outline" size="sm">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Premium Required
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                Apply for Project
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Apply for Project</DialogTitle>
                                <DialogDescription>
                                  Submit your bid for "{project.title}"
                                </DialogDescription>
                              </DialogHeader>
                              <VendorBidForm 
                                application={project as any}
                                onClose={() => {}}
                                onSuccess={() => {}}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or check back later for new opportunities.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}