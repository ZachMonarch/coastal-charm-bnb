import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "@/design-system/components/Card/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Home, Building, Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

const meta: Meta = {
  title: "Integration/Dashboard Layouts",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const PropertyManagerDashboard: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-background">
      <div>
        <h1 className="text-3xl font-bold">Property Manager Dashboard</h1>
        <p className="text-muted-foreground">Overview of all your properties</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
              <p className="text-3xl font-bold">24</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +3 this month
              </p>
            </div>
            <Home className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
              <p className="text-3xl font-bold">92%</p>
              <Progress value={92} className="mt-2 h-2" />
            </div>
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
              <p className="text-3xl font-bold">156</p>
              <p className="text-xs text-muted-foreground mt-1">Across all properties</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              <p className="text-3xl font-bold">$48.2K</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12% vs last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card variant="elevated" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <Separator />
            
            <div className="space-y-4">
              {[
                { title: "New Application Received", property: "Downtown Loft", time: "2 hours ago", badge: "New" },
                { title: "Maintenance Request Completed", property: "Suburban Home", time: "5 hours ago", badge: "Completed" },
                { title: "Lease Renewal Pending", property: "City Center Studio", time: "1 day ago", badge: "Action Required" },
                { title: "Payment Received", property: "Lakeside Condo", time: "2 days ago", badge: "Paid" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.property} • {activity.time}</p>
                  </div>
                  <Badge variant="outline">{activity.badge}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card variant="elevated">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <Separator />
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Building className="mr-2 h-4 w-4" />
                Add New Property
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                View Applications
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="mr-2 h-4 w-4" />
                Maintenance Requests
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Properties Overview */}
      <Card variant="elevated">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Top Performing Properties</h3>
            <Button variant="ghost" size="sm">View All Properties</Button>
          </div>
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Downtown Loft", occupancy: 100, revenue: "$2,500", status: "Rented" },
              { name: "Suburban Home", occupancy: 100, revenue: "$3,200", status: "Rented" },
              { name: "City Center Studio", occupancy: 100, revenue: "$1,800", status: "Rented" },
            ].map((property, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{property.name}</p>
                    <p className="text-sm text-muted-foreground">{property.revenue}/mo</p>
                  </div>
                  <Badge>{property.status}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="font-medium">{property.occupancy}%</span>
                  </div>
                  <Progress value={property.occupancy} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  ),
};

export const VendorDashboard: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-background">
      <div>
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="text-muted-foreground">Manage your projects and earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="elevated">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
            <p className="text-3xl font-bold">8</p>
            <Badge variant="outline">2 Due This Week</Badge>
          </div>
        </Card>

        <Card variant="elevated">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Completed Jobs</p>
            <p className="text-3xl font-bold">124</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>
        </Card>

        <Card variant="elevated">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
            <p className="text-3xl font-bold">4.8</p>
            <p className="text-xs text-muted-foreground">From 89 reviews</p>
          </div>
        </Card>

        <Card variant="elevated">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">This Month Earnings</p>
            <p className="text-3xl font-bold">$12.4K</p>
            <Badge className="bg-green-500">+$2.1K Pending</Badge>
          </div>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Projects</h3>
            <Separator />

            <div className="space-y-3">
              {[
                { title: "Plumbing Repair - Unit 5B", property: "Downtown Loft", progress: 75, dueDate: "Jan 15" },
                { title: "HVAC Maintenance", property: "Suburban Home", progress: 40, dueDate: "Jan 18" },
                { title: "Electrical Inspection", property: "City Center", progress: 90, dueDate: "Jan 12" },
              ].map((project, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{project.title}</p>
                      <p className="text-xs text-muted-foreground">{project.property}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Due {project.dueDate}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card variant="elevated">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Opportunities</h3>
            <Separator />

            <div className="space-y-3">
              {[
                { title: "Kitchen Renovation", property: "Lakeside Condo", budget: "$8,500", bids: 3 },
                { title: "Bathroom Remodel", property: "Mountain View", budget: "$6,200", bids: 5 },
                { title: "Flooring Replacement", property: "Park Plaza", budget: "$4,800", bids: 2 },
              ].map((opportunity, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{opportunity.title}</p>
                      <p className="text-xs text-muted-foreground">{opportunity.property}</p>
                    </div>
                    <Badge className="bg-primary">{opportunity.budget}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{opportunity.bids} bids submitted</p>
                    <Button size="sm" variant="outline">Submit Bid</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  ),
};
