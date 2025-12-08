import { useState } from "react";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardProps {
  className?: string;
}

// Mock data - will be replaced with Supabase data when connected
const dashboardData = {
  properties: 127,
  tenants: 342,
  revenue: 245600,
  occupancyRate: 94.2,
  maintenanceRequests: 8,
  pendingApplications: 15,
  recentActivities: [
    { id: 1, type: 'payment', message: 'Payment received from Apartment 4B', time: '2 hours ago' },
    { id: 2, type: 'maintenance', message: 'Maintenance completed at Property Oak Ridge', time: '4 hours ago' },
    { id: 3, type: 'application', message: 'New tenant application submitted', time: '6 hours ago' },
  ]
};

export default function PropertyManagementDashboard({ className }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="neumorphic-card p-8 rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="neumorphic-inset p-3 rounded-full">
                <Zap className="h-8 w-8 text-primary animate-pulse-glow" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Property Management Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">Comprehensive overview of your property portfolio</p>
          </div>
          <Button className="btn-primary tech-glow">
            <Building2 className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Properties',
            value: dashboardData.properties,
            icon: Building2,
            color: 'text-info',
            bgColor: 'bg-info/10'
          },
          {
            title: 'Active Tenants',
            value: dashboardData.tenants,
            icon: Users,
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
          {
            title: 'Monthly Revenue',
            value: `$${dashboardData.revenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          {
            title: 'Occupancy Rate',
            value: `${dashboardData.occupancyRate}%`,
            icon: TrendingUp,
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          }
        ].map((metric, index) => (
          <div key={index} className="neumorphic-card p-6 rounded-3xl floating-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-2">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
              <div className={cn("neumorphic-inset p-3 rounded-2xl", metric.bgColor)}>
                <metric.icon className={cn("h-6 w-6", metric.color, "group-hover:animate-pulse")} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Maintenance Requests */}
        <div className="neumorphic-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="neumorphic-inset p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold">Maintenance Requests</h3>
            </div>
            <span className="neumorphic-inset px-3 py-1 rounded-full text-sm font-medium text-warning">
              {dashboardData.maintenanceRequests}
            </span>
          </div>
          <div className="space-y-4">
            {[
              { property: 'Oak Ridge Apartments', issue: 'HVAC System', priority: 'High', time: '2 days ago' },
              { property: 'Sunset Manor', issue: 'Plumbing Leak', priority: 'Medium', time: '1 day ago' },
              { property: 'Pine Valley', issue: 'Electrical', priority: 'Low', time: '3 hours ago' }
            ].map((request, index) => (
              <div key={index} className="glass-card p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{request.property}</p>
                    <p className="text-sm text-muted-foreground">{request.issue}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      request.priority === 'High' && "bg-destructive/10 text-destructive",
                      request.priority === 'Medium' && "bg-warning/10 text-warning",
                      request.priority === 'Low' && "bg-success/10 text-success"
                    )}>
                      {request.priority}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{request.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="neumorphic-card p-6 rounded-3xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="neumorphic-inset p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Recent Activities</h3>
          </div>
          <div className="space-y-4">
            {dashboardData.recentActivities.map((activity) => (
              <div key={activity.id} className="glass-card p-4 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "neumorphic-inset p-2 rounded-full",
                    activity.type === 'payment' && "bg-success/10",
                    activity.type === 'maintenance' && "bg-info/10",
                    activity.type === 'application' && "bg-primary/10"
                  )}>
                    {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-success" />}
                    {activity.type === 'maintenance' && <CheckCircle className="h-4 w-4 text-info" />}
                    {activity.type === 'application' && <Users className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="neumorphic-card p-8 rounded-3xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="neumorphic-inset p-3 rounded-full">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Portfolio Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Oak Ridge Apartments', units: 45, occupancy: 96, location: 'Downtown' },
            { name: 'Sunset Manor', units: 32, occupancy: 91, location: 'West Side' },
            { name: 'Pine Valley Complex', units: 28, occupancy: 100, location: 'North Hills' }
          ].map((property, index) => (
            <div key={index} className="glass-card p-6 rounded-2xl floating-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold">{property.name}</h4>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location}
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  property.occupancy >= 95 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                )}>
                  {property.occupancy}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Units:</span>
                  <span className="font-medium">{property.units}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Occupied:</span>
                  <span className="font-medium">{Math.floor(property.units * property.occupancy / 100)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}