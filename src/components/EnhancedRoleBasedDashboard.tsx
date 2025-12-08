import { Building2, User, Crown, Shield, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { useCapabilities } from "@/hooks/useCapabilities";
import VerifiedBadge from "./VerifiedBadge";
import { cn } from "@/lib/utils";

type MetricColor = "primary" | "success" | "warning" | "info" | "teal";

function getMetricPalette(color: MetricColor | undefined) {
  switch (color) {
    case "success":
      return {
        cardAccent: "border-success/50 hover:shadow-success/30 bg-gradient-to-br from-success/15 via-card to-success/5",
        iconBg: "bg-success/20 text-success",
        valueHover: "group-hover:text-success",
        borderLeft: "border-l-4 border-l-success",
      };
    case "warning":
      return {
        cardAccent: "border-warning/50 hover:shadow-warning/30 bg-gradient-to-br from-warning/15 via-card to-warning/5",
        iconBg: "bg-warning/20 text-warning",
        valueHover: "group-hover:text-warning",
        borderLeft: "border-l-4 border-l-warning",
      };
    case "info":
      return {
        cardAccent: "border-info/50 hover:shadow-info/30 bg-gradient-to-br from-info/15 via-card to-info/5",
        iconBg: "bg-info/20 text-info",
        valueHover: "group-hover:text-info",
        borderLeft: "border-l-4 border-l-info",
      };
    case "teal":
      return {
        cardAccent: "border-secondary/50 hover:shadow-secondary/30 bg-gradient-to-br from-secondary/15 via-card to-secondary/5",
        iconBg: "bg-secondary/20 text-secondary",
        valueHover: "group-hover:text-secondary",
        borderLeft: "border-l-4 border-l-secondary",
      };
    default:
      return {
        cardAccent: "border-primary/50 hover:shadow-primary/30 bg-gradient-to-br from-primary/15 via-card to-primary/5",
        iconBg: "bg-primary/20 text-primary",
        valueHover: "group-hover:text-primary",
        borderLeft: "border-l-4 border-l-primary",
      };
  }
}

export default function EnhancedRoleBasedDashboard() {
  const { user } = useAuth();
  const capabilities = useCapabilities();

  if (!user) return null;

  const getRoleSpecificMetrics = () => {
    switch (user.role) {
      case "admin":
        return [
          { title: "Total Users", value: "1,247", icon: User, color: "info" as MetricColor },
          { title: "Active Properties", value: "89", icon: Building2, color: "teal" as MetricColor },
          { title: "System Uptime", value: "99.9%", icon: Shield, color: "success" as MetricColor },
          { title: "Monthly Revenue", value: "$125k", icon: Crown, color: "primary" as MetricColor },
        ];
      case "vendor":
        return [
          { title: "Active Projects", value: user.vendor?.completedJobs || "0", icon: Wrench, color: "info" as MetricColor },
          { title: "Rating", value: `${user.vendor?.rating || 0}/5`, icon: User, color: "warning" as MetricColor },
          { title: "Response Time", value: user.vendor?.responseTime || "N/A", icon: Building2, color: "teal" as MetricColor },
          { title: "Subscription", value: user.subscription?.plan || "Free", icon: Crown, color: "primary" as MetricColor },
        ];
      case "property_manager":
        return [
          { title: "Properties", value: user.properties?.length || "0", icon: Building2, color: "info" as MetricColor },
          { title: "Active Tenants", value: "45", icon: User, color: "success" as MetricColor },
          { title: "Occupancy Rate", value: "94%", icon: Building2, color: "teal" as MetricColor },
          { title: "Monthly Revenue", value: "$32k", icon: Crown, color: "primary" as MetricColor },
        ];
      default:
        return [
          { title: "Profile Status", value: "Active", icon: User, color: "success" as MetricColor },
          { title: "Last Login", value: new Date(user.lastLogin).toLocaleDateString(), icon: Building2, color: "info" as MetricColor },
        ];
    }
  };

  const metrics = getRoleSpecificMetrics();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      {/* Header with Role-specific Information - Enhanced with gradient */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-subtle">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-accent/10 opacity-0 group-hover:opacity-50 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-left-5 duration-500">
                {user.role === "admin"
                  ? "Admin Dashboard"
                  : user.role === "vendor"
                  ? "Vendor Portal"
                  : user.role === "property_manager"
                  ? "Property Management"
                  : "Dashboard"}
              </h1>
              <Badge className="capitalize border-primary/30 bg-primary/5 text-primary font-semibold">
                {user.role.replace("_", " ")}
              </Badge>
              {user.vendor?.isVerified && (
                <div className="animate-in fade-in zoom-in duration-300 delay-100">
                  <VerifiedBadge isVerified={true} />
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm md:text-base flex items-center gap-2">
              <span className="font-medium text-foreground">Welcome back, {user.name}!</span>
              {user.role === "vendor" && user.subscription && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold capitalize text-primary">{user.subscription.plan}</span>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Overview - Role-specific Metrics with hover lift */}
      <div className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {metrics.map((metric, index) => {
            const palette = getMetricPalette(metric.color as MetricColor | undefined);

            return (
              <Card
                key={index}
                variant="elevated"
                className={cn(
                  "group relative overflow-hidden hover:-translate-y-2 transition-all duration-300",
                  "border-2 shadow-md",
                  palette.cardAccent,
                  palette.borderLeft,
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {metric.title}
                  </CardTitle>
                  <div
                    className={cn(
                      "p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm",
                      palette.iconBg,
                    )}
                  >
                    <metric.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div
                    className={cn(
                      "text-2xl md:text-3xl font-bold text-foreground transition-colors duration-300",
                      palette.valueHover,
                    )}
                  >
                    {metric.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role-specific Overview Content - Enhanced glass card */}
        {user.role === "vendor" && (
          <Card className="glass-card border-border/50 shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-500 overflow-hidden group">
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Subscription Status
              </CardTitle>
              <CardDescription>Your current vendor subscription and benefits</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 group/inner">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover/inner:scale-110 transition-transform duration-300">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold capitalize bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {user.subscription?.plan || "Free"} Plan
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "inline-flex h-2 w-2 rounded-full",
                          user.subscription?.status === "active" ? "bg-success animate-pulse" : "bg-muted",
                        )}
                      />
                      {user.subscription?.status === "active" ? "Active subscription" : "Inactive subscription"}
                      {user.subscription?.expiresAt && (
                        <span className="text-xs">
                          {" "}
                           b7 Expires: {new Date(user.subscription.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <VerifiedBadge isVerified={user.vendor?.isVerified || false} showText />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
