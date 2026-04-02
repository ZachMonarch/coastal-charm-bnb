import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRFQListSubscription } from '@/hooks/useRFQSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Clock, CheckCircle2, Award, FolderKanban, Building, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RFQStatusBadge } from '@/components/rfq/shared/RFQStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import PageHero from '@/components/shared/PageHero';
import StatsCard from '@/components/shared/StatsCard';
import { format } from 'date-fns';

export default function UnifiedRFQManagement() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('rfqs');

  useRFQListSubscription();

  // Fetch RFQs from rfqs table
  const { data: rfqs = [], isLoading: rfqsLoading } = useQuery({
    queryKey: ['admin-rfqs', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('rfqs')
        .select(`
          id,
          title,
          description,
          status,
          deadline,
          category,
          created_at,
          property_id,
          document_control,
          rfq_lots(id),
          rfq_invites(id, status)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch property info
      const propertyIds = data?.map(r => r.property_id).filter(Boolean) || [];
      let propertiesMap: Record<number, any> = {};
      
      if (propertyIds.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, title, address, city')
          .in('id', propertyIds);
        propertiesMap = (props || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
      }

      return (data || []).map(rfq => ({
        ...rfq,
        property: rfq.property_id ? propertiesMap[rfq.property_id] : null
      }));
    },
  });

  // Fetch legacy projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-legacy-projects', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          status,
          deadline,
          category,
          priority,
          budget_min,
          budget_max,
          location,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate stats
  const totalRfqs = rfqs.length;
  const openRfqs = rfqs.filter(r => r.status === 'open').length;
  const awardedRfqs = rfqs.filter(r => r.status === 'awarded').length;
  const totalProjects = projects.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-success bg-success/10 border-success/30';
      case 'awarded': return 'text-primary bg-primary/10 border-primary/30';
      case 'in_progress': return 'text-info bg-info/10 border-info/30';
      case 'completed': return 'text-success bg-success/10 border-success/30';
      case 'draft': return 'text-muted-foreground bg-muted border-border';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="info" intensity="subtle" showOrbs>
      <div className="container mx-auto py-6 space-y-6">
        <PageHero
          title="RFQ & Project Management"
          description="Manage Requests for Quotations and legacy projects from a unified dashboard"
          icon={FileText}
          variant="gradient"
          actions={[
            { label: 'Create RFQ', href: '/admin/rfq/create-detailed' }
          ]}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total RFQs"
            value={totalRfqs}
            icon={FileText}
            color="info"
            animated
          />
          <StatsCard
            title="Open RFQs"
            value={openRfqs}
            icon={Clock}
            color="warning"
            animated
          />
          <StatsCard
            title="Awarded"
            value={awardedRfqs}
            icon={Award}
            color="primary"
            animated
          />
          <StatsCard
            title="Legacy Projects"
            value={totalProjects}
            icon={FolderKanban}
            color="success"
            animated
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'draft', 'open', 'awarded', 'completed', 'in_progress'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              className="capitalize"
              size="sm"
            >
              {status === 'in_progress' ? 'In Progress' : status}
            </Button>
          ))}
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="rfqs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              RFQs ({rfqs.length})
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Legacy Projects ({projects.length})
            </TabsTrigger>
          </TabsList>

          {/* RFQs Tab */}
          <TabsContent value="rfqs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Requests for Quotation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rfqsLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading RFQs...</div>
                ) : rfqs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Lots</TableHead>
                        <TableHead>Invites</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfqs.map((rfq) => (
                        <TableRow
                          key={rfq.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/rfq/${rfq.id}`)}
                        >
                          <TableCell className="font-medium max-w-xs truncate">{rfq.title}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {rfq.property?.title || rfq.property?.address || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {rfq.category && (
                              <Badge variant="outline" className="text-xs">
                                {rfq.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <RFQStatusBadge status={rfq.status as any} />
                          </TableCell>
                          <TableCell>{rfq.rfq_lots?.length || 0}</TableCell>
                          <TableCell>{rfq.rfq_invites?.length || 0}</TableCell>
                          <TableCell>{formatDate(rfq.deadline)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/rfq/${rfq.id}`);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No RFQs found. Create your first RFQ to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legacy Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Legacy Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
                ) : projects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                        >
                          <TableCell className="font-medium max-w-xs truncate">{project.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {project.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                project.priority === 'high' ? 'border-destructive text-destructive' :
                                project.priority === 'medium' ? 'border-warning text-warning' :
                                'border-muted-foreground text-muted-foreground'
                              }`}
                            >
                              {project.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {project.budget_min && project.budget_max 
                              ? `$${project.budget_min.toLocaleString()} - $${project.budget_max.toLocaleString()}`
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            {project.deadline ? formatDate(project.deadline) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/projects/${project.id}`);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No legacy projects found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedPageBackground>
  );
}
