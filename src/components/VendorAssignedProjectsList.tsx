import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVendorAssignedProjects } from "@/hooks/useVendorAssignedProjects";
import { Briefcase, Calendar, DollarSign, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function VendorAssignedProjectsList() {
  const { projects, loading, error } = useVendorAssignedProjects();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-medium mb-2">No projects assigned yet</p>
          <p className="text-sm text-muted-foreground">
            Projects assigned to you by administrators will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'in_progress': return 'default';
      case 'completed': return 'secondary';
      case 'on_hold': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Assigned Projects</h3>
        <Badge variant="outline">{projects.length} project{projects.length !== 1 ? 's' : ''}</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2">
                <span className="text-lg line-clamp-2">{project.title}</span>
                <Badge variant={getStatusVariant(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
              
              {project.budget_max && (
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-success" />
                  <span className="font-medium">
                    ${project.budget_min?.toLocaleString() || 0} - ${project.budget_max.toLocaleString()}
                  </span>
                </div>
              )}
              
              {project.deadline && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-warning" />
                  <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}
              
              {project.location && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  <span className="line-clamp-1">{project.location}</span>
                </div>
              )}

              {project.priority && (
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Badge variant="outline" className={
                    project.priority === 'urgent' ? 'border-destructive text-destructive' :
                    project.priority === 'high' ? 'border-warning text-warning' :
                    project.priority === 'medium' ? 'border-primary text-primary' :
                    'border-success text-success'
                  }>
                    {project.priority}
                  </Badge>
                </div>
              )}
              
              <Button asChild className="w-full mt-4">
                <Link to={`/vendor/projects/${project.id}`}>
                  View Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
