import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/badge';
import { statusColors, priorityColors, paymentStatusColors } from '@/utils/themeColors';

const meta = {
  title: 'Tokens/Status Colors',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStatusBadges: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Status Badges</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(statusColors).map(([status, className]) => (
            <Badge key={status} className={className}>
              {status.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Priority Badges</h3>
        <div className="flex gap-4">
          {Object.entries(priorityColors).map(([priority, className]) => (
            <Badge key={priority} className={className}>
              {priority.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Status Badges</h3>
        <div className="flex gap-4">
          {Object.entries(paymentStatusColors).map(([status, className]) => (
            <Badge key={status} className={className}>
              {status.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const StatusBadgeVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Badge className={statusColors.draft}>Draft</Badge>
        <Badge className={statusColors.open}>Open</Badge>
        <Badge className={statusColors.in_progress}>In Progress</Badge>
        <Badge className={statusColors.completed}>Completed</Badge>
      </div>
    </div>
  ),
};

export const PriorityVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Badge className={priorityColors.low}>Low</Badge>
      <Badge className={priorityColors.medium}>Medium</Badge>
      <Badge className={priorityColors.high}>High</Badge>
      <Badge className={priorityColors.urgent}>Urgent</Badge>
    </div>
  ),
};
