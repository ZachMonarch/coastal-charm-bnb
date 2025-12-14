import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '@/hooks/useProjects';
import { getStatusColor, getPriorityColor } from '@/utils/themeColors';

interface VendorProjectCardProps {
  project: Project;
}

export default function VendorProjectCard({ project }: VendorProjectCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';
  const isDueSoon = project.deadline && 
    new Date(project.deadline) > new Date() && 
    new Date(project.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge 
              className={`${getStatusColor(project.status)} flex items-center gap-1`}
              variant="outline"
            >
              {getStatusIcon(project.status)}
              {project.status.replace('_', ' ')}
            </Badge>
            <Badge 
              className={getPriorityColor(project.priority)}
              variant="outline"
            >
              {project.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{getProgressValue(project.status)}%</span>
          </div>
          <Progress value={getProgressValue(project.status)} className="h-2" />
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {project.budget_min && project.budget_max && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}</span>
            </div>
          )}
          
          {project.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
          
          {project.deadline && (
            <div className={`flex items-center gap-2 ${isOverdue ? 'text-destructive' : isDueSoon ? 'text-warning' : ''}`}>
              <Clock className="h-4 w-4" />
              <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
              {isOverdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Assigned: {new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Category and Skills */}
        <div className="space-y-2">
          <Badge variant="secondary" className="text-xs">
            {project.category}
          </Badge>
          {project.skills_required && project.skills_required.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.skills_required.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {project.skills_required.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.skills_required.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link to={`/vendor/projects/${project.id}`} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </Button>
          
          {project.status === 'in_progress' && (
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Update
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}