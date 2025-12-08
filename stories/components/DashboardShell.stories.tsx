import type { Meta, StoryObj } from '@storybook/react';
import DashboardShell from '@/components/layout/DashboardShell';
import ChartPlaceholder from '@/components/ui/ChartPlaceholder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';

const meta = {
  title: 'Components/Layout/DashboardShell',
  component: DashboardShell,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DashboardShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser = {
  id: '1',
  email: 'admin@monarchproperty.com',
  user_metadata: {
    full_name: 'John Monarch',
  },
  created_at: new Date().toISOString(),
};

const mockKPIs = [
  {
    label: 'Earnings',
    value: '$101,490',
    icon: <DollarSign className="w-5 h-5" />,
    trend: { value: 12.5, direction: 'up' as const },
  },
  {
    label: 'Reservations',
    value: '1,490',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'Check-ins',
    value: '1,490',
    icon: <TrendingUp className="w-5 h-5" />,
    trend: { value: 8.2, direction: 'up' as const },
  },
  {
    label: 'New Customers',
    value: '291',
    icon: <Users className="w-5 h-5" />,
  },
];

export const Default: Story = {
  args: {
    user: mockUser,
    kpis: mockKPIs,
    children: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Earnings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder title="Monthly Earnings Chart" height="h-[300px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder title="Occupancy Donut Chart" height="h-[300px]" />
          </CardContent>
        </Card>
      </div>
    ),
  },
};

export const WithoutKPIs: Story = {
  args: {
    user: mockUser,
    children: (
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your dashboard content goes here. Add widgets, charts, and data visualizations.
            </p>
          </CardContent>
        </Card>
      </div>
    ),
  },
};

export const MinimalUser: Story = {
  args: {
    user: { id: '2', email: 'user@example.com', created_at: new Date().toISOString() },
    kpis: mockKPIs,
    children: (
      <div className="text-center text-muted-foreground p-8">
        <p>Dashboard content area</p>
      </div>
    ),
  },
};
