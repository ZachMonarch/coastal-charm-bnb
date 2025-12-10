import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/design-system/components/Card/Card";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Overview</h3>
          <p className="text-muted-foreground">
            Welcome to your property management dashboard. Here you can view a summary of all your properties and recent activity.
          </p>
        </Card>
      </TabsContent>
      <TabsContent value="analytics">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <p className="text-muted-foreground">
            View detailed analytics about your properties, including occupancy rates, revenue trends, and maintenance costs.
          </p>
        </Card>
      </TabsContent>
      <TabsContent value="reports">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Reports</h3>
          <p className="text-muted-foreground">
            Generate and download comprehensive reports for financial analysis, tax preparation, and performance tracking.
          </p>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const WithCards: Story = {
  render: () => (
    <Tabs defaultValue="properties" className="w-full max-w-4xl">
      <TabsList variant="grid" className="grid w-full grid-cols-3">
        <TabsTrigger variant="grid" value="properties">Properties</TabsTrigger>
        <TabsTrigger variant="grid" value="tenants">Tenants</TabsTrigger>
        <TabsTrigger variant="grid" value="maintenance">Maintenance</TabsTrigger>
      </TabsList>
      <TabsContent value="properties" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="elevated">
            <h4 className="font-semibold mb-1">Downtown Loft</h4>
            <p className="text-sm text-muted-foreground">123 Main St</p>
            <p className="text-lg font-bold text-primary mt-2">$2,500/mo</p>
          </Card>
          <Card variant="elevated">
            <h4 className="font-semibold mb-1">Suburban Home</h4>
            <p className="text-sm text-muted-foreground">456 Oak Ave</p>
            <p className="text-lg font-bold text-primary mt-2">$3,200/mo</p>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="tenants">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Tenant Management</h3>
          <p className="text-muted-foreground">View and manage all your tenants, lease agreements, and payment history.</p>
        </Card>
      </TabsContent>
      <TabsContent value="maintenance">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Maintenance Requests</h3>
          <p className="text-muted-foreground">Track open maintenance requests, assign vendors, and monitor completion status.</p>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};
