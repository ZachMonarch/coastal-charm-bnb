import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "success", "warning", "error", "info", "muted", "gold", "teal"],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const SemanticVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Semantic Status Badges</h3>
      <div className="flex flex-wrap gap-4">
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="muted">Muted</Badge>
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mt-6">Brand Variants</h3>
      <div className="flex flex-wrap gap-4">
        <Badge variant="gold">Gold Premium</Badge>
        <Badge variant="teal">Teal Accent</Badge>
      </div>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">General Statuses</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="draft" />
          <StatusBadge status="pending" />
          <StatusBadge status="open" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="completed" />
          <StatusBadge status="approved" />
          <StatusBadge status="rejected" />
          <StatusBadge status="cancelled" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Payment & Verification</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="paid" />
          <StatusBadge status="unpaid" />
          <StatusBadge status="partial" />
          <StatusBadge status="verified" />
          <StatusBadge status="unverified" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Priority Levels</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="low" />
          <StatusBadge status="medium" />
          <StatusBadge status="high" />
          <StatusBadge status="urgent" />
          <StatusBadge status="critical" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">With Icons</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="completed" showIcon />
          <StatusBadge status="pending" showIcon />
          <StatusBadge status="urgent" showIcon />
        </div>
      </div>
    </div>
  ),
};

export const PropertyStatus: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status Examples:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Available</Badge>
        <Badge variant="warning">Pending</Badge>
        <Badge variant="outline">Under Review</Badge>
        <Badge variant="success">Approved</Badge>
        <Badge variant="error">Rejected</Badge>
        <Badge variant="info">In Progress</Badge>
        <Badge variant="gold">Verified</Badge>
      </div>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg space-y-2 card-hover-lift">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Downtown Apartment</h3>
          <Badge variant="gold">Featured</Badge>
        </div>
        <p className="text-sm text-muted-foreground">2 bed • 2 bath • $2,500/mo</p>
        <div className="flex gap-2">
          <Badge variant="outline">Pet Friendly</Badge>
          <Badge variant="outline">Parking</Badge>
          <Badge variant="outline">Gym</Badge>
        </div>
      </div>

      <div className="p-4 border rounded-lg space-y-2 card-hover-lift">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Maintenance Request #1234</h3>
          <StatusBadge status="in_progress" />
        </div>
        <p className="text-sm text-muted-foreground">Plumbing issue in Unit 5B</p>
        <div className="flex gap-2">
          <StatusBadge status="high" showIcon />
          <Badge variant="outline">Assigned</Badge>
        </div>
      </div>
    </div>
  ),
};
