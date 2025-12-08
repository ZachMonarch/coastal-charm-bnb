import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import KPICard from "@/components/ui/KPICard";
import { User } from "@/contexts/OptimizedAuthContext";
import { useSession } from "@/providers/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import DashboardFooter from "./DashboardFooter";
import DashboardHeroWithImage from "@/components/shared/DashboardHeroWithImage";
import { LayoutDashboard, Bell, Sparkles } from "lucide-react";

interface KPI {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  color?: "primary" | "success" | "warning" | "info" | "teal";
}

interface DashboardShellProps {
  user: User;
  kpis?: KPI[];
  children: ReactNode;
  filters?: ReactNode;
  showFooter?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
}

export default function DashboardShell({
  user,
  kpis = [],
  children,
  filters,
  showFooter = true,
  heroTitle,
  heroSubtitle,
  heroImage = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80",
}: DashboardShellProps) {
  const { session } = useSession();
  const [notificationCount, setNotificationCount] = useState(0);
  
  const displayName = user?.user_metadata?.full_name || 
                      user?.email?.split('@')[0] || 
                      'User';

  // Fetch live data from Supabase using session context
  useEffect(() => {
    if (session?.user) {
      // Fetch unread notifications count
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('read', false)
        .then(({ count }) => {
          if (count !== null) setNotificationCount(count);
        });
    }
  }, [session]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-8 lg:pt-10 w-full">
        {/* Hero Section with Image */}
        <DashboardHeroWithImage
          title={heroTitle || `Welcome back, ${displayName}`}
          subtitle={heroSubtitle || "Here's what's happening with your properties today."}
          icon={LayoutDashboard}
          imageUrl={heroImage}
        >
          {notificationCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/30 w-fit">
              <Bell className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {notificationCount} new notification{notificationCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </DashboardHeroWithImage>

        {/* Filters Row */}
        {filters && (
          <section className="mb-6 p-4 rounded-xl bg-card/80 dark:bg-card/50 backdrop-blur border border-border/50">
            <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
              {filters}
            </div>
          </section>
        )}

        {/* Quick Filter Buttons (default) */}
        {!filters && (
          <section className="mb-6 flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 rounded-full"
            >
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              This Week
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-2 border-secondary/30 hover:border-secondary hover:bg-secondary/5 transition-all duration-300 rounded-full"
            >
              All Properties
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 rounded-full"
            >
              Add Vendor
            </Button>
          </section>
        )}

        {/* KPI Cards Grid with colorful borders */}
        {kpis.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {kpis.map((kpi, idx) => (
              <div 
                key={idx} 
                className="animate-in fade-in slide-in-from-bottom-5"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <KPICard {...kpi} variant="interactive" />
              </div>
            ))}
          </section>
        )}

        {/* Main Content with gradient divider */}
        <section className="mt-8">
          <div className="relative">
            {/* Gradient divider */}
            <div className="absolute -top-4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
            {children}
          </div>
        </section>
      </div>

      {/* Dashboard Footer */}
      {showFooter && <DashboardFooter />}
    </div>
  );
}
