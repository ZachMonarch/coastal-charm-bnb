import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Briefcase, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import VendorProjectCard from '@/components/VendorProjectCard';
import VendorProjectListSkeleton from '@/components/VendorProjectListSkeleton';
import VendorProjectBrowser from '@/components/VendorProjectBrowser';
import { useVendorAssignedProjects } from '@/hooks/useVendorAssignedProjects';
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";

export default function VendorProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  const { projects, loading, error, refetch } = useVendorAssignedProjects({
    status: statusFilter,
    category: categoryFilter,
    priority: priorityFilter,
    dueDateFilter: dueDateFilter
  });

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'budget':
        return (b.budget_max || 0) - (a.budget_max || 0);
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));

  // Calculate stats
  const inProgressCount = projects.filter(p => p.status === 'in_progress').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const overdueCount = projects.filter(p => {
    if (!p.deadline) return false;
    return new Date(p.deadline) < new Date() && p.status !== 'completed';
  }).length;

  return (
    <PrivatePageWrapper title="My Projects">
      <div className="space-y-6">
        {/* Enhanced Hero Section */}
        <PageHero
          title="My Projects"
          description="Manage your assigned projects and browse new opportunities"
          icon={Briefcase}
          variant="gradient"
          showDecorations={true}
        />

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Projects"
            value={projects.length}
            icon={Briefcase}
            color="info"
            subtitle="All assigned"
          />
          <StatsCard
            title="In Progress"
            value={inProgressCount}
            icon={Clock}
            color="warning"
            subtitle="Active work"
          />
          <StatsCard
            title="Completed"
            value={completedCount}
            icon={CheckCircle2}
            color="success"
            subtitle="Finished"
          />
          <StatsCard
            title="Overdue"
            value={overdueCount}
            icon={AlertTriangle}
            color="error"
            subtitle="Needs attention"
           />
        </div>

        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList variant="grid" className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned" variant="grid">Assigned Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="available" variant="grid">Available Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-6">
            {/* Filters */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-background border-2 border-input focus:border-primary"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="border-primary/20">
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
                    <SelectTrigger className="border-primary/20">
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

                  <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue placeholder="Due Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="due_this_week">Due This Week</SelectItem>
                      <SelectItem value="due_this_month">Due This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Latest First</SelectItem>
                      <SelectItem value="deadline">By Deadline</SelectItem>
                      <SelectItem value="priority">By Priority</SelectItem>
                      <SelectItem value="budget">By Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Projects List */}
            {loading ? (
              <VendorProjectListSkeleton />
            ) : error ? (
              <Card className="border-destructive/30">
                <CardContent className="py-8">
                  <div className="text-center">
                    <p className="text-destructive mb-4">{error}</p>
                    <Button onClick={refetch} variant="outline">Try Again</Button>
                  </div>
                </CardContent>
              </Card>
            ) : sortedProjects.length === 0 ? (
              <Card className="border-primary/20">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                      <Filter className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No projects found</h3>
                      <p className="text-muted-foreground">
                        {projects.length === 0 
                          ? "You don't have any assigned projects yet." 
                          : "No projects match your current filters."
                        }
                      </p>
                    </div>
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all' ? (
                      <Button 
                        variant="outline" 
                        className="border-primary/20"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setCategoryFilter('all');
                          setPriorityFilter('all');
                          setDueDateFilter('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {sortedProjects.map((project) => (
                  <VendorProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            <VendorProjectBrowser />
          </TabsContent>
        </Tabs>
      </div>
    </PrivatePageWrapper>
  );
}
