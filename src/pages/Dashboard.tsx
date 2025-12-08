import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import DashboardShell from "@/components/layout/DashboardShell";
import EnhancedRoleBasedDashboard from "@/components/EnhancedRoleBasedDashboard";
import QuickActions from "@/components/QuickActions";
import LoadingSpinner from "@/components/LoadingSpinner";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { hasRole, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect vendors to their dedicated dashboard
    if (!isLoading && hasRole('vendor')) {
      navigate('/vendor/dashboard', { replace: true });
    }
  }, [hasRole, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoadingSpinner />;
  }

  const kpis = [
    {
      label: "Earnings",
      value: "$101,490",
      icon: <DollarSign className="w-5 h-5" />,
      trend: { value: 12.5, direction: "up" as const },
      color: "success" as const,
    },
    {
      label: "Reservations",
      value: "1,490",
      icon: <Calendar className="w-5 h-5" />,
      color: "info" as const,
    },
    {
      label: "Check-ins",
      value: "1,490",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "teal" as const,
    },
    {
      label: "New Customers",
      value: "291",
      icon: <Users className="w-5 h-5" />,
      trend: { value: 8.2, direction: "up" as const },
      color: "primary" as const,
    },
  ];

  // Show generic dashboard for admin, property_manager, and tenant
  return (
    <DashboardShell user={user} kpis={kpis}>
      <div className="space-y-6">
        <QuickActions />
        <EnhancedRoleBasedDashboard />
      </div>
    </DashboardShell>
  );
}