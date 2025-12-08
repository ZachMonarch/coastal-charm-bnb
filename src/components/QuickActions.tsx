import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCapabilities } from "@/hooks/useCapabilities";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Users, Wrench, Building2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionColor = "primary" | "info" | "success" | "teal" | "warning";

const actionColorStyles: Record<ActionColor, { iconBg: string; cardHover: string; textHover: string }> = {
  primary: {
    iconBg: "bg-primary/10 text-primary group-hover/btn:from-primary/20 group-hover/btn:to-primary/15",
    cardHover: "hover:border-primary/40 hover:shadow-primary/20",
    textHover: "group-hover/btn:text-primary",
  },
  success: {
    iconBg: "bg-success/10 text-success group-hover/btn:from-success/20 group-hover/btn:to-success/15",
    cardHover: "hover:border-success/40 hover:shadow-success/20",
    textHover: "group-hover/btn:text-success",
  },
  info: {
    iconBg: "bg-info/10 text-info group-hover/btn:from-info/20 group-hover/btn:to-info/15",
    cardHover: "hover:border-info/40 hover:shadow-info/20",
    textHover: "group-hover/btn:text-info",
  },
  teal: {
    iconBg: "bg-teal/10 text-teal-foreground group-hover/btn:from-teal/20 group-hover/btn:to-teal/15",
    cardHover: "hover:border-teal/40 hover:shadow-teal/20",
    textHover: "group-hover/btn:text-teal-foreground",
  },
  warning: {
    iconBg: "bg-warning/10 text-warning group-hover/btn:from-warning/20 group-hover/btn:to-warning/15",
    cardHover: "hover:border-warning/40 hover:shadow-warning/20",
    textHover: "group-hover/btn:text-warning",
  },
};

/**
 * Role-based quick actions component using capability system
 * Demonstrates proper usage of useCapabilities hook
 */
export default function QuickActions() {
  const capabilities = useCapabilities();
  const navigate = useNavigate();

  const actions = [
    {
      title: "Create Project",
      description: "Start a new property project",
      icon: Plus,
      onClick: () => navigate("/dashboard/projects"),
      show: capabilities.canManageProjects,
      variant: "default" as const,
      color: "success" as ActionColor,
    },
    {
      title: "Manage Vendors",
      description: "View and manage vendors",
      icon: Wrench,
      onClick: () => navigate("/admin?tab=vendors"),
      show: capabilities.canManageVendors,
      variant: "outline" as const,
      color: "info" as ActionColor,
    },
    {
      title: "User Management",
      description: "Manage system users",
      icon: Users,
      onClick: () => navigate("/admin?tab=users"),
      show: capabilities.canManageUsers,
      variant: "outline" as const,
      color: "teal" as ActionColor,
    },
    {
      title: "Submit Bid",
      description: "Bid on available projects",
      icon: FileText,
      onClick: () => navigate("/vendor/applications"),
      show: capabilities.canBidOnProjects,
      variant: "default" as const,
      color: "info" as ActionColor,
    },
    {
      title: "View Properties",
      description: "Browse available properties",
      icon: Building2,
      onClick: () => navigate("/properties"),
      show: capabilities.canMakeBookings,
      variant: "outline" as const,
      color: "teal" as ActionColor,
    },
    {
      title: "Payment Management",
      description: "Manage vendor payments",
      icon: DollarSign,
      onClick: () => navigate("/admin?tab=payments"),
      show: capabilities.canManagePayments,
      variant: "outline" as const,
      color: "primary" as ActionColor,
    },
  ].filter((action) => action.show);

  if (actions.length === 0) return null;

  return (
    <Card
      variant="glass"
      className="overflow-hidden group hover:shadow-xl transition-all duration-300"
    >
      <CardHeader className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent opacity-50" />
        <CardTitle className="relative z-10 text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Quick Actions
        </CardTitle>
        <CardDescription className="relative z-10">Common tasks for your role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const palette = actionColorStyles[action.color];

            return (
              <Button
                key={action.title}
                variant={action.variant}
                className={cn(
                  "h-auto flex flex-col items-start p-5 gap-3 group/btn hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden",
                  palette.cardHover,
                )}
                onClick={action.onClick}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />

                {/* Icon with gradient background */}
                <div
                  className={cn(
                    "relative z-10 p-2 rounded-lg transition-all duration-300 bg-gradient-to-br",
                    palette.iconBg,
                  )}
                >
                  <action.icon className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" />
                </div>

                <div className="text-left relative z-10">
                  <div className={cn("font-semibold text-sm transition-colors duration-300", palette.textHover)}>
                    {action.title}
                  </div>
                  <div className="text-xs text-muted-foreground font-normal mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
