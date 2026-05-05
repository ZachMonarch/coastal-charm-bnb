import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Wrench, DollarSign, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SystemHealthDashboard from './SystemHealthDashboard';
import { logger } from '@/utils/logger';
import PageHero from './shared/PageHero';
import StatsCard from './shared/StatsCard';
import ColorfulIconBox from './shared/ColorfulIconBox';
import TopVendorLeaderboard from './admin/TopVendorLeaderboard';

interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalProjects: number;
  totalRevenue: number;
  activeProjects: number;
  pendingProjects: number;
  completedProjects: number;
  growthRate: number;
}

export default function AdminDashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const { data: statsData, error: statsError } = await supabase
        .rpc('get_admin_dashboard_stats');

      if (statsError) {
        logger.error('Stats RPC error:', statsError);
        const [usersResult, vendorsResult, projectsResult, propertiesResult] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('vendor_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('projects').select('id', { count: 'exact', head: true }),
          supabase.from('properties').select('id', { count: 'exact', head: true })
        ]);

        const totalProjects = projectsResult.count || 0;
        
        const { data: projectStatuses } = await supabase
          .from('projects')
          .select('status');

        const statusCounts = (projectStatuses || []).reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setStats({
          totalUsers: usersResult.count || 0,
          totalVendors: vendorsResult.count || 0,
          totalProjects,
          totalRevenue: totalProjects * 5000,
          activeProjects: statusCounts['in_progress'] || 0,
          pendingProjects: statusCounts['open'] || 0,
          completedProjects: statusCounts['completed'] || 0,
          growthRate: 12.5
        });
      } else if (statsData && statsData.length > 0) {
        const data = statsData[0];
        const totalRevenue = (data.total_projects || 0) * 5000;
        const growthRate = 12.5;

        setStats({
          totalUsers: Number(data.total_users) || 0,
          totalVendors: Number(data.total_vendors) || 0,
          totalProjects: Number(data.total_projects) || 0,
          totalRevenue,
          activeProjects: Number(data.active_projects) || 0,
          pendingProjects: Number(data.pending_projects) || 0,
          completedProjects: Number(data.completed_projects) || 0,
          growthRate
        });
      }
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      
      toast({
        title: "Error",
        description: "Unable to load dashboard statistics. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <PageHero
        title="Admin Dashboard"
        description="Complete system overview and management controls"
        icon={BarChart3}
        variant="gradient"
        actions={[
          { label: 'Manage Projects', href: '/admin?tab=projects', variant: 'outline' },
          { label: 'Manage Users', href: '/admin?tab=users', variant: 'default' },
        ]}
        stats={[
          { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'info' },
          { label: 'Total Vendors', value: stats?.totalVendors || 0, icon: Wrench, color: 'success' },
          { label: 'Total Projects', value: stats?.totalProjects || 0, icon: Building2, color: 'primary' },
          { label: 'Growth Rate', value: `${stats?.growthRate || 0}%`, icon: TrendingUp, color: 'warning' },
        ]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="info"
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatsCard
          title="Total Vendors"
          value={stats?.totalVendors || 0}
          icon={Wrench}
          color="success"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          icon={Building2}
          color="primary"
          trend={{ value: 5.4, isPositive: true }}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${((stats?.totalRevenue || 0) / 1000).toFixed(1)}k`}
          icon={DollarSign}
          color="warning"
          trend={{ value: 18.3, isPositive: true }}
        />
        <StatsCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          icon={Activity}
          color="info"
        />
        <StatsCard
          title="Pending Projects"
          value={stats?.pendingProjects || 0}
          icon={TrendingUp}
          color="warning"
        />
        <StatsCard
          title="Completed Projects"
          value={stats?.completedProjects || 0}
          icon={Building2}
          color="success"
        />
        <StatsCard
          title="Growth Rate"
          value={`${stats?.growthRate || 0}%`}
          icon={TrendingUp}
          color="primary"
          trend={{ value: stats?.growthRate || 0, isPositive: true }}
        />
      </div>

      {/* Quick Actions - Enhanced with colorful cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="gradient" className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ColorfulIconBox icon={Building2} color="primary" size="md" glow />
                Project Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage all projects, assign vendors, and track progress.
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {stats?.totalProjects} Projects
                </Badge>
                <Button asChild size="sm" className="shadow-md">
                  <Link to="/admin?tab=projects">Manage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="success" className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ColorfulIconBox icon={Wrench} color="success" size="md" glow />
                Vendor Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Oversee vendor applications, verifications, and performance.
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  {stats?.totalVendors} Vendors
                </Badge>
                <Button asChild size="sm" className="shadow-md">
                  <Link to="/admin?tab=vendors">Manage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="info" className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ColorfulIconBox icon={Users} color="info" size="md" glow />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage user accounts, roles, and permissions.
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
                  {stats?.totalUsers} Users
                </Badge>
                <Button asChild size="sm" className="shadow-md">
                  <Link to="/admin?tab=users">Manage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health Dashboard */}
      <SystemHealthDashboard />
    </div>
  );
}
