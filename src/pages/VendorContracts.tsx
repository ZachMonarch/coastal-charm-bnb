import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, Clock, Eye, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { ContractStatusChip } from "@/components/ContractStatusChip";
import { ContractProgressBar } from "@/components/ContractProgressBar";
import { useNavigate } from "react-router-dom";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";

export default function VendorContracts() {
  const { user } = useAuth();
  const { projects, loading: isLoading } = useProjects();
  const navigate = useNavigate();

  // Filter projects assigned to this vendor (contracts)
  const assignedProjects = projects?.filter(project => 
    project.assigned_vendor_id === user?.id && 
    project.status !== 'open'
  ) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Stats calculations
  const activeCount = assignedProjects.filter(p => p.status === 'in_progress').length;
  const completedCount = assignedProjects.filter(p => p.status === 'completed').length;
  const totalValue = assignedProjects.reduce((sum, p) => sum + (p.budget_min || 0), 0);

  return (
    <PrivatePageWrapper title="Active Contracts">
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="success">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Hero Section */}
          <PageHero
            title="Active Contracts"
            description="Manage your assigned projects and track contract progress"
            icon={FileText}
            variant="gradient"
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Contracts"
              value={assignedProjects.length}
              icon={FileText}
              color="info"
            />
            <StatsCard
              title="Active"
              value={activeCount}
              icon={Clock}
              color="warning"
            />
            <StatsCard
              title="Completed"
              value={completedCount}
              icon={CheckCircle}
              color="success"
            />
            <StatsCard
              title="Total Value"
              value={formatCurrency(totalValue)}
              icon={DollarSign}
              color="primary"
            />
          </div>

          {/* Contracts List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : assignedProjects.length === 0 ? (
            <Card variant="gradient" className="py-12">
              <CardContent className="text-center">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">No active contracts found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Apply for projects to get started with your first contract.
                </p>
                <Button className="mt-4 shadow-md" onClick={() => navigate('/vendor/rfq')}>
                  Browse Available Projects
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {assignedProjects.map((project, index) => (
                <Card 
                  key={project.id} 
                  variant="interactive"
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{project.title}</CardTitle>
                          <ContractStatusChip status={project.status} />
                        </div>
                        <CardDescription className="mb-3">
                          {project.description}
                        </CardDescription>
                        {/* Progress Bar */}
                        <ContractProgressBar
                          progress={project.status === 'completed' ? 100 : project.status === 'in_progress' ? 65 : 25}
                          completedMilestones={project.status === 'completed' ? 3 : project.status === 'in_progress' ? 2 : 1}
                          totalMilestones={3}
                          showText={false}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-muted-foreground text-xs">Value</p>
                          <p className="font-medium">
                            {project.budget_min ? formatCurrency(project.budget_min) : 'TBD'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <div>
                          <p className="text-muted-foreground text-xs">Priority</p>
                          <p className="font-medium">{project.priority}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                        <MapPin className="h-4 w-4 text-info" />
                        <div>
                          <p className="text-muted-foreground text-xs">Location</p>
                          <p className="font-medium">{project.location || 'Remote'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                        <Calendar className="h-4 w-4 text-success" />
                        <div>
                          <p className="text-muted-foreground text-xs">Deadline</p>
                          <p className="font-medium">
                            {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Next Milestone Info */}
                    <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4 mb-4 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-foreground">Next Milestone</p>
                          <p className="text-xs text-muted-foreground">
                            {project.status === 'completed' ? 'All milestones completed' : 
                             project.status === 'in_progress' ? 'Final Delivery' : 'Project Planning'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            {project.budget_min ? formatCurrency((project.budget_min * 0.2)) : 'TBD'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project.status === 'completed' ? 'Complete' : 'Due in 5 days'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => navigate(`/vendor/contracts/${project.id}`)}
                        className="shadow-md"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Contract
                      </Button>
                      <Button variant="outline" size="sm" className="shadow-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Log Time
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
