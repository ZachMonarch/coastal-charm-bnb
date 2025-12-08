import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  User,
  Building,
  Target
} from 'lucide-react';
import { useProjectDetails } from '@/hooks/useProjectDetails';
import VendorProjectDetailSkeleton from '@/components/VendorProjectDetailSkeleton';
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function VendorProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { project, documents, activities, loading, error } = useProjectDetails(id!);

  if (loading) {
    return <VendorProjectDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link to="/vendor/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Error Loading Project</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button asChild>
                <Link to="/vendor/projects">Return to Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Link to="/vendor/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Project Not Found</h3>
                <p className="text-muted-foreground">The project you're looking for doesn't exist or you don't have access to it.</p>
              </div>
              <Button asChild>
                <Link to="/vendor/projects">Return to Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40';
      case 'in_progress': return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'completed': return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      case 'on_hold': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      case 'high': return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'medium': return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'low': return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'assigned': return 10;
      case 'in_progress': return 50;
      case 'completed': return 100;
      case 'on_hold': return 25;
      default: return 0;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('CREATE')) return <CheckCircle className="h-4 w-4 text-success" />;
    if (action.includes('UPDATE')) return <AlertTriangle className="h-4 w-4 text-warning" />;
    if (action.includes('ASSIGN')) return <User className="h-4 w-4 text-info" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <PrivatePageWrapper title="Project Details">
      <div className="space-y-6">
      {/* Breadcrumb */}
      <Link to="/vendor/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(project.status)} variant="outline">
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge className={getPriorityColor(project.priority)} variant="outline">
                {project.priority} priority
              </Badge>
              <Badge variant="secondary">{project.category}</Badge>
            </div>
          </div>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Details
          </Button>
        </div>
        <p className="text-muted-foreground text-lg">{project.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Budget</p>
                  <p className="text-lg font-semibold">
                    {project.budget_min && project.budget_max 
                      ? `$${project.budget_min.toLocaleString()} - $${project.budget_max.toLocaleString()}`
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                  <p className="text-lg font-semibold">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-lg font-semibold">{project.location || 'Remote'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                  <p className="text-lg font-semibold">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required && project.skills_required.length > 0 ? (
                    project.skills_required.map((skill, index) => (
                      <Badge key={index} variant="outline">{skill}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No specific skills listed</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones & Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Milestones & Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{getProgressValue(project.status)}%</span>
                </div>
                <Progress value={getProgressValue(project.status)} className="h-2" />
              </div>
              
              {/* Placeholder milestones - in real implementation, these would come from database */}
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Milestone tracking will be available in future updates. Current status: {project.status.replace('_', ' ')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Related Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={getStatusColor(project.status)} variant="outline">
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Property ID</p>
                <p className="font-medium">{project.property_id || 'Not linked'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Project ID</p>
                <p className="font-mono text-sm">{project.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      {getActivityIcon(activity.action)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.action.replace('_', ' ').toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PrivatePageWrapper>
  );
}