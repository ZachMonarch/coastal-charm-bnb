import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, DollarSign, Users, TrendingUp, Calendar, AlertCircle } from "lucide-react";

const meta: Meta = {
  title: "Templates/Dashboard Page",
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const PropertyManagerDashboard: Story = {
  render: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Property Manager Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, John. Here's your property overview.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">+2</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$48,250</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">86</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">98%</span> occupancy rate
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: "400ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Satisfaction score
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activity */}
              <Card className="animate-fade-in" style={{ animationDelay: "500ms" }}>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your properties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { icon: Calendar, title: "New maintenance request", property: "Downtown Loft", time: "2 hours ago", status: "pending" },
                      { icon: Users, title: "Application received", property: "Suburban Home", time: "5 hours ago", status: "new" },
                      { icon: DollarSign, title: "Payment received", property: "Studio Apartment", time: "1 day ago", status: "completed" },
                      { icon: AlertCircle, title: "Lease expiring soon", property: "Garden Apartment", time: "2 days ago", status: "warning" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <activity.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.property}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={activity.status === "completed" ? "default" : activity.status === "warning" ? "destructive" : "secondary"}>
                            {activity.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Properties Overview */}
              <Card className="animate-fade-in" style={{ animationDelay: "600ms" }}>
                <CardHeader>
                  <CardTitle>Top Performing Properties</CardTitle>
                  <CardDescription>Ranked by revenue and occupancy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Luxury Downtown Loft", revenue: 12500, occupancy: 100 },
                      { name: "Executive Penthouse", revenue: 9800, occupancy: 100 },
                      { name: "Spacious Family Home", revenue: 8400, occupancy: 95 },
                      { name: "Modern Studio Complex", revenue: 7200, occupancy: 92 },
                    ].map((property, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{property.name}</p>
                            <p className="text-sm text-muted-foreground">${property.revenue}/mo</p>
                          </div>
                          <Badge variant="outline">{property.occupancy}% occupied</Badge>
                        </div>
                        <Progress value={property.occupancy} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="animate-fade-in" style={{ animationDelay: "700ms" }}>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <Building2 className="mr-2 h-4 w-4" />
                    Add New Property
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Review Applications
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Process Payments
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Inspection
                  </Button>
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card className="animate-fade-in" style={{ animationDelay: "800ms" }}>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>This week's schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { task: "Property inspection", property: "Downtown Loft", date: "Today" },
                      { task: "Lease signing", property: "Studio Apt", date: "Tomorrow" },
                      { task: "Maintenance follow-up", property: "Family Home", date: "Jan 17" },
                      { task: "Rent collection", property: "All Properties", date: "Jan 20" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.task}</p>
                          <p className="text-xs text-muted-foreground">{item.property}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="animate-fade-in" style={{ animationDelay: "900ms" }}>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                      <p className="text-sm">3 maintenance requests require attention</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                      <p className="text-sm">2 leases expiring this month</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                      <p className="text-sm">5 new applications to review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  ),
};

export const MobileView: Story = {
  ...PropertyManagerDashboard,
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <PropertyManagerDashboard.render />
    </div>
  ),
};
