import type { Meta, StoryObj } from "@storybook/react";
import { DashboardCard } from "@/components/DashboardCard";
import { Building2, DollarSign, Users, TrendingUp } from "lucide-react";

const meta: Meta<typeof DashboardCard> = {
  title: "Components/DashboardCard",
  component: DashboardCard,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "elevated", "neumorphic", "glass", "gradient", "accent", "interactive"],
    },
    status: {
      control: "select",
      options: ["none", "success", "warning", "error", "info"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DashboardCard>;

export const Default: Story = {
  args: {
    children: <p className="text-muted-foreground">This is a default dashboard card.</p>,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DashboardCard variant="default">
        <h3 className="font-semibold mb-2">Default</h3>
        <p className="text-sm text-muted-foreground">Standard card with border.</p>
      </DashboardCard>
      <DashboardCard variant="elevated">
        <h3 className="font-semibold mb-2">Elevated</h3>
        <p className="text-sm text-muted-foreground">Card with prominent shadow.</p>
      </DashboardCard>
      <DashboardCard variant="neumorphic">
        <h3 className="font-semibold mb-2">Neumorphic</h3>
        <p className="text-sm text-muted-foreground">Soft UI design with inset shadows.</p>
      </DashboardCard>
      <DashboardCard variant="glass">
        <h3 className="font-semibold mb-2">Glass</h3>
        <p className="text-sm text-muted-foreground">Glassmorphic effect with blur.</p>
      </DashboardCard>
      <DashboardCard variant="gradient">
        <h3 className="font-semibold mb-2">Gradient</h3>
        <p className="text-sm text-muted-foreground">Subtle gradient background.</p>
      </DashboardCard>
      <DashboardCard variant="accent">
        <h3 className="font-semibold mb-2">Accent</h3>
        <p className="text-sm text-muted-foreground">Card with brand accent border.</p>
      </DashboardCard>
      <DashboardCard variant="interactive">
        <h3 className="font-semibold mb-2">Interactive</h3>
        <p className="text-sm text-muted-foreground">Card with hover effects.</p>
      </DashboardCard>
    </div>
  ),
};

export const StatusVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard status="success">
        <h3 className="font-semibold mb-2">Success</h3>
        <p className="text-sm text-muted-foreground">Task completed successfully.</p>
      </DashboardCard>
      <DashboardCard status="warning">
        <h3 className="font-semibold mb-2">Warning</h3>
        <p className="text-sm text-muted-foreground">Requires attention.</p>
      </DashboardCard>
      <DashboardCard status="error">
        <h3 className="font-semibold mb-2">Error</h3>
        <p className="text-sm text-muted-foreground">Action required.</p>
      </DashboardCard>
      <DashboardCard status="info">
        <h3 className="font-semibold mb-2">Info</h3>
        <p className="text-sm text-muted-foreground">For your information.</p>
      </DashboardCard>
    </div>
  ),
};

export const KPICards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard
        variant="default"
        label="Total Revenue"
        value="$45,231"
        icon={<DollarSign className="h-5 w-5" />}
        trend={{ value: 12.5, isPositive: true }}
      />
      <DashboardCard
        variant="default"
        label="Active Properties"
        value="24"
        icon={<Building2 className="h-5 w-5" />}
        trend={{ value: 3, isPositive: true }}
      />
      <DashboardCard
        variant="default"
        label="Total Tenants"
        value="156"
        icon={<Users className="h-5 w-5" />}
        trend={{ value: 8.2, isPositive: true }}
      />
      <DashboardCard
        variant="default"
        label="Occupancy Rate"
        value="94%"
        icon={<TrendingUp className="h-5 w-5" />}
        trend={{ value: 2.1, isPositive: false }}
      />
    </div>
  ),
};

export const WithHeaderFooter: Story = {
  args: {
    variant: "elevated",
    header: "Property Overview",
    footer: (
      <div className="flex justify-end">
        <button className="text-sm text-primary hover:underline">View Details →</button>
      </div>
    ),
    children: (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">123 Main Street, Downtown</p>
        <p className="text-2xl font-bold text-primary">$2,500/mo</p>
        <p className="text-sm">2 bed • 2 bath • 1,200 sqft</p>
      </div>
    ),
  },
};

export const DarkModeComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="p-6 rounded-lg bg-background">
        <h3 className="text-lg font-semibold mb-4">Light Mode Preview</h3>
        <div className="grid grid-cols-2 gap-4">
          <DashboardCard variant="neumorphic" status="success">
            <p className="text-sm">Neumorphic + Success</p>
          </DashboardCard>
          <DashboardCard variant="glass" status="info">
            <p className="text-sm">Glass + Info</p>
          </DashboardCard>
        </div>
      </div>
      <div className="p-6 rounded-lg bg-[hsl(0,0%,8%)] dark">
        <h3 className="text-lg font-semibold mb-4 text-white">Dark Mode Preview</h3>
        <div className="grid grid-cols-2 gap-4">
          <DashboardCard variant="neumorphic" status="success">
            <p className="text-sm text-white/80">Neumorphic + Success</p>
          </DashboardCard>
          <DashboardCard variant="glass" status="info">
            <p className="text-sm text-white/80">Glass + Info</p>
          </DashboardCard>
        </div>
      </div>
    </div>
  ),
};
