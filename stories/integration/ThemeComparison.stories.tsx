import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { statusColors, priorityColors } from '@/utils/themeColors';

const meta = {
  title: 'Integration/Theme Comparison',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightDarkComparison: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">Component Theme Consistency</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Status Card</CardTitle>
          <CardDescription>Example vendor project card with status badges</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Badge className={statusColors.open}>Open</Badge>
            <Badge className={priorityColors.high}>High Priority</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            This card demonstrates theme-aware colors that adapt to light/dark mode.
          </p>
          <div className="flex gap-2">
            <Button variant="default">View Details</Button>
            <Button variant="outline">Submit Bid</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Status Overview</CardTitle>
          <CardDescription>Payment indicators with semantic colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Badge className={statusColors.active}>Paid</Badge>
              <p className="text-2xl font-bold text-foreground">$12,450</p>
              <p className="text-sm text-muted-foreground">Total paid</p>
            </div>
            <div className="space-y-2">
              <Badge className={statusColors.pending}>Pending</Badge>
              <p className="text-2xl font-bold text-foreground">$3,200</p>
              <p className="text-sm text-muted-foreground">Awaiting payment</p>
            </div>
            <div className="space-y-2">
              <Badge className={statusColors.cancelled}>Overdue</Badge>
              <p className="text-2xl font-bold text-foreground">$850</p>
              <p className="text-sm text-muted-foreground">Past due</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Kitchen Renovation', 'Roof Repair', 'HVAC Installation'].map((project) => (
                <div key={project} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{project}</span>
                  <Badge className={statusColors.in_progress}>In Progress</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Emergency Plumbing', priority: 'urgent' },
                { name: 'Electrical Upgrade', priority: 'high' },
                { name: 'Painting', priority: 'medium' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{item.name}</span>
                  <Badge className={priorityColors[item.priority as keyof typeof priorityColors]}>
                    {item.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};
