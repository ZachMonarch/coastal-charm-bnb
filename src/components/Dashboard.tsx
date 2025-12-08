import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Activity,
  ChevronRight,
  Plus,
  FileText,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getIconColor } from '@/utils/themeColors';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 12,
    tenants: 45,
    revenue: 28500,
    occupancy: 92
  });

  const quickActions = [
    { 
      title: "Add Property", 
      description: "List a new property",
      icon: Plus, 
      href: "/dashboard/properties/new",
      color: getIconColor('info') 
    },
    { 
      title: "Tenant Management", 
      description: "Manage current tenants",
      icon: Users, 
      href: "/dashboard/tenants",
      color: getIconColor('success') 
    },
    { 
      title: "Financial Reports", 
      description: "View revenue analytics",
      icon: BarChart3, 
      href: "/dashboard/reports",
      color: getIconColor('primary') 
    },
    { 
      title: "Settings", 
      description: "Account preferences",
      icon: Settings, 
      href: "/dashboard/settings",
      color: getIconColor('muted') 
    },
  ];

  const recentActivities = [
    { id: 1, action: "New tenant signed lease", property: "Luxury Downtown Apt", time: "2 hours ago" },
    { id: 2, action: "Maintenance request completed", property: "Garden View Suite", time: "4 hours ago" },
    { id: 3, action: "Rent payment received", property: "Modern Loft", time: "1 day ago" },
    { id: 4, action: "Property inspection scheduled", property: "Family Townhouse", time: "2 days ago" },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6 space-y-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.name || user?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your properties today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.properties}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.tenants}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +5 from last month
              </p>
            </CardContent>
          </Card>

          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${stats.revenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.occupancy}%</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +3% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your properties and tenants efficiently
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.href}>
                    <Card className="neumorphic-inset hover:neumorphic-card transition-all duration-300 group cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={cn("p-2 rounded-xl neumorphic-card", action.color)}>
                              <action.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{action.title}</h4>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 neumorphic-inset rounded-xl">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.property}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Role-specific content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="neumorphic-card p-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>Property Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Downtown Properties</span>
                      <Badge variant="secondary">95% Occupied</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Suburban Properties</span>
                      <Badge variant="secondary">88% Occupied</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Luxury Properties</span>
                      <Badge variant="secondary">92% Occupied</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Property Inspection</p>
                        <p className="text-xs text-muted-foreground">Tomorrow at 10:00 AM</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Lease Renewal Due</p>
                        <p className="text-xs text-muted-foreground">In 3 days</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Tenant Meeting</p>
                        <p className="text-xs text-muted-foreground">Next week</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="mt-6">
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Property Overview</CardTitle>
                <CardDescription>
                  Quick view of your property portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Manage Properties</h3>
                  <p className="text-muted-foreground mb-4">
                    View detailed analytics and manage your property portfolio
                  </p>
                  <Button asChild>
                    <Link to="/dashboard/properties">
                      View All Properties
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Track your revenue and expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    Comprehensive financial analytics and reporting
                  </p>
                  <Button asChild>
                    <Link to="/dashboard/reports">
                      View Reports
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;