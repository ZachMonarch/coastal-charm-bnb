import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Circle, 
  Upload, 
  User, 
  Award, 
  MessageSquare,
  ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useVendorDashboardStats } from '@/hooks/useVendorDashboardStats';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: React.ElementType;
}

export default function VendorOnboardingChecklist() {
  const { user } = useAuth();
  const { stats } = useVendorDashboardStats();

  // Determine completion status for each checklist item
  const hasLogo = user?.avatar_url && user.avatar_url.length > 0;
  const hasCompletedProfile = stats.profileCompletion >= 80;
  const hasCertifications = stats.profileCompletion >= 60; // Approximation based on profile completion
  const hasRespondedToRFQ = stats.totalApplications > 0;

  const checklistItems: ChecklistItem[] = [
    {
      id: 'logo',
      title: 'Upload Logo',
      description: 'Add your company logo to your profile',
      completed: hasLogo,
      route: '/vendor/profile',
      icon: Upload
    },
    {
      id: 'profile',
      title: 'Complete Profile',
      description: 'Fill out all required profile information',
      completed: hasCompletedProfile,
      route: '/vendor/profile',
      icon: User
    },
    {
      id: 'certifications',
      title: 'Upload Certifications',
      description: 'Upload your professional certificates and licenses',
      completed: hasCertifications,
      route: '/vendor/documents',
      icon: Award
    },
    {
      id: 'rfq',
      title: 'Respond to RFQ',
      description: 'Submit your first bid on available projects',
      completed: hasRespondedToRFQ,
      route: '/vendor/rfq',
      icon: MessageSquare
    }
  ];

  const completedTasks = checklistItems.filter(item => item.completed).length;
  const totalTasks = checklistItems.length;
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

  // If all tasks are completed, don't show the checklist
  if (completedTasks === totalTasks) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              Getting Started Checklist
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete these steps to unlock more opportunities
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{completedTasks}/{totalTasks}</div>
            <div className="text-sm text-muted-foreground">completed</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Checklist Items */}
        <div className="space-y-4">
          {checklistItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  item.completed 
                    ? 'bg-success/10 border-success/20' 
                    : 'bg-background border-border hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <div className="flex-shrink-0">
                  {item.completed ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-lg ${
                    item.completed 
                      ? 'bg-success/20 text-success' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    item.completed ? 'text-success' : 'text-foreground'
                  }`}>
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                
                {!item.completed && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={item.route} className="flex items-center gap-1">
                      Start
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                
                {item.completed && (
                  <div className="text-success font-medium text-sm">
                    ✓ Complete
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        {completedTasks < totalTasks && (
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Complete all tasks to maximize your project opportunities
            </p>
            <Button asChild>
              <Link to={checklistItems.find(item => !item.completed)?.route || '/vendor/profile'}>
                Continue Setup
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}