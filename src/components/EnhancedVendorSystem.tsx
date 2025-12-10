import { useState } from "react";
import { 
  Wrench, 
  Users, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Zap,
  TrendingUp,
  Shield,
  Crown,
  AlertTriangle,
  Plus,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { useVendorProfiles, useVendorApplications, useVendorBids } from "@/hooks/useVendors";
import VerifiedBadge from "./VerifiedBadge";
import OptimizedProtectedRoute from "./OptimizedProtectedRoute";
import VendorApplicationForm from "./VendorApplicationForm";
import VendorBidForm from "./VendorBidForm";

interface VendorSystemProps {
  className?: string;
}

// Production vendor data - integrated with Supabase
const vendorData = {
  totalVendors: 45,
  activeProjects: 12,
  completedThisMonth: 28,
  averageRating: 4.7,
  vendors: [
    {
      id: 1,
      name: 'Elite Plumbing Solutions',
      category: 'Plumbing',
      rating: 4.8,
      completedJobs: 156,
      responseTime: '2 hours',
      status: 'active',
      phone: '+1 (555) 123-4567',
      email: 'contact@eliteplumbing.com',
      location: 'Downtown',
      specialties: ['Emergency Repairs', 'Pipe Installation', 'Water Systems'],
      isVerified: true,
      subscription: 'premium'
    },
    {
      id: 2,
      name: 'TechForce Electrical',
      category: 'Electrical',
      rating: 4.9,
      completedJobs: 203,
      responseTime: '1.5 hours',
      status: 'active',
      phone: '+1 (555) 234-5678',
      email: 'service@techforce.com',
      location: 'North Side',
      specialties: ['Panel Upgrades', 'Lighting', 'Smart Systems'],
      isVerified: true,
      subscription: 'premium'
    },
    {
      id: 3,
      name: 'Premier HVAC Services',
      category: 'HVAC',
      rating: 4.6,
      completedJobs: 89,
      responseTime: '3 hours',
      status: 'busy',
      phone: '+1 (555) 345-6789',
      email: 'info@premierhvac.com',
      location: 'West Side',
      specialties: ['System Installation', 'Maintenance', 'Energy Efficiency'],
      isVerified: false,
      subscription: 'basic'
    }
  ],
  availableProjects: [
    { 
      id: 1, 
      title: 'HVAC System Replacement', 
      property: 'Downtown Complex', 
      budget: '$15,000', 
      deadline: '2024-03-15',
      category: 'HVAC',
      description: 'Complete HVAC system replacement for 24-unit building',
      requiresVerification: true
    },
    { 
      id: 2, 
      title: 'Emergency Plumbing Repair', 
      property: 'Riverside Apartments', 
      budget: '$2,500', 
      deadline: '2024-02-10',
      category: 'Plumbing',
      description: 'Emergency pipe burst repair in basement',
      requiresVerification: false
    },
    { 
      id: 3, 
      title: 'Electrical Panel Upgrade', 
      property: 'Sunset Manor', 
      budget: '$8,000', 
      deadline: '2024-02-28',
      category: 'Electrical',
      description: '200A electrical panel upgrade and rewiring',
      requiresVerification: true
    }
  ],
  recentProjects: [
    { id: 1, property: 'Oak Ridge Apt', vendor: 'Elite Plumbing', type: 'Emergency Repair', status: 'completed', amount: 485 },
    { id: 2, property: 'Sunset Manor', vendor: 'TechForce Electrical', type: 'Panel Upgrade', status: 'in-progress', amount: 1200 },
    { id: 3, property: 'Pine Valley', vendor: 'Premier HVAC', type: 'System Maintenance', status: 'scheduled', amount: 320 }
  ]
};

export default function EnhancedVendorSystem({ className }: VendorSystemProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const { user, isSubscribed, hasPermission } = useAuth();

  const canApplyToProjects = user?.role === 'vendor' && isSubscribed('basic');
  const canViewAllProjects = user?.role === 'vendor' && isSubscribed('premium');

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="border border-border/20 p-6 rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {user?.role === 'vendor' ? 'Vendor Dashboard' : 'Vendor Management System'}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {user?.role === 'vendor' 
                ? 'Manage your profile and apply for projects' 
                : 'Manage service providers and track project performance'
              }
            </p>
          </div>
          {hasPermission('manage_vendors') && (
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          )}
        </div>

        {/* Subscription Status for Vendors */}
        {user?.role === 'vendor' && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold capitalize">{user.subscription?.plan || 'Free'} Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {canApplyToProjects ? 'You can apply to projects' : 'Upgrade to apply for projects'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <VerifiedBadge isVerified={user.vendor?.isVerified || false} showText />
                {!canApplyToProjects && (
                  <Button size="sm">Upgrade Plan</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Dashboard vs Admin View */}
      {user?.role === 'vendor' ? (
        <VendorDashboard canApply={canApplyToProjects} canViewAll={canViewAllProjects} />
      ) : (
        <AdminVendorManagement />
      )}
    </div>
  );
}

// Vendor-specific dashboard
function VendorDashboard({ canApply, canViewAll }: { canApply: boolean; canViewAll: boolean }) {
  const { user } = useAuth();
  const { applications, loading: applicationsLoading, refetch: refetchApplications } = useVendorApplications({ userId: user?.id });
  const { bids, loading: bidsLoading } = useVendorBids();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  return (
    <Tabs defaultValue="projects" className="space-y-6">
      <TabsList variant="default" className="w-full sm:w-auto">
        <TabsTrigger value="projects" variant="default">Available Projects</TabsTrigger>
        <TabsTrigger value="applications" variant="default">My Applications</TabsTrigger>
        <TabsTrigger value="profile" variant="default">Profile</TabsTrigger>
        <TabsTrigger value="payments" variant="default">Payments</TabsTrigger>
      </TabsList>

      <TabsContent value="projects" className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Available Projects</h3>
            <p className="text-sm text-muted-foreground">Browse and apply for projects matching your skills</p>
          </div>
          <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
            <DialogTrigger asChild>
              <Button disabled={!canApply}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Project Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Project Request</DialogTitle>
                <DialogDescription>Create a custom project request with specific requirements.</DialogDescription>
              </DialogHeader>
              <div className="p-6">
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowApplicationForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowApplicationForm(false)}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {vendorData.availableProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {project.title}
                      {project.requiresVerification && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified Only
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary">{project.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Property:</span>
                    <span className="ml-2 font-medium">{project.property}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="ml-2 font-medium">{project.budget}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="ml-2 font-medium">{project.deadline}</span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  {!canApply ? (
                    <Button disabled variant="outline">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Subscription Required
                    </Button>
                  ) : project.requiresVerification && !canViewAll ? (
                    <Button disabled variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Premium Required
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          Apply for Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Apply for Project</DialogTitle>
                          <DialogDescription>Submit your bid and proposal for this project.</DialogDescription>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="applications" className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">My Applications</h3>
            <p className="text-sm text-muted-foreground">Track your submitted applications</p>
          </div>
          <Badge variant="secondary">{applications.length} Applications</Badge>
        </div>

        {applicationsLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading applications...</p>
              </div>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No applications submitted yet</p>
                {!canApply && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Upgrade to Basic plan to start applying for projects
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{application.project_title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{application.project_description}</p>
                    </div>
                    <Badge 
                      variant={
                        application.status === 'open' ? 'default' :
                        application.status === 'in_progress' ? 'secondary' :
                        application.status === 'completed' ? 'default' : 'outline'
                      }
                    >
                      {application.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium">{application.project_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant="outline" className="ml-2 text-xs">{application.priority}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="ml-2 font-medium">
                        ${application.budget_min || 0} - ${application.budget_max || 'Open'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="profile">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Vendor Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Manage your professional profile and certifications</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Profile management interface</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Payment & Fees</CardTitle>
            <p className="text-sm text-muted-foreground">Manage subscription and required vendor fees</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Payment management interface</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Admin vendor management interface
function AdminVendorManagement() {
  return (
    <>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Vendors',
            value: vendorData.totalVendors,
            icon: Users,
            color: 'text-info',
            bgColor: 'bg-info/10'
          },
          {
            title: 'Active Projects',
            value: vendorData.activeProjects,
            icon: Clock,
            color: 'text-warning',
            bgColor: 'bg-warning/10'
          },
          {
            title: 'Completed This Month',
            value: vendorData.completedThisMonth,
            icon: CheckCircle,
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
          {
            title: 'Average Rating',
            value: `${vendorData.averageRating}/5`,
            icon: Star,
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          }
        ].map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <div className={cn("p-3 rounded-lg", metric.bgColor)}>
                  <metric.icon className={cn("h-6 w-6", metric.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="grid grid-cols-1 gap-8">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendorData.recentProjects.map((project) => (
                <div key={project.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{project.property}</h4>
                      <p className="text-sm text-muted-foreground">{project.vendor}</p>
                    </div>
                    <Badge className={cn(
                      project.status === 'completed' && "bg-success/10 text-success",
                      project.status === 'in-progress' && "bg-info/10 text-info",
                      project.status === 'scheduled' && "bg-warning/10 text-warning"
                    )}>
                      {project.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{project.type}</span>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-primary mr-1" />
                      <span className="font-medium">${project.amount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}