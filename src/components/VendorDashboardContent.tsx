import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Shield, Calendar, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useVendorApplications, useVendorBids } from '@/hooks/useVendors';
import VerifiedBadge from './VerifiedBadge';

interface VendorDashboardContentProps {
  canApply: boolean;
  canViewAll: boolean;
}

export default function VendorDashboardContent({ canApply, canViewAll }: VendorDashboardContentProps) {
  const { user } = useAuth();
  const { applications, loading: applicationsLoading } = useVendorApplications({ userId: user?.id });
  const { bids, loading: bidsLoading } = useVendorBids();

  const mockProjects = [
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
    }
  ];

  return (
    <Tabs defaultValue="projects" className="space-y-6">
      <TabsList variant="default" className="w-full sm:w-auto">
        <TabsTrigger value="projects" variant="default">Available Projects</TabsTrigger>
        <TabsTrigger value="applications" variant="default">My Applications</TabsTrigger>
        <TabsTrigger value="profile" variant="default">Profile</TabsTrigger>
        <TabsTrigger value="payments" variant="default">Payments</TabsTrigger>
      </TabsList>

      <TabsContent value="projects" className="space-y-6">
        <div className="grid gap-6">
          {mockProjects.map((project) => (
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
                    <Button>
                      Apply for Project
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="applications">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>My Project Applications</CardTitle>
            <p className="text-sm text-muted-foreground">Track your submitted applications</p>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No applications submitted yet</p>
                {!canApply && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Upgrade to Basic plan to start applying for projects
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{application.project_title}</h3>
                        <p className="text-sm text-muted-foreground">{application.project_description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span>Type: {application.project_type}</span>
                          <span>Priority: {application.priority}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={application.status === 'accepted' ? 'default' : 'secondary'}
                        className={
                          application.status === 'accepted' ? 'bg-success/10 text-success border-success/30' :
                          application.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/30' : ''
                        }
                      >
                        {application.status}
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
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Vendor Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Manage your professional profile and certifications</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold capitalize">{user?.subscription?.plan || 'Free'} Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.subscription?.status === 'active' ? 'Active subscription' : 'Inactive subscription'}
                  </p>
                </div>
              </div>
              <VerifiedBadge isVerified={user?.vendor?.isVerified || false} showText />
            </div>

            {user?.vendor?.specialties && (
              <div>
                <h4 className="font-medium mb-3">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {user.vendor.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary">{specialty}</Badge>
                  ))}
                </div>
              </div>
            )}

            {user?.vendor?.certifications && (
              <div>
                <h4 className="font-medium mb-3">Certifications</h4>
                <div className="space-y-2">
                  {user.vendor.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <Button className="mt-4" variant="outline">
                View Payment Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}