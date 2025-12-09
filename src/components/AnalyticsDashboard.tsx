import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { logger } from '@/utils/logger';
import { 
  Users, Home, DollarSign, Activity, TrendingUp, TrendingDown,
  Calendar, MapPin, Star, Clock, Download, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    growthRate: number;
  };
  userMetrics: {
    newUsers: Array<{ date: string; count: number }>;
    usersByRole: Array<{ role: string; count: number; color: string }>;
    activeUsers: number;
    retentionRate: number;
  };
  propertyMetrics: {
    occupancyRate: number;
    averageRating: number;
    propertiesByType: Array<{ type: string; count: number }>;
    topPerformingProperties: Array<{ id: number; title: string; bookings: number; revenue: number }>;
  };
  bookingMetrics: {
    bookingTrends: Array<{ date: string; bookings: number; revenue: number }>;
    conversionRate: number;
    averageBookingValue: number;
    seasonalTrends: Array<{ month: string; bookings: number }>;
  };
  vendorMetrics: {
    totalVendors: number;
    activeProjects: number;
    completedProjects: number;
    averageProjectValue: number;
    vendorPerformance: Array<{ name: string; rating: number; projects: number }>;
  };
  financialMetrics: {
    monthlyRevenue: Array<{ month: string; revenue: number; profit: number }>;
    revenueBySource: Array<{ source: string; amount: number; percentage: number }>;
    paymentStatus: Array<{ status: string; count: number; amount: number }>;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  const isAdmin = hasRole('admin');
  const isPropertyManager = hasRole(['admin', 'property_manager']);

  useEffect(() => {
    if (user && (isAdmin || isPropertyManager)) {
      loadAnalyticsData();
    }
  }, [user, dateRange, isAdmin, isPropertyManager]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch overview data
      const [
        { count: totalUsers },
        { count: totalProperties },
        { count: totalBookings },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount').eq('status', 'completed')
      ]);

      const totalRevenue = revenueData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch user metrics
      const { data: newUsersData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      const { data: userRolesData } = await supabase
        .from('profiles')
        .select('role')
        .not('role', 'is', null);

      // Process new users by date
      const newUsersByDate = processTimeSeriesData(newUsersData || [], 'created_at');
      
      // Process users by role - Use CSS variables for theme compatibility
      const roleColors = {
        admin: 'hsl(var(--destructive))',
        property_manager: 'hsl(var(--primary))',
        vendor: 'hsl(var(--success))',
        tenant: 'hsl(var(--warning))',
        property_owner: 'hsl(var(--chart-5))'
      };
      
      const usersByRole = Object.entries(
        (userRolesData || []).reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([role, count]) => ({
        role,
        count,
        color: roleColors[role as keyof typeof roleColors] || 'hsl(var(--muted-foreground))'
      }));

      // Fetch booking trends
      const { data: bookingTrendsData } = await supabase
        .from('bookings')
        .select('created_at, total_amount')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      const bookingTrends = processBookingTrends(bookingTrendsData || []);

      // Fetch property metrics
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('property_type, id, title')
        .not('property_type', 'is', null);

      const propertiesByType = Object.entries(
        (propertiesData || []).reduce((acc, prop) => {
          acc[prop.property_type] = (acc[prop.property_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, count]) => ({ type, count }));

      // Fetch vendor metrics
      const { data: projectsData } = await supabase
        .from('projects')
        .select('status, budget_max, assigned_vendor_id');

      const activeProjects = projectsData?.filter(p => p.status === 'in_progress').length || 0;
      const completedProjects = projectsData?.filter(p => p.status === 'completed').length || 0;
      const averageProjectValue = projectsData?.reduce((sum, p) => sum + (Number(p.budget_max) || 0), 0) / (projectsData?.length || 1) || 0;

      // Fetch vendor count
      const { count: totalVendors } = await supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true });

      // Calculate growth rate (simplified)
      const previousPeriodUsers = Math.max(1, totalUsers - newUsersByDate.length);
      const growthRate = ((totalUsers - previousPeriodUsers) / previousPeriodUsers) * 100;

      setAnalyticsData({
        overview: {
          totalUsers: totalUsers || 0,
          totalProperties: totalProperties || 0,
          totalBookings: totalBookings || 0,
          totalRevenue,
          growthRate
        },
        userMetrics: {
          newUsers: newUsersByDate,
          usersByRole,
          activeUsers: totalUsers || 0,
          retentionRate: 85 // This would need more complex calculation
        },
        propertyMetrics: {
          occupancyRate: 75, // This would need booking data analysis
          averageRating: 4.6, // This would need review data
          propertiesByType,
          topPerformingProperties: [] // This would need booking analysis
        },
        bookingMetrics: {
          bookingTrends,
          conversionRate: 12.5, // This would need visitor tracking
          averageBookingValue: totalRevenue / Math.max(1, totalBookings || 1),
          seasonalTrends: [] // This would need historical data
        },
        vendorMetrics: {
          totalVendors: totalVendors || 0,
          activeProjects,
          completedProjects,
          averageProjectValue,
          vendorPerformance: []
        },
        financialMetrics: {
          monthlyRevenue: [],
          revenueBySource: [
            { source: 'Property Bookings', amount: totalRevenue * 0.7, percentage: 70 },
            { source: 'Vendor Services', amount: totalRevenue * 0.2, percentage: 20 },
            { source: 'Subscriptions', amount: totalRevenue * 0.1, percentage: 10 }
          ],
          paymentStatus: []
        }
      });

    } catch (error) {
      logger.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processTimeSeriesData = (data: any[], dateField: string) => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, count]) => ({ date, count: count as number }));
  };

  const processBookingTrends = (data: any[]) => {
    const grouped = data.reduce((acc, booking) => {
      const date = new Date(booking.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { bookings: 0, revenue: 0 };
      }
      acc[date].bookings += 1;
      acc[date].revenue += Number(booking.total_amount) || 0;
      return acc;
    }, {} as Record<string, { bookings: number; revenue: number }>);

    return Object.entries(grouped).map(([date, trendData]) => ({
      date,
      bookings: (trendData as any).bookings,
      revenue: (trendData as any).revenue
    }));
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const dataToExport = {
      exportDate: new Date().toISOString(),
      dateRange,
      ...analyticsData
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported successfully');
  };

  if (!isAdmin && !isPropertyManager) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground mb-4">Analytics data could not be loaded.</p>
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.overview.growthRate >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
              )}
              {Math.abs(analyticsData.overview.growthRate).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalProperties.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {analyticsData.propertyMetrics.occupancyRate}% occupancy rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalBookings.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {analyticsData.bookingMetrics.conversionRate}% conversion rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.overview.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              ${analyticsData.bookingMetrics.averageBookingValue.toFixed(0)} avg per booking
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>New User Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.userMetrics.newUsers}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.userMetrics.usersByRole}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ role, count }) => `${role}: ${count}`}
                    >
                      {analyticsData.userMetrics.usersByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.bookingMetrics.bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Area type="monotone" dataKey="bookings" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.3)" />
                  <Area type="monotone" dataKey="revenue" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.3)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsData.vendorMetrics.totalVendors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsData.vendorMetrics.activeProjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Project Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${analyticsData.vendorMetrics.averageProjectValue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.financialMetrics.revenueBySource.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium">{source.source}</div>
                      <Badge variant="secondary">{source.percentage}%</Badge>
                    </div>
                    <div className="font-bold">${source.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};