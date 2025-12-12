import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Crown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Upload,
  FileText,
  Star,
  Wrench,
  Clock,
  TrendingUp,
  Award,
  MessageSquare,
  FolderOpen,
  User,
  AlertCircle,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useVendorApplications } from '@/hooks/useVendors';
import { useVendorDashboardStats } from '@/hooks/useVendorDashboardStats';
import VerifiedBadge from './VerifiedBadge';
import AdminProjectCreationForm from './AdminProjectCreationForm';
import VendorOnboardingFlow from './VendorOnboardingFlow';
import VendorActionCard from './VendorActionCard';
import VendorDashboardSkeleton from './VendorDashboardSkeleton';
import VendorOnboardingChecklist from './VendorOnboardingChecklist';
import ReusableAvatar from './Avatar';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VendorAssignedProjectsList from './VendorAssignedProjectsList';
import PageHeroWithImage from './shared/PageHeroWithImage';
import StatsCard from './shared/StatsCard';
import EnhancedPageBackground from './shared/EnhancedPageBackground';

interface VendorDashboardCompleteProps {
  canApply: boolean;
  canViewAll: boolean;
}

export default function VendorDashboardComplete({ canApply, canViewAll }: VendorDashboardCompleteProps) {
  const { user, isSubscribed } = useAuth();
  const { applications, refetch: refetchApplications } = useVendorApplications({ userId: user?.id });
  const { stats, loading, error } = useVendorDashboardStats();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // Show onboarding flow for new vendors who aren't subscribed
  if (!canApply && !isSubscribed('basic')) {
    return <VendorOnboardingFlow />;
  }

  // Show loading skeleton while fetching data
  if (loading) {
    return <VendorDashboardSkeleton />;
  }

  // Use real stats from the hook
  const vendorStats = {
    totalApplications: stats.totalApplications,
    activeProjects: stats.assignedProjects,
    completedProjects: stats.completedProjects,
    avgResponseTime: stats.responseTime,
    rating: stats.rating,
    profileCompletion: stats.profileCompletion
  };

  const mockAvailableProjects = [
    {
      id: 1,
      title: 'HVAC System Maintenance',
      property: 'Downtown Complex A',
      budget: '$5,000 - $8,000',
      deadline: '2024-03-15',
      category: 'HVAC',
      description: 'Quarterly maintenance for 24-unit HVAC system',
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
      description: 'Emergency pipe burst repair in basement level',
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
      description: '200A electrical panel upgrade with modern safety features',
      requiresVerification: true,
      urgency: 'medium',
      location: 'West End'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      case 'medium': return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'low': return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <EnhancedPageBackground pattern="dots" gradient="mesh" intensity="subtle" showOrbs={true}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Hero Section with Image */}
        <PageHeroWithImage
          title={user?.vendor?.companyName || user?.name || 'Vendor Dashboard'}
          description="Manage your projects, applications, and business profile"
          icon={Briefcase}
          backgroundImage="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1920&q=80"
        />

        {/* Subscription Status */}
        <Card className="border-primary/20 shadow-lg" variant="colorful">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>
                    {user?.subscription?.plan ? 
                      user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1) : 
                      'Free'
                    } Plan
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {user?.subscription?.status === 'active' ? 'Active subscription' : 'Inactive subscription'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <VerifiedBadge isVerified={user?.vendor?.isVerified || false} showText />
                {!canApply && (
                  <Button size="sm" asChild>
                    <Link to="/vendor/subscription">Upgrade Plan</Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid using unified StatsCard component */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard
            title="Applications"
            value={vendorStats.totalApplications}
            icon={FileText}
            color="info"
          />
          <StatsCard
            title="Active"
            value={vendorStats.activeProjects}
            icon={Clock}
            color="warning"
          />
          <StatsCard
            title="Completed"
            value={vendorStats.completedProjects}
            icon={CheckCircle}
            color="success"
          />
          <StatsCard
            title="Rating"
            value={vendorStats.rating}
            icon={Star}
            color="primary"
          />
          <StatsCard
            title="Response"
            value={vendorStats.avgResponseTime}
            icon={TrendingUp}
            color="info"
          />
          <StatsCard
            title="Profile"
            value={`${vendorStats.profileCompletion}%`}
            icon={Award}
            color="primary"
          />
        </div>

        {/* Enhanced Quick Action Cards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
            {stats.urgentTasks > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {stats.urgentTasks} urgent task{stats.urgentTasks !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <VendorActionCard
              title="Respond to RFQ"
              description="View and bid on available projects that match your expertise."
              route="/vendor/rfq"
              icon={MessageSquare}
              count={stats.openRFQs}
              urgencyLevel={stats.openRFQs > 5 ? 'high' : stats.openRFQs > 0 ? 'medium' : 'low'}
              disabled={!canApply}
              badge={!canApply ? 'Subscription Required' : undefined}
            />
            
            <VendorActionCard
              title="Upload Document"
              description="Upload certifications, licenses, and other required documents."
              route="/vendor/documents"
              icon={Upload}
              count={stats.pendingDocuments}
              urgencyLevel={stats.pendingDocuments > 3 ? 'high' : stats.pendingDocuments > 0 ? 'medium' : 'low'}
            />
            
            <VendorActionCard
              title="View Assigned Projects"
              description="Manage your active projects and track progress milestones."
              route="/vendor/projects"
              icon={FolderOpen}
              count={stats.assignedProjects}
              urgencyLevel={stats.nextDeadline ? 'medium' : 'low'}
            />
            
            <VendorActionCard
              title="Update Profile"
              description="Complete your vendor profile to unlock more opportunities."
              route="/vendor/profile"
              icon={User}
              count={stats.profileCompletion < 100 ? Math.round((100 - stats.profileCompletion) / 10) : 0}
              urgencyLevel={stats.profileCompletion < 50 ? 'high' : stats.profileCompletion < 80 ? 'medium' : 'low'}
              badge={`${stats.profileCompletion}% complete`}
            />
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <VendorActionCard
              title="View Payments"
              description="Check payment status and invoices."
              route="/vendor/payments"
              icon={DollarSign}
              count={stats.unpaidInvoices}
              urgencyLevel={stats.unpaidInvoices > 0 ? 'high' : 'low'}
            />
            
            <VendorActionCard
              title="Payout Settings"
              description="Configure how you receive payments."
              route="/vendor/payout-settings"
              icon={CreditCard}
              urgencyLevel="low"
              badge="Setup Required"
            />
            
            <VendorActionCard
              title="Check Reports"
              description="View performance reports and analytics."
              route="/vendor/reports"
              icon={TrendingUp}
            />
            
            <VendorActionCard
              title="Manage Settings"
              description="Update preferences and notifications."
              route="/vendor/settings"
              icon={Star}
            />
          </div>
        </div>

        {/* Enhanced Dashboard Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList variant="grid" className="grid w-full grid-cols-4">
            <TabsTrigger variant="grid" value="overview">Overview</TabsTrigger>
            <TabsTrigger variant="grid" value="assigned">Assigned Projects</TabsTrigger>
            <TabsTrigger variant="grid" value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger variant="grid" value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Vendor Onboarding Checklist */}
            <VendorOnboardingChecklist />

            {/* Profile Completion Card */}
            {stats.profileCompletion < 100 && (
              <Card className="border-warning/20 bg-warning/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    Complete Your Profile
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    A complete profile helps you get more project opportunities
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profile Completion</span>
                      <span>{stats.profileCompletion}%</span>
                    </div>
                    <Progress value={stats.profileCompletion} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Basic Information</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Contact Details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stats.profileCompletion >= 60 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      <span>Certifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stats.profileCompletion >= 80 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      <span>Work Portfolio</span>
                    </div>
                  </div>
                  
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md">
                    <Link to="/vendor/profile">Complete Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assigned">
            <VendorAssignedProjectsList />
          </TabsContent>

          <TabsContent value="activity">
            {/* Enhanced Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  {applications.length > 3 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/vendor/applications">View All</Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No recent activity</h3>
                    <p className="text-muted-foreground mb-4">Start by applying to available projects</p>
                    <Button asChild>
                      <Link to="/vendor/rfq">Browse Projects</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.slice(0, 3).map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{application.project_title}</h4>
                          <p className="text-sm text-muted-foreground">{application.project_type}</p>
                          {application.deadline && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Deadline: {new Date(application.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {application.budget_max && (
                            <span className="text-sm font-medium text-success">
                              ${application.budget_max.toLocaleString()}
                            </span>
                          )}
                          <Badge variant={
                            application.status === 'open' ? 'default' :
                            application.status === 'in_progress' ? 'secondary' :
                            application.status === 'completed' ? 'outline' :
                            'destructive'
                          }>
                            {application.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete your profile to unlock more opportunities
                </p>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/vendor/profile">Go to Profile Settings</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedPageBackground>
  );
}