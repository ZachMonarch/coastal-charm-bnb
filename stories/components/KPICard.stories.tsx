import type { Meta, StoryObj } from '@storybook/react';
import KPICard from '@/components/ui/KPICard';
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';

const meta = {
  title: 'Components/UI/KPICard',
  component: KPICard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 w-[280px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'The label for the KPI',
    },
    value: {
      control: 'text',
      description: 'The value to display',
    },
  },
} satisfies Meta<typeof KPICard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Earnings: Story = {
  args: {
    label: 'Earnings',
    value: '$101,490',
    icon: <DollarSign className="w-5 h-5" />,
    trend: {
      value: 12.5,
      direction: 'up',
    },
  },
};

export const Reservations: Story = {
  args: {
    label: 'Reservations',
    value: '1,490',
    icon: <Calendar className="w-5 h-5" />,
  },
};

export const NewCustomers: Story = {
  args: {
    label: 'New Customers',
    value: '291',
    icon: <Users className="w-5 h-5" />,
    trend: {
      value: 8.2,
      direction: 'up',
    },
  },
};

export const WithNegativeTrend: Story = {
  args: {
    label: 'Cancellations',
    value: '42',
    icon: <TrendingUp className="w-5 h-5" />,
    trend: {
      value: 3.1,
      direction: 'down',
    },
  },
};

export const WithoutIcon: Story = {
  args: {
    label: 'Check-ins Today',
    value: '15',
  },
};

export const LargeValue: Story = {
  args: {
    label: 'Total Revenue',
    value: '$2,450,890',
    icon: <DollarSign className="w-5 h-5" />,
    trend: {
      value: 24.8,
      direction: 'up',
    },
  },
};
